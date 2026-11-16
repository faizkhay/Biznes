#!/usr/bin/env node
// Every visual value through a token: the type scale, the spacing and radius scales, the colour roles
// (references/visual-system.md, after Elaya's ai-design-skills: "Every visual value must resolve
// through these rules instead of being invented ad hoc").
//
//   node scripts/check-tokens.mjs [paths...]     (default: src)
//
// FAIL (exit 1), in class names (string literals in code, class="..." in HTML, @apply in CSS):
//   a type size, spacing or radius invented on the spot: text-[19px], p-[13px], gap-[1.1rem],
//     rounded-[10px], text-[clamp(1.9rem,4.4vw,3.8rem)];
//   a spacing step off the scale (0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24): p-5, gap-7, -mt-14;
//   a radius off the scale (none, xs, sm, md, lg, xl, 2xl, 3xl, full): rounded-4xl;
//   a raw colour: bg-[#e5e5e5], text-[rgb(0_0_0)], border-[oklch(0.7_0.1_200)], with or without an
//     opacity (bg-[#000]/40);
//   a colour from Tailwind's own palette: text-white, bg-black/50, border-gray-200. The kit switches
//     those off (--color-*: initial), so they paint nothing: use a role (text-ink, bg-paper).
// WARN: an arbitrary leading-[...] or tracking-[...]; font-extrabold or font-black (interface text stops
//   at bold); italic (only as the brand's one device); a one-pixel nudge such as mt-px.
//
// An arbitrary value that reads a token passes (px-[var(--gutter)], text-(--color-ink)): the token is
// the decision, recorded in globals.css and DESIGN.md. Widths, heights and positions are layout, not
// spacing, and are not checked. A line containing "kos-allow" is skipped.
//
// KOS kit. No dependencies; Node 18 or newer.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { extname, join, relative } from "node:path";

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ["src"];
const SKIP = new Set(["node_modules", ".next", "out", "dist", ".git", ".vercel", "coverage"]);
const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mdx", ".html"]);

const SPACE_SCALE = new Set(["0", "0.5", "1", "2", "3", "4", "6", "8", "10", "12", "16", "20", "24"]);
const RADIUS_SCALE = new Set(["", "none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"]);
const SPACING = /^(p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])-(.+)$/;
const RADIUS = /^rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?(?:-(.+))?$/;
const COLOUR_PREFIX = "(?:bg|text|border(?:-[xytrblse])?|ring|outline|fill|stroke|decoration|from|via|to|shadow|accent|caret|divide|placeholder)";
const COLOUR_UTILITY = new RegExp(`^${COLOUR_PREFIX}-\\[(.+)\\](?:\\/\\S+)?$`);
const TAILWIND_PALETTE = new RegExp(
  `^${COLOUR_PREFIX}-(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3})(?:\\/\\S+)?$`,
);
const RAW_COLOUR = /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i;

/** The utility itself: variants (md:, hover:, [&>p]:) and the important mark removed. */
function utilityOf(token) {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "[" || c === "(") depth++;
    else if (c === "]" || c === ")") depth--;
    else if (c === ":" && depth === 0) cut = i;
  }
  return token.slice(cut + 1).replace(/^!|!$/g, "").replace(/^-/, "");
}

const readsToken = (v) => /var\(|^\(--|^--/.test(v);
const arbitrary = (v) => (v.startsWith("[") && v.endsWith("]") ? v.slice(1, -1) : v.startsWith("(") ? v : null);

/** One verdict for one class: ["fail" | "warn", reason, the class as written] or null. */
function judge(raw) {
  // A class inside a template literal's ${...} arrives with its quotes and braces: `${on ? "p-5" : ""}`.
  const token = raw.replace(/^["'{]+|["'}]+$/g, "");
  if (!token || token.includes("${") || token.length > 160) return null;
  const verdict = judgeUtility(utilityOf(token));
  return verdict && [...verdict, token];
}

function judgeUtility(u) {
  const colour = u.match(COLOUR_UTILITY);
  if (colour && RAW_COLOUR.test(colour[1])) return ["fail", "a raw colour: use a colour role (bg-paper, text-ink)"];
  if (TAILWIND_PALETTE.test(u)) return ["fail", "a Tailwind palette colour: use a role (bg-paper, text-ink); with the kit's colours off it paints nothing"];

  const size = u.match(/^text-(\[.+\]|\(.+\))(?:\/\S+)?$/);
  if (size) {
    const v = arbitrary(size[1]);
    if (readsToken(v) || RAW_COLOUR.test(v)) return null;
    return ["fail", "a type size invented on the spot: use a named text style (heading-2, body-3, caption-2)"];
  }

  const space = u.match(SPACING);
  if (space) {
    const v = space[2];
    const arb = arbitrary(v);
    if (arb !== null) return readsToken(arb) ? null : ["fail", "spacing invented on the spot: use a step of the scale"];
    if (v === "px") return ["warn", "a one-pixel nudge: is a step of the scale meant?"];
    if (/^\d+(\.\d+)?$/.test(v) && !SPACE_SCALE.has(v)) return ["fail", `spacing ${v} is off the scale (0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24)`];
    return null;
  }

  const radius = u.match(RADIUS);
  if (radius) {
    const v = radius[1] ?? "";
    const arb = arbitrary(v);
    if (arb !== null) return readsToken(arb) ? null : ["fail", "a radius invented on the spot: use the radius scale"];
    if (!RADIUS_SCALE.has(v)) return ["fail", `rounded-${v} is off the radius scale (none, xs, sm, md, lg, xl, 2xl, 3xl, full)`];
    return null;
  }

  const lt = u.match(/^(leading|tracking)-(\[.+\])$/);
  if (lt && !readsToken(lt[2])) return ["warn", `an arbitrary ${lt[1] === "leading" ? "line height" : "tracking"}: put it in the text style`];
  if (/^font-(extrabold|black|\[(800|900)\])$/.test(u)) return ["warn", "heavier than bold: interface text stops at bold"];
  if (u === "italic") return ["warn", "italic: only as the brand's one device, in a face with a true italic"];
  return null;
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

/** Every class-like token in a file, with its line number. */
function* tokens(src, ext) {
  const lineAt = (offset) => src.slice(0, offset).split("\n").length;
  const pattern =
    ext === ".css" ? /@apply\s+([^;}]+)/g : /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  for (let m; (m = pattern.exec(src)); ) {
    const body = m[1] ?? m[2] ?? m[3] ?? "";
    const start = m.index + m[0].indexOf(body);
    for (const t of body.matchAll(/\S+/g)) yield [t[0], lineAt(start + t.index)];
  }
}

const fails = [];
const warns = [];
let checked = 0;
for (const root of roots) {
  for (const file of files(root)) {
    const ext = extname(file).toLowerCase();
    if (!CODE.has(ext) && ext !== ".css") continue;
    checked++;
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    for (const [token, line] of tokens(src, ext)) {
      if (lines[line - 1]?.includes("kos-allow")) continue;
      const verdict = judge(token);
      if (!verdict) continue;
      const entry = `${relative(".", file)}:${line}  ${verdict[2]}: ${verdict[1]}`;
      (verdict[0] === "fail" ? fails : warns).push(entry);
    }
  }
}

for (const w of warns) console.log(`WARN  ${w}`);
for (const f of fails) console.log(`FAIL  ${f}`);
console.log(`\n${checked} files: ${fails.length} fail, ${warns.length} warn`);
process.exit(fails.length ? 1 : 0);
