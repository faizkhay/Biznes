// The last mile: handing a message to a mail service. One interface and four senders.
//
//   none      the default. Nothing leaves: every try is refused, with the reason.
//   resend    Resend, over its HTTP API (./resend.ts).
//   mailgun   Mailgun, over its HTTP API (./mailgun.ts).
//   local     for the checks only: each batch is posted as JSON to an address on this machine
//             (./local.ts), so a campaign can be proved end to end with no mail service.
//
// Which one is read from variables of the server's alone (never NEXT_PUBLIC_, never in the
// repository):
//
//   EMAIL_PROVIDER       resend | mailgun | local. Unset, or anything else: none.
//   RESEND_API_KEY       for resend.
//   MAILGUN_API_KEY      for mailgun.
//   MAILGUN_DOMAIN       the sending domain as Mailgun names it ("mg.example.mu").
//   MAILGUN_REGION       eu for a domain made in Mailgun's EU region; unset or us otherwise.
//   EMAIL_TEST_URL       for local: an address that begins http://127.0.0.1 or http://localhost.
//   EMAIL_BATCH          how many addresses one batch holds: 1 to 100, 25 if unset.
//
// The owner said "our own smtp". Both services offer SMTP too, and neither is used that way here:
// their HTTP APIs need no library (this site adds no dependency for email), take a batch in one
// request or a few, and answer with a name for each message and a reason for each refusal, which
// is what the queue records. An SMTP sender would need three things this file does not have: a
// library that speaks SMTP over TLS (nodemailer is the usual one; Node has none built in), the
// variables EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER and EMAIL_SMTP_PASS, and a host
// that lets a server open port 587 (many serverless hosts do not). It would implement `Sender`
// below, one message a connection or a few, and nothing else would change.
//
// Nothing here reads the database, and nothing here is Next's: the unit check
// (scripts/email-unit.mjs) runs the senders as they are, against recorded answers.
import type { Env, Fetch, Letter, Outcome, Sender } from "./letter";
import { localSender, localUrl } from "./local";
import { mailgunSender } from "./mailgun";
import { resendSender } from "./resend";

export type { Envelope, Env, Fetch, Letter, Outcome, Sender, SenderName } from "./letter";
export { PATIENCE_MS } from "./letter";

const refuse = (letters: Letter[], why: string): Outcome[] => letters.map((l) => ({ ref: l.ref, ok: false, why, unsure: false }));

/** No sender: nothing leaves, and each try says why. */
export function noSender(says: string, missing: string[] = []): Sender {
  return { name: "none", connected: false, says, missing, send: async (_envelope, letters) => refuse(letters, says) };
}

/** How many addresses one batch holds. Resend takes a hundred emails in a call at most; a small batch keeps each request to this site short. */
export function batchSize(env: Env = process.env): number {
  const n = Number(env.EMAIL_BATCH);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : 25;
}

/** The sender the variables name, or none with the reason. */
export function senderFrom(env: Env = process.env, fetcher: Fetch = fetch): Sender {
  const provider = (env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  if (!provider) return noSender("No sender is connected, so the site sends no email.", ["EMAIL_PROVIDER"]);
  if (provider === "resend") {
    const key = env.RESEND_API_KEY?.trim();
    if (!key) return noSender("EMAIL_PROVIDER is resend, but RESEND_API_KEY is not set, so the site sends no email.", ["RESEND_API_KEY"]);
    return resendSender(key, fetcher);
  }
  if (provider === "mailgun") {
    const key = env.MAILGUN_API_KEY?.trim();
    const domain = env.MAILGUN_DOMAIN?.trim().toLowerCase();
    const missing = [key ? "" : "MAILGUN_API_KEY", domain ? "" : "MAILGUN_DOMAIN"].filter(Boolean);
    if (!key || !domain) return noSender(`EMAIL_PROVIDER is mailgun, but ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} not set, so the site sends no email.`, missing);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return noSender("MAILGUN_DOMAIN is not a domain name, so the site sends no email.", ["MAILGUN_DOMAIN"]);
    const region = (env.MAILGUN_REGION ?? "").trim().toLowerCase();
    if (region && region !== "us" && region !== "eu") return noSender("MAILGUN_REGION is neither us nor eu, so the site sends no email.", ["MAILGUN_REGION"]);
    return mailgunSender(key, domain, region === "eu" ? "eu" : "us", fetcher);
  }
  if (provider === "local") {
    const url = localUrl(env.EMAIL_TEST_URL);
    if (!url) return noSender("EMAIL_PROVIDER is local, which is for the checks: EMAIL_TEST_URL must be an address on this machine (http://127.0.0.1 or http://localhost), so the site sends no email.", ["EMAIL_TEST_URL"]);
    return localSender(url, fetcher);
  }
  return noSender(`EMAIL_PROVIDER is "${provider.slice(0, 20)}", which is not a sender this site knows (resend or mailgun), so the site sends no email.`, ["EMAIL_PROVIDER"]);
}

/** "biznes.mu <guide@biznes.mu>": a name and an address as a From line. The name is one the database has already kept free of marks that end it. */
export const fromLine = (name: string, address: string) => (name ? `${/^[\w .'-]+$/.test(name) ? name : `"${name.replace(/["\\\r\n]/g, "")}"`} <${address}>` : address);
