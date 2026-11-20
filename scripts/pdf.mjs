// Makes the pocket guide as a PDF: `npm run pdf`.
//
// It reads content/pdf/places.json (every place with its sources, written from official pages),
// lays it out as an A5 booklet in the site's own type and colours, and writes the PDF to reports/
// (not committed and not served: it is sold, so it is never in public/). It also writes a cover
// and two sample pages to public/shop/, for the page that sells it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const file = (path) => `file://${root}${path}`;
const dataFile = `${root}content/pdf/places.json`;
if (!existsSync(dataFile)) {
  console.error("content/pdf/places.json is not there yet.");
  process.exit(1);
}
const data = JSON.parse(readFileSync(dataFile, "utf8"));
const emergencyFile = `${root}content/emergency.json`;
const emergency = existsSync(emergencyFile) ? JSON.parse(readFileSync(emergencyFile, "utf8")) : null;
const product = JSON.parse(readFileSync(`${root}content/pdf/product.json`, "utf8"));

const REGIONS = [
  ["port-louis", "Port Louis", "lights"],
  ["north", "The north", "lagoon"],
  ["east", "The east", "lagoon"],
  ["south", "The south", "cane"],
  ["south-west", "The south-west", "lagoon"],
  ["west", "The west", "flamboyant"],
  ["centre", "The centre", "cane"],
  ["islets", "The islets", "lagoon"],
  ["rodrigues", "Rodrigues", "flamboyant"],
];
const KINDS = { beach: "Beach", nature: "Nature", hike: "Walk", heritage: "Heritage", museum: "Museum", garden: "Garden", market: "Market", town: "Town", sea: "On the sea", wildlife: "Wildlife", viewpoint: "View", food: "Food", festival: "Festival", family: "For families" };

const esc = (text) => String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const day = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const cites = (sources) => (sources?.length ? `<span class="cites">${[...sources].sort((a, b) => a - b).map((n) => `<b>${n}</b>`).join("")}</span>` : "");
const mark = (ink, point) =>
  `<svg viewBox="45 -755 610 790" class="mark"><path fill="${ink}" d="M69 -735h120V0h-120Z"/><path fill="${ink}" fill-rule="evenodd" d="M69 -270a285 285 0 1 0 570 0a285 285 0 1 0 -570 0Z M189 -270a165 165 0 1 0 330 0a165 165 0 1 0 -330 0Z"/><circle cx="354" cy="-270" r="108" fill="${point}"/></svg>`;

const regions = REGIONS.map(([id, label, picture]) => ({ id, label, picture, places: data.places.filter((p) => p.region === id) })).filter((r) => r.places.length);
const known = new Set(REGIONS.map(([id]) => id));
const stray = data.places.filter((p) => !known.has(p.region));
if (stray.length) regions.push({ id: "more", label: "More to see", picture: "lagoon", places: stray });

const place = (p) => `
  <article class="place">
    <p class="kind">${esc(KINDS[p.kind] ?? p.kind)}${p.where ? ` <span>${esc(p.where)}</span>` : ""}</p>
    <h3>${esc(p.name)}</h3>
    <p class="what">${esc(p.what)} ${cites(p.sources)}</p>
    ${p.practical ? `<p class="practical"><b>Good to know</b> ${esc(p.practical)}</p>` : ""}
    ${p.tip ? `<p class="tip">${esc(p.tip)}</p>` : ""}
  </article>`;

const firstAid = emergency?.groups?.[0]?.items?.slice(0, 6) ?? [];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(product.title)}</title>
<style>
@font-face { font-family: Manrope; src: url("${file("src/fonts/manrope-latin-wght-normal.woff2")}") format("woff2"); font-weight: 200 800; }
@page { size: 148mm 210mm; margin: 16mm 14mm 18mm; }
@page full { margin: 0; }
* { box-sizing: border-box; }
html { font-family: Manrope, sans-serif; color: #0a1639; font-size: 9.6pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; }
h1, h2, h3, p, ul, ol { margin: 0; padding: 0; }
.full { page: full; width: 148mm; height: 210mm; position: relative; overflow: hidden; break-after: page; }
.cover { background: #fdf9ec url("${file("public/themes/lagoon.jpg")}") center bottom / cover; }
.cover::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(253,249,236,.92), rgba(253,249,236,.6) 34%, rgba(253,249,236,0) 62%); }
.cover > * { position: relative; }
.cover .brand { position: absolute; top: 13mm; left: 14mm; display: flex; align-items: center; gap: 2.4mm; font-weight: 700; font-size: 11pt; letter-spacing: -0.02em; }
.mark { height: 7mm; width: auto; display: block; }
.cover .words { position: absolute; top: 34mm; left: 14mm; right: 14mm; }
.cover .pill { display: inline-block; padding: 1.4mm 3.4mm; border-radius: 99mm; background: #0a1639; color: #fff; font-size: 7.6pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.cover h1 { margin-top: 5mm; font-size: 43pt; line-height: .98; letter-spacing: -0.045em; font-weight: 700; }
.cover .sub { margin-top: 4mm; font-size: 14pt; line-height: 1.25; letter-spacing: -0.02em; font-weight: 500; max-width: 96mm; }
.cover .foot { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; display: flex; justify-content: space-between; align-items: flex-end; color: #fff; font-size: 8pt; font-weight: 600; text-shadow: 0 1px 6px rgba(10,22,57,.55); }
.opener { background: #0a1639; color: #fff; }
.opener .picture { position: absolute; inset: 0 0 46% 0; background: center bottom / cover; }
.opener .picture::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(10,22,57,0) 55%, #0a1639 100%); }
.opener .words { position: absolute; left: 14mm; right: 14mm; top: 50%; }
.opener .n { color: #f8c618; font-size: 8pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.opener h2 { margin-top: 2mm; font-size: 34pt; line-height: 1; letter-spacing: -0.04em; font-weight: 700; }
.opener ul { margin-top: 7mm; list-style: none; columns: 2; column-gap: 8mm; font-size: 8.6pt; line-height: 1.35; color: #d6dcec; }
.opener li { break-inside: avoid; padding: 1.1mm 0; border-bottom: .2mm solid rgba(255,255,255,.16); }
h2.head { font-size: 20pt; line-height: 1.05; letter-spacing: -0.035em; font-weight: 700; margin-bottom: 5mm; }
.lede { font-size: 11pt; line-height: 1.45; color: #404965; }
.lede + .lede { margin-top: 3mm; }
.place { break-inside: avoid; padding: 4.2mm 0 4.6mm; border-top: .25mm solid rgba(10,22,57,.14); }
.place:first-of-type { border-top: 0; padding-top: 0; }
.place .kind { font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #0d36a7; }
.place .kind span { color: #626a80; margin-left: 1.6mm; }
.place h3 { margin-top: .8mm; font-size: 13.5pt; line-height: 1.15; letter-spacing: -0.025em; font-weight: 700; }
.place .what { margin-top: 1.6mm; }
.place .practical { margin-top: 2.2mm; padding: 2.4mm 3mm; border-radius: 2.4mm; background: #f5efe0; font-size: 8.6pt; line-height: 1.45; }
.place .practical b { display: block; font-size: 6.8pt; letter-spacing: .08em; text-transform: uppercase; color: #626a80; }
.place .tip { margin-top: 2mm; font-size: 8.6pt; color: #404965; }
.cites b { display: inline-block; min-width: 3.4mm; margin-left: .7mm; padding: 0 1mm; border-radius: 99mm; background: #f5efe0; color: #0d36a7; font-size: 6.4pt; font-weight: 700; line-height: 3.4mm; text-align: center; vertical-align: .25mm; }
.box { margin-top: 6mm; padding: 4mm 4.4mm; border-radius: 3.4mm; background: #0a1639; color: #fff; break-inside: avoid; }
.box h3 { font-size: 10.5pt; letter-spacing: -0.015em; }
.box table { width: 100%; margin-top: 2mm; border-collapse: collapse; font-size: 8.8pt; }
.box td { padding: 1.3mm 0; border-top: .2mm solid rgba(255,255,255,.16); }
.box td:last-child { text-align: right; font-weight: 700; color: #f8c618; font-variant-numeric: tabular-nums; white-space: nowrap; }
.toc { list-style: none; margin-top: 2mm; }
.toc li { display: flex; justify-content: space-between; padding: 2.4mm 0; border-bottom: .25mm solid rgba(10,22,57,.14); font-size: 11pt; font-weight: 600; letter-spacing: -0.015em; }
.toc li span { color: #626a80; font-weight: 500; font-size: 9pt; }
.route { break-inside: avoid; padding: 4mm 0; border-top: .25mm solid rgba(10,22,57,.14); }
.route h3 { font-size: 12pt; letter-spacing: -0.02em; }
.route ol { margin: 2mm 0 0 4.4mm; }
.route li { padding: .5mm 0; }
.route p { margin-top: 1.6mm; color: #404965; font-size: 8.8pt; }
.sources { list-style: none; font-size: 6.9pt; line-height: 1.4; color: #404965; columns: 2; column-gap: 6mm; }
.sources li { break-inside: avoid; padding: .7mm 0 .7mm 5mm; text-indent: -5mm; overflow-wrap: anywhere; }
.sources b { display: inline-block; width: 5mm; text-indent: 0; color: #0d36a7; }
.new-page { break-before: page; }
.back { background: #fdf9ec; }
.back .words { position: absolute; left: 14mm; right: 14mm; top: 44mm; }
.back h2 { font-size: 24pt; line-height: 1.05; letter-spacing: -0.04em; font-weight: 700; }
.back p { margin-top: 4mm; font-size: 10.5pt; color: #404965; max-width: 100mm; }
@media screen { #sample { padding: 16mm 14mm 0; background: #fff; } }
.back .small { position: absolute; left: 14mm; right: 14mm; bottom: 14mm; font-size: 7.4pt; color: #626a80; line-height: 1.5; }
</style></head><body>

<section class="full cover" id="cover">
  <p class="brand">${mark("#0a1639", "#f8c618")} biznes.mu</p>
  <div class="words">
    <p class="pill">Pocket guide</p>
    <h1>${esc(product.cover)}</h1>
    <p class="sub">${esc(product.line)}</p>
  </div>
  <p class="foot"><span>${data.places.length} places, ${regions.length} regions</span><span>Checked ${day(data.checked)}</span></p>
</section>

<h2 class="head">How to use this guide</h2>
<p class="lede">This guide lists ${data.places.length} places and things to do across Mauritius and Rodrigues, region by region.</p>
<p class="lede">Everything in it comes from an official page that was read on ${day(data.checked)}: the tourism authority, the parks service, the museums and the trusts that keep each place, and each place's own site. The small numbers beside a line lead to the source at the back.</p>
<p class="lede">Where a page did not state an opening time or a price, none is given here. Check before you set out: hours change, and the sea and the weather have the last word.</p>
${firstAid.length ? `<div class="box"><h3>Numbers to keep</h3><table>${firstAid.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.number)}</td></tr>`).join("")}</table></div>` : ""}

<h2 class="head new-page">What is inside</h2>
<ul class="toc">
  ${regions.map((r) => `<li>${esc(r.label)} <span>${r.places.length} ${r.places.length === 1 ? "place" : "places"}</span></li>`).join("")}
  ${data.itineraries?.length ? `<li>Days out <span>${data.itineraries.length} ${data.itineraries.length === 1 ? "route" : "routes"}</span></li>` : ""}
  <li>Sources <span>${data.sources.length}</span></li>
</ul>

${regions
  .map(
    (r, i) => `
<section class="full opener" ${i === 0 ? 'id="opener"' : ""}>
  <div class="picture" style="background-image:url('${file(`public/themes/${r.picture}.jpg`)}')"></div>
  <div class="words">
    <p class="n">Part ${i + 1} of ${regions.length}</p>
    <h2>${esc(r.label)}</h2>
    <ul>${r.places.map((p) => `<li>${esc(p.name)}</li>`).join("")}</ul>
  </div>
</section>
<div ${i === 0 ? 'id="sample"' : ""}>${r.places.map(place).join("")}</div>`,
  )
  .join("")}

${
  data.itineraries?.length
    ? `<h2 class="head new-page">Days out</h2><p class="lede">Places that lie near each other, put together as a day. No times are given: allow for the road and the weather.</p>
${data.itineraries.map((r) => `<div class="route"><h3>${esc(r.title)}</h3><ol>${r.stops.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${r.note ? `<p>${esc(r.note)}</p>` : ""}</div>`).join("")}`
    : ""
}

<h2 class="head new-page">Sources</h2>
<ol class="sources">${data.sources.map((s) => `<li><b>${s.n}</b>${esc(s.title)}, ${esc(s.publisher)}. ${esc(s.url)}</li>`).join("")}</ol>

<section class="full back new-page">
  <div class="words">
    ${mark("#0a1639", "#f8c618")}
    <h2 style="margin-top:8mm">Now find what is around it.</h2>
    <p>The restaurant near the beach, the pharmacy in the next village, the taxi back: biznes.mu is the search engine for business in Mauritius.</p>
    <p><b>biznes.mu</b></p>
  </div>
  <p class="small">${esc(product.title)}. Facts checked ${day(data.checked)} against the sources listed. The pictures are illustrations made for biznes.mu, not photographs of the places. This guide is for your own use: please do not pass it on. Made by Khay Digital, Mauritius. khay.digital</p>
</section>
</body></html>`;

mkdirSync(`${root}reports`, { recursive: true });
mkdirSync(`${root}public/shop`, { recursive: true });
const htmlFile = `${root}reports/${product.slug}.html`;
writeFileSync(htmlFile, html);

const browser = await chromium.launch({ executablePath: browserPath() });
const page = await browser.newPage({ viewport: { width: 560, height: 794 }, deviceScaleFactor: 2 });
await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const pdf = `${root}reports/${product.slug}.pdf`;
await page.pdf({
  path: pdf,
  preferCSSPageSize: true,
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif;font-size:6.5pt;color:#626a80"><span>${esc(product.title)}</span><span class="pageNumber"></span></div>`,
});
// The samples for the shop's page: the cover, a part's opening page, and the first entries.
await page.emulateMedia({ media: "screen" });
for (const [id, name] of [["cover", "cover"], ["opener", "opener"], ["sample", "sample"]]) {
  const el = page.locator(`#${id}`);
  if (!(await el.count())) continue;
  const box = await el.boundingBox();
  await page.screenshot({ path: `${root}public/shop/${product.slug}-${name}.jpg`, type: "jpeg", quality: 82, fullPage: true, clip: { x: box.x, y: box.y, width: Math.min(box.width, 560), height: Math.min(box.height, 794) } });
}
const pages = (readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
writeFileSync(`${root}content/pdf/built.json`, `${JSON.stringify({ slug: product.slug, pages, places: data.places.length, regions: regions.length, sources: data.sources.length, checked: data.checked }, null, 2)}\n`);
await browser.close();
console.log(`reports/${product.slug}.pdf: ${pages} pages, ${data.places.length} places, ${data.sources.length} sources`);
