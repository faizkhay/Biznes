// How heavy each kind of page is, as a phone fetches it: `node scripts/weights.mjs [origin]`.
//
// Lighthouse is not always to hand, and a page's weight is most of what it would measure on a
// slow connection. For each kind of page this opens it fresh at a phone's size with nothing kept
// from before, and reports what crossed the wire (compressed, as the server sends it): the whole,
// the script, the pictures, the largest single thing, and how much the layout moved after the
// first paint (the browser's own layout-shift entries, summed).
//
// It reports and does not judge: read the numbers against the budget in README ("Performance").
import { chromium } from "playwright";
import { browserPath } from "./pages.mjs";

const origin = process.argv[2] ?? "http://localhost:3100";
const KINDS = [
  ["home", "/"],
  ["search", "/search?q=pharmacy+in+curepipe"],
  ["search-answer", "/search?q=cyclone+season"],
  ["listing", "/b/keiffel-tours-grand-baie-n5651200767"],
  ["category", "/directory/pharmacies"],
  ["places", "/places"],
  ["baz-manzer", "/baz-manzer"],
  ["guide", "/learn/vat"],
  ["shop", "/shop"],
  ["cart", "/cart"],
];
const kb = (bytes) => `${(bytes / 1024).toFixed(0).padStart(5)} kB`;

const browser = await chromium.launch({ executablePath: browserPath() });
console.log(`${"page".padEnd(14)} ${"whole".padStart(8)} ${"page".padStart(8)} ${"script".padStart(8)} ${"pictures".padStart(8)} ${"fonts".padStart(8)}  shift  largest`);
for (const [name, path] of KINDS) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await context.newPage();
  // What crossed the wire, as the browser's own network log counts it: compressed, headers and all.
  const sizes = [];
  const types = new Map();
  const wire = await context.newCDPSession(page);
  await wire.send("Network.enable");
  wire.on("Network.responseReceived", (event) => types.set(event.requestId, { url: event.response.url.replace(origin, ""), type: event.type.toLowerCase() }));
  wire.on("Network.loadingFinished", (event) => {
    const known = types.get(event.requestId);
    if (known) sizes.push({ ...known, bytes: event.encodedDataLength });
  });
  await page.addInitScript(() => {
    window.__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(origin + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const shift = await page.evaluate(() => window.__shift);
  const sum = (type) => sizes.filter((s) => s.type === type).reduce((n, s) => n + s.bytes, 0);
  const doc = sizes.find((s) => s.type === "document");
  const largest = [...sizes].sort((a, b) => b.bytes - a.bytes)[0];
  console.log(`${name.padEnd(14)} ${kb(sizes.reduce((n, s) => n + s.bytes, 0))} ${kb(doc?.bytes ?? 0)} ${kb(sum("script"))} ${kb(sum("image"))} ${kb(sum("font"))}  ${shift.toFixed(3)}  ${largest ? `${kb(largest.bytes).trim()} ${largest.url.split("?")[0].slice(0, 60)}` : ""}`);
  await context.close();
}
await browser.close();
