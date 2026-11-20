import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/account/Bits";
import { ActionForm, Field, Submit, Trap } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
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
    <AuthCard
      title="Join biznes.mu"
      line="One account, free: list your business and look after it, and keep your bookings and orders in one place."
      path={[{ label: ACTIONS.signUp }]}
      foot={
        <>
          Already have an account?{" "}
          <Link prefetch={false} href={`/account/sign-in${onward}`} className="font-semibold text-link">
            {ACTIONS.signIn}
          </Link>
          .
        </>
      }
    >
      <ActionForm action={signUp}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field name="name" label="Your name" autoComplete="name" />
        <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" hint="We send one message to confirm it is yours." />
        <Field name="password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." />
        <Trap />
        <div>
          <Submit busy="Creating your account" className="btn btn-filled button-md w-full">
            {ACTIONS.signUp}
          </Submit>
          <p className="caption-1 mt-3 text-ink-faint">
            We keep your name and email address to run your account, and use them for nothing else. <Link href="/privacy">Privacy</Link>.
          </p>
        </div>
      </ActionForm>
    </AuthCard>
  );
}
