// What a mail service tells the site afterwards: that an address bounced for good, or that its
// reader marked a message as spam. Each service signs what it says, and nothing is believed until
// the signature has been checked here. Read on 23 November 2026, before this was written:
//
//   Resend signs with Svix.
//     https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
//     https://docs.svix.com/receiving/verifying-payloads/how-manual
//       Three headers: svix-id, svix-timestamp (seconds), svix-signature (a list, separated by
//       spaces, of "v1,<base64>"). What is signed is "<id>.<timestamp>.<body>", the body exactly
//       as it came. The key is the secret after its "whsec_", base64-decoded; the signature is
//       HMAC-SHA256 of that, in base64. The timestamp is checked against the clock.
//     https://resend.com/docs/webhooks/emails/bounced, .../complained, .../suppressed
//       {"type": "email.bounced", "data": {"to": ["a@b"], "bounce": {"type": "Permanent",
//       "subType": "...", "message": "..."}}}. A bounce whose type is not Permanent is a soft
//       one, and is passed over. "email.complained" and "email.suppressed" carry "to" the same way.
//   Mailgun signs with an HMAC of its own.
//     https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks
//       The body is {"signature": {"timestamp", "token", "signature"}, "event-data": {...}}. The
//       signature is HMAC-SHA256, in hex, of timestamp and token joined with nothing between,
//       keyed with the account's webhook signing key (not the API key).
//     https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhook-payloads
//       "event": "failed" with "severity": "permanent" is a hard bounce (or an address Mailgun
//       itself will not write to); "event": "complained" is a complaint. "recipient" is the address.
//     https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhook-retries
//       200 is taken as done, 406 as refused for good, anything else is tried again for 8 hours.
//
// Nothing here reads the environment or the database: the routes do (src/app/api/email/hook).
import { createHmac, timingSafeEqual } from "node:crypto";

/** What a mail service said about one address. */
export type MailEvent = { kind: "bounce" | "complaint"; address: string; detail: string };

const same = (a: string, b: string) => {
  const [x, y] = [Buffer.from(a), Buffer.from(b)];
  return x.length === y.length && timingSafeEqual(x, y);
};

/** How far a Svix timestamp may be from the clock, in seconds: the libraries Svix publishes allow five minutes. */
const SVIX_TOLERANCE = 5 * 60;

/** True when a request carries a signature made with the secret, for this body, in the last few minutes. */
export function verifySvix({ secret, id, timestamp, signature, body, now = Date.now() }: { secret: string; id: string | null; timestamp: string | null; signature: string | null; body: string; now?: number }): boolean {
  if (!secret.startsWith("whsec_") || !id || !timestamp || !signature) return false;
  const at = Number(timestamp);
  if (!Number.isFinite(at) || Math.abs(now / 1000 - at) > SVIX_TOLERANCE) return false;
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    return version === "v1" && Boolean(value) && same(value, expected);
  });
}

/**
 * How old a Mailgun timestamp may be, in seconds. Mailgun tries a webhook again for eight hours
 * and says not to be strict; a day covers that. What a webhook asks for is done once however
 * often it is said, so a signed message played again changes nothing.
 */
const MAILGUN_TOLERANCE = 24 * 3600;

/** True when the three values Mailgun sends agree with the signing key. */
export function verifyMailgun({ key, timestamp, token, signature, now = Date.now() }: { key: string; timestamp: unknown; token: unknown; signature: unknown; now?: number }): boolean {
  if (!key || typeof token !== "string" || typeof signature !== "string" || !token || !signature) return false;
  const stamp = typeof timestamp === "number" ? String(timestamp) : typeof timestamp === "string" ? timestamp : "";
  const at = Number(stamp);
  if (!stamp || !Number.isFinite(at) || now / 1000 - at > MAILGUN_TOLERANCE || at - now / 1000 > 300) return false;
  return same(createHmac("sha256", key).update(stamp + token).digest("hex"), signature.toLowerCase());
}

const address = (v: unknown) => (typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) && v.trim().length <= 160 ? v.trim().toLowerCase() : "");
const words = (...parts: unknown[]) => parts.filter((p): p is string => typeof p === "string" && p.trim() !== "").join(" ").replace(/\s+/g, " ").trim().slice(0, 300);

/** What a payload from Resend asks of the list: nothing, for anything but a hard bounce, a complaint, or an address Resend itself will not write to. */
export function resendEvents(payload: unknown): MailEvent[] {
  const o = (payload && typeof payload === "object" ? payload : {}) as { type?: unknown; data?: { to?: unknown; bounce?: { type?: unknown; subType?: unknown; message?: unknown }; suppressed?: { type?: unknown; message?: unknown } } };
  const to = (Array.isArray(o.data?.to) ? o.data.to : [o.data?.to]).map(address).filter(Boolean);
  if (o.type === "email.bounced") {
    if (o.data?.bounce?.type !== "Permanent") return [];
    return to.map((a) => ({ kind: "bounce", address: a, detail: words(o.data?.bounce?.subType, o.data?.bounce?.message) || "A hard bounce." }));
  }
  if (o.type === "email.complained") return to.map((a) => ({ kind: "complaint", address: a, detail: "Marked as spam." }));
  if (o.type === "email.suppressed") return to.map((a) => ({ kind: "bounce", address: a, detail: words(o.data?.suppressed?.type, o.data?.suppressed?.message) || "Resend does not write to this address." }));
  return [];
}

/** What a payload from Mailgun asks of the list: nothing, for anything but a failure that is permanent or a complaint. */
export function mailgunEvents(payload: unknown): MailEvent[] {
  const data = ((payload && typeof payload === "object" ? payload : {}) as { "event-data"?: unknown })["event-data"];
  const e = (data && typeof data === "object" ? data : {}) as { event?: unknown; severity?: unknown; reason?: unknown; recipient?: unknown; "delivery-status"?: { message?: unknown; description?: unknown; code?: unknown } };
  const to = address(e.recipient);
  if (!to) return [];
  if (e.event === "failed" && e.severity === "permanent") {
    const status = e["delivery-status"];
    return [{ kind: "bounce", address: to, detail: words(typeof status?.code === "number" ? String(status.code) : "", status?.message, status?.description, e.reason) || "A permanent failure." }];
  }
  if (e.event === "complained") return [{ kind: "complaint", address: to, detail: "Marked as spam." }];
  return [];
}
