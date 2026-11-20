import { site } from "@/data/site";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";
import { articleMarkdown } from "@/lib/markdown";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

/**
 * Every article in full, as one file of plain Markdown, for an AI assistant that would sooner read
 * the site once than page by page. /llms.txt is the short map; this is the text itself.
 */
export function GET() {
  const { guides, meta } = index();
  const head = [
    `# ${site.name}: every article in full`,
    `> ${site.description}`,
    `This file holds the ${count(guides.length)} articles of ${site.name} as plain text, each with its facts, its sections and its numbered sources. The bracketed numbers in an article point to that article's own list of sources. Each article says the day it was last checked against them; the index of businesses was last built on ${day(meta.generated)}. The articles are general information, not legal or tax advice.`,
    `To cite an article, give its title, ${site.name}, the day it was checked, and its address. The short map of the site is ${siteUrl}/llms.txt. Each article is also at ${siteUrl}/learn/md/<slug>.md.`,
  ].join("\n\n");
  return new Response(`${head}\n\n---\n\n${guides.map((g) => articleMarkdown(g, 2)).join("\n---\n\n")}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
}
