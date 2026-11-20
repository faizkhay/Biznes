import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET, PICTURE_BYTES, PICTURE_TYPES } from "./config";

/**
 * Pictures on their way to Supabase Storage. An upload is a plain form posted to a route of this
 * site (a server action takes one megabyte at most, and a picture may be three). The route reads
 * the picture, checks it, and hands it to Storage as the person signed in, with their own session:
 * the bucket's own rules then decide whether it may be kept there (supabase/migrations, part 9).
 * There is no service key.
 */

export type Picture = { file: File; type: string; ext: string };
/** Why a picture was not kept. Each has a sentence in PICTURE_SAYS. */
export type PictureProblem = "none" | "big" | "kind" | "refused" | "failed" | "origin";
export const PICTURE_SAYS: Record<PictureProblem, string> = {
  none: "Choose a picture first.",
  big: "That picture is over 3 MB. Save it smaller, or choose another.",
  kind: "That is not a JPEG, a PNG or a WebP picture.",
  refused: "That picture cannot be kept here. The folder may be full, or this is not yours to change.",
  failed: "The picture could not be kept just now. Try again in a moment.",
  origin: "That did not come from this site. Open the page again and try once more.",
};

/**
 * True when a form was posted from this site's own pages. A browser says where a form came from;
 * one that came from elsewhere is refused, as a server action's would be.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Send the browser back to a page of this site after a form, with a word for the page to say. */
export function backTo(path: string, said: Record<string, string> = {}): Response {
  const query = new URLSearchParams(said).toString();
  const [page, anchor] = path.split("#");
  return new Response(null, { status: 303, headers: { Location: `${page}${query ? `${page.includes("?") ? "&" : "?"}${query}` : ""}${anchor ? `#${anchor}` : ""}`, "Cache-Control": "private, no-store" } });
}

/** The posted form, unless it came from elsewhere or is plainly too large to hold one picture. */
export async function receiveForm(request: Request): Promise<{ form: FormData } | { problem: "origin" | "big" | "failed" }> {
  if (!sameOrigin(request)) return { problem: "origin" };
  // The picture and a few fields: nothing honest is larger than this.
  if (Number(request.headers.get("content-length") ?? 0) > PICTURE_BYTES + 200_000) return { problem: "big" };
  try {
    return { form: await request.formData() };
  } catch {
    return { problem: "failed" };
  }
}

const starts = (bytes: Uint8Array, ...with_: number[]) => with_.every((b, i) => bytes[i] === b);

/** The picture in a form, checked by its size and by its own first bytes, not by what it calls itself. */
export async function pictureFrom(form: FormData, field = "file"): Promise<{ picture: Picture } | { problem: "none" | "big" | "kind" }> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return { problem: "none" };
  if (file.size > PICTURE_BYTES) return { problem: "big" };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const type = starts(head, 0xff, 0xd8, 0xff) ? "image/jpeg" : starts(head, 0x89, 0x50, 0x4e, 0x47) ? "image/png" : starts(head, 0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50 ? "image/webp" : "";
  if (!type) return { problem: "kind" };
  return { picture: { file, type, ext: PICTURE_TYPES[type] } };
}

/** A file name the bucket accepts: a word for what it is, and a few letters that are its own. */
const fileName = (stem: string, ext: string) => `${stem}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}.${ext}`;

/** Keep a picture in a folder of the bucket, as the person the client is signed in as. Gives its path there. */
export async function keepPicture(supabase: SupabaseClient, folder: string, stem: string, picture: Picture): Promise<{ path: string } | { problem: "refused" | "failed" }> {
  const path = `${folder}/${fileName(stem, picture.ext)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, picture.file, { contentType: picture.type, cacheControl: "31536000", upsert: false });
  if (!error) return { path };
  const refused = /row-level security|Unauthorized|403|mime|exceeded|too large/i.test(`${error.message} ${(error as { statusCode?: string }).statusCode ?? ""}`);
  if (!refused) console.error(`[accounts] a picture could not be kept at ${path}: ${error.message}`);
  return { problem: refused ? "refused" : "failed" };
}

/** Take pictures out of the bucket. What cannot be removed is left: nothing depends on it. */
export async function dropPictures(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const real = paths.filter(Boolean);
  if (real.length) await supabase.storage.from(MEDIA_BUCKET).remove(real);
}
