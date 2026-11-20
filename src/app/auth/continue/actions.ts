"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { accountsOn } from "@/lib/accounts/config";
import { field, safeNext } from "@/lib/accounts/form";
import { LINK_TOKEN, LINK_TYPES } from "@/lib/accounts/link";
import { db } from "@/lib/accounts/server";

/**
 * Trade the token an emailed link carried for a session, and go on. It runs only when the person
 * presses the button on /auth/continue: the token works once, and a mail program that opens every
 * link in a message before its reader does must not be the one to use it.
 */
export async function openLink(data: FormData): Promise<void> {
  if (!accountsOn) redirect("/account");
  const next = safeNext(field(data, "next", 300)) ?? "/account";
  const tokenHash = field(data, "token_hash", 200);
  const type = field(data, "type", 20) as EmailOtpType;
  let ok = false;
  if (LINK_TOKEN.test(tokenHash) && LINK_TYPES.includes(type)) {
    try {
      const supabase = await db();
      ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
    } catch {
      ok = false;
    }
  }
  redirect(ok ? next : "/account/sign-in?problem=link");
}
