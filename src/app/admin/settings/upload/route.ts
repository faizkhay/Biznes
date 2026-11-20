import { revalidatePath, revalidateTag } from "next/cache";
import { accountsOn, TAG_SETTINGS } from "@/lib/accounts/config";
import { backTo, dropPictures, keepPicture, pictureFrom, receiveForm } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";

/**
 * A picture for behind the page, uploaded by the superadmin. A plain form posts here. It is kept
 * in the bucket's `site` folder as the person signed in, and the bucket lets only the superadmin
 * write there. Then it is named among the site's pictures, so it can be chosen.
 */
export async function POST(request: Request) {
  const page = "/admin/settings";
  if (!accountsOn) return backTo("/admin");
  const viewer = await getViewer();
  if (!viewer) return backTo(`/account/sign-in?next=${encodeURIComponent(page)}`);
  if (viewer.role !== "superadmin") return backTo("/account");

  const received = await receiveForm(request);
  if ("problem" in received) return backTo(`${page}#pictures`, { problem: received.problem });
  const label = String(received.form.get("label") ?? "").trim().slice(0, 60);
  if (!label) return backTo(`${page}#pictures`, { problem: "label" });
  const read = await pictureFrom(received.form);
  if ("problem" in read) return backTo(`${page}#pictures`, { problem: read.problem });

  const supabase = await db();
  const kept = await keepPicture(supabase, "site", "backdrop", read.picture);
  if ("problem" in kept) return backTo(`${page}#pictures`, { problem: kept.problem });
  const { error } = await supabase.from("site_pictures").insert({ path: kept.path, label });
  if (error) {
    await dropPictures(supabase, [kept.path]);
    return backTo(`${page}#pictures`, { problem: "refused" });
  }
  revalidateTag(TAG_SETTINGS, { expire: 0 });
  revalidatePath(page);
  return backTo(`${page}#pictures`, { said: "picture" });
}
