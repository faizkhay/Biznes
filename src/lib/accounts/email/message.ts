// A campaign as a message ready to hand over: its words, what stands round them, and each
// reader's own copy with their own links and the headers a mail program asks for.
//
// It reads the site's facts and its address, and nothing else: no database, no mail service, so
// the unit check can run it.
import { PUBLICATIONS, site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";
import type { Letter } from "./letter";
import { WHY } from "./names";
import { CONFIRM_MARK, LEAVE_MARK, personal, toDocument, toText, type Frame, type Message } from "./render";
import { soundBlocks, type Audience, type Campaign, type EmailSettings } from "./types";

/** The page a reader's link to leave opens: one button, and pressing it takes the address off. */
export const leavePage = (token: string) => `${siteUrl}/unsubscribe?token=${token}`;
/** Where a mail program posts to take its reader off in one press (RFC 8058). The same address, asked for plainly, leads to the page above. */
export const leaveInOnePress = (token: string) => `${siteUrl}/api/email/leave?token=${token}`;
/** The page a link to confirm opens. */
export const confirmPath = (token: string) => `/subscribe/confirm?token=${token}`;

/**
 * The message that asks an address to confirm. Its words are the site's own: no admin writes
 * them, so a message that goes to addresses nobody has confirmed can say nothing else.
 */
export function confirmMessage(): Message {
  return {
    subject: `Confirm your address for ${site.name}`,
    preheader: "One press, and you are on the list.",
    blocks: [
      { type: "heading", text: "One press to confirm" },
      { type: "paragraph", text: `This address was given on ${site.name} to be sent the ${PUBLICATIONS.guide.name} each month it is renewed, the ${PUBLICATIONS.magazine.name} when it begins, or both. Press the button to say that the address is yours and that you want them.` },
      { type: "button", label: "Confirm my address", href: confirmPath(CONFIRM_MARK) },
      { type: "paragraph", text: "If you did not ask for this, do nothing, or leave the list with the link below." },
    ],
  };
}

/** A campaign's own words, or, for one that asks the list to confirm, the site's. */
export function messageOf(campaign: Pick<Campaign, "kind" | "subject" | "preheader" | "blocks">): Message {
  if (campaign.kind === "confirm") return confirmMessage();
  return { subject: campaign.subject, preheader: campaign.preheader, blocks: soundBlocks(campaign.blocks) };
}

/** What stands round a message. `leave` is the reader's own token (or the mark that stands for it), or nothing for a message sent by hand to many at once. */
export function frameOf(audience: Audience, settings: Pick<EmailSettings, "from_name" | "reply_to" | "postal_address">, leave: string | null): Frame {
  const from = settings.from_name || site.name;
  return {
    site: siteUrl,
    siteName: site.name,
    from: from === site.name ? `${site.name}, which is run by ${site.builder.legalName}` : `${from} for ${site.name}, which is run by ${site.builder.legalName}`,
    why: WHY[audience],
    postal: settings.postal_address,
    leave: leave ? { url: leavePage(leave) } : { reply: settings.reply_to || site.contact.email },
  };
}

/** The headers every message to the list carries: where a mail program takes its reader off in one press. */
export const listHeaders = (leaveToken: string): Record<string, string> => ({
  "List-Unsubscribe": `<${leaveInOnePress(leaveToken)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

/** A campaign drawn once, with a mark where each reader's own token goes. */
export function drawCampaign(campaign: Pick<Campaign, "kind" | "audience" | "subject" | "preheader" | "blocks">, settings: Pick<EmailSettings, "from_name" | "reply_to" | "postal_address">) {
  const message = messageOf(campaign);
  const frame = frameOf(campaign.audience, settings, LEAVE_MARK);
  return { subject: message.subject, html: toDocument(message, frame), text: toText(message, frame) };
}

/** Each reader's own copy of a drawn campaign: their tokens put in, and their headers. */
export function lettersFor(drawn: { subject: string; html: string; text: string }, rows: { id: number; email: string; leave_token: string; confirm_token?: string | null }[], subjectPrefix = ""): Letter[] {
  return rows.map((row) => {
    const tokens = { leave: row.leave_token, confirm: row.confirm_token ?? "" };
    return { ref: row.id, to: row.email, subject: `${subjectPrefix}${drawn.subject}`, html: personal(drawn.html, tokens), text: personal(drawn.text, tokens), headers: listHeaders(row.leave_token) };
  });
}
