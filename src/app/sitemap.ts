import type { MetadataRoute } from "next";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

/** Every page worth finding: the fixed pages, each guide, each category, each town, and each listing. */
export default function sitemap(): MetadataRoute.Sitemap {
  const { guides, categories, places, listings, meta } = index();
  const built = new Date(meta.generated);
  const url = (path: string, lastModified: Date | string = built, priority = 0.5) => ({ url: `${siteUrl}${path}`, lastModified, priority });
  return [
    url("/", built, 1),
    url("/directory", built, 0.9),
    url("/places", built, 0.8),
    url("/learn", built, 0.9),
    url("/tools", built, 0.7),
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
    ...listings.map((l) => url(`/b/${l.slug}`, l.src.edited ?? built, l.full >= 4 ? 0.6 : 0.4)),
  ];
}
