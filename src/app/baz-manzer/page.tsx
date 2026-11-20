import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import { Crumbs, Pager } from "@/components/Bits";
import Chart from "@/components/Chart";
import Filters, { narrowQuery } from "@/components/Filters";
import { Arrow, Fork, GroupIcon } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import MapSwitch from "@/components/MapSwitch";
import { ListingRow } from "@/components/Rows";
import { BAZ, SHELVES } from "@/data/site";
import { owned } from "@/lib/accounts/owned";
import { showcaseOf, type MenuSection } from "@/lib/accounts/showcase";
import { rupees } from "@/lib/accounts/types";
import { chartPoints } from "@/lib/chart";
import { cuisinesOf, food } from "@/lib/food";
import { count, day } from "@/lib/format";
import { index, type Listing } from "@/lib/index";
import { breadcrumbs, itemList } from "@/lib/schema";
import { narrowed, narrowOf, PAGE_SIZE } from "@/lib/search";

type Params = { food?: string; type?: string; town?: string; phone?: string; web?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const params = await searchParams;
  const narrowing = Object.values(params).some(Boolean);
  const { listings } = food();
  const description = `${count(listings.length)} places to eat and drink in Mauritius and Rodrigues: restaurants, snacks, cafés, bakeries and bars, by kind of food and by town, with telephone numbers and opening hours where known.`;
  return {
    title: `${BAZ.name}: ${BAZ.line.toLowerCase()}`,
    description,
    alternates: { canonical: "/baz-manzer" },
    openGraph: { title: `${BAZ.name}: ${BAZ.line.toLowerCase()}`, description, url: "/baz-manzer" },
    // A narrowed view is one of thousands: the page itself is the one to index.
    ...(narrowing ? { robots: { index: false, follow: true } } : {}),
  };
}

const chip = "body-3";

/**
 * Baz Manzer, Kreol for a place to eat: the home of everything in the directory for eating and
 * drinking. It is browsed by kind of place, by kind of food (the map's own word for a listing's
 * cuisine, where it gives one) and by town; narrowed by what a listing has on record; and shown
 * on the island and, on request, on a street map. A verified outlet on a paid plan comes first
 * and is marked, as in a search, and shows the first lines of its menu when it has given one.
 */
export default async function BazManzerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const data = index();
  const { types, ids, listings: indexed, cuisines } = food();
  const own = await owned();
  // Owners' own outlets that are not in the open index stand with the rest.
  const extras = own.overlay?.extras.filter((l) => ids.has(l.cat)) ?? [];
  const everything = extras.length ? indexed.concat(extras) : indexed;

  const type = types.find((c) => c.id === params.type);
  const cuisine = cuisines.find((c) => c.id === params.food);
  const chosen = narrowOf(params);
  const town = chosen.town ? data.placeBySlug.get(chosen.town) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  // The kind of place and the kind of food choose the list; what a listing has, and its town, narrow it.
  const picked = everything.filter((l) => (!type || l.cat === type.id) && (!cuisine || cuisinesOf(l).some((c) => c.id === cuisine.id)));
  const { facets, listings: kept } = narrowed(picked, chosen);
  // A verified outlet on a paid plan first, and marked; then the fullest listing first.
  const paid = (l: Listing) => (own.byRow.get(l.id)?.paid ? 1 : 0);
  const listed = [...kept].sort((a, b) => paid(b) - paid(a) || b.full - a.full || a.name.localeCompare(b.name));
  const pages = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const at = Math.min(page, pages);
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

  const href = (next: { food?: string; type?: string; how?: typeof chosen; page?: number }) => {
    const has = (key: "food" | "type") => (key in next ? next[key] : key === "food" ? cuisine?.id : type?.id);
    const q = `${has("type") ? `&type=${has("type")}` : ""}${has("food") ? `&food=${has("food")}` : ""}${narrowQuery(next.how ?? chosen)}${next.page && next.page > 1 ? `&page=${next.page}` : ""}`.slice(1);
    return q ? `/baz-manzer?${q}` : "/baz-manzer";
  };
  const narrowing = Boolean(type || cuisine || chosen.town || chosen.phone || chosen.web);
  const what = `${cuisine ? `${cuisine.label} ` : ""}${type ? (listed.length === 1 ? type.one : type.label).toLowerCase() : listed.length === 1 ? "place to eat" : "places to eat"}`;
  const says = `A chart of Mauritius with the ${count(lit.length)} places to eat in this list lit.`;
  const onChart = `On the island: ${count(lit.length)} of ${count(listed.length)}.`;
  const articles = data.guides.filter((g) => g.shelf === "food");
  const shelf = SHELVES.find((s) => s.id === "food");
  const topTowns = narrowed(picked).facets.towns.slice(0, 8);
  const crumbs = [{ href: "/", label: "Home" }, { label: BAZ.name }];

  return (
    <>
      <JsonLd data={breadcrumbs(crumbs, "/baz-manzer")} />
      {at === 1 && <JsonLd data={itemList(`${BAZ.name}: ${what}${town ? ` in ${town.name}` : ""}`, shown, (l) => own.byRow.get((l as Listing).id)?.path ?? `/b/${l.slug}`)} />}

      <div className="shell pt-8 lg:pt-12">
        <Crumbs path={crumbs} />
        {/* The page's own head: the awning of a stall over the name. */}
        <header className="baz-head mt-4">
          <span className="baz-awning" aria-hidden />
          <div className="baz-words">
            <p className="label-1 flex items-center gap-2 text-ink-subtle">
              <Fork className="size-4" /> {BAZ.kicker}
            </p>
            <h1 className="display-1 mt-3">{BAZ.name}</h1>
            <p className="body-1 measure mt-4 text-ink-subtle">
              {BAZ.line}: {count(everything.length)} places to eat and drink across the island, by kind of food and by town. {BAZ.meaning}
            </p>
          </div>
          {/* The kinds of place: the directory's own categories for eating and drinking. */}
          <ul className="baz-types" aria-label="Kinds of place">
            {types.map((c) => (
              <li key={c.id}>
                <Link prefetch={false} href={href({ type: type?.id === c.id ? undefined : c.id, page: 1 })} aria-current={type?.id === c.id ? "true" : undefined} className="baz-type" rel="nofollow">
                  <span className="title-2 block">{c.label}</span>
                  <span className="data-2 block">{count(c.n)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </header>

        <nav aria-labelledby="by-food" className="mt-8">
          <h2 id="by-food" className="label-1 text-ink-faint">
            By kind of food
          </h2>
          <ul className="narrow">
            {cuisines.slice(0, 18).map((c) => (
              <li key={c.id}>
                <Link prefetch={false} href={href({ food: cuisine?.id === c.id ? undefined : c.id, page: 1 })} aria-current={cuisine?.id === c.id ? "true" : undefined} className={chip} rel="nofollow">
                  {c.label} <span className="n data-2">{count(c.n)}</span>
                </Link>
              </li>
            ))}
            {cuisine && !cuisines.slice(0, 18).includes(cuisine) && (
              <li>
                <Link prefetch={false} href={href({ food: undefined, page: 1 })} aria-current="true" className={chip} rel="nofollow">
                  {cuisine.label} <span className="n data-2">{count(cuisine.n)}</span>
                </Link>
              </li>
            )}
          </ul>
          <p className="caption-1 text-ink-faint">The kind of food is the map&rsquo;s own word for it, and the map gives one for {count(indexed.filter((l) => l.kind).length)} of the {count(indexed.length)} places. A place with none is still in the list.</p>
        </nav>

        {topTowns.length > 1 && (
          <nav aria-labelledby="by-town" className="mt-6">
            <h2 id="by-town" className="label-1 text-ink-faint">
              By town
            </h2>
            <ul className="narrow">
              {topTowns.map((t) => (
                <li key={t.slug}>
                  <Link prefetch={false} href={href({ how: { ...chosen, town: chosen.town === t.slug ? undefined : t.slug }, page: 1 })} aria-current={chosen.town === t.slug ? "true" : undefined} className={chip} rel="nofollow">
                    {t.name} <span className="n data-2">{count(t.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="shell mt-8 grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="heading-2" id="list">
              {count(listed.length)} {what}
              {town ? ` in ${town.name}` : ""}
            </h2>
            {narrowing && (
              <Link prefetch={false} href="/baz-manzer" className="body-3 inline-flex min-h-11 items-center font-semibold text-link" rel="nofollow">
                Show every place to eat
              </Link>
            )}
          </div>
          <div className="mt-3 mb-6">
            <Filters facets={facets} narrow={chosen} href={(how) => href({ how, page: 1 })} />
          </div>

          {listed.length === 0 ? (
            <p className="card card-panel body-2 text-ink-subtle" role="status">
              Nothing in the directory is both of these yet.{" "}
              <Link prefetch={false} href="/baz-manzer">
                Show every place to eat
              </Link>
              , or <Link href="/add">add one that is missing</Link>.
            </p>
          ) : (
            <ul className="rows">
              {shown.map((l) => {
                const o = own.byRow.get(l.id);
                const menu = menus.get(l.id);
                const path = o && !o.listingId ? o.path : `/b/${l.slug}`;
                return (
                  <li key={l.id}>
                    <ListingRow listing={l} paid={o?.paid} verified={o?.verified} href={o && !o.listingId ? o.path : undefined} />
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
                        <Link prefetch={false} href={`${path}#menu`} className="font-semibold text-link">
                          The whole menu
                        </Link>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Pager page={at} pages={pages} href={(n) => href({ page: n })} />
          <p className="caption-1 mt-4 max-w-prose text-ink-faint">
            A verified outlet on a paid plan is shown first and marked; the rest are in order of how much is known of them. <Link href="/data#order">How results are ordered</Link>. Map data as of {day(data.meta.map.stamp)}.
          </p>

          {lit.length > 0 && (
            <div className="mt-8 chart:hidden">
              <MapSwitch lit={lit}>
                <div className="flex items-center gap-4">
                  <Chart className="chart-strip" lit={lit} zoom says={says} />
                  <p className="caption-1 text-ink-faint">{onChart}</p>
                </div>
              </MapSwitch>
            </div>
          )}
        </div>

        <aside className="hidden chart:col-span-5 chart:block">
          <div className="sticky top-24">
            {lit.length > 0 && (
              <MapSwitch lit={lit}>
                <Chart className="chart-side" lit={lit} zoom says={says} />
                <p className="caption-1 mt-3 text-ink-faint">{onChart} Point at a row to see where it is.</p>
              </MapSwitch>
            )}
            <AdSlot place="food" className="mt-6" />
          </div>
        </aside>
      </div>

      <div className="shell">
        <div className="chart:hidden">
          <AdSlot place="food" className="mt-8" />
        </div>

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
                <GroupIcon group="eat" />
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
      </div>
    </>
  );
}
