import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { todayInMauritius } from "./theme";

export type Sponsor = { name: string; line?: string; town?: string; phone?: string; web?: string; option: string; months: string[] };
export type Product = {
  slug: string;
  title: string;
  cover: string;
  line: string;
  /** In rupees, for one edition. */
  price: number | null;
  /** The businesses that have paid to be on the sponsors' pages, each with the months it paid for. */
  sponsors?: Sponsor[];
  /** What the last build of the PDF held (scripts/pdf.mjs). Absent until it has been built. */
  built?: { edition: string; pages: number; places: number; regions: number; sources: number; checked: string };
};
/**
 * How the guide is sponsored (content/pdf/sponsorship.json, the owner's words of 20 November
 * 2026): the options with their fees and the share of a page each takes, the most pages of
 * sponsors an edition holds, and the steps at which its sponsors make it free.
 */
export type Sponsorship = {
  confirmed: boolean;
  /** An edition holds at most this many pages of sponsors. */
  maxPages: number;
  /** When the edition's sponsors have together paid `raised`, it is free for the first `weeks` weeks of its month, or for the whole of it. */
  free: { raised: number; weeks?: number; month?: boolean }[];
  options: { id: string; name: string; price: number; pages: number; what: string }[];
};

const dir = join(process.cwd(), "content", "pdf");
const read = <T,>(name: string): T | null => {
  const file = join(dir, name);
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null;
  } catch {
    return null;
  }
};

/** The pocket guide: there is one, renewed every month. It is offered only once its PDF has been built. */
export function products(): Product[] {
  const product = read<Product>("product.json");
  const built = read<NonNullable<Product["built"]> & { slug: string }>("built.json");
  if (!product || !built || built.slug !== product.slug) return [];
  return [{ ...product, built }];
}

export const sponsorship = () => read<Sponsorship>("sponsorship.json");

/** The month after a given one, as YYYY-MM. */
export const monthAfter = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};
/** A month in words: "December 2026". */
export const monthName = (month: string) => new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** How long a step makes an edition free, in words: "the first two weeks of its month". */
export const freeFor = (step: Sponsorship["free"][number]) => (step.month ? "the whole month" : `the first ${["no", "one", "two", "three", "four"][step.weeks ?? 0] ?? step.weeks} weeks of its month`);

/**
 * The pages of sponsors an edition holds, of the most it may: each option takes its share of a
 * page. scripts/pdf.mjs keeps the same sum, and refuses to make an edition that is over.
 */
export function sponsorPages(product: Product, month: string, rules = sponsorship()) {
  const share = new Map(rules?.options.map((option) => [option.id, option.pages]));
  const taken = (product.sponsors ?? []).filter((sponsor) => sponsor.months.includes(month)).reduce((sum, sponsor) => sum + (share.get(sponsor.option) ?? 0), 0);
  const most = rules?.maxPages ?? 0;
  return { taken, most, left: Math.max(0, most - taken) };
}

/**
 * What the guide costs today. It is renewed every month. The businesses sponsoring this month's
 * edition make it free by steps (the owner, 20 November 2026): together they have paid Rs 8,000,
 * and it is free for the first two weeks of the month; Rs 10,000, three weeks; Rs 12,000, the whole
 * month. The rest of the month it is sold. Sponsorship is always for a coming month, never the
 * one running.
 */
export function offer(product: Product, today = todayInMauritius()) {
  const rules = sponsorship();
  const month = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));
  const prices = new Map(rules?.options.map((option) => [option.id, option.price]));
  const sponsors = (product.sponsors ?? []).filter((sponsor) => sponsor.months.includes(month));
  const raised = sponsors.reduce((sum, sponsor) => sum + (prices.get(sponsor.option) ?? 0), 0);
  // The highest step this edition's sponsors have reached.
  const step = [...(rules?.free ?? [])].sort((a, b) => a.raised - b.raised).filter((s) => raised >= s.raised).at(-1);
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const freeUntil = step ? (step.month ? lastDay : Math.min(lastDay, (step.weeks ?? 0) * 7)) : 0;
  return { month, sponsors, raised, step, free: dayOfMonth <= freeUntil, freeUntil, wholeMonth: Boolean(step?.month), next: monthAfter(month) };
}

/** Where this month's edition is kept. It is never in public/: only the shop's own route hands it out. */
export const editionFile = (slug: string) => join(dir, "editions", `${slug}.pdf`);
