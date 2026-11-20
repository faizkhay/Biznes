// What the site does, checked in a real browser against a production server.
//
//   npm run build
//   ENQUIRY_WEBHOOK_URL=http://127.0.0.1:3199/hook npx next start -p 3100 &
//   node scripts/behaviour.mjs [origin]        (default http://localhost:3100)
//
// It listens on a port of its own for the request form's delivery, so the form is tested end to
// end: typed in a browser, validated, sent, and received. It also starts a second server with no
// route for requests set. Both ports can be moved, so two people can run it on one machine:
//
//   HOOK_PORT   where the form's delivery lands (default 3199; the server's ENQUIRY_WEBHOOK_URL must name it)
//   ALT_PORT    the second server's port (default 3101)
//
// Exits 1 if any check fails.
//
// Needs: playwright (devDependency).
import { createServer } from "node:http";
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const HOOK_PORT = Number(process.env.HOOK_PORT) || 3199;
const ALT_PORT = Number(process.env.ALT_PORT) || 3101;
const alt = `http://localhost:${ALT_PORT}`;
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
check("home: the day's picture is behind the page", /^(lagoon|flamboyant|cane|lights|market|teafields|chamarel|harbour|village|sunset)$/.test((await page.getAttribute("html", "data-picture")) ?? "") && /url\(/.test(await page.evaluate(() => getComputedStyle(document.querySelector(".backdrop")).backgroundImage)));
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
const lds = (await page.locator('script[type="application/ld+json"]').allInnerTexts()).map((body) => JSON.parse(body));
const ld = lds.find((item) => item.address) ?? {};
check("listing: structured data from the same facts, of the kind its category is", ld["@type"] === "TravelAgency" && ld.address?.addressCountry === "MU" && !!ld.geo && Array.isArray(ld.openingHours) && ld.openingHours.includes("Mo 08:00-18:00"), ld["@type"]);
check("listing: its path is written out for machines too", lds.some((item) => item["@type"] === "BreadcrumbList" && item.itemListElement?.length >= 3));
check("listing: what can be done comes first, in one card: call, directions, website", (await page.locator("main header.biz-head a.btn").count()) === 3 && /Call/.test(await page.locator("main header.biz-head a.btn-filled").innerText()));
check("listing: what is known is in blocks, with the hours day by day and today marked", (await page.locator("main #reach, main #where, main #hours").count()) === 3 && (await page.locator("main dl.hours > div").count()) >= 7 && (await page.locator("main dl.hours [data-today]").count()) === 1);
check("listing: an unclaimed listing says how to claim it, free, in a card of its own", /Is this your business\?/.test(await text("main aside.claim")) && /Claim it free/.test(await text("main aside.claim")) && (await page.locator('main aside.claim a[href^="/add?claim="], main aside.claim a[href^="/dashboard/new?listing="]').count()) === 1);
check("listing: a free page never wears the vivid mark", (await page.locator("main .verified").count()) === 0 && !/Verified/.test(await page.locator("main").innerText()));
check("listing: unknown is a 404", (await page.request.get(`${origin}/b/n1`)).status() === 404);

// 5. Old addresses, and what machines read.
for (const [from, to] of [["/businesses", "/directory"], ["/businesses/lepalatier", "/directory"], ["/enquire", "/add"], ["/how-it-works", "/data"]]) {
  const r = await page.request.get(origin + from, { maxRedirects: 0 });
  check(`old address ${from} leads to ${to}`, r.status() === 308 && r.headers().location === to, `${r.status()} ${r.headers().location}`);
}
const robots = await (await page.request.get(`${origin}/robots.txt`)).text();
check("robots.txt: closed until launch", /Disallow: \/\s*$/m.test(robots));
check("robots.txt: the fetchers that draw a link's card are let in, so a shared link shows its picture", /User-Agent: facebookexternalhit[\s\S]*?Allow: \//.test(robots) && /User-Agent: \*\s+Disallow: \/\s*$/m.test(robots));
const articleHtml = await (await page.request.get(`${origin}/learn/vat`)).text();
const cardUrl = articleHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
const card = await page.request.get(`${origin}${new URL(cardUrl, origin).pathname}`);
check("an article has a card of its own for when its link is pasted", /\/learn\/vat\/opengraph-image/.test(cardUrl) && card.status() === 200 && /image\/png/.test(card.headers()["content-type"] ?? "") && (await card.body()).length < 300000, cardUrl);
const homeHtml = await (await page.request.get(origin)).text();
check("the first screen's card is the picture, with its size and a description", /<meta property="og:image" content="[^"]*\/og\.jpg"/.test(homeHtml) && /og:image:width" content="1200"/.test(homeHtml) && /twitter:card" content="summary_large_image"/.test(homeHtml));
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
    up = await page.request.get(`${alt}/add`).then((r) => r.ok(), () => false);
  }
  if (up) {
    await page.goto(`${alt}/add`, { waitUntil: "networkidle" });
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
check("no script: the answers are lit on the drawn chart", (await still.locator(".chart path.chart-lit-point").count()) >= 1 && ((await still.locator(".chart path.chart-lit-point").first().getAttribute("d")) ?? "").length > 20);
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
check("answers: the site knows who makes it", /product of Khay Digital.*\| \/about/s.test(await answerTo("khay digital")), await answerTo("khay digital"));
check("answers: words that are only partly found are never shown as the answer, and the page says so", (await answerTo("khayzzq digital")) === "" && /holds some of its words/.test(await page.locator('main p[role="status"]').first().innerText()));
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

// 8ba. The order of a page of results: our own pages that answer, then businesses, then mentions, then pages elsewhere.
const order = async (q) => {
  await page.goto(`${origin}/search?q=${encodeURIComponent(q)}`, { waitUntil: "domcontentloaded" });
  return page.evaluate(() => [...document.querySelectorAll("main h2[id^=r-], main details.elsewhere")].map((el) => el.id || "elsewhere").join(" "));
};
check("order: our pages, then businesses, then mentions, then references elsewhere", /^r-guides r-listings r-related.* r-mentions elsewhere/.test(await order("bank")), await order("bank"));
check("order: for a kind of business, the article that goes with it comes before the businesses", (await page.locator("main #r-guides ~ ul article").first().locator("a.row-title").getAttribute("href")) === "/learn/money-and-banking-in-mauritius");
check("order: a who-and-where question gets a sentence of the index's own counts", /^\d+ banks listed across Mauritius; \d+ ha(s|ve) a telephone number on record/.test(await text("main p.tally")), await text("main p.tally"));
await order("pharmacy in curepipe");
const relatedSearches = await page.locator('main nav[aria-labelledby="r-related"] a').allInnerTexts();
check("related searches: the same kind in nearby and larger towns, and across the island, from the index", relatedSearches.length >= 4 && relatedSearches.some((t) => /Pharmacies in Vacoas-Phoenix/.test(t)) && relatedSearches.some((t) => /Pharmacies, all of Mauritius/.test(t)), relatedSearches.join(" | "));
await page.locator('main nav[aria-labelledby="r-related"] a', { hasText: "Pharmacies in Vacoas-Phoenix" }).click();
await page.waitForURL(/q=Pharmacies/);
check("related searches: each is a real search, read as it was written", /Read as: Pharmacies in Vacoas-Phoenix\./.test(await page.locator('main p[role="status"]').first().innerText()));
await order("cyclone season");
const asks = await page.locator("main nav.asks a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
const askedPage = await (await page.request.get(`${origin}/learn/weather-and-cyclones-in-mauritius`)).text();
check("people also ask: the questions the answering article has for headings, each a way to its part", asks.length >= 2 && asks.every((href) => href.startsWith("/learn/weather-and-cyclones-in-mauritius#") && askedPage.includes(`id="${href.split("#")[1]}"`)) && (await page.locator("main nav.asks a").allInnerTexts()).every((t) => t.trim().endsWith("?")), asks.join(" "));

// 8bb. Forty and more searches a Mauritian would type, in English, French and Kreol. For each:
// how it is read, what is given as the answer, and what must not be passed off as one.
const SEARCHES = [
  ["pharmacie rose hill", { read: /Pharmacies in Beau Bassin-Rose Hill/ }],
  ["dokter", { read: /Doctors and clinics/ }],
  ["lopital", { read: /Hospitals/, not: /New Mauritius Hotels/ }],
  ["hospital", { answer: /SAMU ambulance: 114/ }],
  ["lapolis", { answer: /Police emergency: 999 or 112/ }],
  ["CEB number", { answer: /Central Electricity Board helpdesk: 130/ }],
  ["pizza", { read: /Places to eat, matching “pizza”/, first: /pizz/i, not: /McDonald/ }],
  ["dholl puri", { read: /Places to eat, matching “dholl puri”/, first: /dholl puri/i, not: /Domino/ }],
  ["pizza grand baie", { read: /Places to eat in Grand Baie, matching “pizza”/ }],
  ["restaurant indien", { read: /Restaurants/, listings: true }],
  ["kot manze", { read: /Read as: Restaurants\./ }],
  ["where to eat in mahebourg", { read: /Read as: Restaurants in Mahébourg\./, not: /left out/ }],
  ["food delivery", { read: /Restaurants, matching “delivery”/ }],
  ["boulangerie", { read: /Bakeries and pastry shops/ }],
  ["petrol station", { read: /Read as: Filling stations\./ }],
  ["station service", { read: /Filling stations/ }],
  ["labank", { read: /Read as: Banks\./ }],
  ["atm", { read: /Cash machines/, lead: "/learn/money-and-banking-in-mauritius" }],
  ["open a bank account", { answer: /\/learn\/settling-in-mauritius/ }],
  ["taxi", { read: /Read as: Taxis\./, lead: "/learn/getting-around-mauritius" }],
  ["hotel flic en flac", { read: /Hotels and resorts in Flic en Flac/, lead: "/learn/visiting-mauritius" }],
  ["school curepipe", { read: /Schools in Curepipe/ }],
  ["comment créer une entreprise", { answer: /\/learn\/register-a-business/ }],
  ["kouma ouver enn biznes", { answer: /\/learn\/register-a-business/ }],
  ["open a company", { answer: /\/learn\/incorporate-a-company/ }],
  ["ki pou fer dan moris", { read: /Attractions and museums/, lead: "/learn/things-to-do-in-mauritius" }],
  ["jours fériés", { answer: /Every public holiday.*\/holidays/s }],
  ["konze piblik", { answer: /\/holidays/ }],
  ["salaire minimum", { answer: /National minimum wage/ }],
  ["permis de conduire", { answer: /driving licence/i }],
  ["tva", { answer: /Standard rate of VAT: 15%/ }],
  ["time in mauritius", { answer: /Time zone: UTC/ }],
  ["population of mauritius", { answer: /Population/ }],
  ["capital of mauritius", { answer: /Capital: Port Louis/ }],
  ["minimum wage", { answer: /National minimum wage: (MUR|Rs) 17,745/ }],
  ["bar", { read: /Read as: Bars and pubs\./, answer: "", not: /Police du Tourisme/ }],
  ["metro", { answer: /Metro Express/, not: /Police du Tourisme/ }],
  ["bus", { answer: /\/learn\/getting-around-mauritius/, not: /Global business/ }],
  ["chinese", { answer: "", listings: true }],
  ["port louis", { read: /everything in Port Louis/, answer: "" }],
  ["winners", { answer: "", first: /winner/i }],
  ["emtel", { answer: "", first: /emtel/i }],
  ["accountant", { answer: "", note: /not a category of its own/ }],
  ["faiz khayrattee", { answer: /product of Khay Digital.*\/about/s }],
  ["who made biznes.mu", { answer: /\/about/ }],
  ["list my business", { answer: /Biznes Free.*\/pricing/s }],
  ["nonexistent company xyz", { answer: "", read: /holds some of its words/ }],
];
let read = 0;
for (const [q, want] of SEARCHES) {
  const answer = await answerTo(q);
  const status = await page.locator('main p[role="status"]').first().innerText();
  const whole = await page.locator("main").innerText();
  const firstListing = (await page.locator("main article[data-listing] h3").count()) ? await page.locator("main article[data-listing] h3").first().innerText() : "";
  const firstLead = (await page.locator("main #r-guides ~ ul article a.row-title").count()) ? await page.locator("main #r-guides ~ ul article a.row-title").first().getAttribute("href") : "";
  const ok =
    (!want.read || want.read.test(status)) &&
    (want.answer === undefined || (want.answer === "" ? answer === "" : want.answer.test(answer))) &&
    (!want.first || want.first.test(firstListing)) &&
    (!want.lead || firstLead === want.lead) &&
    (!want.listings || firstListing !== "") &&
    (!want.note || want.note.test(await page.locator("main p.note").first().innerText().catch(() => ""))) &&
    (!want.not || !want.not.test(whole));
  if (ok) read++;
  else check(`search: “${q}”`, false, `status: ${status.slice(0, 110)} | answer: ${answer.slice(0, 90)} | first: ${firstListing} | lead: ${firstLead}`);
}
check(`searches: ${SEARCHES.length} a Mauritian would type are read and answered as they should be`, read === SEARCHES.length, `${read} of ${SEARCHES.length}`);

// 8bc. Health: a listing with a telephone number first, in a search and on the category's page; and /data says so.
const telFirst = async () => {
  const has = await page.locator("main article[data-listing]").evaluateAll((rows) => rows.map((row) => Boolean(row.querySelector('a[href^="tel:"]'))));
  return has.length > 3 && has[0] && has.every((tel, i) => tel || !has.slice(i).some(Boolean));
};
await page.goto(`${origin}/search?q=pharmacy`, { waitUntil: "domcontentloaded" });
check("health: in a search, the listings with a telephone number come first", await telFirst());
await page.goto(`${origin}/directory/pharmacies`, { waitUntil: "domcontentloaded" });
check("health: on the category's own page too, and the page says so", (await telFirst()) && /telephone number on record come first/.test(await page.locator("main").innerText()));
await page.goto(`${origin}/data`, { waitUntil: "domcontentloaded" });
const dataWords = await page.locator("main").innerText();
check("the site states the order it keeps", /a listing with a telephone number on record is shown before one without/.test(dataWords) && /First, the pages of this site that answer/.test(dataWords) && /Then businesses and services/.test(dataWords));

// 8bd. Baz Manzer: everything for eating, by kind of place, kind of food and town.
await page.goto(`${origin}/baz-manzer`, { waitUntil: "networkidle" });
const bazAll = Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0);
check("baz manzer: a page of its own, under its awning, with every place to eat", (await text("main h1")) === "Baz Manzer" && (await page.locator("main .baz-awning").count()) === 1 && bazAll > 1000 && (await page.locator("main .baz-types a").count()) === 5, `${bazAll}`);
check("baz manzer: kinds of food from the map's own words, and towns", (await page.locator('main nav[aria-labelledby="by-food"] a').count()) >= 10 && (await page.locator('main nav[aria-labelledby="by-town"] a').count()) >= 5);
await page.locator('main nav[aria-labelledby="by-food"] a', { hasText: "Chinese" }).click();
await page.waitForURL(/food=chinese/);
const bazChinese = Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0);
check("baz manzer: a kind of food narrows the list, and is marked as chosen", bazChinese > 0 && bazChinese < bazAll && /Chinese places to eat/.test(await text("main h2#list")) && (await page.locator('main nav[aria-labelledby="by-food"] a[aria-current="true"]').count()) === 1 && (await page.locator("main article[data-listing]").count()) > 0, `${bazChinese}`);
await page.locator('main nav[aria-labelledby="by-town"] a').first().click();
await page.waitForURL(/town=/);
check("baz manzer: and a town narrows it again", Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0) <= bazChinese && / in /.test(await text("main h2#list")) && (await page.locator("main article[data-listing]").count()) > 0);
await page.goto(`${origin}/baz-manzer`, { waitUntil: "domcontentloaded" });
check("baz manzer: the articles about food stand on its shelf", (await page.locator('main #food-articles ~ ul a[href^="/learn/"]').count()) >= 1);
check("baz manzer: it is in the menu, on the first screen, in the sitemap and in llms.txt", (await page.locator('header .menu-item[href="/baz-manzer"]').count()) >= 1 && /\/baz-manzer</.test(sitemap) && /Baz Manzer/.test(llms) && (await (await page.request.get(origin)).text()).includes('href="/baz-manzer"'));

// 8be. The street map: nothing of it is fetched until it is asked for.
{
  const asked = [];
  const listen = (request) => asked.push(request.url());
  page.on("request", listen);
  await page.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "networkidle" });
  const before = asked.filter((url) => /openfreemap|markers\.json|maplibre/.test(url)).length;
  await page.locator("aside button", { hasText: "Open the street map" }).click();
  await page.waitForFunction(() => document.querySelector(".street-credit, .street-failed"), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  check("street map: no map code, tiles or markers are fetched until it is opened", before === 0 && asked.some((url) => /tiles\.openfreemap\.org\/styles\//.test(url)), `${before} before`);
  const drawn = (await page.locator("aside .street-credit").count()) === 1;
  check("street map: it opens in the island's place, with the tiles' credit always on it", drawn ? /OpenFreeMap/.test(await text("aside .street-credit")) && /OpenStreetMap/.test(await text("aside .street-credit")) && (await page.locator('aside .street button[aria-label="Zoom in"]').count()) === 1 : (await page.locator("aside .street-failed a").count()) === 1, drawn ? "drawn" : "the tiles could not be reached from here: the page said so and offered OpenStreetMap");
  await page.locator("aside button", { hasText: "Back to the island" }).click();
  check("street map: the same button brings the island back", (await page.locator("aside .chart:visible").count()) === 1 && (await page.locator("aside .street").count()) === 0);
  page.off("request", listen);
  const markers = await (await page.request.get(`${origin}/markers.json`)).json();
  check("markers.json: every placed listing, in the order of the island's points", markers.points.length === pts.length / 2 && markers.points[0].length === 5 && typeof markers.kinds[0] === "string", `${markers.points.length}`);
}

// 8bf. The places page: find a town, jump to a district, neighbourhoods under their town.
await page.goto(`${origin}/places`, { waitUntil: "networkidle" });
const allTowns = await page.locator("main li.town:visible").count();
await page.fill('main form.town-finder input[type="search"]', "curep");
const foundTowns = await page.locator("main li.town:visible").allInnerTexts();
check("places: the box makes the list smaller as a town is typed", allTowns > 100 && foundTowns.length >= 1 && foundTowns.length < 5 && foundTowns.some((t) => /Curepipe/.test(t)) && /of \d+ towns and villages/.test(await text('main form.town-finder [role="status"]')), `${foundTowns.length} of ${allTowns}`);
await page.fill('main form.town-finder input[type="search"]', "ebene");
check("places: a neighbourhood finds its town, which opens to show it", (await page.locator("main li.town:visible details[open] a", { hasText: /[EÉ]b[eè]ne/ }).count()) >= 1);
await page.fill('main form.town-finder input[type="search"]', "");
check("places: the districts are ways to jump, and neighbourhoods are folded under their town", (await page.locator('main nav[aria-label="Districts"] a').count()) >= 9 && (await page.locator("main li.town details:not([open])").count()) > 10 && (await page.locator("main li.town:visible").count()) === allTowns);

// 8bg. An article: the part being read is marked, and it ends with the businesses that go with it.
await page.goto(`${origin}/learn/money-and-banking-in-mauritius`, { waitUntil: "networkidle" });
await page.locator("main section h2").nth(3).scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForFunction(() => document.querySelectorAll("#rail a[aria-current]").length === 1, null, { timeout: 5000 }).catch(() => {});
check("article: the contents rail marks the part being read", (await page.locator("#rail a[aria-current]").count()) === 1);
check("article: it ends with the kinds of business that go with it, where the tie is plain", (await page.locator('main #goes-with ~ ul a[href="/directory/banks"]').count()) === 1 && (await page.locator('main #goes-with ~ ul a[href^="/b/"]').count()) >= 3);
check("article: one with no such tie has none made up for it", !(await (await page.request.get(`${origin}/learn/vat`)).text()).includes('id="goes-with"'));
const md = await page.request.get(`${origin}/learn/vat.md`);
check("article: its address with .md after it gives the same article as Markdown", md.status() === 200 && /text\/markdown/.test(md.headers()["content-type"] ?? "") && /^# Value Added Tax/.test(await md.text()) && /## Sources/.test(await md.text()));

// 8bh. The footer, and the header's cart and account.
await page.goto(`${origin}/directory`, { waitUntil: "networkidle" });
const footerWords = await page.locator("footer").innerText();
check("footer: whose product the site is, in the owner's words, and the page's last line", /biznes\.mu is a product of Khay Digital, developed by Faiz Khayrattee\./.test(footerWords) && /A Digital Experience by\s+Khay Digital\s*$/.test(footerWords.trim()) && (await page.locator('footer a[href="https://khay.digital"]').count()) >= 2);
check("footer: every page in four columns", (await page.locator("footer nav h2").allInnerTexts()).join("|") === "EXPLORE|LEARN|FOR BUSINESS|ABOUT" || (await page.locator("footer nav h2").allInnerTexts()).join("|") === "Explore|Learn|For business|About");
const whole = async (ctxPage) => {
  await ctxPage.locator("footer .footer-mark").scrollIntoViewIfNeeded();
  await ctxPage.evaluate(() => document.querySelector("footer .footer-mark").scrollIntoView({ block: "center" }));
  return ctxPage.evaluate(() => {
    const box = document.querySelector("footer .footer-mark").getBoundingClientRect();
    // The b is whole when nothing lies over it: at its top, its middle and its foot.
    return [0.12, 0.5, 0.88].every((at) => document.elementFromPoint(box.left + box.width / 2, box.top + box.height * at)?.closest(".footer-mark") != null);
  });
};
check("footer: the b on its edge is whole, not half under the sheet", await whole(page));
check("header: a cart and an account as soft square buttons, beside the shortlist", (await page.locator('header a.icon-btn-sq[href="/cart"]:visible').count()) === 1 && (await page.locator('header a[href^="/account"]:visible').count()) >= 1);

// 8bi. The cart: the guide goes in, the badge counts one, the cart lists it at its price, and it comes out.
await page.goto(`${origin}/shop`, { waitUntil: "networkidle" });
await page.locator("main button", { hasText: "Add to cart" }).first().click();
check("cart: the pocket guide goes in, and the header counts one", /Cart, 1/.test((await page.locator('header a[href="/cart"]').getAttribute("aria-label")) ?? "") && (await page.locator("main a", { hasText: "In your cart" }).count()) === 1);
await page.goto(`${origin}/pricing`, { waitUntil: "networkidle" });
await page.locator('main button[aria-label="Add to cart: Biznes Go"]').click();
await page.goto(`${origin}/cart`, { waitUntil: "networkidle" });
const cartWords = await page.locator("main").innerText();
check("cart: it lists what is in it at its price in rupees, with the total", /biznes\.mu Pocket Guide/.test(cartWords) && /Rs 150/.test(cartWords) && /Biznes Go/.test(cartWords) && /Rs 550/.test(cartWords) && /Rs 700/.test(await text('main [role="status"]')), await text('main [role="status"]'));
check("cart: it says that nothing is paid here yet, and a person replies", /Paying online is not open yet/.test(cartWords) && /a person contacts you with how to pay/.test(cartWords));
await page.locator('main [data-cart-item="plan:go"] button[aria-label="One more"]').click();
check("cart: a plan is counted by the business, the guide is one", /Rs 1,250/.test(await text('main [role="status"]')) && (await page.locator('main [data-cart-item^="guide:"] button[aria-label="One more"]').count()) === 0);
const orderHref = (await page.locator("main p.checkout-else a").getAttribute("href")) ?? "";
await page.goto(`${origin}${orderHref}`, { waitUntil: "networkidle" });
check("cart: with no way to place an order, the request form opens with the cart written into it", /^\/add\?order=/.test(orderHref) && /2 x Biznes Go/.test(await page.inputValue("#message")) && /1 x biznes\.mu Pocket Guide/.test(await page.inputValue("#message")) && /Total: Rs 1,250/.test(await page.inputValue("#message")), (await page.inputValue("#message")).slice(0, 160));
await page.goto(`${origin}/cart`, { waitUntil: "networkidle" });
await page.locator('main [data-cart-item="plan:go"] button[title="Remove"]').click();
await page.locator('main [data-cart-item^="guide:"] button[title="Remove"]').click();
check("cart: things come out, and an empty cart says what can be bought", /Your cart is empty/.test(await page.locator("main").innerText()) && (await page.locator('main a[href="/shop"], main a[href="/pricing"]').count()) >= 2 && !/Cart, /.test((await page.locator('header a[href="/cart"]').getAttribute("aria-label")) ?? ""));
check("cart: it is one visitor's own page, and asks not to be indexed", /noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""));

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
check("shop: there is one guide, the biznes.mu Pocket Guide", /biznes\.mu Pocket Guide/.test(shop) && (await page.request.get(`${origin}/shop/${guideSlug}-cover.jpg`)).status() === 200 && guideSlug === "biznes-pocket-guide");
check("shop: sponsors make an edition free by the owner's steps", /Rs 8,000\s+Free for the first two weeks of its month/.test(shop) && /Rs 10,000\s+Free for the first three weeks of its month/.test(shop) && /Rs 12,000\s+Free for the whole month/.test(shop), shop.match(/Rs 8,000[^\n]*\n[^\n]*/)?.[0]);
check("shop: an edition holds at most four pages of sponsors, and the page says how many are free", /at most 4 pages of sponsors/.test(shop) && /\d(\.\d+)? pages? of 4 are free/.test(shop));
check("shop: a magazine is said to be coming, and no more than that", /biznes\.mu Biznes Magazine/.test(shop) && /no issue is out yet/.test(shop));
{
  // A fifth page of sponsors is refused in the data the guide's script reads.
  const { spawnSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(`${tmpdir()}/biznes-guide-`);
  const pagesOf = (n) => ({ slug: "test", title: "Test", sponsors: Array.from({ length: n }, (_, i) => ({ name: `Sponsor ${i + 1}`, option: "page", months: ["2027-01"] })) });
  writeFileSync(`${dir}/four.json`, JSON.stringify(pagesOf(4)));
  writeFileSync(`${dir}/five.json`, JSON.stringify(pagesOf(5)));
  const four = spawnSync("node", ["scripts/pdf.mjs", "--check", `${dir}/four.json`], { encoding: "utf8" });
  const five = spawnSync("node", ["scripts/pdf.mjs", "--check", `${dir}/five.json`], { encoding: "utf8" });
  check("guide: four pages of sponsors fit an edition, and a fifth is refused", four.status === 0 && five.status === 1 && /holds at most 4 pages of sponsors, and "Sponsor 5"/.test(five.stderr), `${four.status} ${five.status} ${five.stderr.slice(0, 120)}`);
}

// 9. A phone: nothing wider than the screen, the ways in always on show.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const small = await phone.newPage();
for (const path of ["/", "/search?q=bank", "/search?q=restaurants", "/search?q=cyclone+season", "/learn/vat", "/learn/mauritian-food", "/b/n5651200767", "/b/n14064293374", "/directory", "/directory/restaurants", "/places", "/places/curepipe", "/baz-manzer", "/baz-manzer?food=chinese", "/tools/verify", "/pricing", "/saved", "/cart", "/shop", "/emergency", "/holidays", "/about"]) {
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
await small.goto(`${origin}/directory`, { waitUntil: "networkidle" });
const pill = await small.evaluate(() => {
  const bar = document.querySelector("header .nav-pill");
  const logo = bar.querySelector(".logo").getBoundingClientRect();
  const shown = [...bar.querySelectorAll(':scope > a, :scope > details > summary')].filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.getBoundingClientRect());
  const next = shown.filter((box) => box.left > logo.left + 1).sort((a, b) => a.left - b.left)[0];
  return { fits: bar.scrollWidth <= bar.clientWidth, oneLine: bar.getBoundingClientRect().height <= 64, logoWhole: logo.width > 100 && logo.right <= next.left, cart: Boolean(bar.querySelector('a[href="/cart"]')?.getBoundingClientRect().width), account: Boolean(bar.querySelector('a[href^="/account"]')?.getBoundingClientRect().width), menu: Boolean(bar.querySelector('summary[aria-label="Menu"]')?.getBoundingClientRect().width) };
});
check("phone: the header holds the name whole, the search, the cart, the account and the menu on one line", pill.fits && pill.oneLine && pill.logoWhole && pill.cart && pill.account && pill.menu, JSON.stringify(pill));
check("phone: the footer's b is whole there too, clear of the sheet and of the tab bar", await whole(small));
await small.goto(`${origin}/b/n14064293374`, { waitUntil: "networkidle" });
const act = await small.locator("main header.biz-head a.btn-filled").boundingBox();
check("phone: on a business's page the way to call is on the first screen, as wide as its card", act != null && act.y + act.height < 844 - 80 && act.width > 250, JSON.stringify(act));
await small.locator('main section[aria-labelledby="where"] button', { hasText: "Open the street map" }).click();
await small.waitForFunction(() => document.querySelector('main section[aria-labelledby="where"] :is(.street-credit, .street-failed)'), null, { timeout: 20000 }).catch(() => {});
check("phone: the street map opens beside the address", (await small.locator('main section[aria-labelledby="where"] :is(.street-credit, .street-failed)').count()) === 1);
await phone.close();
// Without script the places page is still the whole list, and its box is a plain search.
const bare = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const quiet = await bare.newPage();
await quiet.goto(`${origin}/places`, { waitUntil: "domcontentloaded" });
check("no script: the towns are a plain list, and the box asks the search", (await quiet.locator("main li.town").count()) > 100 && (await quiet.locator('main form.town-finder[action="/search"] input[name="q"]').count()) === 1);
await quiet.goto(`${origin}/learn/vat`, { waitUntil: "domcontentloaded" });
check("no script: an article's rail is plain links, with none marked", (await quiet.locator("#rail a").count()) > 5 && (await quiet.locator("#rail a[aria-current]").count()) === 0);
await quiet.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "domcontentloaded" });
check("no script: there is no button for a street map that could not open", (await quiet.locator("button", { hasText: "Open the street map" }).count()) === 0);
await bare.close();

check("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "));
console.log(`\n${passed} passed, ${failed} failed`);
await browser.close();
hook.close();
process.exit(failed ? 1 : 0);
