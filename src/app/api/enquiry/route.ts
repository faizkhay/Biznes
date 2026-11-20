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
 * a lazy bot, not a determined one.
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
  return recent.length > LIMIT;
}

const clip = (v: unknown, n = 500) => (typeof v === "string" ? v.trim().slice(0, n) : undefined);

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 });
  }

  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (clip(body.website)) return NextResponse.json({ ok: true });

  const enquiry: Enquiry = {
    topic: isTopic(body.topic) ? body.topic : undefined,
    listing: /^[nwrq]\d+$/.test(String(body.listing ?? "")) ? String(body.listing) : undefined,
    business: clip(body.business, 160) ?? "",
    message: clip(body.message, 3000) ?? "",
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
