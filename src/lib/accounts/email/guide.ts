import "server-only";
import { PUBLICATIONS } from "@/data/site";
import { count } from "@/lib/format";
import { monthAfter, monthName, offer, products, withBooked } from "@/lib/shop";
import { todayInMauritius } from "@/lib/theme";
import { BLOCK_LIMITS, type Block } from "./types";

// The Pocket Guide's message, begun from what the site already knows: the month, the guide's name
// and where it is on this site, and whether the edition is free or sold in the weeks to come. All
// of it is read from the guide's own files (content/pdf, through src/lib/shop.ts) and from the
// sponsors booked through accounts. Nothing here states a price or a date those do not hold.

/** What the site knows of an edition of the guide. */
export type GuideFacts = {
  edition: string;
  month: string;
  title: string;
  line: string;
  /** Where the guide is on this site. */
  href: string;
  /** True once this edition's file has been made (npm run pdf). */
  built: boolean;
  /** The edition the site is showing today. */
  showing: string;
  /** What the edition's sponsors have paid together, in rupees. */
  raised: number;
  /** Free or sold, in a sentence, from the guide's own rules. */
  terms: string;
};

/** The editions a message can be begun for: this month's and the next, with the coming one first. */
export function editions(today = todayInMauritius()): { coming: string; all: string[] } | null {
  const guide = products()[0];
  if (!guide?.built) return null;
  const month = today.slice(0, 7);
  // The coming edition: the first one after the last that was made, and never a month that has passed.
  const after = monthAfter(guide.built.edition);
  const coming = after > month ? after : month;
  return { coming, all: [...new Set([coming, month, monthAfter(month)])].sort() };
}

/** What the site knows of one edition, or nothing while there is no guide. */
export async function guideFacts(edition: string): Promise<GuideFacts | null> {
  const only = products()[0];
  if (!only?.built || !/^\d{4}-(0[1-9]|1[0-2])$/.test(edition)) return null;
  // The first day of the edition's month: the sponsors counted are that month's.
  const first = `${edition}-01`;
  const guide = await withBooked(only, first);
  const o = offer(guide, first);
  const month = monthName(edition);
  const price = guide.price == null ? "" : `Rs ${count(guide.price)}`;
  const terms = o.step
    ? o.wholeMonth
      ? `Its sponsors have paid for everyone's copy, so this edition is free to download all of ${month}.`
      : `Its sponsors have paid for everyone's copy, so this edition is free to download until ${o.freeUntil} ${month}.${price ? ` After that it is ${price}.` : ""}`
    : price
      ? `This edition is ${price}. Paying online is not open yet: order it on the site, and a person sends it and tells you how to pay.`
      : "This edition is sold. The site says how to order it.";
  return { edition, month, title: guide.title, line: guide.line, href: PUBLICATIONS.guide.href, built: only.built.edition === edition, showing: only.built.edition, raised: o.raised, terms };
}

/** The message for an edition, as a draft: every word of it from what the site knows. */
export function guideDraft(facts: GuideFacts): { subject: string; preheader: string; blocks: Block[] } {
  return {
    subject: `${facts.title}: the ${facts.month} edition`.slice(0, BLOCK_LIMITS.subject),
    preheader: facts.line.slice(0, BLOCK_LIMITS.preheader),
    blocks: [
      { type: "heading", text: `${facts.title}: ${facts.month}`.slice(0, BLOCK_LIMITS.heading) },
      { type: "paragraph", text: `Here is the ${facts.month} edition of the ${facts.title}. ${facts.line}` },
      { type: "paragraph", text: facts.terms },
      { type: "button", label: `Open the ${PUBLICATIONS.guide.short}`, href: facts.href },
    ],
  };
}
