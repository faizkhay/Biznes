#!/usr/bin/env node
// The district icons, drawn from the island itself. Reads the outlines the crawler keeps
// (data/index/geo.json: the coast of Mauritius, the coast of Rodrigues, and each district's
// boundary, in longitude and latitude) and writes them small enough for a 24 by 24 icon:
// src/data/district-shapes.ts. src/components/Glyphs.tsx draws each district as the island in
// line with that district filled.
//
//   node scripts/district-icons.mjs          (npm run icons:districts)
//
// What it does to an outline:
//   - lays it flat (one degree of longitude is shorter than one of latitude this far south);
//   - fits Mauritius, and Rodrigues apart, into the icon's grid;
//   - smooths it, because a bay a quarter of a unit wide is only noise under a line one and a half
//     units thick: each point becomes the middle of the stretch of line around it;
//   - drops points until none that is left out sat further than TOLERANCE from the line
//     (Douglas and Peucker's method), and rounds what is left to a tenth of a unit;
//   - builds each district from its inland boundary and the same simplified coast, so the filled
//     part and the island's line agree exactly where they meet.
//
// Run it again whenever the crawler has written a new geo.json. No dependencies.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const geo = JSON.parse(readFileSync(join(root, "data/index/geo.json"), "utf8"));

const GRID = 24;
/** How far along the line, each way, a point is averaged with its neighbours, in units of the grid. */
const SOFTEN = 0.9;
/** The spacing of the points the smoothing works on. */
const STEP = 0.1;
/** The furthest a dropped point may have sat from the line that replaces it, in units of the grid. */
const TOLERANCE = 0.16;
/** A district vertex this near the coast (in units of the grid) is on the coast. */
const ON_COAST = 0.1;
/** A district smaller than this (in square units) is drawn as the set's one round point. */
const SMALL = 7;

const longest = (rings) => rings.slice().sort((a, b) => b.length - a.length)[0];
const round = (n) => Math.round(n * 10) / 10;

/** A projection that fits a coast into the grid: `across` units wide at most, `down` tall at most. */
function fit(coast, across, down) {
  const lats = coast.map((p) => p[1]);
  const lons = coast.map((p) => p[0]);
  const k = Math.cos((((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI) / 180);
  const w = (Math.max(...lons) - Math.min(...lons)) * k;
  const h = Math.max(...lats) - Math.min(...lats);
  const scale = Math.min(across / w, down / h);
  const left = (GRID - w * scale) / 2;
  const top = (GRID - h * scale) / 2;
  return ([lon, lat]) => [left + (lon - Math.min(...lons)) * k * scale, top + (Math.max(...lats) - lat) * scale];
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The nearest point of the segment a to b, and how far it is. */
function nearest(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) : 0;
  const at = [a[0] + t * dx, a[1] + t * dy];
  return { at, t, far: distance(p, at) };
}

/** Douglas and Peucker: an open line with the points that matter. */
function thin(line, tolerance) {
  if (line.length < 3) return line.slice();
  let worst = 0;
  let index = 0;
  for (let i = 1; i < line.length - 1; i++) {
    const { far } = nearest(line[i], line[0], line[line.length - 1]);
    if (far > worst) [worst, index] = [far, i];
  }
  if (worst <= tolerance) return [line[0], line[line.length - 1]];
  return [...thin(line.slice(0, index + 1), tolerance).slice(0, -1), ...thin(line.slice(index), tolerance)];
}

/** Points every STEP along a line; a closed ring comes back to where it began. */
function evenly(line, closed) {
  const path = closed ? [...line, line[0]] : line;
  const out = [path[0]];
  let left = STEP;
  for (let i = 1; i < path.length; i++) {
    let from = path[i - 1];
    let span = distance(from, path[i]);
    while (span >= left) {
      const t = left / span;
      from = [from[0] + (path[i][0] - from[0]) * t, from[1] + (path[i][1] - from[1]) * t];
      out.push(from);
      span = distance(from, path[i]);
      left = STEP;
    }
    left -= span;
  }
  if (!closed) out.push(path[path.length - 1]);
  return out;
}

/** A line with its small bays and spurs smoothed away. An open line keeps its two ends. */
function soften(line, closed) {
  const points = evenly(line, closed);
  const reach = Math.round(SOFTEN / STEP);
  const n = points.length;
  return points.map((_, i) => {
    const k = closed ? reach : Math.min(reach, i, n - 1 - i);
    let x = 0;
    let y = 0;
    for (let j = i - k; j <= i + k; j++) {
      const p = points[((j % n) + n) % n];
      x += p[0];
      y += p[1];
    }
    return [x / (2 * k + 1), y / (2 * k + 1)];
  });
}

/** The same for a closed ring: cut at its two furthest points, thin each half. */
function thinRing(ring, tolerance) {
  let far = 0;
  for (let i = 1; i < ring.length; i++) if (distance(ring[0], ring[i]) > distance(ring[0], ring[far])) far = i;
  const first = thin(ring.slice(0, far + 1), tolerance);
  const second = thin([...ring.slice(far), ring[0]], tolerance);
  return [...first.slice(0, -1), ...second.slice(0, -1)];
}

/** Where on a closed ring a point falls: the segment it is nearest, and how far along it. */
function onRing(p, ring) {
  let best = { far: Infinity };
  for (let i = 0; i < ring.length; i++) {
    const found = nearest(p, ring[i], ring[(i + 1) % ring.length]);
    if (found.far < best.far) best = { ...found, i };
  }
  return best;
}

/** The ring's own vertices between two places on it, walking forwards. */
function walk(ring, from, to) {
  const out = [];
  let i = from.i;
  if (from.i === to.i && from.t <= to.t) return out;
  do {
    i = (i + 1) % ring.length;
    out.push(ring[i]);
  } while (i !== to.i);
  return out;
}

const lengthOf = (line) => line.slice(1).reduce((sum, p, i) => sum + distance(line[i], p), 0);

function area(ring) {
  let twice = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    twice += x1 * y2 - x2 * y1;
  }
  return Math.abs(twice) / 2;
}

function centre(ring) {
  let twice = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    twice += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  return [cx / (3 * twice), cy / (3 * twice)];
}

const path = (ring) => "M" + ring.map(([x, y]) => `${round(x)} ${round(y)}`).join("L") + "Z";

// Mauritius: the main island, nearly the height of the grid.
const mainland = longest(geo.mauritius.coast);
const toGrid = fit(mainland, 19, 19.5);
const coast = mainland.map(toGrid);
const island = thinRing(soften(coast, true), TOLERANCE);

// Rodrigues: an island of its own, drawn smaller because all of it is filled.
const rodrigues = longest(geo.rodrigues.coast);
const rodriguesIsland = thinRing(soften(rodrigues.map(fit(rodrigues, 17, 17)), true), TOLERANCE);

const parts = {};
for (const district of geo.districts) {
  if (district.slug === "rodrigues") {
    parts[district.slug] = { island: "rodrigues", ring: rodriguesIsland };
    continue;
  }
  const ring = longest(district.rings).map(toGrid);
  const shore = ring.map((p) => onRing(p, coast).far < ON_COAST);
  let shape;
  if (!shore.includes(true)) {
    // A district with no coast: its own boundary, thinned.
    shape = thinRing(soften(ring, true), TOLERANCE);
  } else {
    // Turn the ring so that it starts where the coast starts, then split it: coast, then inland.
    const n = ring.length;
    let start = 0;
    while (!(shore[start] && !shore[(start - 1 + n) % n])) start++;
    const turned = [...ring.slice(start), ...ring.slice(0, start)];
    const flags = [...shore.slice(start), ...shore.slice(0, start)];
    let end = 0;
    while (end + 1 < n && flags[end + 1]) end++;
    if (flags.slice(end + 1).includes(true)) throw new Error(`${district.slug}: the coast is in more than one stretch`);
    const inland = thin(soften([turned[end], ...turned.slice(end + 1), turned[0]], false), TOLERANCE);
    // The coast between the two ends, taken from the island's own line: the shorter way round.
    const a = onRing(turned[end], island);
    const b = onRing(turned[0], island);
    const one = [b.at, ...walk(island, b, a), a.at];
    const other = [a.at, ...walk(island, a, b), b.at].reverse();
    const along = lengthOf(one) <= lengthOf(other) ? one : other;
    shape = [a.at, ...inland.slice(1, -1), ...along.slice(0, -1)];
  }
  parts[district.slug] = { island: "mauritius", ring: shape };
}

const lines = [];
lines.push("// The island and its districts, small enough for an icon. Written by scripts/district-icons.mjs");
lines.push("// from data/index/geo.json (the coast and the district boundaries the crawler keeps), on a 24 by");
lines.push("// 24 grid. Never edited by hand: run `npm run icons:districts` after a crawl.");
lines.push("");
lines.push("/** The coast of each island, as the path of an icon. */");
lines.push("export const ISLANDS = {");
lines.push(`  mauritius: "${path(island)}",`);
lines.push(`  rodrigues: "${path(rodriguesIsland)}",`);
lines.push("} as const;");
lines.push("");
lines.push("/**");
lines.push(" * Each district by its slug: the island it is on, its own outline, and its middle. A district too");
lines.push(" * small to see as a shape (`point`) is drawn as a round point at its middle.");
lines.push(" */");
lines.push("export const DISTRICT_SHAPES: Record<string, { island: keyof typeof ISLANDS; part: string; x: number; y: number; point: boolean }> = {");
for (const [slug, { island: on, ring }] of Object.entries(parts)) {
  const [x, y] = centre(ring);
  lines.push(`  "${slug}": { island: "${on}", part: "${path(ring)}", x: ${round(x)}, y: ${round(y)}, point: ${area(ring) < SMALL} },`);
}
lines.push("};");
lines.push("");

const out = join(root, "src/data/district-shapes.ts");
writeFileSync(out, lines.join("\n"));
console.log(`wrote src/data/district-shapes.ts: Mauritius in ${island.length} points, Rodrigues in ${rodriguesIsland.length}`);
for (const [slug, { ring }] of Object.entries(parts)) console.log(`  ${slug.padEnd(20)} ${String(ring.length).padStart(3)} points, ${area(ring).toFixed(1)} square units`);
