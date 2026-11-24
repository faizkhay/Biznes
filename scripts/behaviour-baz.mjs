// What Baz Manzer does as a section of its own and as an app of its own, checked against a
// production server: by plain requests for what a machine reads (the manifest, the head of a page,
// the old addresses, the sitemap) and in a real browser for what a person does.
//
//   npm run build
//   npx next start -p 3500 &
//   node scripts/behaviour-baz.mjs [origin]        (default http://localhost:3500)
//
// It starts a second server of its own, on ALT_PORT (default 3501), and stops it to take the
// network away: a browser's own "offline" switch does not reach a service worker's requests, so a
// page it reported as opening offline may have been fetched after all.
//
// What it holds: the section's manifest and every field an installer reads; exactly one manifest
// named on each kind of page, the section's inside it and the site's outside; the section's own
// title, touch icon and theme colour; every link to a place, a kind, a kind of food or a town on
// the section's pages staying inside its scope; the old addresses, which were parameters, leading
// to the new; a place's page inside the section, with its one address for a search engine left
// where it was; the section's search answering only with places to eat; its header and its bar; a
// page of the section opening with the network off after one visit, and the section's own page for
// when it cannot; the offer to install, for the right app and gone for good once closed; axe-core
// (WCAG 2.2 AA) clean on each kind of page at both sizes; and nothing wider than its screen.
//
// Exits 1 if any check fails.
//
// Needs: playwright and @axe-core/playwright (devDependencies).
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { VIEWPORTS, browserPath, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3500";
// The checks with the network off need a server they can stop: a second one is started for them.
const ALT_PORT = Number(process.env.ALT_PORT) || 3501;
const alt = `http://localhost:${ALT_PORT}`;
let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
};

const ROOT = "/baz-manzer";
const MANIFEST = `${ROOT}/manifest.webmanifest`;
const PLACE = `${ROOT}/p/acqua-and-farina-pizzeria-beau-bassin-rose-hill-n14064293374`;
/** One page of each kind the section has, with the tab of its bar that should be lit. */
const INSIDE = [
  ["first page", ROOT, "Baz Manzer"],
  ["a kind of place", `${ROOT}/kind/restaurants`, "Baz Manzer"],
  ["a kind of place in a town", `${ROOT}/kind/restaurants/grand-baie`, "Baz Manzer"],
  ["a kind of food", `${ROOT}/food/chinese`, "Food"],
  ["a kind of food, narrowed", `${ROOT}/food/chinese?town=port-louis`, "Food"],
  ["a town", `${ROOT}/town/curepipe`, "Towns"],
  ["every kind of food", `${ROOT}/food`, "Food"],
  ["every town", `${ROOT}/town`, "Towns"],
  ["a place", PLACE, "Baz Manzer"],
  ["search results", `${ROOT}/search?q=pizza`, "Search"],
  ["a search that finds nothing", `${ROOT}/search?q=pharmacy`, "Search"],
  ["the search page", `${ROOT}/search`, "Search"],
  ["saved places", `${ROOT}/saved`, "Saved"],
  ["the offline page", `${ROOT}/offline`, "Baz Manzer"],
];
/** Pages of the rest of the site, which keep the site's own app. */
const OUTSIDE = ["/", "/directory", "/directory/restaurants", "/b/acqua-and-farina-pizzeria-beau-bassin-rose-hill-n14064293374", "/search?q=pizza", "/saved", "/offline", "/learn/mauritian-food", "/places/curepipe"];

const get = (path, init) => fetch(origin + path, init);
const html = async (path) => (await get(path)).text();
const decode = (text) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const attr = (tag, name) => decode(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? "");
const tags = (page, pattern) => page.match(pattern) ?? [];
const metaOf = (page, name) => attr(tags(page, new RegExp(`<meta (?:name|property)="${name}"[^>]*>`, "g"))[0] ?? "", "content");
/** A PNG's width, height and whether it carries transparency, read from its own first bytes. */
async function png(path) {
  const response = await get(path);
  const bytes = Buffer.from(await response.arrayBuffer());
  const ok = response.status === 200 && /image\/png/.test(response.headers.get("content-type") ?? "") && bytes.subarray(1, 4).toString() === "PNG";
  return { ok, width: ok ? bytes.readUInt32BE(16) : 0, height: ok ? bytes.readUInt32BE(20) : 0, alpha: ok ? [4, 6].includes(bytes[25]) : false };
}

// ---------------------------------------------------------------------------------------------
// 1. The manifest: what an installer reads.
// ---------------------------------------------------------------------------------------------
const served = await get(MANIFEST);
let manifest = {};
try {
  manifest = await served.json();
} catch {
  // Left empty: the checks below say what is missing.
}
check("manifest: the section's own is served as a manifest, under the section", served.status === 200 && /application\/manifest\+json/.test(served.headers.get("content-type") ?? ""), `${served.status} ${served.headers.get("content-type")}`);
check("manifest: its own id, name and short name", manifest.id === ROOT && manifest.name === "Baz Manzer" && manifest.short_name === "Baz Manzer", JSON.stringify([manifest.id, manifest.name, manifest.short_name]));
check("manifest: it opens on the section's first page, alone, and never leaves the section", manifest.start_url === ROOT && manifest.scope === ROOT && manifest.display === "standalone" && manifest.start_url.startsWith(manifest.scope), JSON.stringify([manifest.start_url, manifest.scope, manifest.display]));
check("manifest: its own colours, a language and a description", manifest.theme_color === "#f14949" && manifest.background_color === "#0a1639" && manifest.lang === "en" && /Mauritius/.test(manifest.description ?? ""), JSON.stringify([manifest.theme_color, manifest.background_color]));
const siteManifest = await (await get("/manifest.webmanifest")).json();
check("manifest: the site's own is still served, and the two are two apps", siteManifest.id === "/" && siteManifest.scope === "/" && siteManifest.name === "biznes.mu" && siteManifest.id !== manifest.id, JSON.stringify([siteManifest.id, siteManifest.name]));
check("manifest: the site's own shortcuts name Home, keep the emergency numbers among the first four, and leave Baz Manzer to its own app", siteManifest.shortcuts.some((shortcut) => shortcut.url === "/home") && siteManifest.shortcuts.slice(0, 4).some((shortcut) => shortcut.url === "/emergency") && !siteManifest.shortcuts.some((shortcut) => shortcut.url.startsWith(ROOT)), siteManifest.shortcuts.map((shortcut) => shortcut.url).join(" "));
{
  const wanted = ["any 192x192", "any 512x512", "maskable 192x192", "maskable 512x512"];
  const icons = manifest.icons ?? [];
  const wrong = [];
  for (const icon of icons) {
    const file = await png(icon.src);
    const size = Number(icon.sizes?.split("x")[0]);
    if (!file.ok || file.width !== size || file.height !== size || icon.type !== "image/png") wrong.push(`${icon.src}: ${file.width} x ${file.height}`);
    // An icon a platform cuts to its own shape must fill its square: no transparency in it.
    if (icon.purpose === "maskable" && file.alpha) wrong.push(`${icon.src}: transparent`);
    if (siteManifest.icons.some((other) => other.src === icon.src)) wrong.push(`${icon.src}: the site's own`);
  }
  check("manifest: its own icons, any and maskable at 192 and 512, each a picture of its size", wanted.every((want) => icons.some((icon) => `${icon.purpose} ${icon.sizes}` === want)) && wrong.length === 0, wrong.join("; ") || JSON.stringify(icons.map((icon) => `${icon.purpose} ${icon.sizes}`)));
}
{
  const shortcuts = manifest.shortcuts ?? [];
  const wrong = [];
  for (const shortcut of shortcuts) if (!shortcut.url.startsWith(`${ROOT}/`) || (await get(shortcut.url)).status !== 200 || !shortcut.name) wrong.push(shortcut.url);
  const urls = shortcuts.map((shortcut) => shortcut.url);
  check("manifest: its own shortcuts, the kinds of place and the towns, each a page inside the section", ["restaurants", "fast-food", "cafes", "bakeries", "bars"].every((kind) => urls.includes(`${ROOT}/kind/${kind}`)) && urls.slice(0, 4).includes(`${ROOT}/town`) && wrong.length === 0, wrong.join(", ") || urls.join(", "));
}

// ---------------------------------------------------------------------------------------------
// 2. The head of each kind of page, as the server sends it: one manifest, and the right one.
// ---------------------------------------------------------------------------------------------
for (const [name, path] of INSIDE) {
  const page = await html(path);
  const named = tags(page, /<link rel="manifest"[^>]*>/g);
  const touch = tags(page, /<link rel="apple-touch-icon"[^>]*>/g);
  const facts = { manifests: named.map((tag) => attr(tag, "href")), title: metaOf(page, "apple-mobile-web-app-title"), app: metaOf(page, "application-name"), theme: metaOf(page, "theme-color"), touch: touch.map((tag) => attr(tag, "href").split("?")[0]) };
  check(`head, ${name}: names the section's manifest and no other`, facts.manifests.length === 1 && facts.manifests[0] === MANIFEST, JSON.stringify(facts.manifests));
  check(`head, ${name}: the section's own name for a home screen, its touch icon and its theme colour`, facts.title === "Baz Manzer" && facts.app === "Baz Manzer" && facts.theme === "#f14949" && facts.touch.length === 1 && facts.touch[0] === `${ROOT}/apple-icon.png`, JSON.stringify(facts));
}
for (const path of OUTSIDE) {
  const page = await html(path);
  const named = tags(page, /<link rel="manifest"[^>]*>/g).map((tag) => attr(tag, "href"));
  const touch = tags(page, /<link rel="apple-touch-icon"[^>]*>/g).map((tag) => attr(tag, "href").split("?")[0]);
  const facts = { named, title: metaOf(page, "apple-mobile-web-app-title"), theme: metaOf(page, "theme-color"), touch };
  check(`head, outside the section, ${path}: the site's manifest and no other, its name, touch icon and theme colour`, named.length === 1 && named[0] === "/manifest.webmanifest" && facts.title === "biznes.mu" && facts.theme === "#0a1639" && touch.length === 1 && touch[0] === "/apple-icon.png", JSON.stringify(facts));
}
{
  const [own, site] = [await png(`${ROOT}/apple-icon.png`), await png("/apple-icon.png")];
  check("head: the section's touch icon is a full square of 180 with nothing transparent", own.ok && own.width === 180 && own.height === 180 && !own.alpha && site.ok, JSON.stringify(own));
  const tab = await get(`${ROOT}/icon.svg`);
  check("head: the section's own icon for a browser's tab is served", tab.status === 200 && /image\/svg/.test(tab.headers.get("content-type") ?? "") && /#f14949/.test(await tab.text()));
}

// ---------------------------------------------------------------------------------------------
// 3. One address for a search engine, and what is indexed.
// ---------------------------------------------------------------------------------------------
const canonical = (page) => attr(tags(page, /<link rel="canonical"[^>]*>/g)[0] ?? "", "href");
// On a page's first making the server can give a redirect's address twice, which arrives as one line: the first is read.
const pathOf = (address) => (address ? new URL(address.split(", ")[0], origin).pathname + new URL(address.split(", ")[0], origin).search : "");
{
  const place = await html(PLACE);
  check("a place inside the section: its one address for a search engine is its listing's", pathOf(canonical(place)) === PLACE.replace(`${ROOT}/p/`, "/b/") && pathOf(metaOf(place, "og:url")) === PLACE.replace(`${ROOT}/p/`, "/b/"), canonical(place));
  check("a place inside the section: the same page the rest of the site draws, with the section's path at its head", /class="[^"]*biz-head/.test(place) && /<h1[^>]*>Acqua &amp; Farina Pizzeria<\/h1>/.test(place) && new RegExp(`<a href="${ROOT}/kind/restaurants/beau-bassin-rose-hill"`).test(place) && !/<a href="\/directory\/restaurants/.test(place));
  const byId = await get(`${ROOT}/p/n14064293374`, { redirect: "manual" });
  check("a place inside the section: its id alone leads to its full address, inside the section", byId.status === 308 && pathOf(byId.headers.get("location")) === PLACE, `${byId.status} ${byId.headers.get("location")}`);
  check("a place inside the section: only a place to eat has a page here", (await get(`${ROOT}/p/keiffel-tours-grand-baie-n5651200767`)).status === 404 && (await get(`${ROOT}/p/no-such-place`)).status === 404);
  const own = async (path) => {
    const page = await html(path);
    return { at: pathOf(canonical(page)), robots: metaOf(page, "robots") };
  };
  const [kind, food, town, pair, narrowed, paged] = [await own(`${ROOT}/kind/restaurants`), await own(`${ROOT}/food/chinese`), await own(`${ROOT}/town/curepipe`), await own(`${ROOT}/kind/restaurants/grand-baie`), await own(`${ROOT}/food/chinese?town=port-louis`), await own(`${ROOT}/kind/restaurants?page=2`)];
  // Until the site is launched every page carries the site's own word to search engines ("noindex,
  // nofollow"). A page that is one to index says what the site says and nothing of its own; a
  // page that never is says so itself, and asks that its links still be followed.
  const sites = metaOf(await html("/directory"), "robots");
  const never = "noindex, follow";
  check("indexing: a kind of place, a kind of food and a town are pages of their own", kind.at === `${ROOT}/kind/restaurants` && food.at === `${ROOT}/food/chinese` && town.at === `${ROOT}/town/curepipe` && [kind, food, town].every((page) => page.robots === sites) && sites !== never, JSON.stringify([kind, food, town, sites]));
  check("indexing: a kind in a town, a narrowed view and a later page ask not to be indexed, and a narrowed view names the page it narrows", pair.robots === never && narrowed.robots === never && narrowed.at === `${ROOT}/food/chinese` && paged.robots === never && paged.at === `${ROOT}/kind/restaurants`, JSON.stringify([pair, narrowed, paged]));
  const sitemap = await html("/sitemap.xml");
  const listed = (path) => sitemap.includes(`${path}<`);
  check("sitemap: the first page, the two lists, a kind, a kind of food and a town are in it", [ROOT, `${ROOT}/food`, `${ROOT}/town`, `${ROOT}/kind/restaurants`, `${ROOT}/kind/bars`, `${ROOT}/food/chinese`, `${ROOT}/town/curepipe`].every(listed));
  check("sitemap: a place's page inside the section, a kind in a town, the search, the saved places and a narrowed view are not", !/\/baz-manzer\/(p|search|saved|offline|suggest)[/<?]/.test(sitemap) && !/\/baz-manzer\/kind\/[^/<]+\/[^<]/.test(sitemap) && !/\/baz-manzer[^<]*\?/.test(sitemap) && sitemap.includes("/b/acqua-and-farina-pizzeria-beau-bassin-rose-hill-n14064293374<"));
  const llms = await html("/llms.txt");
  check("the section keeps its place: in llms.txt and in the site's own menu", /Baz Manzer/.test(llms) && llms.includes(`${ROOT})`) && /<nav[^>]*aria-label="Main"[\s\S]*?href="\/baz-manzer"/.test(await html("/directory")));
}

// ---------------------------------------------------------------------------------------------
// 4. The old addresses, which were parameters, lead to the new for good.
// ---------------------------------------------------------------------------------------------
for (const [old, now] of [
  [`${ROOT}?type=restaurants`, `${ROOT}/kind/restaurants`],
  [`${ROOT}?food=chinese`, `${ROOT}/food/chinese`],
  [`${ROOT}?town=curepipe`, `${ROOT}/town/curepipe`],
  [`${ROOT}?type=restaurants&town=grand-baie`, `${ROOT}/kind/restaurants/grand-baie`],
  [`${ROOT}?food=chinese&town=port-louis`, `${ROOT}/food/chinese?town=port-louis`],
  [`${ROOT}?type=restaurants&food=chinese&town=port-louis&phone=1`, `${ROOT}/food/chinese?type=restaurants&town=port-louis&phone=1`],
  [`${ROOT}?town=curepipe&page=2`, `${ROOT}/town/curepipe?page=2`],
  [`${ROOT}?type=cafes&web=1`, `${ROOT}/kind/cafes?web=1`],
  [`${ROOT}/kind/restaurants?town=curepipe`, `${ROOT}/kind/restaurants/curepipe`],
  [`${ROOT}/town/curepipe?type=cafes`, `${ROOT}/kind/cafes/curepipe`],
]) {
  const response = await get(old, { redirect: "manual" });
  const led = pathOf(response.headers.get("location"));
  check(`old address: ${old} leads for good to ${now}`, response.status === 308 && led === now && (await get(now)).status === 200, `${response.status} ${led}`);
}
{
  const home = await html("/home");
  const into = [...home.matchAll(/href="(\/baz-manzer[^"]*)"/g)].map((match) => decode(match[1]));
  check("the Home page leads to a kind of place and a kind of food at their own addresses, with no parameter", into.includes(`${ROOT}/kind/restaurants`) && into.some((href) => href.startsWith(`${ROOT}/food/`)) && into.every((href) => !href.includes("?")), into.slice(0, 6).join(" "));
}
check("old address: a telephone number, a website and a page of the list stay parameters of the first page", (await get(`${ROOT}?phone=1&web=1&page=2`, { redirect: "manual" })).status === 200 && (await get(`${ROOT}?food=no-such-food`, { redirect: "manual" })).status === 200);
check("an address that names no kind, food or town is no page", [(await get(`${ROOT}/kind/no-such`)).status, (await get(`${ROOT}/food/no-such`)).status, (await get(`${ROOT}/town/no-such`)).status].every((status) => status === 404));

// ---------------------------------------------------------------------------------------------
// In a browser.
// ---------------------------------------------------------------------------------------------
const browser = await chromium.launch({ executablePath: browserPath() });
const [, phoneSize] = VIEWPORTS.find(([name]) => name === "mobile");
const [, deskSize] = VIEWPORTS.find(([name]) => name === "desktop");
const errors = [];
const watch = (page) => page.on("pageerror", (error) => errors.push(error.message));
/** Wait until the page's script has taken the page over, so a press does what it says. */
const live = (page) =>
  page.waitForFunction(() => {
    const el = document.querySelector("nav.tabbar a, header .nav-pill a");
    return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  });
const desk = await steady(await browser.newContext({ viewport: deskSize }));
const page = await desk.newPage();
watch(page);
const phone = await steady(await browser.newContext({ viewport: phoneSize, isMobile: true, hasTouch: true }));
const small = await phone.newPage();
watch(small);

// 5. Every link to a place, a kind, a kind of food or a town stays inside the section's scope.
const LEAVES = /^\/(b|biz|directory|places)(\/|\?|$)/;
for (const [name, path] of INSIDE) {
  await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  const links = await page.locator("main a[href]").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
  const out = links.filter((href) => LEAVES.test(href));
  const rows = await page.locator("main article[data-listing] a.row-title").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
  const ways = await page.locator("main .narrow a, main .baz-types a, main .baz-foods a, main .index-item, main nav[aria-label='You are here'] a, main .pager a, main .filters a").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
  const astray = [...rows.filter((href) => !href.startsWith(`${ROOT}/p/`)), ...ways.filter((href) => href !== ROOT && !href.startsWith(`${ROOT}/`) && !href.startsWith(`${ROOT}?`))];
  check(`in scope, ${name}: no link in the page leads to a listing, a category or a town outside the section`, out.length === 0 && astray.length === 0, [...out, ...astray].slice(0, 4).join(" "));
  check(`in scope, ${name}: one manifest in the page as a browser holds it, the section's`, (await page.locator('link[rel="manifest"]').evaluateAll((all) => all.map((link) => link.getAttribute("href")))).join() === MANIFEST);
}
await page.goto(origin + ROOT, { waitUntil: "domcontentloaded" });
const counted = { rows: await page.locator("main article[data-listing]").count(), kinds: await page.locator("main .baz-types a").count(), foods: await page.locator('main nav[aria-labelledby="by-food"] a').count(), towns: await page.locator('main nav[aria-labelledby="by-town"] a').count() };
check("first page: the front of the app: its search, what is near, the kinds of place, the kinds of food, the towns, then every place to eat", (await page.locator("main .baz-head form[role=search]").count()) === 1 && (await page.locator("main form.baz-near-form select option").count()) > 50 && counted.kinds === 5 && counted.foods >= 10 && counted.towns >= 5 && counted.rows === 20, JSON.stringify(counted));
check("first page: the island beside the list, and the way to the street map", (await page.locator("main .chart-fit").count()) === 1 && (await page.getByRole("button", { name: "Open the street map" }).count()) >= 1);
await live(page);
await page.locator("main article[data-listing] a.row-title").first().click();
await page.waitForURL(new RegExp(`${ROOT}/p/`));
check("a place opened from a list stays inside the section", new URL(page.url()).pathname.startsWith(`${ROOT}/p/`) && (await page.locator("main header.biz-head h1").count()) === 1 && (await page.locator('header .nav-pill a[href="/baz-manzer"]').count()) === 1);
await page.goto(origin + PLACE, { waitUntil: "domcontentloaded" });
const near = await page.locator("main section[aria-labelledby=near] a.row-title").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
check("a place's neighbours, and the way to all of its kind in its town, are inside the section too", near.length > 0 && near.every((href) => href.startsWith(`${ROOT}/p/`)) && (await page.locator(`main section[aria-labelledby=near] a[href="${ROOT}/kind/restaurants/beau-bassin-rose-hill"]`).count()) === 1, near.join(" "));
const data = await page.locator('script[type="application/ld+json"]').evaluateAll((all) => all.map((script) => JSON.parse(script.textContent)));
check("a place's structured data names its listing's address, once", data.filter((block) => block["@type"] === "Restaurant").length === 1 && data.find((block) => block["@type"] === "Restaurant").url.endsWith("/b/acqua-and-farina-pizzeria-beau-bassin-rose-hill-n14064293374"));

// 6. What is near: a town is chosen, and the form leads to the town's own page, with no script too.
{
  const plain = await steady(await browser.newContext({ javaScriptEnabled: false, viewport: deskSize }));
  const bare = await plain.newPage();
  await bare.goto(origin + ROOT, { waitUntil: "domcontentloaded" });
  check("no script: the first page is whole: its name, its ways in and its list", (await bare.locator("main h1").innerText()) === "Baz Manzer" && (await bare.locator("main article[data-listing]").count()) === 20 && (await bare.locator("main .baz-types a").count()) === 5);
  await bare.locator("#near-town").selectOption("curepipe");
  await bare.locator("form.baz-near-form button").click();
  await bare.waitForURL(new RegExp(`${ROOT}/town/curepipe$`));
  check("near: choosing a town leads to the town's own page, with no script", (await bare.locator("main h1").innerText()) === "Where to eat in Curepipe" && (await bare.locator('main nav[aria-labelledby="by-town"] a').count()) >= 3);
  const nearby = await bare.locator('main nav[aria-labelledby="by-town"] a').allInnerTexts();
  check("near: the town's page names the towns nearest it, each with how far", nearby.length >= 3 && nearby.every((text) => /\d(\.\d)? ?k?m/.test(text)), nearby.join(" | "));
  await bare.goto(`${origin}${ROOT}/search`, { waitUntil: "domcontentloaded" });
  await bare.locator("main form[role=search] input").fill("pizza");
  await bare.locator("main form[role=search] button[type=submit]").click();
  await bare.waitForURL(new RegExp(`${ROOT}/search\\?q=pizza`));
  check("no script: the section's search box asks the section's own search", (await bare.locator("main article[data-listing]").count()) > 0);
  await plain.close();
}

// 7. The section's search: only places to eat, every answer inside the section.
const groupsOf = async (on) => {
  const ids = await on.locator("main article[data-listing]").evaluateAll((all) => all.map((row) => row.dataset.listing));
  if (!ids.length) return [];
  const { listings } = await (await get(`/api/listings?ids=${ids.join(",")}`)).json();
  return ids.map((id) => listings.find((listing) => listing.id === id)?.group ?? "none");
};
for (const q of ["pizza", "curepipe", "restaurants in grand baie", "port louis", "chinese in port louis", "domino", "the"]) {
  await page.goto(`${origin}${ROOT}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
  const groups = await groupsOf(page);
  const hrefs = await page.locator("main article[data-listing] a.row-title").evaluateAll((all) => all.map((a) => a.getAttribute("href")));
  check(`search: "${q}" is answered, and only with places to eat, each inside the section`, groups.length > 0 && groups.every((group) => group === "eat") && hrefs.every((href) => href.startsWith(`${ROOT}/p/`)), `${groups.length} rows, ${groups.filter((group) => group !== "eat").length} not places to eat`);
}
await page.goto(`${origin}/search?q=port+louis`, { waitUntil: "domcontentloaded" });
check("search: the same question on the whole site holds more than places to eat, so the section's is truly its own", (await groupsOf(page)).some((group) => group !== "eat"));
for (const q of ["pharmacy", "bank in curepipe", "zzqqxx"]) {
  await page.goto(`${origin}${ROOT}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
  check(`search: "${q}" finds no place to eat, says so, and offers the whole site's search by name`, (await page.locator("main article[data-listing]").count()) === 0 && /No place to eat found/.test(await page.locator("main p[role=status]").innerText()) && (await page.locator(`main a[href="/search?q=${encodeURIComponent(q)}"]`).innerText()) === "Search all of biznes.mu");
}
await page.goto(`${origin}${ROOT}/search?q=pharmacy`, { waitUntil: "domcontentloaded" });
check("search: a kind of business that is not a place to eat is named as what it is", /holds only places to eat and drink, and this reads as pharmacies/.test(await page.locator("main").innerText()));
await page.goto(`${origin}${ROOT}/search?q=restaurants+in+grand+baie&phone=1`, { waitUntil: "domcontentloaded" });
check("search: its answers narrow as a list does, and stay on the section's search", (await page.locator("main article[data-listing]").count()) > 0 && (await page.locator('main .filters a[aria-current="true"]').count()) === 1 && (await page.locator("main .filters a").evaluateAll((all) => all.every((a) => a.getAttribute("href").startsWith("/baz-manzer/search?")))));
await page.goto(`${origin}${ROOT}/search?q=curepipe`, { waitUntil: "domcontentloaded" });
check("search: a town's name is answered with the town's own page first", (await page.locator(`main ul[aria-label="Pages of Baz Manzer that answer"] a[href="${ROOT}/town/curepipe"]`).count()) === 1);
{
  const suggested = await (await get(`${ROOT}/suggest?q=piz`)).json();
  check("search: what it offers while a question is typed are pages of the section", suggested.suggestions.length >= 3 && suggested.suggestions.every((s) => s.href.startsWith(`${ROOT}/`)) && suggested.suggestions.some((s) => s.href === `${ROOT}/food/pizza`), JSON.stringify(suggested.suggestions.map((s) => s.href)));
  await page.goto(`${origin}${ROOT}/kind/cafes`, { waitUntil: "domcontentloaded" });
  await live(page);
  const box = page.locator(".site-header form[role=search] input");
  await box.fill("piz");
  await page.waitForSelector(".site-header ul[role=listbox] li");
  const offered = await page.locator(".site-header ul[role=listbox] li").count();
  await box.press("ArrowDown");
  const chosen = await box.getAttribute("aria-activedescendant");
  await box.press("Escape");
  const closed = (await page.locator(".site-header ul[role=listbox] li").count()) === 0 && (await box.inputValue()) === "piz";
  await box.press("Enter");
  await page.waitForURL(new RegExp(`${ROOT}/search\\?q=piz`));
  check("search: the header's box on a wide screen is a combobox that asks the section", offered >= 3 && Boolean(chosen) && closed && (await page.locator("main article[data-listing]").count()) > 0, JSON.stringify({ offered, chosen, closed }));
}

// 8. The header and the bar.
await page.goto(`${origin}${ROOT}/town/curepipe`, { waitUntil: "domcontentloaded" });
const head = {
  name: await page.locator('header .nav-pill a.logo[href="/baz-manzer"]').innerText(),
  links: (await page.locator(".site-header nav a:visible").allInnerTexts()).join("|"),
  lit: await page.locator(".site-header nav a[aria-current]").innerText(),
  back: await page.locator('header .nav-pill a[href="/"]').innerText(),
  outside: await page.locator("header .nav-pill a[href]").evaluateAll((all) => all.map((a) => a.getAttribute("href")).filter((href) => href !== "/baz-manzer" && !href.startsWith("/baz-manzer/"))),
  search: await page.locator(".site-header form[role=search]").getAttribute("action"),
};
check("header, wide: the section's name with its awning, its ways round, its own search, and one way back to the whole site", head.name === "Baz Manzer" && (await page.locator("header .nav-pill a.logo .baz-mark").count()) === 1 && head.links === "Food|Towns|Saved" && head.lit === "Towns" && head.back === "biznes.mu" && head.outside.join() === "/" && head.search === `${ROOT}/search`, JSON.stringify(head));
check("header, wide: the site's own menu, cart and account are not in the section's header", (await page.locator('header a[href="/cart"], header a[href^="/account"], header a[href="/directory"], header details').count()) === 0);
await page.goto(origin + ROOT, { waitUntil: "domcontentloaded" });
check("header, wide: the first page and the search page carry their own large box, so the pill shows none", (await page.locator(".site-header form[role=search]:visible").count()) === 0 && (await page.locator("main form[role=search]:visible").count()) === 1 && (await page.locator('header a.logo[aria-current="page"]').count()) === 1);
await page.goto(`${origin}/directory`, { waitUntil: "domcontentloaded" });
await live(page);
check("outside the section the header is the site's own", (await page.locator('header .nav-pill a.logo[href="/"]').count()) === 1 && (await page.locator("header .baz-mark").count()) === 0 && (await page.locator('header nav a[href="/baz-manzer"]').count()) === 1);
await page.locator('header nav a[href="/baz-manzer"]').click();
await page.waitForURL(new RegExp(`${ROOT}$`));
await page.waitForSelector("header .baz-mark");
check("a step from the site into the section changes the header, and the manifest the page names", (await page.locator('header .nav-pill a.logo[href="/baz-manzer"]').count()) === 1 && (await page.locator('link[rel="manifest"]').evaluateAll((all) => all.map((link) => link.getAttribute("href")))).join() === MANIFEST && (await page.locator('meta[name="theme-color"]').getAttribute("content")) === "#f14949");
await page.locator('header .nav-pill a[href="/"]').click();
await page.waitForURL(`${origin}/`);
check("the way back leads to the whole site, which names its own manifest again", (await page.locator('link[rel="manifest"]').evaluateAll((all) => all.map((link) => link.getAttribute("href")))).join() === "/manifest.webmanifest" && (await page.locator("header .baz-mark").count()) === 0);

for (const [name, path, tab] of INSIDE) {
  await small.goto(origin + path, { waitUntil: "domcontentloaded" });
  const over = await small.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth) - innerWidth);
  check(`phone, ${name}: no wider than the screen`, over <= 0, `${over}px`);
  const bar = { tabs: (await small.locator("nav.tabbar a:visible").allInnerTexts()).map((text) => text.trim()).join("|"), lit: (await small.locator("nav.tabbar a[aria-current]").allInnerTexts()).map((text) => text.trim()).join("|"), hrefs: await small.locator("nav.tabbar a").evaluateAll((all) => all.map((a) => a.getAttribute("href"))) };
  check(`phone, ${name}: the bar is the section's own, and says where you are`, bar.tabs === "Baz Manzer|Food|Towns|Search|Saved" && bar.lit === tab && bar.hrefs.every((href) => href === ROOT || href.startsWith(`${ROOT}/`)), JSON.stringify(bar));
}
await small.goto(`${origin}${ROOT}/town/curepipe`, { waitUntil: "domcontentloaded" });
{
  const pill = await small.evaluate(() => {
    const bar = document.querySelector("header .nav-pill");
    const shown = [...bar.querySelectorAll("a, summary, form")].filter((el) => el.getBoundingClientRect().width > 0);
    return { shown: shown.map((el) => el.textContent.trim()), fits: bar.scrollWidth <= bar.clientWidth, oneLine: bar.getBoundingClientRect().height <= 64 };
  });
  check("phone: the header holds the section's name and the way back, on one line, and nothing that opens", pill.shown.join("|") === "Baz Manzer|biznes.mu" && pill.fits && pill.oneLine, JSON.stringify(pill));
  const sizes = await small.locator("nav.tabbar a, header .nav-pill a").evaluateAll((all) => all.filter((a) => a.getBoundingClientRect().width > 0).map((a) => Math.round(Math.min(a.getBoundingClientRect().width, a.getBoundingClientRect().height))));
  check("phone: every control of the header and the bar is at least 44 pixels each way", sizes.length === 7 && sizes.every((size) => size >= 44), sizes.join(","));
  const bar = await small.locator("nav.tabbar").boundingBox();
  check("phone: the bar is at the foot of the first screen", bar != null && bar.y + bar.height <= phoneSize.height && bar.y > phoneSize.height - 120, JSON.stringify(bar));
  await live(small);
  await small.locator(`nav.tabbar a[href="${ROOT}/food"]`).click();
  await small.waitForURL(new RegExp(`${ROOT}/food$`));
  check("phone: the bar leads to every kind of food, and marks it as the page you are on", (await small.locator("main .baz-foods a").count()) >= 50 && (await small.locator('nav.tabbar a[aria-current="page"]').innerText()).trim() === "Food");
}
await small.goto(`${origin}/directory`, { waitUntil: "domcontentloaded" });
check("phone: outside the section the bar is the site's own", (await small.locator("nav.tabbar").count()) === 1 && (await small.locator('nav.tabbar[aria-label="Baz Manzer"]').count()) === 0 && (await small.locator(`nav.tabbar a[href="${ROOT}/food"]`).count()) === 0);
for (const [name, path] of INSIDE) {
  await page.goto(origin + path, { waitUntil: "domcontentloaded" });
  const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth) - innerWidth);
  check(`desk, ${name}: no wider than the screen`, over <= 0, `${over}px`);
}

// 9. Saved places: the shortlist, narrowed to places to eat.
{
  await small.goto(`${origin}${ROOT}/kind/cafes`, { waitUntil: "domcontentloaded" });
  await live(small);
  const first = small.locator("main article[data-listing]").first();
  const id = await first.getAttribute("data-listing");
  await first.locator("button[aria-pressed]").click();
  // A listing that is not a place to eat, saved elsewhere on the site, is on the same shortlist.
  await small.evaluate(() => window.localStorage.setItem("biznes:saved", JSON.stringify([...JSON.parse(window.localStorage.getItem("biznes:saved")), "n5651200767"])));
  await small.goto(`${origin}${ROOT}/saved`, { waitUntil: "domcontentloaded" });
  await small.waitForSelector("main article[data-listing]");
  const rows = await small.locator("main article[data-listing]").evaluateAll((all) => all.map((row) => [row.dataset.listing, row.querySelector("a.row-title").getAttribute("href")]));
  check("saved: a place saved in the section is on the section's saved list, and leads to its page inside it", rows.length === 1 && rows[0][0] === id && rows[0][1].startsWith(`${ROOT}/p/`), JSON.stringify(rows));
  check("saved: what else is on the shortlist is not shown here, and the page says where it is", /One other listing you have saved is not a place to eat/.test(await small.locator("main").innerText()) && (await small.locator('main a[href="/saved"]').count()) === 1);
  await small.goto(`${origin}${ROOT}/saved?ids=n14064293374,n5651200767`, { waitUntil: "domcontentloaded" });
  await small.waitForSelector("main article[data-listing]");
  check("saved: a list someone sent is narrowed to places to eat as well", (await small.locator("main article[data-listing]").count()) === 1 && (await small.locator("main h1").innerText()) === "Places to eat, shared with you");
  await small.evaluate(() => window.localStorage.clear());
}

// 10. The offer to install: for the app the page belongs to, and gone for good once closed.
{
  const offer = () => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = new Promise(() => {});
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  const card = small.locator('div[role="region"][aria-label^="Install"]');
  await small.goto(`${origin}${ROOT}/kind/cafes`, { waitUntil: "load" });
  await live(small);
  check("install: nothing is offered until the browser makes its offer", (await card.count()) === 0);
  const held = await small.evaluate(offer);
  await card.waitFor();
  check("install: on a page of the section the offer is for Baz Manzer, in its own words, with one button to install", held && (await card.count()) === 1 && (await card.getAttribute("aria-label")) === "Install Baz Manzer" && /^Add Baz Manzer to your home screen/.test(await card.innerText()) && (await card.getByRole("button", { name: "Install" }).count()) === 1, await card.innerText());
  const box = await card.boundingBox();
  const bar = await small.locator("nav.tabbar").boundingBox();
  check("install: the card sits above the bar, inside the screen", box.y + box.height <= bar.y && box.x >= 0 && box.x + box.width <= phoneSize.width, JSON.stringify(box));
  await card.getByRole("button", { name: "Close" }).click();
  await small.evaluate(offer);
  await small.waitForTimeout(300);
  check("install: closed, the section's offer does not come back when the browser offers again", (await card.count()) === 0);
  // A year on, the section's offer is still closed: it is closed for good.
  await small.evaluate(() => window.localStorage.setItem("biznes:install-closed-baz", String(Date.now() - 366 * 24 * 60 * 60 * 1000)));
  await small.reload({ waitUntil: "load" });
  await live(small);
  await small.evaluate(offer);
  await small.waitForTimeout(300);
  check("install: a year later it is still closed", (await card.count()) === 0);
  await small.goto(`${origin}/directory`, { waitUntil: "load" });
  await live(small);
  await small.evaluate(offer);
  await card.waitFor();
  check("install: closing the section's offer does not close the site's, which is the site's own", (await card.getAttribute("aria-label")) === "Install biznes.mu" && /^Add biznes\.mu to your home screen/.test(await card.innerText()));
  // The landing page is one screen with one question: nothing is offered on it.
  await small.goto(`${origin}/`, { waitUntil: "load" });
  await small.waitForFunction(() => {
    const el = document.querySelector("header .nav-pill a");
    return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  });
  await small.evaluate(offer);
  await small.waitForTimeout(300);
  check("install: the landing page carries no offer", (await card.count()) === 0);
  await small.goto(`${origin}/directory`, { waitUntil: "load" });
  await live(small);
  await small.evaluate(offer);
  await card.waitFor();
  // The offer above was made for the site. A step into the section must not show it as the section's.
  await small.evaluate(() => window.localStorage.removeItem("biznes:install-closed-baz"));
  await small.locator('footer a[href="/baz-manzer"]').first().click();
  await small.waitForURL(new RegExp(`${ROOT}$`));
  await small.waitForSelector("header .baz-mark");
  check("install: an offer made for the site is not shown on a page of the section", (await card.count()) === 0);
  await small.evaluate(offer);
  await card.waitFor();
  check("install: and the offer the browser makes there is the section's", (await card.getAttribute("aria-label")) === "Install Baz Manzer" && (await small.locator('div[role="region"][aria-label^="Install"]').count()) === 1);
  await small.evaluate(() => window.localStorage.clear());

  // An iPhone makes no offer: the card says how, for the app the page belongs to.
  const iphone = await steady(await browser.newContext({ viewport: phoneSize, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1" }));
  const ios = await iphone.newPage();
  watch(ios);
  const told = ios.locator('div[role="region"][aria-label^="Install"]');
  await ios.goto(`${origin}${ROOT}`, { waitUntil: "load" });
  await told.waitFor();
  check("install, on an iPhone: on a page of the section a line says how to add Baz Manzer, and there is no button that cannot work", (await told.getAttribute("aria-label")) === "Install Baz Manzer" && /Add Baz Manzer to your home screen\s*Tap Share, then Add to Home Screen\./.test(await told.innerText()) && (await told.getByRole("button", { name: "Install" }).count()) === 0, await told.innerText());
  await told.getByRole("button", { name: "Close" }).click();
  await ios.reload({ waitUntil: "load" });
  await live(ios);
  await ios.waitForTimeout(300);
  check("install, on an iPhone: closed, it stays closed", (await told.count()) === 0);
  await ios.goto(`${origin}/directory`, { waitUntil: "load" });
  await told.waitFor();
  check("install, on an iPhone: on the rest of the site the line is the site's", (await told.getAttribute("aria-label")) === "Install biznes.mu" && /Add biznes\.mu to your home screen/.test(await told.innerText()));
  await ios.goto(`${origin}/`, { waitUntil: "load" });
  await ios.waitForTimeout(800);
  check("install, on an iPhone: the landing page carries no line", (await told.count()) === 0);
  await iphone.close();
}

// 11. With the network off: a page of the section opens after one visit, and the section has its
// own page for when one cannot. The network is taken away by stopping the server the pages came
// from, which the worker's own requests feel as a phone's would. This one context is not made
// steady (scripts/pages.mjs): that turns the browser's own cache off, and on a phone it is that
// cache which serves the files of a page first opened before the worker was there. No visit here
// waits for an idle network, which is what steady is for.
{
  const { spawn } = await import("node:child_process");
  const answers = () => fetch(`${alt}${ROOT}/offline`).then((response) => response.ok, () => false);
  const start = async () => {
    const server = spawn("npx", ["next", "start", "-p", String(ALT_PORT)], { env: process.env, stdio: "ignore", detached: true });
    for (let i = 0; i < 60 && !(await answers()); i++) await new Promise((resolve) => setTimeout(resolve, 500));
    return server;
  };
  // Stopped at once and not asked to: a server that is asked finishes what it has open first, and
  // a connection the browser already holds would go on answering.
  const stop = async (server) => {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      server.kill("SIGKILL");
    }
    for (let i = 0; i < 40 && (await answers()); i++) await new Promise((resolve) => setTimeout(resolve, 250));
  };
  let server = await start();
  if (await answers()) {
    const context = await browser.newContext({ viewport: phoneSize, isMobile: true, hasTouch: true });
    const off = await context.newPage();
    watch(off);
    await off.goto(`${alt}${ROOT}/kind/cafes`, { waitUntil: "load" });
    const worker = await off.evaluate(() => Promise.race([navigator.serviceWorker.ready.then((registration) => registration.active?.scriptURL ?? ""), new Promise((resolve) => setTimeout(() => resolve("none"), 20000))]));
    // The one visit above was made before the worker was there. The page asks to be kept, and the section's first page with it.
    const holds = () =>
      off.evaluate(async () => {
        const name = (await caches.keys()).find((key) => key.includes("pages"));
        if (!name) return false;
        const pages = await caches.open(name);
        return Boolean(await pages.match("/baz-manzer/kind/cafes")) && Boolean(await pages.match("/baz-manzer")) && Boolean(await caches.match("/baz-manzer/offline")) && Boolean(await caches.match("/offline"));
      });
    let kept = false;
    for (let i = 0; i < 80 && !kept; i++) {
      kept = await holds();
      if (!kept) await off.waitForTimeout(250);
    }
    check("offline: one worker serves the whole site, and keeps the page it first met, the section's first page and both offline pages", worker.endsWith("/sw.js") && kept, `${worker} ${kept}`);
    await stop(server);
    check("offline: the server is stopped, so nothing can be fetched", !(await answers()));
    await off.reload({ waitUntil: "domcontentloaded" });
    check("offline: a page of the section opens with the network off after one visit", (await off.locator("main h1").innerText()) === "Cafés" && (await off.locator("main article[data-listing]").count()) === 20 && (await off.locator('nav.tabbar[aria-label="Baz Manzer"]').count()) === 1);
    await off.goto(alt + ROOT, { waitUntil: "domcontentloaded" });
    check("offline: the section's first page, where its app opens, opens with the network off", (await off.locator("main h1").innerText()) === "Baz Manzer" && (await off.locator("main .baz-awning").count()) === 1 && (await off.locator("main article[data-listing]").count()) === 20);
    for (const never of [`${ROOT}/town/curepipe`, `${ROOT}/search?q=pizza`]) {
      await off.goto(alt + never, { waitUntil: "load" });
      await off.waitForTimeout(500);
      const lost = { h1: await off.locator("main h1").innerText(), words: await off.locator("main").innerText(), links: await off.locator("main a[href]").evaluateAll((all) => all.map((a) => a.getAttribute("href"))), bar: await off.locator('nav.tabbar[aria-label="Baz Manzer"]').count(), mark: await off.locator(".site-header .baz-mark").count(), manifest: await off.locator('link[rel="manifest"]').getAttribute("href") };
      check(`offline: ${never}, never opened, shows the section's own offline page, in its words, under its header and bar`, lost.h1 === "You are offline" && /This page of Baz Manzer could not be loaded/.test(lost.words) && lost.bar === 1 && lost.mark === 1 && lost.manifest === MANIFEST, JSON.stringify(lost).slice(0, 300));
      check(`offline: ${never}: its ways on stay inside the section: the same address again, and the saved places`, lost.links.length === 2 && lost.links[0] === never && lost.links[1] === `${ROOT}/saved`, lost.links.join(" ").slice(0, 300));
    }
    await off.goto(`${alt}/directory/banks`, { waitUntil: "domcontentloaded" });
    check("offline: outside the section the offline page is still the site's", (await off.locator("main h1").innerText()) === "You are offline" && (await off.locator('main a[href="/saved"]').count()) === 1 && (await off.locator(".site-header .baz-mark").count()) === 0 && (await off.locator('link[rel="manifest"]').getAttribute("href")) === "/manifest.webmanifest");
    server = await start();
    await off.goto(`${alt}${ROOT}/town/curepipe`, { waitUntil: "domcontentloaded" });
    check("offline: with the network back, the same address is the page itself", (await off.locator("main h1").innerText()) === "Where to eat in Curepipe");
    await context.close();
  } else check("offline: a second server started", false, `nothing answered on port ${ALT_PORT}`);
  await stop(server);
}

// 12. Accessibility: axe-core, WCAG 2.2 AA, on each kind of page of the section at both sizes.
for (const [size, on] of [
  ["desk", page],
  ["phone", small],
]) {
  for (const [name, path] of INSIDE) {
    await on.goto(origin + path, { waitUntil: "load" });
    await on.waitForTimeout(400);
    const { violations } = await new AxeBuilder({ page: on }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const bad = violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    check(`axe, ${size}, ${name}: clean`, bad.length === 0, bad.map((violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`).join("; "));
  }
}
{
  // With the offer to install on the page, and with the search box's list open.
  await small.goto(`${origin}${ROOT}/kind/cafes`, { waitUntil: "load" });
  await live(small);
  await small.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = new Promise(() => {});
    window.dispatchEvent(event);
  });
  await small.locator('div[role="region"][aria-label="Install Baz Manzer"]').waitFor();
  const offered = await new AxeBuilder({ page: small }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  await page.goto(`${origin}${ROOT}/kind/cafes`, { waitUntil: "load" });
  await live(page);
  await page.locator(".site-header form[role=search] input").fill("piz");
  await page.waitForSelector(".site-header ul[role=listbox] li");
  const open = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = [...offered.violations, ...open.violations].filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  check("axe: clean with the offer to install on the page, and with the search box's list open", bad.length === 0, bad.map((violation) => `${violation.id}: ${violation.nodes[0]?.target.join(" ")}`).join("; "));
}

check("no page raised an error", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
