// A message, drawn. From the same blocks come three things: the HTML a mail service is handed,
// the plain-text twin that goes with it, and the tree the admin's page draws so the message can be
// looked at before it is sent (src/components/account/MailPreview.tsx). The tree is the HTML: the
// page draws the very marks that are sent, so what is looked at is what goes.
//
// The HTML is written for mail programs, not browsers: tables for layout, every style on the
// element itself, 600 pixels wide, no picture, no script, no font to fetch. Each ground and each
// colour of words is set by name on its own element, so a mail program that darkens a message by
// itself darkens ground and words together; one that honours `prefers-color-scheme` is given the
// site's own dark pairs (ink, swell, white, haze). The saffron button keeps its ink words in both.
//
// Nothing here reads the environment or the database, so the unit check can run it as it is.
import { DARK, LIGHT, type Tone } from "./palette";
import type { Block } from "./types";

/** One mark of a message: an element with its attributes, its styles and what is inside it. */
export type Mark = { tag: string; attrs?: Record<string, string>; style?: Record<string, string>; kids?: (Mark | string)[] };

/**
 * What stands in a message where each reader's own token goes. A batch is drawn once and each
 * address is given its own copy with the tokens put in (`personal`), so one reader's link to
 * leave is never in another's message.
 */
export const LEAVE_MARK = "--leave-token--";
export const CONFIRM_MARK = "--confirm-token--";
export const personal = (drawn: string, tokens: { leave: string; confirm?: string }) => drawn.split(LEAVE_MARK).join(tokens.leave).split(CONFIRM_MARK).join(tokens.confirm ?? "");

/** What a message is, before it is drawn. */
export type Message = { subject: string; preheader: string; blocks: Block[] };

/** What stands round every message: where the site is, who sent it, why the reader has it, how to leave, and the sender's postal address. */
export type Frame = {
  /** The site's own address, with no slash at its end: a button that leads to "/shop" leads there. */
  site: string;
  siteName: string;
  /** Who it is from, by name. */
  from: string;
  /** Why the reader has it, in a sentence. */
  why: string;
  /** The sender's postal address, a line to a line. */
  postal: string;
  /** How to leave: by the reader's own link, or, for a message sent by hand to many at once, by replying. */
  leave: { url: string } | { reply: string };
};

const FONT = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const WIDTH = 600;

const el = (tag: string, style: Record<string, string> | null, attrs: Record<string, string> | null, ...kids: (Mark | string)[]): Mark => ({ tag, ...(attrs ? { attrs } : {}), ...(style ? { style } : {}), ...(kids.length ? { kids } : {}) });
/** A table that only lays things out: a mail program is told so, and so is a screen reader. */
const layout = (style: Record<string, string> | null, attrs: Record<string, string>, ...rows: Mark[]) => el("table", style, { role: "presentation", cellpadding: "0", cellspacing: "0", border: "0", ...attrs }, el("tbody", null, null, ...rows));
const row = (style: Record<string, string>, attrs: Record<string, string> | null, ...kids: (Mark | string)[]) => el("tr", null, null, el("td", style, attrs, ...kids));
/** Lines of text, with a break between each. */
const lines = (text: string) => text.split(/\r?\n/).flatMap((line, i): (Mark | string)[] => (i ? [el("br", null, null), line] : [line]));

/** Where a button leads: a path is a page of this site. */
export const absolute = (href: string, site: string) => (href.startsWith("/") ? `${site}${href}` : href);

function drawBlock(block: Block, i: number, firstHeading: number, frame: Frame, tone: Tone): Mark {
  const last = { padding: "0 0 20px 0" };
  if (block.type === "heading") {
    const first = i === firstHeading;
    return row(last, null, el(first ? "h1" : "h2", { margin: "0", "font-family": FONT, "font-size": first ? "26px" : "20px", "line-height": "1.25", "font-weight": "700", "letter-spacing": "-0.01em", color: tone.ink }, { class: "em-ink" }, block.text));
  }
  if (block.type === "paragraph") return row(last, null, el("p", { margin: "0", "font-family": FONT, "font-size": "16px", "line-height": "1.6", color: tone.soft }, { class: "em-soft" }, ...lines(block.text)));
  if (block.type === "button") {
    const pill = { "border-radius": "9999px", "background-color": tone.button };
    return row(
      { padding: "4px 0 24px 0" },
      null,
      layout(null, {}, row(pill, { bgcolor: tone.button, align: "center" }, el("a", { display: "inline-block", padding: "14px 28px", "font-family": FONT, "font-size": "16px", "line-height": "1.2", "font-weight": "700", color: tone.onButton, "text-decoration": "none", ...pill }, { href: absolute(block.href, frame.site) }, block.label))),
    );
  }
  return row({ padding: "4px 0 24px 0" }, null, el("div", { "border-top": `1px solid ${tone.line}`, "font-size": "0", "line-height": "0", height: "1px" }, { class: "em-line" }, " "));
}

/** The message as a tree of marks: the sheet, the name above the card, the card with the blocks, and the foot. */
export function drawBody(message: Message, frame: Frame, tone: Tone = LIGHT): Mark {
  const firstHeading = message.blocks.findIndex((b) => b.type === "heading");
  const small = { margin: "0 0 10px 0", "font-family": FONT, "font-size": "13px", "line-height": "1.6", color: tone.faint };
  const link = { color: tone.link, "text-decoration": "underline" };
  const leave: (Mark | string)[] =
    "url" in frame.leave
      ? ["To stop these messages, ", el("a", link, { href: frame.leave.url, class: "em-link" }, "leave the list"), ". One press, and nothing more is sent to you."]
      : ["To stop these messages, reply to this one and say so, or write to ", el("a", link, { href: `mailto:${frame.leave.reply}`, class: "em-link" }, frame.leave.reply), ". We take your address off the list by hand."];
  return layout(
    { width: "100%", "background-color": tone.sheet },
    { width: "100%", bgcolor: tone.sheet, class: "em-sheet" },
    row(
      { padding: "28px 12px 36px 12px" },
      { align: "center" },
      layout(
        { width: "100%", "max-width": `${WIDTH}px` },
        { width: String(WIDTH), align: "center" },
        row({ padding: "0 4px 16px 4px", "font-family": FONT, "font-size": "20px", "line-height": "1.2", "font-weight": "700", "letter-spacing": "-0.02em", color: tone.name }, { align: "left", class: "em-name" }, frame.siteName),
        row(
          { padding: "32px 32px 12px 32px", "background-color": tone.card, border: `1px solid ${tone.line}`, "border-radius": "16px" },
          { align: "left", bgcolor: tone.card, class: "em-card em-pad" },
          layout({ width: "100%" }, { width: "100%" }, ...message.blocks.map((block, i) => drawBlock(block, i, firstHeading, frame, tone))),
        ),
        row(
          { padding: "20px 8px 0 8px" },
          { align: "left" },
          el("p", small, { class: "em-faint" }, `Sent by ${frame.from}. ${frame.why}`),
          el("p", small, { class: "em-faint" }, ...leave),
          el("p", { ...small, margin: "0" }, { class: "em-faint" }, ...lines(frame.postal)),
        ),
      ),
    ),
  );
}

const escapeText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (text: string) => escapeText(text).replace(/"/g, "&quot;");
const VOID = new Set(["br", "hr", "img", "meta"]);

/** A tree of marks as HTML. Everything that is words is escaped: a block holds text, never markup. */
export function toHtml(mark: Mark | string): string {
  if (typeof mark === "string") return escapeText(mark);
  const style = mark.style ? Object.entries(mark.style).map(([k, v]) => `${k}:${v}`).join(";") : "";
  const attrs = [...Object.entries(mark.attrs ?? {}), ...(style ? [["style", style]] : [])].map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join("");
  return VOID.has(mark.tag) ? `<${mark.tag}${attrs}>` : `<${mark.tag}${attrs}>${(mark.kids ?? []).map(toHtml).join("")}</${mark.tag}>`;
}

/** What a mail program that honours a dark setting is told: the site's own dark pairs, and the card's padding on a narrow screen. */
const headStyle = () =>
  [
    ":root{color-scheme:light dark;supported-color-schemes:light dark}",
    "@media (prefers-color-scheme:dark){",
    `.em-sheet{background-color:${DARK.sheet}!important}`,
    `.em-card{background-color:${DARK.card}!important;border-color:${DARK.line}!important}`,
    `.em-ink,.em-soft,.em-name{color:${DARK.ink}!important}`,
    `.em-faint,.em-link{color:${DARK.faint}!important}`,
    `.em-line{border-top-color:${DARK.line}!important}`,
    "}",
    "@media (max-width:620px){.em-pad{padding:24px 20px 4px 20px!important}}",
  ].join("");

/**
 * The line a mail program shows after the subject, kept out of sight in the message itself. What
 * follows it is space that takes no room, so the first words of the body are not shown after it.
 */
const preheaderHtml = (text: string) =>
  text ? `<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${LIGHT.sheet}">${escapeText(text)}${" ‌".repeat(60)}</div>` : "";

/** The whole message as the HTML a mail service is handed. */
export function toDocument(message: Message, frame: Frame): string {
  return [
    "<!doctype html>",
    '<html lang="en" dir="ltr">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="color-scheme" content="light dark">',
    '<meta name="supported-color-schemes" content="light dark">',
    `<title>${escapeText(message.subject)}</title>`,
    `<style>${headStyle()}</style>`,
    "</head>",
    `<body class="em-sheet" style="margin:0;padding:0;background-color:${LIGHT.sheet}">`,
    preheaderHtml(message.preheader),
    toHtml(drawBody(message, frame, LIGHT)),
    "</body>",
    "</html>",
  ].join("\n");
}

/** The plain-text twin, from the same blocks: for a mail program that shows no HTML, and for a filter that distrusts a message without one. */
export function toText(message: Message, frame: Frame): string {
  const parts = message.blocks.map((block) => {
    if (block.type === "heading") return `${block.text}\n${"=".repeat(Math.min(block.text.length, 60))}`;
    if (block.type === "paragraph") return block.text;
    if (block.type === "button") return `${block.label}: ${absolute(block.href, frame.site)}`;
    return "-".repeat(40);
  });
  const leave = "url" in frame.leave ? `To stop these messages, leave the list: ${frame.leave.url}` : `To stop these messages, reply to this one and say so, or write to ${frame.leave.reply}. We take your address off the list by hand.`;
  return [...parts, "-".repeat(40), `Sent by ${frame.from}. ${frame.why}`, leave, frame.postal].join("\n\n").replace(/\r\n/g, "\n").trim() + "\n";
}

/** The three things a message is, drawn together. */
export function render(message: Message, frame: Frame) {
  return { html: toDocument(message, frame), text: toText(message, frame), light: drawBody(message, frame, LIGHT), dark: drawBody(message, frame, DARK) };
}
