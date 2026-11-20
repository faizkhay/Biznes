import { revalidatePath, revalidateTag } from "next/cache";
import { accountsOn, TAG_OWNED } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { backTo, dropPictures, keepPicture, pictureFrom, receiveForm } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";

/**
 * A picture for a business's page: its cover, or one more photograph. A plain form posts here
 * (src/components/account/Upload.tsx). The picture is kept in the business's own folder of the
 * bucket as the person signed in, so the bucket's rules decide whether it may be: the owner of a
 * live or pending business on a paid plan, a picture of three megabytes at most, twelve to a
 * folder. Then the page's own record is told where it is.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = `/dashboard/${id}/showcase`;
  if (!accountsOn || !UUID.test(id)) return backTo("/dashboard");
  const viewer = await getViewer();
  if (!viewer) return backTo(`/account/sign-in?next=${encodeURIComponent(page)}`);

  const received = await receiveForm(request);
  if ("problem" in received) return backTo(page, { problem: received.problem });
  const kind = received.form.get("kind") === "cover" ? "cover" : "photo";
  const read = await pictureFrom(received.form);
  if ("problem" in read) return backTo(`${page}#${kind}`, { problem: read.problem, at: kind });

  const supabase = await db();
  const { data: row } = await supabase.from("showcases").select("cover, photos").eq("business_id", id).maybeSingle();
  const photos = (row?.photos as string[] | undefined) ?? [];
  if (kind === "photo" && photos.length >= 8) return backTo(`${page}#photo`, { problem: "full", at: "photo" });

  const kept = await keepPicture(supabase, `business/${id}`, kind, read.picture);
  if ("problem" in kept) return backTo(`${page}#${kind}`, { problem: kept.problem, at: kind });

  const next = kind === "cover" ? { cover: kept.path } : { photos: [...photos, kept.path] };
  const { error } = row ? await supabase.from("showcases").update(next).eq("business_id", id) : await supabase.from("showcases").insert({ business_id: id, ...next });
  if (error) {
    // The record would not take it, so the picture is not left behind with nothing pointing to it.
    await dropPictures(supabase, [kept.path]);
    return backTo(`${page}#${kind}`, { problem: "refused", at: kind });
  }
  // A new cover takes the place of the old, which is then of no use to anyone.
  if (kind === "cover" && row?.cover) await dropPictures(supabase, [row.cover as string]);
  revalidateTag(TAG_OWNED, { expire: 0 });
  revalidatePath(page);
  return backTo(`${page}#${kind}`, { said: kind });
}
