/**
 * The index: everything the crawler found, read once from data/index and held in memory.
 *
 * The files are written by `npm run crawl` (crawler/build.mjs). Nothing here is typed in by hand:
 * a listing's name, address, telephone and hours are OpenStreetMap's, a description is the map's,
 * Wikidata's or the business's own site's, and each listing says which (`src`, `aboutFrom`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Listing = {
  /** "n123", "w123" or "r123" for a map element; "q123" for an organisation known only to Wikidata. */
  id: string;
  slug: string;
  name: string;
  alt?: string[];
  cat: string;
  /** A cuisine, an industry: the map's or Wikidata's own word for what kind it is. */
  kind?: string;
  stars?: number;
  lon?: number;
  lat?: number;
  street?: string;
  postcode?: string;
  phone?: string[];
  phoneFrom?: "site";
  web?: string;
  social?: Record<string, string>;
  hours?: string;
  brand?: string;
  about?: string;
  aboutFrom?: "map" | "wikidata" | "site";
  extras?: string[];
  since?: number;
  exchange?: string;
  seat?: string;
  wikidata?: string;
  region?: "mauritius" | "rodrigues" | "outer";
  district?: string;
  districtSlug?: string;
  place?: string;
  placeSlug?: string;
  area?: string;
  areaSlug?: string;
  site?: { title?: string; checked?: string; lang?: string; gone?: boolean };
  src: { osm?: string; edited?: string; wikidata?: string; site?: { url: string; checked?: string } };
  /** How much is known about it, 0 to 9: a fuller listing is shown before a bare one. */
  full: number;
};

/** Words that mark a description written by whoever broke into a site, not by its owner. */
const HIJACKED = /\b(casino|jackpots?|slots?|betting|togel|judi|poker|sportsbook)\b/i;

export type Place = { slug: string; name: string; kind: "town" | "area"; n: number; lon?: number; lat?: number; district?: string; region?: string; /** For a neighbourhood: the town most of it lies in. */ within?: string };
export type Category = { id: string; group: string; label: string; one: string; words: string[]; /** Narrower words: kinds of thing a mixed category may hold. */ hints?: string[]; n: number };
/** A glossary term. Its meaning is taken from the guide it names. */
export type Term = { term: string; full?: string; meaning: string; guide?: string };
export type Group = { id: string; label: string; n: number };
export type District = { slug: string; name: string; n: number };
export type Site = { host: string; url: string; title: string; name?: string; about?: string; lang?: string; checked?: string };
export type Official = { title: string; url: string; publisher: string; what: string; guides: string[]; host?: string; checked?: string; answered?: boolean };

export type Geo = {
  mauritius: { coast: [number, number][][]; box: [number, number, number, number] };
  rodrigues: { coast: [number, number][][]; box: [number, number, number, number] };
  districts: { name: string; slug: string; rings: [number, number][][] }[];
  towns: { name: string; kind: string; lon: number; lat: number; population?: number }[];
};

export type Meta = {
  generated: string;
  map: { stamp: string; from: string; nodes: number; ways: number; candidates: number; listed: number };
  listings: { all: number; onTheMap: number; fromWikidata: number; joinedToWikidata: number; withPhone: number; withWebsite: number; withHours: number; withAbout: number };
  web: { named?: number; visited?: number; read?: number; refused?: number; unreachable?: number; discovered?: number; enriched: number; sites: number };
  places: number;
  /** Of the places, how many are towns and villages; the rest are neighbourhoods. */
  towns: number;
  categories: number;
  guides: number;
  official: number;
  crawler: { robots: string; pause: number; pagesPerSite: number; follows: string[] };
};

/** One block of a guide. Every block names the sources it was written from. */
export type Block =
  | { type: "p"; text: string; sources?: string[] }
  | { type: "note"; text: string; sources?: string[] }
  | { type: "list"; items: string[]; sources?: string[] }
  | { type: "steps"; items: string[]; sources?: string[] }
  | { type: "table"; columns: string[]; rows: string[][]; sources?: string[] };

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  audience?: string;
  /** Who it is for, as a shelf of the guides page (src/data/site.ts, SHELVES). None means business. */
  shelf?: "mauritius" | "food" | "business" | "visitors" | "newcomers" | "everyday";
  /** The day its facts were last read against their sources. */
  checked: string;
  facts: { label: string; value: string; detail?: string; sources?: string[] }[];
  sections: { heading: string; blocks: Block[] }[];
  sources: { id: string; title: string; url: string; publisher: string; published?: string; accessed?: string }[];
  resources: { title: string; url: string; publisher: string; what: string }[];
  unverified?: string[];
};

type Store = {
  listings: Listing[];
  byId: Map<string, Listing>;
  places: Place[];
  placeBySlug: Map<string, Place>;
  categories: Category[];
  categoryById: Map<string, Category>;
  groups: Group[];
  districts: District[];
  sites: Site[];
  official: Official[];
  geo: Geo;
  meta: Meta;
  guides: Guide[];
  guideBySlug: Map<string, Guide>;
  glossary: Term[];
};

const root = process.cwd();
const read = <T>(file: string): T => JSON.parse(readFileSync(join(root, "data", "index", file), "utf8")) as T;

/** The order the guides are shown in: starting, then running, then growing. A guide not named here follows. */
const GUIDE_ORDER = [
  "register-a-business",
  "incorporate-a-company",
  "choose-a-structure",
  "licences-and-permits",
  "business-taxes",
  "vat",
  "employing-people",
  "protect-a-brand",
  "data-protection",
  "support-and-finance",
  "invest-from-abroad",
  "global-business",
  "verify-a-business",
  "mauritius-at-a-glance",
  "districts-and-towns-of-mauritius",
  "people-and-languages-of-mauritius",
  "history-of-mauritius",
  "how-mauritius-is-governed",
  "weather-and-cyclones-in-mauritius",
  "money-and-banking-in-mauritius",
  "the-economy-of-mauritius",
  "getting-around-mauritius",
  "schools-and-universities-in-mauritius",
  "everyday-facts-about-mauritius",
  "mauritian-food",
  "street-food-and-markets-in-mauritius",
  "eating-out-in-mauritius",
  "opening-a-food-business-in-mauritius",
  "visiting-mauritius",
  "things-to-do-in-mauritius",
  "moving-to-mauritius",
  "settling-in-mauritius",
  "everyday-paperwork-in-mauritius",
  "household-bills-and-services",
  "pharmacies-and-medicines-in-mauritius",
  "prices-and-consumer-rights-in-mauritius",
  "shopping-in-mauritius",
  "internet-and-mobile-in-mauritius",
];

/**
 * A source's title often ends with its publisher's name ("VAT Forms - Mauritius Revenue Authority").
 * The publisher is shown beside it, so the title is shown without the repeat.
 */
function tidyTitles(guide: Guide): Guide {
  const tidy = <T extends { title: string; publisher: string }>(item: T): T => {
    const cut = item.title.replace(/\s+[-|]\s+[^-|]{3,60}$/, "");
    const tail = item.title.slice(cut.length).replace(/^[\s|-]+/, "").toLowerCase();
    return tail && (item.publisher.toLowerCase().includes(tail) || tail.includes(item.publisher.toLowerCase())) ? { ...item, title: cut } : item;
  };
  return { ...guide, sources: guide.sources.map(tidy), resources: guide.resources.map(tidy) };
}

function load(): Store {
  const listings = read<Listing[]>("listings.json");
  // A site that has been broken into describes itself in the intruder's words. The crawler now
  // leaves those out (crawler/build.mjs); this keeps them off the page for an index made before it did.
  for (const l of listings) if (l.aboutFrom === "site" && l.about && HIJACKED.test(l.about) && !/casino|gaming|betting/.test(l.cat)) delete l.about;
  const places = read<Place[]>("places.json");
  const { groups, categories } = read<{ groups: Group[]; categories: Category[] }>("categories.json");
  const dir = join(root, "content", "guides");
  const guides = existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")) as Guide)
        .map(tidyTitles)
    : [];
  const glossaryFile = join(root, "content", "glossary.json");
  const rank = (g: Guide) => (GUIDE_ORDER.indexOf(g.slug) + 1 || GUIDE_ORDER.length + 1) * 1000;
  guides.sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
  return {
    listings,
    byId: new Map(listings.map((l) => [l.id, l])),
    places,
    placeBySlug: new Map(places.map((p) => [p.slug, p])),
    categories,
    categoryById: new Map(categories.map((c) => [c.id, c])),
    groups,
    districts: read<District[]>("districts.json"),
    sites: read<Site[]>("sites.json"),
    official: read<Official[]>("official.json"),
    geo: read<Geo>("geo.json"),
    meta: read<Meta>("meta.json"),
    guides,
    guideBySlug: new Map(guides.map((g) => [g.slug, g])),
    glossary: existsSync(glossaryFile) ? (JSON.parse(readFileSync(glossaryFile, "utf8")) as Term[]).sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" })) : [],
  };
}

const held = globalThis as { __biznesIndex?: Store };
/** The whole index. Loaded on first use and kept for the life of the server. */
export const index = (): Store => (held.__biznesIndex ??= load());

/** A listing by the id at the end of its address: "pharmacie-x-curepipe-n123" is listing "n123". */
export function listingFromSlug(slug: string): Listing | undefined {
  const id = /(?:^|-)([nwrq]\d+)$/.exec(slug)?.[1];
  return id ? index().byId.get(id) : undefined;
}

/** A listing's line of place: "Ebène, Quatre Bornes". */
export function whereOf(l: Listing): string {
  return [l.area, l.place ?? l.seat].filter(Boolean).join(", ");
}

/** Listings in a category, a place or both, fullest first. */
export function listingsIn({ cat, place, district }: { cat?: string; place?: string; district?: string }): Listing[] {
  return index()
    .listings.filter((l) => (!cat || l.cat === cat) && (!place || l.placeSlug === place || l.areaSlug === place) && (!district || l.districtSlug === district))
    .sort((a, b) => b.full - a.full || a.name.localeCompare(b.name));
}
