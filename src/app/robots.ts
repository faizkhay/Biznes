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

/**
 * The programs that fetch one page to draw its card when a link is pasted into a message or a post.
 * They do not index anything, so they are let in even before launch: a link someone shares should
 * show its picture and its title. Several of them obey robots.txt, and with the site closed to
 * everyone they showed nothing.
 */
const PREVIEWERS = ["facebookexternalhit", "Facebot", "Twitterbot", "LinkedInBot", "Slackbot", "Slackbot-LinkExpanding", "WhatsApp", "TelegramBot", "Discordbot", "SkypeUriPreview", "redditbot", "Pinterestbot", "Iframely"];
const PRIVATE = ["/api/", "/search", "/account", "/dashboard", "/admin", "/auth/"];

export default function robots(): MetadataRoute.Robots {
  if (!site.launched)
    return {
      rules: [
        { userAgent: PREVIEWERS, allow: "/", disallow: PRIVATE },
        { userAgent: "*", disallow: "/" },
      ],
    };
  return {
    // The account pages are one person's own: nothing in them is for a crawler.
    rules: [{ userAgent: [...AI_CRAWLERS, ...PREVIEWERS, "*"], allow: "/", disallow: PRIVATE }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
