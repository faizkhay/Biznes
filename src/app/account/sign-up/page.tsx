import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm, Field, Submit, Trap } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { safeNext } from "@/lib/accounts/form";
import { getViewer } from "@/lib/accounts/session";
import { signUp } from "../actions";

export const metadata: Metadata = { title: ACTIONS.signUp, robots: { index: false, follow: false } };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!accountsOn) return <AccountsSoon title={ACTIONS.signUp} />;
  const next = safeNext((await searchParams).next);
  if (await getViewer()) redirect(next ?? "/account");
  const onward = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <>
      <PageHead title={ACTIONS.signUp} lede="One account, free: to list your business and look after it, and to keep track of the bookings you ask for." />
      <div className="shell">
        <div className="max-w-md">
          <ActionForm action={signUp}>
            <input type="hidden" name="next" value={next ?? ""} />
            <Field name="name" label="Your name" autoComplete="name" />
            <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" hint="We send one message to confirm it is yours." />
            <Field name="password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." />
            <Trap />
            <div>
              <Submit busy="Creating your account">{ACTIONS.signUp}</Submit>
              <p className="caption-1 mt-3 max-w-prose text-ink-faint">
                We keep your name and email address to run your account, and use them for nothing else. <Link href="/privacy">Privacy</Link>.
              </p>
            </div>
          </ActionForm>
          <p className="body-3 mt-8 text-ink-subtle">
            Already have an account?{" "}
            <Link prefetch={false} href={`/account/sign-in${onward}`} className="text-link">
              {ACTIONS.signIn}
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
