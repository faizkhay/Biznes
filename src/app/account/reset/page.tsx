import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { askForReset } from "../actions";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ResetPage() {
  if (!accountsOn) return <AccountsSoon title="Reset your password" />;
  return (
    <AuthCard
      title="Reset your password"
      line="Give the email address of your account. We send it a link, and the link lets you choose a new password."
      path={[{ href: "/account/sign-in", label: ACTIONS.signIn }, { label: "Reset your password" }]}
      foot={
        <>
          Remembered it?{" "}
          <Link prefetch={false} href="/account/sign-in" className="font-semibold text-link">
            {ACTIONS.signIn}
          </Link>
          .
        </>
      }
    >
      <ActionForm action={askForReset}>
        <Field name="email" label="Email address" type="email" autoComplete="email" inputMode="email" />
        <div>
          <Submit busy="Sending" className="btn btn-filled button-md w-full">
            Send the link
          </Submit>
        </div>
      </ActionForm>
    </AuthCard>
  );
}
