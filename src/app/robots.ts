import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

/**
 * Before launch the site is closed to every crawler: its listings are samples, and a sample must
 * never be found as if it were for sale. Once `launched` is true in src/data/site.ts, search engines
 * and AI assistants are welcome, because a business wants to be found and quoted correctly. The
 * named crawlers share one group with everyone's rules: a crawler follows only the group that names
 * it.
 *
 * KOS kit. The crawler list is the agency site's, October 2026.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  if (!site.launched) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: [...AI_CRAWLERS, "*"], allow: "/", disallow: "/api/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
