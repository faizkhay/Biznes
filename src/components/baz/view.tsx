import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import { Crumbs, Pager } from "@/components/Bits";
import Filters from "@/components/Filters";
import { CategoryIcon, DistrictIcon, FoodIcon } from "@/components/Glyphs";
import { Arrow, Glass } from "@/components/Icons";
import IslandBeside from "@/components/IslandBeside";
import JsonLd from "@/components/JsonLd";
import { ListingRow } from "@/components/Rows";
import { BAZ, SHELVES } from "@/data/site";
import { owned } from "@/lib/accounts/owned";
import { showcaseOf, type MenuSection } from "@/lib/accounts/showcase";
import { rupees } from "@/lib/accounts/types";
import { baz, bazHref } from "@/lib/baz";
import { chartPoints } from "@/lib/chart";
import { cuisinesOf, food, inTown, nearTowns, type Cuisine } from "@/lib/food";
import { count, day, distance } from "@/lib/format";
import { index, type Category, type Listing, type Place } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { breadcrumbs, itemList } from "@/lib/schema";
import { narrowed, PAGE_SIZE } from "@/lib/search";
import BazSearchBox from "./BazSearchBox";

/** A value from an address: a parameter given twice arrives as a list, and the first is taken. */
type Given = string | string[] | undefined;
export type Asked = { type?: Given; food?: Given; town?: Given; phone?: Given; web?: Given; page?: Given };
const one = (value: Given) => (Array.isArray(value) ? value[0] : value)?.slice(0, 80);

/** What a list of places to eat is of: a kind of place, a kind of food, a town; and what a visitor narrowed it by after. */
export type FoodView = { type?: Category; cuisine?: Cuisine; town?: Place; phone: boolean; web: boolean; page: number };

/**
 * Reads a list from its address. `path` holds the parts of the address itself: one that names no
 * kind of place, kind of food or town we hold is no page at all, and nothing is returned.
 * `query` holds the parameters after it: one that names nothing is left out, as it always was.
 */
export function readView(path: { type?: string; food?: string; town?: string }, query: Asked): FoodView | null {
  const { typeById, cuisineById } = food();
  const { placeBySlug } = index();
  const type = typeById.get(path.type ?? one(query.type) ?? "");
  const cuisine = cuisineById.get(path.food ?? one(query.food) ?? "");
  const town = placeBySlug.get(path.town ?? one(query.town) ?? "");
  if ((path.type && !type) || (path.food && !cuisine) || (path.town && !town)) return null;
  return { type, cuisine, town, phone: one(query.phone) === "1", web: one(query.web) === "1", page: Math.max(1, Number(one(query.page)) || 1) };
}

/** The one address of a view (src/lib/baz.ts), with anything in `change` put in its place. */
export const viewHref = (view: FoodView, change: { type?: string; food?: string; town?: string; phone?: boolean; web?: boolean; page?: number } = {}) =>
  bazHref({ type: view.type?.id, food: view.cuisine?.id, town: view.town?.slug, phone: view.phone, web: view.web, page: 1, ...change });

/** The page a view is a narrowing of: its kind of food, or its kind of place (in its town), or its town, or the first page. */
const baseOf = (view: FoodView) => (view.cuisine ? baz.food(view.cuisine.id) : view.type ? baz.kind(view.type.id, view.town?.slug) : view.town ? baz.town(view.town.slug) : baz.home);

/** The first letter of a line in lower case, and no other: "Where to eat in Mauritius" after a colon. */
const lowerFirst = (line: string) => line.charAt(0).toLowerCase() + line.slice(1);

const inView = (view: Pick<FoodView, "type" | "cuisine" | "town">) => (l: Listing) =>
  (!view.type || l.cat === view.type.id) && (!view.cuisine || cuisinesOf(l).some((c) => c.id === view.cuisine!.id)) && (!view.town || inTown(l, view.town.slug));

/**
 * A view's title and description, its one address for a search engine, and whether it is a page
 * to index. The first page, a kind of place, a kind of food and a town are. A kind of place in a
 * town is not put forward: the directory's own page for it is (/directory/restaurants/curepipe).
 * A view narrowed after its address, or a later page of a list, is one of thousands and names
 * the page it narrows as its address.
 */
export function viewMeta(view: FoodView): Metadata {
  const { type, cuisine, town } = view;
  const { listings } = food();
  const n = listings.filter(inView(cuisine ? { cuisine } : { type, town })).length;
  const narrowedAfter = view.phone || view.web || view.page > 1 || Boolean(cuisine && (type || town));
  const path = baseOf(view);
  const hours = "with numbers and hours where known";
  if (cuisine) return pageMeta({ title: `${cuisine.label}: places to eat in Mauritius`, description: `${count(n)} places to eat in Mauritius whose kind of food the map records as ${cuisine.label}, by kind of place and by town, ${hours}.`, path, index: !narrowedAfter, drawn: true });
  if (type && town) return pageMeta({ title: `${type.label} in ${town.name}`, description: `Where to eat in ${town.name}: ${count(n)} ${(n === 1 ? type.one : type.label).toLowerCase()} on Baz Manzer, ${hours}.`, path, index: false, drawn: true });
  if (type) return pageMeta({ title: `${type.label} in Mauritius`, description: `${count(n)} ${type.label.toLowerCase()} across Mauritius on Baz Manzer, by town and by kind of food, ${hours}.`, path, index: !narrowedAfter, drawn: true });
  if (town) return pageMeta({ title: `Where to eat in ${town.name}`, description: `${count(n)} ${n === 1 ? "place" : "places"} to eat and drink in ${town.name}, Mauritius, by kind of place and by kind of food, ${hours}, and the towns nearest it.`, path, index: !narrowedAfter && n > 0, drawn: true });
  return pageMeta({
    title: `${BAZ.name}: ${lowerFirst(BAZ.line)}`,
    description: `${count(listings.length)} places to eat and drink in Mauritius: restaurants, snacks, cafés, bakeries and bars, by kind of food and by town, with numbers and hours where known.`,
    path,
    index: !narrowedAfter,
    drawn: true,
  });
}

type Chip = { href: string; label: string; n: number; current?: boolean; note?: string; icon?: React.ReactNode; /** A page a search engine is not asked to follow: a narrowed view. */ quiet?: boolean };

/** Ways to another list, as pills in a line: each a name and how many it holds. */
function Chips({ id, title, items, more, children }: { id: string; title: string; items: Chip[]; more?: { href: string; label: string }; children?: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <nav aria-labelledby={id} className="mt-6">
      <h2 id={id} className="label-1 text-ink-faint">
        {title}
      </h2>
      <ul className="narrow">
        {items.map((item) => (
          <li key={item.href}>
            <Link prefetch={false} href={item.href} aria-current={item.current ? "true" : undefined} className="body-3" rel={item.quiet ? "nofollow" : undefined}>
              {item.icon}
              {item.label}
              {item.note && <span className="n data-2">{item.note}</span>} <span className="n data-2">{count(item.n)}</span>
            </Link>
          </li>
        ))}
        {more && (
          <li>
            <Link prefetch={false} href={more.href} className="body-3 baz-more">
              {more.label} <Arrow />
            </Link>
          </li>
        )}
      </ul>
      {children}
    </nav>
  );
}

/**
 * A page of Baz Manzer that is a list of places to eat: the first page, a kind of place, a kind
 * of food, a town, or a kind of place in a town. One drawing for all of them, so each has the
 * same parts in the same order: what the list is of, the ways to another list, the list itself
 * with what narrows it, and the island beside it with the way to the street map.
 *
 * The first page is the front of the section: its awning, its own search, what is near, the
 * kinds of place, the kinds of food and the towns, then every place to eat. A verified outlet on
 * a paid plan comes first in every list and is marked, as in a search, and shows the first lines
 * of its menu when it has given one. Every link to a place, a kind, a kind of food or a town
 * stays inside the section.
 */
export default async function BazView({ view }: { view: FoodView }) {
  const data = index();
  const { types, ids, listings: indexed, cuisines, cuisineById, towns: eatTowns } = food();
  const own = await owned();
  // Owners' own outlets that are not in the open index stand with the rest.
  const extras = own.overlay?.extras.filter((l) => ids.has(l.cat)) ?? [];
  const everything = extras.length ? indexed.concat(extras) : indexed;
  const { type, cuisine, town } = view;
  const front = !type && !cuisine && !town;

  // The kind of place, the kind of food and the town choose the list; what a listing has narrows it.
  const picked = everything.filter(inView(view));
  const { facets, listings: kept } = narrowed(picked, { phone: view.phone, web: view.web });
  // A verified outlet on a paid plan first, and marked; then the fullest listing first.
  const paid = (l: Listing) => (own.byRow.get(l.id)?.paid ? 1 : 0);
  const listed = [...kept].sort((a, b) => paid(b) - paid(a) || b.full - a.full || a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const at = Math.min(view.page, pages);
  const shown = listed.slice((at - 1) * PAGE_SIZE, at * PAGE_SIZE);
  const points = chartPoints().at;
  const lit = listed.map((l) => points.get(l.id)).filter((i): i is number => i != null);

  // The menus of the outlets on this page that have given one.
  const menus = new Map<string, MenuSection[]>();
  for (const l of shown) {
    const o = own.byRow.get(l.id);
    if (!o || o.plan === "free") continue;
    const menu = (await showcaseOf(o.id))?.menu?.filter((section) => section.items.length > 0);
    if (menu?.length) menus.set(l.id, menu);
  }

  // What a list holds, counted: by kind of place, by kind of food, by town.
  const kindsIn = (list: Listing[]) => types.map((c) => ({ c, n: list.filter((l) => l.cat === c.id).length })).filter((k) => k.n > 0);
  const foodsIn = (list: Listing[]) => {
    const found = new Map<string, number>();
    for (const l of list) for (const c of cuisinesOf(l)) if (cuisineById.has(c.id)) found.set(c.id, (found.get(c.id) ?? 0) + 1);
    return [...found].map(([id, n]) => ({ c: cuisineById.get(id)!, n })).sort((a, b) => b.n - a.n || a.c.label.localeCompare(b.c.label));
  };
  const townsIn = (list: Listing[]) => narrowed(list).facets.towns;
  const foodChip = (c: Cuisine, n: number, href: string, quiet = false): Chip => ({ href, label: c.label, n, icon: <FoodIcon id={c.id} />, quiet });

  const what = `${cuisine ? `${cuisine.label} ` : ""}${type ? (listed.length === 1 ? type.one : type.label).toLowerCase() : listed.length === 1 ? "place to eat" : "places to eat"}`;
  const says = `A chart of Mauritius with the ${count(lit.length)} places to eat in this list lit.`;
  const onChart = `On the island: ${count(lit.length)} of ${count(listed.length)}.`;
  const district = town?.district && town.district !== town.name ? town.district : undefined;
  const districtSlug = town?.district ? data.districts.find((d) => d.name === town.district)?.slug : undefined;
  const within = town?.kind === "area" && town.within ? data.placeBySlug.get(town.within) : undefined;
  const here = baseOf(view);

  // The path at the head of a page: it begins at the section's own first page, which has none.
  const steps: { href?: string; label: string }[] = cuisine
    ? [{ href: baz.foods, label: BAZ.ways[1].label }, { label: cuisine.label }]
    : type && town
      ? [{ href: baz.kind(type.id), label: type.label }, { label: town.name }]
      : type
        ? [{ label: type.label }]
        : town
          ? [{ href: baz.towns, label: BAZ.ways[2].label }, ...(within ? [{ href: baz.town(within.slug), label: within.name }] : []), { label: town.name }]
          : [];
  const crumbs = [{ href: baz.home, label: BAZ.name }, ...steps];
  // The same path for machines, from the site's own first page.
  const trail = [{ href: "/", label: "Home" }, ...(front ? [{ label: BAZ.name }] : crumbs)];

  const title = cuisine ? cuisine.label : type && town ? `${type.label} in ${town.name}` : type ? type.label : town ? `Where to eat in ${town.name}` : BAZ.name;
  const all = everything.filter(inView(cuisine ? { cuisine } : view));
  const lede = cuisine
    ? `${count(all.length)} ${all.length === 1 ? "place" : "places"} to eat whose kind of food the map records as ${cuisine.label}. The word is the map's own.`
    : type && town
      ? `${count(all.length)} listed in ${town.name}${district ? `, ${district} district` : ""}.`
      : type
        ? `${count(all.length)} ${type.label.toLowerCase()} across Mauritius, in ${count(townsIn(all).length)} towns and villages.`
        : town
          ? `${count(all.length)} ${all.length === 1 ? "place" : "places"} to eat and drink in ${town.name}${district ? `, ${district} district` : ""}.`
          : "";

  // The ways from this list to another. Each is a page of the section.
  const near = town ? nearTowns(town.slug) : [];
  const areas = town && town.kind === "town" ? eatTowns.filter((t) => t.kind === "area" && t.within === town.slug).slice(0, 12) : [];
  const articles = data.guides.filter((g) => g.shelf === "food");
  const shelf = SHELVES.find((s) => s.id === "food");
  // For a kind of food: the towns it is served in, the one with most first.
  const servedIn = cuisine ? townsIn(everything.filter(inView({ cuisine, type }))).slice(0, 12) : [];
  const everyTown = eatTowns.filter((t) => t.kind === "town").sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <JsonLd data={breadcrumbs(trail, here)} />
      {at === 1 && shown.length > 0 && <JsonLd data={itemList(`${BAZ.name}: ${what}${town ? ` in ${town.name}` : ""}`, shown, (l) => own.byRow.get((l as Listing).id)?.path ?? `/b/${l.slug}`)} />}

      <div className="shell pt-8 lg:pt-12">
        {front ? (
          /* The front of the section: the awning of a stall over the name, its own search, and the kinds of place. */
          <header className="baz-head">
            <span className="baz-awning" aria-hidden />
            <div className="baz-words">
              <p className="label-1 flex items-center gap-2 text-ink-subtle">
                <CategoryIcon group="eat" className="size-4" /> {BAZ.kicker}
              </p>
              <h1 className="display-1 mt-3">{BAZ.name}</h1>
              <p className="body-1 measure mt-4 text-ink-subtle">
                {BAZ.line}: {count(everything.length)} places to eat and drink across the island, by kind of food and by town. {BAZ.meaning}
              </p>
              <div className="mt-6 max-w-2xl">
                <BazSearchBox size="lg" id="baz-search" hotkey />
              </div>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Searches to try">
                {BAZ.search.tries.map((example) => (
                  <li key={example}>
                    <Link prefetch={false} href={baz.search(example)} className="try body-3" rel="nofollow">
                      <Glass /> {example}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* The kinds of place: the directory's own categories for eating and drinking. */}
            <ul className="baz-types" id="kinds" aria-label="Kinds of place">
              {types.map((c) => (
                <li key={c.id}>
                  <Link prefetch={false} href={baz.kind(c.id)} className="baz-type">
                    <span className="baz-type-icon" aria-hidden>
                      <CategoryIcon id={c.id} group="eat" />
                    </span>
                    <span>
                      <span className="title-2 block">{c.label}</span>
                      <span className="data-2 block">{count(everything.filter((l) => l.cat === c.id).length)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </header>
        ) : (
          <div>
            <Crumbs path={crumbs} />
            <p className="label-1 mt-4 flex items-center gap-2 text-ink-subtle">
              {cuisine ? <FoodIcon id={cuisine.id} className="size-4" /> : type ? <CategoryIcon id={type.id} group="eat" className="size-4" /> : <DistrictIcon slug={districtSlug} className="size-4" />}
              {cuisine ? "Kind of food" : type ? "Kind of place" : within ? `In ${within.name}` : district ? `${district} district` : "Town"}
            </p>
            <h1 className="heading-1 mt-2 max-w-4xl">{title}</h1>
            <p className="body-1 measure mt-4 text-ink-subtle">{lede}</p>
          </div>
        )}

        {front && (
          <>
            {/* What is near: the visitor says where they are. The form asks this page for a town, and is led to the town's own. */}
            <section aria-labelledby="near" className="baz-near mt-8">
              <h2 id="near" className="label-1 text-ink-faint">
                <label htmlFor="near-town">{BAZ.near.title}</label>
              </h2>
              <form action={baz.home} method="get" className="baz-near-form">
                <select id="near-town" name="town" className="field" required defaultValue="">
                  <option value="" disabled>
                    {BAZ.near.label}
                  </option>
                  {everyTown.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name} ({count(t.eats)})
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-ink button-md">
                  {BAZ.near.action}
                </button>
              </form>
              <p className="caption-1 mt-2 text-ink-faint">{BAZ.near.line}</p>
            </section>
            <Chips id="by-food" title="By kind of food" items={cuisines.slice(0, 18).map((c) => foodChip(c, c.n, baz.food(c.id)))} more={{ href: baz.foods, label: "Every kind of food" }}>
              <p className="caption-1 text-ink-faint">
                The kind of food is the map&rsquo;s own word for it, and the map gives one for {count(indexed.filter((l) => l.kind).length)} of the {count(indexed.length)} places. A place with none is still in the list.
              </p>
            </Chips>
            <Chips id="by-town" title="By town" items={townsIn(everything).slice(0, 8).map((t) => ({ href: baz.town(t.slug), label: t.name, n: t.n }))} more={{ href: baz.towns, label: "Every town" }} />
          </>
        )}

        {type && !town && (
          <>
            <Chips id="by-town" title="By town" items={townsIn(picked).slice(0, 12).map((t) => ({ href: baz.kind(type.id, t.slug), label: t.name, n: t.n, quiet: true }))} />
            <Chips id="by-food" title="By kind of food" items={foodsIn(picked).slice(0, 12).map(({ c, n }) => foodChip(c, n, bazHref({ food: c.id, type: type.id }), true))} />
          </>
        )}

        {type && town && (
          <>
            <Chips
              id="by-kind"
              title={`In ${town.name}`}
              items={kindsIn(everything.filter(inView({ town }))).map(({ c, n }) => ({ href: baz.kind(c.id, town.slug), label: c.label, n, current: c.id === type.id, quiet: true }))}
              more={{ href: baz.town(town.slug), label: `Every place to eat in ${town.name}` }}
            />
            <Chips
              id="by-town"
              title={`${type.label} nearby`}
              items={near.map(({ town: t, km }) => ({ href: baz.kind(type.id, t.slug), label: t.name, n: everything.filter(inView({ type, town: t })).length, note: distance(km), quiet: true })).filter((chip) => chip.n > 0)}
            />
          </>
        )}

        {cuisine && (
          <>
            <Chips
              id="by-kind"
              title="By kind of place"
              items={kindsIn(everything.filter(inView({ cuisine, town }))).map(({ c, n }) => ({ href: viewHref(view, { type: type?.id === c.id ? undefined : c.id }), label: c.label, n, current: type?.id === c.id, quiet: true }))}
            />
            <Chips
              id="by-town"
              title="By town"
              items={[
                ...servedIn.map((t) => ({ href: viewHref(view, { town: town?.slug === t.slug ? undefined : t.slug }), label: t.name, n: t.n, current: town?.slug === t.slug, quiet: true })),
                // A town chosen that is not among the first twelve still shows, as the one chosen.
                ...(town && !servedIn.some((t) => t.slug === town.slug) ? [{ href: viewHref(view, { town: undefined }), label: town.name, n: picked.length, current: true, quiet: true }] : []),
              ]}
            />
          </>
        )}

        {town && !type && !cuisine && (
          <>
            <Chips id="by-kind" title="By kind of place" items={kindsIn(picked).map(({ c, n }) => ({ href: baz.kind(c.id, town.slug), label: c.label, n, quiet: true }))} />
            <Chips id="by-food" title="By kind of food" items={foodsIn(picked).slice(0, 12).map(({ c, n }) => foodChip(c, n, bazHref({ food: c.id, town: town.slug }), true))} />
            <Chips id="by-area" title={`Neighbourhoods of ${town.name}`} items={areas.map((t) => ({ href: baz.town(t.slug), label: t.name, n: t.eats }))} />
            <Chips id="by-town" title={`Near ${town.name}`} items={near.map(({ town: t, km }) => ({ href: baz.town(t.slug), label: t.name, n: t.eats, note: distance(km) }))} />
          </>
        )}
      </div>

      <div className="shell mt-8 grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <h2 className="heading-2" id="list">
            {count(listed.length)} {what}
            {town ? ` in ${town.name}` : ""}
          </h2>
          <div className="mt-3 mb-6">
            <Filters facets={facets} narrow={{ phone: view.phone, web: view.web }} href={(how) => viewHref(view, { phone: how.phone, web: how.web })} town={false} />
          </div>

          {listed.length === 0 ? (
            <p className="card card-panel body-2 text-ink-subtle" role="status">
              Nothing in the directory is all of these yet.{" "}
              <Link prefetch={false} href={baz.home}>
                Show every place to eat
              </Link>
              , or <Link href="/add">add one that is missing</Link>.
            </p>
          ) : (
            <ul className="rows">
              {shown.map((l) => {
                const o = own.byRow.get(l.id);
                const menu = menus.get(l.id);
                // A business its owner listed outside the index has no listing to save; one of the index's has.
                const outside = Boolean(o && !o.listingId);
                return (
                  <li key={l.id}>
                    <ListingRow listing={l} paid={o?.paid} verified={o?.verified} href={outside ? baz.place(l.slug) : undefined} within={outside ? undefined : baz.place(l.slug)} />
                    {/* The first lines of an outlet's own menu, and the way to the rest of it. */}
                    {menu && (
                      <p className="menu-peek body-3">
                        <span className="label-1 text-ink-faint">On the menu</span>
                        {menu
                          .flatMap((section) => section.items)
                          .slice(0, 3)
                          .map((item) => (
                            <span key={item.name}>
                              {item.name}
                              {item.price != null && <span className="data-2 text-ink-faint"> {rupees(item.price)}</span>}
                            </span>
                          ))}
                        <Link prefetch={false} href={`${baz.place(l.slug)}#menu`} className="font-semibold text-link">
                          The whole menu
                        </Link>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Pager page={at} pages={pages} href={(n) => viewHref(view, { page: n })} />
          <p className="caption-1 mt-4 max-w-prose text-ink-faint">
            A verified outlet on a paid plan is shown first and marked; the rest are in order of how much is known of them. <Link href="/data#order">How results are ordered</Link>. Map data as of {day(data.meta.map.stamp)}.
          </p>
        </div>

        {/* One island for both sizes, with the advertisement for food under it. */}
        <IslandBeside lit={lit} says={says} onChart={onChart}>
          <AdSlot place="food" className="mt-6" />
        </IslandBeside>
      </div>

      {front && (
        <div className="shell">
          {articles.length > 0 && shelf && (
            <section aria-labelledby="food-articles" className="mt-16">
              <h2 id="food-articles" className="heading-2">
                {shelf.label}
              </h2>
              <p className="body-2 mt-2 text-ink-subtle">{shelf.line} Every fact in these articles names its source.</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((g) => (
                  <li key={g.slug}>
                    <article className="card h-full">
                      <h3 className="title-1">
                        <Link prefetch={false} href={`/learn/${g.slug}`} className="row-title text-ink">
                          {g.title}
                        </Link>
                      </h3>
                      <p className="body-3 mt-2 line-clamp-3 text-ink-subtle">{g.summary}</p>
                      <p className="caption-1 mt-4 text-ink-faint">
                        {count(g.sources.length)} sources, checked {day(g.checked)}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* For whoever runs one of these places. */}
          <section aria-label="For a place to eat" className="mt-12">
            <Link prefetch={false} href="/pricing" className="card flex flex-wrap items-center justify-between gap-x-8 gap-y-3 no-underline">
              <span className="flex min-w-0 items-center gap-4">
                <span className="tile-icon">
                  <CategoryIcon group="eat" />
                </span>
                <span>
                  <span className="title-1 block">{BAZ.owners.title}</span>
                  <span className="body-3 mt-1 block text-ink-subtle">{BAZ.owners.line}</span>
                </span>
              </span>
              <span className="btn btn-ink btn-sm button-sm">
                See the plans
                <span className="btn-dot">
                  <Arrow />
                </span>
              </span>
            </Link>
          </section>

          {/* The section is an app of its own: said in words, for whoever closed the offer or was never made one. */}
          <section aria-labelledby="baz-app" className="card mt-4 flex items-center gap-4">
            <span className="baz-mark baz-mark-lg" aria-hidden />
            <div>
              <h2 id="baz-app" className="title-1">
                {BAZ.app.about.title}
              </h2>
              <p className="body-3 mt-1 text-ink-subtle">{BAZ.app.about.line}</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
