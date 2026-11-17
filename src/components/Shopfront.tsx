import { useId, type CSSProperties } from "react";
import { type Business, wordmarkFor } from "@/data/businesses";

/**
 * A business as it stands on the street, drawn front-on: a tin roof with its lambrequin, a wall in
 * the business's own colour, its sign with its own lettering under two lamps, and a roller shutter
 * over a lit, empty room. It is the catalogue's picture of a business, and it stands in for the 3D
 * street wherever WebGL is not available, so the two are drawn from the same data and the same
 * measured colours (globals.css, "The street's own materials").
 *
 * The shutter is one group inside a clipped opening. A link around the shopfront raises it on hover
 * and on focus (globals.css, .shopfront); `open` raises it for good. The name is real text beside
 * the picture, so the drawing is decoration to a screen reader unless `label` asks otherwise.
 *
 * Every measurement is in the drawing's own units (240 by 250). Nothing here is text a visitor
 * needs: the sign's lettering is the business's wordmark, an outline.
 */
export default function Shopfront({
  business: b,
  open = false,
  label = false,
  className,
}: {
  business: Business;
  /** The shutter is up and the room is lit. */
  open?: boolean;
  /** True where no text nearby names the business, so the drawing must. */
  label?: boolean;
  className?: string;
}) {
  const id = useId();
  const mark = wordmarkFor(b.slug);
  // The lettering sits inside the board with room to breathe: at most 136 wide and 22 tall.
  const scale = Math.min(136 / mark.w, 22 / mark.h);
  const mw = Math.round(mark.w * scale * 100) / 100;
  const mh = Math.round(mark.h * scale * 100) / 100;
  const colours = { "--wall": b.brand.wall, "--board": b.brand.ground, "--letter": b.brand.ink, "--trim": b.brand.accent } as CSSProperties;

  return (
    <svg
      viewBox="0 0 240 250"
      className={["shopfront block h-auto w-full", className].filter(Boolean).join(" ")}
      style={colours}
      data-open={open}
      focusable="false"
      {...(label ? { role: "img", "aria-label": `${b.name}'s shopfront` } : { "aria-hidden": true })}
    >
      <defs>
        <clipPath id={`${id}-opening`}>
          <rect x="44" y="118" width="152" height="108" />
        </clipPath>
        {/* The ribs of a tin roof, and the slats of a shutter: one stroke each, repeated. */}
        <pattern id={`${id}-ribs`} width="8" height="40" patternUnits="userSpaceOnUse">
          <rect width="8" height="40" fill="var(--palette-tin)" />
          <rect x="5.5" width="2.5" height="40" fill="var(--palette-tin-shade)" />
        </pattern>
        <pattern id={`${id}-slats`} width="152" height="7" patternUnits="userSpaceOnUse">
          <rect width="152" height="7" fill="var(--palette-steel)" />
          <rect y="5.5" width="152" height="1.5" fill="var(--palette-steel-deep)" />
        </pattern>
        {/* The lambrequin: the cut fringe under a creole roof. One tooth, repeated. */}
        <pattern id={`${id}-fringe`} width="12" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 0h12v6a6 6 0 0 1-12 0z" fill="var(--palette-limewash)" />
          <circle cx="6" cy="6" r="1.6" fill="var(--wall)" />
        </pattern>
      </defs>

      {/* The roof and its fringe */}
      <rect x="0" y="4" width="240" height="38" fill={`url(#${id}-ribs)`} />
      <rect x="0" y="2" width="240" height="4" fill="var(--palette-limewash)" />

      {/* The wall, its two pilasters and its plinth */}
      <rect x="6" y="42" width="228" height="196" fill="var(--wall)" />
      <rect x="0" y="42" width="240" height="14" fill={`url(#${id}-fringe)`} />
      <g fill="none" stroke="var(--palette-limewash)" strokeOpacity="0.45" strokeWidth="1.5">
        <rect x="12" y="66" width="18" height="160" />
        <rect x="210" y="66" width="18" height="160" />
      </g>

      {/* The sign: a board in the brand's ground, a thin frame in its trim, its own lettering */}
      <rect x="40" y="64" width="160" height="42" rx="2" fill="var(--board)" />
      <rect x="43.5" y="67.5" width="153" height="35" rx="1" fill="none" stroke="var(--trim)" strokeWidth="1.25" />
      <svg x={120 - mw / 2} y={85 - mh / 2} width={mw} height={mh} viewBox={`0 0 ${mark.w} ${mark.h}`}>
        <path d={mark.d} fill="var(--letter)" />
      </svg>
      {/* Two lamps over the sign */}
      {[78, 162].map((x) => (
        <g key={x}>
          <path d={`M${x} 50v6`} stroke="var(--trim)" strokeWidth="1.5" strokeLinecap="round" />
          <path d={`M${x - 6} 62l3 -6h6l3 6z`} fill="var(--trim)" />
          <circle cx={x} cy="62.5" r="2" fill="var(--palette-saffron)" />
        </g>
      ))}

      {/* The room behind the shutter: lit, and empty */}
      <g clipPath={`url(#${id}-opening)`}>
        <rect x="44" y="118" width="152" height="108" fill="var(--palette-lamplight-wall)" />
        <path d="M44 226l22 -26h108l22 26z" fill="var(--palette-lamplight)" />
        <path d="M66 118v82M174 118v82" stroke="var(--palette-lamplight)" strokeWidth="1" />
        {/* The shutter: slats, a bottom rail and its handle */}
        <g className="shutter" style={{ transformBox: "fill-box" }}>
          <rect x="44" y="118" width="152" height="108" fill={`url(#${id}-slats)`} />
          <rect x="44" y="219" width="152" height="7" fill="var(--palette-steel-deep)" />
          <rect x="112" y="213" width="16" height="3" rx="1.5" fill="var(--palette-limewash)" fillOpacity="0.7" />
        </g>
      </g>
      {/* The shutter's housing, and the kerb */}
      <rect x="40" y="110" width="160" height="9" fill="var(--wall)" />
      <rect x="40" y="110" width="160" height="9" fill="var(--palette-ink)" fillOpacity="0.28" />
      <rect x="0" y="236" width="240" height="14" fill="var(--palette-pavement)" />
    </svg>
  );
}
