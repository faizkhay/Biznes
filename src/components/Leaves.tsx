import type { CSSProperties } from "react";
import { FALLS, type FallId } from "@/data/themes";
import { FALL_SHAPES } from "./glyphs/falls";

/**
 * Each piece: where across the screen it starts (%), how large it is (rem), how long it takes to
 * fall (s), how far into its fall it is when the page opens (s), how far the wind carries it (vw),
 * how long one swing takes (s), and the two angles it turns between (deg). They are written down
 * and not drawn by lot, so the page the server makes and the page the browser makes are the same.
 * The first eight are the ones a phone shows.
 */
const PIECES = [
  [6, 1.5, 21, 2, 7, 4.4, -24, 38],
  [31, 1.125, 26, 14, 5, 5.2, 12, -40],
  [58, 1.75, 19, 8, 9, 3.8, -50, 18],
  [84, 1.375, 24, 19, 4, 4.8, 30, -22],
  [18, 1.25, 28, 23, 6, 5.6, -10, 46],
  [71, 1.5, 22, 11, 8, 4.2, 44, -16],
  [44, 1.375, 25, 5, 5, 5, -36, 24],
  [93, 1.125, 20, 16, 3, 4.6, 20, -48],
  [12, 1.875, 23, 9, 10, 4, -18, 52],
  [37, 1.375, 27, 21, 6, 5.4, 40, -12],
  [52, 1.25, 21, 17, 8, 4.5, -44, 14],
  [65, 1.75, 29, 3, 7, 5.8, 16, -34],
  [78, 1.125, 24, 13, 5, 4.3, -28, 30],
  [25, 1.5, 20, 6, 9, 3.9, 34, -26],
] as const;

/**
 * What falls over the landing page: a few petals or leaves of the season, between the picture and
 * the words. Decoration only: hidden from assistive technology, and not shown at all until the
 * control (LeavesToggle) says a visitor may have motion. How it moves is globals.css, ".leaves".
 */
export default function Leaves({ fall }: { fall: FallId }) {
  const { body, line } = FALL_SHAPES[FALLS[fall].shape];
  return (
    <div className="leaves" data-fall={fall} aria-hidden="true">
      {PIECES.map(([x, size, time, into, drift, sway, from, to], i) => (
        <span key={i} className="leaf" style={{ "--x": `${x}%`, "--size": `${size}rem`, "--time": `${time}s`, "--wait": `-${into}s`, "--drift": `${drift}vw`, "--sway": `${sway}s`, "--from": `${from}deg`, "--to": `${to}deg` } as CSSProperties}>
          <svg viewBox="0 0 24 24" focusable="false">
            <path className="leaf-body" d={body} />
            <path className="leaf-line" d={line} />
          </svg>
        </span>
      ))}
    </div>
  );
}
