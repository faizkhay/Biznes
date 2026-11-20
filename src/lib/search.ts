/**
 * The search: one question over everything the site holds.
 *
 * Four kinds of thing answer: a listing (a business or a service), an answer from the guides (a
 * guide, one of its facts, a glossary term, a tool), an official page, and a Mauritian website the
 * crawler found.
 *
 * A question is read before it is searched. A town in it ("in Curepipe", or just "curepipe")
 * narrows the listings to that town. A kind of business in it ("pharmacy", "farmasi",
 * "quincaillerie") is understood as that category, in English, French or Kreol. A question read
 * that way is about who and where, so listings lead; any other question is about how, so the
 * guides lead.
 *
 * It never passes one thing off as another. A word that names only one kind of thing inside a
 * mixed category ("plumber", among trades) is searched as a word, and the category is offered as a
 * place to look, not as the answer. Words no listing mentions are said to have been left out.
 *
 * The index is MiniSearch, built in memory from data/index the first time it is needed.
 */
import MiniSearch from "minisearch";
import { chartPoints } from "./chart";
import { emergency } from "./emergency";
import { anchorOf, day } from "./format";
import { holidays, longDay } from "./holidays";
import { index, whereOf, type Category, type Listing, type Official, type Place, type Site } from "./index";
import { TOOLS } from "./tools";

export type Kind = "listing" | "guide" | "official" | "site";
export const KINDS: { id: Kind; label: string }[] = [
  { id: "listing", label: "Businesses" },
  { id: "guide", label: "Articles" },
  { id: "official", label: "Official pages" },
  { id: "site", label: "Websites" },
];

/** An answer from the guides: a guide, the fact in it that answers, a glossary term, or a tool. */
export type Lead = {
  tag: "Guide" | "Glossary" | "Tool" | "Number" | "Holiday";
  title: string;
  href: string;
  line: string;
  meta?: string;
  /** The numbers to dial, when the answer is a number to call. */
  call?: string[];
  /** True for a part of an article that only mentions the words: it may be listed, but it is not "the answer". */
  soft?: boolean;
};
export type Way = { href: string; label: string; n: number };

export type Answer = {
  query: string;
  place?: Place;
  category?: Category;
  /** How the question was read, in words, when it was read as more than words. */
  readAs?: string;
  /** Words of the question that no listing mentions, left out so the rest could be answered. */
  ignored?: string;
  /** For a narrower word that is not a category: where such a business would be listed. */
  near?: Way & { word: string };
  /** True when the question is about who and where, so listings lead. */
  who: boolean;
  /** True when nothing matched as written and close spellings are shown instead. */
  spelling: boolean;
  listings: Listing[];
  leads: Lead[];
  official: Official[];
  sites: Site[];
  counts: Record<Kind, number>;
  /**
   * What the listings that answer could be narrowed by, counted before any narrowing: how many
   * have a telephone number, how many a website, and the towns they are in.
   */
  facets: Facets;
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

/** A word without its plural: "pharmacies" and "pharmacy" are the same word, as are "taxis" and "taxi". */
const stem = (word: string) => (word.length > 3 ? word.replace(/ies$/, "y").replace(/(s|x|ch|sh)es$/, "$1").replace(/([^s])s$/, "$1") : word);
const stems = (text: string) => fold(text).split(" ").filter(Boolean).map(stem);

/** Words that join or pad a question and say nothing about a listing. */
const JOINERS = new Set(["in", "at", "near", "around", "dan", "dans", "nan", "a", "de"]);
const PADDING = new Set(["in", "at", "near", "me", "the", "a", "an", "of", "for", "and", "best", "top", "good", "cheap", "open", "now", "nearby", "around", "mauritius", "maurice", "moris", "ile"]);

type Doc = { id: string; kind: Kind; name: string; alt: string; what: string; where: string; text: string };
type Phrase<T> = { tokens: string[]; of: T };

type Engine = {
  mini: MiniSearch<Doc>;
  places: Phrase<Place>[];
  categories: Phrase<Category>[];
  hints: Phrase<Category>[];
  leads: Map<string, { lead: Lead; guide?: string; weight: number; whole: boolean; /** A part's own heading, folded: the words that make it an answer and not a mention. */ heading?: string }>;
};

/**
 * Words that make a question about how, not a search for a business: "register a company" asks
 * how, although "company" is also a kind of listing. Such a question is not read as a category.
 */
const ASKING = /^(how|what|when|why|which|who|can|do|does|is|are|should|where (can|do|to)|comment|kan|kouma|ki)\b|\b(register|registering|registration|incorporate|incorporating|apply|applying|application|renew|renewal|start|starting|set up|setting up|become|cost|costs|fee|fees|price|rate|rates|threshold|deadline|requirements?|documents?|procedure|steps|rules|law|laws|meaning|definition)\b/;

let engine: Engine | undefined;

function build(): Engine {
  const { listings, guides, official, sites, categories, places, categoryById, glossary } = index();
  const docs: Doc[] = [];
  for (const l of listings) {
    const c = categoryById.get(l.cat);
    docs.push({
      id: `l:${l.id}`,
      kind: "listing",
      name: l.name,
      alt: [...(l.alt ?? []), l.brand ?? ""].join(" "),
      // Only the words that mean the whole category: a narrower word must be in the listing itself.
      what: [c?.one, c?.label, ...(c?.words ?? []), l.kind ?? ""].join(" "),
      where: [l.area, l.place, l.district, l.street, l.seat].filter(Boolean).join(" "),
      text: l.about ?? "",
    });
  }

  const leads: Engine["leads"] = new Map();
  const lead = (id: string, doc: Omit<Doc, "id" | "kind" | "where">, entry: { lead: Lead; guide?: string; weight: number; whole: boolean; heading?: string }) => {
    docs.push({ id, kind: "guide", where: "", ...doc });
    leads.set(id, entry);
  };
  for (const g of guides) {
    const meta = `Checked ${day(g.checked)}`;
    lead(`g:${g.slug}`, { name: g.title, alt: "", what: g.summary, text: "" }, { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}`, line: g.summary, meta }, guide: g.slug, weight: 2, whole: true });
    g.facts.forEach((f, i) =>
      lead(
        `f:${g.slug}#${i}`,
        { name: f.label, alt: g.title, what: f.value, text: f.detail ?? "" },
        // A fact answers a question outright: it is shown as the answer, with the guide it is from.
        { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}#glance`, line: `${f.label}: ${f.value}.${f.detail ? ` ${f.detail}` : ""}`, meta }, guide: g.slug, weight: 2.6, whole: true },
      ),
    );
    g.sections.forEach((section, i) => {
      const words = section.blocks.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : [...b.columns, ...b.rows.flat()].join(" "))).join(" ");
      // A part of an article answers with its own opening words, not with a pointer to itself.
      const first = section.blocks.find((b) => "text" in b);
      const opening = first && "text" in first ? first.text : "";
      const cut = opening.length > 320 ? `${opening.slice(0, 320).replace(/[^.!?]*$/, "") || `${opening.slice(0, 300)}...`}` : opening;
      lead(`g:${g.slug}#${i}`, { name: section.heading, alt: g.title, what: "", text: words }, { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}#${anchorOf(section.heading)}`, line: !cut ? `In it: ${section.heading}.` : section.heading.endsWith("?") ? cut : `${section.heading.replace(/\.$/, "")}: ${cut}`, meta }, guide: g.slug, weight: 1, whole: false, heading: fold(section.heading) });
    });
  }
  // The emergency numbers and the public holidays answer by themselves: the number, the date.
  const numbers = emergency();
  numbers?.groups.forEach((group) =>
    group.items.forEach((item, i) =>
      lead(
        `e:${group.id}#${i}`,
        { name: item.name, alt: `${group.label} emergency number telephone call`, what: item.number, text: item.what },
        { lead: { tag: "Number", title: "Emergency numbers", href: `/emergency#g-${group.id}`, line: `${item.name}: ${[item.number, ...(item.also ?? [])].join(" or ")}. ${item.what}`, meta: `Checked ${day(numbers.checked)}`, call: [item.number, ...(item.also ?? [])] }, weight: group.id === "emergency" ? 4 : 2, whole: true },
      ),
    ),
  );
  const dates = holidays();
  if (dates) {
    const byName = new Map<string, string[]>();
    for (const year of Object.keys(dates.years).sort()) for (const h of dates.years[year]) byName.set(h.name, [...(byName.get(h.name) ?? []), longDay(h.date)]);
    let n = 0;
    for (const [name, days] of byName) lead(`h:${n++}`, { name, alt: "public holiday date when is", what: days.join(" "), text: "" }, { lead: { tag: "Holiday", title: "Public holidays in Mauritius", href: "/holidays", line: `${name}: ${days.join(", and ")}.`, meta: `Checked ${day(dates.checked)}` }, weight: 2, whole: true });
    lead("h:all", { name: "Public holidays in Mauritius", alt: "bank holidays calendar jours feries konze piblik", what: Object.keys(dates.years).join(" "), text: "" }, { lead: { tag: "Holiday", title: "Public holidays in Mauritius", href: "/holidays", line: `Every public holiday of ${Object.keys(dates.years).sort().join(" and ")}, with the day of the week it falls on.`, meta: `Checked ${day(dates.checked)}` }, guide: "holidays", weight: 2, whole: true });
  }
  glossary.forEach((t, i) => lead(`t:${i}`, { name: `${t.term} ${t.full ?? ""}`, alt: "", what: "", text: t.meaning }, { lead: { tag: "Glossary", title: t.full ? `${t.term}: ${t.full}` : t.term, href: `/learn/glossary#${anchorOf(t.term)}`, line: t.meaning }, weight: 1.4, whole: true }));
  TOOLS.forEach((t, i) => lead(`x:${i}`, { name: t.title, alt: "calculator tool", what: t.what, text: "" }, { lead: { tag: "Tool", title: t.title, href: t.href, line: t.what }, weight: 1.3, whole: true }));

  official.forEach((o, i) => docs.push({ id: `o:${i}`, kind: "official", name: o.title, alt: o.publisher, what: o.what, where: "", text: o.host ?? "" }));
  sites.forEach((s, i) => docs.push({ id: `s:${i}`, kind: "site", name: s.name ?? s.title, alt: s.title, what: s.host, where: "", text: s.about ?? "" }));

  const mini = new MiniSearch<Doc>({
    fields: ["name", "alt", "what", "where", "text"],
    storeFields: ["kind"],
    processTerm: (term) => fold(term) || null,
    searchOptions: { boost: { name: 4, alt: 2.5, what: 2, where: 1.5, text: 1 }, prefix: (term) => term.length >= 3, fuzzy: (term) => (term.length >= 5 ? 0.2 : false) },
  });
  mini.addAll(docs);

  const longest = <T>(a: Phrase<T>, b: Phrase<T>) => b.tokens.length - a.tokens.length || b.tokens.join("").length - a.tokens.join("").length;
  const unique = <T>(list: Phrase<T>[]) => list.filter((p, i, all) => p.tokens.length > 0 && all.findIndex((o) => o.tokens.join(" ") === p.tokens.join(" ")) === i);
  // A town of two names answers to either: "Rose Hill" finds Beau Bassin-Rose Hill.
  const placePhrases = places.flatMap((place) =>
    [place.name, ...(place.kind === "town" && place.name.includes("-") ? place.name.split("-").filter((part) => part.length > 5) : [])].map((name) => ({ tokens: fold(name).split(" ").filter(Boolean), of: place })),
  );
  // A town comes before a neighbourhood of the same name.
  placePhrases.sort((a, b) => longest(a, b) || (a.of.kind === "town" ? -1 : 1));
  return {
    mini,
    places: unique(placePhrases),
    // A catch-all ("Other shops") does not answer to its bare noun: "shop" is not a search for it.
    categories: unique(categories.flatMap((c) => [...(c.id.startsWith("other-") ? [] : [c.one]), c.label, ...c.words].map((word) => ({ tokens: stems(word), of: c }))).filter((p) => p.tokens.join("").length >= 3)).sort(longest),
    hints: unique(categories.flatMap((c) => (c.hints ?? []).map((word) => ({ tokens: stems(word), of: c })))).sort(longest),
    leads,
  };
}

/** Where `phrase` starts in `tokens`, as whole words in order, or -1. */
function find(tokens: string[], phrase: string[]): number {
  for (let i = 0; i + phrase.length <= tokens.length; i++) if (phrase.every((word, j) => tokens[i + j] === word)) return i;
  return -1;
}

/** Reads a question: the town it names, the kind of business it names, and the words left over. */
export function understand(query: string): { text: string; place?: Place; category?: Category; hint?: { category: Category; word: string }; rest: string } {
  engine ??= build();
  const text = fold(query);
  let tokens = text.split(" ").filter(Boolean);

  let place: Place | undefined;
  for (const p of engine.places) {
    const at = find(tokens, p.tokens);
    if (at < 0) continue;
    place = p.of;
    // "pharmacy in curepipe": the word that joins them goes with the town.
    const from = at > 0 && JOINERS.has(tokens[at - 1]) ? at - 1 : at;
    tokens = [...tokens.slice(0, from), ...tokens.slice(at + p.tokens.length)];
    break;
  }

  let category: Category | undefined;
  const stemmed = tokens.map(stem);
  // A question about how names no kind of business, whatever nouns it holds. A town in it still counts.
  const asking = !place && ASKING.test(text);
  for (const c of asking ? [] : engine.categories) {
    const at = find(stemmed, c.tokens);
    if (at < 0) continue;
    category = c.of;
    tokens = [...tokens.slice(0, at), ...tokens.slice(at + c.tokens.length)];
    break;
  }
  let hint: { category: Category; word: string } | undefined;
  if (!category && !asking) {
    for (const h of engine.hints) {
      const at = find(stemmed, h.tokens);
      if (at >= 0) {
        hint = { category: h.of, word: tokens.slice(at, at + h.tokens.length).join(" ") };
        break;
      }
    }
  }
  return { text, place, category, hint, rest: tokens.filter((word) => !PADDING.has(word)).join(" ") };
}

export const PAGE_SIZE = 20;

/** Ways to narrow a list of listings: only those with a telephone number, with a website, in one town. */
export type Narrow = { phone?: boolean; web?: boolean; town?: string };
export type Facets = { all: number; phone: number; web: number; towns: { slug: string; name: string; n: number }[] };

/** Reads the narrowing out of a page's address. */
export const narrowOf = (params: { phone?: string; web?: string; town?: string }): Narrow => ({ phone: params.phone === "1", web: params.web === "1", town: params.town ? params.town.slice(0, 80) : undefined });

/** Counts what a list could be narrowed by, and narrows it. */
export function narrowed(listings: Listing[], narrow: Narrow = {}): { facets: Facets; listings: Listing[] } {
  const towns = new Map<string, { slug: string; name: string; n: number }>();
  let phone = 0;
  let web = 0;
  for (const l of listings) {
    if (l.phone?.length) phone++;
    if (l.web) web++;
    if (l.placeSlug && l.place) {
      const town = towns.get(l.placeSlug);
      if (town) town.n++;
      else towns.set(l.placeSlug, { slug: l.placeSlug, name: l.place, n: 1 });
    }
  }
  const facets = { all: listings.length, phone, web, towns: [...towns.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)) };
  const { phone: p, web: w, town } = narrow;
  return { facets, listings: p || w || town ? listings.filter((l) => (!p || l.phone?.length) && (!w || l.web) && (!town || l.placeSlug === town)) : listings };
}

type Options = { kind?: Kind; page?: number; plain?: boolean; narrow?: Narrow };

export function search(query: string, { kind, page = 1, plain = false, narrow }: Options = {}): Answer {
  engine ??= build();
  const e = engine;
  const data = index();
  const read = plain ? { text: fold(query), rest: fold(query), place: undefined, category: undefined, hint: undefined } : understand(query);
  const { place, category, rest, text } = read;
  // A word is matched as written, or as the start of a longer word. Close spellings are tried only
  // when that finds nothing, and the page then says so.
  const of = (wanted: Kind, words: string, combineWith: "AND" | "OR" = "AND", close = false) =>
    words ? e.mini.search(words, { combineWith, filter: (r) => r.kind === wanted, fuzzy: close ? (term) => (term.length >= 5 ? 0.2 : false) : false }) : [];
  let spelling = false;

  // Listings. With a town or a kind of business read from the question, they are every listing of
  // that kind in that town, ranked by the words left over or, with none left, fullest first.
  let ranked: { l: Listing; score: number }[] = [];
  let ignored: string | undefined;
  const fits = (l: Listing) => (!category || l.cat === category.id) && (!place || l.placeSlug === place.slug || l.areaSlug === place.slug);
  if (place || category) {
    if (rest) {
      for (const close of [false, true]) {
        const scores = new Map(of("listing", rest, "AND", close).map((r) => [(r.id as string).slice(2), r.score]));
        for (const l of data.listings) if (fits(l) && scores.has(l.id)) ranked.push({ l, score: scores.get(l.id)! * (1 + l.full / 12) });
        if (ranked.length) {
          spelling = close;
          break;
        }
      }
    } else {
      for (const l of data.listings) if (fits(l)) ranked.push({ l, score: l.full });
    }
    if (!ranked.length && !plain) {
      // Read as a town or a kind and nothing fits. The words may be a name: search them plainly.
      const named = search(query, { kind, page, plain: true, narrow });
      if (named.counts.listing > 0 || !rest) return named;
      // Not a name either. Answer the part that was understood, and say which words were left out.
      for (const l of data.listings) if (fits(l)) ranked.push({ l, score: l.full });
      if (!ranked.length) return named;
      ignored = rest;
    }
  } else {
    for (const r of of("listing", text)) {
      const l = data.byId.get((r.id as string).slice(2));
      if (l) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
  }
  const who = Boolean(place || category) && ranked.length > 0;

  // Answers from the guides: one a guide (its best part), and each glossary term and tool that answers.
  const asked = text.split(" ").filter((word) => word && !PADDING.has(word));
  const collect = (hits: { id: unknown; score: number }[]) => {
    const best = new Map<string, { lead: Lead; score: number }>();
    for (const r of hits) {
      const entry = e.leads.get(r.id as string);
      // A question about who and where is not answered by a passing mention deep in a guide.
      if (!entry || (who && !entry.whole)) continue;
      const key = entry.guide ?? (r.id as string);
      const score = r.score * entry.weight;
      // A part of an article answers when the question's words are in its own heading; else it only mentions them.
      const soft = entry.heading != null && !asked.every((word) => entry.heading!.includes(word));
      if (!best.has(key) || score > best.get(key)!.score) best.set(key, { lead: soft ? { ...entry.lead, soft: true } : entry.lead, score });
    }
    return [...best.values()].sort((a, b) => b.score - a.score).map((b) => b.lead);
  };
  let leads = collect(of("guide", text));
  let official = of("official", text).map((r) => data.official[Number((r.id as string).slice(2))]);
  let sites = of("site", text).map((r) => data.sites[Number((r.id as string).slice(2))]);
  // Nothing matches as written: try close spellings. Not for a word that names a kind of business
  // the index may simply not hold ("plumber" must not find "lumber").
  if (!ranked.length && !leads.length && !official.length && !sites.length && !read.hint) {
    for (const r of of("listing", text, "AND", true)) {
      const l = data.byId.get((r.id as string).slice(2));
      if (l) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
    leads = collect(of("guide", text, "AND", true));
    official = of("official", text, "AND", true).map((r) => data.official[Number((r.id as string).slice(2))]);
    spelling = ranked.length + leads.length + official.length > 0;
  }
  ranked.sort((a, b) => b.score - a.score || a.l.name.localeCompare(b.l.name));
  // A question that names a town and found listings there is asking who and where. A guide that
  // happens to hold the same words would only be in the way.
  if (place && ranked.length) {
    leads = [];
    official = [];
    sites = [];
  }

  // Nothing at all for every word together: show what any of the words finds.
  if (!ranked.length && !leads.length && !official.length && !sites.length && text.includes(" ")) {
    for (const r of of("listing", text, "OR").slice(0, 200)) {
      const l = data.byId.get((r.id as string).slice(2));
      if (l) ranked.push({ l, score: r.score });
    }
    leads = collect(of("guide", text, "OR").slice(0, 40)).slice(0, 6);
    official = of("official", text, "OR").slice(0, 20).map((r) => data.official[Number((r.id as string).slice(2))]);
    sites = of("site", text, "OR").slice(0, 20).map((r) => data.sites[Number((r.id as string).slice(2))]);
  }

  // Narrowing is the visitor's own choice, made after the question is answered: it takes listings
  // out, and never changes their order.
  const { facets, listings: keep } = narrowed(ranked.map((r) => r.l), narrow);
  if (keep.length !== ranked.length) {
    const kept = new Set(keep);
    ranked = ranked.filter((r) => kept.has(r.l));
  }

  // A question that is a business's own name ("MCB") is about who, unless one of our pages truly answers it.
  const named = !who && ranked.length > 0 && asked.length > 0 && asked.every((word) => fold(ranked[0].l.name).split(" ").includes(word)) && !leads.some((lead) => !lead.soft);

  const counts: Record<Kind, number> = { listing: ranked.length, guide: leads.length, official: official.length, site: sites.length };
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

  const kept = ignored ? "" : rest;
  const readAs = !who
    ? undefined
    : category && place
      ? `${category.label} in ${place.name}${kept ? `, matching “${kept}”` : ""}`
      : category
        ? `${category.label}${kept ? `, matching “${kept}”` : ""}`
        : kept
          ? `“${kept}” in ${place!.name}`
          : `everything in ${place!.name}`;

  return {
    query,
    place,
    category,
    readAs,
    ignored,
    // Offered only when the guides do not answer: "tax" is a question, "plumber" is a search for one.
    near: read.hint && !category && !leads.length ? { href: `/directory/${read.hint.category.id}`, label: read.hint.category.label, n: read.hint.category.n, word: read.hint.word } : undefined,
    who: who || named,
    spelling,
    listings: kind && kind !== "listing" ? [] : ranked.slice(start, start + PAGE_SIZE).map((r) => r.l),
    leads: cut(leads, who ? 2 : 3, "guide"),
    official: cut(official, 4, "official"),
    sites: cut(sites, 4, "site"),
    counts,
    facets,
    ways,
    points,
  };
}

export type Suggestion = { href: string; label: string; note: string; kind: Kind | "way" };

/** A few answers while the question is still being typed, and where its listings are on the chart. */
export function suggest(query: string): { suggestions: Suggestion[]; points: number[]; n: number } {
  const text = fold(query);
  if (text.length < 2) return { suggestions: [], points: [], n: 0 };
  engine ??= build();
  const data = index();
  const a = search(query);
  const suggestions: Suggestion[] = [];
  const add = (s: Suggestion) => {
    if (suggestions.length < 8 && !suggestions.some((o) => o.href === s.href)) suggestions.push(s);
  };
  for (const w of a.ways.slice(0, 2)) add({ href: w.href, label: w.label, note: `${w.n}`, kind: "way" });
  // A word still being typed: the categories and towns it is the start of.
  if (!a.category && !a.place && text.length >= 3 && !text.includes(" ")) {
    for (const c of [...data.categories].filter((c) => [c.one, c.label, ...c.words].some((w) => fold(w).startsWith(text))).sort((x, y) => y.n - x.n).slice(0, 2)) add({ href: `/directory/${c.id}`, label: c.label, note: `${c.n}`, kind: "way" });
    for (const p of [...data.places].filter((p) => fold(p.name).startsWith(text)).sort((x, y) => y.n - x.n).slice(0, 2)) add({ href: `/places/${p.slug}`, label: `Everything in ${p.name}`, note: `${p.n}`, kind: "way" });
  }
  const leads = () => a.leads.slice(0, 2).forEach((l) => add({ href: l.href, label: l.title, note: l.tag === "Guide" ? "Article" : l.tag, kind: "guide" }));
  // A question about how is answered by the guides first; one about who and where, by listings.
  if (!a.who && a.counts.listing < 3) leads();
  for (const l of a.listings.slice(0, 5)) add({ href: `/b/${l.slug}`, label: l.name, note: [data.categoryById.get(l.cat)?.one, whereOf(l)].filter(Boolean).join(", "), kind: "listing" });
  leads();
  for (const o of a.official.slice(0, 1)) add({ href: o.url, label: o.title, note: o.publisher, kind: "official" });
  for (const s of a.sites.slice(0, 1)) add({ href: s.url, label: s.name ?? s.title, note: s.host, kind: "site" });
  return { suggestions, points: a.points.slice(0, 3000), n: a.counts.listing };
}
