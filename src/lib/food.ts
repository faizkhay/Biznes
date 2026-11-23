// Baz Manzer: everything in the directory for eating and drinking, by kind of place, by kind of
// food and by town. All of it is read from the index: the kinds of place are the directory's own
// categories, the kinds of food are the map's own word for each listing's cuisine, where it gives
// one, and the towns are the ones a place to eat stands in. Nothing here is typed in.
//
// The section's search is here too. It asks the site's own search (src/lib/search.ts) by its
// exported names and keeps what is a place to eat: it has no engine of its own.
import { baz, bazHref } from "./baz";
import { anchorOf } from "./format";
import { index, type Category, type Listing, type Place } from "./index";
import { fold, PAGE_SIZE, search, understand, type Overlay, type Way } from "./search";

export type Cuisine = { id: string; label: string; n: number };
/** A town, a village or a neighbourhood, with how many places to eat stand in it. */
export type FoodTown = Place & { eats: number };

/** The kinds of food a listing is said to serve: "Pizza, Pasta" is two. */
export const cuisinesOf = (l: Pick<Listing, "kind">) =>
  (l.kind ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({ id: anchorOf(label), label }))
    .filter((c) => c.id);

/** True for a listing in a town or village, or in one of its neighbourhoods. */
export const inTown = (l: Pick<Listing, "placeSlug" | "areaSlug">, slug: string) => l.placeSlug === slug || l.areaSlug === slug;

type Food = {
  types: Category[];
  typeById: Map<string, Category>;
  ids: Set<string>;
  listings: Listing[];
  cuisines: Cuisine[];
  cuisineById: Map<string, Cuisine>;
  /** Every town, village and neighbourhood with a place to eat, the one with most first. */
  towns: FoodTown[];
  townBySlug: Map<string, FoodTown>;
};
let held: Food | undefined;

/** The places to eat in the open index, with the kinds of place and of food they come in and the towns they stand in. */
export function food(): Food {
  if (held) return held;
  const { categories, listings, placeBySlug } = index();
  const types = categories.filter((c) => c.group === "eat").sort((a, b) => b.n - a.n);
  const ids = new Set(types.map((c) => c.id));
  // The word a kind of place already says ("Restaurant") is not a kind of food.
  const plain = new Set(types.flatMap((c) => [anchorOf(c.one), anchorOf(c.label)]));
  const all = listings.filter((l) => ids.has(l.cat));
  const found = new Map<string, Cuisine>();
  const stood = new Map<string, number>();
  for (const l of all) {
    for (const { id, label } of cuisinesOf(l)) {
      if (plain.has(id)) continue;
      const was = found.get(id);
      if (was) was.n++;
      else found.set(id, { id, label, n: 1 });
    }
    for (const slug of new Set([l.placeSlug, l.areaSlug])) if (slug) stood.set(slug, (stood.get(slug) ?? 0) + 1);
  }
  const cuisines = [...found.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  const towns = [...stood]
    .map(([slug, eats]) => ({ place: placeBySlug.get(slug), eats }))
    .filter((t): t is { place: Place; eats: number } => t.place != null)
    .map(({ place, eats }) => ({ ...place, eats }))
    .sort((a, b) => b.eats - a.eats || a.name.localeCompare(b.name));
  held = { types, typeById: new Map(types.map((c) => [c.id, c])), ids, listings: all, cuisines, cuisineById: new Map(cuisines.map((c) => [c.id, c])), towns, townBySlug: new Map(towns.map((t) => [t.slug, t])) };
  return held;
}

/** Kilometres between two points, near enough for an island. */
const apart = (a: { lon?: number; lat?: number }, b: { lon?: number; lat?: number }) => Math.hypot((a.lon! - b.lon!) * 104, (a.lat! - b.lat!) * 111);

/**
 * The towns and villages nearest a town that have somewhere to eat, nearest first, each with how
 * far its middle is from this one's. "Near" is within fifteen kilometres: farther is another
 * part of the island.
 */
export function nearTowns(slug: string, most = 6): { town: FoodTown; km: number }[] {
  const { towns, townBySlug } = food();
  const here = townBySlug.get(slug) ?? index().placeBySlug.get(slug);
  if (!here || here.lon == null || here.lat == null) return [];
  // A neighbourhood's own town is not "near" it: it is where it is.
  const own = here.kind === "area" ? here.within : here.slug;
  return towns
    .filter((t) => t.kind === "town" && t.slug !== own && t.lon != null && t.lat != null)
    .map((town) => ({ town, km: apart(here, town) }))
    .filter(({ km }) => km <= 15)
    .sort((a, b) => a.km - b.km)
    .slice(0, most);
}

/** What the section's search found for a question. */
export type FoodAnswer = {
  query: string;
  /** Every place to eat that answers, best first. A page shows them twenty at a time. */
  listings: Listing[];
  /** How the question was read, in words, when it was read as more than words. */
  readAs?: string;
  /** True when nothing matched as written and close spellings are shown instead. */
  spelling: boolean;
  /** True when nothing held every word of the question, and what holds any one of them is shown. */
  loose: boolean;
  /** Words of the question that no place mentions, left out so the rest could be answered. */
  ignored?: string;
  /** Pages of the section that answer by themselves: a town, a kind of place, a kind of food. */
  ways: Way[];
  /** The question names a kind of business that is not a place to eat: what the whole site lists of it. */
  elsewhere?: { label: string; n: number };
  /** The question was answered by more listings than were looked through: how many were, of how many. */
  partial?: { looked: number; of: number };
};

/** The most pages of the site's own answer that are looked through for places to eat. */
const LOOK = 40;
const kept = new Map<string, FoodAnswer>();

/**
 * The section's search: one question, answered only with places to eat.
 *
 * The question is read by the site's own search (`understand`): a town, a kind of place, a dish.
 * A town alone, a kind of place alone or a kind of place in a town is the list itself and needs
 * nothing matched. Anything else is asked of the site's search (`search`), a page of answers at a
 * time, and the places to eat among the answers are kept, in the order the search gave them. A
 * question that names a kind of business that is not a place to eat finds nothing here, and the
 * page says where to ask it. `overlay` lays the owners' own businesses over the index, as on the
 * site's search.
 */
export function foodSearch(query: string, overlay?: Overlay): FoodAnswer {
  const key = `${overlay?.stamp ?? 0}:${query.trim().toLowerCase()}`;
  const was = kept.get(key);
  if (was) return was;
  const { ids, listings: indexed, cuisines, towns } = food();
  const pool = overlay?.extras.length ? indexed.concat(overlay.extras.filter((l) => ids.has(l.cat))) : indexed;
  const read = understand(query);
  const { place, category, dish, rest } = read;
  const kind = category && ids.has(category.id) ? category : undefined;
  const fits = (l: Listing) => (!kind || l.cat === kind.id) && (!place || inTown(l, place.slug));
  const text = fold(query);

  // The pages of the section that are the answer by themselves.
  const ways: Way[] = [];
  const way = (href: string, label: string, n: number) => n > 0 && !ways.some((w) => w.href === href) && ways.push({ href, label, n });
  if (kind) way(baz.kind(kind.id, place?.slug), `${kind.label}${place ? ` in ${place.name}` : ""}`, pool.filter(fits).length);
  if (place) way(baz.town(place.slug), `Where to eat in ${place.name}`, pool.filter((l) => inTown(l, place.slug)).length);
  const asked = dish ? fold(dish.word) : rest || text;
  for (const c of cuisines) {
    if (asked.length < 3 || !(fold(c.label) === asked || fold(c.label).startsWith(`${asked} `) || `${fold(c.label)}s` === asked)) continue;
    // With a town in the question, the kind of food in that town; else the kind of food across the island.
    if (place) way(bazHref({ food: c.id, town: place.slug }), `${c.label} in ${place.name}`, pool.filter((l) => inTown(l, place.slug) && cuisinesOf(l).some((own) => own.id === c.id)).length);
    else way(baz.food(c.id), `${c.label}, a kind of food`, c.n);
  }
  if (!place && text.length >= 3) for (const t of towns.filter((t) => t.kind === "town" && fold(t.name).split(" ").some((word) => word.startsWith(text))).slice(0, 3)) way(baz.town(t.slug), `Where to eat in ${t.name}`, t.eats);

  let answer: FoodAnswer;
  if (category && !kind && !dish) {
    // A pharmacy, a bank: a kind of business, and not one of ours.
    answer = { query, listings: [], spelling: false, loose: false, ways: [], elsewhere: { label: `${category.label}${place ? ` in ${place.name}` : ""}`, n: place ? index().listings.filter((l) => l.cat === category.id && inTown(l, place.slug)).length : category.n } };
  } else if (!dish && !rest && (kind || place)) {
    // The list itself: a verified outlet on a paid plan first, then the fullest listing first.
    const paid = (l: Listing) => (overlay?.paid.has(l.id) ? 1 : 0);
    const listings = pool.filter(fits).sort((a, b) => paid(b) - paid(a) || b.full - a.full || a.name.localeCompare(b.name));
    answer = { query, listings, readAs: kind ? `${kind.label}${place ? ` in ${place.name}` : ""}` : `places to eat in ${place!.name}`, spelling: false, loose: false, ways };
  } else {
    const first = search(query, { kind: "listing", overlay });
    const pages = Math.min(LOOK, Math.ceil(first.counts.listing / PAGE_SIZE));
    const found = [...first.listings];
    for (let page = 2; page <= pages; page++) found.push(...search(query, { kind: "listing", page, overlay }).listings);
    const listings = found.filter((l) => ids.has(l.cat));
    const looked = Math.min(first.counts.listing, LOOK * PAGE_SIZE);
    answer = {
      query,
      listings,
      // The site's own reading is said only where it was of places to eat: a dish, or one of our kinds.
      readAs: listings.length && (dish || kind) ? first.readAs : undefined,
      spelling: first.spelling && listings.length > 0,
      loose: first.loose && listings.length > 0,
      ignored: listings.length ? first.ignored : undefined,
      ways,
      ...(looked < first.counts.listing ? { partial: { looked, of: first.counts.listing } } : {}),
    };
  }
  if (kept.size >= 60) kept.delete(kept.keys().next().value!);
  kept.set(key, answer);
  return answer;
}

/** A few answers for the section's search box while a question is still being typed. */
export type FoodSuggestion = { href: string; label: string; note: string; kind: "way" | "listing" };

export function foodSuggest(query: string, overlay?: Overlay): FoodSuggestion[] {
  const text = fold(query);
  if (text.length < 2) return [];
  const { types, cuisines, towns, typeById } = food();
  const out: FoodSuggestion[] = [];
  const add = (s: FoodSuggestion) => out.length < 8 && !out.some((o) => o.href === s.href) && out.push(s);
  const starts = (name: string) => fold(name).split(" ").some((word) => word.startsWith(text)) || fold(name).startsWith(text);
  const a = foodSearch(query, overlay);
  for (const w of a.ways.slice(0, 3)) add({ href: w.href, label: w.label, note: `${w.n}`, kind: "way" });
  // A word still being typed: the kinds of place, the kinds of food and the towns it is the start of.
  if (text.length >= 3 && !text.includes(" ")) {
    for (const c of types.filter((c) => [c.one, c.label, ...c.words].some(starts)).slice(0, 2)) add({ href: baz.kind(c.id), label: c.label, note: `${c.n}`, kind: "way" });
    for (const c of cuisines.filter((c) => starts(c.label)).slice(0, 2)) add({ href: baz.food(c.id), label: `${c.label}, a kind of food`, note: `${c.n}`, kind: "way" });
    for (const t of towns.filter((t) => starts(t.name)).slice(0, 2)) add({ href: baz.town(t.slug), label: `Where to eat in ${t.name}`, note: `${t.eats}`, kind: "way" });
  }
  for (const l of a.listings.slice(0, 5)) add({ href: baz.place(l.slug), label: l.name, note: [typeById.get(l.cat)?.one, l.place].filter(Boolean).join(", "), kind: "listing" });
  return out;
}
