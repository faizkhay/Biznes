"use server";

import { revalidatePath } from "next/cache";
import { accountsOn } from "./config";
import { sendConfirmation } from "./email/send";
import { currentSender } from "./email/store";
import { field, SOON, UUID, type FormState } from "./form";
import { tooMany } from "./limit";
import { publicDb } from "./server";

// Joining and leaving the list of people who are sent the pocket guide and the magazine. Both go
// through functions in the database (supabase/migrations, parts 5, 11 and 14): the site never
// reads the list as a visitor, so neither answer says whether an address was on it.
//
// With no sender connected (src/lib/accounts/email/sender.ts) joining is all there is: the
// address is kept as not confirmed, because no message can ask it to confirm. With one, a message
// with a link to confirm goes to an address that is new or has not confirmed yet, once a day at
// most. The form's answer is the same whichever the address was.

/** For whoever runs the site: the database asks for a word with a visitor's writes, and did not get the right one. */
const PROOF_REFUSED = "[accounts] the database refused a call from the site: BIZNES_SITE_PROOF is not set, or is not the word whose hash is kept in private.site_proof (supabase/migrations, part 11).";

/**
 * An address the list takes: letters, digits and the few marks an address is written with. It is
 * narrower than what signs a person in, on purpose: the list is taken as a file and opened in a
 * spreadsheet, so it holds nothing a spreadsheet could read as more than an address. The database
 * asks the same (supabase/migrations, part 11).
 */
const LIST_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export async function subscribe(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const email = field(data, "email", 160).toLowerCase();
  const guide = data.get("guide") === "on";
  const magazine = data.get("magazine") === "on";
  const values = { email, guide: guide ? "on" : "", magazine: magazine ? "on" : "" };
  const asked = [guide ? "the pocket guide" : "", magazine ? "the magazine" : ""].filter(Boolean).join(" and ");
  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (field(data, "website")) return { ok: true, message: "You are on the list." };
  const errors: Record<string, string> = {};
  if (!email) errors.email = "Give your email address.";
  else if (!LIST_EMAIL.test(email)) errors.email = "That email address does not look right.";
  if (!guide && !magazine) errors.guide = "Tick at least one thing to be sent.";
  if (Object.keys(errors).length) return { errors, values };
  if (await tooMany("subscribe", 6)) return { message: "Too many tries from this connection. Wait a few minutes, then try again.", values };

  const { error } = await publicDb().rpc("subscribe", { address: email, guide, magazine });
  if (error?.hint === "subscribe_email") return { errors: { email: "That email address does not look right." }, values };
  if (error?.hint === "subscribe_busy") return { message: "Many people have joined in the last while. Try again later.", values };
  if (error?.code === "42501") console.error(PROOF_REFUSED);
  if (error) return { message: "You could not be added just now. Try again in a moment.", values };
  revalidatePath("/admin/subscribers");
  const asked_to_confirm = await askToConfirm(email);
  return {
    ok: true,
    message: asked_to_confirm
      ? `Nearly there. If ${email} is new to the list, a message is on its way to it: press the link in it to confirm the address is yours. Then we send ${asked} when it comes out, and nothing else.`
      : `You are on the list. We will send ${asked} to ${email} when it comes out, and nothing else.`,
  };
}

/**
 * Send the message that asks an address to confirm, where the site can. True when the site is
 * set up to ask: a sender is connected, the settings say who a message comes from, and the
 * database holds the hash of the site's word, without which it hands no link to anyone. Whether
 * a message went to this address in particular is not said: the answer to the visitor is the
 * same for an address that is new, one that has confirmed, and one asked earlier today.
 */
async function askToConfirm(email: string): Promise<boolean> {
  try {
    const sender = await currentSender();
    if (!sender.connected) return false;
    const { data: handed, error } = await publicDb().rpc("confirmation_for", { address: email });
    if (error) {
      if (error.code === "42501") console.error("[accounts] no link to confirm was handed over: the database holds no hash of the site's word, or BIZNES_SITE_PROOF is not that word (README, \"Setting up the project\", step 8).");
      return false;
    }
    if (!handed || typeof handed !== "object") return true;
    const h = handed as Record<string, string>;
    const outcome = await sendConfirmation(sender, email, { confirm: h.confirm, leave: h.leave, from_name: h.from_name ?? "", from_email: h.from_email ?? "", reply_to: h.reply_to ?? "", postal_address: h.postal_address ?? "" });
    if (!outcome.ok) {
      console.error(`[accounts] a message asking an address to confirm was not sent: ${outcome.why}`);
      // The address counts as never asked, unless the message may have gone after all.
      if (!outcome.unsure) await publicDb().rpc("confirmation_unsent", { link_token: h.confirm });
    }
    return true;
  } catch {
    return false;
  }
}

/** Leave the list, with the token an unsubscribe link carries. */
export async function unsubscribe(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const token = field(data, "token", 40);
  if (!UUID.test(token)) return { message: "That link is not whole. Open it again from the message it came in." };
  if (await tooMany("unsubscribe", 20)) return { message: "Too many tries from this connection. Wait a few minutes, then try again." };
  const { data: left, error } = await publicDb().rpc("unsubscribe", { leave_token: token });
  if (error?.code === "42501") console.error(PROOF_REFUSED);
  if (error) return { message: "You could not be taken off just now. Try again in a moment." };
  revalidatePath("/admin/subscribers");
  // Said either way: an address that has already left is off the list too.
  return { ok: true, message: left ? "You are off the list. Nothing more will be sent to you." : "You are not on the list: that link has already been used, or the address was taken off." };
}
