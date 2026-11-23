import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import AdSlot from "@/components/account/AdSlot";
import Chart from "@/components/Chart";
import { CategoryIcon, DistrictIcon, FoodIcon, GroupGlyph, PageIcon } from "@/components/Glyphs";
import { Arrow, Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { ListingRow } from "@/components/Rows";
import { ABOUT, BAZ, HOME, MENU, MORE_PAGE, YOURS, site } from "@/data/site";
import { owned } from "@/lib/accounts/owned";
import { dialHref, emergency } from "@/lib/emergency";
import { food } from "@/lib/food";
import { count, day } from "@/lib/format";
import { holidays, longDay } from "@/lib/holidays";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { itemList } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { themeNow, todayInMauritius } from "@/lib/theme";
import { TOP_SHOWN, topBusinesses } from "@/lib/top";

export const metadata: Metadata = pageMeta({ title: HOME.title, description: HOME.description, path: HOME.href, drawn: true });

/** Every page the menu names, by its address: a tile on this page is called what the menu calls it. */
const NAMED = new Map<string, { label: string; line: string }>([...MENU.flatMap((group) => [...group.items]), ...YOURS, ...ABOUT].map((item) => [item.href, item]));
const [TOP, EAT, CATEGORIES, REGIONS, USEFUL] = HOME.parts;
const all = "body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link no-underline hover:underline";

/**
 * A way in: an icon beside a name, what it holds, and if wanted a line more. `quiet` is the
 * smaller tile of a kind within a group. The icon's size is set once, on `.home` in globals.css.
 */
function Tile({ href, icon, label, note, more, quiet = false, rel }: { href: string; icon: React.ReactNode; label: string; note?: string; more?: React.ReactNode; quiet?: boolean; rel?: string }) {
  return (
    <Link prefetch={false} href={href} rel={rel} className={quiet ? "tile tile-quiet h-full" : "tile h-full"}>
      <span className="tile-icon">{icon}</span>
      <span className="min-w-0">
        <span className="title-2 block">{label}</span>
        {note && <span className="tile-n data-2 block">{note}</span>}
        {more && <span className="caption-1 mt-0.5 block text-ink-subtle">{more}</span>}
      </span>
    </Link>
  );
}

/** A part's heading, the line under it, and the way to see all of it. */
function PartHead({ id, label, line, to }: { id: string; label: string; line: React.ReactNode; to: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
      <div className="min-w-0">
        <h2 id={id} className="heading-2">
          {label}
        </h2>
        <p className="body-3 measure mt-2 text-ink-subtle">{line}</p>
      </div>
      <Link prefetch={false} href={to.href} className={all}>
        {to.label} <Arrow className="size-4" />
      </Link>
    </div>
  );
}

/**
 * The Home page: everything the site holds, set out on one page a Mauritian can keep open. Five
 * parts, in the owner's order: the top businesses, Baz Manzer, the categories, the regions, and
 * what is useful (the numbers to call, the next public holiday, and the pages people come back
 * to). Each has a plain heading and a way to see all of it, and every figure is counted from the
 * index on the day. Nothing here is typed in.
 *
 * It works with accounts off, when no business is on a paid plan and no advertisement runs, and
 * with them on, when the verified businesses on a paid plan lead the first part and are marked.
 */
export default async function HomePage() {
  const { meta, groups, categories, districts, places, guides, glossary, official, categoryById } = index();
  const theme = await themeNow();
  const top = topBusinesses(await owned());
  const pathOf = (business: (typeof top.shown)[number]) => (business.owned && !business.owned.listingId ? business.owned.path : `/b/${business.listing.slug}`);

  // How the top businesses are chosen, in a line. The same is said at more length on /data.
  const open = top.shown.length - top.paid;
  const fullest = `the ${count(top.full)} listings with a telephone number, a website, opening hours and an address on record`;
  const chosen =
    top.paid === 0
      ? `These are ${count(open)} of ${fullest}, a different ${count(open)} each day. A verified business on a paid plan comes first and is marked.`
      : open > 0
        ? `A verified business on a paid plan comes first and is marked. The other ${count(open)} are from ${fullest}, and change each day.`
        : `Verified businesses on a paid plan come first and are marked. Today they fill all ${count(TOP_SHOWN)} places, and take turns by the day when there are more.`;

  const eat = food();
  const kinds = [...categories].sort((a, b) => b.n - a.n).slice(0, 12);
  const regions = districts.filter((d) => d.n > 0).sort((a, b) => b.n - a.n);
  const towns = places.filter((p) => p.kind === "town");
  // A district's three largest towns. Each name is kept whole on its line where it fits: "Beau Bassin-Rose Hill" does not break at its hyphen.
  const largest = (district: string) =>
    towns
      .filter((p) => p.district === district)
      .sort((a, b) => b.n - a.n)
      .slice(0, 3)
      .map((p, i, three) => (
        <Fragment key={p.slug}>
          <span className="inline-block">
            {p.name}
            {i < three.length - 1 ? "," : ""}
          </span>{" "}
        </Fragment>
      ));
  const mainland = regions.filter((d) => d.slug !== "rodrigues").length;

  const numbers = emergency();
  const first = numbers?.groups[0];
  const dates = holidays();
  const today = todayInMauritius();
  // The next public holiday, and the two after it.
  const coming = Object.values(dates?.years ?? {})
    .flat()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((h) => h.date >= today)
    .slice(0, 3);
  // What each useful page holds today, where the data can say; otherwise the menu's own line about it.
  const said: Record<string, string> = {
    "/learn": `${count(guides.length)} articles, every figure with its source`,
    "/learn/glossary": `${count(glossary.length)} terms, each explained in a sentence`,
    "/official": `${count(official.length)} pages on official sites`,
  };
  const useful = HOME.useful.map((href) => ({ href, label: NAMED.get(href)?.label ?? href, line: said[href] ?? NAMED.get(href)?.line ?? "" }));

  return (
    <div className="home">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${HOME.label}: ${site.name}`,
          url: `${siteUrl}${HOME.href}`,
          description: HOME.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: site.name, url: siteUrl },
          mainEntity: itemList(
            TOP.label,
            top.shown.map((business) => business.listing),
            (l) => pathOf(top.shown.find((business) => business.listing.slug === l.slug)!),
          ),
        }}
      />

      <div className="shell pt-8 pb-10 lg:pt-12">
        <p className="pill-note caption-1">
          <span>{theme.greeting}</span>
        </p>
        <h1 className="heading-1 mt-4">{HOME.label}</h1>
        <p className="body-1 measure mt-4 text-ink-subtle">{HOME.lede}</p>
        <nav aria-label="On this page" className="mt-4">
          <ul className="narrow">
            {HOME.parts.map((part) => (
              <li key={part.id}>
                <a href={`#${part.id}`} className="body-3">
                  {part.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* 1. The top businesses: the paid and verified first, then the day's turn of the fullest listings. */}
      <section aria-labelledby={TOP.id} className="shell">
        <PartHead
          id={TOP.id}
          label={TOP.label}
          to={{ href: "/directory", label: `All ${count(meta.listings.all)} listings` }}
          line={
            <>
              {chosen} <Link href={`/data#${TOP.id}`}>How they are chosen</Link>.
            </>
          }
        />
        <ul className="top-list mt-6">
          {top.shown.map((business) => (
            <li key={business.listing.id}>
              <ListingRow listing={business.listing} paid={business.owned?.paid} verified={business.owned?.verified} href={business.owned && !business.owned.listingId ? business.owned.path : undefined} />
            </li>
          ))}
        </ul>
      </section>

      {/* An advertisement, when one is running for this page: after the top businesses, never among them, and always marked. */}
      <div className="shell empty:hidden">
        <AdSlot place="home" className="mt-8" />
      </div>

      {/* 2. Baz Manzer: where to eat, under the awning of its own section. */}
      <section aria-labelledby={EAT.id} className="shell pt-12 lg:pt-16">
        <div className="baz-head">
          <span className="baz-awning" aria-hidden />
          <div className="baz-words">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div className="min-w-0">
                <p className="label-1 text-ink-subtle">{BAZ.kicker}</p>
                <h2 id={EAT.id} className="heading-1 mt-2">
                  {EAT.label}
                </h2>
                <p className="body-2 measure mt-2 text-ink-subtle">
                  {BAZ.line}: {count(eat.listings.length)} places, by kind of place, by kind of food and by town.
                </p>
              </div>
              <Link prefetch={false} href={BAZ.href} className="btn btn-ink button-md">
                {HOME.eat}
                <span className="btn-dot">
                  <Arrow />
                </span>
              </Link>
            </div>
            <h3 className="label-1 mt-8 text-ink-faint">Kinds of place</h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {eat.types.map((type) => (
                <li key={type.id}>
                  <Tile href={`${BAZ.href}?type=${type.id}`} rel="nofollow" icon={<CategoryIcon id={type.id} group={type.group} />} label={type.label} note={`${count(type.n)} listed`} />
                </li>
              ))}
            </ul>
            <h3 className="label-1 mt-6 text-ink-faint">Most listed kinds of food</h3>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {eat.cuisines.slice(0, 8).map((cuisine) => (
                <li key={cuisine.id}>
                  <Tile quiet href={`${BAZ.href}?food=${cuisine.id}`} rel="nofollow" icon={<FoodIcon id={cuisine.id} />} label={cuisine.label} note={`${count(cuisine.n)} places`} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. The categories: the directory's groups, each leading to its part of the directory, and the kinds most listed. */}
      <section aria-labelledby={CATEGORIES.id} className="shell pt-12 lg:pt-16">
        <PartHead
          id={CATEGORIES.id}
          label={CATEGORIES.label}
          line={`${count(meta.listings.all)} businesses and services, in ${count(groups.length)} groups and ${count(meta.categories)} kinds.`}
          to={{ href: "/directory", label: `All ${count(meta.categories)} categories` }}
        />
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => (
            <li key={group.id}>
              <Tile href={`/directory#g-${group.id}`} icon={<GroupGlyph id={group.id} />} label={group.label} note={`${count(group.n)} listed`} />
            </li>
          ))}
        </ul>
        <h3 className="label-1 mt-8 text-ink-faint">Most listed kinds of business</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {kinds.map((kind) => (
            <li key={kind.id}>
              <Tile quiet href={`/directory/${kind.id}`} icon={<CategoryIcon id={kind.id} group={categoryById.get(kind.id)?.group} />} label={kind.label} note={`${count(kind.n)} listed`} />
            </li>
          ))}
        </ul>
      </section>

      {/* 4. The regions: the districts and Rodrigues, each leading to its part of the towns, beside the island they make up. */}
      <section aria-labelledby={REGIONS.id} className="shell pt-12 lg:pt-16">
        <PartHead
          id={REGIONS.id}
          label={REGIONS.label}
          line={`The ${count(mainland)} districts of Mauritius and the island of Rodrigues, each with its largest towns.`}
          to={{ href: "/places", label: `All ${count(meta.towns)} towns and villages` }}
        />
        <div className="mt-6 grid items-center gap-x-12 gap-y-8 chart:grid-cols-12">
          <ul className="grid gap-2 sm:grid-cols-2 chart:col-span-6">
            {regions.map((district) => (
              <li key={district.slug}>
                <Tile href={`/places#d-${district.slug}`} icon={<DistrictIcon slug={district.slug} />} label={district.name} note={`${count(district.n)} listed`} more={largest(district.name)} />
              </li>
            ))}
          </ul>
          <div className="chart:col-span-6">
            <div className="mx-auto max-w-xl">
              <Chart says={`A chart of Mauritius and Rodrigues on which each of ${count(meta.listings.onTheMap)} listings is a point at its own place.`} />
              <p className="caption-1 mt-3 text-ink-faint">Every point is one listing. Map data as of {day(meta.map.stamp)}.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Useful: the numbers to call, the next public holiday, and the pages people come back to. */}
      <section aria-labelledby={USEFUL.id} className="shell pt-12 lg:pt-16">
        <PartHead id={USEFUL.id} label={USEFUL.label} line="The numbers to call, the next public holiday, and the pages people come back to." to={{ href: MORE_PAGE.href, label: MORE_PAGE.all }} />
        <div className="mt-6 grid gap-3 lg:grid-cols-12">
          {numbers && first && (
            <article className="card lg:col-span-7" aria-labelledby="numbers">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                <h3 id="numbers" className="title-1 flex items-center gap-3">
                  <span className="tile-icon">
                    <PageIcon href="/emergency" />
                  </span>
                  {NAMED.get("/emergency")?.label}
                </h3>
                <Link prefetch={false} href="/emergency" className={all}>
                  All {count(numbers.groups.reduce((n, group) => n + group.items.length, 0))} numbers <Arrow className="size-4" />
                </Link>
              </div>
              <ul className="dial mt-4">
                {first.items.map((item, i) => (
                  <li key={item.name}>
                    <span className="title-2">{item.name}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      {[item.number, ...(item.also ?? [])].map((number, j) => (
                        <a key={number} href={dialHref(number)} className={i === 0 && j === 0 ? "btn btn-filled data-1" : "act data-1"} aria-label={`${item.name}: call ${number}`}>
                          <Phone /> {number}
                        </a>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="caption-1 mt-4 text-ink-faint">Each from an official page, checked {day(numbers.checked)}.</p>
            </article>
          )}
          {dates && coming.length > 0 && (
            <article className="card flex flex-col lg:col-span-5" aria-labelledby="holidays">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                <h3 id="holidays" className="title-1 flex items-center gap-3">
                  <span className="tile-icon">
                    <PageIcon href="/holidays" />
                  </span>
                  {NAMED.get("/holidays")?.label}
                </h3>
                <Link prefetch={false} href="/holidays" className={all}>
                  All of {Object.keys(dates.years).sort().join(" and ")} <Arrow className="size-4" />
                </Link>
              </div>
              <ul className="dial mt-4">
                {coming.map((holiday, i) => (
                  <li key={holiday.date}>
                    <span className="title-2 flex flex-wrap items-center gap-2">
                      {holiday.name}
                      {i === 0 && <span className="tag tag-lit caption-1">Next</span>}
                    </span>
                    <span className="data-1 text-ink-subtle">{longDay(holiday.date)}</span>
                  </li>
                ))}
              </ul>
              <p className="caption-1 mt-auto pt-4 text-ink-faint">From the official notices, checked {day(dates.checked)}.</p>
            </article>
          )}
        </div>
        <ul className="start mt-3">
          {useful.map((page) => (
            <li key={page.href}>
              <Link prefetch={false} href={page.href} className="start-tile">
                <span className="tile-icon">
                  <PageIcon href={page.href} />
                </span>
                <span className="min-w-0">
                  <span className="title-2 block">{page.label}</span>
                  <span className="caption-1 block text-ink-subtle">{page.line}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
