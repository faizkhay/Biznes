import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import { IndexItem } from "@/components/Bits";
import Chart from "@/components/Chart";
import { Arrow, Book, Calc, Calendar, Fork, Glass, GroupIcon, Landmark, Phone, Pin, Store, Tick } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import LitCount from "@/components/LitCount";
import SearchBox from "@/components/SearchBox";
import { ACTIONS, BAZ, EXAMPLES, MENU, PROMISES, SHELVES, START, site } from "@/data/site";
import { emergency } from "@/lib/emergency";
import { food } from "@/lib/food";
import { count, day } from "@/lib/format";
import { holidays, longDay } from "@/lib/holidays";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { publisher } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { themeNow, todayInMauritius } from "@/lib/theme";
import { TOOLS } from "@/lib/tools";

export const metadata = pageMeta({ title: `${site.name} · ${site.line}`, description: site.summary, path: "/", whole: true });

const START_ICON: Record<string, React.ReactNode> = { "/baz-manzer": <Fork />, "/emergency": <Phone />, "/holidays": <Calendar />, "/directory": <Store />, "/learn": <Book />, "/places": <Pin /> };
const TOOL_ICON: Record<string, React.ReactNode> = { "/tools/verify": <Landmark />, "/tools/vat": <Calc />, "/tools/structures": <GroupIcon group="companies" />, "/learn/glossary": <Book /> };
const more = "body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link no-underline hover:underline";

export default async function Home() {
  const { meta, groups, places, guides } = index();
  const towns = [...places].filter((p) => p.kind === "town").sort((a, b) => b.n - a.n);
  const theme = await themeNow();
  // The guides shown on the first screen: the first of each shelf, then the next business ones.
  const shelves = SHELVES.map((shelf) => ({ ...shelf, n: guides.filter((g) => (g.shelf ?? "business") === shelf.id).length })).filter((shelf) => shelf.n > 0);
  const firsts = shelves.map((shelf) => guides.find((g) => (g.shelf ?? "business") === shelf.id)!);
  const featured = [...firsts, ...guides.filter((g) => !firsts.includes(g))].slice(0, 6);
  // The start of the page: the things people most often need, each said in what the data holds today.
  const eat = food();
  const numbers = emergency();
  const first = numbers?.groups[0]?.items[0];
  const today = todayInMauritius();
  const next = Object.values(holidays()?.years ?? {})
    .flat()
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((h) => h.date >= today);
  const said: Record<string, string | undefined> = {
    "/baz-manzer": `${count(eat.listings.length)} places to eat and drink`,
    "/emergency": first ? `${first.name}: ${first.number}. ${count(numbers!.groups.reduce((n, g) => n + g.items.length, 0))} numbers in all` : undefined,
    "/holidays": next ? `Next: ${next.name}, ${longDay(next.date).replace(/ \d{4}$/, "")}` : undefined,
    "/directory": `${count(meta.listings.all)} listings in ${count(meta.categories)} categories`,
    "/learn": `${count(guides.length)} articles, every figure with its source`,
    "/places": `${count(meta.towns)} towns and villages`,
  };
  const pages = new Map<string, { label: string; line: string }>();
  for (const group of MENU) for (const item of group.items) pages.set(item.href, item);
  const start = START.map((href) => ({ href, label: pages.get(href)?.label ?? href, line: said[href] ?? pages.get(href)?.line ?? "" }));
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: site.name,
            url: siteUrl,
            description: site.description,
            inLanguage: "en",
            publisher: publisher(),
            potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={query}` }, "query-input": "required name=query" },
          },
          // Who is behind the site: the company, as it is registered, and how to reach it.
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.builder.legalName,
            alternateName: site.builder.name,
            url: site.builder.url,
            identifier: site.builder.brn,
            telephone: site.contact.phone,
            email: site.contact.email,
            address: { "@type": "PostalAddress", addressCountry: "MU" },
            brand: { "@type": "Brand", name: site.name, url: siteUrl },
          },
        ]}
      />

      {/* The first screen: one question, set on the day's picture. */}
      <section className="hero-open shell">
        <Link prefetch={false} href="/data" className="pill-note caption-1">
          <span>
            {theme.greeting}. {count(meta.listings.all)} businesses and services<span className="hidden sm:inline">, {count(meta.towns)} towns and villages</span>
          </span>
        </Link>
        <h1 className="display-1 mx-auto mt-6 max-w-3xl">Find it in Mauritius.</h1>
        <p className="body-1 mx-auto mt-4 max-w-xl text-balance text-ink-subtle">{site.line}: who does what, where they are, and how business works here.</p>
        <div className="mt-8 w-full max-w-2xl">
          <SearchBox size="lg" light deskFocus hotkey id="home-search" />
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Searches to try">
          {EXAMPLES.slice(0, 3).map((q) => (
            <li key={q}>
              <Link prefetch={false} href={`/search?q=${encodeURIComponent(q)}`} className="try body-3">
                <Glass /> {q}
              </Link>
            </li>
          ))}
          <li>
            <Link prefetch={false} href={BAZ.href} className="try body-3">
              <Fork /> {BAZ.name}
            </Link>
          </li>
          <li>
            <Link prefetch={false} href="/emergency" className="try body-3">
              <Phone /> Emergency numbers
            </Link>
          </li>
        </ul>
      </section>

      {/* The start of the page: quick ways to what people need most, each said in what the data holds today. */}
      <nav aria-label="Start here" className="shell pt-6 lg:pt-8">
        <ul className="start">
          {start.map((item) => (
            <li key={item.href}>
              <Link prefetch={false} href={item.href} className="start-tile">
                <span className="tile-icon">{START_ICON[item.href]}</span>
                <span className="min-w-0">
                  <span className="title-2 block">{item.label}</span>
                  <span className="caption-1 block text-ink-subtle">{item.line}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shell empty:hidden">
        <AdSlot place="home" className="mt-6" />
      </div>

      {/* Baz Manzer: where to eat, under the awning of its own page. */}
      <section aria-labelledby="baz" className="shell pt-10 lg:pt-12">
        <div className="baz-head">
          <span className="baz-awning" aria-hidden />
          <div className="baz-words">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="label-1 flex items-center gap-2 text-ink-subtle">
                  <Fork className="size-4" /> {BAZ.kicker}
                </p>
                <h2 id="baz" className="heading-1 mt-2">
                  {BAZ.name}
                </h2>
                <p className="body-2 measure mt-2 text-ink-subtle">
                  {BAZ.line}: {count(eat.listings.length)} places, by kind of food and by town.
                </p>
              </div>
              <Link prefetch={false} href={BAZ.href} className="btn btn-ink button-md">
                Find a place to eat
                <span className="btn-dot">
                  <Arrow />
                </span>
              </Link>
            </div>
            <ul className="narrow mt-4" aria-label="Kinds of food">
              {eat.cuisines.slice(0, 8).map((c, i) => (
                <li key={c.id} className={i >= 5 ? "hidden sm:block" : undefined}>
                  <Link prefetch={false} href={`${BAZ.href}?food=${c.id}`} className="body-3" rel="nofollow">
                    {c.label} <span className="n data-2">{count(c.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* A line for whoever owns a business: it is probably here already. */}
      <section aria-label="For business owners" className="shell pt-8 lg:pt-10">
        <Link prefetch={false} href="/pricing" className="card flex flex-wrap items-center justify-between gap-x-8 gap-y-3 no-underline">
          <span>
            <span className="title-1 block">Own a business in Mauritius?</span>
            <span className="body-3 mt-1 block text-ink-subtle">It is probably listed here already, free. Claim it, keep it right, and see what the paid plans add.</span>
          </span>
          <span className="btn btn-ink btn-sm button-sm">
            {ACTIONS.list}
            <span className="btn-dot">
              <Arrow />
            </span>
          </span>
        </Link>
      </section>

      {/* The directory, by its groups: thirteen ways in, each with how many it holds. */}
      <section aria-labelledby="directory" className="shell pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h2 id="directory" className="heading-2">
            Browse the directory
          </h2>
          <Link prefetch={false} href="/directory" className={more}>
            Every category <Arrow className="size-4" />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:-mx-3 sm:gap-x-4 sm:gap-y-1 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((g, i) => (
            <li key={g.id} className={i >= 7 ? "hidden sm:block" : undefined}>
              <Link prefetch={false} href={`/directory#g-${g.id}`} className="tile">
                <span className="tile-icon">
                  <GroupIcon group={g.id} />
                </span>
                <span className="min-w-0">
                  <span className="title-2 block">{g.label}</span>
                  <span className="tile-n data-2 block">{count(g.n)} listed</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link prefetch={false} href="/directory" className="tile">
              <span className="tile-icon">
                <Arrow />
              </span>
              <span className="min-w-0">
                <span className="title-2 block">Every category</span>
                <span className="tile-n data-2 block">{count(meta.categories)} kinds of business</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>

      {/* The island: every listing at its own place, and the towns with the most. */}
      <section aria-labelledby="places" className="shell py-12 lg:py-16">
        <div className="grid items-center gap-x-16 gap-y-10 chart:grid-cols-12">
          <div className="chart:col-span-6">
            <h2 id="places" className="heading-2">
              By town and village
            </h2>
            <p className="body-2 measure mt-3 text-ink-subtle">Every listing is at its own place on the island. Pick a town to see what is there.</p>
            <div className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {towns.slice(0, 12).map((p, i) => (
                <div key={p.slug} className={i >= 6 ? "hidden sm:block" : undefined}>
                  <IndexItem href={`/places/${p.slug}`} label={p.name} n={p.n} />
                </div>
              ))}
            </div>
            <Link prefetch={false} href="/places" className={`${more} mt-3`}>
              All {count(meta.towns)} towns and villages <Arrow className="size-4" />
            </Link>
          </div>
          <div className="chart:col-span-6">
            <div className="mx-auto max-w-xl">
              <Chart follow says={`A chart of Mauritius and Rodrigues on which each of ${count(meta.listings.onTheMap)} listings is a point of light at its own place.`} />
              <p className="caption-1 mt-3 flex flex-wrap justify-between gap-x-6 text-ink-faint">
                <span>Every point is one listing. Map data as of {day(meta.map.stamp)}.</span>
                <LitCount />
              </p>
            </div>
          </div>
        </div>
      </section>

      {guides.length > 0 && (
        <section aria-labelledby="learn" className="shell py-12 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <div>
              <h2 id="learn" className="heading-2">
                Articles about Mauritius
              </h2>
              <p className="body-2 measure mt-3 text-ink-subtle">For doing business here, visiting, moving here and living here. Every figure is taken from an official source, named beside it, with the day it was checked.</p>
            </div>
            <Link prefetch={false} href="/learn" className={more}>
              All {count(guides.length)} articles <Arrow className="size-4" />
            </Link>
          </div>
          <ul className="narrow mt-4">
            {shelves.map((shelf) => (
              <li key={shelf.id}>
                <Link prefetch={false} href={`/learn#${shelf.id}`} className="body-3">
                  {shelf.label} <span className="data-2 text-ink-faint">{count(shelf.n)}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/emergency" className="body-3">
                Emergency numbers
              </Link>
            </li>
          </ul>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((g) => (
              <li key={g.slug}>
                <article className="card h-full">
                  <p className="label-1 text-ink-faint">{SHELVES.find((shelf) => shelf.id === (g.shelf ?? "business"))?.label}</p>
                  <h3 className="title-1 mt-2">
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

      <section aria-labelledby="tools" className="shell hidden py-12 sm:block lg:py-16">
        <h2 id="tools" className="heading-2">
          Tools
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <article className="card flex h-full gap-4">
                <span className="tile-icon">{TOOL_ICON[t.href] ?? <Calc />}</span>
                <div>
                  <h3 className="title-1">
                    <Link prefetch={false} href={t.href} className="row-title text-ink">
                      {t.title}
                    </Link>
                  </h3>
                  <p className="body-3 mt-1 text-ink-subtle">{t.what}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Where it all comes from, said plainly, and the way to put something right. */}
      <section aria-labelledby="sources" className="shell py-12 lg:py-16">
        <div className="grid gap-x-16 gap-y-8 chart:grid-cols-12">
          <div className="chart:col-span-5">
            <h2 id="sources" className="heading-2">
              Where it comes from
            </h2>
            <ul className="mt-6 grid gap-3">
              {PROMISES.map((p) => (
                <li key={p} className="body-2 flex gap-3">
                  <span className="mt-1 grid size-5 flex-none place-items-center rounded-full bg-signal">
                    <Tick className="size-3.5" strokeWidth={2.25} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="chart:col-span-7">
            <p className="body-2 measure hidden text-ink-subtle sm:block">
              A crawler builds the index. On its last run, on {day(meta.generated)}, it read {count(meta.listings.onTheMap)} named businesses and services from OpenStreetMap and {count(meta.listings.fromWikidata + meta.listings.joinedToWikidata)} organisations from Wikidata
              {meta.web.read ? `, then the front pages of ${count(meta.web.read)} websites, to take each one's own description of itself` : ""}. It obeys robots.txt, reads one page a site, and takes no email addresses. The map is fullest for shops, food and places to stay, and thin for offices and trades; {count(meta.listings.withPhone)} listings have a telephone number on record, and a listing is only as current as its last edit there, which each one states.
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
