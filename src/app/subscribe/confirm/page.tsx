import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/Bits";
import { ActionForm, Submit } from "@/components/account/Form";
import { PUBLICATIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { confirmAddress } from "./actions";

export const metadata: Metadata = { title: "Confirm your address", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Where the link in a message that asks to confirm leads: one button that says the address is its
 * reader's own. Opening the page changes nothing, so a mail service that looks at links before a
 * person does confirms nobody; pressing the button does. The link's token is the only key, and it
 * is not the one that leaves the list.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = ((await searchParams).token ?? "").trim();
  const whole = accountsOn && UUID.test(token);
  return (
    <AuthCard
      title="Confirm your address"
      line={
        !accountsOn
          ? "The list has not opened yet, so there is nothing to confirm."
          : whole
            ? `One press to say this address is yours, and that you want the ${PUBLICATIONS.guide.short}, the ${PUBLICATIONS.magazine.short}, or both, as you asked.`
            : "This link is not whole, so we cannot tell which address it is for."
      }
      foot={
        <Link href="/" className="text-link">
          Back to the search
        </Link>
      }
    >
      {whole ? (
        <ActionForm action={confirmAddress}>
          <input type="hidden" name="token" value={token} />
          <div>
            <Submit busy="Confirming">Confirm my address</Submit>
          </div>
          <p className="caption-1 text-ink-faint">If you did not ask for this, press nothing. Every message we send carries a link that takes you off the list.</p>
        </ActionForm>
      ) : accountsOn ? (
        <p className="note body-3">Open the link again from the message it came in, or join the list again from the site and a new one is sent.</p>
      ) : null}
    </AuthCard>
  );
}
