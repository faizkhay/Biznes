import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import { Pager } from "@/components/Bits";
import Chart from "@/components/Chart";
import Filters, { narrowQuery } from "@/components/Filters";
import { Chevron, Glass, Phone, Pin } from "@/components/Icons";
import MapSwitch from "@/components/MapSwitch";
import { ShareButton } from "@/components/Save";
import { LeadRow, ListingRow, OfficialRow, SiteRow } from "@/components/Rows";
import SearchBox from "@/components/SearchBox";
import { EXAMPLES } from "@/data/site";
import { dialHref } from "@/lib/emergency";
import { owned } from "@/lib/accounts/owned";
import { anchorOf, count } from "@/lib/format";
import { index } from "@/lib/index";
import { KINDS, narrowOf, PAGE_SIZE, search, type Kind, type Narrow } from "@/lib/search";

type Params = { q?: string; kind?: string; page?: string; phone?: string; web?: string; town?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q } = await searchParams;
  // A page of results is never one to index: it is as many pages as there are questions.
  return { title: q ? `${q.slice(0, 60)}: search` : "Search", robots: { index: false, follow: true } };
}

const all = "body-3 mt-3 inline-flex min-h-11 items-center font-semibold text-link no-underline hover:underline";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const kind = KINDS.find((k) => k.id === params.kind)?.id as Kind | undefined;
  const page = Math.max(1, Number(params.page) || 1);

  if (!q) {
    return (
      <div className="shell pt-12 pb-16 text-center lg:pt-20">
        <h1 className="heading-1">Search</h1>
        <p className="body-1 mx-auto mt-3 max-w-xl text-balance text-ink-subtle">Ask for a kind of business and a town, a business by name, or a question about Mauritius: its holidays, its rules, how to start and run a business.</p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBox size="lg" id="search" autoFocus hotkey />
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Searches to try">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <Link prefetch={false} href={`/search?q=${encodeURIComponent(example)}`} className="try body-3">
                <Glass /> {example}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const narrow = narrowOf(params);
  const narrowing = Boolean(narrow.phone || narrow.web || narrow.town);
  // Businesses listed by their owners are laid over the index. With accounts off there are none.
  const own = await owned();
  const a = search(q, { kind, page, narrow, overlay: own.overlay });
  const paidShown = a.listings.some((l) => own.byRow.get(l.id)?.paid);
  const { meta, guides, guideBySlug } = index();
  const total = a.counts.listing + a.counts.guide + a.counts.official + a.counts.site;
  const href = (k?: Kind, n = 1, how: Narrow = narrow) => `/search?q=${encodeURIComponent(q)}${k ? `&kind=${k}` : ""}${narrowQuery(how)}${n > 1 ? `&page=${n}` : ""}`;
  const pagesOf = (k: Kind) => Math.ceil(a.counts[k] / PAGE_SIZE);
  const showing = kind ?? "listing";
  // The chart is for a question about who and where. A stray listing under a question about tax is not one.
  const charted = a.points.length > 0 && (a.who || a.points.length >= 5) && (!kind || kind === "listing");
  const says = `A chart of Mauritius with the ${count(a.points.length)} listings that answer this search lit.`;
  const onChart = `On the island: ${count(a.points.length)} of ${count(a.counts.listing)}.`;

  // The order is the same for every question. First, the pages of this site that answer; for a
  // question about how, or one a number or a date settles, the first of them is given as the
  // answer itself, large, with the page it is from. Then businesses. Then the parts of articles
  // that only mention the words. Then pages on other sites, folded away.
  const direct = !kind && a.leads[0] && (!a.who || a.leads[0].tag === "Number" || a.leads[0].tag === "Holiday") ? a.leads[0] : undefined;
  const others = direct ? a.leads.slice(1) : a.leads;
  // The article the answers are from, for what else it answers and for what to read next.
  const from = [...a.leads, ...a.mentions].map((lead) => (lead.href.startsWith("/learn/") ? guideBySlug.get(lead.href.slice(7).split(/[#?]/)[0]) : undefined)).find(Boolean);
  // "People also ask": the headings of that article that are questions, each a way to its part of the article. Nothing is made up for it.
  const given = new Set([...a.leads, ...a.mentions].map((lead) => lead.href));
  const asks = direct && from ? from.sections.filter((section) => section.heading.trim().endsWith("?") && !given.has(`/learn/${from.slug}#${anchorOf(section.heading)}`)).slice(0, 4) : [];
  const shown = new Set([...a.leads, ...a.mentions].map((lead) => lead.href.split("#")[0]));
  const more = [...guides.filter((g) => from && (g.shelf ?? "business") === (from.shelf ?? "business")), ...guides.filter((g) => !from || (g.shelf ?? "business") !== (from.shelf ?? "business"))].filter((g) => !shown.has(`/learn/${g.slug}`)).slice(0, 4);

  const answers = a.leads.length > 0 && (
    <section aria-labelledby="r-guides" className="mt-6">
      <h2 id="r-guides" className="label-1 pb-3 text-ink-faint">
        {direct && kind !== "guide" ? "The answer, from our pages" : a.leads.every((lead) => lead.tag === "Guide") ? "From our articles" : "From our pages"}
      </h2>
      {direct && (
        <article className="answer">
          <p className="body-1">{direct.line}</p>
          {direct.call && (
            <p className="mt-4 flex flex-wrap gap-3">
              {direct.call.map((number, i) => (
                <a key={number} href={dialHref(number)} className={`btn button-md ${i === 0 ? "btn-filled" : "btn-quiet"}`}>
                  <Phone /> Call <span className="tabular">{number}</span>
                </a>
              ))}
            </p>
          )}
          <p className="body-3 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-subtle">
            <span className="label-1 tag">{direct.tag === "Guide" ? "Article" : direct.tag}</span>
            <Link prefetch={false} href={direct.href} className="row-title title-2">
              {direct.title}
            </Link>
            {direct.meta && <span className="caption-1 text-ink-faint">{direct.meta}</span>}
          </p>
        </article>
      )}
      {others.length > 0 && (
        <ul className={`rows ${direct ? "mt-3" : ""}`}>
          {others.map((lead) => (
            <li key={lead.href}>
              {/* Before a list of businesses an article is a short card: the list is what was asked for. */}
              <LeadRow lead={lead} brief={a.who && !kind} />
            </li>
          ))}
        </ul>
      )}
      {asks.length > 0 && from && (
        <nav aria-labelledby="r-ask" className="asks mt-3">
          <h3 id="r-ask" className="title-2">
            People also ask
          </h3>
          <ul>
            {asks.map((section) => (
              <li key={section.heading}>
                <Link prefetch={false} href={`/learn/${from.slug}#${anchorOf(section.heading)}`} className="body-3">
                  <span>{section.heading}</span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
          <p className="caption-1 text-ink-faint">Each is answered in our article &ldquo;{from.title}&rdquo;.</p>
        </nav>
      )}
      {kind === "guide" && <Pager page={page} pages={pagesOf("guide")} href={(n) => href("guide", n)} />}
    </section>
  );

  const mentions = a.mentions.length > 0 && (
    <section aria-labelledby="r-mentions" className="mt-10">
      <h2 id="r-mentions" className="label-1 pb-3 text-ink-faint">
        Also mentioned in our articles
      </h2>
      <ul className="rows">
        {a.mentions.map((lead) => (
          <li key={lead.href}>
            <LeadRow lead={lead} brief />
          </li>
        ))}
      </ul>
      {a.counts.guide > a.leads.length + a.mentions.length && (
        <Link prefetch={false} href={href("guide")} className={all}>
          All {count(a.counts.guide)} of our pages that answer or mention it
        </Link>
      )}
    </section>
  );

  // Pages elsewhere: the official pages and the websites that answer.
  const elsewhere = (gap: string) => (
    <>
      {a.official.length > 0 && (
        <section aria-labelledby="r-official" className={gap}>
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
            <Link prefetch={false} href={href("official")} className={all}>
              All {count(a.counts.official)} official pages that answer
            </Link>
          )}
          {kind === "official" && <Pager page={page} pages={pagesOf("official")} href={(n) => href("official", n)} />}
        </section>
      )}
      {a.sites.length > 0 && (
        <section aria-labelledby="r-sites" className={gap}>
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
            <Link prefetch={false} href={href("site")} className={all}>
              All {count(a.counts.site)} websites that answer
            </Link>
          )}
          {kind === "site" && <Pager page={page} pages={pagesOf("site")} href={(n) => href("site", n)} />}
        </section>
      )}
    </>
  );

  return (
    <div className="shell pt-8 pb-16 lg:pt-10">
      <h1 className="sr-only">Search results for {q}</h1>
      <div className="grid gap-x-12 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <SearchBox size="lg" id="search" initial={q} hotkey />

          <div className="mt-4 flex items-start justify-between gap-4">
            <p className="body-3 pt-2 text-ink-subtle" role="status">
              {total === 0 ? `Nothing found for “${q}”.` : `${count(total)} ${total === 1 ? "result" : "results"}.`}
              <span className="text-ink-faint">
                {a.readAs ? ` Read as: ${a.readAs}.` : ""}
                {a.ignored ? ` No listing mentions “${a.ignored}”, so that was left out.` : ""}
                {a.spelling ? " Nothing matched as written, so close spellings are shown." : ""}
                {a.loose ? ` Nothing here holds all of “${q}”. What follows holds some of its words.` : ""}
              </span>
            </p>
            {total > 0 && <ShareButton title={`${q} on biznes.mu`} label="Share this search" />}
          </div>

          {a.near && (
            <p className="note body-3 mt-4">
              “{a.near.word}” is not a category of its own here, and the map is thin for trades and offices. If one is listed, it is under{" "}
              <Link prefetch={false} href={a.near.href}>
                {a.near.label}
              </Link>{" "}
              ({count(a.near.n)} listed), along with other kinds.{a.counts.listing > 0 ? " What follows is every listing that mentions the word." : ""}
            </p>
          )}

          {/* For a question about who and where: what the index holds for it, in a sentence of its own counts. */}
          {a.summary && !kind && (
            <p className="tally body-2 mt-4">
              <Pin />
              <span>{a.summary}</span>
            </p>
          )}

          {answers}

          {(kind || KINDS.filter((k) => a.counts[k.id] > 0).length > 1) && (
            <nav aria-label="Kinds of result" className="tabs mt-4">
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

          {(!kind || kind === "listing") && (a.facets.all > 1 || narrowing) && (
            <div className="mt-4">
              <Filters facets={a.facets} narrow={narrow} href={(how) => href(kind, 1, how)} />
            </div>
          )}

          {narrowing && a.counts.listing === 0 && a.facets.all > 0 && (
            <p className="note body-3 mt-4" role="status">
              None of the {count(a.facets.all)} listings that answer has that on record.{" "}
              <Link prefetch={false} href={href(kind, 1, {})}>
                Show them all
              </Link>
            </p>
          )}

          {a.listings.length > 0 && (
            <section aria-labelledby="r-listings" className="mt-6">
              <h2 id="r-listings" className="label-1 pb-3 text-ink-faint">
                Businesses and services
              </h2>
              <ul className="rows">
                {a.listings.map((l) => {
                  const o = own.byRow.get(l.id);
                  return (
                    <li key={l.id}>
                      <ListingRow listing={l} paid={o?.paid} verified={o?.verified} href={o && !o.listingId ? o.path : undefined} />
                    </li>
                  );
                })}
              </ul>
              {paidShown && (
                <p className="caption-1 mt-3 text-ink-faint">
                  A listing marked Priority is on a paid plan and is shown first among those that answer. <Link href="/data#order">How results are ordered</Link>.
                </p>
              )}
              {showing === "listing" && <Pager page={page} pages={pagesOf("listing")} href={(n) => href(kind, n)} />}
            </section>
          )}

          {/* A place for an advertisement, marked as one. Nothing at all until there is one for the day. */}
          {!kind && a.listings.length > 0 && <AdSlot place="results" className="mt-8" />}

          {a.related.length > 0 && (
            <nav aria-labelledby="r-related" className="mt-8">
              <h2 id="r-related" className="label-1 text-ink-faint">
                Related searches
              </h2>
              <ul className="narrow">
                {a.related.map((w) => (
                  <li key={w.href}>
                    <Link prefetch={false} href={w.href} className="body-3">
                      {w.href.startsWith("/search") && <Glass className="size-4 text-ink-faint" />}
                      {w.label} <span className="data-2 text-ink-faint">{count(w.n)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {a.ways.some((w) => !a.related.some((r) => r.label === w.label)) && (
            <nav aria-labelledby="r-ways" className="mt-6">
              <h2 id="r-ways" className="label-1 text-ink-faint">
                In the directory
              </h2>
              <ul className="narrow">
                {a.ways.filter((w) => !a.related.some((r) => r.label === w.label)).map((w) => (
                  <li key={w.href}>
                    <Link prefetch={false} href={w.href} className="body-3">
                      {w.label} <span className="data-2 text-ink-faint">{count(w.n)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* On a phone the island comes after the list: a name and a number come first. */}
          {charted && (
            <div className="mt-8 chart:hidden">
              <MapSwitch lit={a.points}>
                <div className="flex items-center gap-4">
                  <Chart className="chart-strip" lit={a.points} zoom says={says} />
                  <p className="caption-1 text-ink-faint">{onChart}</p>
                </div>
              </MapSwitch>
            </div>
          )}

          {mentions}

          {/* In the first view pages elsewhere are folded away as references, so the site's own
              pages and the businesses come first; each kind has its own tab. */}
          {!kind && a.official.length + a.sites.length > 0 ? (
            <details className="elsewhere mt-10">
              <summary className="filter body-3">
                References elsewhere <span className="n data-2">{count(a.counts.official + a.counts.site)}</span> <Chevron />
              </summary>
              <div>{elsewhere("mt-6")}</div>
            </details>
          ) : (
            elsewhere("mt-10")
          )}
        </div>

        {/* With no island to show, the side of the page offers what to read next on the site. */}
        {!charted && total > 0 && more.length > 0 && (
          <aside aria-labelledby="r-more" className="mt-12 chart:col-span-4 chart:col-start-9 chart:mt-0">
            <div className="card sticky top-24">
              <h2 id="r-more" className="label-1 text-ink-faint">
                Keep reading
              </h2>
              <ul className="mt-2">
                {more.map((g) => (
                  <li key={g.slug} className="border-b border-line last:border-b-0">
                    <Link prefetch={false} href={`/learn/${g.slug}`} className="block py-3 no-underline">
                      <span className="title-2 block text-link">{g.title}</span>
                      <span className="caption-1 mt-1 line-clamp-2 text-ink-subtle">{g.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link prefetch={false} href="/learn" className={all}>
                All articles
              </Link>
            </div>
          </aside>
        )}

        {charted && (
          <aside className="hidden chart:col-span-5 chart:block">
            <div className="sticky top-24">
              <MapSwitch lit={a.points}>
                <Chart className="chart-side" lit={a.points} zoom says={says} />
                <p className="caption-1 mt-3 text-ink-faint">{onChart} Point at a row to see where it is.</p>
              </MapSwitch>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
