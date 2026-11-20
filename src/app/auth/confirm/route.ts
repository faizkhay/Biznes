import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { safeNext } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";

/**
 * Where a link in an email from Supabase Auth lands: confirming a new account's address, or
 * starting a change of password. It trades what the link carries for a session, kept in cookies,
 * and goes on to `next`, which is only ever a path on this site.
 *
 * Two kinds of link are understood. The one this site asks for in the project's email templates
 * carries `token_hash` and `type` (README, "Accounts"): it works on any device. Supabase's default
 * link comes back with a `code` instead, which works only in the browser that asked for it.
 *
 * Not run against a real project while it was written: see the README.
 */
const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next")) ?? "/account";
  if (!accountsOn) redirect("/account");

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  let ok = false;
  try {
    const supabase = await db();
    if (tokenHash && type && TYPES.includes(type)) ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
    else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } catch {
    ok = false;
  }
  redirect(ok ? next : "/account/sign-in?problem=link");
}
