/**
 * The shape of a request (to add a business, correct a listing or take one out), shared by the form
 * and the API route, and the one validator both use, so the browser and the server can never
 * disagree about what is required: what it is about, which business, what to change, a name, and a
 * way to reply.
 *
 * KOS kit. From DHE (src/lib/enquiry.ts).
 */
export const TOPICS = ["add", "correct", "remove", "site", "other"] as const;
export type Topic = (typeof TOPICS)[number];
export const TOPIC_NAMES: Record<Topic, string> = {
  add: "Add a business",
  correct: "Correct a listing",
  remove: "Remove a listing",
  site: "My website and your crawler",
  other: "Something else",
};

export const REPLIES = ["email", "whatsapp", "phone"] as const;
export type Reply = (typeof REPLIES)[number];
export const REPLY_NAMES: Record<Reply, string> = { email: "Email", whatsapp: "WhatsApp", phone: "A phone call" };

export type Enquiry = {
  topic?: Topic;
  /** The listing it is about, by id, when the form was opened from a listing's page. */
  listing?: string;
  business: string;
  message: string;
  name: string;
  phone: string;
  email: string;
  reply?: Reply;
  /** Honeypot: a real visitor never fills it. */
  website?: string;
};

export type EnquiryErrors = Partial<Record<"topic" | "business" | "message" | "name" | "phone" | "email", "required" | "email" | "phone">>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]{7,20}$/;

export const isTopic = (v: unknown): v is Topic => typeof v === "string" && (TOPICS as readonly string[]).includes(v);
export const isReply = (v: unknown): v is Reply => typeof v === "string" && (REPLIES as readonly string[]).includes(v);

/**
 * `reach` is false where the visitor sends the request from their own WhatsApp or email, so the
 * reply goes back the same way and no address need be asked for.
 */
export function validateEnquiry(e: Partial<Enquiry>, { reach = true }: { reach?: boolean } = {}): EnquiryErrors {
  const out: EnquiryErrors = {};
  if (!isTopic(e.topic)) out.topic = "required";
  // Which business: needed for everything but a general message.
  if (e.topic !== "other" && !e.business?.trim()) out.business = "required";
  if (!e.message?.trim()) out.message = "required";
  if (!e.name?.trim()) out.name = "required";
  if (!reach) return out;
  const phone = e.phone?.trim();
  const email = e.email?.trim();
  if (phone && !PHONE.test(phone)) out.phone = "phone";
  if (email && !EMAIL.test(email)) out.email = "email";
  if (e.reply === "email" || !e.reply) {
    if (!email) out.email = "required";
  } else if (!phone && !out.phone) out.phone = "required";
  return out;
}
