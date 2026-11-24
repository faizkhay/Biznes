// Accessibility check: axe-core against every page in scripts/pages.mjs, desktop and phone.
//
//   npm run build && npx next start -p 3100 &
//   node scripts/a11y.mjs [origin]        (default http://localhost:3100; ONLY=home,contact to narrow)
//
// Exits 1 on any serious or critical violation of WCAG 2.2 A/AA.
//
// Two things are deliberate, and both were learned the hard way (Details):
//   The phone viewport is not optional. A desktop-only sweep passed clean for weeks while a closed
//   mobile drawer held ten focusable links inside an aria-hidden subtree that only renders on phones.
//   `wcag22aa` is not optional either. It carries 2.5.8 target-size, which caught a hero control.
// Run it against a production server: the dev overlay and unminified React change what axe sees.
//
// KOS kit. From DHE and Details (scripts/a11y.mjs). Needs: npm i -D playwright @axe-core/playwright
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { PAGES, VIEWPORTS, browserPath, GL_ARGS, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const only = process.env.ONLY?.split(",");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const browser = await chromium.launch({ executablePath: browserPath(), args: GL_ARGS });
let serious = 0;
for (const [vp, size] of VIEWPORTS) {
  const context = await steady(await browser.newContext({ viewport: size, reducedMotion: "reduce" }));
  const page = await context.newPage();
  for (const [name, path] of PAGES) {
    if (only && !only.includes(name)) continue;
    await page.goto(origin + path + (path.includes("?") ? "&" : "?") + "still", { waitUntil: "networkidle", timeout: 120000 });
    // Check the content as a reader finally sees it, not mid-reveal.
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-reveal", "in")));
    await page.waitForTimeout(1500);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    serious += bad.length;
    console.log(
      `${vp.padEnd(8)} ${name.padEnd(13)} ${violations.length ? violations.map((v) => `${v.id}(${v.impact}, ${v.nodes.length})`).join(" ") : "clean"}`,
    );
    for (const v of bad)
      for (const n of v.nodes.slice(0, 3))
        console.log(`    ${v.id}: ${n.target.join(" ")}  ${n.failureSummary?.split("\n")[1]?.trim() ?? ""}`);
  }
  await context.close();
}
// The landing page once more, with motion allowed. What falls over it and the control that holds
// it still are not on the page under reduced motion, so the sweep above never meets them. Here it
// is read twice at each size: with the pieces falling, and held.
for (const [vp, size] of VIEWPORTS) {
  if (only && !only.includes("landing")) continue;
  const context = await steady(await browser.newContext({ viewport: size }));
  const page = await context.newPage();
  await page.goto(origin, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector(".landing[data-leaves]", { timeout: 10000 });
  for (const state of ["falling", "held"]) {
    if (state === "held") await page.locator(".leaves-toggle").click();
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    serious += bad.length;
    console.log(`${vp.padEnd(8)} ${`leaves ${state}`.padEnd(13)} ${violations.length ? violations.map((v) => `${v.id}(${v.impact}, ${v.nodes.length})`).join(" ") : "clean"}`);
    for (const v of bad) for (const n of v.nodes.slice(0, 3)) console.log(`    ${v.id}: ${n.target.join(" ")}  ${n.failureSummary?.split("\n")[1]?.trim() ?? ""}`);
  }
  await context.close();
}
await browser.close();
process.exit(serious ? 1 : 0);
