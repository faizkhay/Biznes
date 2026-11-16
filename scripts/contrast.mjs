#!/usr/bin/env node
// Contrast, measured the way DESIGN.md records it: the WCAG 2.x formula, alpha composited over the
// real ground, and the ratio FLOORED to two decimals, so nothing rounds up into a pass.
//
//   node scripts/contrast.mjs "#a8084b on #ffffff" "rgba(39,39,39,0.55) on #fff"
//   node scripts/contrast.mjs --json pairs.json      ([{ "text": "#…", "on": "#…", "where": "…" }])
//
// Prints a Markdown table to paste into DESIGN.md's Contrast section: the ratio, and whether it
// passes AA for body text (4.5:1) and for large text and non-text marks such as focus rings and field
// edges (3:1). Exits 1 if any pair fails both, so a list of pairs that must all pass can gate a build.
//
// KOS kit. No dependencies.
import { readFileSync } from "node:fs";

function parse(c) {
  c = c.trim().toLowerCase();
  if (c === "white") return [255, 255, 255, 1];
  if (c === "black") return [0, 0, 0, 1];
  let m = c.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    if (h.length !== 6 && h.length !== 8) throw new Error(`not a colour: ${c}`);
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  m = c.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), a];
  }
  throw new Error(`not a colour: ${c} (use #hex, rgb() or rgba())`);
}

/** Lay a translucent colour over an opaque ground, in 8-bit channels as the browser does. */
const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)].map(Math.round);

/** WCAG 2.x relative luminance. */
function luminance([r, g, b]) {
  const ch = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function ratio(text, on) {
  const ground = parse(on);
  if (ground[3] < 1) throw new Error(`the ground must be opaque: composite ${on} over its own ground first`);
  const fg = over(parse(text), ground);
  const [a, b] = [luminance(fg), luminance(ground)].sort((x, y) => y - x);
  return Math.floor(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

const args = process.argv.slice(2);
let pairs;
if (args[0] === "--json") pairs = JSON.parse(readFileSync(args[1], "utf8"));
else
  pairs = args.map((s) => {
    const [text, on] = s.split(/\s+on\s+/i);
    if (!on) throw new Error(`write each pair as "<text colour> on <ground>": ${s}`);
    return { text, on, where: "" };
  });
if (!pairs.length) {
  console.error('usage: node scripts/contrast.mjs "#a8084b on #ffffff" [...] | --json pairs.json');
  process.exit(2);
}

let failed = 0;
console.log("| Text or mark | On | Ratio | Body text (4.5) | Large text, marks (3) | Where |");
console.log("|---|---|---|---|---|---|");
for (const p of pairs) {
  const r = ratio(p.text, p.on);
  const body = r >= 4.5 ? "pass" : "fail";
  const large = r >= 3 ? "pass" : "fail";
  if (large === "fail") failed++;
  console.log(`| ${p.text} | ${p.on} | ${r.toFixed(2)}:1 | ${body} | ${large} | ${p.where ?? ""} |`);
}
process.exit(failed ? 1 : 0);
