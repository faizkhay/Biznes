// The form to join the list of people who are sent the pocket guide and the magazine when each
// comes out. The accounts work fills it (the address is kept in the database, with what was asked
// for and when). With accounts off it is nothing at all.
import Link from "next/link";
import { accountsOn } from "@/lib/accounts/config";
import { subscribe } from "@/lib/accounts/subscribe";
import { ActionForm, Check, Field, Submit, Trap } from "./Form";

/**
 * An email address and two ticks. It posts to a server action, so it works with script off, and
 * it says plainly what will be sent and that one can leave at any time. `compact` sets the address
 * and the button on one line, for a narrow place such as the foot of a page.
 */
export default function SubscribeForm({
  className,
  compact = false,
  email,
  quiet = false,
}: {
  className?: string;
  compact?: boolean;
  /** An address to begin with, where the page knows who is looking. */
  email?: string;
  /** An ink button, where the page already has its one filled action. */
  quiet?: boolean;
}) {
  const button = quiet ? "btn btn-ink button-md" : undefined;
  if (!accountsOn) return null;
  return (
    <div className={className}>
      <ActionForm action={subscribe} className={compact ? "grid gap-3" : "grid gap-4"}>
        <div className={compact ? "flex flex-wrap items-end gap-3" : "grid gap-4"}>
          <Field name="email" label="Your email address" type="email" autoComplete="email" inputMode="email" defaultValue={email} className={compact ? "min-w-0 flex-1" : undefined} />
          {compact && (
            <Submit busy="Joining" className={button}>
              Join the list
            </Submit>
          )}
        </div>
        <fieldset>
          <legend className="title-2">Send me</legend>
          <div className={compact ? "flex flex-wrap gap-x-6" : "mt-1"}>
            <Check name="guide" label="The biznes.mu Pocket Guide, each month it is renewed" defaultChecked />
            <Check name="magazine" label="The free monthly magazine, when it begins" defaultChecked />
          </div>
        </fieldset>
        <Trap />
        {!compact && (
          <div>
            <Submit busy="Joining" className={button}>
              Join the list
            </Submit>
          </div>
        )}
        <p className="caption-1 max-w-prose text-ink-faint">
          We keep your address to send you what you tick, and for nothing else. You can leave at any time: each message carries a link that takes you off the list. <Link href="/privacy">Privacy</Link>.
        </p>
      </ActionForm>
    </div>
  );
}
