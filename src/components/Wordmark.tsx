import type { CSSProperties } from "react";
import { wordmarkFor } from "@/data/businesses";

/**
 * A business's own lettering, drawn as outlines (scripts/make-wordmarks.mjs), in the current colour.
 *
 * Names differ a great deal in shape: SOUFFLE, tracked wide, is nearly eight times as wide as it is
 * tall, and Bouké barely three. Given the same width they would not look the same size, so each is
 * given a width that grows with the square root of its proportions, which keeps the area of ink
 * roughly equal from one tag to the next.
 */
export default function Wordmark({
  slug,
  name,
  decorative = false,
  scale = 1,
  className,
}: {
  slug: string;
  name: string;
  /** True where the name is already written in words nearby, so it is not read twice. */
  decorative?: boolean;
  /** A multiplier on the balanced width, for a larger plate. */
  scale?: number;
  className?: string;
}) {
  const mark = wordmarkFor(slug);
  const width = Math.min(86, Math.round(26 * Math.sqrt(mark.w / mark.h) * scale));
  const style: CSSProperties = { width: `${width}%`, aspectRatio: `${mark.w} / ${mark.h}` };
  return (
    <svg
      viewBox={`0 0 ${mark.w} ${mark.h}`}
      style={style}
      className={["block h-auto", className].filter(Boolean).join(" ")}
      fill="currentColor"
      focusable="false"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      <path d={mark.d} />
    </svg>
  );
}
