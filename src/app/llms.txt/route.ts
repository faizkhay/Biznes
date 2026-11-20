import { site } from "@/data/site";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

/** The site in plain text, for AI assistants: what it is, what it holds, and where each part is. */
export function GET() {
  const { meta, guides, groups } = index();
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `The index was last built on ${day(meta.generated)} and holds ${count(meta.listings.all)} listings in ${count(meta.places)} towns and villages. Listings come from OpenStreetMap (Open Database Licence) and Wikidata (CC0), and each says its source. The guides are written from official pages and the Acts, list their sources, and say the day they were checked. They are general information, not legal or tax advice.`,
    "",
    "## Find a business",
    "",
    `- [Search](${siteUrl}/search): one question over listings, guides, official pages and Mauritian websites. /search?q=pharmacy+in+curepipe`,
    `- [The directory](${siteUrl}/directory): every category. ${groups.map((g) => g.label).join(", ")}.`,
    `- [Towns and villages](${siteUrl}/places): listings by place, district by district.`,
    "",
    "## Guides",
    "",
    ...guides.map((g) => `- [${g.title}](${siteUrl}/learn/${g.slug}): ${g.summary} Checked ${day(g.checked)}.`),
    "",
    "## Tools",
    "",
    ...TOOLS.map((t) => `- [${t.title}](${siteUrl}${t.href}): ${t.what}`),
    "",
    "## About the data",
    "",
    `- [Where the data comes from](${siteUrl}/data): sources, licences, what is never taken, corrections and removal.`,
    `- [${site.bot.name}](${siteUrl}${site.bot.path}): how the crawler behaves and how to keep it out.`,
    `- [Official pages](${siteUrl}/official): the government pages, registers and forms the guides point to.`,
    "",
    `Built and run by ${site.builder.name} (${site.builder.url}).`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
