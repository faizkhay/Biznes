"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountsOn } from "@/lib/accounts/config";
import { EMAIL, field, PHONE, safeNext, SOON, TRY_AGAIN, typed, UUID, type FormState } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { siteUrl } from "@/lib/site-url";

// Signing in and out, and a person's own profile. Every action checks what it is sent on the
// server, and reads who is asking from Supabase Auth, not from the form.
//
// None of this could be run against a real Supabase project while it was written (README,
// "Accounts"): it follows @supabase/ssr 0.12 and supabase-js 2.119 as installed.

const MIN_PASSWORD = 8;
const AUTH_TRY_AGAIN = "That could not be done just now. Try again in a moment.";

/** A failure from Supabase Auth, in the site's own words. */
function authSays(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email address and password do not match an account.";
    case "email_not_confirmed":
      return "Confirm your email address first: we sent you a link when you signed up.";
    case "user_already_exists":
    case "email_exists":
      return "An account already uses that email address. Sign in, or reset the password.";
    case "weak_password":
      return `Choose a stronger password, of at least ${MIN_PASSWORD} characters.`;
    case "same_password":
      return "That is the password you already have. Choose a different one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many tries in a short time. Wait a few minutes, then try again.";
    case "email_address_invalid":
    case "email_address_not_authorized":
      return "We cannot send email to that address. Check it, or use another.";
    case "signup_disabled":
      return "New accounts are closed for the moment.";
    case "session_not_found":
    case "otp_expired":
      return "That link has expired. Ask for a new one.";
    default:
      // Something the form cannot explain: most often the accounts service itself. Left in the
      // server's log for whoever runs the site; the person is told only to try again.
      console.error(`[accounts] Supabase Auth refused with ${error.code ?? "no code"}: ${error.message ?? ""}`);
      return AUTH_TRY_AGAIN;
  }
}

/**
 * The site's own address, for the link in an email. The address the site was told is its own
 * (NEXT_PUBLIC_SITE_URL, or on Vercel the project's production address) whenever there is one;
 * only with neither, as on a developer's machine, the address the request came to. A request can
 * claim any host, and whoever asks for a password reset is not always whose account it is: a link
 * built from the request could carry that person's sign-in to a host the asker chose. Supabase
 * sends people only to addresses on the project's list of redirect URLs, which is the second lock.
 */
async function origin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL || !/^http:\/\/localhost(:|$)/.test(siteUrl)) return siteUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host || !/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return siteUrl;
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  return `${h.get("x-forwarded-proto") ?? (local ? "http" : "https")}://${host}`;
}

const confirmUrl = async (next: string) => `${await origin()}/auth/confirm?next=${encodeURIComponent(next)}`;

function checkEmail(email: string): string | undefined {
  if (!email) return "Give your email address.";
  if (!EMAIL.test(email)) return "That email address does not look right.";
}

function checkNewPassword(password: string): string | undefined {
  if (!password) return "Choose a password.";
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (password.length > 72) return "Use 72 characters at most.";
}

export async function signIn(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const email = field(data, "email", 160).toLowerCase();
  const password = String(data.get("password") ?? "");
  const next = safeNext(data.get("next"));
  const values = { email, next: next ?? "" };
  const errors: Record<string, string> = {};
  const wrong = checkEmail(email);
  if (wrong) errors.email = wrong;
  if (!password) errors.password = "Give your password.";
  if (Object.keys(errors).length) return { errors, values };

  const supabase = await db();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { message: authSays(error), values };
  redirect(next ?? "/account");
}

export async function signUp(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const name = field(data, "name", 120);
  const email = field(data, "email", 160).toLowerCase();
  const password = String(data.get("password") ?? "");
  const next = safeNext(data.get("next")) ?? "/account";
  const values = { name, email, next };
  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (field(data, "website")) return { ok: true, message: "Check your email: we have sent a link to confirm your address." };
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Tell us your name.";
  const wrongEmail = checkEmail(email);
  if (wrongEmail) errors.email = wrongEmail;
  const wrongPassword = checkNewPassword(password);
  if (wrongPassword) errors.password = wrongPassword;
  if (Object.keys(errors).length) return { errors, values };

  const supabase = await db();
  const { data: made, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: await confirmUrl(next) } });
  if (error) return { message: authSays(error), values };
  // With email confirmation switched off in the project, the person is signed in at once.
  if (made.session) redirect(next);
  // Otherwise a link is on its way. The same is said when the address already has an account, so
  // the form cannot be used to find out who has one.
  return { ok: true, message: `Check your email: we have sent a link to ${email}. Open it to confirm your address and finish.` };
}

export async function askForReset(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const email = field(data, "email", 160).toLowerCase();
  const wrong = checkEmail(email);
  if (wrong) return { errors: { email: wrong }, values: { email } };
  const supabase = await db();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: await confirmUrl("/account/update-password") });
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) return { message: authSays(error), values: { email } };
  if (error && !error.code) return { message: AUTH_TRY_AGAIN, values: { email } };
  // Said whether or not the address has an account.
  return { ok: true, message: `If an account uses ${email}, a link to choose a new password is on its way to it.` };
}

export async function updatePassword(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await getViewer();
  if (!viewer) return { message: "Sign in first, or open the link from your email again." };
  const password = String(data.get("password") ?? "");
  const wrong = checkNewPassword(password);
  if (wrong) return { errors: { password: wrong } };
  const supabase = await db();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { message: authSays(error) };
  redirect("/account?said=password");
}

export async function signOut(): Promise<void> {
  if (accountsOn) {
    const supabase = await db();
    // This device only: other devices stay signed in.
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/");
}

export async function saveProfile(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await getViewer();
  if (!viewer) return { message: "Sign in to change your details." };
  const values = typed(data, ["name", "phone"]);
  const name = field(data, "name", 120);
  const phone = field(data, "phone", 40);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Tell us your name.";
  if (phone && !PHONE.test(phone)) errors.phone = "That phone number does not look right.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", viewer.id);
  if (error) return { message: TRY_AGAIN, values };
  revalidatePath("/account");
  return { ok: true, message: "Saved.", values };
}

/** A customer cancels a booking they asked for. The database lets them cancel only their own. */
export async function cancelBooking(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await getViewer();
  if (!viewer) return { message: "Sign in to change a booking." };
  const id = field(data, "booking");
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: changed, error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id).eq("customer_id", viewer.id).select("id");
  if (error || !changed?.length) return { message: "That booking could not be cancelled. It may already be done or declined." };
  revalidatePath("/account");
  return { ok: true, message: "Cancelled." };
}
