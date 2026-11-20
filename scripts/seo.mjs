// What a search engine, a link preview and an AI assistant are given, checked on every kind of
// page in scripts/pages.mjs against a running server.
//
//   npm run build && npx next start -p 3100 &
//   node scripts/seo.mjs [origin]        (default http://localhost:3100)
//
// FAIL (exit 1), for a page: no title or no description; no h1, or more than one; no canonical
// address on a page that may be indexed; no og:title, og:image, og:url or twitter:card; a card
// picture that cannot be fetched; a block of structured data that does not parse as JSON; a
// visitor's own page (search results, the shortlist, the cart, the offline page) that does not ask
// not to be indexed; a title or a description shared by two kinds of page. And for the site: the
// sitemap without the new pages, llms.txt or llms-full.txt missing, or an article with no Markdown
// twin.
// WARN: a title over 65 characters or a description over 165, where a search engine would cut it;
// a part of an article under a question that does not open with a paragraph, which is what an
// assistant quotes.
//
// No dependencies beyond Node 20.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PAGES } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const root = fileURLToPath(new URL("..", import.meta.url));
let failed = 0;
let warned = 0;
const fail = (what) => (failed++, console.log(`FAIL  ${what}`));
const warn = (what) => (warned++, console.log(`WARN  ${what}`));
const decode = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const meta = (html, key) => decode(html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`))?.[1] ?? "");

// Pages that are one visitor's own, or one of countless: they must ask not to be indexed.
const PRIVATE = /^(search|saved|cart|offline)/;
const titles = new Map();
const descriptions = new Map();
const cards = new Set();
let blocks = 0;

for (const [name, path] of PAGES) {
  const response = await fetch(origin + path, { redirect: "follow" });
  const html = await response.text();
  const gone = name === "missing";
  if (!gone && response.status !== 200) fail(`${name}: answered ${response.status}`);
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const description = meta(html, "description");
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!title) fail(`${name}: no title`);
  if (h1 !== 1) fail(`${name}: ${h1} h1 headings, where one is wanted`);
  if (gone) continue;
  if (!description) fail(`${name}: no description`);
  if (!canonical) fail(`${name}: no canonical address`);
  for (const key of ["og:title", "og:image", "og:url", "og:description", "twitter:card"]) if (!meta(html, key)) fail(`${name}: no ${key}`);
  if (PRIVATE.test(name) && !/noindex/.test(meta(html, "robots"))) fail(`${name}: one visitor's own page, and it does not ask not to be indexed`);
  if (title.length > 65) warn(`${name}: the title is ${title.length} characters: ${title}`);
  if (description.length > 165) warn(`${name}: the description is ${description.length} characters`);
  // Two pages with different canonical addresses must not share a title or a description. A
  // narrowed view of a page names that page as its canonical address, and shares its words.
  if (!PRIVATE.test(name) && canonical) {
    const at = new URL(canonical, origin).pathname;
    if (titles.has(title) && titles.get(title).at !== at) fail(`${name}: the same title as ${titles.get(title).name}: ${title}`);
    if (descriptions.has(description) && descriptions.get(description).at !== at) fail(`${name}: the same description as ${descriptions.get(description).name}`);
    titles.set(title, { name, at });
    descriptions.set(description, { name, at });
  }
  const card = meta(html, "og:image");
  if (card) cards.add(new URL(card, origin).pathname + new URL(card, origin).search);
  // Every block of structured data must be JSON, and must not be able to close its own script.
  for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    try {
      const data = JSON.parse(body);
      for (const item of Array.isArray(data) ? data : [data]) if (!item["@type"]) fail(`${name}: a block of structured data with no @type`);
    } catch (error) {
      fail(`${name}: a block of structured data does not parse: ${error.message}`);
    }
    if (/<\//.test(body)) fail(`${name}: a block of structured data holds "</", which could close its script`);
  }
  if (name === "guide") {
    const twin = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/)?.[1];
    if (!twin) fail("guide: its head does not name its Markdown twin");
    else {
      // The address is written for the site's own name; here it is asked of the server being checked.
      const md = await fetch(origin + new URL(twin, origin).pathname);
      if (md.status !== 200 || !/text\/markdown/.test(md.headers.get("content-type") ?? "") || !/^# /.test(await md.text())) fail(`guide: ${twin} is not served as Markdown`);
    }
    const asked = await fetch(`${origin}${new URL(canonical, origin).pathname}.md`, { redirect: "manual" });
    if (![301, 308].includes(asked.status) || !/\/learn\/md\/.+\.md$/.test(asked.headers.get("location") ?? "")) fail(`guide: the article's address with .md after it does not lead to its Markdown (${asked.status})`);
  }
}
for (const card of cards) {
  const response = await fetch(origin + card);
  if (response.status !== 200 || !/^image\//.test(response.headers.get("content-type") ?? "")) fail(`the card ${card} is not a picture that can be fetched (${response.status})`);
}

// The site as a whole.
const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
for (const path of ["/baz-manzer", "/about", "/emergency", "/holidays", "/shop", "/learn/vat", "/directory/pharmacies/curepipe", "/places/curepipe"]) if (!sitemap.includes(`${path}<`)) fail(`sitemap: ${path} is not in it`);
for (const path of ["/search", "/saved", "/cart", "/account", "/dashboard"]) if (new RegExp(`${path}<`).test(sitemap)) fail(`sitemap: ${path} is one visitor's own, and is in it`);
for (const [path, wanted] of [["/llms.txt", /## Articles[\s\S]+Baz Manzer|Baz Manzer[\s\S]+## Articles/], ["/llms-full.txt", /## Sources|### Sources/]]) {
  const response = await fetch(origin + path);
  const text = await response.text();
  if (response.status !== 200 || !wanted.test(text)) fail(`${path}: missing, or without what it should hold`);
}
// A part of an article under a question should answer in its first paragraph: that is what is quoted.
let questions = 0;
for (const file of readdirSync(`${root}content/guides`).filter((f) => f.endsWith(".json"))) {
  const guide = JSON.parse(readFileSync(`${root}content/guides/${file}`, "utf8"));
  for (const section of guide.sections ?? []) {
    if (!section.heading.trim().endsWith("?")) continue;
    questions++;
    // The articles are written by researchers from their sources: this is for them to put right, not for a script to guess at.
    if (section.blocks?.[0]?.type !== "p") warn(`${guide.slug}: "${section.heading}" opens with a ${section.blocks?.[0]?.type ?? "nothing"}, not with a paragraph that answers it`);
  }
}

console.log(`\n${PAGES.length} kinds of page, ${blocks} blocks of structured data, ${cards.size} cards, ${questions} questions in the articles: ${failed} fail, ${warned} warn`);
process.exit(failed ? 1 : 0);
