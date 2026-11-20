import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/Bits";
import Chart from "@/components/Chart";
import { LeadRow, ListingRow, OfficialRow, SiteRow } from "@/components/Rows";
import SearchBox from "@/components/SearchBox";
import { EXAMPLES } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
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
          <SearchBox size="lg" id="search" autoFocus hotkey />
        </div>
        <p className="body-2 measure mt-6 text-ink-subtle">Ask for a kind of business and a town, a business by name, or a question about starting and running one.</p>
        <ul className="narrow mt-2">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <Link prefetch={false} href={`/search?q=${encodeURIComponent(example)}`} className="body-3">
                {example}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const a = search(q, { kind, page });
  const { meta } = index();
  const total = a.counts.listing + a.counts.guide + a.counts.official + a.counts.site;
  const href = (k?: Kind, n = 1) => `/search?q=${encodeURIComponent(q)}${k ? `&kind=${k}` : ""}${n > 1 ? `&page=${n}` : ""}`;
  const pagesOf = (k: Kind) => Math.ceil(a.counts[k] / PAGE_SIZE);
  const showing = kind ?? "listing";
  // The chart is for a question about who and where. A stray listing under a question about tax is not one.
  const charted = a.points.length > 0 && (a.who || a.points.length >= 5) && (!kind || kind === "listing");
  const says = `A chart of Mauritius with the ${count(a.points.length)} listings that answer this search lit.`;
  const onChart = `On the chart: ${count(a.points.length)} of ${count(a.counts.listing)}.`;

  const leads = a.leads.length > 0 && (
    <section aria-labelledby="r-guides" className="mt-8">
      <h2 id="r-guides" className="label-1 pb-3 text-ink-faint">
        {a.who ? "Also, from the guides" : "From the guides"}
      </h2>
      <ul className="rows">
        {a.leads.map((lead) => (
          <li key={lead.href}>
            <LeadRow lead={lead} />
          </li>
        ))}
      </ul>
      {!kind && a.counts.guide > a.leads.length && (
        <Link prefetch={false} href={href("guide")} className="body-3 mt-3 inline-flex min-h-11 items-center text-ink-subtle">
          All {count(a.counts.guide)} answers from the guides
        </Link>
      )}
      {kind === "guide" && <Pager page={page} pages={pagesOf("guide")} href={(n) => href("guide", n)} />}
    </section>
  );

  return (
    <div className="shell pt-8 pb-16 lg:pt-10">
      <h1 className="sr-only">Search results for {q}</h1>
      <div className="grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <SearchBox size="lg" id="search" initial={q} hotkey />

          <p className="body-3 mt-4 text-ink-subtle" role="status">
            {total === 0 ? `Nothing found for “${q}”.` : `${count(total)} ${total === 1 ? "result" : "results"}.`}
            {a.readAs ? ` Read as: ${a.readAs}.` : ""}
            {a.ignored ? ` No listing mentions “${a.ignored}”, so that was left out.` : ""}
            {a.spelling ? " Nothing matched as written, so close spellings are shown." : ""}
          </p>

          {a.near && (
            <p className="note body-3 mt-4">
              “{a.near.word}” is not a category of its own here, and the map is thin for trades and offices. If one is listed, it is under{" "}
              <Link prefetch={false} href={a.near.href}>
                {a.near.label}
              </Link>{" "}
              ({count(a.near.n)} listed), along with other kinds.{a.counts.listing > 0 ? " What follows is every listing that mentions the word." : ""}
            </p>
          )}

          {a.ways.length > 0 && (
            <ul className="narrow mt-2">
              {a.ways.map((w) => (
                <li key={w.href}>
                  <Link prefetch={false} href={w.href} className="body-3">
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

          {total === 0 && (
            <div className="mt-8 max-w-prose">
              <p className="body-2 text-ink-subtle">
                Try a kind of business and a town (“restaurants in Grand Baie”), a name, or fewer words. The directory holds {count(meta.listings.all)} listings and is fullest for shops, food and places to stay; a business that is missing can be added.
              </p>
              <p className="mt-6 flex flex-wrap gap-3">
                <Link href="/directory" className="btn btn-quiet button-md">
                  Browse the directory
                </Link>
                <Link href="/add" className="btn btn-quiet button-md">
                  Add a business
                </Link>
              </p>
            </div>
          )}

          {/* On a phone the chart is a small one above the list. */}
          {charted && (
            <div className="mt-6 flex items-center gap-4 chart:hidden">
              <Chart className="chart-strip" lit={a.points} zoom says={says} />
              <p className="caption-1 text-ink-faint">{onChart}</p>
            </div>
          )}

          {!a.who && leads}

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

          {a.who && leads}

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

        {charted && (
          <aside className="hidden chart:col-span-5 chart:block">
            <div className="sticky top-24">
              <Chart className="chart-side" lit={a.points} zoom says={says} />
              <p className="caption-1 mt-3 text-ink-faint">{onChart} Point at a row to see where it is.</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
