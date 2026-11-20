import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { safeNext } from "@/lib/accounts/form";
import { getViewer } from "@/lib/accounts/session";
import { signIn } from "../actions";

export const metadata: Metadata = { title: ACTIONS.signIn, robots: { index: false, follow: false } };

const PROBLEMS: Record<string, string> = {
  link: "That link has expired or has already been used. Sign in, or ask for a new one.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; problem?: string }> }) {
  if (!accountsOn) return <AccountsSoon title={ACTIONS.signIn} />;
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getViewer()) redirect(next ?? "/account");
  const onward = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <PageHead title={ACTIONS.signIn} lede="For your bookings, and for the businesses you list." />
      <div className="shell">
        <div className="max-w-md">
          {params.problem && PROBLEMS[params.problem] && (
            <p role="alert" className="note body-3 mb-6">
              {PROBLEMS[params.problem]}
            </p>
          )}
          <ActionForm action={signIn}>
            <input type="hidden" name="next" value={next ?? ""} />
            <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" />
            <Field name="password" label="Password" type="password" autoComplete="current-password" />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Submit busy="Signing in">{ACTIONS.signIn}</Submit>
              <Link href="/account/reset" className="body-3 inline-flex min-h-11 items-center text-link">
                Forgotten your password?
              </Link>
            </div>
          </ActionForm>
          <p className="body-3 mt-8 text-ink-subtle">
            No account yet?{" "}
            <Link href={`/account/sign-up${onward}`} className="text-link">
              {ACTIONS.signUp}
            </Link>
            . It is free.
          </p>
        </div>
      </div>
    </>
  );
}
