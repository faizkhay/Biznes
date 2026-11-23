import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Bits";
import { FoodIcon } from "@/components/Glyphs";
import JsonLd from "@/components/JsonLd";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { food } from "@/lib/food";
import { count } from "@/lib/format";
import { pageMeta } from "@/lib/meta";
import { breadcrumbs } from "@/lib/schema";

const [, way] = BAZ.ways;

export function generateMetadata(): Metadata {
  const { cuisines } = food();
  return pageMeta({ title: "Kinds of food in Mauritius", description: `The ${count(cuisines.length)} kinds of food the open map records for places to eat in Mauritius, each with how many serve it, on Baz Manzer: from Chinese and Indian to pizza, seafood and the island's own.`, path: baz.foods });
}

/**
 * Every kind of food, most served first: the map's own word for a place's cuisine, counted from
 * the index, and nothing typed in. Each leads to the places that serve it.
 */
export default function BazFoodsPage() {
  const { cuisines, listings } = food();
  const given = listings.filter((l) => l.kind).length;
  const crumbs = [{ href: baz.home, label: BAZ.name }, { label: way.label }];
  return (
    <div className="shell pt-8 pb-10 lg:pt-12">
      <JsonLd data={breadcrumbs([{ href: "/", label: "Home" }, ...crumbs], baz.foods)} />
      <Crumbs path={crumbs} />
      <h1 className="heading-1 mt-4 max-w-4xl">Kinds of food</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">
        {count(cuisines.length)} kinds, as the open map names them. The map gives a kind of food for {count(given)} of the {count(listings.length)} places to eat, so a place with none is not in these lists, and is still in every other.
      </p>
      <ul className="baz-foods mt-8" aria-label="Kinds of food">
        {cuisines.map((c) => (
          <li key={c.id}>
            <Link prefetch={false} href={baz.food(c.id)} className="baz-food">
              <span className="baz-type-icon" aria-hidden>
                <FoodIcon id={c.id} />
              </span>
              <span className="min-w-0">
                <span className="title-2 block">{c.label}</span>
                <span className="data-2 block">{count(c.n)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
