// The listings with no website on record, as a list to work from: `npm run leads`.
//
// It reads data/index (the crawler's own output) and writes two CSV files to reports/, which is
// not committed: every listing without a website, and the shorter list of businesses among them
// that have a telephone number. Nothing is added to what the index holds: a listing with no
// number has none here either, and no email address is in the index at all.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/index/${name}.json`, import.meta.url), "utf8"));
const listings = read("listings");
const { categories, groups } = read("categories");
const meta = read("meta");
const catById = new Map(categories.map((c) => [c.id, c]));
const groupById = new Map(groups.map((g) => [g.id, g]));
const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://biznes.mu";

// Not businesses to offer a website to: public bodies, schools, places kept by the state.
const NOT_BUSINESS = new Set(["public", "learning"]);

const cell = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const HEAD = ["Name", "Kind", "Group", "Town or village", "Area", "District", "Telephone", "Other telephone", "Street", "Opening hours on record", "Last edited on the map", "Listing", "Source"];
const row = (l) => {
  const c = catById.get(l.cat);
  return [l.name, c?.one ?? "", groupById.get(c?.group)?.label ?? "", l.place ?? "", l.area ?? "", l.district ?? "", l.phone?.[0] ?? "", l.phone?.slice(1).join("; ") ?? "", l.street ?? "", l.hours ? "yes" : "", l.src?.edited?.slice(0, 10) ?? "", `${origin}/b/${l.slug}`, l.src?.osm ? `OpenStreetMap ${l.src.osm}` : l.wikidata ? `Wikidata ${l.wikidata}` : ""].map(cell).join(",");
};

const none = listings.filter((l) => !l.web);
const byReach = (a, b) => Number(Boolean(b.phone?.length)) - Number(Boolean(a.phone?.length)) || (a.place ?? "~").localeCompare(b.place ?? "~") || a.name.localeCompare(b.name);
const all = [...none].sort(byReach);
const reachable = all.filter((l) => l.phone?.length && !NOT_BUSINESS.has(catById.get(l.cat)?.group));

mkdirSync(new URL("../reports/", import.meta.url), { recursive: true });
const write = (name, rows) => writeFileSync(new URL(`../reports/${name}`, import.meta.url), `﻿${HEAD.join(",")}\n${rows.map(row).join("\n")}\n`);
write("no-website-all.csv", all);
write("no-website-with-telephone.csv", reachable);

const byGroup = new Map();
for (const l of reachable) {
  const g = groupById.get(catById.get(l.cat)?.group)?.label ?? "Other";
  byGroup.set(g, (byGroup.get(g) ?? 0) + 1);
}
console.log(`Index of ${meta.generated.slice(0, 10)}: ${listings.length} listings, ${none.length} with no website on record.`);
console.log(`reports/no-website-all.csv: ${all.length}`);
console.log(`reports/no-website-with-telephone.csv: ${reachable.length} businesses with a telephone number`);
console.log([...byGroup].sort((a, b) => b[1] - a[1]).map(([g, n]) => `  ${g}: ${n}`).join("\n"));
