import type { MetadataRoute } from "next";
import { BUSINESSES } from "@/data/businesses";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

/**
 * Every page, once. Sample listings are left out: they are placeholders, not pages to be found.
 * No lastModified: a build date on every page would tell a search engine nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/businesses", "/how-it-works", "/enquire", "/privacy"];
  const listings = BUSINESSES.filter((b) => !b.sample && b.status !== "sold").map((b) => `/businesses/${b.slug}`);
  return [...pages, ...listings].map((path) => ({ url: `${siteUrl}${path}` }));
}
