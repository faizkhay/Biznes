// What a sweep does not see: the phone menu as a dialog, the request form end to end, the endpoint,
// the page without script, and the files a machine reads. Saves the states it meets (the open menu,
// the filled form, the form's refusal, the page without script) to review/screens/states.
//
//   npm run build && npx next start -p 3100 &
//   node scripts/behaviour.mjs [origin]          (default http://localhost:3100)
//
// Run it against a production server with no delivery route set: it expects the form to refuse.
// The endpoint allows five requests per connection per ten minutes, so a second run inside that
// window sees 429 on the endpoint checks; restart the server between runs.
//
// Needs: playwright (devDependency). Exits 1 if any check fails.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { browserPath } from "./pages.mjs";

const O = process.argv[2] ?? "http://localhost:3100";
const OUT = "review/screens/states";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: browserPath() });
let failed = 0;
const ok = (name, pass, extra = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
};

// 1. Phone menu
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(O + "/?still", { waitUntil: "networkidle" });
  await p.keyboard.press("Tab");
  ok("skip link is first in the tab order", await p.evaluate(() => document.activeElement?.classList.contains("skip-link")));
  const btn = p.locator('button[aria-controls="menu-sheet"]');
  await btn.click();
  await p.waitForSelector("#menu-sheet");
  ok("menu opens as a dialog", (await p.locator("#menu-sheet").getAttribute("role")) === "dialog");
  ok("page behind is inert", await p.evaluate(() => document.getElementById("main").hasAttribute("inert") && document.getElementById("site-footer").hasAttribute("inert")));
  ok("focus moves into the menu", await p.evaluate(() => document.getElementById("menu-sheet").contains(document.activeElement)));
  await p.waitForTimeout(900); // the links arrive in sequence; capture the menu at rest
  ok("the menu names the form's route once, as Enquire", (await p.locator("#menu-sheet a", { hasText: "Enquire" }).count()) === 1);
  await p.screenshot({ path: OUT + "/menu-open.png" });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  ok("Escape closes it", (await p.locator("#menu-sheet").count()) === 0);
  ok("focus returns to the button", await p.evaluate(() => document.activeElement?.getAttribute("aria-controls") === "menu-sheet"));
  ok("page behind is live again", await p.evaluate(() => !document.getElementById("main").hasAttribute("inert")));
  await p.close();
}

// 2. The form
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(O + "/enquire?business=lepalatier", { waitUntil: "networkidle" });
  ok("a business link arrives chosen", (await p.locator("#topic").inputValue()) === "lepalatier");
  const options = await p.locator("#topic option").allTextContents();
  ok("the form offers no sample business", !options.some((o) => /Lakrem|Souffle|Bouk|Larout|Kazprop/.test(o)), options.join(" | "));
  await p.getByRole("button", { name: "Send a request" }).click();
  ok("name error is said on its field", (await p.locator("#name-error").textContent())?.includes("Tell us your name"));
  ok("first wrong field takes focus", await p.evaluate(() => document.activeElement?.id === "name"));
  await p.fill("#name", "Test Visitor");
  await p.fill("#phone", "abc");
  await p.getByRole("button", { name: "Send a request" }).click();
  ok("a bad phone number is named", (await p.locator("#phone-error").textContent())?.includes("doesn't look right"));
  await p.fill("#phone", "+230 5555 0000");
  await p.screenshot({ path: OUT + "/form-filled.png" });
  await p.getByRole("button", { name: "Send a request" }).click();
  await p.waitForSelector('form [role="alert"]', { timeout: 10000 });
  const alert = await p.locator('form [role="alert"]').textContent();
  ok("with no delivery route, the form says so and gives the other routes", alert.includes("couldn") && alert.includes("+230 5450 8600") && alert.includes("faiz@khay.digital"));
  ok("the failure notice takes focus", await p.evaluate(() => document.activeElement?.getAttribute("role") === "alert" && !!document.activeElement.closest("form")));
  await p.screenshot({ path: OUT + "/form-failed.png" });
  await p.close();
}

// 3. The API
{
  const post = (body) => fetch(O + "/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => [r.status, await r.json()]);
  const [s1, j1] = await post({ topic: "lepalatier", name: "", phone: "" });
  ok("API refuses what the form refuses (422)", s1 === 422 && j1.errors?.name === "required");
  const [s2, j2] = await post({ topic: "lepalatier", name: "Bot", phone: "+230 5555 0000", website: "http://spam" });
  ok("a filled honeypot gets a quiet success", s2 === 200 && j2.ok === true);
  const [s3, j3] = await post({ topic: "lepalatier", name: "Test", phone: "+230 5555 0000", reply: "whatsapp" });
  ok("no route in production answers 503", s3 === 503 && j3.error === "unconfigured");
  const [s4] = await post({ topic: "lakrem", name: "Test", phone: "+230 5555 0000" });
  ok("a sample business is refused by the endpoint too", s4 === 422);
  // The form's own submission above was the first request from this connection; this is the sixth.
  const [s5] = await post({ topic: "lepalatier", name: "Test", phone: "+230 5555 0000" });
  ok("the sixth request inside ten minutes is limited (429)", s5 === 429);
}

// 4. Without script
{
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(O + "/", { waitUntil: "load" });
  const hidden = await p.evaluate(() => [...document.querySelectorAll("[data-reveal], h1, h2, .tagline-reveal [data-word]")].filter((el) => getComputedStyle(el).opacity !== "1").length);
  ok("without script every reveal and heading is visible", hidden === 0);
  ok("without script the six tags are links", (await p.locator('ul[aria-label="Businesses for sale"] a').count()) === 6);
  await p.goto(O + "/enquire", { waitUntil: "load" });
  const note = await p.locator("form noscript").count();
  ok("without script the form says how else to reach us", note === 1 && (await p.content()).includes("This form needs JavaScript"));
  await p.screenshot({ path: OUT + "/noscript.png" });
  await ctx.close();
}

// 5. Machine-facing files
{
  const robots = await (await fetch(O + "/robots.txt")).text();
  ok("robots.txt closes the site before launch", /Disallow: \//.test(robots));
  const llms = await (await fetch(O + "/llms.txt")).text();
  ok("llms.txt lists LePalatier and no sample", llms.includes("LePalatier") && !llms.includes("Lakrem"));
  const sm = await (await fetch(O + "/sitemap.xml")).text();
  ok("sitemap has LePalatier and no sample", sm.includes("/businesses/lepalatier") && !sm.includes("lakrem"));
  const home = await (await fetch(O + "/")).text();
  ok("pages ask not to be indexed before launch", /<meta name="robots" content="noindex, nofollow"/.test(home));
  const r404 = await fetch(O + "/no-such-page");
  ok("an unknown address answers 404", r404.status === 404);
}
await b.close();
process.exit(failed ? 1 : 0);
