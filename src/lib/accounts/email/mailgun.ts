// Mailgun, over its HTTP API. Read on 23 November 2026, before this was written:
//
//   https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages
//     POST /v3/{domain}/messages, multipart/form-data, HTTP basic auth (the user is "api", the
//     password the key). Fields: from, to, subject, text, html, and a custom header as
//     "h:Header-Name". It answers {"id": "<...>", "message": "Queued. Thank you."}; a refusal
//     answers 400, 401, 429 or 500, with {"message": "..."} where it has a body.
//   https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview
//     The address is https://api.mailgun.net for a domain made in the US region and
//     https://api.eu.mailgun.net for one made in the EU region.
//   https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/batch-sending
//     One call may carry up to 1,000 addresses with "recipient-variables", and %recipient.name%
//     is then filled in for each. The page shows it filled in the subject and the body.
//
// That last page does not say that a recipient variable is filled inside a custom header, and
// the header is where each reader's own link to leave must go (List-Unsubscribe, RFC 8058). So
// this sender does not use Mailgun's batch: it hands over one message for each address, a few at
// a time, each whole and with its own headers. It costs more requests and leaves nothing to
// chance. Should a test on a real account show the variable is filled in a header too, one call
// for a batch would do; until then this is the way that is certain.
import { PATIENCE_MS, type Envelope, type Fetch, type Letter, type Outcome, type Sender } from "./letter";

export const mailgunUrl = (domain: string, region: "us" | "eu") => `https://${region === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net"}/v3/${domain}/messages`;
/** How many messages are handed over at once. */
const AT_ONCE = 5;

export function mailgunSender(key: string, domain: string, region: "us" | "eu", fetcher: Fetch): Sender {
  const url = mailgunUrl(domain, region);
  const auth = `Basic ${Buffer.from(`api:${key}`).toString("base64")}`;

  async function one(envelope: Envelope, letter: Letter): Promise<Outcome> {
    const form = new FormData();
    form.set("from", envelope.from);
    form.set("to", letter.to);
    form.set("subject", letter.subject);
    form.set("text", letter.text);
    form.set("html", letter.html);
    if (envelope.replyTo) form.set("h:Reply-To", envelope.replyTo);
    for (const [name, value] of Object.entries(letter.headers)) form.set(`h:${name}`, value);
    let response: Response;
    try {
      response = await fetcher(url, { method: "POST", headers: { Authorization: auth }, body: form, signal: AbortSignal.timeout(PATIENCE_MS) });
    } catch {
      return { ref: letter.ref, ok: false, why: "Mailgun did not answer.", unsure: true };
    }
    const raw = await response.text().catch(() => "");
    let answer: { id?: string; message?: string } = {};
    try {
      answer = JSON.parse(raw) as typeof answer;
    } catch {
      // A refusal may come as plain words ("Forbidden"): they are what is said.
    }
    if (!response.ok) return { ref: letter.ref, ok: false, why: `Mailgun said: ${answer.message ?? (raw.trim() || response.statusText || "no reason given")}`.slice(0, 280), unsure: response.status >= 500 };
    return answer.id ? { ref: letter.ref, ok: true, id: String(answer.id) } : { ref: letter.ref, ok: false, why: "Mailgun took the message and gave it no name.", unsure: true };
  }

  return {
    name: "mailgun",
    connected: true,
    says: `Mailgun is connected, for ${domain}: the site sends its own email.`,
    missing: [],
    async send(envelope, letters) {
      const out: Outcome[] = [];
      for (let from = 0; from < letters.length; from += AT_ONCE) out.push(...(await Promise.all(letters.slice(from, from + AT_ONCE).map((letter) => one(envelope, letter)))));
      return out;
    },
  };
}
