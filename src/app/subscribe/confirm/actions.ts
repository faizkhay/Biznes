"use server";

import { revalidatePath } from "next/cache";
import { accountsOn } from "@/lib/accounts/config";
import { field, SOON, UUID, type FormState } from "@/lib/accounts/form";
import { tooMany } from "@/lib/accounts/limit";
import { publicDb } from "@/lib/accounts/server";

/**
 * Confirm an address, with the token its link carried. It runs only when the button on
 * /subscribe/confirm is pressed: a mail program that opens every link in a message before its
 * reader does must not be the one to confirm.
 */
export async function confirmAddress(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const token = field(data, "token", 40);
  if (!UUID.test(token)) return { message: "That link is not whole. Open it again from the message it came in." };
  if (await tooMany("confirm", 20)) return { message: "Too many tries from this connection. Wait a few minutes, then try again." };
  const { data: found, error } = await publicDb().rpc("confirm_subscription", { link_token: token });
  if (error?.code === "42501") console.error("[accounts] the database refused a call from the site: BIZNES_SITE_PROOF is not set, or is not the word whose hash is kept in private.site_proof (supabase/migrations, part 11).");
  if (error) return { message: "Your address could not be confirmed just now. Try again in a moment." };
  revalidatePath("/admin/subscribers");
  return found
    ? { ok: true, message: "Your address is confirmed. We will send you what you asked for when it comes out, and nothing else." }
    : { message: "That link confirms nothing now: the address has left the list, or a newer link was sent to it. Join again from the site and a new one is sent." };
}
