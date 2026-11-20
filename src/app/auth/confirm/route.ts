import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { safeNext } from "@/lib/accounts/form";
import { LINK_TOKEN, LINK_TYPES } from "@/lib/accounts/link";
import { db } from "@/lib/accounts/server";

/**
 * Where a link in an email from Supabase Auth lands: confirming a new account's address, or
 * starting a change of password. It goes on to `next`, which is only ever a path on this site.
 *
 * Two kinds of link are understood. The one this site asks for in the project's email templates
 * carries `token_hash` and `type` (README, "Accounts"): it works on any device. Its token works
 * once, and some mail programs open every link in a message before its reader does, so opening it
 * uses nothing: it is handed to /auth/continue, where the person presses a button and the token is
 * traded for a session then. Supabase's default link comes back with a `code` instead, which works
 * only in the browser that asked for it, so nobody else can spend it and it is traded here at once.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next")) ?? "/account";
  if (!accountsOn) redirect("/account");

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  if (tokenHash && type && LINK_TOKEN.test(tokenHash) && LINK_TYPES.includes(type)) {
    const on = new URLSearchParams({ token_hash: tokenHash, type });
    if (params.get("next")) on.set("next", next);
    redirect(`/auth/continue?${on}`);
  }
  let ok = false;
  try {
    if (code) ok = !(await (await db()).auth.exchangeCodeForSession(code)).error;
  } catch {
    ok = false;
  }
  redirect(ok ? next : "/account/sign-in?problem=link");
}
