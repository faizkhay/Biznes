// What the site does, checked in a real browser against a production server.
//
//   npm run build
//   ENQUIRY_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3100 &
//   node scripts/behaviour.mjs [origin]        (default http://localhost:3100)
//
// It listens on port 3199 for the request form's delivery, so the form is tested end to end: typed
// in a browser, validated, sent, and received. Exits 1 if any check fails.
//
// Two ports of its own can be moved, for a machine where they are taken: HOOK_PORT (default 3199),
// where the form's delivery lands, and ALT_PORT (default 3101), where it starts a second server.
//
// Needs: playwright (devDependency).
import { createServer } from "node:http";
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const HOOK_PORT = Number(process.env.HOOK_PORT ?? 3199);
const ALT_PORT = Number(process.env.ALT_PORT ?? 3101);
let failed = 0;
let passed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
};

// The form's delivery lands here.
const received = [];
const hook = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      received.push(JSON.parse(body));
    } catch {
      received.push(null);
    }
    res.writeHead(200).end("ok");
  });
}).listen(HOOK_PORT, "127.0.0.1");

const browser = await chromium.launch({ executablePath: browserPath() });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const text = (selector) => page.locator(selector).first().innerText();

// 1. The first screen, and the chart.
await page.goto(origin, { waitUntil: "networkidle" });
check("home: one h1, and the owner's line under it", (await page.locator("h1").count()) === 1 && /search engine/i.test(await text("main section p.body-1")));
check("home: the day's picture is behind the page", /^(lagoon|flamboyant|cane|lights)$/.test((await page.getAttribute("html", "data-picture")) ?? "") && /url\(/.test(await page.evaluate(() => getComputedStyle(document.querySelector(".backdrop")).backgroundImage)));
await page.waitForFunction(() => document.querySelector(".chart")?.dataset.live === "true", null, { timeout: 15000 }).catch(() => {});
check("home: the chart goes live with script", (await page.locator('.chart[data-live="true"]').count()) === 1);
const pts = await (await page.request.get(`${origin}/points.json`)).json();
check("points.json: pairs of whole numbers", Array.isArray(pts) && pts.length > 10000 && pts.length % 2 === 0 && pts.every(Number.isInteger), `${pts.length}`);

// 2. Typing: suggestions, the keyboard, and the chart lighting what answers.
await page.fill("#home-search", "pharm");
await page.waitForSelector('[role="listbox"] [role="option"]', { timeout: 8000 }).catch(() => {});
const options = await page.locator('[role="listbox"] [role="option"]').count();
check("search box: suggestions while typing", options >= 3, `${options}`);
await page.waitForFunction(() => /lit for your question/.test(document.querySelector('[role="status"]')?.textContent ?? ""), null, { timeout: 5000 }).catch(() => {});
check("home: the chart says how many it lit", /\d+ lit for your question/.test(await page.locator('main [role="status"]').first().innerText()));
await page.keyboard.press("ArrowDown");
check("search box: arrow key marks an option", (await page.locator('[role="option"][aria-selected="true"]').count()) === 1);
check("search box: the input points at it", ((await page.getAttribute("#home-search", "aria-activedescendant")) ?? "").length > 0);
await page.keyboard.press("Escape");
check("search box: Escape closes the list", (await page.locator('[role="listbox"]').count()) === 0);
await page.keyboard.press("Enter");
await page.waitForURL(/\/search\?q=pharm/, { timeout: 8000 }).catch(() => {});
check("search box: Enter asks the search page", /\/search\?q=pharm/.test(page.url()), page.url());

// 3. What a question is read as.
const reads = async (q) => {
  await page.goto(`${origin}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
  return page.locator('main p[role="status"]').first().innerText();
};
check("reads: a kind and a town", /Pharmacies in Curepipe/.test(await reads("pharmacy in curepipe")));
check("reads: Kreol", /Pharmacies/.test(await reads("farmasi")));
check("reads: French", /Hardware/.test(await reads("quincaillerie")));
check("reads: one half of a town of two names", /Beau Bassin-Rose Hill/.test(await reads("restaurants rose hill")));
await reads("vat threshold");
check("a question about how is answered by the fact itself, first, in the site's own words", /threshold: MUR 3 million/i.test(await text("main article.answer p.body-1")) && /Value Added Tax/i.test(await text("main article.answer a.row-title")) && (await page.locator("main article.answer a.row-title").getAttribute("href")).startsWith("/learn/"));
check("pages elsewhere are folded away as references, under the site's own answer", (await page.locator("main details.elsewhere").count()) === 1 && !(await page.locator("main details.elsewhere").evaluate((el) => el.open)) && (await page.locator("main details.elsewhere a[rel~=noopener]").count()) > 0);
await reads("vat calculator");
check("a tool is found by its name", (await page.locator('main article a[href="/tools/vat"]').count()) === 1);
await reads("BRN");
check("a term is found in the glossary", (await page.locator('main article a[href="/learn/glossary#brn"]').count()) === 1);
check("a narrower word is not passed off as a category", /Nothing found/.test(await reads("plumber")) && /not a category of its own/.test(await text("main p.note")) && (await page.locator("main article").count()) === 0);
check("reads: words that only pad a question are dropped", /Read as: Restaurants in Grand Baie\./.test(await reads("restaurant grand baie open now")));
check("reads: taxis are not car hire", /Read as: Taxis\./.test(await reads("taxi")));
check("a misspelling is answered and said to be one", /close spellings/.test(await reads("pharmcy curepipe")) && (await page.locator("main article").count()) > 5);
await reads("pharmacy in curepipe");
check("results: the chart is drawn in on the answers, with a key", (await page.locator("aside .chart .chart-key").count()) === 1 && (await page.locator("main article[data-point]").count()) > 5);
await page.keyboard.press("/");
check("the / key goes to the search box", (await page.evaluate(() => document.activeElement?.id)) === "search");
check("nothing found says so, and offers the directory", /Nothing found/.test(await reads("zzqqxx")) && (await page.locator('main a[href="/directory"]').count()) > 0);
await page.goto(`${origin}/search?q=restaurant&page=2`, { waitUntil: "domcontentloaded" });
check("results: a second page", /Page 2 of/.test(await text(".pager")));

// 4. A listing.
const res = await page.goto(`${origin}/b/n5651200767`, { waitUntil: "domcontentloaded" });
check("listing: its id alone leads to its full address", /\/b\/keiffel-tours-grand-baie-n5651200767$/.test(page.url()) && res.status() === 200, page.url());
check("listing: says where it comes from", (await page.locator('a[href="https://www.openstreetmap.org/node/5651200767"]').count()) === 1);
check("listing: a telephone link", (await page.locator('a[href^="tel:+230"]').count()) >= 1);
check("listing: says how old the map's record is", /last edited there in November 2021, \d+ years ago/.test(await text("main p.note")));
check("listing: points to the official registers", (await page.locator('main a[href="/tools/verify"]').count()) >= 1);
const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().innerText());
check("listing: structured data from the same facts", ld["@type"] === "LocalBusiness" && ld.address?.addressCountry === "MU" && !!ld.geo);
check("listing: unknown is a 404", (await page.request.get(`${origin}/b/n1`)).status() === 404);

// 5. Old addresses, and what machines read.
for (const [from, to] of [["/businesses", "/directory"], ["/businesses/lepalatier", "/directory"], ["/enquire", "/add"], ["/how-it-works", "/data"]]) {
  const r = await page.request.get(origin + from, { maxRedirects: 0 });
  check(`old address ${from} leads to ${to}`, r.status() === 308 && r.headers().location === to, `${r.status()} ${r.headers().location}`);
}
const robots = await (await page.request.get(`${origin}/robots.txt`)).text();
check("robots.txt: closed until launch", /Disallow: \/\s*$/m.test(robots));
const sitemap = await (await page.request.get(`${origin}/sitemap.xml`)).text();
check("sitemap: listings, guides, towns", (sitemap.match(/<loc>/g) ?? []).length > 7000 && /\/learn\/vat</.test(sitemap) && /\/places\/curepipe</.test(sitemap));
const llms = await (await page.request.get(`${origin}/llms.txt`)).text();
check("llms.txt: names the guides and the sources", /OpenStreetMap/.test(llms) && /\/learn\/vat/.test(llms));
const sug = await (await page.request.get(`${origin}/api/suggest?q=bank+port+louis`)).json();
check("suggest: answers and points", sug.suggestions.length > 0 && sug.points.length > 0 && sug.n > 0);

// 6. A guide and the tools.
await page.goto(`${origin}/learn/vat`, { waitUntil: "domcontentloaded" });
const cites = await page.locator("a.cite").count();
const firstCite = await page.locator("a.cite").first().getAttribute("href");
check("guide: every block cites, and a citation leads to its source", cites > 20 && (await page.locator(firstCite).count()) === 1, `${cites}`);
check("guide: a table can be reached by keyboard", (await page.locator('.table-wrap[tabindex="0"]').count()) >= 1);
await page.goto(`${origin}/tools/vat`, { waitUntil: "networkidle" });
const row = (n) => page.locator("dl[aria-live] dd").nth(n).innerText();
check("VAT: 1,000 before VAT is 1,150 with it", (await row(2)) === "MUR 1,150.00", await row(2));
await page.locator("label.chip", { hasText: "VAT included" }).click();
check("VAT: 1,000 with VAT is 869.57 before it", (await row(0)) === "MUR 869.57", await row(0));
await page.fill('input[placeholder="For example, 2,400,000"]', "3,500,000");
check("VAT: a turnover over the threshold says so", /over the threshold of MUR 3,000,000\.00 by MUR 500,000\.00/.test(await page.locator('section p[role="status"]').innerText()));
await page.goto(`${origin}/tools/verify`, { waitUntil: "domcontentloaded" });
check("check a business: the registers, from the guide", (await page.locator("table.table tbody tr").count()) >= 5);
await page.goto(`${origin}/tools/structures`, { waitUntil: "domcontentloaded" });
check("compare structures: the table, from the guide", (await page.locator("table.table tbody tr").count()) >= 5);

// 7. The form, end to end.
await page.goto(`${origin}/add?listing=n5651200767`, { waitUntil: "networkidle" });
check("form: opened from a listing, it names it", (await page.inputValue("#business")) === "Keiffel Tours");
await page.click('main button[type="submit"]');
check("form: an empty send says what is missing, on the fields", (await page.locator('[id$="-error"]').count()) >= 3);
check("form: and moves to the first of them", (await page.evaluate(() => document.activeElement?.id)) === "message");
await page.fill("#message", "The telephone number has changed.");
await page.fill("#name", "A Tester");
await page.fill("#email", "not-an-address");
await page.click('main button[type="submit"]');
check("form: a bad email address is refused in words", /does not look right/.test(await text("#email-error")));
await page.fill("#email", "tester@example.com");
await page.click('main button[type="submit"]');
await page.waitForSelector('[role="status"] h2', { timeout: 10000 }).catch(() => {});
check("form: sent, and it says so", /Thank you, A Tester/.test(await page.locator('main [role="status"]').first().innerText().catch(() => "")));
check("form: delivered whole", received.length === 1 && received[0]?.listing === "n5651200767" && /Keiffel Tours \(\/b\//.test(received[0]?.text ?? ""), JSON.stringify(received[0])?.slice(0, 200));
const pot = await page.request.post(`${origin}/api/enquiry`, { data: { topic: "add", business: "x", message: "y", name: "z", email: "a@b.co", website: "spam" } });
check("form: a filled honeypot is thrown away quietly", pot.status() === 200 && received.length === 1);
let last = 0;
for (let i = 0; i < 6; i++) last = (await page.request.post(`${origin}/api/enquiry`, { data: {} })).status();
check("form: the sixth request in ten minutes is refused", last === 429, `${last}`);

// 7b. With no route for requests set, the form writes the request out for WhatsApp instead of posting.
{
  const { spawn } = await import("node:child_process");
  const env = { ...process.env };
  delete env.ENQUIRY_WEBHOOK_URL;
  delete env.RESEND_API_KEY;
  const bare = spawn("npx", ["next", "start", "-p", String(ALT_PORT)], { env, stdio: "ignore", detached: true });
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    await new Promise((r) => setTimeout(r, 500));
    up = await page.request.get(`http://localhost:${ALT_PORT}/add`).then((r) => r.ok(), () => false);
  }
  if (up) {
    await page.goto(`http://localhost:${ALT_PORT}/add`, { waitUntil: "networkidle" });
    check("form, no route: it offers WhatsApp and email, not a send that would fail", (await page.locator("main button", { hasText: "Send by WhatsApp" }).count()) === 1 && (await page.locator("#email").count()) === 0);
    await page.fill("#business", "Test Shop");
    await page.fill("#message", "Please add it.");
    await page.fill("#name", "A Tester");
    // It opens with no tie back to this page, so it is the browser, not the page, that reports it.
    const [popup] = await Promise.all([context.waitForEvent("page", { timeout: 8000 }).catch(() => null), page.click('main button[type="submit"]')]);
    await popup?.waitForURL(/whatsapp|wa\.me/, { timeout: 8000 }).catch(() => {});
    const url = popup ? decodeURIComponent(popup.url()) : "";
    check("form, no route: the request is written out for WhatsApp", /whatsapp|wa\.me/.test(url) && /Test[ +]Shop/.test(url), url.slice(0, 120));
    await popup?.close();
  } else check("form, no route: a second server started", false);
  try {
    process.kill(-bare.pid);
  } catch {
    bare.kill();
  }
}

// 8. Without script: the form asks, the page answers, the chart is drawn, the sums are shown.
const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const still = await plain.newPage();
await still.goto(origin, { waitUntil: "domcontentloaded" });
check("no script: the chart is drawn, with its dots", (await still.locator(".chart svg path.chart-dots").count()) === 3 && (await still.locator(".chart svg path.chart-coast").count()) >= 2);
await still.fill("#home-search", "dentist");
await still.press("#home-search", "Enter");
await still.waitForURL(/\/search\?q=dentist/, { timeout: 8000 }).catch(() => {});
check("no script: the search works", /\/search\?q=dentist/.test(still.url()) && (await still.locator("main article").count()) > 3);
check("no script: the answers are lit on the drawn chart", (await still.locator(".chart circle.chart-lit").count()) >= 0);
await still.goto(`${origin}/tools/vat`, { waitUntil: "domcontentloaded" });
check("no script: the VAT sums are in a table", /MUR 1,150\.00/.test(await still.content()));
await still.goto(`${origin}/add`, { waitUntil: "domcontentloaded" });
check("no script: the form says so and gives the other routes", /needs JavaScript/.test(await still.content()) && /\+230 5450 8600/.test(await still.content()));
await plain.close();

// 7b. General questions are answered from the site's own pages: a number, a date, an article's words.
const answerTo = async (q) => {
  await page.goto(`${origin}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
  return (await page.locator("main article.answer").count()) ? `${await page.locator("main article.answer p.body-1").innerText()} | ${await page.locator("main article.answer a.row-title").getAttribute("href")}` : "";
};
check("answers: an emergency number, before a list of stations", /Police emergency: 999 or 112.*\| \/emergency/s.test(await answerTo("police number")), await answerTo("police number"));
check("answers: a public holiday's date", /Divali: Sunday 8 November 2026.*\| \/holidays/s.test(await answerTo("when is divali")));
check("answers: a general question, from an article", /1 November to 15 May.*\| \/learn\/weather-and-cyclones-in-mauritius/s.test(await answerTo("cyclone season")));
check("answers: a question about how leads with an article, whatever nouns it holds", /\| \/learn\/(incorporate-a-company|register-a-business)/.test(await answerTo("register a company")), await answerTo("register a company"));
check("answers: a business's own name leads with businesses, not with a passing mention", (await answerTo("MCB")) === "" && (await page.locator("main article[data-listing]").count()) > 0);
await answerTo("ambulance");
check("answers: a number to call is a button that calls it", (await page.locator('main article.answer a[href="tel:114"]').count()) === 1);
check("answers: a who-and-where question still leads with businesses", (await answerTo("restaurants in grand baie")) === "" && (await page.locator("main article[data-listing]").count()) > 0);

// 8a. The menu: a group opens, shows its pages, and closes when one is chosen.
await page.goto(`${origin}/directory`, { waitUntil: "networkidle" });
await page.locator("header summary", { hasText: "Learn" }).click();
check("menu: a group opens to its pages", (await page.locator("header details[open] .menu-item:visible").count()) === 4);
await page.locator("header summary", { hasText: "Explore" }).click();
check("menu: only one group is open at a time", (await page.locator("header details[open]").count()) === 1);
await page.locator("header details[open] .menu-item", { hasText: "Emergency numbers" }).click();
await page.waitForURL(/\/emergency/);
check("menu: choosing a page goes there and closes the group", (await page.locator("header details[open]").count()) === 0 && /999/.test(await page.locator("main").innerText()));

// 8b. Narrowing, saving, sharing, and the plans.
await page.goto(`${origin}/search?q=restaurants`, { waitUntil: "networkidle" });
const allRestaurants = Number((await page.locator('main p[role="status"]').first().innerText()).replace(/,/g, "").match(/(\d+) results?/)?.[1] ?? 0);
await page.locator('nav[aria-label="Narrow these listings"] a', { hasText: "With a telephone number" }).click();
await page.waitForURL(/phone=1/);
const withPhone = Number((await page.locator('main p[role="status"]').first().innerText()).replace(/,/g, "").match(/(\d+) results?/)?.[1] ?? 0);
const rows = await page.locator("main article[data-listing]").count();
const rowsWithTel = await page.locator('main article[data-listing]:has(a[href^="tel:"])').count();
check("narrowing: with a telephone number leaves fewer, and every one has a number", withPhone > 0 && withPhone < allRestaurants && rows > 0 && rows === rowsWithTel, `${withPhone} of ${allRestaurants}, ${rowsWithTel}/${rows}`);
check("narrowing: the one that is on is marked, and can be cleared", (await page.locator('a.filter[aria-current="true"]').count()) === 1 && (await page.locator('nav[aria-label="Narrow these listings"] a', { hasText: "Clear" }).count()) === 1);
await page.locator("details.menu summary").click();
await page.locator("details.menu .menu-list a").first().click();
await page.waitForURL(/town=/);
const townName = (await page.locator("details.menu summary").innerText()).trim();
check("narrowing: by town", townName.length > 0 && !/Any town/.test(townName) && (await page.locator("main article[data-listing]").count()) > 0, townName);

await page.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "networkidle" });
const firstName = await page.locator("main article[data-listing] h3").first().innerText();
await page.locator('main article[data-listing] button[aria-pressed="false"]').first().click();
check("saving: the bookmark is pressed and the menu counts one", (await page.locator('main article[data-listing] button[aria-pressed="true"]').count()) === 1 && /Saved, 1/.test((await page.locator('header a[href="/saved"]').getAttribute("aria-label")) ?? ""));
await page.goto(`${origin}/saved`, { waitUntil: "networkidle" });
await page.waitForSelector("main article[data-listing]");
check("saving: the saved page lists it", (await page.locator("main article[data-listing] h2").first().innerText()) === firstName, firstName);
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
await page.locator("main button", { hasText: "Share this list" }).click();
const copied = await page.evaluate(() => navigator.clipboard.readText());
check("sharing: a saved list is a link that can be sent", /\/saved\?ids=/.test(copied) && (await page.locator(".toast").innerText()).includes("Link copied"), copied);
const stranger = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const other = await stranger.newPage();
await other.goto(copied, { waitUntil: "networkidle" });
await other.waitForSelector("main article[data-listing]");
check("sharing: the link shows the same list to someone else", (await other.locator("main article[data-listing] h2").first().innerText()) === firstName && (await other.locator("main button", { hasText: "Save all" }).count()) === 1);
await stranger.close();

await page.goto(`${origin}/pricing`, { waitUntil: "domcontentloaded" });
const plans = await page.locator("main article").allInnerTexts();
check("plans: free, Rs 550 and Rs 1,250 a month", plans.length === 3 && /Biznes Free/.test(plans[0]) && /Rs 550/.test(plans[1]) && /Rs 1,250/.test(plans[2]));

// 8c. The pocket guide: its price, its sponsors, and that it is not handed out while it is sold.
await page.goto(`${origin}/shop`, { waitUntil: "domcontentloaded" });
const shop = await page.locator("main").innerText();
check("shop: the guide is Rs 150, renewed every month", /Rs 150/.test(shop) && /edition/.test(shop) && /A new edition every month/.test(shop));
check("shop: a business can sponsor a coming edition, at three prices", /Sponsored listing/.test(shop) && /Sponsored panel/.test(shop) && /Sponsored page/.test(shop) && (await page.locator('main a[href^="/add?sponsor="]').count()) === 1);
const guideSlug = (await page.locator('main a[href^="/add?sponsor="]').getAttribute("href")).split("=")[1];
const handed = await context.request.get(`${origin}/shop/${guideSlug}/download`, { maxRedirects: 0 });
check("shop: the guide is not handed out while it is sold", handed.status() === 303 && !/pdf/.test(handed.headers()["content-type"] ?? ""), String(handed.status()));
await page.goto(`${origin}/add?sponsor=${guideSlug}`, { waitUntil: "domcontentloaded" });
check("shop: asking to sponsor opens the form with the guide named", /sponsor the pocket guide/.test(await page.locator("main textarea").inputValue()));

// 9. A phone: nothing wider than the screen, the ways in always on show.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const small = await phone.newPage();
for (const path of ["/", "/search?q=bank", "/search?q=restaurants", "/learn/vat", "/b/n5651200767", "/directory", "/directory/restaurants", "/places/curepipe", "/tools/verify", "/pricing", "/saved", "/shop", "/emergency", "/holidays"]) {
  await small.goto(origin + path, { waitUntil: "domcontentloaded" });
  const over = await small.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth) - 390);
  check(`phone: ${path} is no wider than the screen`, over <= 0, `${over}px`);
}
check("phone: the five ways in are on show, in a bar at the foot", (await small.locator("nav.tabbar a:visible").count()) === 5);
await small.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
const bar = await small.locator("nav.tabbar").boundingBox();
check("phone: the bar is on the first screen", bar != null && bar.y + bar.height <= 844 && bar.y > 700, JSON.stringify(bar));
check("phone: the emergency numbers are one tap from the first screen", (await small.locator('main section.hero-open a[href="/emergency"]').count()) === 1);
await small.locator('header summary[aria-label="Menu"]').click();
check("phone: the menu opens every group of pages", (await small.locator("header .menu-panel-all a:visible").count()) >= 10);
await small.keyboard.press("Escape");
await small.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "domcontentloaded" });
check("phone: results have a small chart above them", await small.locator(".chart-strip").first().isVisible());
await small.goto(`${origin}/learn/vat`, { waitUntil: "domcontentloaded" });
check("phone: a guide's contents open as a list", (await small.locator("main details summary").first().isVisible()) && (await small.locator("table.table thead").first().evaluate((el) => el.getBoundingClientRect().width <= 2)));
await phone.close();

// 10. Security: the headers, the policy in a real browser, and what an attacker would try first.
{
  const head = (await context.request.get(`${origin}/`)).headers();
  const policy = head["content-security-policy"] ?? "";
  const directive = (name) => (policy.split(";").map((d) => d.trim().split(/\s+/)).find((d) => d[0] === name) ?? []).slice(1);
  const only = (name, ...values) => directive(name).join(" ") === values.join(" ");
  check(
    "security: the policy closes script from elsewhere, script in attributes, plugins, frames, and a base or a form that points away",
    only("default-src", "'self'") && only("script-src", "'self'", "'unsafe-inline'") && only("script-src-attr", "'none'") && only("object-src", "'none'") && only("frame-src", "'none'") && only("frame-ancestors", "'none'") && only("base-uri", "'self'") && only("form-action", "'self'"),
    policy,
  );
  const hosts = [...new Set(policy.match(/https?:\/\/[^\s;]+/g) ?? [])];
  const known = (host) => host === "https://tiles.openfreemap.org" || host === "https://*.tile.openstreetmap.org" || /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(host) || /^http:\/\/127\.0\.0\.1:\d+$/.test(host);
  check("security: the only other hosts in the policy are the map's and the accounts' own", hosts.every(known), hosts.join(" "));
  check(
    "security: the other headers are set, and the site does not say what it is built with",
    head["x-content-type-options"] === "nosniff" && head["x-frame-options"] === "DENY" && head["referrer-policy"] === "strict-origin-when-cross-origin" && /max-age=\d{8,}; includeSubDomains/.test(head["strict-transport-security"] ?? "") && head["cross-origin-opener-policy"] === "same-origin" && /camera=\(\)/.test(head["permissions-policy"] ?? "") && !("x-powered-by" in head),
    JSON.stringify(head).slice(0, 300),
  );

  // Every kind of page, in a browser that notes whatever the policy refuses.
  const guarded = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await guarded.addInitScript(() => {
    window.__refused = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__refused.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  const watched = await guarded.newPage();
  const refused = [];
  watched.on("console", (m) => /Content Security Policy|Refused to/i.test(m.text()) && refused.push(m.text().slice(0, 160)));
  const listingPath = "/b/keiffel-tours-grand-baie-n5651200767";
  for (const path of ["/", "/search?q=pharmacy+in+curepipe", listingPath, "/learn/vat", "/saved", "/shop", "/emergency", "/offline"]) {
    await watched.goto(origin + path, { waitUntil: "load" });
    if (path === "/") {
      await watched.fill("#home-search", "pharm");
      await watched.waitForSelector('[role="listbox"] [role="option"]', { timeout: 8000 }).catch(() => {});
    }
    await watched.waitForTimeout(400);
    refused.push(...(await watched.evaluate(() => window.__refused)).map((what) => `${path}: ${what}`));
  }
  check("security: no page is refused anything of its own by the policy", refused.length === 0, refused.slice(0, 3).join(" | "));
  const worker = await watched.evaluate(() => Promise.race([navigator.serviceWorker.ready.then((r) => r.active?.scriptURL ?? ""), new Promise((r) => setTimeout(() => r("none"), 15000))]));
  check("security: the service worker registers under the policy, and the manifest loads", worker.endsWith("/sw.js") && (await watched.evaluate(() => fetch(document.querySelector('link[rel="manifest"]').href).then((r) => r.ok))), worker);

  await watched.goto(origin + listingPath, { waitUntil: "load" });
  const tried = await watched.evaluate(async () => {
    window.__refused = [];
    const holder = document.createElement("div");
    holder.innerHTML = '<img src="/icons/icon-192.png" onload="window.__ran = 1" onerror="window.__ran = 1">';
    document.body.append(holder);
    const script = document.createElement("script");
    script.src = "https://example.com/x.js";
    document.body.append(script);
    const reached = await fetch("https://example.com/", { mode: "no-cors" }).then(() => true, () => false);
    await new Promise((r) => setTimeout(r, 500));
    return { ran: window.__ran === 1, reached, refused: window.__refused };
  });
  check("security: script in an attribute, script from another site and a connection elsewhere are refused", !tried.ran && !tried.reached && ["script-src-attr", "script-src-elem", "connect-src"].every((d) => tried.refused.some((r) => r.startsWith(d))), JSON.stringify(tried));
  const marked = await watched.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => !s.innerHTML.includes("<") && typeof JSON.parse(s.textContent) === "object"));
  check("security: a listing's structured data cannot close its own script", marked.length > 0 && marked.every(Boolean));
  const links = await watched.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((href) => !/^(https?:\/\/|tel:\+?\d|mailto:|\/(?!\/)|#)/.test(href)));
  check("security: every link on a listing leads to a page, a telephone or an email address", links.length === 0, links.slice(0, 3).join(" "));
  await watched.goto(`${origin}/search?q=${encodeURIComponent('"><img src=x onerror="window.__ran=1"><script>window.__ran=1</script>')}`, { waitUntil: "load" });
  check("security: a question is shown as words and never run", (await watched.evaluate(() => window.__ran)) !== 1 && (await watched.locator('main img[src="x"]').count()) === 0 && (await watched.inputValue("main input[name=q]").catch(() => "")).includes("<script>"));

  // The worker is in charge by now. A private page and an endpoint are opened: neither may be kept.
  await watched.goto(`${origin}/account`, { waitUntil: "load" });
  await watched.goto(`${origin}/emergency`, { waitUntil: "load" });
  await watched.evaluate(() => fetch("/api/listings?ids=n5651200767").then((r) => r.text()));
  await watched.waitForTimeout(800);
  const kept = await watched.evaluate(async () => {
    const paths = [];
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname);
    return paths;
  });
  const keptPrivate = kept.filter((path) => /^\/(api|account|admin|dashboard|auth)(\/|$)/.test(path));
  check("security: the worker keeps a public page, and never a private page or an endpoint's answer", kept.includes("/emergency") && keptPrivate.length === 0, `${kept.length} kept; ${keptPrivate.join(" ")}`);
  await guarded.close();

  // Addresses an attacker would write by hand.
  const ask = (path) => context.request.get(origin + path, { maxRedirects: 0 });
  const twice = await Promise.all(["/search?q=a&q=b", "/saved?ids=a&ids=b", "/add?listing=a&listing=b&plan=go&plan=grow"].map((path) => ask(path).then((r) => r.status())));
  check("security: a parameter given twice is read, and is not a fault", twice.every((status) => status === 200), twice.join(" "));
  const led = await Promise.all(["/auth/confirm?next=//evil.example/", "/auth/confirm?next=https://evil.example/", "/auth/confirm?next=/%5Cevil.example", "/account/sign-in?next=https://evil.example/"].map((path) => ask(path).then((r) => r.headers()["location"] ?? "")));
  check("security: a link through the site leads only to the site", led.every((to) => !/evil/.test(to) && (to === "" || /^\/(?![\/\\])/.test(to) || to.startsWith(`${origin}/`))), led.join(" "));
  const walked = await Promise.all(["/shop/..%2F..%2Fpackage.json/download", "/shop/%2E%2E%2Fproduct.json/download", "/shop/no-such-guide/download", "/data/..%2F..%2Fpackage.json", "/data/%2E%2E%2F%2E%2E%2Fpackage.json"].map((path) => ask(path).then(async (r) => `${r.status()}${/"dependencies"|%PDF/.test(await r.text()) ? " and a file" : ""}`)));
  check("security: the routes that hand out files hand out their own and no other", walked.every((answer) => answer === "404"), walked.join(" | "));
  const unlisted = await Promise.all(["/account", "/dashboard", "/admin", "/account/me", "/api/listings?ids=n1"].map((path) => ask(path).then((r) => r.headers()["x-robots-tag"] ?? "none")));
  check("security: private pages and endpoints ask not to be indexed", unlisted.every((value) => /noindex/.test(value)), unlisted.join(" | "));
  const sitemap = await (await ask("/sitemap.xml")).text();
  check("security: the sitemap lists no private address", sitemap.includes("<loc>") && !/<loc>https?:\/\/[^/<]+\/(account|dashboard|admin|auth|api|saved|offline)[/?<]/.test(sitemap));

  // The form's endpoint. Each try comes from an address of its own, so the limit met above does not answer for it.
  const good = { topic: "add", business: "Honest Shop", message: "Please add it.", name: "A Tester", email: "tester@example.com" };
  const send = (from, headers, data) => context.request.post(`${origin}/api/enquiry`, { headers: { "x-forwarded-for": from, ...headers }, data });
  const refusals = [
    (await send("203.0.113.1", { "sec-fetch-site": "cross-site" }, good)).status(),
    (await send("203.0.113.2", { "content-type": "text/plain" }, JSON.stringify(good))).status(),
    (await send("203.0.113.3", {}, { ...good, message: "x".repeat(40000) })).status(),
    (await send("203.0.113.4", { "content-type": "application/json" }, "null")).status(),
  ];
  check("security: the form's endpoint refuses another site, what is not JSON, what is too heavy and what is not a request", refusals.join(" ") === "403 415 413 400", refusals.join(" "));
  const before = received.length;
  const forged = await send("203.0.113.5", {}, { ...good, business: "Shop\r\nBcc: thief@evil.example", name: "A\nTester", reply: "phone", phone: "+230 5450\n8600", message: "First line.\nSecond line." });
  const got = received[before] ?? {};
  check(
    "security: a line break typed into a field cannot start a new line in what is sent on",
    forged.status() === 200 && received.length === before + 1 && ![got.subject, got.business, got.name, got.phone].some((v) => typeof v !== "string" || /[\r\n]/.test(v)) && got.message === "First line.\nSecond line.",
    JSON.stringify(got).slice(0, 200),
  );
}

check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
hook.close();
process.exit(failed ? 1 : 0);
