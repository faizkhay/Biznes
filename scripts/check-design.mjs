#!/usr/bin/env node
// DESIGN.md's shape, checked: what Google's linter does not look at.
//
//   node scripts/check-design.mjs [DESIGN.md]
//   npx --yes @google/design.md@0.4.0 lint DESIGN.md      (run this too: tokens, references, contrast)
//
// FAIL (exit 1): no YAML frontmatter; a canonical section missing, misspelt or out of order; no
//   Creative North Star; clamp() in a token (the linter rejects it: put the maximum in the token and
//   the clamp() in the hierarchy table).
// WARN: a Khay section missing (Motion, Scene & 3D, Responsive Behavior, Agent Guide, Known Gaps);
//   no Contrast table, or one that does not say it is floored; no Named Rules; an em or en dash.
//
// KOS kit. No dependencies; Node 18 or newer.
import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2] ?? "DESIGN.md";
if (!existsSync(file)) {
  console.log(`FAIL  ${file} not found: start from KOS templates/DESIGN.md`);
  process.exit(1);
}
const src = readFileSync(file, "utf8");
const fails = [];
const warns = [];

const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (!fm) fails.push("no YAML frontmatter at the top (--- ... ---)");
// YAML comments may mention clamp(); only values count. A # inside a quoted colour follows a quote, not a space.
else if (/clamp\(/.test(fm[1].split("\n").map((l) => l.replace(/(^|\s)#.*$/, "")).join("\n"))) fails.push("clamp() inside the frontmatter: tokens take the maximum (rem); the clamp() goes in Typography, Hierarchy");

const body = fm ? src.slice(fm[0].length) : src;
const h2 = [...body.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1].trim());

const CANON = ["Overview", "Colors", "Typography", "Layout", "Elevation & Depth", "Shapes", "Components", "Do's and Don'ts"];
const KHAY = ["Motion", "Scene & 3D", "Responsive Behavior", "Agent Guide", "Known Gaps"];
const MISSPELT = {
  Colours: "Colors",
  "Colour Palette": "Colors",
  "Dos and Don'ts": "Do's and Don'ts",
  "Do's & Don'ts": "Do's and Don'ts",
  "Dos and Donts": "Do's and Don'ts",
  "Elevation and Depth": "Elevation & Depth",
  "Depth & Elevation": "Elevation & Depth",
  "Responsive Behaviour": "Responsive Behavior",
  "Scene and 3D": "Scene & 3D",
};

for (const h of h2) {
  const canon = [...CANON, ...KHAY].find((c) => c.toLowerCase() === h.toLowerCase() && c !== h);
  if (canon) fails.push(`"## ${h}" should read "## ${canon}"`);
}
for (const h of h2) if (MISSPELT[h]) fails.push(`"## ${h}" should read "## ${MISSPELT[h]}" (the linter accepts it; agents and tools do not)`);
let last = -1;
for (const name of CANON) {
  const at = h2.indexOf(name);
  if (at === -1) fails.push(`missing "## ${name}"`);
  else if (at < last) fails.push(`"## ${name}" is out of order (the canonical order is ${CANON.join(", ")})`);
  else last = at;
}
for (const name of KHAY) if (!h2.includes(name)) warns.push(`missing Khay section "## ${name}"${name === "Scene & 3D" ? " (one line is enough when there is no WebGL)" : ""}`);

if (!/\*\*Creative North Star: ".+?"\*\*/.test(body)) fails.push('no "**Creative North Star: "..."**" line in the Overview');
if (!/^### Contrast\b/m.test(body)) warns.push("no \"### Contrast\" table under Colors (measured, floored to two decimals)");
else if (!/floor/i.test(body)) warns.push("the Contrast table does not say its ratios are floored");
if (!/\*\*The .+? Rule\.\*\*/.test(body)) warns.push('no Named Rules ("**The <Name> Rule.** ...")');
const dash = src.match(new RegExp(`[${String.fromCodePoint(0x2013, 0x2014)}]`));
if (dash) warns.push("an em or en dash: the house style has none");

for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(`\n${file}: ${h2.length} sections, ${fails.length} fail, ${warns.length} warn`);
process.exit(fails.length ? 1 : 0);
