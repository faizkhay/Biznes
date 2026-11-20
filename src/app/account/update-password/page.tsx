import type { Metadata } from "next";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { accountsOn } from "@/lib/accounts/config";
import { requireViewer } from "@/lib/accounts/session";
import { updatePassword } from "../actions";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage() {
  if (!accountsOn) return <AccountsSoon title="Choose a new password" />;
  // The link in the email signs the person in on its way here (src/app/auth/confirm).
  const viewer = await requireViewer("/account/update-password");
  return (
    <>
      <PageHead title="Choose a new password" path={[{ href: "/account", label: "Your account" }, { label: "Choose a new password" }]} lede={`For ${viewer.email}.`} />
      <div className="shell">
        <div className="max-w-md">
          <ActionForm action={updatePassword}>
            {/* So a password manager files the new password under the right account. */}
            <input type="email" name="email" autoComplete="username" value={viewer.email} readOnly hidden />
            <Field name="password" label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." />
            <div>
              <Submit>Save the new password</Submit>
            </div>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
