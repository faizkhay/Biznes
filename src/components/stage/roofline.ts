// Where the painted street's roofline falls on the stage, so the home page's first words can keep
// above it.
//
// The first view shows the street plate anchored to the stage's foot and right edge, covering it
// (views.ts, "street"). On a short or narrow screen that brings the roofs up under the words. No
// frame is moved for it: the words are shaped instead. A float fills the words' column and is
// given this roofline as its `shape-outside`, so every line of the headline, the lede and the
// actions ends before the roofs, and the words sit in the sky whatever the screen's shape.
//
// Plain arithmetic, shared by the stage (which measures the real boxes) and the prerendered page
// (which assumes the house desk, 1440 by 900).
import { PLATES, STREET } from "@/data/plates";

/** A box on the stage, in its pixels: where the words' column stands. */
export type Box = { left: number; top: number; width: number; height: number };

/**
 * The roofline as a CSS polygon in the words' box: everything on and under the roofs, which the
 * words must keep out of. `W` and `H` are the stage's size.
 */
export function rooflinePolygon(W: number, H: number, box: Box): string {
  const p = PLATES.street;
  // The street plate covers the stage from its foot and its right edge.
  const s = Math.max(H / p.h, W / p.w);
  const x0 = W - p.w * s;
  const y0 = H - p.h * s;
  const points = STREET.roofline.map(([fx, fy]) => [x0 + fx * p.w * s - box.left, y0 + fy * p.h * s - box.top]);
  const px = (v: number) => `${v.toFixed(1)}px`;
  const first = points[0];
  const last = points[points.length - 1];
  return (
    "polygon(" +
    [
      // Down the left edge from the roofline's start, so nothing is set under the street.
      `${px(Math.min(0, first[0]))} ${px(first[1])}`,
      ...points.map(([x, y]) => `${px(x)} ${px(y)}`),
      // Out past the right edge and round the foot.
      `${px(Math.max(box.width, last[0]))} ${px(last[1])}`,
      `${px(box.width)} ${px(box.height)}`,
      `${px(Math.min(0, first[0]))} ${px(box.height)}`,
    ].join(", ") +
    ")"
  );
}

/**
 * The polygon for the prerendered page, before the stage has measured anything: the house desk
 * (1440 by 900, with its 72px gutters and header), written in parts of the words' column so it
 * holds roughly on any desk.
 */
export const ROOFLINE_AT_REST = (() => {
  const box = { left: 72, top: 32, width: 1296, height: 756 };
  return rooflinePolygon(1440, 828, box).replace(/(-?[\d.]+)px (-?[\d.]+)px/g, (_, x, y) => `${((Number(x) / box.width) * 100).toFixed(2)}% ${((Number(y) / box.height) * 100).toFixed(2)}%`);
})();
