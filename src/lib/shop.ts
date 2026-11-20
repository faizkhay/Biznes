import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { todayInMauritius } from "./theme";

export type Sponsor = { name: string; line?: string; town?: string; phone?: string; web?: string; option: string; months: string[] };
export type Product = {
  slug: string;
  title: string;
  cover: string;
  line: string;
  /** In rupees, for one guide. */
  price: number | null;
  /** The businesses that have paid to be on the sponsors' page, each with the months it paid for. */
  sponsors?: Sponsor[];
  /** What the last build of the PDF held (scripts/pdf.mjs). Absent until it has been built. */
  built?: { edition: string; pages: number; places: number; regions: number; sources: number; checked: string };
};
/** How a guide is sponsored: the options and their prices, and when sponsors make an edition free. */
export type Sponsorship = { confirmed: boolean; target: number; freeDays: number; options: { id: string; name: string; price: number; what: string }[] };

const dir = join(process.cwd(), "content", "pdf");
const read = <T,>(name: string): T | null => {
  const file = join(dir, name);
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null;
  } catch {
    return null;
  }
};

/** The pocket guides for sale. One for now. A guide is offered only once its PDF has been built. */
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

/**
 * What a guide costs today. A guide is renewed every month. When the businesses sponsoring this
 * month's edition have together paid the target, the edition is free for the first three weeks of
 * the month and paid in the last. Sponsorship is always for a coming month, never the one running.
 */
export function offer(product: Product, today = todayInMauritius()) {
  const rules = sponsorship();
  const month = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));
  const prices = new Map(rules?.options.map((option) => [option.id, option.price]));
  const sponsors = (product.sponsors ?? []).filter((sponsor) => sponsor.months.includes(month));
  const raised = sponsors.reduce((sum, sponsor) => sum + (prices.get(sponsor.option) ?? 0), 0);
  const enough = Boolean(rules && raised >= rules.target);
  const free = enough && dayOfMonth <= (rules?.freeDays ?? 21);
  return { month, sponsors, raised, enough, free, freeUntil: rules?.freeDays ?? 21, next: monthAfter(month) };
}

/** Where this month's edition is kept. It is never in public/: only the shop's own route hands it out. */
export const editionFile = (slug: string) => join(dir, "editions", `${slug}.pdf`);
