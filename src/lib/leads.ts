/**
 * The listings with no website on record, as a list to work from: the agency's own outreach.
 *
 * The same rules as `npm run leads` (scripts/leads.mjs), which writes the same rows to a file:
 * listings without a website, those with a telephone number first, then by town and by name.
 * Nothing is added to what the index holds: a listing with no number has none here either, and no
 * email address is in the index at all. The list is for admins only (src/app/admin/leads).
 */
import { index, type Listing } from "./index";
import { siteUrl } from "./site-url";

/** Not businesses to offer a website to: public bodies, schools, places kept by the state. */
export const NOT_BUSINESS = new Set(["public", "learning"]);

export type LeadFilter = { town?: string; group?: string; /** Only those with a telephone number that are businesses. */ reachable?: boolean };

export function leads({ town, group, reachable }: LeadFilter = {}): Listing[] {
  const { listings, categoryById } = index();
  const phoned = (l: Listing) => Number(Boolean(l.phone?.length));
  return listings
    .filter((l) => !l.web)
    .filter((l) => (!town || l.placeSlug === town) && (!group || categoryById.get(l.cat)?.group === group))
    .filter((l) => !reachable || (l.phone?.length && !NOT_BUSINESS.has(categoryById.get(l.cat)?.group ?? "")))
    .sort((a, b) => phoned(b) - phoned(a) || (a.place ?? "~").localeCompare(b.place ?? "~") || a.name.localeCompare(b.name));
}

const HEAD = ["Name", "Kind", "Group", "Town or village", "Area", "District", "Telephone", "Other telephone", "Street", "Opening hours on record", "Last edited on the map", "Listing", "Source"];

const cell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  // A cell that begins like a formula is kept as text, so a spreadsheet does not run it.
  const safe = /^[=+\-@\t\r]/.test(text) && !/^\+?[\d\s().-]+$/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** The rows as a CSV file a spreadsheet opens, with the byte order mark Excel needs for accents. */
export function leadsCsv(rows: Listing[]): string {
  const { categoryById, groups } = index();
  const groupLabel = new Map(groups.map((g) => [g.id, g.label]));
  const line = (l: Listing) => {
    const c = categoryById.get(l.cat);
    return [l.name, c?.one ?? "", groupLabel.get(c?.group ?? "") ?? "", l.place ?? "", l.area ?? "", l.district ?? "", l.phone?.[0] ?? "", l.phone?.slice(1).join("; ") ?? "", l.street ?? "", l.hours ? "yes" : "", l.src?.edited?.slice(0, 10) ?? "", `${siteUrl}/b/${l.slug}`, l.src?.osm ? `OpenStreetMap ${l.src.osm}` : l.wikidata ? `Wikidata ${l.wikidata}` : ""]
      .map(cell)
      .join(",");
  };
  return `﻿${HEAD.join(",")}\n${rows.map(line).join("\n")}\n`;
}
