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
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "playwright";
import ts from "typescript";
import { browserPath, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const HOOK_PORT = Number(process.env.HOOK_PORT) || 3199;
const ALT_PORT = Number(process.env.ALT_PORT) || 3101;
const alt = `http://localhost:${ALT_PORT}`;
// The pictures the site has and what may fall over the landing page, by name (src/data/themes.ts).
const THEMES = readFileSync(new URL("../src/data/themes.ts", import.meta.url), "utf8");
const PICTURE_IDS = [...THEMES.matchAll(/^\s+([a-z]+): picture\("/gm)].map((m) => m[1]);
const FALL_NAMES = Object.fromEntries([...THEMES.match(/export const FALLS = \{([\s\S]*?)\} as const;/)[1].matchAll(/^\s*([a-z]+): \{ name: "([^"]+)"/gm)].map((m) => [m[1], m[2]]));
/** The picture behind the page as the browser has it, the one it was told to fetch ahead for this screen, and what falls. */
const looks = (on) =>
  on.evaluate(() => ({
    behind: getComputedStyle(document.querySelector(".backdrop")).backgroundImage.replace(/^url\("?[a-z]+:\/\/[^/]+|"?\)$/g, ""),
    // React may write a preload twice, once where it was asked for and once lifted into the head: each address is counted once.
    ahead: [...new Set([...document.querySelectorAll('link[rel="preload"][as="image"]')].filter((link) => matchMedia(link.media).matches).map((link) => link.getAttribute("href")))],
    state: document.querySelector(".landing")?.getAttribute("data-leaves") ?? null,
    layer: getComputedStyle(document.querySelector(".leaves")).display,
    falling: [...document.querySelectorAll(".leaf")].filter((leaf) => getComputedStyle(leaf).display !== "none").length,
    moving: document.getAnimations().filter((a) => a.effect?.target?.closest?.(".leaves")).map((a) => a.playState),
    fall: document.querySelector(".leaves").getAttribute("data-fall"),
    hidden: document.querySelector(".leaves").getAttribute("aria-hidden"),
    under: getComputedStyle(document.querySelector(".leaves")).zIndex,
    touch: getComputedStyle(document.querySelector(".leaves")).pointerEvents,
    control: (() => {
      const button = document.querySelector(".leaves-toggle");
      return { shown: Boolean(button) && getComputedStyle(button).display !== "none", label: button?.getAttribute("aria-label") ?? "", tall: Math.round(button?.getBoundingClientRect().height ?? 0) };
    })(),
    kept: (() => {
      try {
        return localStorage.getItem("biznes:leaves");
      } catch {
        return undefined;
      }
    })(),
  }));
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
const context = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 } }));
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const text = (selector) => page.locator(selector).first().innerText();

// 1. The landing page: the picture, the site's line, the search and one button, on one screen.
await page.goto(origin, { waitUntil: "networkidle" });
check("landing: one h1, and it is the site's own line", (await page.locator("h1").count()) === 1 && (await text("main h1")).trim() === "The search engine for business in Mauritius");
check("landing: the day's picture is behind the page, one of the eighteen", PICTURE_IDS.length === 18 && PICTURE_IDS.includes((await page.getAttribute("html", "data-picture")) ?? "") && /url\(/.test(await page.evaluate(() => getComputedStyle(document.querySelector(".backdrop")).backgroundImage)));
check("landing: at a desk the search box has the keyboard from the start", (await page.evaluate(() => document.activeElement?.id)) === "home-search");
const landing = await page.evaluate(() => {
  const first = document.querySelector("main .landing-first").getBoundingClientRect();
  const about = document.querySelector("main #about").getBoundingClientRect();
  return {
    buttons: [...document.querySelectorAll("main .landing-first a.btn")].map((a) => `${a.textContent.trim()}|${a.getAttribute("href")}`).join(","),
    onFirst: document.querySelectorAll("main .landing-first h2, main .landing-first h3, main .landing-first article, main .landing-first .tile, main .landing-first .card, main .landing-first .chart").length,
    sheet: getComputedStyle(document.querySelector("main"), "::before").content,
    fills: Math.round(first.bottom) - innerHeight,
    below: Math.round(about.top) - innerHeight,
    search: document.querySelectorAll('main form[role="search"] input[name="q"], main form input[name="q"]').length,
    parts: [...document.querySelectorAll("main > .landing > *")].filter((el) => el.tagName !== "SCRIPT" && getComputedStyle(el).position !== "fixed").map((el) => el.className.split(" ")[0]).join(","),
  };
});
check("landing: the first screen is the search and one button that says Home, with no tiles, no bands and no lists on it", landing.buttons === "Home|/home" && landing.onFirst === 0 && landing.search === 1 && landing.sheet === "none", JSON.stringify(landing));
check("landing: the first screen fills the screen at a desk, and one short section lies under it", landing.fills === 0 && landing.below >= 0 && landing.parts === "landing-first,landing-about", JSON.stringify(landing));
{
  // The section under the first screen: what the site is, what it holds, and the keys.
  const about = await page.evaluate(() => {
    const part = document.querySelector("main #about");
    return {
      title: part.querySelector("h2")?.textContent.trim(),
      says: part.querySelector("h2 + p")?.textContent.trim() ?? "",
      holds: [...part.querySelectorAll(".landing-holds a")].map((a) => `${a.getAttribute("href")}|${a.textContent.replace(/\s+/g, " ").trim()}`),
      keys: [...part.querySelectorAll(".keys a.key")].map((a) => `${a.textContent.trim()}|${a.getAttribute("href")}`).join(","),
      icons: part.querySelectorAll(".keys a.key svg").length,
      named: part.querySelector("nav[aria-labelledby]")?.getAttribute("aria-labelledby") === "keys-title" && Boolean(part.querySelector("#keys-title")),
      tall: Math.round(part.getBoundingClientRect().height),
    };
  });
  check("landing: under the first screen, what the site is, in its own sentence", about.title === "What is biznes.mu?" && /^biznes\.mu is a search engine for business in Mauritius: a directory of businesses and services/.test(about.says), JSON.stringify(about));
  check("landing: what it holds, as three counts from the index, each leading to where it can be seen", about.holds.length === 3 && /^\/directory\|[\d,]+ ?businesses and services$/.test(about.holds[0]) && /^\/places\|\d+ ?towns and villages$/.test(about.holds[1]) && /^\/learn\|\d+ ?articles, each fact with its source$/.test(about.holds[2]), JSON.stringify(about.holds));
  check("landing: eight keys lead straight to the pages most people want, each named as the menu names it and with its own icon", about.keys === "Home|/home,Directory|/directory,Places|/places,Baz Manzer|/baz-manzer,Articles|/learn,Tools|/tools,Emergency numbers|/emergency,Public holidays|/holidays" && about.icons === 8 && about.named, JSON.stringify(about));
  check("landing: the section is short: no taller than the screen", about.tall <= 900, `${about.tall}px`);
  const cue = page.locator("main .landing-foot a.landing-cue");
  check("landing: at the foot of the first screen a line asks the question and leads down to its answer", (await cue.innerText()).trim() === "What is biznes.mu?" && (await cue.getAttribute("href")) === "#about" && (await cue.evaluate((a) => a.getBoundingClientRect().bottom <= innerHeight)));
  await cue.click();
  await page.waitForFunction(() => document.querySelector("#about").getBoundingClientRect().top < innerHeight / 2, null, { timeout: 5000 }).catch(() => {});
  check("landing: pressing it brings the section up the screen", await page.evaluate(() => location.hash === "#about" && document.querySelector("#about").getBoundingClientRect().top < innerHeight / 2));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator("#home-search").focus();
}
const head = await page.evaluate(() => ({
  links: [...document.querySelectorAll("header.site-header a")].filter((a) => a.getBoundingClientRect().width > 0).map((a) => a.getAttribute("href").split("/").slice(0, 2).join("/")).join(","),
  others: document.querySelectorAll("header.site-header nav, header.site-header details, header.site-header input, header.site-header form").length,
}));
check("landing: the header is only the name, the cart and the account", head.links === "/,/cart,/account" && head.others === 0, JSON.stringify(head));
const foot = await page.evaluate(() => {
  const line = document.querySelector("main .landing-credit");
  return { words: line.innerText.replace(/\s+/g, " "), links: [...line.querySelectorAll("nav a")].map((a) => a.getAttribute("href")).join(","), last: line.closest("#about").lastElementChild.contains(line), card: getComputedStyle(document.querySelector("footer.site-footer")).display };
});
check("landing: in the footer's place, one quiet line at the page's end: whose product it is, in the owner's words, and three pages", /biznes\.mu is a product of Khay Digital, developed by Faiz Khayrattee\./.test(foot.words) && foot.links === "/about,/privacy,/more" && /About biznes\.mu Privacy More$/.test(foot.words.trim()) && foot.last && foot.card === "none", JSON.stringify(foot));
check("landing: the skip link is still the first thing the keyboard meets", (await page.evaluate(() => document.querySelector("body a")?.getAttribute("href"))) === "#main" && (await page.locator("a.skip-link").count()) === 1);
await page.evaluate(() => document.activeElement?.blur());
await page.keyboard.press("/");
check("landing: the / key goes to its search box", (await page.evaluate(() => document.activeElement?.id)) === "home-search");
{
  // The picture's two shapes, and what falls over it.
  const desk = await looks(page);
  check("landing: at a desk the picture is the wide one, and it is the one fetched ahead", !desk.behind.endsWith("-tall.jpg") && desk.ahead.length === 1 && desk.ahead[0] === desk.behind, JSON.stringify([desk.behind, desk.ahead]));
  const name = FALL_NAMES[desk.fall];
  check("landing: something of the season falls over the picture: fourteen pieces, moving, under the words, out of the pointer's way and hidden from assistive technology", Boolean(name) && desk.state === "on" && desk.layer === "block" && desk.falling === 14 && desk.moving.length === 28 && desk.moving.every((state) => state === "running") && desk.hidden === "true" && desk.under === "-1" && desk.touch === "none", JSON.stringify(desk));
  check("landing: its control is in the foot line and says what it does", desk.control.shown && desk.control.label === `Pause the falling ${name}` && (await page.locator("main .landing-foot .leaves-toggle").count()) === 1, JSON.stringify(desk.control));
  await page.locator(".leaves-toggle").click();
  const held = await looks(page);
  check("landing: the control holds every piece where it is, and then says it will let them go", held.state === "paused" && held.moving.length === 28 && held.moving.every((state) => state === "paused") && held.control.label === `Let the ${name} fall again` && held.kept === "paused", JSON.stringify(held));
  await page.reload({ waitUntil: "networkidle" });
  const after = await looks(page);
  check("landing: a visitor who held them still finds them still on coming back", after.state === "paused" && after.moving.every((state) => state === "paused") && after.control.label === `Let the ${name} fall again`, JSON.stringify(after));
  await page.locator(".leaves-toggle").click();
  const again = await looks(page);
  check("landing: and lets them fall again, and nothing is kept of the choice", again.state === "on" && again.moving.every((state) => state === "running") && again.kept === null, JSON.stringify(again));
  const calm = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }));
  const quiet = await calm.newPage();
  await quiet.goto(origin, { waitUntil: "networkidle" });
  const none = await looks(quiet);
  check("landing: for a visitor who asks for less motion nothing falls and there is no control: the page is the picture alone", none.state === null && none.layer === "none" && !none.control.shown && none.moving.length === 0, JSON.stringify(none));
  await calm.close();
  for (const [what, width, height, tall] of [["a phone on its side", 844, 390, false], ["a tablet held upright", 820, 1180, true]]) {
    const other = await steady(await browser.newContext({ viewport: { width, height } }));
    const view = await other.newPage();
    await view.goto(origin, { waitUntil: "networkidle" });
    const seen = await looks(view);
    check(`landing: ${what} has the ${tall ? "tall" : "wide"} picture`, seen.behind.endsWith("-tall.jpg") === tall && seen.ahead.length === 1 && seen.ahead[0] === seen.behind, JSON.stringify([seen.behind, seen.ahead]));
    await other.close();
  }
}
const pts = await (await page.request.get(`${origin}/points.json`)).json();
check("points.json: pairs of whole numbers", Array.isArray(pts) && pts.length > 10000 && pts.length % 2 === 0 && pts.every(Number.isInteger), `${pts.length}`);

// 1b. The Home page: everything, set out with icons, in the owner's order.
await page.locator('main a.btn[href="/home"]').click();
await page.waitForURL(/\/home$/);
await page.waitForLoadState("networkidle");
check("home: the landing page's button leads to it, and the header says that is where you are", (await text("main h1")).trim() === "Home" && (await page.locator('header.site-header nav a[href="/home"]').getAttribute("aria-current")) === "page");
const parts = await page.evaluate(() => [...document.querySelectorAll("main h2")].map((h) => `${h.textContent.trim()}|${h.id}`));
check("home: its five parts, in the owner's order, each under a plain heading", parts.join(",") === "Top businesses|top-businesses,Baz Manzer|baz-manzer,Categories|categories,Regions|regions,Useful|useful", parts.join(","));
const jumps = await page.locator('main nav[aria-label="On this page"] a').evaluateAll((links) => links.map((a) => a.getAttribute("href")).join(","));
check("home: each part can be jumped to, and each has a way to see all of it", jumps === "#top-businesses,#baz-manzer,#categories,#regions,#useful" && (await page.evaluate(() => ["/directory", "/baz-manzer", "/places", "/more"].every((href) => document.querySelector(`main section a[href="${href}"]`)))));
// The top businesses. What "top" means is said on the page and on /data, and checked here against the index itself.
const { turnOf } = await import(`data:text/javascript,${encodeURIComponent(ts.transpileModule(readFileSync(new URL("../src/lib/turn.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText)}`);
const everyListing = JSON.parse(readFileSync(new URL("../data/index/listings.json", import.meta.url), "utf8"));
const fullest = everyListing.filter((l) => l.phone?.length && l.web && l.hours && l.street).sort((a, b) => a.id.localeCompare(b.id));
const topRows = await page.locator("main section[aria-labelledby=top-businesses] article[data-listing]").evaluateAll((rows) => rows.map((row) => ({ id: row.dataset.listing, paid: row.classList.contains("listing-paid"), marked: Boolean(row.querySelector(".verified")), tel: Boolean(row.querySelector('a[href^="tel:"]')), web: Boolean(row.querySelector('a[href^="http"]')) })));
const fullIds = new Set(fullest.map((l) => l.id));
const paidFirst = topRows.every((row, i) => row.paid === row.marked && (row.paid || !topRows.slice(i).some((later) => later.paid)));
check("home: eight top businesses; one that pays is first and marked, and every other has a telephone number, a website, hours and an address on record", topRows.length === 8 && paidFirst && topRows.filter((row) => !row.paid).every((row) => fullIds.has(row.id) && row.tel && row.web), JSON.stringify(topRows.map((row) => row.id)));
// The page is made again at most once an hour, so just after midnight in Mauritius it may still show the day before.
const mauritius = (daysAgo) => new Date(Date.now() + 4 * 3600e3 - daysAgo * 864e5).toISOString().slice(0, 10);
const openRows = topRows.filter((row) => !row.paid).map((row) => row.id);
const turnOn = (day) => turnOf(fullest.filter((l) => !topRows.some((row) => row.paid && row.id === l.id)), openRows.length, day).map((l) => l.id).join(",");
check("home: they are the day's turn of the fullest listings, the same for everyone on a given day", [mauritius(0), mauritius(1)].some((day) => turnOn(day) === openRows.join(",")), `${openRows.join(",")} against ${turnOn(mauritius(0))}`);
{
  const day = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
  const round = Math.ceil(fullest.length / 8);
  const from = Math.floor(Date.now() / 864e5 / round) * round;
  const turns = new Map();
  for (let n = from; n < from + round; n++) for (const l of turnOf(fullest, 8, day(n))) turns.set(l.id, (turns.get(l.id) ?? 0) + 1);
  const twice = turnOf(fullest, 8, day(from)).map((l) => l.id).join(",") === turnOf(fullest, 8, day(from)).map((l) => l.id).join(",");
  const moves = turnOf(fullest, 8, day(from)).map((l) => l.id).join(",") !== turnOf(fullest, 8, day(from + 1)).map((l) => l.id).join(",");
  check(`home: in a run of ${round} days every one of the ${fullest.length} fullest listings has its turn, and a day's eight do not change within the day`, turns.size === fullest.length && twice && moves && (fullest.length % 8 !== 0 || [...turns.values()].every((n) => n === 1)), `${turns.size} of ${fullest.length}`);
}
const chosenLine = await text("main section[aria-labelledby=top-businesses] h2 + p");
check("home: the line under the heading says how they are chosen, with the index's own count, and leads to the longer account", new RegExp(`${fullest.length} listings with a telephone number, a website, opening hours and an address on record`).test(chosenLine) && /verified business(es)? on a paid plan comes? first and (is|are) marked/i.test(chosenLine) && (await page.locator('main section[aria-labelledby=top-businesses] a[href="/data#top-businesses"]').count()) === 1, chosenLine);
const eatLinks = await page.locator("main section[aria-labelledby=baz-manzer] a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
check("home: Baz Manzer's five kinds of place and eight kinds of food, each with its count, and a button into it", eatLinks.filter((href) => href.startsWith("/baz-manzer/kind/")).length === 5 && eatLinks.filter((href) => href.startsWith("/baz-manzer/food/")).length === 8 && (await page.locator('main section[aria-labelledby=baz-manzer] a.btn[href="/baz-manzer"]').count()) === 1 && (await page.locator("main section[aria-labelledby=baz-manzer] a.tile").allInnerTexts()).every((words) => /\d/.test(words)), eatLinks.join(" "));
const groupLinks = await page.locator('main section[aria-labelledby=categories] a[href^="/directory#g-"]').evaluateAll((links) => links.map((a) => a.getAttribute("href").split("#")[1]));
const kindLinks = await page.locator('main section[aria-labelledby=categories] a.tile[href^="/directory/"]').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
const directoryHtml = await (await page.request.get(`${origin}/directory`)).text();
check("home: the thirteen groups of the directory, each leading to its own part of it, and the dozen kinds most listed", groupLinks.length === 13 && groupLinks.every((id) => directoryHtml.includes(`id="${id}"`)) && kindLinks.length === 12 && kindLinks.every((href) => directoryHtml.includes(`href="${href}"`)), `${groupLinks.length} groups, ${kindLinks.length} kinds`);
const regionLinks = await page.locator('main section[aria-labelledby=regions] a[href^="/places#d-"]').evaluateAll((links) => links.map((a) => ({ id: a.getAttribute("href").split("#")[1], words: a.innerText })));
const placesHtml = await (await page.request.get(`${origin}/places`)).text();
check("home: the ten regions, Rodrigues among them, each with its count and its largest towns, leading to its part of the towns", regionLinks.length === 10 && regionLinks.some((region) => region.id === "d-rodrigues" && /Port Mathurin/.test(region.words)) && regionLinks.every((region) => placesHtml.includes(`id="${region.id}"`) && /\d+ listed/.test(region.words)), regionLinks.map((region) => region.id).join(" "));
await page.waitForFunction(() => document.querySelector(".chart")?.dataset.live === "true", null, { timeout: 15000 }).catch(() => {});
check("home: the island stands beside the regions, and goes live with script", (await page.locator('main section[aria-labelledby=regions] .chart[data-live="true"]').count()) === 1);
const dial = await page.locator("main section[aria-labelledby=useful] ul.dial").first().locator("a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
check("home: the numbers to call lead with the police's, each a link that dials it", dial[0] === "tel:999" && dial.includes("tel:112") && dial.includes("tel:114") && dial.includes("tel:115") && (await page.locator('main section[aria-labelledby=useful] a[href="/emergency"]').count()) === 1, dial.join(" "));
const holidayRows = await page.locator("main section[aria-labelledby=useful] article[aria-labelledby=holidays] ul.dial li").allInnerTexts();
const holidaysPage = await (await page.request.get(`${origin}/holidays`)).text();
check("home: the next public holiday, with its day of the week, as the holidays page has it", holidayRows.length >= 1 && /Next/.test(holidayRows[0]) && /(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day \d+ \w+ 20\d\d/.test(holidayRows[0]) && holidaysPage.includes(holidayRows[0].match(/\w+day \d+ \w+ 20\d\d/)[0]), holidayRows[0]);
const usefulLinks = await page.locator("main section[aria-labelledby=useful] a.start-tile").evaluateAll((links) => links.map((a) => a.getAttribute("href")).join(","));
check("home: and the pages people come back to: articles, tools, the Pocket Guide, the glossary, official pages, and the way to list a business", usefulLinks === "/learn,/tools,/shop,/learn/glossary,/official,/pricing", usefulLinks);
const icons = await page.evaluate(() => {
  const ways = [...document.querySelectorAll("main a.tile, main a.start-tile")];
  const size = () => [...new Set([...document.querySelectorAll("main a.tile:not(.tile-quiet) .tile-icon svg")].map((svg) => Math.round(svg.getBoundingClientRect().width)))].join(",");
  const before = size();
  document.querySelector(".home").style.setProperty("--home-icon", "2rem");
  const after = size();
  document.querySelector(".home").style.removeProperty("--home-icon");
  return { ways: ways.length, beside: ways.every((a) => a.querySelector(".tile-icon svg[aria-hidden=true]") && a.innerText.trim().length > 2), before, after };
});
check("home: every way in has an icon beside its words, hidden from a screen reader, at a size set in one place", icons.ways >= 54 && icons.beside && icons.before === "22" && icons.after === "32", JSON.stringify(icons));
check("home: nothing is marked as paid or sponsored that is not: every mark is on a paid row, and an advertisement says it is one", topRows.filter((row) => row.marked).length === (await page.locator("main .verified").count()) && (await page.locator("main aside.ad").count()) === (await page.locator("main aside.ad", { hasText: "Sponsored" }).count()));

// 2. Typing: suggestions and the keyboard.
await page.goto(origin, { waitUntil: "networkidle" });
await page.fill("#home-search", "pharm");
await page.waitForSelector('[role="listbox"] [role="option"]', { timeout: 8000 }).catch(() => {});
const options = await page.locator('[role="listbox"] [role="option"]').count();
check("search box: suggestions while typing", options >= 3, `${options}`);
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
// The key is listened for by script, which a page asked for only as far as its markup may not have run yet.
await page.waitForLoadState("networkidle");
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
check("the landing page's card is the picture, with its size and a description", /<meta property="og:image" content="[^"]*\/og\.jpg"/.test(homeHtml) && /og:image:width" content="1200"/.test(homeHtml) && /twitter:card" content="summary_large_image"/.test(homeHtml));
check("the landing page is still the site's front door for a search engine: its title, the site with its search, and who is behind it", /<title>biznes\.mu · The search engine for business in Mauritius<\/title>/.test(homeHtml) && /"@type":"WebSite"/.test(homeHtml) && /"@type":"SearchAction"/.test(homeHtml) && /\/search\?q=\{query\}/.test(homeHtml) && /"@type":"Organization"/.test(homeHtml) && /<link rel="canonical" href="https?:\/\/[^"/]+\/?"/.test(homeHtml));
const sitemap = await (await page.request.get(`${origin}/sitemap.xml`)).text();
check("sitemap: listings, guides, towns", (sitemap.match(/<loc>/g) ?? []).length > 7000 && /\/learn\/vat</.test(sitemap) && /\/places\/curepipe</.test(sitemap));
const llms = await (await page.request.get(`${origin}/llms.txt`)).text();
check("llms.txt: names the guides and the sources", /OpenStreetMap/.test(llms) && /\/learn\/vat/.test(llms));
const homePageHtml = await (await page.request.get(`${origin}/home`)).text();
const homeCardUrl = homePageHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? "";
const homeCard = await page.request.get(`${origin}${new URL(homeCardUrl, origin).pathname}`);
check("the Home page has a title, a description and a drawn card of its own, and is in the sitemap and in llms.txt", /<title>Home: businesses, food and regions of Mauritius · biznes\.mu<\/title>/.test(homePageHtml) && /<meta name="description" content="The Home page of biznes\.mu/.test(homePageHtml) && /\/home\/opengraph-image/.test(homeCardUrl) && homeCard.status() === 200 && /image\/png/.test(homeCard.headers()["content-type"] ?? "") && /\/home</.test(sitemap) && /\[Home\]\([^)]*\/home\)/.test(llms), homeCardUrl);
check("the Home page says what it holds to a machine: a list of the day's top businesses, by their own addresses", /"@type":"CollectionPage"/.test(homePageHtml) && /"@type":"ItemList","name":"Top businesses","numberOfItems":8/.test(homePageHtml));
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
const plain = await steady(await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }));
const still = await plain.newPage();
await still.goto(`${origin}/home`, { waitUntil: "domcontentloaded" });
check("no script: the chart is drawn, with its dots", (await still.locator(".chart svg path.chart-dots").count()) === 3 && (await still.locator(".chart svg path.chart-coast").count()) >= 2);
check("no script: the Home page is whole: its five parts, the eight businesses, every tile and the numbers to call", (await still.locator("main h2").count()) === 5 && (await still.locator("main article[data-listing]").count()) === 8 && (await still.locator("main a.tile, main a.start-tile").count()) >= 54 && (await still.locator('main a[href="tel:999"]').count()) === 1);
await still.goto(origin, { waitUntil: "domcontentloaded" });
check("no script: the landing page still has its search and its one button", (await still.locator("main #home-search").count()) === 1 && (await still.locator('main a.btn[href="/home"]').count()) === 1);
check("no script: nothing falls and no control for it is shown", (await still.locator(".leaves").evaluate((layer) => getComputedStyle(layer).display)) === "none" && !(await still.locator(".leaves-toggle").isVisible()));
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

// 8a. The header, on a search engine's model: the name, the search box in the middle, one word that opens a grid of pages, and what is the visitor's own.
await page.goto(`${origin}/directory`, { waitUntil: "networkidle" });
const openLists = () => page.locator("header details[open]").count();
const MENU_TILES = "Home|/home,Directory|/directory,Places|/places,Baz Manzer|/baz-manzer,Articles|/learn,Tools|/tools,Emergency numbers|/emergency,Public holidays|/holidays,Pocket Guide|/shop,Glossary|/learn/glossary,Official pages|/official,Saved|/saved";
const bar = await page.evaluate(() => {
  const header = document.querySelector("header.site-header");
  const pill = header.querySelector(".nav-pill").getBoundingClientRect();
  const box = header.querySelector("#header-search");
  const field = box.closest("form").getBoundingClientRect();
  return {
    shown: [...header.querySelectorAll(".nav-pill > a, .nav-pill > nav summary, .nav-pill form input")].filter((el) => el.getBoundingClientRect().width > 0).map((el) => (el.tagName === "A" ? el.getAttribute("href") : el.tagName === "INPUT" ? "search" : el.textContent.trim())).join(","),
    rows: header.querySelectorAll('nav[aria-label="Main"] > ul').length,
    hint: box.getAttribute("placeholder"),
    wide: Math.round(field.width),
    middle: Math.abs((field.left + field.right) / 2 - (pill.left + pill.right) / 2) < pill.width * 0.12,
  };
});
check("menu: the header holds the name, the search box, Menu, the cart and the account, and no row of links", bar.shown === "/,search,Menu,/cart,/account" && bar.rows === 0, JSON.stringify(bar));
check("menu: the search box is the middle of the header, wide, and says what it finds", bar.middle && bar.wide >= 480 && bar.hint === "Search businesses, articles and numbers", JSON.stringify(bar));
check("menu: the name leads to the landing page, where the search is, and says so", (await page.locator("header a.logo").getAttribute("href")) === "/" && (await page.locator("header a.logo").getAttribute("aria-label")) === "biznes.mu, search");
const trailOf = async () => ({ first: await page.locator('main nav[aria-label="You are here"] a').first().evaluate((a) => `${a.textContent.trim()}|${a.getAttribute("href")}`), machine: (await page.locator('script[type="application/ld+json"]').allInnerTexts()).map((body) => JSON.parse(body)).find((item) => item["@type"] === "BreadcrumbList")?.itemListElement?.[0] });
const trail = await trailOf();
check("menu: the first step of a page's path is Home, for a reader and for a machine", trail.first === "Home|/home" && trail.machine?.name === "Home" && /\/home$/.test(trail.machine?.item ?? ""), JSON.stringify(trail));
check("menu: one thing in the header opens, and it is closed until it is asked for", (await page.locator("header details").count()) === 1 && (await openLists()) === 0);
await page.locator("header summary", { hasText: "Menu" }).click();
const menuTiles = await page.locator("header details[open] .menu-grid a.menu-item").evaluateAll((links) => links.map((a) => ({ said: `${a.textContent.trim()}|${a.getAttribute("href")}`, icon: a.querySelectorAll("svg").length, here: a.getAttribute("aria-current") ?? "", line: a.getAttribute("title") ?? "" })));
check("menu: Menu opens a grid of the twelve pages most often wanted, the four ways in at its head, each a tile with its own icon and its name", menuTiles.map((t) => t.said).join(",") === MENU_TILES && menuTiles.every((t) => t.icon === 1 && t.line.length > 10), menuTiles.map((t) => t.said).join(","));
check("menu: the tile of the page you are on says so, and no other does", menuTiles.filter((t) => t.here).map((t) => `${t.said}|${t.here}`).join(",") === "Directory|/directory|page", JSON.stringify(menuTiles.filter((t) => t.here)));
const menuFoot = await page.locator("header details[open] .menu-foot a").evaluateAll((links) => links.map((a) => `${a.textContent.trim()}|${a.getAttribute("href")}`).join(","));
check("menu: under the grid, the way for a business to list itself and the page of every page", menuFoot === "List your business|/pricing,Every page, in one list|/more", menuFoot);
await page.keyboard.press("Escape");
check("menu: Escape closes the grid and hands the keyboard back to the word that opened it", (await openLists()) === 0 && (await page.evaluate(() => document.activeElement?.tagName === "SUMMARY" && document.activeElement.textContent.trim() === "Menu")));
await page.keyboard.press("Enter");
const openedByKey = await openLists();
for (let i = 0; i < menuTiles.length + 3; i++) await page.keyboard.press("Tab");
check("menu: it opens from the keyboard, and walking out of it with Tab closes it", openedByKey === 1 && (await openLists()) === 0 && (await page.evaluate(() => !document.activeElement?.closest("details"))));
{
  // A press on the page while the grid is open closes the grid and does nothing else.
  await page.locator("header summary", { hasText: "Menu" }).click();
  const under = await page.locator("main a[href]:visible").evaluateAll((links) => {
    const panel = document.querySelector("header .menu-panel").getBoundingClientRect();
    const link = links.find((a) => { const box = a.getBoundingClientRect(); return box.top > 120 && box.bottom < innerHeight && (box.right < panel.left || box.top > panel.bottom); });
    const box = link.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
  await page.mouse.click(under.x, under.y);
  await page.waitForTimeout(400);
  check("menu: a press on the page while the grid is open closes the grid, and does not also open what lay beneath", (await openLists()) === 0 && new URL(page.url()).pathname === "/directory");
  await page.locator("header summary", { hasText: "Menu" }).click();
  await page.locator("#header-search").click();
  check("menu: what is in the header can still be pressed while the grid is open", (await page.evaluate(() => document.activeElement?.id)) === "header-search");
  await page.keyboard.press("Escape");
}
await page.locator("header summary", { hasText: "Menu" }).click();
await page.locator("header details[open] .menu-item", { hasText: "Emergency numbers" }).click();
await page.waitForURL(/\/emergency/);
check("menu: choosing a tile goes there and closes the grid", (await openLists()) === 0 && /999/.test(await page.locator("main").innerText()) && (await page.locator('header a.menu-item[href="/emergency"]').getAttribute("aria-current")) === "page");
await page.goto(`${origin}/places`, { waitUntil: "networkidle" });
check("menu: the towns are the directory turned round: one press goes between the two", (await page.locator('header a.menu-item[href="/places"]').getAttribute("aria-current")) === "page" && (await page.locator('main nav[aria-label="Ways to browse the directory"] a[aria-current="page"]').innerText()).trim() === "By town" && (await page.locator('main nav[aria-label="Ways to browse the directory"] a[href="/directory"]').count()) === 1);
await page.goto(`${origin}/tools/vat`, { waitUntil: "networkidle" });
check("menu: a page beneath a tile lights it as the place you are in", (await page.locator('header a.menu-item[href="/tools"]').getAttribute("aria-current")) === "true" && (await page.locator('header.site-header [aria-current="page"]').count()) === 0);
{
  // The search box in the header is the way to anything: a question is asked without leaving the page behind, and what is found rises into place.
  await page.evaluate(() => (window.__sameDocument = true));
  await page.fill("#header-search", "dentist");
  await page.press("#header-search", "Enter");
  await page.waitForURL(/\/search\?q=dentist$/, { timeout: 8000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const asked = await page.evaluate(() => ({ kept: window.__sameDocument === true, arrived: document.getElementById("main").hasAttribute("data-arrived"), box: document.querySelector("#search")?.value, results: document.querySelectorAll("main article[data-listing]").length, header: document.querySelectorAll("#header-search").length }));
  check("menu: a question typed in the header is asked without a new page load, and the results page takes it up in its own box", asked.kept && asked.arrived && asked.box === "dentist" && asked.results > 0 && asked.header === 0, JSON.stringify(asked));
  await page.fill("#search", "bank");
  await page.press("#search", "Enter");
  await page.waitForURL(/\/search\?q=bank$/, { timeout: 8000 }).catch(() => {});
  const moved = await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => done({ rising: document.getAnimations().filter((a) => a.animationName === "arrive").length, focus: document.activeElement?.id, kept: window.__sameDocument === true }))));
  check("menu: asking again from the results page keeps the keyboard in the box while the new results rise into place", moved.kept && moved.focus === "search" && moved.rising > 0, JSON.stringify(moved));
}
{
  // Motion: a press is answered, and nothing moves that should not.
  const fresh = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 } }));
  const view = await fresh.newPage();
  await view.goto(`${origin}/home`, { waitUntil: "networkidle" });
  const landed = await view.evaluate(() => ({ mark: document.getElementById("main").hasAttribute("data-arrived"), moving: document.getAnimations().filter((a) => a.animationName === "arrive").length, line: document.querySelector(".progress")?.getAttribute("data-state"), hidden: document.querySelector(".progress")?.getAttribute("aria-hidden") }));
  check("motion: the page a visitor lands on is simply there: nothing rises, and no line runs", !landed.mark && landed.moving === 0 && landed.line === "idle" && landed.hidden === "true", JSON.stringify(landed));
  await view.locator("header summary").click();
  const opening = await view.evaluate(() => new Promise((done) => requestAnimationFrame(() => done(document.getAnimations().map((a) => a.animationName)))));
  check("motion: the menu's grid drops from its button and its tiles follow", opening.includes("drop") && opening.filter((name) => name === "arrive").length === 12, opening.join(","));
  const pressed = await view.evaluate(() => {
    const link = document.querySelector('header a.menu-item[href="/directory"]');
    link.click();
    return new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(document.querySelector(".progress").getAttribute("data-state")))));
  });
  await view.waitForURL(/\/directory$/);
  const reached = await view.evaluate(() => new Promise((done) => requestAnimationFrame(() => done({ mark: document.getElementById("main").hasAttribute("data-arrived"), rising: document.getAnimations().filter((a) => a.animationName === "arrive").length, how: getComputedStyle(document.querySelector("main > *")).animationFillMode }))));
  check("motion: a press on a link is answered at once by a line across the top of the screen", pressed === "going" || pressed === "done", String(pressed));
  check("motion: a page reached from another rises into place, and leaves nothing of the movement behind", reached.mark && reached.rising >= 2 && reached.how === "backwards", JSON.stringify(reached));
  await view.waitForTimeout(1200);
  check("motion: once the page is here the line is gone and nothing is still moving", (await view.locator(".progress").getAttribute("data-state")) === "idle" && (await view.evaluate(() => document.getAnimations().filter((a) => a.animationName === "arrive" && a.playState === "running").length)) === 0);
  await fresh.close();
  const calm = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }));
  const quiet = await calm.newPage();
  await quiet.goto(`${origin}/home`, { waitUntil: "networkidle" });
  await quiet.locator('main a[href="/directory"]').first().click();
  await quiet.waitForURL(/\/directory/);
  const still = await quiet.evaluate(() => ({ lasts: parseFloat(getComputedStyle(document.querySelector("main > *")).animationDuration), smooth: getComputedStyle(document.documentElement).scrollBehavior, heading: document.querySelector("main h1")?.getBoundingClientRect().height > 0 }));
  check("motion: for a visitor who asks for less motion every one of them happens at once, and the page is whole", still.lasts < 0.001 && still.smooth === "auto" && still.heading, JSON.stringify(still));
  await calm.close();
}
// Baz Manzer is a section that stands by itself: a reader's path there begins at its own first page, so its app never leads out of itself, and a machine's still begins at Home.
await page.goto(`${origin}/baz-manzer/kind/restaurants`, { waitUntil: "networkidle" });
const bazTrail = await trailOf();
check("menu: inside Baz Manzer a page's path begins at the section's first page for a reader, and at Home for a machine", bazTrail.first === "Baz Manzer|/baz-manzer" && bazTrail.machine?.name === "Home" && /\/home$/.test(bazTrail.machine?.item ?? ""), JSON.stringify(bazTrail));
await page.goto(`${origin}/learn/vat`, { waitUntil: "networkidle" });
check("menu: an article lights Articles as the place you are in, and only the page itself is called the current page", (await page.locator('header.site-header nav a[href="/learn"]').getAttribute("aria-current")) === "true" && (await page.locator('header.site-header [aria-current="page"]').count()) === 0);
await page.goto(`${origin}/more`, { waitUntil: "networkidle" });
const moreGroups = await page.locator('main nav[aria-label="Every page"] h2').allInnerTexts();
const moreLinks = await page.locator('main nav[aria-label="Every page"] a').evaluateAll((links) => links.map((a) => a.getAttribute("href")));
check("more: the page of every page lists each one once, under its heading, Home the first of them", moreGroups.join("|") === "Find|Read|For business|Yours|About" && moreLinks.length === new Set(moreLinks).size && moreLinks.length >= 21 && moreLinks[0] === "/home" && ["/directory", "/places", "/baz-manzer", "/emergency", "/holidays", "/learn", "/tools", "/shop", "/pricing", "/saved", "/cart", "/account", "/about", "/privacy"].every((href) => moreLinks.includes(href)), `${moreGroups.join("|")} ${moreLinks.length}`);
check("more: it has one first heading and is not for a search engine", (await page.locator("main h1").count()) === 1 && (await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));

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
check("saving: the bookmark is pressed, and the shortlist's button comes into the header and counts one", (await page.locator('main article[data-listing] button[aria-pressed="true"]').count()) === 1 && /Saved, 1/.test((await page.locator("header a.nav-saved").getAttribute("aria-label")) ?? ""));
await page.goto(`${origin}/saved`, { waitUntil: "networkidle" });
await page.waitForSelector("main article[data-listing]");
check("saving: the saved page lists it", (await page.locator("main article[data-listing] h2").first().innerText()) === firstName, firstName);
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
await page.locator("main button", { hasText: "Share this list" }).click();
const copied = await page.evaluate(() => navigator.clipboard.readText());
check("sharing: a saved list is a link that can be sent", /\/saved\?ids=/.test(copied) && (await page.locator(".toast").innerText()).includes("Link copied"), copied);
const stranger = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 } }));
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
  ["lopital", { read: /Hospitals/, answer: /SAMU ambulance: 114/, not: /New Mauritius Hotels/ }],
  ["hopital", { read: /Hospitals/, answer: /SAMU ambulance: 114/ }],
  ["farmasi curepipe", { read: /Pharmacies in Curepipe/ }],
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
  // Asked the way people talk: a word that only says "a business", words added when asking aloud, and words no listing holds.
  ["Burger place in beau bassin", { read: /Places to eat in Beau Bassin-Rose Hill, matching “burger”/, first: /McDonald|Ricardo/, not: /holds some of its words|Place Taxi/ }],
  ["where can i get a burger in beau bassin", { read: /Places to eat in Beau Bassin-Rose Hill, matching “burger”/, not: /holds some of its words/ }],
  ["burger restaurants beau bassin", { read: /Places to eat in Beau Bassin-Rose Hill, matching “burger”/, first: /McDonald|Ricardo/ }],
  ["pizza place in curepipe", { read: /Places to eat in Curepipe, matching “pizza”/, first: /Pizza Hut|Domino/ }],
  ["nice restaurant in grand baie", { read: /Restaurants in Grand Baie\. No listing mentions “nice”, so that was left out/, listings: true, not: /holds some of its words/ }],
  ["halal restaurant port louis", { read: /Restaurants in Port Louis\. No listing mentions “halal”/, listings: true }],
  ["late night pharmacy curepipe", { read: /Pharmacies in Curepipe\. No listing mentions “late night”/, listings: true }],
  ["barber shop port louis", { read: /Read as: Hairdressers and barbers in Port Louis\.$/, listings: true }],
  ["un bon restaurant a grand baie", { read: /Restaurants in Grand Baie/, not: /holds some of its words/ }],
  ["endroit pour manger a curepipe", { read: /Read as: Restaurants in Curepipe\./, listings: true }],
  // A name that holds one of those words is still found by it.
  ["Place Taxi Margeot", { first: /Place Taxi Margeot/ }],
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

// 8bb1. A dish in a town: the places that say so, then the places of that kind that say nothing of what they serve, as what they are.
await page.goto(`${origin}/search?q=${encodeURIComponent("burger place in beau bassin")}`, { waitUntil: "domcontentloaded" });
const fitStatus = await page.locator('main p[role="status"]').first().innerText();
const fitAnswers = await page.locator("main #r-listings ~ ul article[data-listing]").count();
const fitAlso = await page.locator("main #r-also ~ ul.rows article[data-listing]").count();
const fitWords = (await page.locator("main section[aria-labelledby=r-also]").count()) ? await page.locator("main section[aria-labelledby=r-also]").innerText() : "";
check("a dish in a town: the count is of the places that say so, and the others of that kind are listed apart as what they are", new RegExp(`^${fitAnswers} results?\\.`).test(fitStatus) && fitAnswers >= 1 && fitAlso >= 1 && fitAlso <= 6 && /May also fit/i.test(fitWords) && /nothing on record about what they serve/.test(fitWords) && /Snacks and takeaways in Beau Bassin-Rose Hill/.test(fitWords), `${fitStatus.slice(0, 60)} | ${fitAnswers} + ${fitAlso}`);
const fitRelated = await page.locator("main nav[aria-labelledby=r-related] a").allInnerTexts();
check("a dish in a town: the same dish in the nearest towns is offered, with real counts", fitRelated.length >= 2 && fitRelated.some((t) => /^Burger in /.test(t.trim())) && fitRelated.some((t) => /^Burger\s+\d+/.test(t.trim())), fitRelated.join(" | "));

// 8bb2. What the site's own engine (src/lib/engine.ts) does that the library before it did not.
const found = async (q) => {
  const status = await reads(q);
  const names = (await page.locator("main article[data-listing] h3").allInnerTexts()).map((name) => name.trim());
  return { status, names, tally: (await page.locator("main p.tally").count()) ? await text("main p.tally") : "" };
};
let got = await found("burgre king");
check("engine: two letters that changed places are one slip, so the business is found and not every king", /close spellings/.test(got.status) && !/holds some of its words/.test(got.status) && got.names.length > 0 && got.names.every((name) => /burger king/i.test(name)), `${got.status.slice(0, 120)} | ${got.names.slice(0, 3).join(", ")}`);
got = await found("restorant");
check("engine: a kind of business typed wrongly is read as the kind, counted, and said to be a close spelling", /Read as: Restaurants\./.test(got.status) && /close spellings/.test(got.status) && /restaurants listed across Mauritius/.test(got.tally), `${got.status.slice(0, 120)} | ${got.tally}`);
got = await found("pharmacy curpipe");
check("engine: a town typed wrongly is read as the town", /Read as: Pharmacies in Curepipe\./.test(got.status) && /close spellings/.test(got.status) && got.names.length > 5, got.status.slice(0, 120));
got = await found("dentsit");
check("engine: a slip that used to find nothing is answered", /Read as: Dentists\./.test(got.status) && got.names.length > 5, got.status.slice(0, 120));
got = await found("state bank of mauritius");
check("engine: a name that is the whole question comes before the names that only hold its words", got.names.length >= 3 && got.names.slice(0, 3).every((name) => /^State Bank of Mauritius/.test(name)), got.names.slice(0, 5).join(", "));
got = await found("ebene pharmacy");
const named = got.names[0] ?? "";
got = await found("battery point");
check("engine: a business whose name reads as a kind and a town, or holds a kind's word, is found by its name wherever it is", /^Ebene Pharmacy/.test(named) && /^Battery Point/.test(got.names[0] ?? "") && !/close spellings/.test(got.status), `${named} | ${got.names.slice(0, 2).join(", ")}`);
got = await found("winers");
check("engine: a plural is not taken for the start of another word: “winers” is Winners, not a winery", /close spellings/.test(got.status) && /^Winner/.test(got.names[0] ?? ""), `${got.status.slice(0, 80)} | ${got.names.slice(0, 3).join(", ")}`);
got = await found("tout le modne en parle");
check("engine: a name of five words with one slip in it finds that business, and only that one", got.names.length === 1 && /^Tout Le Monde En Parle/.test(got.names[0]) && /close spellings/.test(got.status) && !/holds some of its words/.test(got.status), `${got.status.slice(0, 80)} | ${got.names.slice(0, 3).join(", ")}`);
got = await found("grand bay coeur de ville");
check("engine: letters written as one are found typed as two", got.names.length === 1 && /C(œ|oe)ur de Ville/.test(got.names[0]) && !/holds some of its words/.test(got.status), `${got.status.slice(0, 80)} | ${got.names.slice(0, 3).join(", ")}`);
const mistyped = await (await page.request.get(`${origin}/api/suggest?q=restorant`)).json();
check("engine: the list under the search box offers the kind that was meant", mistyped.suggestions.some((s) => s.label === "Restaurants, all of Mauritius") && mistyped.n > 100, mistyped.suggestions.map((s) => s.label).join(" | "));

// 8bc. Health: a listing with a telephone number first, in a search and on the category's page; and /data says so.
const telFirst = async () => {
  const has = await page.locator("main article[data-listing]").evaluateAll((rows) => rows.map((row) => Boolean(row.querySelector('a[href^="tel:"]'))));
  return has.length > 3 && has[0] && has.every((tel, i) => tel || !has.slice(i).some(Boolean));
};
await page.goto(`${origin}/search?q=pharmacy`, { waitUntil: "domcontentloaded" });
check("health: in a search, the listings with a telephone number come first", await telFirst());
await page.goto(`${origin}/directory/pharmacies`, { waitUntil: "domcontentloaded" });
check("health: on the category's own page too, and the page says so", (await telFirst()) && /telephone number on record come first/.test(await page.locator("main").innerText()));
// This page is let to finish its own requests before the next is asked for: a page left while the
// menu's links are still being fetched leaves those requests open in the test browser, and the
// next page then never counts as idle.
await page.goto(`${origin}/data`, { waitUntil: "networkidle" });
const dataWords = await page.locator("main").innerText();
check("the site states the order it keeps", /a listing with a telephone number on record is shown before one without/.test(dataWords) && /First, the pages of this site that answer/.test(dataWords) && /Then businesses and services/.test(dataWords));
check("the site says how its own engine weighs a listing, and what it does with a typing mistake", /A name that is exactly what was typed comes before a longer name/.test(dataWords) && /two letters that changed places/.test(dataWords) && /A close spelling always counts for less than the word spelt right/.test(dataWords));
check("the site says how a question asked aloud is read, and what the second list is", /answered as far as it was understood/.test(dataWords) && /May also fit/.test(dataWords) && /never passed off as an answer/.test(dataWords));

// 8bd. Baz Manzer: everything for eating, by kind of place, kind of food and town.
await page.goto(`${origin}/baz-manzer`, { waitUntil: "networkidle" });
const bazAll = Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0);
check("baz manzer: a page of its own, under its awning, with every place to eat", (await text("main h1")) === "Baz Manzer" && (await page.locator("main .baz-awning").count()) === 1 && bazAll > 1000 && (await page.locator("main .baz-types a").count()) === 5, `${bazAll}`);
check("baz manzer: kinds of food from the map's own words, and towns", (await page.locator('main nav[aria-labelledby="by-food"] a').count()) >= 10 && (await page.locator('main nav[aria-labelledby="by-town"] a').count()) >= 5);
await page.locator('main nav[aria-labelledby="by-food"] a', { hasText: "Chinese" }).click();
await page.waitForURL(/\/baz-manzer\/food\/chinese$/);
const bazChinese = Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0);
check("baz manzer: a kind of food is a page of its own, with only the places that serve it", bazChinese > 0 && bazChinese < bazAll && /Chinese places to eat/.test(await text("main h2#list")) && (await text("main h1")) === "Chinese" && (await page.locator("main article[data-listing]").count()) > 0, `${bazChinese}`);
await page.locator('main nav[aria-labelledby="by-town"] a').first().click();
await page.waitForURL(/town=/);
check("baz manzer: and a town narrows it again, and is marked as chosen", Number((await text("main h2#list")).replace(/,/g, "").match(/^(\d+)/)?.[1] ?? 0) <= bazChinese && / in /.test(await text("main h2#list")) && (await page.locator('main nav[aria-labelledby="by-town"] a[aria-current="true"]').count()) === 1 && (await page.locator("main article[data-listing]").count()) > 0);
// Each of these two is let to finish its own requests, for the reason given above the visit to /data.
await page.goto(`${origin}/baz-manzer`, { waitUntil: "networkidle" });
check("baz manzer: the articles about food stand on its shelf", (await page.locator('main #food-articles ~ ul a[href^="/learn/"]').count()) >= 1);
// Baz Manzer's own pages have a header of their own (scripts/behaviour-baz.mjs), so the site's menu is read from a page outside it.
await page.goto(`${origin}/directory`, { waitUntil: "networkidle" });
check("baz manzer: it is in the menu, on the Home page, in the sitemap and in llms.txt", (await page.locator('header nav a[href="/baz-manzer"]').count()) === 1 && /\/baz-manzer</.test(sitemap) && /Baz Manzer/.test(llms) && homePageHtml.includes('href="/baz-manzer"'));

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
check("footer: every page in four columns, named as the menu names them, Home the first", (await page.locator("footer nav h2").allInnerTexts()).join("|").toLowerCase() === "find|read|for business|about" && (await page.locator("footer nav a").first().evaluate((a) => `${a.textContent.trim()}|${a.getAttribute("href")}`)) === "Home|/home");
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
check("cart: it says that nothing is paid here yet, and a person replies", /Paying online is not open yet/.test(cartWords) && /Nothing is charged here/.test(cartWords) && /a person (contacts you|replies) with how to pay/.test(cartWords));
await page.locator('main [data-cart-item="plan:go"] button[aria-label="One more"]').click();
check("cart: a plan is counted by the business, the guide is one", /Rs 1,250/.test(await text('main [role="status"]')) && (await page.locator('main [data-cart-item^="guide:"] button[aria-label="One more"]').count()) === 0);
const orderHref = (await page.locator('main .checkout a[href^="/add?"]').getAttribute("href").catch(() => "")) ?? "";
if (orderHref) {
  // Accounts are off on this server: the checkout hands the cart, in words, to the request form.
  await page.goto(`${origin}${orderHref}`, { waitUntil: "networkidle" });
  check("cart: with accounts off, the request form opens with the cart written into it", /^\/add\?message=/.test(orderHref) && /2 x Biznes Go/.test(await page.inputValue("#message")) && /1 x biznes\.mu Pocket Guide/.test(await page.inputValue("#message")) && /Rs 150 each/.test(await page.inputValue("#message")), (await page.inputValue("#message")).slice(0, 160));
  await page.goto(`${origin}/add?message=${encodeURIComponent("I would like to order: 1 x Biznes Go.")}&plan=go`, { waitUntil: "networkidle" });
  check("cart: a cart of one plan opens the form for that plan, with the cart's words", /Biznes Go/.test(await text("main h1")) && /1 x Biznes Go/.test(await page.inputValue("#message")));
} else {
  check("cart: with accounts on, the checkout asks who is ordering and sends only what is wanted and how many", (await page.locator('main .checkout form input[name="lines"]').count()) === 1 && /"id":"go","kind":"plan","qty":2/.test(await page.locator('main .checkout form input[name="lines"]').inputValue()) && /"id":"biznes-pocket-guide","kind":"guide","qty":1/.test(await page.locator('main .checkout form input[name="lines"]').inputValue()));
}
// The checkout says so once an order is placed: the cart empties, and what was ordered stays in view.
await page.goto(`${origin}/cart`, { waitUntil: "networkidle" });
await page.evaluate(() => window.dispatchEvent(new CustomEvent("biznes:order-placed", { detail: { number: 1, total: 1250 } })));
await page.waitForTimeout(300);
check("cart: once an order is placed the cart is empty, and the page still shows what was ordered", !/Cart, /.test((await page.locator('header a[href="/cart"]').getAttribute("aria-label")) ?? "") && /What you ordered/.test(await page.locator("main").innerText()) && (await page.locator("main [data-cart-item] button").count()) === 0 && (await page.evaluate(() => localStorage.getItem("biznes:cart"))) === "[]");
await page.evaluate(() => localStorage.setItem("biznes:cart", JSON.stringify([{ id: "biznes-pocket-guide", kind: "guide", name: "biznes.mu Pocket Guide", price: 150, qty: 1 }, { id: "go", kind: "plan", name: "Biznes Go", price: 550, qty: 2 }])));
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
const phone = await steady(await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }));
const small = await phone.newPage();
for (const path of ["/", "/home", "/search?q=bank", "/search?q=restaurants", "/search?q=cyclone+season", "/learn/vat", "/learn/mauritian-food", "/b/n5651200767", "/b/n14064293374", "/directory", "/directory/restaurants", "/places", "/places/curepipe", "/baz-manzer", "/baz-manzer/food/chinese", "/tools/verify", "/pricing", "/saved", "/cart", "/shop", "/emergency", "/holidays", "/about"]) {
  await small.goto(origin + path, { waitUntil: "domcontentloaded" });
  const over = await small.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth) - 390);
  check(`phone: ${path} is no wider than the screen`, over <= 0, `${over}px`);
}
check("phone: the search, Home, Baz Manzer, Articles and More are on show, in a bar at the foot", (await small.locator("nav.tabbar a:visible").allInnerTexts()).map((t) => t.trim()).join("|") === "Search|Home|Baz Manzer|Articles|More");
await small.goto(`${origin}/`, { waitUntil: "networkidle" });
const first = await small.evaluate(() => {
  const within = (el) => Boolean(el) && el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight;
  return { bar: document.querySelectorAll("nav.tabbar").length, fills: Math.round(document.querySelector("main .landing-first").getBoundingClientRect().bottom) - innerHeight, room: getComputedStyle(document.body).paddingBottom, search: within(document.querySelector("#home-search")), home: within(document.querySelector('main a.btn[href="/home"]')), foot: within(document.querySelector("main .landing-foot")), below: Math.round(document.querySelector("main #about").getBoundingClientRect().top) - innerHeight, focus: document.activeElement?.id ?? "" };
});
check("phone: the landing page's first screen fills the screen, with no bar at its foot: the search, the Home button and the line that leads down are all on it, and the section is under it", first.bar === 0 && first.fills === 0 && first.room === "0px" && first.search && first.home && first.foot && first.below >= 0, JSON.stringify(first));
check("phone: the landing page does not take the keyboard, which would cover it", first.focus !== "home-search");
const reach = await small.locator('main a.btn[href="/home"], main .landing-foot a, main .landing-foot button, main .keys a, main .landing-credit nav a, header .nav-pill > a').evaluateAll((links) => links.filter((a) => a.getBoundingClientRect().width > 0).map((a) => Math.round(a.getBoundingClientRect().height)));
check("phone: everything on the landing page that can be pressed is at least 44 pixels tall", reach.length === 17 && reach.every((height) => height >= 44), reach.join(","));
{
  const keys = await small.locator("main .keys a.key").evaluateAll((links) => ({ rows: new Set(links.map((a) => Math.round(a.getBoundingClientRect().top))).size, inside: links.every((a) => a.getBoundingClientRect().left >= 0 && a.getBoundingClientRect().right <= innerWidth && a.scrollWidth <= a.clientWidth + 1) }));
  check("phone: the eight keys stand four abreast in two rows, each whole", keys.rows === 2 && keys.inside, JSON.stringify(keys));
}
{
  const held = await looks(small);
  check("phone: the picture is the tall one, painted for an upright screen, and it is the one fetched ahead", held.behind.endsWith("-tall.jpg") && held.ahead.length === 1 && held.ahead[0] === held.behind, JSON.stringify([held.behind, held.ahead]));
  check("phone: fewer pieces fall, eight, and the control for them is in the line at the foot of the first screen", held.state === "on" && held.falling === 8 && held.control.shown && held.control.tall >= 44, JSON.stringify(held));
}
{
  // The smallest phone still in use, 320 by 568: the same first screen, closer together, and still one screen.
  const little = await steady(await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }));
  const tiny = await little.newPage();
  await tiny.goto(`${origin}/`, { waitUntil: "networkidle" });
  const fits = await tiny.evaluate(() => {
    const boxes = ["main .pill-note", "main h1", "main .search", 'main a.btn[href="/home"]', "main .landing-foot"].map((selector) => document.querySelector(selector).getBoundingClientRect());
    return { over: Math.round(document.querySelector("main .landing-first").getBoundingClientRect().bottom) - innerHeight, wide: document.documentElement.scrollWidth - innerWidth, whole: boxes.every((box) => box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight), apart: boxes.every((box, i) => i === 0 || box.top >= boxes[i - 1].bottom), clear: boxes[0].top >= document.querySelector("header .nav-pill").getBoundingClientRect().bottom };
  });
  check("phone: on the smallest phone the first screen is still one screen, with nothing cut off and nothing lying over anything else", fits.over <= 0 && fits.wide <= 0 && fits.whole && fits.apart && fits.clear, JSON.stringify(fits));
  const bare = await looks(tiny);
  check("phone: on the smallest phone too something falls, and its control is on the first screen", bare.state === "on" && bare.falling === 8 && bare.control.shown && bare.control.tall >= 44 && bare.behind.endsWith("-tall.jpg"), JSON.stringify(bare));
  await little.close();
}
await small.locator('main a.btn[href="/home"]').tap();
await small.waitForURL(/\/home$/);
{
  await small.waitForLoadState("networkidle");
  const pill = await small.evaluate(() => {
    const header = document.querySelector("header.site-header");
    const shown = (el) => Boolean(el) && el.getBoundingClientRect().width > 0;
    const field = header.querySelector("#header-search");
    return { mark: shown(header.querySelector(".logo .logo-mark")), word: shown(header.querySelector(".logo .logo-word")), box: shown(field), size: parseFloat(getComputedStyle(field).fontSize), wide: Math.round(field.closest("form").getBoundingClientRect().width), menu: shown(header.querySelector("summary")), over: document.documentElement.scrollWidth - innerWidth };
  });
  check("phone: on every other page the header holds the search box, with the name drawn as its first letter to leave it room", pill.mark && !pill.word && pill.box && pill.wide >= 180 && !pill.menu && pill.over <= 0, JSON.stringify(pill));
  check("phone: the header's search box is set in sixteen pixels, so the phone does not draw nearer when it is touched", pill.size >= 16, `${pill.size}px`);
  await small.fill("#header-search", "pharm");
  await small.waitForSelector("header .suggest", { timeout: 8000 }).catch(() => {});
  const list = await small.evaluate(() => {
    const box = document.querySelector("header .suggest")?.getBoundingClientRect();
    const pill = document.querySelector("header .nav-pill").getBoundingClientRect();
    return box ? { wide: Math.round(box.width), pill: Math.round(pill.width), under: box.top >= pill.bottom, n: document.querySelectorAll("header .suggest [role=option]").length } : null;
  });
  check("phone: what the header's box offers opens under the whole pill, not under the narrow box", Boolean(list) && list.n > 0 && list.under && list.wide >= list.pill - 12, JSON.stringify(list));
  await small.fill("#header-search", "");
  await small.locator("main h1").tap();
}
check("phone: the Home button leads to Home, where the bar is, and says that is where you are", (await small.locator('nav.tabbar a[aria-current="page"]').innerText()).trim() === "Home" && (await small.locator("footer.site-footer").isVisible()));
check("phone: on Home the police's number is one tap away", (await small.locator('main a[href="tel:999"]').count()) === 1);
const strip = await small.locator("main ul.top-list").evaluate((list) => ({ sideways: list.scrollWidth > list.clientWidth + 100, first: Math.round(list.querySelector("li").getBoundingClientRect().width), page: document.documentElement.scrollWidth - innerWidth }));
check("phone: the top businesses go by sideways, one card and the edge of the next in view, and the page stays as wide as the screen", strip.sideways && strip.first < 360 && strip.first > 250 && strip.page <= 0, JSON.stringify(strip));
const tiles = await small.locator("main a.tile, main a.start-tile, main ul.dial a, main nav[aria-label='On this page'] a").evaluateAll((links) => links.map((a) => Math.round(a.getBoundingClientRect().height)));
check("phone: every tile, number and jump on Home is at least 44 pixels tall", tiles.length >= 60 && tiles.every((height) => height >= 44), `${tiles.length} targets, the smallest ${Math.min(...tiles)}`);
check("phone: nothing in the header opens, and the bar is the one way round", (await small.locator("header details:visible, header summary:visible, header nav:visible").count()) === 0);
await small.goto(`${origin}/directory`, { waitUntil: "domcontentloaded" });
check("phone: the directory is reached through Home and through More, and More is lit on it", (await small.locator("nav.tabbar a[aria-current]").innerText()).trim() === "More" && (await small.locator('main nav[aria-label="You are here"] a[href="/home"]').count()) === 1);
await small.locator('nav.tabbar a[href="/more"]').click();
await small.waitForURL(/\/more$/);
check("phone: More is a page of every page, and the bar says that is where you are", (await small.locator('main nav[aria-label="Every page"] a:visible').count()) >= 20 && (await small.locator('nav.tabbar a[aria-current="page"]').innerText()).trim() === "More");
await small.goto(`${origin}/emergency`, { waitUntil: "domcontentloaded" });
check("phone: on a page reached from More, More is lit", (await small.locator("nav.tabbar a[aria-current]").innerText()).trim() === "More" && (await small.locator("nav.tabbar a[aria-current]").getAttribute("aria-current")) === "true");
const targets = await small.locator("nav.tabbar a, header .nav-pill > a").evaluateAll((links) => links.filter((a) => a.getBoundingClientRect().width > 0).map((a) => Math.round(Math.min(a.getBoundingClientRect().width, a.getBoundingClientRect().height))));
check("phone: every control of the header and the bar is at least 44 pixels each way", targets.length >= 8 && targets.every((size) => size >= 44), targets.join(","));
await small.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "domcontentloaded" });
const island = await small.locator("main .chart-fit").first().boundingBox();
check("phone: results have the island as a small strip, drawn once", island != null && island.width < 170 && (await small.locator("main svg.chart, main .chart-fit").count()) <= 2 && (await small.locator("main .chart-fit").count()) === 1, JSON.stringify(island));
await small.goto(`${origin}/learn/vat`, { waitUntil: "domcontentloaded" });
check("phone: a guide's contents open as a list", (await small.locator("main details summary").first().isVisible()) && (await small.locator("table.table thead").first().evaluate((el) => el.getBoundingClientRect().width <= 2)));
await small.goto(`${origin}/directory`, { waitUntil: "networkidle" });
const pill = await small.evaluate(() => {
  const bar = document.querySelector("header .nav-pill");
  const logo = bar.querySelector(".logo").getBoundingClientRect();
  const shown = [...bar.querySelectorAll(':scope > a, :scope > details > summary')].filter((el) => el.getBoundingClientRect().width > 0).map((el) => el.getBoundingClientRect());
  const next = shown.filter((box) => box.left > logo.left + 1).sort((a, b) => a.left - b.left)[0];
  return { fits: bar.scrollWidth <= bar.clientWidth, oneLine: bar.getBoundingClientRect().height <= 64, logoWhole: logo.width >= 44 && logo.right <= next.left && Boolean(bar.querySelector("#header-search")?.getBoundingClientRect().width), cart: Boolean(bar.querySelector('a[href="/cart"]')?.getBoundingClientRect().width), account: Boolean(bar.querySelector('a[href^="/account"]')?.getBoundingClientRect().width), opens: [...bar.querySelectorAll("details, summary")].filter((el) => el.getBoundingClientRect().width > 0).length };
});
check("phone: the header holds the name's first letter, the search box, the cart and the account on one line, and nothing that opens", pill.fits && pill.oneLine && pill.logoWhole && pill.cart && pill.account && pill.opens === 0, JSON.stringify(pill));
check("phone: the footer's b is whole there too, clear of the sheet and of the tab bar", await whole(small));
await small.goto(`${origin}/b/n14064293374`, { waitUntil: "networkidle" });
const act = await small.locator("main header.biz-head a.btn-filled").boundingBox();
check("phone: on a business's page the way to call is on the first screen, as wide as its card", act != null && act.y + act.height < 844 - 80 && act.width > 250, JSON.stringify(act));
await small.locator('main section[aria-labelledby="where"] button', { hasText: "Open the street map" }).click();
await small.waitForFunction(() => document.querySelector('main section[aria-labelledby="where"] :is(.street-credit, .street-failed)'), null, { timeout: 20000 }).catch(() => {});
check("phone: the street map opens beside the address", (await small.locator('main section[aria-labelledby="where"] :is(.street-credit, .street-failed)').count()) === 1);
await phone.close();
// Without script the places page is still the whole list, and its box is a plain search.
const bare = await steady(await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }));
const quiet = await bare.newPage();
await quiet.goto(`${origin}/places`, { waitUntil: "domcontentloaded" });
check("no script: the towns are a plain list, and the box asks the search", (await quiet.locator("main li.town").count()) > 100 && (await quiet.locator('main form.town-finder[action="/search"] input[name="q"]').count()) === 1);
await quiet.goto(`${origin}/learn/vat`, { waitUntil: "domcontentloaded" });
check("no script: an article's rail is plain links, with none marked", (await quiet.locator("#rail a").count()) > 5 && (await quiet.locator("#rail a[aria-current]").count()) === 0);
await quiet.goto(`${origin}/search?q=pharmacy+in+curepipe`, { waitUntil: "domcontentloaded" });
check("no script: there is no button for a street map that could not open", (await quiet.locator("button", { hasText: "Open the street map" }).count()) === 0);
await bare.close();

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
  const guarded = await steady(await browser.newContext({ viewport: { width: 1440, height: 900 } }));
  await guarded.addInitScript(() => {
    window.__refused = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__refused.push(`${e.effectiveDirective} ${e.blockedURI}`));
  });
  const watched = await guarded.newPage();
  const refused = [];
  watched.on("console", (m) => /Content Security Policy|Refused to/i.test(m.text()) && refused.push(m.text().slice(0, 160)));
  const listingPath = "/b/keiffel-tours-grand-baie-n5651200767";
  for (const path of ["/", "/home", "/search?q=pharmacy+in+curepipe", listingPath, "/learn/vat", "/saved", "/shop", "/emergency", "/offline"]) {
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
