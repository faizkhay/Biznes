import "server-only";
import { publicDb } from "@/lib/accounts/server";
import type { MailEvent } from "./hooks";

/** The most of a webhook's body that is read. The largest a service sends is a few kilobytes. */
export const HOOK_BYTES = 256 * 1024;

const JSON_HEAD = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
export const answer = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: JSON_HEAD });

/**
 * Tell the database what a mail service said, once its signature has been checked. The call goes
 * as a visitor's would, with the site's word: the database believes it only when it holds the
 * hash of that word (supabase/migrations, part 14), so nobody holding the public key can report a
 * bounce of their own making.
 */
export async function report(provider: "resend" | "mailgun", events: MailEvent[]): Promise<Response> {
  for (const event of events) {
    const { error } = await publicDb().rpc("email_event", { provider, kind: event.kind, address: event.address, detail: event.detail });
    if (error) {
      console.error(
        error.code === "42501"
          ? "[accounts] the database did not believe a mail service's webhook: BIZNES_SITE_PROOF is not set, or its hash is not kept in private.site_proof (README, \"Setting up the project\", step 8)."
          : `[accounts] a mail service's webhook could not be written down: ${error.message}`,
      );
      // Not done: the service tries again later.
      return answer(503, { error: "This could not be written down just now." });
    }
  }
  return answer(200, { ok: true, written: events.length });
}
