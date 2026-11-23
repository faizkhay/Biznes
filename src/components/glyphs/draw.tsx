// How one of the site's own icons is drawn. Every icon is a line drawing on a 24 by 24 grid, in
// 1.5px round strokes of the current colour, with exactly one small solid point: the lit point of
// the brand (DESIGN.md, "The lit point"), placed where it means something. A drawing is kept as
// data: the path of its lines, and where its point sits.
//
// The point takes the current colour, so on an ink tile, where the icon is saffron, it is a solid
// saffron point. Where the icon is drawn in ink on paper or on a white card, the point may take
// the signal colour instead: give the icon `lit`, or set `--glyph-point` on anything around it.
// The point always keeps a thin ring of the current colour, so a lit point is saffron inside a
// ring of ink, as the b of the name is, and never saffron alone on a light ground.
import type { CSSProperties, SVGProps } from "react";

export type GlyphProps = SVGProps<SVGSVGElement> & {
  /** The point in the signal colour, for an icon drawn in ink on a light ground. */
  lit?: boolean;
};

/** The lines of an icon, where its point sits, the point's radius, and a turn for the lines. */
export type Drawing = readonly [d: string, x: number, y: number, r?: number, turn?: string];

/** What the point is filled with: the signal colour where a page asks for it, else the icon's own. */
export const POINT = "var(--glyph-point, currentColor)";
/** The ring of the current colour round the point: enough to hold saffron on a light ground. */
export const RING = 0.75;
/** The point's radius, ring included, unless a drawing asks for another. */
export const RADIUS = 2;

const LIT = { "--glyph-point": "var(--color-signal)" } as CSSProperties;

/** The frame every icon shares. Decoration beside words, so it is hidden from assistive technology. */
export function Frame({ lit, style, children, ...p }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...p} style={lit ? { ...style, ...LIT } : style} aria-hidden focusable={false}>
      {children}
    </svg>
  );
}

/** The one solid point. */
export function Point({ x, y, r = RADIUS }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r - RING / 2} fill={POINT} strokeWidth={RING} />;
}

/** One icon, from its drawing. */
export function Glyph({ drawing: [d, x, y, r, turn], ...p }: GlyphProps & { drawing: Drawing }) {
  return (
    <Frame {...p}>
      <path d={d} fill="none" transform={turn} />
      <Point x={x} y={y} r={r} />
    </Frame>
  );
}

/** A circle, as part of a path. */
export const ring = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** A rectangle with rounded corners, as part of a path. */
export const box = (x: number, y: number, w: number, h: number, r = 0) =>
  r
    ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}Z`
    : `M${x} ${y}h${w}v${h}h${-w}Z`;
