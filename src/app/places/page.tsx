import type { Metadata } from "next";
import Link from "next/link";
import { BrowseTabs, PageHead } from "@/components/Bits";
import TownFinder from "@/components/TownFinder";
import { count } from "@/lib/format";
import { index, type Place } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Towns and villages of Mauritius",
  description: "Businesses and services in Mauritius by town and village, district by district, and in Rodrigues. Find a town, then see what is listed there.",
  path: "/places",
});

/**
 * Every town and village with something listed, district by district. A box finds a town as its
 * name is typed, the districts are ways to jump down the page, and a town's neighbourhoods are
 * folded under it, so the page is a list of towns and not of everything.
 */
export default function PlacesPage() {
  const { places, districts, meta } = index();
  const towns = places.filter((p) => p.kind === "town");
  const areas = places.filter((p) => p.kind === "area");
  const within = new Map<string, Place[]>();
  for (const area of areas) if (area.within) within.set(area.within, [...(within.get(area.within) ?? []), area]);
  const listed = districts.filter((d) => d.n > 0).sort((a, b) => b.n - a.n);
  const elsewhere = towns.filter((p) => !p.district);
  const town = (p: Place) => {
    const inside = (within.get(p.slug) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <li key={p.slug} data-town={inside.map((a) => a.name).join(" ")} data-name={p.name} className="town">
        <Link prefetch={false} href={`/places/${p.slug}`} className="index-item body-3">
          <span>{p.name}</span>
          <span className="n data-2">{count(p.n)}</span>
        </Link>
        {inside.length > 0 && (
          <details className="town-areas">
            <summary className="caption-1">
              {count(inside.length)} {inside.length === 1 ? "neighbourhood" : "neighbourhoods"}
            </summary>
            <ul>
              {inside.map((a) => (
                <li key={a.slug}>
                  <Link prefetch={false} href={`/places/${a.slug}`} className="index-item body-3">
                    <span>{a.name}</span>
                    <span className="n data-2">{count(a.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </li>
    );
  };
  return (
    <>
      <PageHead here="/places" title="Towns and villages" path={[{ label: "Places" }]} lede={`${count(meta.towns)} towns and villages with something listed, district by district.`}>
        <BrowseTabs here="/places" />
        <div className="mt-6 max-w-md">
          <TownFinder target="towns" total={towns.length} />
        </div>
        <nav aria-label="Districts" className="mt-2">
          <ul className="narrow">
            {listed.map((d) => (
              <li key={d.slug}>
                <a href={`#d-${d.slug}`} className="body-3">
                  {d.name} <span className="n data-2">{count(d.n)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHead>
      <div className="shell" id="towns">
        {listed.map((d) => (
          <section key={d.slug} data-district aria-labelledby={`d-${d.slug}`} className="grid scroll-mt-24 gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
            <h2 id={`d-${d.slug}`} className="heading-2 md:col-span-4">
              {d.name}
              <span className="caption-1 mt-2 block font-sans font-normal tracking-normal text-ink-faint">{d.slug === "rodrigues" ? "Island" : "District"}. {count(d.n)} listed</span>
            </h2>
            <ul className="index-cols md:col-span-8 lg:columns-2">
              {towns
                .filter((p) => p.district === d.name)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(town)}
            </ul>
          </section>
        ))}
        {elsewhere.length > 0 && (
          <section data-district aria-labelledby="d-else" className="grid gap-x-12 gap-y-4 border-t border-line py-10 md:grid-cols-12">
            <h2 id="d-else" className="heading-2 md:col-span-4">
              Elsewhere
            </h2>
            <ul className="index-cols md:col-span-8 lg:columns-2">{elsewhere.map(town)}</ul>
          </section>
        )}
        <p className="caption-1 max-w-prose border-t border-line pt-6 text-ink-faint">
          A town is its council area as the map draws it. A neighbourhood is listed where it has eight listings or more, and its listings are counted in its town&rsquo;s too: {count(areas.length)} neighbourhoods in all.
        </p>
      </div>
    </>
  );
}
