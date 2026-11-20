/**
 * The search: one question over everything the site holds.
 *
 * Four kinds of thing answer: a listing (a business or a service), a guide, an official page, and
 * a Mauritian website the crawler found. A question is read before it is searched: a town in it
 * ("in Curepipe", or just "curepipe") narrows the listings to that town, and a kind of business
 * in it ("pharmacy", "farmasi", "quincaillerie") is understood as that category, in English,
 * French or Kreol. If reading it that way finds nothing, it is searched as plain words.
 *
 * The index is MiniSearch, built in memory from data/index the first time it is needed.
 */
import MiniSearch from "minisearch";
import { chartPoints } from "./chart";
import { index, whereOf, type Category, type Guide, type Listing, type Official, type Place, type Site } from "./index";

export type Kind = "listing" | "guide" | "official" | "site";
export const KINDS: { id: Kind; label: string }[] = [
  { id: "listing", label: "Businesses" },
  { id: "guide", label: "Guides" },
  { id: "official", label: "Official pages" },
  { id: "site", label: "Websites" },
];

export type GuideHit = { guide: Guide; section?: string };
export type Way = { href: string; label: string; n: number };

export type Answer = {
  query: string;
  /** What the question was understood to ask for. */
  place?: Place;
  category?: Category;
  listings: Listing[];
  guides: GuideHit[];
  official: Official[];
  sites: Site[];
  counts: Record<Kind, number>;
  /** Ways in to the directory that match the question. */
  ways: Way[];
  /** Where the matching listings are on the chart: positions in chartPoints(). */
  points: number[];
};

/** Lower case, unaccented, punctuation to spaces. */
export const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type Doc = { id: string; kind: Kind; name: string; alt: string; what: string; where: string; text: string };

type Engine = {
  mini: MiniSearch<Doc>;
  placeNames: { folded: string; place: Place }[];
  categoryWords: { folded: string; category: Category }[];
  guideSections: Map<string, { slug: string; heading: string }>;
};

let engine: Engine | undefined;

function build(): Engine {
  const { listings, guides, official, sites, categories, places, categoryById } = index();
  const docs: Doc[] = [];
  for (const l of listings) {
    const c = categoryById.get(l.cat);
    docs.push({
      id: `l:${l.id}`,
      kind: "listing",
      name: l.name,
      alt: [...(l.alt ?? []), l.brand ?? ""].join(" "),
      what: [c?.one, c?.label, ...(c?.words ?? []), l.kind ?? ""].join(" "),
      where: [l.area, l.place, l.district, l.street, l.seat].filter(Boolean).join(" "),
      text: l.about ?? "",
    });
  }
  const guideSections = new Map<string, { slug: string; heading: string }>();
  for (const g of guides) {
    docs.push({ id: `g:${g.slug}`, kind: "guide", name: g.title, alt: g.facts.map((f) => f.label).join(" "), what: g.summary, where: "", text: g.facts.map((f) => `${f.value} ${f.detail ?? ""}`).join(" ") });
    g.sections.forEach((section, i) => {
      const id = `g:${g.slug}#${i}`;
      guideSections.set(id, { slug: g.slug, heading: section.heading });
      const words = section.blocks.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : [...b.columns, ...b.rows.flat()].join(" "))).join(" ");
      docs.push({ id, kind: "guide", name: section.heading, alt: g.title, what: "", where: "", text: words });
    });
  }
  official.forEach((o, i) => docs.push({ id: `o:${i}`, kind: "official", name: o.title, alt: o.publisher, what: o.what, where: "", text: o.host ?? "" }));
  sites.forEach((s, i) => docs.push({ id: `s:${i}`, kind: "site", name: s.name ?? s.title, alt: s.title, what: s.host, where: "", text: s.about ?? "" }));

  const mini = new MiniSearch<Doc>({
    fields: ["name", "alt", "what", "where", "text"],
    storeFields: ["kind"],
    processTerm: (term) => fold(term) || null,
    searchOptions: { boost: { name: 4, alt: 2.5, what: 2, where: 1.5, text: 1 }, prefix: (term) => term.length >= 3, fuzzy: (term) => (term.length >= 5 ? 0.2 : false) },
  });
  mini.addAll(docs);

  // A town of two names answers to either: "Rose Hill" finds Beau Bassin-Rose Hill.
  const placeNames = places
    .flatMap((place) => [place.name, ...(place.kind === "town" && place.name.includes("-") ? place.name.split("-").filter((part) => part.length > 5) : [])].map((name) => ({ folded: fold(name), place })))
    .filter((p, i, all) => all.findIndex((o) => o.folded === p.folded) === i)
    .sort((a, b) => b.folded.length - a.folded.length);
  const categoryWords = categories
    .flatMap((category) => [category.one, category.label, ...category.words].map((word) => ({ folded: fold(word), category })))
    .filter((w) => w.folded.length >= 3)
    .sort((a, b) => b.folded.length - a.folded.length);
  return { mini, placeNames, categoryWords, guideSections };
}

/** `text` with the whole phrase `phrase` taken out, or null if it is not there as whole words. */
function without(text: string, phrase: string): string | null {
  const padded = ` ${text} `;
  const at = padded.indexOf(` ${phrase} `);
  if (at < 0) return null;
  return `${padded.slice(0, at)} ${padded.slice(at + phrase.length + 1)}`.replace(/\s+/g, " ").trim();
}

/** Reads a question: the town it names, the kind of business it names, and the words left over. */
export function understand(query: string): { text: string; place?: Place; category?: Category; rest: string } {
  engine ??= build();
  const text = fold(query);
  let rest = text;
  let place: Place | undefined;
  for (const { folded, place: p } of engine.placeNames) {
    // "pharmacy in curepipe": the word that joins them goes with the town.
    let left: string | null = null;
    for (const joiner of ["in ", "at ", "near ", "around ", "dan ", "dans ", "nan ", ""]) {
      left = without(rest, joiner + folded);
      if (left != null) break;
    }
    if (left == null) continue;
    place = p;
    rest = left;
    break;
  }
  let category: Category | undefined;
  for (const { folded, category: c } of engine.categoryWords) {
    const left = without(rest, folded) ?? without(rest, `${folded}s`) ?? (folded.endsWith("y") ? without(rest, `${folded.slice(0, -1)}ies`) : null);
    if (left == null) continue;
    category = c;
    rest = left;
    break;
  }
  return { text, place, category, rest };
}

export const PAGE_SIZE = 20;

type Options = { kind?: Kind; page?: number; plain?: boolean };

export function search(query: string, { kind, page = 1, plain = false }: Options = {}): Answer {
  engine ??= build();
  const data = index();
  const read = plain ? { text: fold(query), rest: fold(query), place: undefined, category: undefined } : understand(query);
  const { place, category, rest, text } = read;
  const of = (wanted: Kind, words: string, combineWith: "AND" | "OR" = "AND") => (words ? engine!.mini.search(words, { combineWith, filter: (r) => r.kind === wanted }) : []);

  // Listings. With a town or a kind of business read from the question, they are every listing of
  // that kind in that town, ranked by the words left over or, with none left, fullest first.
  let ranked: { l: Listing; score: number }[] = [];
  const fits = (l: Listing) => (!category || l.cat === category.id) && (!place || l.placeSlug === place.slug || l.areaSlug === place.slug);
  if (place || category) {
    if (rest) {
      const scores = new Map(of("listing", rest).map((r) => [(r.id as string).slice(2), r.score]));
      for (const l of data.listings) if (fits(l) && scores.has(l.id)) ranked.push({ l, score: scores.get(l.id)! * (1 + l.full / 12) });
    } else {
      for (const l of data.listings) if (fits(l)) ranked.push({ l, score: l.full });
    }
  } else {
    for (const r of of("listing", text)) {
      const l = data.byId.get((r.id as string).slice(2));
      if (l) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
  }
  // Read as a town or a category and nothing was there: the words were a name. Search them plainly.
  if (!ranked.length && (place || category) && !plain) return search(query, { kind, page, plain: true });
  ranked.sort((a, b) => b.score - a.score || a.l.name.localeCompare(b.l.name));

  // Guides, official pages and websites answer to the whole question, as words.
  const bestSection = new Map<string, { hit: GuideHit; score: number }>();
  for (const r of of("guide", text)) {
    const id = r.id as string;
    const section = engine.guideSections.get(id);
    const guide = data.guideBySlug.get(section ? section.slug : id.slice(2));
    if (!guide) continue;
    const score = r.score * (section ? 1 : 2);
    const best = bestSection.get(guide.slug);
    if (!best || score > best.score) bestSection.set(guide.slug, { hit: { guide, section: section?.heading }, score });
  }
  let guides = [...bestSection.values()].sort((a, b) => b.score - a.score).map((g) => g.hit);
  let official = of("official", text).map((r) => data.official[Number((r.id as string).slice(2))]);
  let sites = of("site", text).map((r) => data.sites[Number((r.id as string).slice(2))]);
  // A question that names a town and found listings there is asking who and where. A guide that
  // happens to hold the same words would only be in the way.
  if (place && ranked.length) {
    guides = [];
    official = [];
    sites = [];
  }

  // Nothing at all for every word together: show what any of the words finds.
  if (!ranked.length && !guides.length && !official.length && !sites.length && text.includes(" ")) {
    for (const r of of("listing", text, "OR").slice(0, 200)) {
      const l = data.byId.get((r.id as string).slice(2));
      if (l) ranked.push({ l, score: r.score });
    }
    official = of("official", text, "OR").slice(0, 20).map((r) => data.official[Number((r.id as string).slice(2))]);
    sites = of("site", text, "OR").slice(0, 20).map((r) => data.sites[Number((r.id as string).slice(2))]);
    const any = new Map<string, GuideHit>();
    for (const r of of("guide", text, "OR").slice(0, 30)) {
      const id = r.id as string;
      const section = engine.guideSections.get(id);
      const guide = data.guideBySlug.get(section ? section.slug : id.slice(2));
      if (guide && !any.has(guide.slug)) any.set(guide.slug, { guide, section: section?.heading });
    }
    guides = [...any.values()];
  }

  const counts: Record<Kind, number> = { listing: ranked.length, guide: guides.length, official: official.length, site: sites.length };
  const { at } = chartPoints();
  const points: number[] = [];
  for (const { l } of ranked) {
    const i = at.get(l.id);
    if (i != null) points.push(i);
  }

  // The first view shows a page of listings and the best few of each other kind; a view of one kind pages through it.
  const start = (Math.max(1, page) - 1) * PAGE_SIZE;
  const cut = <T>(list: T[], few: number, mine: Kind) => (kind === mine ? list.slice(start, start + PAGE_SIZE) : kind ? [] : list.slice(0, few));
  const ways: Way[] = [];
  if (category && place) {
    const n = data.listings.filter(fits).length;
    if (n) ways.push({ href: `/directory/${category.id}/${place.slug}`, label: `${category.label} in ${place.name}`, n });
  }
  if (category) ways.push({ href: `/directory/${category.id}`, label: `${category.label}, all of Mauritius`, n: category.n });
  if (place) ways.push({ href: `/places/${place.slug}`, label: `Everything in ${place.name}`, n: place.n });

  return {
    query,
    place,
    category,
    listings: kind && kind !== "listing" ? [] : ranked.slice(start, start + PAGE_SIZE).map((r) => r.l),
    guides: cut(guides, 3, "guide"),
    official: cut(official, 4, "official"),
    sites: cut(sites, 4, "site"),
    counts,
    ways,
    points,
  };
}

export type Suggestion = { href: string; label: string; note: string; kind: Kind | "way" };

/** A few answers while the question is still being typed, and where its listings are on the chart. */
export function suggest(query: string): { suggestions: Suggestion[]; points: number[]; n: number } {
  if (fold(query).length < 2) return { suggestions: [], points: [], n: 0 };
  const data = index();
  const a = search(query);
  const suggestions: Suggestion[] = [];
  for (const g of a.guides.slice(0, 2)) suggestions.push({ href: `/learn/${g.guide.slug}`, label: g.guide.title, note: "Guide", kind: "guide" });
  for (const w of a.ways.slice(0, 2)) suggestions.push({ href: w.href, label: w.label, note: `${w.n}`, kind: "way" });
  for (const l of a.listings.slice(0, 5)) suggestions.push({ href: `/b/${l.slug}`, label: l.name, note: [data.categoryById.get(l.cat)?.one, whereOf(l)].filter(Boolean).join(", "), kind: "listing" });
  for (const o of a.official.slice(0, 1)) suggestions.push({ href: o.url, label: o.title, note: o.publisher, kind: "official" });
  for (const s of a.sites.slice(0, 1)) suggestions.push({ href: s.url, label: s.name ?? s.title, note: s.host, kind: "site" });
  return { suggestions: suggestions.slice(0, 8), points: a.points.slice(0, 3000), n: a.counts.listing };
}
