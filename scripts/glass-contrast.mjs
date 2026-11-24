// Measures the words on frosted glass against the glass as it is drawn, with each picture behind
// it: `node scripts/glass-contrast.mjs [origin]` (npm run glass).
//
// Four things are frosted glass (DESIGN.md, "Frosted glass"): the menu's pill, the phone's bar,
// the search bar and the landing page's foot line. The glass is white at 54% over whatever is
// behind it, and every word on it is ink, which would pass were the picture black
// (scripts/contrast.pairs.json holds that pair). This reads what is drawn: for every picture in
// public/themes, at a desk and on a phone, it empties each pane, reads the darkest point of its
// ground, and holds ink against it. The pill, the search bar and the foot line are read on the
// landing page, where the picture is sharp behind them; the phone's bar on a page of its own.
// It fails if any is under 4.5:1.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { browserPath, steady } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const root = fileURLToPath(new URL("..", import.meta.url));
const PICTURES = readdirSync(`${root}public/themes`).filter((name) => /^[a-z]+\.jpg$/.test(name)).map((name) => name.slice(0, -4)).sort();
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const hex = (value) => [1, 3, 5].map((i) => parseInt(value.trim().slice(i, i + 2), 16));

// A pane, the page it is read on, what is emptied out of it, and the faintest words that stand on it.
const PANES = [
  { name: "menu's pill", path: "/", box: ".nav-pill", empty: ".nav-pill > *", words: "--palette-ink", inset: 4, round: true },
  { name: "search bar", path: "/", box: "main .search", empty: "main .search > *", words: "--palette-ink", inset: 4, round: true },
  { name: "foot line", path: "/", box: "main .landing-foot", empty: "main .landing-foot > *", words: "--palette-ink", inset: 14 },
  { name: "phone's bar", path: "/more", box: ".tabbar", empty: ".tabbar > *", words: "--palette-ink", inset: 14, phone: true },
];

const browser = await chromium.launch({ executablePath: browserPath() });
let worst = Infinity;
let failed = 0;
for (const [size, width, height] of [["desk", 1440, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await steady(page.context());
  for (const pane of PANES) {
    if (pane.phone && size !== "phone") continue;
    let lowest = Infinity;
    let where = "";
    for (const picture of PICTURES) {
      await page.goto(`${origin}${pane.path}`, { waitUntil: "networkidle" });
      const files = [`/themes/${picture}.jpg`, `/themes/${picture}-sm.jpg`];
      await page.evaluate(([large, small]) => {
        const style = document.documentElement.style;
        style.setProperty("--theme-image", `url(${large})`);
        style.setProperty("--theme-image-sm", `url(${small})`);
      }, files);
      await page.evaluate((list) => Promise.all(list.map((src) => new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src })))), files);
      const words = hex(await page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name), pane.words));
      await page.addStyleTag({ content: `${pane.empty} { visibility: hidden !important; } *, *::before, *::after { transition: none !important; animation: none !important; }` });
      await page.waitForTimeout(350);
      const box = await page.locator(pane.box).first().boundingBox();
      // A pill's ends are round: the picture itself shows in its corners, so those are left out of the reading.
      const side = pane.round ? Math.ceil(box.height / 2) : pane.inset;
      const clip = { x: Math.max(0, box.x) + side, y: Math.max(0, box.y) + pane.inset, width: Math.min(width, box.x + box.width) - Math.max(0, box.x) - 2 * side, height: Math.min(height, box.y + box.height) - Math.max(0, box.y) - 2 * pane.inset };
      const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
      let dark = [255, 255, 255];
      for (let i = 0; i < data.length; i += info.channels) {
        const point = [data[i], data[i + 1], data[i + 2]];
        if (lum(point) < lum(dark)) dark = point;
      }
      const found = ratio(words, dark);
      if (found < lowest) (lowest = found), (where = `${picture}, ground rgb(${dark.join(", ")})`);
    }
    const ok = Math.floor(lowest * 100) / 100 >= 4.5;
    if (!ok) failed++;
    worst = Math.min(worst, lowest);
    console.log(`${ok ? "pass" : "FAIL"}  ${size.padEnd(5)} ${pane.name.padEnd(12)} lowest ${(Math.floor(lowest * 100) / 100).toFixed(2)}:1 (needs 4.5) on ${where}`);
  }
  await page.close();
}
await browser.close();
console.log(`lowest of all: ${(Math.floor(worst * 100) / 100).toFixed(2)}:1, over ${PICTURES.length} pictures`);
process.exit(failed ? 1 : 0);
