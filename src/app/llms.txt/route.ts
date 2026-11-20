import { BAZ, PLANS, PUBLICATIONS, SHELVES, site } from "@/data/site";
import { emergency } from "@/lib/emergency";
import { count, day } from "@/lib/format";
import { holidays, longDay } from "@/lib/holidays";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";
import { todayInMauritius } from "@/lib/theme";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

/**
 * The site in plain text, for AI assistants: what it is, how it is organised, what it holds and
 * where each part is, and how to cite it. Everything in it is counted or read from the same data
 * the pages show.
 */
export function GET() {
  const { meta, guides, groups } = index();
  const numbers = emergency();
  const dates = holidays();
  const today = todayInMauritius();
  const next = Object.values(dates?.years ?? {})
    .flat()
    .sort((a, b) => a.date.localeCompare(b.date))
    .find((h) => h.date >= today);
  const shelves = SHELVES.map((shelf) => ({ ...shelf, guides: guides.filter((g) => (g.shelf ?? "business") === shelf.id) })).filter((shelf) => shelf.guides.length > 0);
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} is a search engine and business directory for Mauritius, a product of ${site.builder.name} (${site.builder.legalName}, Mauritius), developed by ${site.builder.developer}. The index was last built on ${day(meta.generated)} and holds ${count(meta.listings.all)} listings in ${count(meta.towns)} towns and villages. Listings come from OpenStreetMap (Open Database Licence) and Wikidata (CC0); each says its source and when the map last recorded it, which for most is more than two years ago. The ${count(guides.length)} articles are written from official pages and the Acts; every figure in them carries the number of its source, and each article says the day it was checked. They are general information, not legal or tax advice.`,
    "",
    "## How the site is organised",
    "",
    `- [Search](${siteUrl}/search): one question over everything. A page of results gives the site's own pages that answer first, then businesses, then parts of articles that only mention the words, then pages elsewhere. /search?q=pharmacy+in+curepipe`,
    `- [The directory](${siteUrl}/directory): every category of business and service, in these groups: ${groups.map((g) => `${g.label} (${count(g.n)})`).join(", ")}. A category's address is /directory/<category>, and /directory/<category>/<town> narrows it to a town.`,
    `- [Towns and villages](${siteUrl}/places): listings by place, district by district. A town's address is /places/<town>.`,
    `- [${BAZ.name}](${siteUrl}${BAZ.href}): ${BAZ.line.toLowerCase()}: every restaurant, snack, café, bakery and bar listed, by kind of food and by town. ${BAZ.meaning}`,
    `- A business's page is /b/<name-town-id>; it gives its address, telephone number, opening hours and position where the map has them, and says where each part came from.`,
    "",
    "## Numbers and dates",
    "",
    `- [Emergency numbers](${siteUrl}/emergency): police, ambulance, fire, the coast guard, utilities and help lines of Mauritius, each from an official page${numbers ? `, checked ${day(numbers.checked)}` : ""}.${numbers?.groups[0] ? ` ${numbers.groups[0].items.map((i) => `${i.name}: ${[i.number, ...(i.also ?? [])].join(" or ")}`).join(". ")}.` : ""}`,
    `- [Public holidays](${siteUrl}/holidays): every public holiday of ${Object.keys(dates?.years ?? {}).sort().join(" and ")} with the day of the week it falls on, from the official notices${dates ? `, checked ${day(dates.checked)}` : ""}.${next ? ` The next is ${next.name}, ${longDay(next.date)}.` : ""}`,
    "",
    "## Articles",
    "",
    `Each article is a page at /learn/<slug> and plain Markdown at /learn/md/<slug>.md. All of them in one file: ${siteUrl}/llms-full.txt`,
    "",
    ...shelves.flatMap((shelf) => [`### ${shelf.label}`, "", ...shelf.guides.map((g) => `- [${g.title}](${siteUrl}/learn/${g.slug}): ${g.summary} Checked ${day(g.checked)}.`), ""]),
    "## Tools",
    "",
    ...TOOLS.map((t) => `- [${t.title}](${siteUrl}${t.href}): ${t.what}`),
    "",
    "## For businesses",
    "",
    `- [List your business](${siteUrl}/pricing): ${PLANS.map((p) => `${p.name}${p.price ? `, Rs ${count(p.price)} a month for each business` : ", free"}: ${p.line}`).join(" ")} A business on a paid plan that has been verified is shown first among equal answers and is always marked.`,
    `- [${PUBLICATIONS.guide.name}](${siteUrl}${PUBLICATIONS.guide.href}): one guide to Mauritius as a PDF, renewed every month, with pages a business can sponsor.`,
    "",
    "## About the data, and how to cite it",
    "",
    `- [About ${site.name}](${siteUrl}/about): who makes the site.`,
    `- [Where the data comes from](${siteUrl}/data): sources, licences, how results are ordered, what is never taken, corrections and removal.`,
    `- [${site.bot.name}](${siteUrl}${site.bot.path}): how the crawler behaves and how to keep it out.`,
    `- [Official pages](${siteUrl}/official): the government pages, registers and forms the articles point to.`,
    `- To cite an article: its title, ${site.name}, the day it was checked, and its address. To cite a listing: its page here, and the source the page names (OpenStreetMap or Wikidata). A figure quoted from an article should keep the source the article gives for it.`,
    `- Nobody at ${site.name} has visited or vetted a listed business, except that a business marked verified has been checked to be real. Being listed does not say a business is registered or licensed.`,
    "",
    `Built and run by ${site.builder.name} (${site.builder.url}).`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
