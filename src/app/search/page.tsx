import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/Bits";
import Chart from "@/components/Chart";
import { GuideRow, ListingRow, OfficialRow, SiteRow } from "@/components/Rows";
import SearchBox from "@/components/SearchBox";
import { EXAMPLES } from "@/data/site";
import { count } from "@/lib/format";
import { KINDS, PAGE_SIZE, search, type Kind } from "@/lib/search";

type Params = { q?: string; kind?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q } = await searchParams;
  // A page of results is never one to index: it is as many pages as there are questions.
  return { title: q ? `${q.slice(0, 60)}: search` : "Search", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const kind = KINDS.find((k) => k.id === params.kind)?.id as Kind | undefined;
  const page = Math.max(1, Number(params.page) || 1);

  if (!q) {
    return (
      <div className="shell pt-10 pb-16 lg:pt-16">
        <h1 className="heading-1">Search</h1>
        <div className="mt-6 max-w-2xl">
          <SearchBox size="lg" id="search" autoFocus />
        </div>
        <p className="body-2 measure mt-6 text-ink-subtle">Ask for a kind of business and a town, a business by name, or a question about starting and running one.</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <Link prefetch={false} href={`/search?q=${encodeURIComponent(example)}`} className="body-3 inline-flex min-h-11 items-center text-ink-subtle">
                {example}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const a = search(q, { kind, page });
  const total = a.counts.listing + a.counts.guide + a.counts.official + a.counts.site;
  const href = (k?: Kind, n = 1) => `/search?q=${encodeURIComponent(q)}${k ? `&kind=${k}` : ""}${n > 1 ? `&page=${n}` : ""}`;
  const pagesOf = (k: Kind) => Math.ceil(a.counts[k] / PAGE_SIZE);
  const showing = kind ?? "listing";
  const understood = a.category || a.place ? [a.category?.label, a.place ? `in ${a.place.name}` : null].filter(Boolean).join(" ") : null;

  return (
    <div className="shell pt-8 pb-16 lg:pt-10">
      <h1 className="sr-only">Search results for {q}</h1>
      <div className="max-w-2xl">
        <SearchBox size="lg" id="search" initial={q} />
      </div>

      <p className="body-3 mt-4 text-ink-subtle" role="status">
        {total === 0 ? `Nothing found for “${q}”.` : `${count(total)} ${total === 1 ? "result" : "results"}${understood ? `. Read as: ${understood}` : ""}.`}
      </p>

      {a.ways.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {a.ways.map((w) => (
            <li key={w.href}>
              <Link prefetch={false} href={w.href} className="btn btn-quiet button-sm">
                {w.label} <span className="data-2 text-ink-faint">{count(w.n)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <nav aria-label="Kinds of result" className="tabs mt-6">
          <Link prefetch={false} href={href()} aria-current={!kind ? "page" : undefined} className="tab title-2">
            All
          </Link>
          {KINDS.filter((k) => a.counts[k.id] > 0).map((k) => (
            <Link prefetch={false} key={k.id} href={href(k.id)} aria-current={kind === k.id ? "page" : undefined} className="tab title-2">
              {k.label} <span className="n data-2">{count(a.counts[k.id])}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          {total === 0 && (
            <div className="mt-8 max-w-prose">
              <p className="body-2 text-ink-subtle">Try a kind of business and a town (“hardware in Goodlands”), a name, or fewer words. The directory lists every category, and a business that is missing can be added.</p>
              <p className="mt-6 flex flex-wrap gap-3">
                <Link prefetch={false} href="/directory" className="btn btn-quiet button-md">
                  Browse the directory
                </Link>
                <Link prefetch={false} href="/add" className="btn btn-quiet button-md">
                  Add a business
                </Link>
              </p>
            </div>
          )}

          {a.guides.length > 0 && (
            <section aria-labelledby="r-guides" className="mt-8">
              <h2 id="r-guides" className="label-1 pb-3 text-ink-faint">
                From the guides
              </h2>
              <ul className="rows">
                {a.guides.map((hit) => (
                  <li key={hit.guide.slug}>
                    <GuideRow hit={hit} />
                  </li>
                ))}
              </ul>
              {!kind && a.counts.guide > a.guides.length && (
                <Link prefetch={false} href={href("guide")} className="body-3 mt-3 inline-flex min-h-11 items-center text-ink-subtle">
                  All {count(a.counts.guide)} guides that answer
                </Link>
              )}
              {kind === "guide" && <Pager page={page} pages={pagesOf("guide")} href={(n) => href("guide", n)} />}
            </section>
          )}

          {a.listings.length > 0 && (
            <section aria-labelledby="r-listings" className="mt-8">
              <h2 id="r-listings" className="label-1 pb-3 text-ink-faint">
                Businesses and services
              </h2>
              <ul className="rows">
                {a.listings.map((l) => (
                  <li key={l.id}>
                    <ListingRow listing={l} />
                  </li>
                ))}
              </ul>
              {showing === "listing" && <Pager page={page} pages={pagesOf("listing")} href={(n) => href(kind, n)} />}
            </section>
          )}

          {a.official.length > 0 && (
            <section aria-labelledby="r-official" className="mt-10">
              <h2 id="r-official" className="label-1 pb-3 text-ink-faint">
                Official pages
              </h2>
              <ul className="rows">
                {a.official.map((o) => (
                  <li key={o.url}>
                    <OfficialRow official={o} />
                  </li>
                ))}
              </ul>
              {!kind && a.counts.official > a.official.length && (
                <Link prefetch={false} href={href("official")} className="body-3 mt-3 inline-flex min-h-11 items-center text-ink-subtle">
                  All {count(a.counts.official)} official pages that answer
                </Link>
              )}
              {kind === "official" && <Pager page={page} pages={pagesOf("official")} href={(n) => href("official", n)} />}
            </section>
          )}

          {a.sites.length > 0 && (
            <section aria-labelledby="r-sites" className="mt-10">
              <h2 id="r-sites" className="label-1 pb-3 text-ink-faint">
                Mauritian websites
              </h2>
              <ul className="rows">
                {a.sites.map((s) => (
                  <li key={s.host}>
                    <SiteRow site={s} />
                  </li>
                ))}
              </ul>
              {!kind && a.counts.site > a.sites.length && (
                <Link prefetch={false} href={href("site")} className="body-3 mt-3 inline-flex min-h-11 items-center text-ink-subtle">
                  All {count(a.counts.site)} websites that answer
                </Link>
              )}
              {kind === "site" && <Pager page={page} pages={pagesOf("site")} href={(n) => href("site", n)} />}
            </section>
          )}
        </div>

        {a.points.length > 0 && (
          <aside className="hidden chart:col-span-5 chart:block">
            <div className="sticky top-24 pt-8">
              <Chart className="chart-side" lit={a.points} labels={false} says={`A chart of Mauritius with the ${count(a.points.length)} listings that answer this search lit.`} />
              <p className="caption-1 mt-3 text-ink-faint">
                Lit on the chart: {count(a.points.length)} of the {count(a.counts.listing)} that answer.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
