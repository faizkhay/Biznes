import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { mailgunEvents, verifyMailgun } from "@/lib/accounts/email/hooks";
import { answer, HOOK_BYTES, report } from "@/lib/accounts/email/report";

// What Mailgun tells the site afterwards: POST https://the-site/api/email/hook/mailgun.
//
// Mailgun signs each message with the account's webhook signing key (not the API key). The
// signature is checked against MAILGUN_WEBHOOK_SIGNING_KEY, a variable of the server's alone.
// Nothing is believed until it has been checked, and with no key set everything is refused. A
// permanent failure or a complaint puts the address among the ones not written to; every other
// event is answered and passed over.
//
// Mailgun reads the answer's status: 200 is done, 406 is refused for good, anything else is tried
// again for eight hours. A signature that does not hold is answered 406, so a forgery is not sent
// again and again; a database that cannot be reached is answered 503, so the real thing is.

export async function POST(request: NextRequest) {
  const key = process.env.MAILGUN_WEBHOOK_SIGNING_KEY?.trim();
  if (!accountsOn || !key) return answer(503, { error: "This site holds no signing key for Mailgun, so it believes nothing sent here." });
  if (Number(request.headers.get("content-length") ?? 0) > HOOK_BYTES) return answer(413, { error: "Too large." });
  const body = await request.text();
  if (body.length > HOOK_BYTES) return answer(413, { error: "Too large." });
  let payload: { signature?: { timestamp?: unknown; token?: unknown; signature?: unknown } };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return answer(406, { error: "Not JSON." });
  }
  const s = payload && typeof payload === "object" ? payload.signature : undefined;
  if (!verifyMailgun({ key, timestamp: s?.timestamp, token: s?.token, signature: s?.signature })) return answer(406, { error: "The signature is missing, old, or not Mailgun's." });
  return report("mailgun", mailgunEvents(payload));
}
