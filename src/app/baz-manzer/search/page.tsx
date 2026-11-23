import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import BazSearchBox from "@/components/baz/BazSearchBox";
import { Crumbs, Pager } from "@/components/Bits";
import Filters, { narrowQuery } from "@/components/Filters";
import { Arrow, Glass } from "@/components/Icons";
import IslandBeside from "@/components/IslandBeside";
import { ListingRow } from "@/components/Rows";
import { ShareButton } from "@/components/Save";
import { BAZ } from "@/data/site";
import { owned } from "@/lib/accounts/owned";
import { baz } from "@/lib/baz";
import { chartPoints } from "@/lib/chart";
import { food, foodSearch } from "@/lib/food";
import { count } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { narrowed, narrowOf, PAGE_SIZE, type Narrow } from "@/lib/search";

type Params = { q?: string | string[]; page?: string; phone?: string; web?: string; town?: string };
const [, , , way] = BAZ.ways;

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const q = String((await searchParams).q ?? "").trim();
  // A page of results is never one to index: it is as many pages as there are questions.
  return pageMeta({ title: q ? `${q.slice(0, 60)}: places to eat` : BAZ.search.label, description: q ? `The places to eat and drink in Mauritius that answer “${q.slice(0, 80)}”, on Baz Manzer.` : `${BAZ.search.lede} A part of biznes.mu.`, path: baz.search(), index: false });
}

/**
 * Baz Manzer's own search: one question, answered only with places to eat, every answer a page
 * inside the section. The reading of the question and the matching are the site's own search
 * (src/lib/food.ts says how it is asked). What is not a place to eat is not shown here, and the
 * page says where it can be asked for: the whole site's search, one plain link away.
 */
export default async function BazSearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  // An address may give a parameter twice ("?q=a&q=b"), which arrives as a list and not as words.
  const q = String(params.q ?? "").trim().slice(0, 120);
  const crumbs = [{ href: baz.home, label: BAZ.name }, { label: way.label }];

  if (!q) {
    return (
      <div className="shell pt-8 pb-16 lg:pt-12">
        <Crumbs path={crumbs} />
        <div className="mt-8 text-center lg:mt-12">
          <h1 className="heading-1">{BAZ.search.label}</h1>
          <p className="body-1 mx-auto mt-3 max-w-xl text-balance text-ink-subtle">{BAZ.search.lede}</p>
          <div className="mx-auto mt-8 max-w-2xl text-left">
            <BazSearchBox size="lg" id="baz-search" autoFocus hotkey />
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Searches to try">
            {BAZ.search.tries.map((example) => (
              <li key={example}>
                <Link prefetch={false} href={baz.search(example)} className="try body-3">
                  <Glass /> {example}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const narrow = narrowOf(params);
  const narrowing = Boolean(narrow.phone || narrow.web || narrow.town);
  const page = Math.max(1, Number(params.page) || 1);
  // Outlets listed by their owners are laid over the index. With accounts off there are none.
  const own = await owned();
  const a = foodSearch(q, own.overlay);
  const { facets, listings } = narrowed(a.listings, narrow);
  const pages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const at = Math.min(page, pages);
  const shown = listings.slice((at - 1) * PAGE_SIZE, at * PAGE_SIZE);
  const points = chartPoints().at;
  const lit = listings.map((l) => points.get(l.id)).filter((i): i is number => i != null);
  const href = (n = 1, how: Narrow = narrow) => `${baz.search(q)}${narrowQuery(how)}${n > 1 ? `&page=${n}` : ""}`;
  const none = a.listings.length === 0;
  const says = `A chart of Mauritius with the ${count(lit.length)} places to eat that answer this search lit.`;
  const whole = `/search?q=${encodeURIComponent(q)}`;

  return (
    <div className="shell pt-8 pb-16 lg:pt-10">
      <h1 className="sr-only">
        Places to eat for {q}
      </h1>
      <div className="grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <BazSearchBox size="lg" id="baz-search" initial={q} hotkey />

          <div className="mt-4 flex min-h-11 items-start justify-between gap-4">
            <p className="body-3 pt-2 text-ink-subtle" role="status">
              {none ? `No place to eat found for “${q}”.` : `${count(a.listings.length)} ${a.listings.length === 1 ? "place" : "places"} to eat.`}
              <span className="text-ink-faint">
                {a.readAs ? ` Read as: ${a.readAs}.` : ""}
                {a.ignored ? ` No place mentions “${a.ignored}”, so that was left out.` : ""}
                {a.spelling ? " Nothing matched as written, so close spellings are shown." : ""}
                {a.loose ? ` No place holds all of “${q}”. What follows holds some of its words.` : ""}
                {a.partial ? ` The first ${count(a.partial.looked)} of the ${count(a.partial.of)} listings that hold these words were looked through: add a word to find the rest.` : ""}
              </span>
            </p>
            {!none && <ShareButton title={`${q} on ${BAZ.name}`} label="Share this search" />}
          </div>

          {/* The pages of the section that are the answer by themselves: a town, a kind of place, a kind of food. */}
          {a.ways.length > 0 && (
            <ul className="narrow" aria-label="Pages of Baz Manzer that answer">
              {a.ways.map((w) => (
                <li key={w.href}>
                  <Link prefetch={false} href={w.href} className="body-3">
                    {w.label} <span className="n data-2">{count(w.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {none && (
            <div className="mt-6 max-w-prose">
              <p className="body-2 text-ink-subtle">
                {a.elsewhere
                  ? `Baz Manzer holds only places to eat and drink, and this reads as ${a.elsewhere.label.toLowerCase()}: the whole of biznes.mu lists ${count(a.elsewhere.n)}.`
                  : `Try a dish, a kind of place and a town (“café in Curepipe”), a name, or fewer words. Baz Manzer holds ${count(food().listings.length)} places to eat and drink, and nothing else: an article or another kind of business is in the whole site's search.`}
              </p>
              <p className="mt-6 flex flex-wrap gap-3">
                <a href={whole} className="btn btn-quiet button-md">
                  Search all of {BAZ.back.label}
                </a>
                <Link href={baz.home} className="btn btn-quiet button-md">
                  Every place to eat
                </Link>
              </p>
            </div>
          )}

          {!none && (facets.all > 1 || narrowing) && (
            <div className="mt-4">
              <Filters facets={facets} narrow={narrow} href={(how) => href(1, how)} />
            </div>
          )}
          {narrowing && listings.length === 0 && !none && (
            <p className="note body-3 mt-4" role="status">
              None of the {count(facets.all)} places that answer has that on record.{" "}
              <Link prefetch={false} href={href(1, {})}>
                Show them all
              </Link>
            </p>
          )}

          {shown.length > 0 && (
            <section aria-labelledby="r-places" className="mt-6">
              <h2 id="r-places" className="label-1 pb-3 text-ink-faint">
                Places to eat and drink
              </h2>
              <ul className="rows">
                {shown.map((l) => {
                  const o = own.byRow.get(l.id);
                  const outside = Boolean(o && !o.listingId);
                  return (
                    <li key={l.id}>
                      <ListingRow listing={l} paid={o?.paid} verified={o?.verified} href={outside ? baz.place(l.slug) : undefined} within={outside ? undefined : baz.place(l.slug)} />
                    </li>
                  );
                })}
              </ul>
              <Pager page={at} pages={pages} href={(n) => href(n)} />
            </section>
          )}

          {!none && (
            <p className="body-3 mt-8 text-ink-subtle">
              Only places to eat are shown here.{" "}
              <a href={whole} className="inline-flex min-h-11 items-center gap-1 font-semibold text-link">
                Search all of {BAZ.back.label} for “{q}” <Arrow className="size-4" />
              </a>
            </p>
          )}
        </div>

        {/* The island, drawn once: a strip after the list on a phone, beside it on a desk. */}
        <IslandBeside lit={lit} says={says} onChart={`On the island: ${count(lit.length)} of ${count(listings.length)}.`}>
          <AdSlot place="food" className="mt-6" />
        </IslandBeside>
      </div>
    </div>
  );
}
