import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Bits";
import { DistrictIcon } from "@/components/Glyphs";
import JsonLd from "@/components/JsonLd";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { food, type FoodTown } from "@/lib/food";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";
import { breadcrumbs } from "@/lib/schema";

const [, , way] = BAZ.ways;

export function generateMetadata(): Metadata {
  const towns = food().towns.filter((t) => t.kind === "town");
  return pageMeta({ title: "Where to eat in Mauritius, town by town", description: `The ${count(towns.length)} towns and villages of Mauritius and Rodrigues with somewhere to eat or drink on the open map, district by district, each with how many, on Baz Manzer.`, path: baz.towns });
}

/**
 * Every town and village with a place to eat, district by district, the district with most
 * first. A town's neighbourhoods that have a place to eat are folded under it. Counted from the
 * index: a town with nowhere to eat on the map is not here.
 */
export default function BazTownsPage() {
  const { towns } = food();
  const { districts } = index();
  const own = towns.filter((t) => t.kind === "town");
  const areas = new Map<string, FoodTown[]>();
  for (const t of towns) if (t.kind === "area" && t.within) areas.set(t.within, [...(areas.get(t.within) ?? []), t]);
  const groups = districts
    .map((d) => ({ d, towns: own.filter((t) => t.district === d.name).sort((a, b) => b.eats - a.eats || a.name.localeCompare(b.name)) }))
    .filter((g) => g.towns.length > 0)
    .map((g) => ({ ...g, eats: g.towns.reduce((sum, t) => sum + t.eats, 0) }))
    .sort((a, b) => b.eats - a.eats);
  const elsewhere = own.filter((t) => !districts.some((d) => d.name === t.district));
  const crumbs = [{ href: baz.home, label: BAZ.name }, { label: way.label }];
  const town = (t: FoodTown) => {
    const inside = (areas.get(t.slug) ?? []).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <li key={t.slug} className="town">
        <Link prefetch={false} href={baz.town(t.slug)} className="index-item body-3">
          <span>{t.name}</span>
          <span className="n data-2">{count(t.eats)}</span>
        </Link>
        {inside.length > 0 && (
          <details className="town-areas">
            <summary className="caption-1">
              {count(inside.length)} {inside.length === 1 ? "neighbourhood" : "neighbourhoods"}
            </summary>
            <ul>
              {inside.map((a) => (
                <li key={a.slug}>
                  <Link prefetch={false} href={baz.town(a.slug)} className="index-item body-3">
                    <span>{a.name}</span>
                    <span className="n data-2">{count(a.eats)}</span>
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
    <div className="shell pt-8 pb-10 lg:pt-12">
      <JsonLd data={breadcrumbs([{ href: "/", label: "Home" }, ...crumbs], baz.towns)} />
      <Crumbs path={crumbs} />
      <h1 className="heading-1 mt-4 max-w-4xl">Towns and villages</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">
        {count(own.length)} towns and villages with somewhere to eat or drink, district by district. A town&rsquo;s page also names the towns nearest it.
      </p>
      <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ d, towns: list, eats }) => (
          <section key={d.slug} aria-labelledby={`d-${d.slug}`}>
            <h2 id={`d-${d.slug}`} className="title-1 flex items-center gap-2">
              <span className="baz-type-icon" aria-hidden>
                <DistrictIcon slug={d.slug} />
              </span>
              <span>
                {d.name} <span className="data-2 text-ink-faint">{count(eats)}</span>
              </span>
            </h2>
            <ul className="mt-3">{list.map(town)}</ul>
          </section>
        ))}
        {elsewhere.length > 0 && (
          <section aria-labelledby="d-elsewhere">
            <h2 id="d-elsewhere" className="title-1">
              Elsewhere
            </h2>
            <ul className="mt-3">{elsewhere.map(town)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
