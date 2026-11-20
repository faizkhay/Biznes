import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { askForReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ResetPage() {
  if (!accountsOn) return <AccountsSoon title="Reset your password" />;
  return (
    <>
      <PageHead title="Reset your password" path={[{ href: "/account/sign-in", label: ACTIONS.signIn }, { label: "Reset your password" }]} lede="Give the email address of your account. We send it a link, and the link lets you choose a new password." />
      <div className="shell">
        <div className="max-w-md">
          <ActionForm action={askForReset}>
            <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" />
            <div>
              <Submit busy="Sending">Send the link</Submit>
            </div>
          </ActionForm>
          <p className="body-3 mt-8 text-ink-subtle">
            Remembered it?{" "}
            <Link prefetch={false} href="/account/sign-in" className="text-link">
              {ACTIONS.signIn}
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
