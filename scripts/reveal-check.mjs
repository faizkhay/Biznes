/**
 * Every reveal fires, with animation on.
 *
 *   npm run build && npx next start -p 3100 &
 *   node scripts/reveal-check.mjs [origin]        (ONLY=home,contact narrows the pages)
 *
 * The screenshots and the accessibility sweep run with reduced motion, so they see every reveal
 * already in. That is how Windrush shipped headlines no visitor could see: the masked reveal used a
 * clip-path value the browser rejects, and Chrome reports a fully clipped element as intersecting
 * nothing, so its observer never fired. This check loads each page with motion welcome, scrolls it
 * end to end like a reader, and then fails if any [data-reveal] never reached "in", or any heading is
 * still transparent or clipped.
 *
 * A story whose captions are shown one at a time by design marks its caption track
 * `data-reveal-ignore`, so its resting captions are not reported as hidden headings.
 *
 * `?still` keeps smooth scrolling out of the way (the kit's SmoothScroll still marks the page able to
 * animate). Exits 1 on any finding.
 *
 * KOS kit. Needs: npm i -D playwright
 */
import { chromium } from "playwright";
import { PAGES, VIEWPORTS, browserPath, GL_ARGS } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const only = process.env.ONLY?.split(",");

const browser = await chromium.launch({ executablePath: browserPath(), args: GL_ARGS });
let findings = 0;
for (const [vname, vp] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: vp, reducedMotion: "no-preference" });
  const page = await context.newPage();
  for (const [name, path] of PAGES) {
    if (only && !only.includes(name)) continue;
    await page.goto(origin + path + (path.includes("?") ? "&" : "?") + "still", { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(800);
    // Read down the page the way a visitor would, then give the last transitions time to finish.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += Math.round(vp.height * 0.5)) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      // The home page draws its street on a CPU renderer here, so a frame is slow and an observer
      // can miss a section that passes in a quarter of a second. Give that page longer per step.
      await page.waitForTimeout(name === "home" ? 700 : 250);
    }
    await page.waitForTimeout(1800);
    const problems = await page.evaluate(() => {
      const out = [];
      const label = (el) => (el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 60);
      for (const el of document.querySelectorAll("[data-reveal]")) {
        if (el.getAttribute("data-reveal") !== "in") out.push(`reveal never fired: <${el.tagName.toLowerCase()}> "${label(el)}"`);
      }
      for (const h of document.querySelectorAll("h1, h2, h3")) {
        const r = h.getBoundingClientRect();
        if (!r.width || !r.height) continue; // not laid out on this viewport
        if (h.closest("[data-reveal-ignore]")) continue; // a story's captions, shown one at a time by design
        for (let el = h; el && el !== document.body; el = el.parentElement) {
          const cs = getComputedStyle(el);
          if (parseFloat(cs.opacity) < 0.99) {
            out.push(`heading transparent (opacity ${cs.opacity} on <${el.tagName.toLowerCase()}>): "${label(h)}"`);
            break;
          }
          // A reveal mask hides with inset(... 100% ...); a slanted polygon() frame is design, not a bug.
          if (/^inset\(.*100%/.test(cs.clipPath)) {
            out.push(`heading clipped (${cs.clipPath} on <${el.tagName.toLowerCase()}>): "${label(h)}"`);
            break;
          }
        }
      }
      return out;
    });
    findings += problems.length;
    console.log(`${vname.padEnd(8)} ${name.padEnd(13)} ${problems.length ? problems.length + " finding(s)" : "clean"}`);
    for (const p of problems.slice(0, 8)) console.log(`    ${p}`);
  }
  await context.close();
}
await browser.close();
process.exit(findings ? 1 : 0);
