import type { EmailOtpType } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/account/Bits";
import { Submit } from "@/components/account/Form";
import { accountsOn } from "@/lib/accounts/config";
import { safeNext } from "@/lib/accounts/form";
import { LINK_TOKEN, LINK_TYPES } from "@/lib/accounts/link";
import { openLink } from "./actions";

export const metadata: Metadata = { title: "One press to finish", robots: { index: false, follow: false }, referrer: "no-referrer" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/**
 * Where a link in an email waits for its reader. The link's token works once, and some mail
 * programs open every link in a message to look for harm before the person sees it. So opening
 * the link changes nothing: the token is used only when the button here is pressed.
 */
export default async function ContinuePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!accountsOn) redirect("/account");
  const params = await searchParams;
  const tokenHash = one(params.token_hash);
  const type = one(params.type) as EmailOtpType;
  if (!LINK_TOKEN.test(tokenHash) || !LINK_TYPES.includes(type)) redirect("/account/sign-in?problem=link");
  const next = safeNext(one(params.next)) ?? "";
  const reset = type === "recovery";
  return (
    <AuthCard
      title={reset ? "Reset your password" : "Confirm your email address"}
      line={reset ? "One press to go on and choose a new password. The link works once, so it waits for you to press." : "One press to finish. The link works once, so it waits for you to press."}
      path={[{ href: "/account", label: "Your account" }, { label: reset ? "Reset your password" : "Confirm your email address" }]}
    >
      <form action={openLink} className="grid gap-6">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <div>
          <Submit busy="One moment" className="btn btn-filled button-md w-full">
            {reset ? "Choose a new password" : "Confirm and sign in"}
          </Submit>
        </div>
      </form>
    </AuthCard>
  );
}
