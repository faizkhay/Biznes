#!/usr/bin/env node
// The icon sheet: every one of the site's own icons (src/components/Glyphs.tsx) with its name, at
// 20px, 24px and 48px, on paper, on a white card and on an ink tile. It is the way to look at the
// set whole: draw, run this, read the picture back, fix what does not read.
//
//   node scripts/icon-sheet.mjs                      (npm run icons:sheet)
//       writes review/icons/sheet-1.jpg (the directory) and sheet-2.jpg (districts, food, pages)
//   node scripts/icon-sheet.mjs --big [dir]          each icon once, large, to check a drawing
//   node scripts/icon-sheet.mjs --slices [dir]       the sheet itself, as PNG slices at true size
//   node scripts/icon-sheet.mjs --small [dir]        each icon at 16px and 20px only, close together,
//                                                    to enlarge afterwards and judge the smallest sizes
//   ONLY=food,pages narrows any of them to some sections: groups, kinds, districts, food, pages
//   NAMES=hardware,/account narrows it to the icons whose names hold one of these
//
// On paper the icon is ink with its point solid; on the white card it is ink with its point lit
// (saffron inside a ring of ink); on the ink tile it is saffron, as a tile's icon is on the site.
//
// How it works: the icons are TypeScript, so the script turns the few files they live in into
// plain JavaScript with the compiler the project already has, keeps the result under
// node_modules/.cache, renders each icon to SVG with React's own server renderer, and takes the
// picture with Playwright. The colours are read from src/app/globals.css, never typed here. The
// kept sheet is two JPEGs, encoded by sharp to stay under 600 kB between them.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
import { browserPath } from "./pages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const mode = args.includes("--big") ? "big" : args.includes("--small") ? "small" : args.includes("--slices") ? "slices" : "sheet";
const dir = args.find((a) => !a.startsWith("--")) ?? join(root, "review/icons");
const only = process.env.ONLY?.split(",");
const names = process.env.NAMES?.split(",");

// 1. The icons, as JavaScript.
const ts = require("typescript");
const cache = join(root, "node_modules/.cache/icon-sheet");
rmSync(cache, { recursive: true, force: true });
const sources = ["src/components/Glyphs.tsx", "src/data/district-shapes.ts", ...readdirSync(join(root, "src/components/glyphs")).map((f) => `src/components/glyphs/${f}`)];
for (const file of sources) {
  const { outputText } = ts.transpileModule(readFileSync(join(root, file), "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const out = join(cache, relative("src", file)).replace(/\.tsx?$/, ".js");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, outputText);
}
writeFileSync(join(cache, "package.json"), '{ "type": "commonjs" }\n');
const { createElement: h } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { CategoryIcon, GroupGlyph, DistrictIcon, FoodIcon, PageIcon } = require(join(cache, "components/Glyphs.js"));
const { FOODS } = require(join(cache, "components/glyphs/food.js"));
const { PAGES } = require(join(cache, "components/glyphs/pages.js"));

// 2. What there is to draw, from the index and from the drawings themselves.
const { groups, categories } = JSON.parse(readFileSync(join(root, "data/index/categories.json"), "utf8"));
const districts = JSON.parse(readFileSync(join(root, "data/index/districts.json"), "utf8"));
/** The names that share one drawing, together: "regional, local, mauritian". */
function byDrawing(set) {
  const seen = new Map();
  for (const [name, drawing] of Object.entries(set)) seen.set(drawing, [...(seen.get(drawing) ?? []), name]);
  return [...seen.values()];
}
const sections = [
  { id: "groups", title: "The thirteen groups", items: groups.map((g) => ({ name: g.id, icon: (p) => h(GroupGlyph, { id: g.id, ...p }) })) },
  ...groups.map((g) => ({
    id: "kinds",
    title: `Kinds of business: ${g.label}`,
    items: categories.filter((c) => c.group === g.id).map((c) => ({ name: c.id, icon: (p) => h(CategoryIcon, { id: c.id, group: c.group, ...p }) })),
  })),
  { id: "districts", title: "The ten districts", items: [...districts.map((d) => ({ name: d.slug, icon: (p) => h(DistrictIcon, { slug: d.slug, ...p }) })), { name: "(not a district)", icon: (p) => h(DistrictIcon, { slug: "nowhere", ...p }) }] },
  { id: "food", title: "Kinds of food", items: [...byDrawing(FOODS).map((names) => ({ name: names.join(", "), icon: (p) => h(FoodIcon, { id: names[0], ...p }) })), { name: "(any other)", icon: (p) => h(FoodIcon, { id: "none", ...p }) }] },
  { id: "pages", title: "Pages", items: byDrawing(PAGES).map((names) => ({ name: names.join(", "), icon: (p) => h(PageIcon, { href: names[0], ...p }) })) },

]
  .filter((s) => !only || only.includes(s.id))
  .map((s) => ({ ...s, items: s.items.filter((item) => !names || names.some((name) => item.name.includes(name))) }))
  .filter((s) => s.items.length);

// 3. The page.
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const palette = (name) => {
  const found = css.match(new RegExp(`--palette-${name}:\\s*([^;]+);`));
  if (!found) throw new Error(`no --palette-${name} in globals.css`);
  return found[1].trim();
};
const SIZES = [20, 24, 48];
const svg = (item, props) => renderToStaticMarkup(item.icon(props));
const swatch = (item, ground, lit) => `<span class="swatch ${ground}">${SIZES.map((size) => svg(item, { width: size, height: size, lit })).join("")}</span>`;
const tiny = (item, ground) => `<span class="swatch ${ground}">${[16, 20].map((size) => svg(item, { width: size, height: size })).join("")}</span>`;
const cell = (item) =>
  mode === "small"
    ? `<figure class="small">${tiny(item, "paper")}${tiny(item, "tile")}<figcaption>${item.name}</figcaption></figure>`
    : mode === "big"
    ? `<figure class="big"><span class="frame">${svg(item, { width: 96, height: 96 })}</span><span class="frame">${svg(item, { width: 24, height: 24 })}</span><figcaption>${item.name}</figcaption></figure>`
    : `<figure>${swatch(item, "paper", false)}${swatch(item, "card", true)}${swatch(item, "tile", false)}<figcaption>${item.name}</figcaption></figure>`;
const html = `<!doctype html><meta charset="utf-8"><style>
  :root { --color-signal: ${palette("saffron")}; }
  body { margin: 0; padding: 24px; background: ${palette("cream")}; color: ${palette("ink")}; font: 12px/1.3 system-ui, sans-serif; width: ${mode === "big" ? 1352 : mode === "small" ? 432 : 1592}px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0 0 16px; color: ${palette("slate")}; max-width: 60em; }
  h2 { font-size: 13px; margin: 16px 0 8px; padding-top: 8px; border-top: 1px solid ${palette("sand")}; }
  section { display: grid; grid-template-columns: repeat(${mode === "big" ? 8 : mode === "small" ? 3 : 4}, 1fr); gap: 8px; }
  figure { margin: 0; display: grid; grid-template-columns: repeat(3, auto); justify-content: start; gap: 3px 6px; }
  figcaption { grid-column: 1 / -1; color: ${palette("slate")}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .swatch { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 12px; }
  .paper { background: ${palette("cream")}; outline: 1px solid ${palette("sand")}; }
  .card { background: ${palette("white")}; outline: 1px solid ${palette("sand")}; }
  .tile { background: ${palette("ink")}; color: ${palette("saffron")}; }
  svg { display: block; flex: none; }
  .big { grid-template-columns: auto auto; align-items: end; }
  .small { grid-template-columns: auto auto; }
  .small .swatch { padding: 6px; gap: 6px; border-radius: 8px; }
  .big .frame { background: ${palette("white")}; outline: 1px solid ${palette("sand")}; border-radius: 8px; padding: 6px; }
</style>
<h1>biznes.mu: the icon set</h1>
<p>${{ big: "Each icon large, and at 24px beside it.", small: "Each icon at 16px and 20px, on paper and on an ink tile.", slices: "", sheet: "" }[mode] || "Each icon at 20px, 24px and 48px: on paper in ink, on a white card with its point lit, and on an ink tile in saffron."} Made by scripts/icon-sheet.mjs from src/components/Glyphs.tsx.</p>
${sections.map((s) => `<h2 data-part="${s.id === "groups" || s.id === "kinds" ? 1 : 2}">${s.title} (${s.items.length})</h2><section>${s.items.map(cell).join("")}</section>`).join("\n")}`;

// 4. The pictures.
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ executablePath: browserPath() });
const wide = mode === "small" ? 480 : mode === "big" ? 1440 : 1640;
const page = await browser.newPage({ viewport: { width: wide, height: 900 }, deviceScaleFactor: 1 });
await page.setContent(html);
const height = await page.evaluate(() => document.documentElement.scrollHeight);
const written = [];
if (mode === "sheet") {
  // Two pictures: the directory, then everything else. The second starts at its first heading.
  const split = await page.evaluate(() => {
    const second = document.querySelector('h2[data-part="2"]');
    return second ? Math.floor(second.getBoundingClientRect().top + window.scrollY) - 12 : 0;
  });
  const parts = split > 0 && split < height ? [[0, split], [split, height]] : [[0, height]];
  for (const [i, [from, to]] of parts.entries()) {
    const file = join(dir, `sheet-${i + 1}.jpg`);
    const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: from, width: wide, height: to - from } });
    await sharp(png).jpeg({ quality: 60, mozjpeg: true }).toFile(file);
    written.push(file);
  }
} else {
  const step = mode === "small" ? 480 : 1400;
  for (let y = 0, i = 1; y < height; y += step, i++) {
    const file = join(dir, `${mode}-${String(i).padStart(2, "0")}.png`);
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y, width: wide, height: Math.min(step, height - y) } });
    written.push(file);
  }
}
await browser.close();
let total = 0;
for (const file of written) {
  const size = statSync(file).size;
  total += size;
  console.log(`${relative(root, file)}  ${(size / 1024).toFixed(0)} kB`);
}
console.log(`${sections.reduce((n, s) => n + s.items.length, 0)} icons, ${(total / 1024).toFixed(0)} kB in all`);
