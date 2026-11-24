// Measures the faintest words against the glass they stand on, with each picture behind it:
// `node scripts/glass-contrast.mjs [origin]` (npm run glass).
//
// The sheet, the first screen's search bar and the menu's pill are smoked glass (DESIGN.md,
// "Glass"): the day's picture shows through them, dimmed. The first screen's foot line stands on
// a fade to dusk. Their values are set so
// that the light words on them would pass were the picture white (scripts/contrast.pairs.json
// holds those pairs). This reads what is drawn: for every picture in public/themes, at a desk and
// on a phone, it empties each pane, reads the lightest point of its ground, and holds the
// faintest words that stand there against it. The sheet and the pill are read on a page of their
// own, the search bar and the foot line on the first screen, where the picture is sharp behind them. It fails if any is under 4.5:1.
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
  { name: "sheet", path: "/more", box: "main", empty: "main > *, .site-header, .site-footer, .tabbar", words: "--palette-ash", inset: 40 },
  { name: "search bar", path: "/", box: "main .search", empty: "main .search > *", words: "--palette-cream", inset: 4, round: true },
  { name: "foot line", path: "/", box: "main .landing-foot", empty: "main .landing-foot > *", words: "--palette-pearl", under: true },
  { name: "menu's pill", path: "/more", box: ".nav-pill", empty: ".nav-pill > *, main > *", words: "--palette-pearl", inset: 4, round: true },
];

const browser = await chromium.launch({ executablePath: browserPath() });
let worst = Infinity;
let failed = 0;
for (const [size, width, height] of [["desk", 1440, 900], ["phone", 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await steady(page.context());
  for (const pane of PANES) {
    let lowest = Infinity;
    let where = "";
    for (const picture of PICTURES) {
      await page.goto(`${origin}${pane.path}`, { waitUntil: "networkidle" });
      const files = [`/themes/${picture}.jpg`, `/themes/${picture}-sm.jpg`, `/themes/${picture}-frost.jpg`, `/themes/${picture}-sm-frost.jpg`];
      await page.evaluate(([large, small, soft, softSmall]) => {
        const style = document.documentElement.style;
        style.setProperty("--theme-image", `url(${large})`);
        style.setProperty("--theme-image-sm", `url(${small})`);
        style.setProperty("--theme-frost", `url(${soft})`);
        style.setProperty("--theme-frost-sm", `url(${softSmall})`);
        document.documentElement.dataset.frost = "made";
      }, files);
      await page.evaluate((list) => Promise.all(list.map((src) => new Promise((done) => Object.assign(new Image(), { onload: done, onerror: done, src })))), files);
      const words = hex(await page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name), pane.words));
      await page.addStyleTag({ content: `${pane.empty} { visibility: hidden !important; } *, *::before, *::after { transition: none !important; animation: none !important; }` });
      await page.waitForTimeout(350);
      const box = await page.locator(pane.box).first().boundingBox();
      // A pill's ends are round: the picture itself shows in its corners, so those are left out of the reading.
      // The foot line's ground fades in over its upper edge: its words stand under that, and that is what is read.
      if (pane.under) {
        const fade = await page.locator(pane.box).first().evaluate((node) => parseFloat(getComputedStyle(node).paddingTop));
        box.y += fade;
        box.height -= fade;
        pane.inset = 0;
      }
      const side = pane.round ? Math.ceil(box.height / 2) : pane.inset;
      const clip = { x: Math.max(0, box.x) + side, y: Math.max(0, box.y) + pane.inset, width: Math.min(width, box.x + box.width) - Math.max(0, box.x) - 2 * side, height: Math.min(height, box.y + box.height) - Math.max(0, box.y) - 2 * pane.inset };
      const { data, info } = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
      let light = [0, 0, 0];
      for (let i = 0; i < data.length; i += info.channels) {
        const point = [data[i], data[i + 1], data[i + 2]];
        if (lum(point) > lum(light)) light = point;
      }
      const found = ratio(words, light);
      if (found < lowest) (lowest = found), (where = `${picture}, ground rgb(${light.join(", ")})`);
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
