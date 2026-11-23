import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { resendEvents, verifySvix } from "@/lib/accounts/email/hooks";
import { answer, HOOK_BYTES, report } from "@/lib/accounts/email/report";

// What Resend tells the site afterwards: POST https://the-site/api/email/hook/resend.
//
// Resend signs each message (through Svix). The signature is checked against RESEND_WEBHOOK_SECRET,
// the signing secret of this endpoint as Resend shows it ("whsec_..."), a variable of the server's
// alone. Nothing is believed until it has been checked, and with no secret set everything is
// refused. A hard bounce, a complaint, or an address Resend itself will not write to puts the
// address among the ones not written to; every other event is answered and passed over.

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!accountsOn || !secret) return answer(503, { error: "This site holds no signing secret for Resend, so it believes nothing sent here." });
  if (Number(request.headers.get("content-length") ?? 0) > HOOK_BYTES) return answer(413, { error: "Too large." });
  // The body exactly as it came: a signature is of the bytes, not of what they mean.
  const body = await request.text();
  if (body.length > HOOK_BYTES) return answer(413, { error: "Too large." });
  const signed = verifySvix({ secret, id: request.headers.get("svix-id"), timestamp: request.headers.get("svix-timestamp"), signature: request.headers.get("svix-signature"), body });
  if (!signed) return answer(401, { error: "The signature is missing, old, or not Resend's." });
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return answer(400, { error: "Not JSON." });
  }
  return report("resend", resendEvents(payload));
}
