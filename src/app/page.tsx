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

/** Most listings first, with the "other" of a group always last. */
const byCount = (a: { id: string; n: number }, b: { id: string; n: number }) => Number(a.id.startsWith("other-")) - Number(b.id.startsWith("other-")) || b.n - a.n;

export default function Home() {
  const { meta, groups, categories, places, guides } = index();
  const largest = [...places].filter((p) => p.kind === "town").sort((a, b) => b.n - a.n);
  const towns = largest.slice(0, 32).sort((a, b) => a.name.localeCompare(b.name));
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

      {/* The first screen: the question, and the island that answers it. The box comes straight
          after the line, so it is on the screen of a small laptop without scrolling. */}
      <section className="shell grid items-start gap-x-12 gap-y-8 pt-8 pb-16 chart:grid-cols-12 chart:pt-12">
        <div className="chart:col-span-6 chart:pt-8">
          <h1 className="display-1">The search engine for business in Mauritius.</h1>
          <div className="mt-8 max-w-xl">
            <SearchBox size="lg" light deskFocus hotkey id="home-search" />
          </div>
          <div className="mt-1">
            <ul className="narrow" aria-label="Searches to try">
              <li className="body-3 inline-flex items-center text-ink-faint" aria-hidden>
                Try
              </li>
              {EXAMPLES.slice(0, 4).map((q) => (
                <li key={q}>
                  <Link prefetch={false} href={`/search?q=${encodeURIComponent(q)}`} className="body-3">
                    {q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="body-1 measure mt-8 text-ink-subtle">Find a business or a service across the island, learn how to start and run one, and check one against the official registers.</p>
          <p className="caption-1 mt-6 max-w-xl text-ink-faint">
            {count(meta.listings.all)} listings in {count(meta.towns)} towns and villages, {count(meta.listings.withPhone)} of them with a telephone number on record. {guides.length ? `${count(guides.length)} guides. ` : ""}Map data as of {day(meta.map.stamp)}.
          </p>
        </div>
        <div className="chart:col-span-6">
          <div className="ticked mx-auto max-w-2xl p-3">
            <Chart follow degreesShown says={`A chart of Mauritius and Rodrigues on which each of ${count(meta.listings.onTheMap)} listings is a point of light at its own place.`} />
          </div>
          <p className="caption-1 mx-auto mt-3 flex max-w-2xl flex-wrap justify-between gap-x-6 text-ink-faint">
            <span>Every point is one listing, at its own place.</span>
            <LitCount />
          </p>
        </div>
      </section>

      {/* The directory, whole: every kind of business, with how many. On a phone, its groups. */}
      <section aria-labelledby="directory" className="shell border-t border-line py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="directory" className="heading-2">
            The directory
          </h2>
          <Link prefetch={false} href="/directory" className="body-3 inline-flex min-h-11 items-center gap-2 text-ink-subtle">
            Every category <Arrow className="size-4" />
          </Link>
        </div>
        <div className="mt-8 sm:hidden">
          {groups.map((g) => (
            <IndexItem key={g.id} href={`/directory#g-${g.id}`} label={g.label} n={g.n} />
          ))}
        </div>
        <div className="index-cols index-cols-4 mt-8 hidden sm:block">
          {groups.map((g) => (
            <div key={g.id} className="index-group">
              <h3 className="label-1 pb-2 text-ink-faint">{g.label}</h3>
              {categories
                .filter((c) => c.group === g.id)
                .sort(byCount)
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
            All {count(meta.towns)} towns and villages <Arrow className="size-4" />
          </Link>
        </div>
        <div className="mt-8 sm:hidden">
          {largest.slice(0, 10).map((p) => (
            <IndexItem key={p.slug} href={`/places/${p.slug}`} label={p.name} n={p.n} />
          ))}
        </div>
        <div className="index-cols index-cols-4 mt-8 hidden sm:block">
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
            {[...guides.map((g) => ({ href: `/learn/${g.slug}`, title: g.title, line: g.summary })), { href: "/learn/glossary", title: "Glossary", line: "The names and initials a business in Mauritius meets, each explained in a sentence from the guides." }].map((g) => (
              <li key={g.href} className="border-t border-line">
                <article className="row">
                  <h3 className="title-1">
                    <Link prefetch={false} href={g.href} className="row-title">
                      {g.title}
                    </Link>
                  </h3>
                  <p className="body-3 mt-1 line-clamp-2 text-ink-subtle">{g.line}</p>
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
              {meta.web.read ? `, then the front pages of ${count(meta.web.read)} websites, to take each one's own description of itself` : ""}. It obeys robots.txt, reads one page a site, and takes no email addresses. Each listing says where every part of it came from. The map is fullest for shops, food and places to stay, and thin for offices and trades; a listing is only as current as its last edit there, which each one states.
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
