// Measures the words of the landing page against each picture behind them: `node scripts/hero-contrast.mjs [origin]`.
//
// A picture is not one colour, so the contrast script cannot vouch for words set on it. This takes
// each picture in public/themes in turn and reads the pixels behind three things, at a desk and on
// a phone: the headline, which stands on the picture itself; and the greeting above it and the
// line at the page's foot, which each stand on a ground of their own that the picture shows
// through. It reports the lowest WCAG ratio found for each. A picture named in src/data/themes.ts
// whose file has not arrived is said to be missing.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { browserPath, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const root = fileURLToPath(new URL("..", import.meta.url));
const PICTURES = readdirSync(`${root}public/themes`).filter((name) => /^[a-z]+\.jpg$/.test(name)).map((name) => name.slice(0, -4)).sort();
const named = [...readFileSync(`${root}src/data/themes.ts`, "utf8").matchAll(/src: "\/themes\/([a-z]+)\.jpg"/g)].map((m) => m[1]);
for (const id of named) if (!existsSync(`${root}public/themes/${id}.jpg`)) console.log(`miss  ${id}: named in src/data/themes.ts, and its file is not in public/themes yet, so it was not measured`);
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const rgb = (css) => css.match(/\d+/g).slice(0, 3).map(Number);

const browser = await chromium.launch({ executablePath: browserPath() });
let worst = Infinity;
// What stands on the picture, and what it must reach. The headline is large, so 3:1; the rest is
// small, so 4.5:1. `parts` are the words inside a thing that has a ground of its own: they are
// made clear, and the ground is read where each of them stood.
const WORDS = [
  { name: "headline", selector: "main h1", floor: 3 },
  { name: "greeting", selector: "main .pill-note", floor: 4.5, parts: "span" },
  { name: "foot", selector: "main .landing-foot", floor: 4.5, parts: "p, nav a" },
];
for (const [size, width, height] of [["desk", 1440, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await steady(page.context());
  for (const picture of PICTURES) {
    // The page is asked for afresh for each picture, so nothing made clear for the last one stays clear.
    await page.goto(origin, { waitUntil: "networkidle" });
    await page.evaluate((p) => {
      const root = document.documentElement;
      root.style.setProperty("--theme-image", `url(/themes/${p}.jpg)`);
      root.style.setProperty("--theme-image-sm", `url(/themes/${p}-sm.jpg)`);
    }, picture);
    await page.evaluate((p) => Promise.all([`/themes/${p}.jpg`, `/themes/${p}-sm.jpg`].map((src) => new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src })))), picture);
    await page.waitForTimeout(500);
    for (const { name, selector, floor, parts } of WORDS) {
      const el = page.locator(selector).first();
      // Each run of words, with its own colour and where it stands.
      // A part that is not shown at this width (the towns in the greeting, on a phone) has no place to read.
      const runs = (await el.evaluate((node, inside) => (inside ? [...node.querySelectorAll(inside)] : [node]).map((part) => ({ colour: getComputedStyle(part).color, box: part.getBoundingClientRect().toJSON() })), parts)).filter(({ box }) => box.width >= 1 && box.height >= 1);
      await el.evaluate((node, inside) => {
        if (!inside) return void (node.style.visibility = "hidden");
        // At once: a link's colour otherwise fades out over a moment, and would be read half gone.
        for (const part of node.querySelectorAll("*")) part.style.cssText += ";transition:none!important;color:transparent!important;text-decoration-color:transparent!important;-webkit-text-fill-color:transparent!important";
      }, parts);
      await page.waitForTimeout(250);
      let low = Infinity;
      for (const { colour, box } of runs) {
        const shot = await page.screenshot({ clip: { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) } });
        const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < data.length; i += info.channels) low = Math.min(low, ratio(rgb(colour), [data[i], data[i + 1], data[i + 2]]));
      }
      worst = Math.min(worst, low);
      console.log(`${low >= floor ? "pass" : "FAIL"}  ${size.padEnd(5)} ${picture.padEnd(10)} ${name.padEnd(8)} lowest ${(Math.floor(low * 100) / 100).toFixed(2)}:1 (needs ${floor})`);
      if (low < floor) process.exitCode = 1;
    }
  }
  await page.close();
}
await browser.close();
console.log(`lowest of all: ${(Math.floor(worst * 100) / 100).toFixed(2)}:1`);
