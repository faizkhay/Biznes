import { revalidatePath } from "next/cache";
import { accountsOn } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { tooMany } from "@/lib/accounts/limit";
import { backTo, emptyFolder, keepPicture, dropPictures, pictureFrom, receiveForm } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";

/**
 * The picture of an advertisement. A plain form posts here. It is kept in the advertisement's own
 * folder of the bucket as the person signed in: the bucket lets the owner add one only while the
 * advertisement is a draft or was not accepted, so a picture an admin has approved cannot be
 * changed for another afterwards.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; ad: string }> }) {
  const { id, ad } = await params;
  const page = `/dashboard/${id}/ads`;
  if (!accountsOn || !UUID.test(id) || !UUID.test(ad)) return backTo("/dashboard");
  const viewer = await getViewer();
  if (!viewer) return backTo(`/account/sign-in?next=${encodeURIComponent(page)}`);
  if (await tooMany("upload", 30)) return backTo(`${page}#ad-${ad}`, { problem: "busy", at: ad });

  const received = await receiveForm(request);
  if ("problem" in received) return backTo(page, { problem: received.problem, at: ad });
  const read = await pictureFrom(received.form);
  if ("problem" in read) return backTo(`${page}#ad-${ad}`, { problem: read.problem, at: ad });

  const supabase = await db();
  const { data: row } = await supabase.from("ads").select("artwork").eq("id", ad).eq("business_id", id).maybeSingle();
  if (!row) return backTo(page, { problem: "refused", at: ad });
  // What is there goes first, the old picture and anything else in the folder: it holds only a few.
  await emptyFolder(supabase, `ads/${ad}`, [row.artwork as string]);
  const kept = await keepPicture(supabase, `ads/${ad}`, "art", read.picture);
  if ("problem" in kept) return backTo(`${page}#ad-${ad}`, { problem: kept.problem, at: ad });
  const { error } = await supabase.from("ads").update({ artwork: kept.path }).eq("id", ad).eq("business_id", id);
  if (error) {
    await dropPictures(supabase, [kept.path]);
    return backTo(`${page}#ad-${ad}`, { problem: "refused", at: ad });
  }
  revalidatePath(page);
  return backTo(`${page}#ad-${ad}`, { said: "picture", at: ad });
}
