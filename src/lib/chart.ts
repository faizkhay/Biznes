/**
 * The chart: where a longitude and a latitude fall on the site's one drawing of the island.
 *
 * Every picture of the island on the site (the first screen, a search's results, a listing's
 * locator, a town's page) is this one chart, so a point is always in the same place. It is a plain
 * equirectangular projection, scaled at the island's own latitude, in a box 1000 units wide.
 * Rodrigues lies some 600 km to the east, so, as an atlas does, it is drawn in an inset at the
 * chart's south-east corner, at a smaller scale, and the inset says so.
 */
import { index, type Listing } from "./index";

/** The chart's width in its own units. Everything else follows from the data. */
export const CHART_W = 1000;
/** Sea left around the island, in degrees. */
const MARGIN = 0.03;
/** Rodrigues is drawn at this fraction of the main chart's scale. */
const INSET_SCALE = 0.72;
const INSET_PAD = 10;
const INSET_GAP = 8;

type Chart = {
  h: number;
  /** [lon, lat] to chart units, on the main chart. */
  main: (lon: number, lat: number) => [number, number];
  /** [lon, lat] to chart units, inside the Rodrigues inset. */
  inset: (lon: number, lat: number) => [number, number];
  insetBox: { x: number; y: number; w: number; h: number };
  /** Degrees of longitude and latitude at which the chart draws a line. */
  meridians: number[];
  parallels: number[];
  /** Kilometres between the two islands' middles, for the inset's label. */
  apartKm: number;
};

let made: Chart | undefined;

export function chart(): Chart {
  if (made) return made;
  const { geo } = index();
  const [w, s, e, n] = geo.mauritius.box;
  const west = w - MARGIN;
  const north = n + MARGIN;
  const cos = Math.cos((((s + n) / 2) * Math.PI) / 180);
  const k = CHART_W / ((e - w + 2 * MARGIN) * cos);
  const h = Math.round((n - s + 2 * MARGIN) * k);
  const main = (lon: number, lat: number): [number, number] => [(lon - west) * cos * k, (north - lat) * k];

  const [rw, rs, re, rn] = geo.rodrigues.box;
  const rk = k * INSET_SCALE;
  const innerW = (re - rw) * cos * rk;
  const innerH = (rn - rs) * rk;
  const insetBox = { w: Math.round(innerW + 2 * INSET_PAD), h: Math.round(innerH + 2 * INSET_PAD), x: 0, y: 0 };
  insetBox.x = CHART_W - INSET_GAP - insetBox.w;
  insetBox.y = h - INSET_GAP - insetBox.h;
  const inset = (lon: number, lat: number): [number, number] => [insetBox.x + INSET_PAD + (lon - rw) * cos * rk, insetBox.y + INSET_PAD + (rn - lat) * rk];

  const every = (from: number, to: number) => {
    const out: number[] = [];
    for (let v = Math.ceil(from * 10) / 10; v <= to; v = Math.round((v + 0.1) * 10) / 10) out.push(v);
    return out;
  };
  const rad = Math.PI / 180;
  const apartKm = Math.round((Math.hypot(((rw + re) / 2 - (w + e) / 2) * cos, (rs + rn) / 2 - (s + n) / 2) * rad * 6371) / 10) * 10;

  made = { h, main, inset, insetBox, meridians: every(west, e + MARGIN), parallels: every(s - MARGIN, north), apartKm };
  return made;
}

/** Where a listing is on the chart, or null if it has no place on it. */
export function pointOf(l: Pick<Listing, "lon" | "lat" | "region">): [number, number] | null {
  if (l.lon == null || l.lat == null) return null;
  const c = chart();
  if (l.region === "rodrigues") return c.inset(l.lon, l.lat);
  if (l.region === "mauritius") return c.main(l.lon, l.lat);
  return null;
}

const d1 = (v: number) => Math.round(v * 10) / 10;

/** An SVG path for rings of [lon, lat], through one of the chart's two projections. */
export function ringsPath(rings: [number, number][][], project: (lon: number, lat: number) => [number, number], close = true): string {
  return rings
    .map((ring) => {
      const pts = ring.map(([lon, lat]) => project(lon, lat));
      return `M${pts.map(([x, y]) => `${d1(x)} ${d1(y)}`).join("L")}${close ? "Z" : ""}`;
    })
    .join("");
}

/**
 * Every listing's point, in listing order, as whole tenths of a chart unit: [x0, y0, x1, y1, ...].
 * The canvas draws these; `pointIndex` says which position a listing has in the list.
 */
let points: { flat: number[]; at: Map<string, number> } | undefined;
export function chartPoints() {
  if (points) return points;
  const flat: number[] = [];
  const at = new Map<string, number>();
  for (const l of index().listings) {
    const p = pointOf(l);
    if (!p) continue;
    at.set(l.id, flat.length / 2);
    flat.push(Math.round(p[0] * 10), Math.round(p[1] * 10));
  }
  points = { flat, at };
  return points;
}

/**
 * The island as dots, for the picture that needs no script: listings gathered into cells of a grid,
 * a cell's dot larger the more it holds. Returns three path strings, faintest first; each is a run
 * of zero-length strokes, which a round line cap draws as dots.
 */
let halftone: [string, string, string] | undefined;
export function chartHalftone(): [string, string, string] {
  if (halftone) return halftone;
  const CELL = 9;
  const cells = new Map<number, number>();
  const { flat } = chartPoints();
  for (let i = 0; i < flat.length; i += 2) {
    const key = Math.floor(flat[i] / 10 / CELL) * 4096 + Math.floor(flat[i + 1] / 10 / CELL);
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const out: [string[], string[], string[]] = [[], [], []];
  for (const [key, count] of cells) {
    const x = Math.floor(key / 4096) * CELL + CELL / 2;
    const y = (key % 4096) * CELL + CELL / 2;
    out[count >= 8 ? 2 : count >= 3 ? 1 : 0].push(`M${x} ${y}h0`);
  }
  halftone = [out[0].join(""), out[1].join(""), out[2].join("")];
  return halftone;
}

/** Degrees as a chart writes them: 57.5 east is "57°30′E". */
export function degrees(value: number, axis: "lon" | "lat"): string {
  const abs = Math.abs(value);
  const whole = Math.floor(abs + 1e-9);
  const minutes = Math.round((abs - whole) * 60);
  const letter = axis === "lon" ? (value < 0 ? "W" : "E") : value < 0 ? "S" : "N";
  return `${whole}°${String(minutes).padStart(2, "0")}′${letter}`;
}
