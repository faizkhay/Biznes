import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, Notice } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
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
    <AuthCard
      title="Welcome back"
      line="Sign in to look after your business, your bookings and your orders."
      path={[{ label: ACTIONS.signIn }]}
      foot={
        <>
          New here?{" "}
          <Link prefetch={false} href={`/account/sign-up${onward}`} className="font-semibold text-link">
            {ACTIONS.signUp}
          </Link>
          . It is free.
        </>
      }
    >
      {params.problem && PROBLEMS[params.problem] && (
        <Notice bad className="mb-6">
          {PROBLEMS[params.problem]}
        </Notice>
      )}
      <ActionForm action={signIn}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" />
        <Field name="password" label="Password" type="password" autoComplete="current-password" />
        <div className="grid gap-3">
          <Submit busy="Signing in" className="btn btn-filled button-md w-full">
            {ACTIONS.signIn}
          </Submit>
          <Link prefetch={false} href="/account/reset" className="body-3 inline-flex min-h-11 items-center justify-center text-link">
            Forgotten your password?
          </Link>
        </div>
      </ActionForm>
    </AuthCard>
  );
}
