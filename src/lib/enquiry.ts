/**
 * The shape of an enquiry, shared by the form and the API route, and the one validator both use, so
 * the browser and the server can never disagree about what is required: a name, which business it is
 * about, and a way to reply (a phone number or an email address, whichever the visitor asked us to
 * use).
 *
 * KOS kit. From DHE (src/lib/enquiry.ts). The topics are the businesses themselves, read from the
 * same list the pages render, plus two for a visitor who has not chosen one.
 */
import { BUSINESSES } from "@/data/businesses";

/**
 * What the enquiry is about: a business by its slug, the visitor's own idea, or not sure yet. Only a
 * real business still on the rail can be asked about: a sample is not for sale, so neither the form
 * nor the endpoint offers it (the second design review found the form still listing all five).
 */
export const OPEN_TOPICS = ["own-idea", "unsure"] as const;
export const TOPICS: readonly string[] = [...BUSINESSES.filter((b) => b.status !== "sold" && !b.sample).map((b) => b.slug), ...OPEN_TOPICS];
export type Topic = string;

/** Each topic as the visitor reads it in the form, and as the business reads it in the enquiry. */
export const TOPIC_NAMES: Record<string, string> = {
  ...Object.fromEntries(BUSINESSES.map((b) => [b.slug, `${b.name} (${b.sector})`])),
  "own-idea": "A business for my own idea",
  unsure: "Not sure yet",
};

export const REPLIES = ["whatsapp", "phone", "email"] as const;
export type Reply = (typeof REPLIES)[number];
export const REPLY_NAMES: Record<Reply, string> = { whatsapp: "WhatsApp", phone: "A phone call", email: "Email" };

export type Enquiry = {
  topic?: Topic;
  name: string;
  phone: string;
  email: string;
  message?: string;
  reply?: Reply;
  /** Honeypot: a real visitor never fills it. */
  website?: string;
};

export type EnquiryErrors = Partial<Record<"topic" | "name" | "phone" | "email", "required" | "email" | "phone" | "reach">>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]{7,20}$/;

export const isTopic = (v: unknown): v is Topic => typeof v === "string" && TOPICS.includes(v);
export const isReply = (v: unknown): v is Reply => typeof v === "string" && (REPLIES as readonly string[]).includes(v);

export function validateEnquiry(e: Partial<Enquiry>): EnquiryErrors {
  const out: EnquiryErrors = {};
  if (!isTopic(e.topic)) out.topic = "required";
  if (!e.name?.trim()) out.name = "required";
  const phone = e.phone?.trim();
  const email = e.email?.trim();
  if (phone && !PHONE.test(phone)) out.phone = "phone";
  if (email && !EMAIL.test(email)) out.email = "email";
  if (e.reply === "email") {
    if (!email) out.email = "required";
  } else if (!phone && !out.phone) {
    out.phone = e.reply ? "required" : "reach";
  }
  return out;
}
