import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/Bits";
import { ActionForm, Submit } from "@/components/account/Form";
import { accountsOn } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { unsubscribe } from "@/lib/accounts/subscribe";

export const metadata: Metadata = { title: "Leave the list", robots: { index: false, follow: false } };

/**
 * Where the link at the foot of a message leads: one button that takes the address off the list
 * of subscribers. Opening the page changes nothing, so a mail service that looks at links before
 * a person does takes nobody off; pressing the button does. The link's token is the only key.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = ((await searchParams).token ?? "").trim();
  const whole = accountsOn && UUID.test(token);
  return (
    <AuthCard
      title="Leave the list"
      line={whole ? "One press and we send you nothing more: not the pocket guide, not the magazine." : "This link is not whole, so we cannot tell which address it is for."}
      foot={
        <Link href="/" className="text-link">
          Back to the search
        </Link>
      }
    >
      {whole ? (
        <ActionForm action={unsubscribe}>
          <input type="hidden" name="token" value={token} />
          <div>
            <Submit busy="Taking you off">Take me off the list</Submit>
          </div>
          <p className="caption-1 text-ink-faint">Your address is removed, not kept aside. You can join again whenever you like.</p>
        </ActionForm>
      ) : (
        <p className="note body-3">Open the link again from the message it came in, or write to us and we will take you off by hand.</p>
      )}
    </AuthCard>
  );
}
