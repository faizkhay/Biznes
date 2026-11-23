// Resend, over its HTTP API. Read on 23 November 2026, before this was written:
//
//   https://resend.com/docs/api-reference/emails/send-batch-emails
//     POST https://api.resend.com/emails/batch takes a list of up to 100 emails, each with its
//     own from, to, subject, html, text, reply_to and headers, and answers
//     {"data": [{"id": "..."}, ...]}, one entry for each email, in the order sent. Attachments
//     are not taken in a batch; a message here has none.
//   https://resend.com/docs/api-reference/introduction
//     Authorization: Bearer <key>. Every request must carry a User-Agent, or it is refused with
//     403. Ten requests a second for a team.
//   https://resend.com/docs/dashboard/emails/idempotency-keys
//     Idempotency-Key, 256 characters at most, kept 24 hours: the same batch handed over twice
//     is sent once.
//   https://resend.com/docs/api-reference/errors
//     A refusal answers with a status and a body of {"statusCode", "name", "message"}: 400, 401,
//     403 and 422 are the request's own fault, 429 is a limit or a quota, 409 is an idempotency
//     key in use, 5xx is theirs.
//   https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails
//     Resend keeps no list for these messages: the List-Unsubscribe and List-Unsubscribe-Post
//     headers are ours to add, in `headers`.
//
// Each reader's own values are put into their own email before the batch is handed over
// (render.ts, `personal`): Resend's batch has no per-recipient variables for raw HTML, and needs
// none, since each email in it is whole.
import { PATIENCE_MS, type Envelope, type Fetch, type Letter, type Outcome, type Sender } from "./letter";

export const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
/** The most Resend takes in one call. */
export const RESEND_MOST = 100;

type Answer = { data?: { id?: string }[]; name?: string; message?: string; statusCode?: number };

export function resendSender(key: string, fetcher: Fetch): Sender {
  async function sendUpTo100(envelope: Envelope, letters: Letter[], part: number): Promise<Outcome[]> {
    const all = (why: string, unsure: boolean): Outcome[] => letters.map((l) => ({ ref: l.ref, ok: false, why, unsure }));
    let response: Response;
    try {
      response = await fetcher(RESEND_BATCH_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "User-Agent": "biznes.mu/1.0", "Idempotency-Key": `biznes/${envelope.key}/${part}` },
        body: JSON.stringify(letters.map((l) => ({ from: envelope.from, to: [l.to], subject: l.subject, html: l.html, text: l.text, ...(envelope.replyTo ? { reply_to: envelope.replyTo } : {}), headers: l.headers }))),
        signal: AbortSignal.timeout(PATIENCE_MS),
      });
    } catch {
      // No answer at all: the batch may have been taken before the line dropped.
      return all("Resend did not answer.", true);
    }
    let answer: Answer = {};
    try {
      answer = (await response.json()) as Answer;
    } catch {
      // An answer that is not JSON is read by its status alone.
    }
    if (!response.ok) {
      const said = `Resend said: ${answer.message ?? response.statusText ?? "no reason given"}${answer.name ? ` (${answer.name})` : ""}`.slice(0, 280);
      // Their own fault, or a key still at work on the same batch: it may have gone.
      return all(said, response.status >= 500 || answer.name === "concurrent_idempotent_requests");
    }
    const ids = Array.isArray(answer.data) ? answer.data : [];
    return letters.map((l, i) => (ids[i]?.id ? { ref: l.ref, ok: true, id: String(ids[i].id) } : { ref: l.ref, ok: false, why: "Resend took the batch and gave this message no name.", unsure: true }));
  }

  return {
    name: "resend",
    connected: true,
    says: "Resend is connected: the site sends its own email.",
    missing: [],
    async send(envelope, letters) {
      const out: Outcome[] = [];
      for (let from = 0; from < letters.length; from += RESEND_MOST) out.push(...(await sendUpTo100(envelope, letters.slice(from, from + RESEND_MOST), from / RESEND_MOST)));
      return out;
    },
  };
}
