"use server";

import { revalidatePath } from "next/cache";
import { accountsOn } from "./config";
import { EMAIL, field, SOON, UUID, type FormState } from "./form";
import { tooMany } from "./limit";
import { publicDb } from "./server";

// Joining and leaving the list of people who are sent the pocket guide and the magazine. Both go
// through functions in the database (supabase/migrations, part 5): the site never reads the list
// as a visitor, so neither answer says whether an address was on it.

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
  else if (!EMAIL.test(email)) errors.email = "That email address does not look right.";
  if (!guide && !magazine) errors.guide = "Tick at least one thing to be sent.";
  if (Object.keys(errors).length) return { errors, values };
  if (await tooMany("subscribe", 6)) return { message: "Too many tries from this connection. Wait a few minutes, then try again.", values };

  const { error } = await publicDb().rpc("subscribe", { address: email, guide, magazine });
  if (error?.hint === "subscribe_email") return { errors: { email: "That email address does not look right." }, values };
  if (error?.hint === "subscribe_busy") return { message: "Many people have joined in the last while. Try again later.", values };
  if (error) return { message: "You could not be added just now. Try again in a moment.", values };
  revalidatePath("/admin/subscribers");
  return { ok: true, message: `You are on the list. We will send ${asked} to ${email} when it comes out, and nothing else.` };
}

/** Leave the list, with the token an unsubscribe link carries. */
export async function unsubscribe(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const token = field(data, "token", 40);
  if (!UUID.test(token)) return { message: "That link is not whole. Open it again from the message it came in." };
  if (await tooMany("unsubscribe", 20)) return { message: "Too many tries from this connection. Wait a few minutes, then try again." };
  const { data: left, error } = await publicDb().rpc("unsubscribe", { leave_token: token });
  if (error) return { message: "You could not be taken off just now. Try again in a moment." };
  revalidatePath("/admin/subscribers");
  // Said either way: an address that has already left is off the list too.
  return { ok: true, message: left ? "You are off the list. Nothing more will be sent to you." : "You are not on the list: that link has already been used, or the address was taken off." };
}
