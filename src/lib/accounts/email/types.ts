// The shapes of what the site's own email keeps (supabase/migrations, part 14), and the one word
// the site uses for each state. Safe to read from a page or from the browser: nothing here talks
// to the database or to a mail service.

/** A part of a message's body. There are four kinds and no others; nobody writes HTML. */
export type Block = { type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "button"; label: string; href: string } | { type: "line" };
export const BLOCK_TYPES = ["heading", "paragraph", "button", "line"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_NAMES: Record<BlockType, string> = { heading: "A heading", paragraph: "A paragraph", button: "A button", line: "A line" };
export const isBlockType = (v: unknown): v is BlockType => typeof v === "string" && (BLOCK_TYPES as readonly string[]).includes(v);
/** The most a message holds, and the most each part holds. The database asks the same. */
export const BLOCK_MOST = 40;
export const BLOCK_LIMITS = { heading: 120, paragraph: 2000, label: 60, href: 300, subject: 150, preheader: 200 } as const;

/** A new block of a kind, with nothing in it yet. */
export const emptyBlock = (type: BlockType): Block => (type === "button" ? { type, label: "", href: "" } : type === "line" ? { type } : { type, text: "" });

/**
 * Where a button may lead: a page of this site, written as a path ("/shop"), or a full address
 * that begins https://. Nothing else: not http, not script, not another site by way of "//".
 */
export const isButtonHref = (href: string) => /^(\/[^\s"<>]*|https:\/\/[^\s"<>]+)$/.test(href) && !href.startsWith("//") && href.length <= BLOCK_LIMITS.href;

/** What is wrong with a block, in words, or nothing. `whole` asks that it be filled in, as a message that is ready must be. */
export function blockProblem(block: Block, whole: boolean): { field: "text" | "label" | "href"; says: string } | null {
  if (block.type === "heading" || block.type === "paragraph") {
    if (whole && !block.text.trim()) return { field: "text", says: block.type === "heading" ? "Write the heading, or take it out." : "Write the paragraph, or take it out." };
    return null;
  }
  if (block.type === "button") {
    if (whole && !block.label.trim()) return { field: "label", says: "Say what the button says." };
    if (whole && !block.href) return { field: "href", says: "Say where the button leads." };
    if (block.href && !isButtonHref(block.href)) return { field: "href", says: "Give a page of this site, such as /shop, or a full address that begins https://" };
  }
  return null;
}

/** The blocks of a campaign as read from the database, with anything that is not a block left out: a page never falls over on a row that holds something else. */
export function soundBlocks(value: unknown): Block[] {
  if (!Array.isArray(value)) return [];
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return value.flatMap((b): Block[] => {
    if (!b || typeof b !== "object") return [];
    const o = b as Record<string, unknown>;
    if (o.type === "heading" || o.type === "paragraph") return [{ type: o.type, text: text(o.text) }];
    if (o.type === "button") return [{ type: "button", label: text(o.label), href: text(o.href) }];
    if (o.type === "line") return [{ type: "line" }];
    return [];
  });
}

/** What a message is for. `confirm` is the site's own: it asks an address to confirm, and nobody writes it. */
export const CAMPAIGN_KINDS = ["guide", "magazine", "note"] as const;
export type CampaignKind = (typeof CAMPAIGN_KINDS)[number] | "confirm";
export const isWritableKind = (v: unknown): v is (typeof CAMPAIGN_KINDS)[number] => typeof v === "string" && (CAMPAIGN_KINDS as readonly string[]).includes(v);

/** Who a message goes to. */
export const AUDIENCES = ["guide", "magazine", "everyone"] as const;
export type Audience = (typeof AUDIENCES)[number] | "unconfirmed";
export const isAudience = (v: unknown): v is (typeof AUDIENCES)[number] => typeof v === "string" && (AUDIENCES as readonly string[]).includes(v);

export const CAMPAIGN_STATUSES = ["draft", "ready", "sending", "sent", "cancelled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export const CAMPAIGN_STATUS_NAMES: Record<CampaignStatus, string> = { draft: "Draft", ready: "Ready", sending: "Being sent", sent: "Sent", cancelled: "Cancelled" };

export type Campaign = {
  id: string;
  kind: CampaignKind;
  audience: Audience;
  edition: string | null;
  subject: string;
  preheader: string;
  blocks: unknown;
  status: CampaignStatus;
  by_hand: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  started_by: string | null;
  started_at: string | null;
  finished_at: string | null;
};

export type RecipientState = "queued" | "sending" | "sent" | "failed" | "skipped";
export const RECIPIENT_STATE_NAMES: Record<RecipientState, string> = { queued: "Waiting", sending: "Taken, not yet answered for", sent: "Sent", failed: "Failed", skipped: "Left out" };
export type Recipient = { id: number; campaign_id: string; subscriber_id: string | null; email: string; state: RecipientState; reason: string; unsure: boolean; provider_id: string; claimed_at: string | null; done_at: string | null };

/** Why an address was left out, in words. A failure's reason is what the mail service said, and is shown as it is. */
export const SKIPPED_SAYS: Record<string, string> = {
  suppressed: "Not written to: it bounced, complained or asked us",
  unconfirmed: "Not confirmed",
  left: "Left the list before its turn",
  confirmed: "Confirmed before its turn",
  cancelled: "The message was cancelled before its turn",
};
export const reasonSays = (r: Pick<Recipient, "state" | "reason" | "unsure">) =>
  r.state === "skipped" ? (SKIPPED_SAYS[r.reason] ?? r.reason) : r.state === "failed" ? (r.reason === "interrupted" ? "The batch was cut short: it may or may not have gone" : `${r.reason}${r.unsure ? " (it may or may not have gone)" : ""}`) : "";

/** How a campaign's queue stands, as the database counts it. */
export type Progress = { status: CampaignStatus; queued: number; sending: number; sent: number; failed: number; unsure: number; skipped: number; total: number };
export const NO_PROGRESS: Progress = { status: "draft", queued: 0, sending: 0, sent: 0, failed: 0, unsure: 0, skipped: 0, total: 0 };
export function soundProgress(value: unknown): Progress {
  const o = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof o[k] === "number" ? (o[k] as number) : 0);
  return { status: (CAMPAIGN_STATUSES as readonly string[]).includes(o.status as string) ? (o.status as CampaignStatus) : "draft", queued: n("queued"), sending: n("sending"), sent: n("sent"), failed: n("failed"), unsure: n("unsure"), skipped: n("skipped"), total: n("total") };
}

/** Who would be written to, and who left out, before a message is sent. */
export type AudienceCounts = { to_send: number; suppressed: number; unconfirmed: number };

export const WRITE_TO = ["confirmed_once_connected", "confirmed", "everyone"] as const;
export type WriteTo = (typeof WRITE_TO)[number];
export const isWriteTo = (v: unknown): v is WriteTo => typeof v === "string" && (WRITE_TO as readonly string[]).includes(v);
export const WRITE_TO_NAMES: Record<WriteTo, string> = {
  confirmed_once_connected: "Confirmed addresses, once a sender is connected",
  confirmed: "Confirmed addresses only",
  everyone: "Every address on the list",
};

export type EmailSettings = { from_name: string; from_email: string; reply_to: string; postal_address: string; write_to: WriteTo; /** When someone last changed them; empty while nobody has. */ updated_at: string };
export const NO_SETTINGS: EmailSettings = { from_name: "", from_email: "", reply_to: "", postal_address: "", write_to: "confirmed_once_connected", updated_at: "" };

/** What the admin's pages count, in one answer from the database. */
export type EmailStatus = { subscribers: number; confirmed: number; guide: number; magazine: number; suppressed: number; to_ask: number; proof: boolean };
export const NO_STATUS: EmailStatus = { subscribers: 0, confirmed: 0, guide: 0, magazine: 0, suppressed: 0, to_ask: 0, proof: false };

export const SUPPRESSION_REASONS = ["bounce", "complaint", "asked"] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];
export const SUPPRESSION_NAMES: Record<SuppressionReason, string> = { bounce: "It bounced", complaint: "Its reader complained", asked: "Asked us not to write" };
export type Suppression = { email: string; reason: SuppressionReason; detail: string; source: string; created_at: string };
