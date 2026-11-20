import Link from "next/link";
import { IndexItem } from "@/components/Bits";
import Chart from "@/components/Chart";
import { Arrow } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import LitCount from "@/components/LitCount";
import SearchBox from "@/components/SearchBox";
import { ACTIONS, EXAMPLES, site } from "@/data/site";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  const { meta, groups, categories, places, guides } = index();
  const towns = [...places].sort((a, b) => b.n - a.n).slice(0, 32).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          url: siteUrl,
          description: site.description,
          potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={query}`, "query-input": "required name=query" },
        }}
      />

      {/* The first screen: the question, and the island that answers it. */}
      <section className="shell grid items-start gap-x-12 gap-y-10 pt-10 pb-16 chart:grid-cols-12 chart:pt-16">
        <div className="chart:col-span-6 chart:pt-10">
          <h1 className="display-1">The search engine for business in Mauritius.</h1>
          <p className="body-1 measure mt-6 text-ink-subtle">Find a business or a service anywhere on the island, learn how to start and run one, and check one against the official registers.</p>
          <div className="mt-8 max-w-xl">
            <SearchBox size="lg" light id="home-search" />
          </div>
          <p className="body-3 mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-ink-faint">
            <span>Try</span>
            {EXAMPLES.map((q) => (
              <Link prefetch={false} key={q} href={`/search?q=${encodeURIComponent(q)}`} className="inline-flex min-h-8 items-center text-ink-subtle">
                {q}
              </Link>
            ))}
          </p>
          <p className="data-2 mt-10 max-w-xl text-ink-faint">
            {count(meta.listings.all)} listings in {count(meta.places)} towns and villages. {guides.length ? `${count(guides.length)} guides. ` : ""}Map data as of {day(meta.map.stamp)}.
          </p>
        </div>
        <div className="chart:col-span-6">
          <div className="ticked mx-auto max-w-2xl p-3">
            <Chart follow says={`A chart of Mauritius and Rodrigues on which each of ${count(meta.listings.onTheMap)} listings is a point of light at its own place.`} />
          </div>
          <p className="caption-1 mx-auto mt-3 flex max-w-2xl flex-wrap justify-between gap-x-6 text-ink-faint">
            <span>Every point is one listing, at its own place.</span>
            <LitCount />
          </p>
        </div>
      </section>

      {/* The directory, whole: every kind of business, with how many. */}
      <section aria-labelledby="directory" className="shell border-t border-line py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="directory" className="heading-2">
            The directory
          </h2>
          <Link prefetch={false} href="/directory" className="body-3 inline-flex min-h-11 items-center gap-2 text-ink-subtle">
            Every category <Arrow className="size-4" />
          </Link>
        </div>
        <div className="index-cols index-cols-4 mt-8">
          {groups.map((g) => (
            <div key={g.id} className="index-group">
              <h3 className="label-1 pb-2 text-ink-faint">{g.label}</h3>
              {categories
                .filter((c) => c.group === g.id)
                .sort((a, b) => b.n - a.n)
                .map((c) => (
                  <IndexItem key={c.id} href={`/directory/${c.id}`} label={c.label} n={c.n} />
                ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="places" className="shell border-t border-line py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="places" className="heading-2">
            By town and village
          </h2>
          <Link prefetch={false} href="/places" className="body-3 inline-flex min-h-11 items-center gap-2 text-ink-subtle">
            All {count(places.length)} places <Arrow className="size-4" />
          </Link>
        </div>
        <div className="index-cols index-cols-4 mt-8">
          {towns.map((p) => (
            <IndexItem key={p.slug} href={`/places/${p.slug}`} label={p.name} n={p.n} />
          ))}
        </div>
      </section>

      {guides.length > 0 && (
        <section aria-labelledby="learn" className="shell border-t border-line py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="learn" className="heading-2">
                How business works here
              </h2>
              <p className="body-2 measure mt-3 text-ink-subtle">Plain guides to starting and running a business in Mauritius. Every figure is taken from an official source, named beside it, with the day it was checked.</p>
            </div>
            <Link prefetch={false} href="/learn" className="body-3 inline-flex min-h-11 items-center gap-2 text-ink-subtle">
              All guides <Arrow className="size-4" />
            </Link>
          </div>
          <ul className="rows mt-8 grid gap-x-12 border-t-0 md:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug} className="border-t border-line">
                <article className="row">
                  <h3 className="title-1">
                    <Link prefetch={false} href={`/learn/${g.slug}`} className="row-title">
                      {g.title}
                    </Link>
                  </h3>
                  <p className="body-3 mt-1 line-clamp-2 text-ink-subtle">{g.summary}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="tools" className="shell border-t border-line py-16">
        <h2 id="tools" className="heading-2">
          Tools
        </h2>
        <ul className="rows mt-8">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <article className="row grid gap-x-12 gap-y-1 md:grid-cols-12">
                <h3 className="title-1 md:col-span-4">
                  <Link prefetch={false} href={t.href} className="row-title">
                    {t.title}
                  </Link>
                </h3>
                <p className="body-3 text-ink-subtle md:col-span-8">{t.what}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Where it all comes from, said plainly, and the way to put something right. */}
      <section aria-labelledby="sources" className="shell border-t border-line py-16">
        <div className="grid gap-x-12 gap-y-8 md:grid-cols-12">
          <h2 id="sources" className="heading-2 md:col-span-4">
            Where it comes from
          </h2>
          <div className="md:col-span-8">
            <p className="body-2 measure text-ink-subtle">
              A crawler builds the index. On its last run, on {day(meta.generated)}, it read {count(meta.listings.onTheMap)} named businesses and services from OpenStreetMap and {count(meta.listings.fromWikidata + meta.listings.joinedToWikidata)} organisations from Wikidata
              {meta.web.read ? `, then the front pages of ${count(meta.web.read)} websites, to take each one's own description of itself` : ""}. It obeys robots.txt, reads one page a site, and takes no email addresses. Each listing says where every part of it came from.
            </p>
            <p className="mt-6 flex flex-wrap gap-3">
              <Link prefetch={false} href="/data" className="btn btn-quiet button-md">
                Where the data comes from
              </Link>
              <Link prefetch={false} href="/add" className="btn btn-quiet button-md">
                {ACTIONS.add}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
