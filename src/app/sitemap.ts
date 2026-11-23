import type { MetadataRoute } from "next";
import { owned } from "@/lib/accounts/owned";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";
import { TOOLS } from "@/lib/tools";

// Made again at most once an hour, so a business its owner has just listed is in it within the hour.
export const revalidate = 3600;

/**
 * Every address worth finding: the fixed pages, each article, each category, each town, each
 * category in each town that has one, each listing, and each business its owner has listed. The
 * date beside each is an honest one: the day an article was last checked, the day the map last
 * recorded a listing, and for the rest the day the index was built. A visitor's own pages (search
 * results, the shortlist, the cart, the account) are not in it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { guides, categories, places, listings, meta } = index();
  const built = new Date(meta.generated);
  const url = (path: string, lastModified: Date | string = built, priority = 0.5) => ({ url: `${siteUrl}${path}`, lastModified, priority });
  const newest = guides.map((g) => g.checked).sort().at(-1) ?? built;
  // A category in a town is a page of its own wherever the town has one of that category.
  const pairs = new Set<string>();
  for (const l of listings) for (const place of [l.placeSlug, l.areaSlug]) if (place) pairs.add(`${l.cat}/${place}`);
  const own = (await owned()).all.filter((business) => !business.listingId);
  return [
    url("/", built, 1),
    url("/home", built, 0.9),
    url("/directory", built, 0.9),
    url("/places", built, 0.8),
    url("/baz-manzer", built, 0.9),
    url("/learn", newest, 0.9),
    url("/tools", built, 0.7),
    url("/about", built, 0.5),
    url("/emergency", built, 0.8),
    url("/holidays", built, 0.7),
    url("/pricing", built, 0.6),
    url("/shop", built, 0.5),
    url("/official", built, 0.6),
    url("/data", built, 0.4),
    url("/bot", built, 0.3),
    url("/add", built, 0.4),
    url("/privacy", built, 0.2),
    ...TOOLS.map((t) => url(t.href, built, 0.7)),
    ...guides.map((g) => url(`/learn/${g.slug}`, g.checked, 0.9)),
    ...categories.map((c) => url(`/directory/${c.id}`, built, 0.8)),
    ...places.map((p) => url(`/places/${p.slug}`, built, 0.7)),
    ...[...pairs].sort().map((pair) => url(`/directory/${pair}`, built, 0.5)),
    ...own.map((business) => url(business.path, built, 0.6)),
    ...listings.map((l) => url(`/b/${l.slug}`, l.src.edited ?? built, l.full >= 4 ? 0.6 : 0.4)),
  ];
}
