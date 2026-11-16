#!/usr/bin/env node
// The house style, checked: no em or en dashes anywhere, and a warning for anything that reads like
// a template rather than the client.
//
//   node scripts/check-copy.mjs [paths...]     (default: src README.md public/llms.txt)
//
// FAIL (exit 1): an em dash, an en dash, a figure dash or a horizontal bar, in any file, comments
//   included. Rewrite the sentence; never search and replace (see references/voice.md). And a marked
//   gap such as {{price}} left in a string in code, or in data, where it would ship
//   (references/evidence.md, after Elaya's ai-design-skills); in Markdown it is only a warning, since
//   documents describe the convention. JSX's double braces (style={{ color }}) are code, not a gap.
// WARN: a generic action ("Learn more"), a hype word ("seamless", and Elaya's banned filler), a
//   spaced hyphen used as a dash in copy, placeholder text ("lorem ipsum", "John Doe"). Read each one:
//   a client's own line may use a word the list flags, and then it stays.
//
// A line containing "kos-allow" is skipped, for the rare quotation that must keep its punctuation.
// In code files only string literals and JSX text are checked for warnings, so identifiers like
// onSubmit never trip them.
//
// KOS kit. No dependencies; Node 18 or newer.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ["src", "README.md", "public/llms.txt"];
const SKIP = new Set(["node_modules", ".next", "out", "dist", ".git", ".vercel", "coverage"]);
const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TEXT = new Set([".json", ".md", ".mdx", ".txt", ".html", ".css", ".yml", ".yaml"]);

// Built from code points, so this file itself contains no dash to trip its own rule.
const NAMES = { 0x2012: "figure dash", 0x2013: "en dash", 0x2014: "em dash", 0x2015: "horizontal bar" };
const DASH_NAME = Object.fromEntries(Object.entries(NAMES).map(([cp, name]) => [String.fromCodePoint(Number(cp)), name]));
const DASHES = new RegExp(`[${Object.keys(DASH_NAME).join("")}]`);
const CTA = /\b(learn more|get started|click here|read more|discover more|explore now|find out more)\b/i;
const HYPE =
  /\b(unlock|unleash|supercharge|seamless(ly)?|elevate|empower|revolutioni[sz]e|game[- ]changer|cutting[- ]edge|next[- ]gen|world[- ]class|best[- ]in[- ]class|all[- ]in[- ]one|effortless(ly)?|innovative|passionate|delve|tapestry|synergy|streamline|holistic|take (?:it|your .{1,30}) to the next level|transform your workflow|harness the power|in today's)\b/i;
const PLACEHOLDER = /\b(lorem ipsum|dolor sit amet|john doe|jane doe|acme corp|example\.com|123 main st)\b/i;
const SPACED_HYPHEN = /\p{L} - \p{L}/u;
const MARKED_GAP = /\{\{[A-Za-z_][\w.-]*\}\}/;
const SHIPS = new Set([...CODE, ".json", ".txt", ".html", ".yml", ".yaml"]);

/** String literals and JSX text in a line of code, roughly: enough for warnings, never for FAILs. */
function copyIn(line) {
  const out = [];
  const re = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`|>([^<>{}]+)</g;
  for (let m; (m = re.exec(line)); ) out.push(m[1] ?? m[2] ?? m[3] ?? m[4] ?? "");
  return out.join(" \u0000 ");
}

function* files(path) {
  if (!existsSync(path)) return;
  const st = statSync(path);
  if (st.isFile()) {
    yield path;
    return;
  }
  for (const name of readdirSync(path)) {
    if (SKIP.has(name)) continue;
    yield* files(join(path, name));
  }
}

const fails = [];
const warns = [];
let checked = 0;
for (const root of roots) {
  for (const file of files(root)) {
    const ext = extname(file).toLowerCase();
    if (!CODE.has(ext) && !TEXT.has(ext)) continue;
    checked++;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes("kos-allow")) return;
      const at = `${relative(".", file)}:${i + 1}`;
      const d = line.match(DASHES);
      if (d) fails.push(`${at}  ${DASH_NAME[d[0]]}: ${line.trim().slice(0, 120)}`);
      const copy = CODE.has(ext) ? copyIn(line) : line;
      if (!copy.trim()) return;
      const gap = copy.match(MARKED_GAP);
      if (gap) (SHIPS.has(ext) ? fails : warns).push(`${at}  marked gap ${gap[0]}: the client's answer, or leave it out and put it on the confirm list`);
      const cta = copy.match(CTA);
      if (cta) warns.push(`${at}  generic action "${cta[0]}": name what happens instead`);
      const hype = copy.match(HYPE);
      if (hype) warns.push(`${at}  hype "${hype[0]}": say the specific thing`);
      const ph = copy.match(PLACEHOLDER);
      if (ph) warns.push(`${at}  placeholder "${ph[0]}": use the client's real content or leave it out`);
      if (!CODE.has(ext) && ext !== ".css" && SPACED_HYPHEN.test(copy))
        warns.push(`${at}  spaced hyphen used as a dash: ${copy.trim().slice(0, 100)}`);
    });
  }
}

for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(`\n${checked} files: ${fails.length} fail, ${warns.length} warn`);
process.exit(fails.length ? 1 : 0);
