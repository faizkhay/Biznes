// Measures the words of the first screen against each picture behind them: `node scripts/hero-contrast.mjs [origin]`.
//
// A picture is not one colour, so the contrast script cannot vouch for words set on it. This takes
// each picture in turn, hides the words, reads the pixels where the headline and the line under it
// stand, and reports the lowest WCAG ratio found for each, at a desk and on a phone.
import { chromium } from "playwright";
import sharp from "sharp";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const PICTURES = ["lagoon", "flamboyant", "cane", "lights"];
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
for (const [size, width, height] of [["desk", 1440, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(origin, { waitUntil: "networkidle" });
  for (const picture of PICTURES) {
    await page.evaluate((p) => {
      const root = document.documentElement;
      root.style.setProperty("--theme-image", `url(/themes/${p}.jpg)`);
      root.style.setProperty("--theme-image-sm", `url(/themes/${p}-sm.jpg)`);
    }, picture);
    await page.evaluate((p) => Promise.all([`/themes/${p}.jpg`, `/themes/${p}-sm.jpg`].map((src) => new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src })))), picture);
    await page.waitForTimeout(500);
    for (const [name, selector] of [["headline", "main h1"], ["line", "main h1 + p"]]) {
      const el = page.locator(selector).first();
      const colour = rgb(await el.evaluate((node) => getComputedStyle(node).color));
      const box = await el.boundingBox();
      await el.evaluate((node) => (node.style.visibility = "hidden"));
      const shot = await page.screenshot({ clip: { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) } });
      await el.evaluate((node) => (node.style.visibility = ""));
      const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let low = Infinity;
      for (let i = 0; i < data.length; i += info.channels) low = Math.min(low, ratio(colour, [data[i], data[i + 1], data[i + 2]]));
      worst = Math.min(worst, low);
      const floor = name === "headline" ? 3 : 4.5;
      console.log(`${low >= floor ? "pass" : "FAIL"}  ${size.padEnd(5)} ${picture.padEnd(10)} ${name.padEnd(8)} lowest ${(Math.floor(low * 100) / 100).toFixed(2)}:1 (needs ${floor})`);
      if (low < floor) process.exitCode = 1;
    }
  }
  await page.close();
}
await browser.close();
console.log(`lowest of all: ${(Math.floor(worst * 100) / 100).toFixed(2)}:1`);
