import { NextResponse } from "next/server";
import { index } from "@/lib/index";
import { REPLY_NAMES, TOPIC_NAMES, isReply, isTopic, validateEnquiry, type Enquiry } from "@/lib/request";

/**
 * Requests from the form: add a business, correct a listing, take one out.
 *
 * Validated with the same rules the form uses, trapped with a honeypot, and rate limited per
 * connection. Then delivered by the first route configured:
 *
 *   ENQUIRY_WEBHOOK_URL  POST the request as JSON (Zapier, Make, a CRM, an Apps Script)
 *   RESEND_API_KEY       email it to ENQUIRY_TO, from ENQUIRY_FROM (a domain verified with Resend)
 *
 * With neither set: in development the request is written to the server log; in production it is
 * refused (503), because nobody would see it, and the form then offers the phone, WhatsApp and
 * email instead. No request is ever silently lost. Choose a route before launch.
 *
 * The rate limit lives in memory, so it is per server instance: enough to stop a careless loop or
 * a lazy bot, not a determined one. On a host that runs many instances each keeps its own count,
 * and the address it counts by is the one the host's proxy reports. A limit that holds needs a
 * store every instance shares (the host's own rate limiting, or a small table or key store).
 *
 * A request must be JSON, sent by this site's own pages and of a modest size. A form on another
 * site cannot send JSON without asking first, so it cannot post here in a visitor's name.
 *
 * KOS kit. From DHE (src/app/api/enquiry/route.ts).
 */

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // The list of connections is kept short: one that has been quiet for the whole window is forgotten.
  if (hits.size > 5000) for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  // Under a flood from made-up addresses the list is emptied before it can grow without end.
  if (hits.size > 50_000) hits.clear();
  return recent.length > LIMIT;
}

/** How long the delivery of a request may take before it is counted as failed. */
const PATIENCE_MS = 10_000;

/** The most a request may weigh, in bytes. The longest request the form can write is well under it. */
const MAX_BODY = 32 * 1024;

/** The request's body as text, or null if it is heavier than the limit. It is never read past the limit. */
async function bodyText(req: Request): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return null;
  const reader = req.body?.getReader();
  if (!reader) return "";
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel().catch(() => {});
      return null;
    }
    parts.push(value);
  }
  return Buffer.concat(parts).toString("utf8");
}

/**
 * One line of what was typed. Line breaks and other control characters become spaces, so nothing
 * typed into a field can start a new line in an email's subject or in a row further on.
 */
const clip = (v: unknown, n = 500) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").trim().slice(0, n) : undefined);
/** The message: its line breaks are kept, other control characters are not. */
const prose = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, n) : "");

function summary(e: Enquiry) {
  const listing = e.listing ? index().byId.get(e.listing) : undefined;
  const rows: [string, string | undefined][] = [
    ["About", e.topic ? TOPIC_NAMES[e.topic] : undefined],
    ["Business", e.business],
    ["Listing", listing ? `${listing.name} (/b/${listing.slug})` : undefined],
    ["Message", e.message],
    ["Name", e.name],
    ["Phone", e.phone],
    ["Email", e.email],
    ["Reply by", e.reply ? REPLY_NAMES[e.reply] : undefined],
  ];
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").slice(0, 64);
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  // Only this site's own form posts here. A browser says where a request comes from; one sent from
  // a page of another site is refused, and so is anything that is not JSON.
  const from = req.headers.get("sec-fetch-site");
  if (from && from !== "same-origin" && from !== "none") return NextResponse.json({ ok: false, error: "cross-site" }, { status: 403 });
  if (!/^application\/json\b/i.test(req.headers.get("content-type") ?? "")) return NextResponse.json({ ok: false, error: "not-json" }, { status: 415 });

  const sent = await bodyText(req);
  if (sent === null) return NextResponse.json({ ok: false, error: "too-large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(sent);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (clip(body.website)) return NextResponse.json({ ok: true });

  const enquiry: Enquiry = {
    topic: isTopic(body.topic) ? body.topic : undefined,
    listing: /^[nwrq]\d+$/.test(String(body.listing ?? "")) ? String(body.listing) : undefined,
    business: clip(body.business, 160) ?? "",
    message: prose(body.message, 3000),
    name: clip(body.name, 120) ?? "",
    phone: clip(body.phone, 40) ?? "",
    email: clip(body.email, 160) ?? "",
    reply: isReply(body.reply) ? body.reply : undefined,
  };

  const errors = validateEnquiry(enquiry);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, error: "invalid", errors }, { status: 422 });

  const text = summary(enquiry);
  const subject = `biznes.mu: ${enquiry.topic ? TOPIC_NAMES[enquiry.topic] : "Request"}, ${enquiry.business || enquiry.name}`;

  try {
    if (process.env.ENQUIRY_WEBHOOK_URL) {
      const r = await fetch(process.env.ENQUIRY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...enquiry, subject, text, receivedAt: new Date().toISOString() }),
        // A receiver that does not answer is given up on, so a request here never hangs on it.
        signal: AbortSignal.timeout(PATIENCE_MS),
      });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    } else if (process.env.RESEND_API_KEY) {
      const to = process.env.ENQUIRY_TO;
      const from = process.env.ENQUIRY_FROM;
      if (!to || !from) throw new Error("ENQUIRY_TO and ENQUIRY_FROM must be set with RESEND_API_KEY");
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], ...(enquiry.email ? { reply_to: enquiry.email } : {}), subject, text }),
        signal: AbortSignal.timeout(PATIENCE_MS),
      });
      if (!r.ok) throw new Error(`resend ${r.status}`);
    } else if (process.env.NODE_ENV === "production") {
      console.error(`[enquiry] no delivery route is configured; refused: ${subject}`);
      return NextResponse.json({ ok: false, error: "unconfigured" }, { status: 503 });
    } else {
      console.info(`[enquiry] ${subject}\n${text}`);
    }
  } catch (err) {
    console.error("[enquiry] delivery failed", err);
    return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
