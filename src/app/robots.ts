import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

/**
 * Before launch the site is closed to every crawler. Once `launched` is true in src/data/site.ts,
 * search engines and AI assistants are welcome: a directory wants to be found and quoted correctly.
 * The results of a search and the endpoints behind the pages are kept out: they are as many
 * addresses as there are questions. The named crawlers share one group with everyone's rules,
 * because a crawler follows only the group that names it.
 *
 * KOS kit. The crawler list is the agency site's, October 2026.
 */
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  if (!site.launched) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    // The account pages are one person's own: nothing in them is for a crawler.
    rules: [{ userAgent: [...AI_CRAWLERS, "*"], allow: "/", disallow: ["/api/", "/search", "/account", "/dashboard", "/admin", "/auth/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
