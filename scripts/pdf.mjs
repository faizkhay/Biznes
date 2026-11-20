// Makes the biznes.mu Pocket Guide as a PDF: `npm run pdf`.
//
// There is one guide, renewed every month. It reads content/pdf/places.json (every place with its
// sources, written from official pages), lays it out as an A5 booklet in the site's own type and
// colours, and writes this month's edition to content/pdf/editions/ (never to public/: it is
// sold, and only the shop's own route hands it out, when it is free). It also writes a cover and
// two sample pages to public/shop/, for the page that sells it. Run it again, after the guide's
// facts have been read again, at the start of each month.
//
// An edition holds at most so many pages of sponsors (content/pdf/sponsorship.json, `maxPages`:
// four, by the owner's word). Each sponsor's option takes its share of a page. If the sponsors
// named for the edition in content/pdf/product.json would take more, nothing is made: the script
// names the one that goes over and stops. `npm run pdf -- --check [product.json]` does only that
// check, on the file named or on the guide's own.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";
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
const args = process.argv.slice(2);
const checking = args.includes("--check");
const named = args.find((arg) => /\.json$/.test(arg));
const product = JSON.parse(readFileSync(named ?? `${root}content/pdf/product.json`, "utf8"));
const sponsorship = JSON.parse(readFileSync(`${root}content/pdf/sponsorship.json`, "utf8"));
// How to reach the people behind the site is said once, in src/data/site.ts; it is read from there.
const siteFacts = readFileSync(`${root}src/data/site.ts`, "utf8");
const contact = { phone: /\bphone: "([^"]+)"/.exec(siteFacts)?.[1] ?? "", email: /\bemail: "([^"]+)"/.exec(siteFacts)?.[1] ?? "" };

// A guide is renewed every month. The edition is the month it is made for: this month, in
// Mauritius, or the one named on the command line (`npm run pdf -- 2026-12`).
const edition = args.find((arg) => /^\d{4}-\d{2}$/.test(arg)) ?? new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 7);
const editionName = new Date(`${edition}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// Sponsors come from two places: the guide's own file, and the places businesses booked through
// their accounts, once an admin has approved them and marked them paid (the `guide_sponsors` view,
// read as any visitor reads it). The second is read only when the accounts' address and key are
// in the environment, and never for a check of a file named on the command line. A sponsor named
// in both is counted once.
const accounts = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
if (accounts.url && accounts.key && !named) {
  try {
    const answer = await fetch(`${accounts.url}/rest/v1/guide_sponsors?month=eq.${edition}&select=month,option,name,line,town,phone,website`, { headers: { apikey: accounts.key } });
    if (!answer.ok) throw new Error(`the accounts answered ${answer.status}`);
    const placesFile = `${root}data/index/places.json`;
    const townOf = new Map(existsSync(placesFile) ? JSON.parse(readFileSync(placesFile, "utf8")).map((place) => [place.slug, place.name]) : []);
    const key = (sponsor) => `${String(sponsor.name).trim().toLowerCase()}|${sponsor.option}`;
    const written = new Set((product.sponsors ?? []).filter((sponsor) => sponsor.months?.includes(edition)).map(key));
    const booked = (await answer.json()).filter((row) => !written.has(key(row))).map((row) => ({ name: row.name, option: row.option, months: [edition], ...(row.line ? { line: row.line } : {}), ...(townOf.get(row.town) ? { town: townOf.get(row.town) } : {}), ...(row.phone ? { phone: row.phone } : {}), ...(row.website ? { web: row.website } : {}) }));
    product.sponsors = [...(product.sponsors ?? []), ...booked];
    console.log(`Sponsors booked through accounts for ${edition}: ${booked.length}.`);
  } catch (error) {
    console.error(`Refused: the sponsors booked through accounts could not be read (${error.message}). An edition is not made without them. Try again, or unset NEXT_PUBLIC_SUPABASE_URL to make it from the file alone.`);
    process.exit(1);
  }
} else if (!named) {
  console.log("Sponsors are read from content/pdf/product.json alone: the accounts' address and key are not in the environment.");
}
const sponsors = (product.sponsors ?? []).filter((sponsor) => sponsor.months?.includes(edition));

// The most pages of sponsors an edition holds. Every month a sponsor is named for is counted, so a
// fifth page is refused when it is written into the data, not in the month it would have run.
const optionOf = new Map(sponsorship.options.map((option) => [option.id, option]));
const months = [...new Set((product.sponsors ?? []).flatMap((sponsor) => sponsor.months ?? []))].sort();
for (const month of months) {
  let taken = 0;
  for (const sponsor of product.sponsors.filter((s) => s.months?.includes(month))) {
    const option = optionOf.get(sponsor.option);
    if (!option) {
      console.error(`Refused: "${sponsor.name}" asks for "${sponsor.option}", which is not one of the options in content/pdf/sponsorship.json.`);
      process.exit(1);
    }
    taken += option.pages;
    if (taken > sponsorship.maxPages + 1e-9) {
      console.error(`Refused: the ${month} edition holds at most ${sponsorship.maxPages} pages of sponsors, and "${sponsor.name}" (${option.name}) would make it ${taken}. Take it out of that month in content/pdf/product.json, or move it to a later one.`);
      process.exit(1);
    }
  }
}
if (checking) {
  console.log(`Sponsors fit: ${months.length ? months.map((month) => `${month} holds ${product.sponsors.filter((s) => s.months?.includes(month)).reduce((sum, s) => sum + optionOf.get(s.option).pages, 0)} of ${sponsorship.maxPages} pages`).join("; ") : "no sponsor is named yet"}.`);
  process.exit(0);
}

// The pictures, with their fades painted into them. A fade made of see-through colour is lost in
// some PDF readers, which show a hard line where the picture ends; a painted one cannot be.
const PX = { w: 1240, h: 1754 }; // an A5 page at 210 dots to the inch
mkdirSync(`${root}reports/.guide`, { recursive: true });
const fade = (stops) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PX.w}" height="${PX.h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops.map(([at, colour, alpha]) => `<stop offset="${at}" stop-color="${colour}" stop-opacity="${alpha}"/>`).join("")}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
const painted = {};
async function paint(name, picture, tall, stops, ground) {
  const top = await sharp(`${root}public/themes/${picture}.jpg`).resize(PX.w, Math.round(PX.h * tall), { fit: "cover", position: "south" }).toBuffer();
  const out = `${root}reports/.guide/${name}.jpg`;
  await sharp({ create: { width: PX.w, height: PX.h, channels: 3, background: ground } })
    .composite([{ input: top, top: 0, left: 0 }, { input: fade(stops), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
  painted[name] = `file://${out}`;
}
await paint("cover", "lagoon", 1, [[0, "#fdf9ec", 0.94], [0.34, "#fdf9ec", 0.62], [0.62, "#fdf9ec", 0]], "#fdf9ec");
for (const picture of ["lagoon", "flamboyant", "cane", "lights"]) await paint(`opener-${picture}`, picture, 0.54, [[0, "#0a1639", 0], [0.3, "#0a1639", 0], [0.5, "#0a1639", 0.86], [0.54, "#0a1639", 1], [1, "#0a1639", 1]], "#0a1639");

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
.cover { background: #fdf9ec url("${painted.cover}") center / cover; }
.cover > * { position: relative; }
.cover .brand { position: absolute; top: 13mm; left: 14mm; display: flex; align-items: center; gap: 2.4mm; font-weight: 700; font-size: 11pt; letter-spacing: -0.02em; }
.mark { height: 7mm; width: auto; display: block; }
.cover .words { position: absolute; top: 34mm; left: 14mm; right: 14mm; }
.cover .pill { display: inline-block; padding: 1.4mm 3.4mm; border-radius: 99mm; background: #0a1639; color: #fff; font-size: 7.6pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.cover h1 { margin-top: 5mm; font-size: 43pt; line-height: .98; letter-spacing: -0.045em; font-weight: 700; }
.cover .sub { margin-top: 4mm; font-size: 14pt; line-height: 1.25; letter-spacing: -0.02em; font-weight: 500; max-width: 96mm; }
.cover .foot { position: absolute; left: 14mm; right: 14mm; bottom: 12mm; display: flex; justify-content: space-between; align-items: flex-end; color: #fff; font-size: 8pt; font-weight: 600; text-shadow: 0 1px 6px rgba(10,22,57,.55); }
.opener { color: #fff; }
.opener { background: #0a1639 center / cover; }
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
.sponsor { break-inside: avoid; margin-top: 4mm; padding: 4mm 4.4mm; border: .3mm solid rgba(10,22,57,.16); border-radius: 3.4mm; }
.sponsor .kind { font-size: 6.8pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #626a80; }
.sponsor h3 { margin-top: .8mm; font-size: 12.5pt; letter-spacing: -0.02em; }
.sponsor p { margin-top: 1.2mm; color: #404965; }
.sponsor .reach { font-weight: 600; color: #0a1639; }
.sponsor.empty { background: #f5efe0; border-color: transparent; }
.sponsor-page { break-before: page; break-after: page; min-height: 150mm; padding: 10mm 8mm; }
.sponsor-page h3 { font-size: 24pt; letter-spacing: -0.035em; line-height: 1.05; }
.sponsor-page p { font-size: 11pt; }
.sponsor-panel { min-height: 38mm; }
.box.light { background: #f5efe0; color: #0a1639; }
.box.light td { border-top-color: rgba(10,22,57,.14); }
.box.light td:first-child, .box.light .call { color: #404965; }
.box.light td:last-child { color: #0a1639; }
.box td b { color: #fff; }
.box td:first-child { color: #d6dcec; padding-right: 3mm; }
.box .call { margin-top: 3mm; font-size: 8.6pt; color: #d6dcec; }
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
    <p class="pill">${esc(editionName)} edition</p>
    <h1>${esc(product.cover)}</h1>
    <p class="sub">${esc(product.line)}</p>
  </div>
  <p class="foot"><span>${data.places.length} places, ${regions.length} regions. A new edition every month</span><span>Checked ${day(data.checked)}</span></p>
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
<section class="full opener" ${i === 0 ? 'id="opener"' : ""} style="background-image:url('${painted[`opener-${r.picture}`]}')">
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

<h2 class="head new-page">Sponsors of this edition</h2>
<p class="lede">This guide is renewed every month. The businesses below paid to be on these pages; nothing else in the guide is paid for, and no place is in it because of a sponsor. An edition holds at most ${sponsorship.maxPages} pages of sponsors.</p>
${
  sponsors.length
    ? sponsors.map((sponsor) => `<div class="sponsor sponsor-${esc(sponsor.option)}"><p class="kind">Sponsored</p><h3>${esc(sponsor.name)}</h3>${sponsor.line ? `<p>${esc(sponsor.line)}</p>` : ""}<p class="reach">${[sponsor.town, sponsor.phone, sponsor.web].filter(Boolean).map(esc).join(" · ")}</p></div>`).join("")
    : `<div class="sponsor empty"><h3>Your business could be here.</h3><p>No business has sponsored this edition yet.</p></div>`
}
<div class="box">
  <h3>Put your business in a coming edition</h3>
  <table>${sponsorship.options.map((option) => `<tr><td><b>${esc(option.name)}</b><br>${esc(option.what)}</td><td>Rs ${option.price.toLocaleString("en-GB")} a month</td></tr>`).join("")}</table>
  <p class="call">Sponsorship is taken for the coming month or months. Call or WhatsApp ${esc(contact.phone)}, or write to ${esc(contact.email)}.</p>
</div>
<div class="box light">
  <h3>When the guide is free</h3>
  <table>${[...sponsorship.free].sort((x, y) => x.raised - y.raised).map((step) => `<tr><td>The edition's sponsors have together paid Rs ${step.raised.toLocaleString("en-GB")}</td><td>${step.month ? "Free all month" : `Free for ${["", "1 week", "2 weeks", "3 weeks", "4 weeks"][step.weeks] ?? `${step.weeks} weeks`}`}</td></tr>`).join("")}</table>
  <p class="call">Counted from the first day of the edition's month. The rest of the month the guide is Rs ${Number(product.price).toLocaleString("en-GB")}.</p>
</div>

<section class="full back new-page">
  <div class="words">
    ${mark("#0a1639", "#f8c618")}
    <h2 style="margin-top:8mm">Now find what is around it.</h2>
    <p>The restaurant near the beach, the pharmacy in the next village, the taxi back: biznes.mu is the search engine for business in Mauritius.</p>
    <p><b>biznes.mu</b></p>
  </div>
  <p class="small">The ${esc(product.title)}. Facts checked ${day(data.checked)} against the sources listed. The pictures are illustrations made for biznes.mu, not photographs of the places. ${esc(editionName)} edition; a new one is made every month. This guide is for your own use: please do not pass it on. Made by Khay Digital, Mauritius. khay.digital</p>
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
// The edition is kept with the content, so the site can hand it out when it is free. It is never
// in public/: only the shop's own route serves it, and only then.
mkdirSync(`${root}content/pdf/editions`, { recursive: true });
const pdf = `${root}content/pdf/editions/${product.slug}.pdf`;
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
  // Captured at twice the size and brought down to what the shop's page shows, so the three weigh little.
  const shot = await page.screenshot({ type: "png", fullPage: true, clip: { x: box.x, y: box.y, width: Math.min(box.width, 560), height: Math.min(box.height, 794) } });
  await sharp(shot).resize({ width: 800 }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${root}public/shop/${product.slug}-${name}.jpg`);
}
const pages = (readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
writeFileSync(`${root}content/pdf/built.json`, `${JSON.stringify({ slug: product.slug, edition, pages, places: data.places.length, regions: regions.length, sources: data.sources.length, checked: data.checked }, null, 2)}\n`);
await browser.close();
console.log(`content/pdf/editions/${product.slug}.pdf (${editionName}): ${pages} pages, ${data.places.length} places, ${data.sources.length} sources`);
