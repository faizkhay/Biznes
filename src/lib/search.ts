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
 * that way is about who and where; any other question is about how.
 *
 * The order of what answers is the same for every question, and the page keeps to it: the pages
 * of this site that truly answer (an article, one of its facts, a number to call, a holiday's
 * date, a glossary term, a tool) come first; then businesses; then the parts of articles that
 * only mention the words; then pages on other sites. The site says so on /data.
 *
 * It never passes one thing off as another. A word that names only one kind of thing inside a
 * mixed category ("plumber", among trades) is searched as a word, and the category is offered as a
 * place to look, not as the answer. A dish ("pizza") is looked for in every place to eat, not read
 * as the one category its word happens to sit in. A page of ours counts as an answer only when the
 * question's words are in its own title, label or heading; a number or a date, only when they are
 * there whole. Words no listing mentions are said to have been left out.
 *
 * A business asked for by its own name is given first. A name that reads as a kind of business in
 * a town ("Phoenix Assurance", "Ebene Pharmacy") is still that business, wherever it is; and a
 * name is tried as it was written before any close spelling of a part of it.
 *
 * A typing mistake is answered and said to be one. A town or a kind of business typed wrongly
 * ("curpipe", "restorant") is read as the word meant when one word is plainly the nearest; any
 * other word is given close spellings only when nothing matched as written.
 *
 * Finding the documents that hold a question's words, and putting them in order, is the engine's
 * work (src/lib/engine.ts, which says how). It is built in memory from data/index the first time
 * it is needed.
 */
import { ARTICLE_BUSINESSES, PAGES } from "@/data/site";
import { chartPoints } from "./chart";
import { emergency } from "./emergency";
import { Engine, fold } from "./engine";
import { anchorOf, count, day } from "./format";
import { holidays, longDay } from "./holidays";
import { index, whereOf, type Category, type Guide, type Listing, type Official, type Place, type Site } from "./index";
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
  tag: "Guide" | "Glossary" | "Tool" | "Number" | "Holiday" | "Page";
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
  /** True when nothing held every word of the question, and what holds any one of them is shown instead. */
  loose: boolean;
  listings: Listing[];
  /** The pages of this site that answer: shown first. In the view of articles alone, every one that answers or mentions, a page at a time. */
  leads: Lead[];
  /** Parts of articles that only mention the words: shown after the businesses. */
  mentions: Lead[];
  /** For a question about who and where: what the index holds for it, in a sentence of real counts. */
  summary?: string;
  /** Searches near this one, built from the index: the same kind in nearby and larger towns, the kind across the island. */
  related: Way[];
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

/** Lower case, unaccented, punctuation to spaces. The engine folds a document's words the same way. */
export { fold };

/** A word without its plural: "pharmacies" and "pharmacy" are the same word, as are "taxis" and "taxi". */
const stem = (word: string) => (word.length > 3 ? word.replace(/ies$/, "y").replace(/(s|x|ch|sh)es$/, "$1").replace(/([^s])s$/, "$1") : word);
const stems = (text: string) => fold(text).split(" ").filter(Boolean).map(stem);

/** Words that join or pad a question and say nothing about a listing. */
const JOINERS = new Set(["in", "at", "near", "around", "dan", "dans", "nan", "a", "de"]);
const PADDING = new Set([
  ...["in", "at", "near", "me", "the", "a", "an", "of", "for", "and", "best", "top", "good", "cheap", "open", "now", "nearby", "around", "mauritius", "maurice", "moris", "ile"],
  // What a person adds when asking aloud, in English, French and Kreol.
  ...["where", "to", "find", "i", "need", "want", "looking", "some", "any", "there", "my", "number", "phone", "telephone", "contact"],
  ...["un", "une", "le", "la", "les", "des", "du", "dans", "pour", "avec", "et", "ou", "je", "mon", "ma", "pres", "proche", "trouver", "cherche", "numero"],
  ...["kot", "kote", "dan", "nan", "pou", "ek", "mo", "bizin", "rod", "enn", "sa", "nimero"],
]);
/** Words that ask and do not say what about. They are not held against a page that answers. */
const ASKS = new Set(["how", "what", "when", "why", "which", "who", "can", "do", "does", "is", "are", "should", "you", "much", "many", "long", "comment", "quand", "combien", "quel", "quelle", "que", "quoi", "kan", "kouma", "ki", "kifer", "komie"]);

/**
 * The articles are written in English. A question in French or Kreol is put into the articles'
 * own words before they are searched: whole phrases first, then single words. Kinds of business
 * are not here; each category carries its own French and Kreol words (crawler/taxonomy.mjs).
 */
const SAID_PHRASES: [string, string][] = [
  ["start a business", "register a business"],
  ["open a business", "register a business"],
  ["ouvrir une entreprise", "register a business"],
  ["creer une entreprise", "register a business"],
  ["ouver enn biznes", "register a business"],
  ["start a company", "incorporate a company"],
  ["open a company", "incorporate a company"],
  ["creer une societe", "incorporate a company"],
  ["creer une compagnie", "incorporate a company"],
  ["ki pou fer", "things to do"],
  ["que faire", "things to do"],
  ["quoi faire", "things to do"],
  ["salaire minimum", "minimum wage"],
  ["permis de travail", "work permit"],
  ["permis de conduire", "driving licence"],
  ["permi kondir", "driving licence"],
  ["compte bancaire", "bank account"],
  ["kont labank", "bank account"],
  ["carte d identite", "identity card"],
  ["kart idantite", "identity card"],
  ["fuseau horaire", "time zone"],
  ["what time", "time zone"],
  ["jours feries", "public holidays"],
  ["jour ferie", "public holiday"],
  ["saison cyclonique", "cyclone season"],
];
const SAID: Record<string, string> = {
  entreprise: "business", biznes: "business", compagnie: "company", societe: "company", konpani: "company",
  creer: "register", enregistrer: "register", anrezistre: "register", ouvrir: "open", ouver: "open",
  tva: "vat", impot: "tax", impots: "tax", taxe: "tax", taxes: "tax", lataks: "tax",
  salaire: "wage", lapey: "wage", travail: "work", travay: "work",
  meteo: "weather", lameteo: "weather", siklonn: "cyclone", cyclones: "cyclone",
  monnaie: "currency", roupie: "rupee", roupi: "rupee", popilasion: "population", capitale: "capital", kapital: "capital",
  plage: "beach", plages: "beaches", laplaz: "beach", passeport: "passport", paspor: "passport",
  langue: "language", langues: "languages", lang: "language", histoire: "history", zistwar: "history",
  gouvernement: "government", gouvernman: "government", loyer: "rent", louer: "rent",
  electricite: "electricity", kouran: "electricity", eau: "water", delo: "water", facture: "bill",
  banque: "bank", labank: "bank", urgence: "emergency", irzans: "emergency", pompiers: "fire", pompier: "fire", ponpie: "fire",
  lapolis: "police", lanbilans: "ambulance", lopital: "hospital", hopital: "hospital", dokter: "doctor", docteur: "doctor", medecin: "doctor", farmasi: "pharmacy", pharmacie: "pharmacy", patente: "licence", marque: "trade mark", conge: "holiday", konze: "holiday",
};
/** A question with its French and Kreol phrases put into English: "ki pou fer" is "things to do". */
function phrased(text: string): string {
  let out = ` ${text} `;
  for (const [from, to] of SAID_PHRASES) out = out.replace(` ${from} `, ` ${to} `);
  return out.trim();
}
/** A question in the articles' own words. */
function said(text: string): string {
  // "Biznes" is Kreol for business, and it is also this site's name: before "mu" it is left as it is.
  const words = phrased(text)
    .split(" ")
    .map((word, i, all) => (word === "biznes" && all[i + 1] === "mu" ? word : (SAID[word] ?? word)));
  // "Time in Mauritius" asks for the time zone: on its own the word finds every fact with a time in it.
  const telling = words.filter((word) => !PADDING.has(word) && !ASKS.has(word));
  return telling.length === 1 && telling[0] === "time" ? "time zone" : words.join(" ");
}

/**
 * Words of the categories for eating and drinking that name a dish or a thing sold, not a kind of
 * place. "Pizza" is sold by restaurants as well as by takeaways, so it is looked for in every
 * place to eat, by name, by the map's own word for the cuisine and by its description.
 */
const DISHES = new Set(["mine", "dholl puri", "roti", "burger", "pizza", "gato", "gateaux", "cake", "bread", "dipin", "sweets", "ice cream", "glace", "coffee", "cocktail", "drinks"]);

type Doc = { id: string; kind: Kind; name: string; alt: string; what: string; where: string; text: string };
type LeadEntry = {
  lead: Lead;
  guide?: string;
  weight: number;
  /** False for a part of an article: for a question about who and where it is never listed. */
  whole: boolean;
  /** True for an article as a whole: its title and its summary. */
  article?: boolean;
  /** The words that make it an answer and not a mention: its own title, label or heading, stemmed. */
  key: string[];
  /** For a part of an article: the words of its own label or heading alone, without the article's title. */
  own?: string[];
  /** For an article and its parts: the words of the article's title. */
  title?: string[];
  /** A number to call or a holiday's date answers only when the question's words are in it whole. */
  exact?: boolean;
  /** Words of which the question must hold one: the list of holidays is not an answer to "bank". */
  need?: string[];
};
type Phrase<T> = { tokens: string[]; of: T };
/** A list of phrases by the first word of each, every phrase with its place in the list: a question's words find their phrases without the list being read. */
type ByWord<T> = Map<string, { rank: number; phrase: Phrase<T> }[]>;

/**
 * The fields of a document, as the engine weighs them. A word in a name says most; then another
 * name; then the kind of business; then the address; then a description. `length` is how far a
 * long field is held against a word in it: a name fully, a category's list of words and an address
 * hardly, since their length says nothing about the business. A question that is a whole name
 * counts double.
 */
const FIELDS = [
  { name: "name", weight: 4, length: 0.6, whole: 2 },
  { name: "alt", weight: 2.5, length: 0.5 },
  { name: "what", weight: 2, length: 0.2 },
  { name: "where", weight: 1.5, length: 0.2 },
  { name: "text", weight: 1, length: 0.5 },
];

type Built = {
  engine: Engine;
  /** Towns, kinds of business and narrower words, each list the longest phrase first. */
  places: ByWord<Place>;
  categories: ByWord<Category>;
  hints: ByWord<Category>;
  /** The index's listings by kind of business, by town or neighbourhood, and those for eating, in the index's order. */
  byCategory: Map<string, Listing[]>;
  byPlace: Map<string, Listing[]>;
  eating: Listing[];
  /** A word of a town's name as it is written, by the word as the engine holds it: "vacoa" is "vacoas". */
  townWords: Map<string, string>;
  leads: Map<string, LeadEntry>;
  /** The categories for eating and drinking, and those for health. */
  eat: Set<string>;
  health: Set<string>;
  /** The articles that go with a kind of business (ARTICLE_BUSINESSES in src/data/site.ts, read the other way). */
  articlesFor: Map<string, string[]>;
  /** The overlay now in the index, by its stamp, and the documents it added. */
  laid?: number;
  laidIds: string[];
};

/**
 * Businesses listed by their owners, laid over the index for a search (src/lib/accounts/owned.ts).
 * `extras` are the live ones that are not in the open index, in a listing's shape. `paid` holds
 * the ids of the rows, in the index or among the extras, that are verified and on Biznes Go or
 * Biznes Grow today. With no overlay the search is exactly the index's own.
 */
export type Overlay = { stamp: number; extras: Listing[]; byId: Map<string, Listing>; paid: Set<string> };

/**
 * Words that make a question about how, not a search for a business: "register a company" asks
 * how, although "company" is also a kind of listing. Such a question is not read as a category.
 */
const ASKING = /^(how|what|when|why|which|who|can|do|does|is|are|should|where (can|do|to)|comment|kan|kouma|ki)\b|\b(register|registering|registration|incorporate|incorporating|apply|applying|application|renew|renewal|start|starting|set up|setting up|become|open an?|ouvrir|ouver|creer|cost|costs|fee|fees|price|rate|rates|threshold|deadline|requirements?|documents?|procedure|steps|rules|law|laws|meaning|definition)\b/;

let built: Built | undefined;

/**
 * The words that mean a whole category, once each: "Hotel", "Hotels and resorts" and "hôtel" are
 * one word said three times, and a listing is no more a hotel for it.
 */
const categoryWords = new Map<string, string>();
function wordsOf(c: Category): string {
  let words = categoryWords.get(c.id);
  if (words === undefined) {
    const seen = new Set<string>();
    words = [c.one, c.label, ...c.words]
      .flatMap((phrase) => fold(phrase).split(" "))
      .filter((word) => word && !seen.has(stem(word)) && seen.add(stem(word)))
      .join(" ");
    categoryWords.set(c.id, words);
  }
  return words;
}

/** A listing as the index searches it. */
function docOf(l: Listing, c: Category | undefined): Doc {
  return {
    id: `l:${l.id}`,
    kind: "listing",
    name: l.name,
    alt: [...(l.alt ?? []), l.brand ?? ""].join(" "),
    // Only the words that mean the whole category: a narrower word must be in the listing itself.
    what: [c ? wordsOf(c) : "", l.kind ?? ""].join(" "),
    where: [l.area, l.place, l.district, l.street, l.seat].filter(Boolean).join(" "),
    // What the map notes about it besides: "Delivery", "Takeaway", "Wi-Fi".
    text: [l.about ?? "", ...(l.extras ?? [])].join(" "),
  };
}

/** Puts an overlay's extra businesses into the index, in place of the last overlay's. */
function lay(e: Built, overlay: Overlay) {
  if (e.laid === overlay.stamp) return;
  const { categoryById } = index();
  for (const id of e.laidIds) e.engine.discard(id);
  const docs = overlay.extras.map((l) => docOf(l, categoryById.get(l.cat)));
  e.engine.addAll(docs);
  e.laidIds = docs.map((d) => d.id);
  e.laid = overlay.stamp;
}

function build(): Built {
  const { listings, guides, official, sites, categories, places, categoryById, glossary } = index();
  const docs: Doc[] = [];
  for (const l of listings) docs.push(docOf(l, categoryById.get(l.cat)));

  const leads: Built["leads"] = new Map();
  const lead = (id: string, doc: Omit<Doc, "id" | "kind" | "where">, entry: LeadEntry) => {
    docs.push({ id, kind: "guide", where: "", ...doc });
    leads.set(id, { ...entry, key: [...new Set(entry.key.flatMap(stems))], own: entry.own?.flatMap(stems), title: entry.title?.flatMap(stems), need: entry.need?.flatMap(stems) });
  };
  // A body is asked for by its initials: the Central Electricity Board is "CEB". They are the name's own.
  const initials = (name: string) => (name.match(/(?:\b[A-Z][a-z]+ ){2,}[A-Z][a-z]+/g) ?? []).map((run) => run.split(" ").map((word) => word[0]).join("")).join(" ");
  for (const g of guides) {
    const meta = `Checked ${day(g.checked)}`;
    lead(`g:${g.slug}`, { name: g.title, alt: "", what: g.summary, text: "" }, { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}`, line: g.summary, meta }, guide: g.slug, weight: 2, whole: true, article: true, key: [g.title, g.summary], title: [g.title] });
    g.facts.forEach((f, i) =>
      lead(
        `f:${g.slug}#${i}`,
        { name: f.label, alt: g.title, what: f.value, text: f.detail ?? "" },
        // A fact answers a question outright when the question names it: it is shown as the answer, with the article it is from.
        { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}#glance`, line: `${f.label}: ${f.value}.${f.detail ? ` ${f.detail}` : ""}`, meta }, guide: g.slug, weight: 2.6, whole: true, key: [f.label, g.title], own: [f.label], title: [g.title] },
      ),
    );
    g.sections.forEach((section, i) => {
      const words = section.blocks.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : [...b.columns, ...b.rows.flat()].join(" "))).join(" ");
      // A part of an article answers with its own opening words, not with a pointer to itself.
      const first = section.blocks.find((b) => "text" in b);
      const opening = first && "text" in first ? first.text : "";
      const cut = opening.length > 320 ? `${opening.slice(0, 320).replace(/[^.!?]*$/, "") || `${opening.slice(0, 300)}...`}` : opening;
      lead(`g:${g.slug}#${i}`, { name: section.heading, alt: g.title, what: "", text: words }, { lead: { tag: "Guide", title: g.title, href: `/learn/${g.slug}#${anchorOf(section.heading)}`, line: !cut ? `In it: ${section.heading}.` : section.heading.endsWith("?") ? cut : `${section.heading.replace(/\.$/, "")}: ${cut}`, meta }, guide: g.slug, weight: 1, whole: false, key: [section.heading, g.title], own: [section.heading], title: [g.title] });
    });
  }
  // The emergency numbers and the public holidays answer by themselves: the number, the date.
  const numbers = emergency();
  numbers?.groups.forEach((group) =>
    group.items.forEach((item, i) =>
      lead(
        `e:${group.id}#${i}`,
        { name: item.name, alt: `${group.label} ${initials(item.name)} emergency number telephone call`, what: item.number, text: item.what },
        { lead: { tag: "Number", title: "Emergency numbers", href: `/emergency#g-${group.id}`, line: `${item.name}: ${[item.number, ...(item.also ?? [])].join(" or ")}. ${item.what}`, meta: `Checked ${day(numbers.checked)}`, call: [item.number, ...(item.also ?? [])] }, // The three emergency numbers lead whatever else answers: an article's fact that is the very word asked counts double, and they still come before it.
        weight: group.id === "emergency" ? 8 : group.id === "rodrigues" ? 1.2 : 2, whole: true, exact: true, key: [item.name, initials(item.name), group.label, item.what, "emergency helpline hotline call"] },
      ),
    ),
  );
  const dates = holidays();
  if (dates) {
    const byName = new Map<string, string[]>();
    for (const year of Object.keys(dates.years).sort()) for (const h of dates.years[year]) byName.set(h.name, [...(byName.get(h.name) ?? []), longDay(h.date)]);
    let n = 0;
    // One holiday answers a question that names it: "Divali", not "public holiday", which is the whole list.
    const plain = new Set(["public", "holiday", "day", "on", "the", "after", "and", "monday", "chinese"]);
    for (const [name, days] of byName) lead(`h:${n++}`, { name, alt: "public holiday date when is", what: days.join(" "), text: "" }, { lead: { tag: "Holiday", title: "Public holidays in Mauritius", href: "/holidays", line: `${name}: ${days.join(", and ")}.`, meta: `Checked ${day(dates.checked)}` }, weight: 2, whole: true, exact: true, key: [name, "public holiday date day"], need: fold(name).split(" ").filter((word) => !plain.has(word)) });
    const years = Object.keys(dates.years).sort();
    lead("h:all", { name: "Public holidays in Mauritius", alt: "bank holidays calendar jours feries konze piblik", what: years.join(" "), text: "" }, { lead: { tag: "Holiday", title: "Public holidays in Mauritius", href: "/holidays", line: `Every public holiday of ${years.join(" and ")}, with the day of the week it falls on.`, meta: `Checked ${day(dates.checked)}` }, guide: "holidays", weight: 4, whole: true, exact: true, key: ["public bank holidays calendar dates list next", "jours feries konze piblik", ...years], need: ["holiday", "holidays", "calendar", "feries", "konze"] });
  }
  glossary.forEach((t, i) => lead(`t:${i}`, { name: `${t.term} ${t.full ?? ""}`, alt: "", what: "", text: t.meaning }, { lead: { tag: "Glossary", title: t.full ? `${t.term}: ${t.full}` : t.term, href: `/learn/glossary#${anchorOf(t.term)}`, line: t.meaning }, weight: 1.4, whole: true, key: [t.term, t.full ?? "", "meaning definition"] }));
  // The site's own pages, found by name: who makes it, the plans, the pocket guide, where the data comes from.
  PAGES.forEach((page, i) => lead(`p:${i}`, { name: page.title, alt: page.words, what: page.line, text: "" }, { lead: { tag: "Page", title: page.title, href: page.href, line: page.line }, weight: 3, whole: true, key: [page.title, page.words] }));
  TOOLS.forEach((t, i) => lead(`x:${i}`, { name: t.title, alt: "calculator tool", what: t.what, text: "" }, { lead: { tag: "Tool", title: t.title, href: t.href, line: t.what }, weight: 1.3, whole: true, key: [t.title, t.what, "calculator tool"] }));

  official.forEach((o, i) => docs.push({ id: `o:${i}`, kind: "official", name: o.title, alt: o.publisher, what: o.what, where: "", text: o.host ?? "" }));
  sites.forEach((s, i) => docs.push({ id: `s:${i}`, kind: "site", name: s.name ?? s.title, alt: s.title, what: s.host, where: "", text: s.about ?? "" }));

  // A word and its plural are one word: "pharmacies" finds "pharmacy", "ATMs" finds "ATM".
  const engine = new Engine({ fields: FIELDS, word: stem });
  engine.addAll(docs);

  const longest = <T>(a: Phrase<T>, b: Phrase<T>) => b.tokens.length - a.tokens.length || b.tokens.join("").length - a.tokens.join("").length;
  const unique = <T>(list: Phrase<T>[]) => list.filter((p, i, all) => p.tokens.length > 0 && all.findIndex((o) => o.tokens.join(" ") === p.tokens.join(" ")) === i);
  // A town of two names answers to either: "Rose Hill" finds Beau Bassin-Rose Hill.
  const placePhrases = places.flatMap((place) =>
    [place.name, ...(place.kind === "town" && place.name.includes("-") ? place.name.split("-").filter((part) => part.length > 5) : [])].map((name) => ({ tokens: fold(name).split(" ").filter(Boolean), of: place })),
  );
  // A town comes before a neighbourhood of the same name.
  placePhrases.sort((a, b) => longest(a, b) || (a.of.kind === "town" ? -1 : 1));
  const byWord = <T>(list: Phrase<T>[]): ByWord<T> => {
    const out: ByWord<T> = new Map();
    list.forEach((phrase, rank) => out.set(phrase.tokens[0], [...(out.get(phrase.tokens[0]) ?? []), { rank, phrase }]));
    return out;
  };
  const byCategory = new Map<string, Listing[]>();
  const byPlace = new Map<string, Listing[]>();
  const into = (map: Map<string, Listing[]>, key: string, l: Listing) => (map.get(key) ?? map.set(key, []).get(key)!).push(l);
  for (const l of listings) {
    into(byCategory, l.cat, l);
    if (l.placeSlug) into(byPlace, l.placeSlug, l);
    if (l.areaSlug && l.areaSlug !== l.placeSlug) into(byPlace, l.areaSlug, l);
  }
  const eat = new Set(categories.filter((c) => c.group === "eat").map((c) => c.id));
  return {
    engine,
    places: byWord(unique(placePhrases)),
    // A catch-all ("Other shops") does not answer to its bare noun: "shop" is not a search for it.
    categories: byWord(unique(categories.flatMap((c) => [...(c.id.startsWith("other-") ? [] : [c.one]), c.label, ...c.words].map((word) => ({ tokens: stems(word), of: c }))).filter((p) => p.tokens.join("").length >= 3)).sort(longest)),
    hints: byWord(unique(categories.flatMap((c) => (c.hints ?? []).map((word) => ({ tokens: stems(word), of: c })))).sort(longest)),
    byCategory,
    byPlace,
    eating: listings.filter((l) => eat.has(l.cat)),
    townWords: new Map(placePhrases.flatMap((p) => p.tokens.map((word) => [stem(word), word] as [string, string]))),
    leads,
    eat,
    health: new Set(categories.filter((c) => c.group === "health").map((c) => c.id)),
    articlesFor: articlesByCategory(guides, categories),
    laidIds: [],
  };
}

/**
 * The articles that go with each kind of business: the table in src/data/site.ts read the other
 * way, and every article on the food shelf with every category for eating and drinking.
 */
function articlesByCategory(guides: Guide[], categories: Category[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (category: string, slug: string) => out.set(category, [...(out.get(category) ?? []), slug]);
  // In the table's own order: the article named first for a kind of business is the one most about it.
  for (const [slug, kinds] of Object.entries(ARTICLE_BUSINESSES)) if (guides.some((g) => g.slug === slug)) for (const category of kinds) add(category, slug);
  for (const g of guides) if (g.shelf === "food") for (const c of categories) if (c.group === "eat") add(c.id, g.slug);
  return out;
}

/** The words a listing says of itself: its name, the map's word for its kind, its description and what the map notes besides. Not its category's. */
const said_ = new WeakMap<Listing, string[]>();
function ownWords(l: Listing): string[] {
  let words = said_.get(l);
  if (!words) said_.set(l, (words = [l.name, ...(l.alt ?? []), l.brand ?? "", l.kind ?? "", l.about ?? "", ...(l.extras ?? [])].flatMap(stems)));
  return words;
}

/** True when `phrase` stands in `tokens` at `at`, as whole words in order. */
const stands = (tokens: string[], at: number, phrase: string[]) => phrase.every((word, j) => tokens[at + j] === word);

/** Of the phrases that stand in `tokens`, the first in the list's own order, and where it first stands. */
function firstListed<T>(list: ByWord<T>, tokens: string[]): { at: number; phrase: Phrase<T> } | undefined {
  let best: { at: number; rank: number; phrase: Phrase<T> } | undefined;
  for (let at = 0; at < tokens.length; at++) {
    for (const { rank, phrase } of list.get(tokens[at]) ?? []) {
      if (best && rank >= best.rank) break;
      if (stands(tokens, at, phrase.tokens)) best = { at, rank, phrase };
    }
  }
  return best;
}

/** Of the phrases that stand in `tokens`, the one that stands earliest; of two that begin at the same word, the first in the list's order. */
function earliest<T>(list: ByWord<T>, tokens: string[], wanted?: (phrase: Phrase<T>) => boolean): { at: number; phrase: Phrase<T> } | undefined {
  for (let at = 0; at < tokens.length; at++) {
    for (const { phrase } of list.get(tokens[at]) ?? []) if ((!wanted || wanted(phrase)) && stands(tokens, at, phrase.tokens)) return { at, phrase };
  }
  return undefined;
}

/** A dish named in a question, and the category its word sits in. */
type Dish = { word: string; home: Category };
const DISH_STEMS = new Set([...DISHES].map((word) => stems(word).join(" ")));

/** A question as it was read. */
type Reading = {
  text: string;
  place?: Place;
  category?: Category;
  dish?: Dish;
  hint?: { category: Category; word: string };
  rest: string;
  /** The question without its town: what a business's name is compared with. */
  words?: string;
  /** The question as it was read, when a word of it was taken for a close spelling of a town or a kind of business. */
  corrected?: string;
};

/** Reads a question's words: the town among them, the kind of business (or the dish), and the words left over. */
function reading(e: Built, text: string, all: string[]): Reading {
  let tokens = all;
  let place: Place | undefined;
  // The longest town's name in the question; a town before a neighbourhood of the same name.
  const town = firstListed(e.places, tokens);
  if (town) {
    place = town.phrase.of;
    // "pharmacy in curepipe": the word that joins them goes with the town.
    const from = town.at > 0 && JOINERS.has(tokens[town.at - 1]) ? town.at - 1 : town.at;
    tokens = [...tokens.slice(0, from), ...tokens.slice(town.at + town.phrase.tokens.length)];
  }
  const words = tokens.join(" ");

  // The kind of business named first in the question; of two that begin at the same word, the
  // longer. "Petrol station" is a filling station, though "station" alone is a police station.
  const first = (wanted?: (phrase: Phrase<Category>) => boolean) => {
    const best = earliest(e.categories, tokens.map(stem), wanted);
    if (best) tokens = [...tokens.slice(0, best.at), ...tokens.slice(best.at + best.phrase.tokens.length)];
    return best?.phrase;
  };
  let category: Category | undefined;
  let dish: Dish | undefined;
  // A question about how names no kind of business, whatever nouns it holds. A town in it still counts.
  const asking = !place && ASKING.test(all.join(" "));
  if (!asking) {
    const isDish = (phrase: Phrase<Category>) => e.eat.has(phrase.of.id) && DISH_STEMS.has(phrase.tokens.join(" "));
    const named = first();
    category = named?.of;
    if (named && isDish(named)) {
      // A dish, and perhaps a kind of place to eat named beside it: "pizza restaurant".
      dish = { word: named.tokens.join(" "), home: named.of };
      category = first((phrase) => e.eat.has(phrase.of.id) && !isDish(phrase))?.of;
    } else if (named && e.eat.has(named.of.id)) {
      // A kind of place to eat, and perhaps a dish named beside it: "snack pizza".
      const beside = first(isDish);
      if (beside) dish = { word: beside.tokens.join(" "), home: beside.of };
    }
    // A word left over that is one of the category's own ("station", after "petrol") says nothing more.
    const own = category && new Set([category.one, category.label, ...category.words].flatMap(stems));
    if (own) tokens = tokens.filter((word) => !own.has(stem(word)));
  }
  let hint: { category: Category; word: string } | undefined;
  if (!category && !dish && !asking) {
    const narrower = firstListed(e.hints, tokens.map(stem));
    if (narrower) hint = { category: narrower.phrase.of, word: tokens.slice(narrower.at, narrower.at + narrower.phrase.tokens.length).join(" ") };
  }
  return { text, place, category, dish, hint, rest: tokens.filter((word) => !PADDING.has(word)).join(" "), words };
}

/**
 * Reads a question: the town it names, the kind of business it names (or the dish), and the words
 * left over.
 *
 * A word that nothing in the index holds, as written or as the start of a longer word, may be a
 * town or a kind of business typed wrongly: "pharmcy", "restorant", "curpipe". It is read as the
 * word meant only when one word the index holds is plainly the nearest to it (alone at its
 * distance, or five times as common as the next), and only when that word then names a town, a
 * kind of business or a dish the question did not have before. A real name is
 * never read as something else, since the index holds it; and a question about how is left alone.
 */
export function understand(query: string): Reading {
  built ??= build();
  const e = built;
  const text = fold(query);
  const tokens = phrased(text).split(" ").filter(Boolean);
  const read = reading(e, text, tokens);
  if (read.hint || (!read.place && ASKING.test(tokens.join(" ")))) return read;
  const meant = tokens.map((word) => {
    if (word.length < 4 || PADDING.has(word) || ASKS.has(word) || e.engine.knows(word, 3)) return word;
    // The nearest spelling, when it stands alone at its distance or is held by five times as many documents as the next.
    const close = e.engine.spell(word);
    const only = close.length > 0 && (close.length === 1 || close[1].distance > close[0].distance || close[0].held >= 5 * close[1].held) ? close[0].word : undefined;
    return only ? (e.townWords.get(only) ?? only) : word;
  });
  if (meant.every((word, i) => word === tokens[i])) return read;
  const again = reading(e, text, meant);
  const more = (again.place && !read.place) || ((again.category || again.dish) && !read.category && !read.dish);
  const less = (read.place && again.place !== read.place) || (read.category && again.category !== read.category) || again.hint;
  return more && !less ? { ...again, corrected: meant.join(" ") } : read;
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

type Options = {
  kind?: Kind;
  page?: number;
  plain?: boolean;
  narrow?: Narrow;
  /** Owners' businesses to lay over the index. */
  overlay?: Overlay;
  /** For a question searched as plain words after it was read as a kind of business: that kind, to come first among partial matches. */
  prefer?: string;
};

/** Kilometres between two places, near enough for an island. */
const apart = (a: Place, b: Place) => Math.hypot((a.lon! - b.lon!) * 104, (a.lat! - b.lat!) * 111);

export function search(query: string, { kind, page = 1, plain = false, narrow, overlay, prefer }: Options = {}): Answer {
  built ??= build();
  const e = built;
  const data = index();
  if (overlay) lay(e, overlay);
  // Every listing a question may be answered with: the index's, and any an owner listed outside it.
  const pool = overlay?.extras.length ? data.listings.concat(overlay.extras) : data.listings;
  const byId = (id: string) => data.byId.get(id) ?? overlay?.byId.get(id);
  const read: Reading = plain ? { text: fold(query), rest: fold(query) } : understand(query);
  if (read.corrected) {
    // A town or a kind of business typed wrongly: the question is answered as it was meant, and the page says so.
    // Only when it then answers as a town or a kind of business would: a wrong guess is dropped, and the words are searched as they are.
    const meant = search(read.corrected, { kind, page, narrow, overlay });
    if (meant.who && !meant.loose && meant.counts.listing > 0) return { ...meant, query, spelling: true };
  }
  const { place, rest, text } = read;
  let { category, dish } = read;
  // A word is matched as written, or as the start of a longer word: from three letters for a
  // listing, from four for a page ("bus" is not "business", "bar" is not "barracks"). Close
  // spellings are tried only when that finds nothing, and the page then says so.
  const of = (wanted: Kind, words: string, combineWith: "AND" | "OR" = "AND", close = false, more: { also?: string; limit?: number } = {}) =>
    words ? e.engine.search(words, { all: combineWith === "AND", kind: wanted, prefix: wanted === "listing" && combineWith === "AND" ? 3 : 4, close, ...more }) : [];
  let spelling = false;

  // Listings. With a town or a kind of business read from the question, they are every listing of
  // that kind in that town, ranked by the words left over or, with none left, fullest first. A
  // dish is looked for in every place to eat, or in the kind of place named beside it.
  let ranked: { l: Listing; score: number }[] = [];
  let ignored: string | undefined;
  const fits = (l: Listing) => (dish && !category ? e.eat.has(l.cat) : !category || l.cat === category.id) && (!place || l.placeSlug === place.slug || l.areaSlug === place.slug);
  // The listings of one kind, in one town, and for eating: the index's own lists, with any an owner listed outside it.
  const extras = overlay?.extras ?? [];
  const withExtras = (list: Listing[] | undefined, mine: (l: Listing) => boolean) => (extras.length ? (list ?? []).concat(extras.filter(mine)) : (list ?? []));
  const inCategory = (id: string) => withExtras(e.byCategory.get(id), (l) => l.cat === id);
  const inPlace = (slug: string) => withExtras(e.byPlace.get(slug), (l) => l.placeSlug === slug || l.areaSlug === slug);
  const forEating = () => withExtras(e.eating, (l) => e.eat.has(l.cat));
  /** Every listing that fits what was read, without walking the whole index for it. */
  const fitting = () => (category ? inCategory(category.id) : place ? inPlace(place.slug) : dish ? forEating() : pool).filter(fits);
  /**
   * The listings whose whole name is the question, in two words or more: "Hotel Tamarin", "Phoenix
   * Assurance". A question read as a kind of business in a town may be such a name instead.
   */
  const namesakes = () => {
    const out = new Set<Listing>();
    if (text.includes(" ")) {
      // A plural and its singular are one word here too.
      const asked = stems(text).join(" ");
      for (const r of of("listing", text)) {
        const l = byId(r.id.slice(2));
        if (l && stems(l.name).join(" ") === asked) out.add(l);
      }
    }
    return out;
  };
  // The fullest first; and before them the business whose own name is the whole question.
  const every = (own?: Set<Listing>) => {
    for (const l of fitting()) ranked.push({ l, score: l.full + (own?.has(l) ? 100 : 0) });
  };
  const matching = (words: string, close: boolean) => {
    // The question without its town is given too: a listing whose name is the whole of it comes first.
    for (const r of of("listing", words, "AND", close, { also: read.words })) {
      const l = byId(r.id.slice(2));
      if (l && fits(l)) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
    if (ranked.length) spelling = close;
  };
  if (place || category || dish) {
    const byName = () => search(query, { kind, page, plain: true, narrow, overlay, prefer: category?.id });
    // A question read as a kind of business, with a town or with other words, may be a business's
    // own name. If one elsewhere, or of another kind, has the whole question for its name, the
    // question is that name: "Phoenix Assurance" is an insurer, wherever it is, before it is
    // insurance in Phoenix. A kind with nothing beside it is left as the kind: its words are the
    // category's own. A town with no kind is left as the town.
    const own = !plain && (category || dish) && (place || rest) ? namesakes() : undefined;
    if (own && [...own].some((l) => !fits(l))) {
      const named = byName();
      if (named.counts.listing > 0) return named;
    }
    if (dish) {
      // By what a listing says of itself, never by its category's words: every takeaway would "mention" pizza.
      const wanted = [...stems(dish.word), ...stems(rest)];
      for (const l of fitting()) {
        const own = ownWords(l);
        if (!wanted.every((word) => own.includes(word))) continue;
        const name = stems(l.name);
        ranked.push({ l, score: (wanted.every((word) => name.includes(word)) ? 3 : stems(l.kind ?? "").includes(wanted[0]) ? 2 : 1) * (1 + l.full / 12) });
      }
      if (!ranked.length) {
        // No place to eat mentions the dish. It is read as the category its word sits in, and the page says the word was left out.
        ignored = dish.word;
        category ??= dish.home;
        dish = undefined;
      }
    }
    if (!ranked.length) {
      if (rest) matching(rest, false);
      // Every word was a kind of business or a town: the fullest first, after the one whose name is the question.
      else every(ignored ? undefined : own);
    }
    if (!ranked.length && !plain) {
      // Read as a town or a kind and nothing fits as written. The words may be a name: search
      // them plainly. A name found as written is the answer. If there is none, the words left
      // over are tried as close spellings within the kind or the town, before anything looser.
      const named = byName();
      if (named.counts.listing > 0 && !named.spelling && !named.loose) return named;
      if (rest) matching(rest, true);
      if (!ranked.length) {
        if (named.counts.listing > 0 || !rest) return named;
        // Not a name either. Answer the part that was understood, and say which words were left out.
        every();
        if (!ranked.length) return named;
        ignored = [ignored, rest].filter(Boolean).join(" ");
      }
    }
  } else {
    for (const r of of("listing", text)) {
      const l = byId(r.id.slice(2));
      if (l) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
  }
  const who = Boolean(place || category || dish) && ranked.length > 0;

  // Answers from our own pages. The question is put into the articles' words, and the words that
  // only ask or pad are left out. A page answers when what is left is in its own title, label or
  // heading (a longer word may begin with one of them); else it only mentions them. A number to
  // call or a date answers only with the words whole, and is otherwise not shown at all.
  const told = said(text)
    .split(" ")
    .filter((word) => word && !PADDING.has(word) && !ASKS.has(word));
  const asked = [...new Set(told.map(stem))];
  const holds = (list: string[], word: string, exact?: boolean) => list.includes(word) || (!exact && word.length >= 4 && list.some((own) => own.startsWith(word)));
  const covers = (entry: LeadEntry, word: string) => holds(entry.key, word, entry.exact);
  type Found = { lead: Lead; score: number; soft: boolean; article: boolean; direct: boolean };
  const dial = /\b(number|numero|nimero|phone|telephone|call|contact|hotline|helpline|appeler)\b/.test(text);
  const collect = (hits: { id: string; score: number }[]) => {
    const best = new Map<string, Found>();
    // Of one article's parts: the one that answers. Of those, a part that names the words in its
    // own label or heading, or the article itself, before a part that answers only because the
    // article's title holds them: "bus" is the article on getting around, not its fact about the
    // metro. For a question about who and where, the article itself before one of its facts.
    // Then the better match.
    const rank = (found: Found) => (found.soft ? 0 : found.direct ? 2e6 : 1e6) + (who && found.article ? 2e6 : 0) + Math.min(found.score, 9e5);
    for (const r of hits) {
      const entry = e.leads.get(r.id);
      if (!entry) continue;
      if (entry.need && !entry.need.some((word) => asked.includes(word))) continue;
      const soft = !asked.every((word) => covers(entry, word));
      // A number or a date answers or is not shown; and a question about who and where is not answered by a part deep in an article.
      if ((soft && entry.exact) || (who && !entry.whole)) continue;
      const own = entry.own;
      const direct = !soft && (!own || asked.every((word) => holds(own, word)));
      // An article whose own title holds the words is the article about them: it counts half as much again.
      const titled = !soft && entry.title !== undefined && asked.every((word) => holds(entry.title!, word));
      // A question that asks for a number wants the number before the article that mentions the body.
      const found = { lead: soft ? { ...entry.lead, soft: true } : entry.lead, score: r.score * entry.weight * (dial && entry.lead.tag === "Number" ? 6 : 1) * (titled ? 1.5 : 1), soft, article: Boolean(entry.article), direct };
      const key = entry.guide ?? r.id;
      const was = best.get(key);
      if (!was || rank(found) > rank(was)) best.set(key, found);
    }
    return [...best.values()].sort((a, b) => Number(a.soft) - Number(b.soft) || b.score - a.score).map((found) => found.lead);
  };
  const words = told.join(" ");
  let leads = collect(of("guide", words));
  let official = of("official", words).map((r) => data.official[Number(r.id.slice(2))]);
  let sites = of("site", text).map((r) => data.sites[Number(r.id.slice(2))]);
  // Nothing matches as written: try close spellings. Not for a word that names a kind of business
  // the index does not hold ("plumber" must not find "lumber"); a narrower word the index does
  // hold, such as "store", does not stop the words beside it from being spelt wrongly.
  if (!ranked.length && !leads.length && !official.length && !sites.length && !(read.hint && !e.engine.knows(read.hint.word))) {
    for (const r of of("listing", text, "AND", true)) {
      const l = byId(r.id.slice(2));
      if (l) ranked.push({ l, score: r.score * (1 + l.full / 12) });
    }
    leads = collect(of("guide", words, "AND", true));
    official = of("official", words, "AND", true).map((r) => data.official[Number(r.id.slice(2))]);
    spelling = ranked.length + leads.length + official.length > 0;
  }
  // The order of listings: how well a listing answers, and how full it is. Two things come before
  // that, and the site says both on /data. A verified business on Biznes Go or Biznes Grow is
  // shown first among the listings that answer, and the page marks it on every row it moves; a
  // question that is a business's own name still gets that business first, so a paid place is
  // never passed off as the one asked for. And in a health category a listing with a telephone
  // number on record comes before one without: someone unwell needs a number to call.
  const byName = !place && !category && !dish;
  const lead = (l: Listing) => (!overlay?.paid.size ? 0 : byName && fold(l.name) === text ? 2 : overlay.paid.has(l.id) ? 1 : 0);
  const health = Boolean(category && e.health.has(category.id));
  const reachable = (l: Listing) => (health && l.phone?.length ? 1 : 0);
  ranked.sort((a, b) => lead(b.l) - lead(a.l) || reachable(b.l) - reachable(a.l) || b.score - a.score || a.l.name.localeCompare(b.l.name));
  // A question that names a town and found listings there is asking who and where. A page that
  // only happens to hold the same words would be in the way; one that answers still comes first.
  if (place && ranked.length) {
    // A town's name alone asks for what is in the town: a number or a page that merely carries the name is no answer to that.
    leads = category || dish || rest ? leads.filter((found) => !found.soft) : [];
    official = [];
    sites = [];
  }

  // Nothing at all for every word together: show what any of the words that say something finds,
  // and say so. A page that holds only some of the words has not answered the question, so none
  // of them is shown as the answer.
  let loose = false;
  if (!ranked.length && !leads.length && !official.length && !sites.length && text.includes(" ")) {
    loose = true;
    const any = text
      .split(" ")
      .filter((word) => word && !PADDING.has(word) && !ASKS.has(word))
      .join(" ");
    const some: { l: Listing; score: number; words: number }[] = [];
    for (const r of of("listing", any, "OR", false, prefer ? {} : { limit: 200 })) {
      const l = byId(r.id.slice(2));
      if (l) some.push({ l, score: r.score, words: r.words });
    }
    if (prefer) {
      // "Garage in Goodlands", and no garage is listed there. What holds every word still comes
      // first; then the kind of business asked for, wherever it is: a garage in the next town is
      // nearer the question than a pharmacy in Goodlands.
      const most = some.reduce((n, found) => Math.max(n, found.words), 0);
      const rank = (found: { l: Listing; words: number }) => (found.words === most && most > 1 ? 2 : found.l.cat === prefer ? 1 : 0);
      some.sort((a, b) => rank(b) - rank(a) || b.score - a.score);
    }
    ranked.push(...some.slice(0, 200));
    leads = collect(of("guide", words, "OR", false, { limit: 40 }))
      .slice(0, 6)
      .map((found) => ({ ...found, soft: true }));
    official = of("official", words, "OR", false, { limit: 20 }).map((r) => data.official[Number(r.id.slice(2))]);
    sites = of("site", any, "OR", false, { limit: 20 }).map((r) => data.sites[Number(r.id.slice(2))]);
  }

  // The articles that go with the kind of business asked for (src/data/site.ts) stand with the
  // pages that answer: a number to call first, then those articles, then the rest.
  if (who && category) {
    const mine = (e.articlesFor.get(category.id) ?? []).map((slug) => e.leads.get(`g:${slug}`)?.lead).filter((found): found is Lead => found != null);
    if (mine.length) {
      const article = (found: Lead) => mine.findIndex((own) => found.href.split("#")[0] === own.href);
      const direct = leads.filter((found) => !found.soft && (found.tag === "Number" || found.tag === "Holiday"));
      const answer = leads.filter((found) => !found.soft && !direct.includes(found));
      const mention = leads.filter((found) => found.soft && article(found) < 0);
      // Of the pages that answer, the articles that go with this kind of business first, in the table's order.
      const first = answer.filter((found) => article(found) >= 0).sort((a, b) => article(a) - article(b));
      const others = mine.filter((own) => !answer.some((found) => found.href.split("#")[0] === own.href));
      leads = [...direct, ...first, ...answer.filter((found) => article(found) < 0), ...others, ...mention];
    }
  }

  // Narrowing is the visitor's own choice, made after the question is answered: it takes listings
  // out, and never changes their order.
  const { facets, listings: keep } = narrowed(ranked.map((r) => r.l), narrow);
  if (keep.length !== ranked.length) {
    const kept = new Set(keep);
    ranked = ranked.filter((r) => kept.has(r.l));
  }

  // A question that is a business's own name ("MCB") is about who, unless one of our pages truly answers it.
  const said_ = text.split(" ").filter((word) => word && !PADDING.has(word));
  const named = !who && ranked.length > 0 && said_.length > 0 && said_.every((word) => stems(ranked[0].l.name).includes(stem(word))) && !leads.some((found) => !found.soft);

  const hard = leads.filter((found) => !found.soft);
  const soft = leads.filter((found) => found.soft);
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
  const eating = Boolean(who && (dish || (category && e.eat.has(category.id))));
  const ways: Way[] = [];
  if (category && place) {
    const n = inCategory(category.id).filter((l) => l.placeSlug === place.slug || l.areaSlug === place.slug).length;
    if (n) ways.push({ href: `/directory/${category.id}/${place.slug}`, label: `${category.label} in ${place.name}`, n });
  }
  if (category) ways.push({ href: `/directory/${category.id}`, label: `${category.label}, all of Mauritius`, n: category.n });
  if (place) ways.push({ href: `/places/${place.slug}`, label: `Everything in ${place.name}`, n: place.n });
  if (eating) ways.push({ href: "/baz-manzer", label: "Baz Manzer, every place to eat", n: forEating().length });

  // Searches near this one, from what the index holds: the same kind in the towns nearest and in
  // larger ones, the kind across the island, and everything in the town.
  const related: Way[] = [];
  const ask = (label: string, n: number) => related.push({ href: `/search?q=${encodeURIComponent(label)}`, label, n });
  if (who && category && !dish && !kind) {
    const inTown = new Map<string, number>();
    for (const l of inCategory(category.id)) if (l.placeSlug) inTown.set(l.placeSlug, (inTown.get(l.placeSlug) ?? 0) + 1);
    const towns = [...inTown].map(([slug, n]) => ({ town: data.placeBySlug.get(slug), n })).filter((t): t is { town: Place; n: number } => t.town != null);
    if (place) {
      const here = (place.kind === "area" && place.within ? data.placeBySlug.get(place.within) : undefined) ?? place;
      const others = towns.filter((t) => t.town.slug !== here.slug);
      const near = here.lon == null ? [] : others.filter((t) => t.town.lon != null && apart(here, t.town) <= 10).sort((a, b) => b.n - a.n || apart(here, a.town) - apart(here, b.town)).slice(0, 3);
      const larger = others.filter((t) => !near.includes(t) && t.n > (inTown.get(here.slug) ?? 0)).sort((a, b) => b.n - a.n).slice(0, 2);
      for (const t of [...near, ...larger]) ask(`${category.label} in ${t.town.name}`, t.n);
      related.push({ href: `/search?q=${encodeURIComponent(category.label)}`, label: `${category.label}, all of Mauritius`, n: category.n });
    } else {
      for (const t of towns.sort((a, b) => b.n - a.n).slice(0, 5)) ask(`${category.label} in ${t.town.name}`, t.n);
    }
  } else if (who && place && !dish && !kind) {
    const kinds = new Map<string, number>();
    for (const l of inPlace(place.slug)) kinds.set(l.cat, (kinds.get(l.cat) ?? 0) + 1);
    for (const [id, n] of [...kinds].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      const c = data.categoryById.get(id);
      if (c && !c.id.startsWith("other-")) ask(`${c.label} in ${place.name}`, n);
    }
  }

  const kept = ignored ? "" : rest;
  const matched = [dish?.word, kept].filter(Boolean).join(" ");
  const readAs = !who
    ? undefined
    : dish
      ? `${category ? category.label : "Places to eat"}${place ? ` in ${place.name}` : ""}, matching “${matched}”`
      : category && place
        ? `${category.label} in ${place.name}${kept ? `, matching “${kept}”` : ""}`
        : category
          ? `${category.label}${kept ? `, matching “${kept}”` : ""}`
          : kept
            ? `“${kept}” in ${place!.name}`
            : `everything in ${place!.name}`;

  // What the index holds for a question about who and where, in a sentence of its own counts.
  let summary: string | undefined;
  if (who && facets.all > 0 && !spelling) {
    const n = facets.all;
    const noun = category ? (n === 1 ? category.one : category.label).toLowerCase() : dish ? (n === 1 ? "place to eat" : "places to eat") : n === 1 ? "listing" : "listings";
    const where = place ? ` in ${place.name}` : matched ? "" : " listed across Mauritius";
    const have = (k: number, thing: string) => (k === 0 ? `none has ${thing}` : `${count(k)} ${k === 1 ? "has" : "have"} ${thing}`);
    summary = `${count(n)} ${noun}${where}${matched ? ` ${n === 1 ? "mentions" : "mention"} “${matched}”` : ""}; ${have(facets.phone, "a telephone number on record")}${facets.web ? ` and ${count(facets.web)} a website` : ""}.`;
  }

  return {
    query,
    place,
    category,
    readAs,
    ignored,
    // Offered only when our pages do not answer: "tax" is a question, "plumber" is a search for one.
    near: read.hint && !category && !hard.length ? { href: `/directory/${read.hint.category.id}`, label: read.hint.category.label, n: read.hint.category.n, word: read.hint.word } : undefined,
    who: who || named,
    spelling,
    loose: loose && ranked.length + leads.length + official.length + sites.length > 0,
    listings: kind && kind !== "listing" ? [] : ranked.slice(start, start + PAGE_SIZE).map((r) => r.l),
    leads: kind === "guide" ? leads.slice(start, start + PAGE_SIZE) : kind ? [] : hard.slice(0, who ? 2 : 3),
    mentions: kind ? [] : soft.slice(0, who || named ? 2 : 3),
    summary,
    related,
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
  const leads = () => [...a.leads, ...a.mentions].slice(0, 2).forEach((l) => add({ href: l.href, label: l.title, note: l.tag === "Guide" ? "Article" : l.tag, kind: "guide" }));
  // Our own pages that answer come first, as on the page of results; a part of an article that only mentions the words waits for the businesses.
  if (a.leads.length > 0 || (!a.who && a.counts.listing < 3)) leads();
  for (const l of a.listings.slice(0, 5)) add({ href: `/b/${l.slug}`, label: l.name, note: [data.categoryById.get(l.cat)?.one, whereOf(l)].filter(Boolean).join(", "), kind: "listing" });
  leads();
  for (const o of a.official.slice(0, 1)) add({ href: o.url, label: o.title, note: o.publisher, kind: "official" });
  for (const s of a.sites.slice(0, 1)) add({ href: s.url, label: s.name ?? s.title, note: s.host, kind: "site" });
  return { suggestions, points: a.points.slice(0, 3000), n: a.counts.listing };
}
