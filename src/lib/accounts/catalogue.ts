import "server-only";
import { PLANS } from "@/data/site";
import { products, sponsorship } from "@/lib/shop";
import { AD_PLACES } from "./types";

/**
 * What the site sells, from the site's own data: the pocket guides (content/pdf/product.json, once
 * built), the places on a guide's sponsors' pages (content/pdf/sponsorship.json), the paid plans
 * (PLANS in src/data/site.ts), and advertisements on the site and in the magazine, which have no
 * price yet. Nothing here is typed in: a price changes where the owner keeps it.
 *
 * The database holds a copy, the `catalogue` table, and prices every order from that copy, so no
 * order can carry a price of its own. An order is taken only while the two agree on what was
 * ordered; the superadmin brings the copy level from the orders page.
 */
export type Sold = { id: string; kind: "guide" | "sponsor" | "plan" | "ad"; name: string; price: number | null; per: "each" | "month" };

export function siteCatalogue(): Sold[] {
  const guides: Sold[] = products().map((p) => ({ id: `guide:${p.slug}`, kind: "guide", name: p.title, price: p.price, per: "each" }));
  const sponsors: Sold[] = (sponsorship()?.options ?? []).map((o) => ({ id: `sponsor:${o.id}`, kind: "sponsor", name: o.name, price: o.price, per: "month" }));
  const plans: Sold[] = PLANS.filter((p) => p.price > 0).map((p) => ({ id: `plan:${p.id}`, kind: "plan", name: p.name, price: p.price, per: "month" }));
  const ads: Sold[] = AD_PLACES.filter((p) => p.where !== "guide").map((p) => ({ id: `ad:${p.id}`, kind: "ad", name: `Advertisement: ${p.name.charAt(0).toLowerCase()}${p.name.slice(1)}`, price: null, per: "month" }));
  return [...guides, ...sponsors, ...plans, ...ads];
}

/** The catalogue's id for a thing in a cart: its kind and its own id, however the cart wrote it ("go" or "plan:go"). */
export const soldId = (kind: string, id: string) => (id.startsWith(`${kind}:`) ? id : `${kind}:${id}`);

export type CatalogueRow = { id: string; name: string; price_mur: number | null; per: string; active: boolean };

/** Where the database's copy and the site's own data disagree: what is missing, switched off, or priced differently. */
export function unlevel(site: Sold[], copy: CatalogueRow[]): string[] {
  const held = new Map(copy.map((row) => [row.id, row]));
  const out: string[] = [];
  for (const sold of site) {
    const row = held.get(sold.id);
    if (!row || !row.active) out.push(`${sold.name} is not in the catalogue`);
    else if (row.price_mur !== sold.price || row.per !== sold.per) out.push(`${sold.name}: the site says ${sold.price ?? "on request"}, the catalogue ${row.price_mur ?? "on request"}`);
    else if (row.name !== sold.name) out.push(`${sold.name} is named "${row.name}" in the catalogue`);
  }
  const sells = new Set(site.map((s) => s.id));
  for (const row of copy) if (row.active && !sells.has(row.id)) out.push(`${row.name} is in the catalogue and no longer sold`);
  return out;
}
