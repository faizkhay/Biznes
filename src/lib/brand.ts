import type { CSSProperties } from "react";
import type { Business } from "@/data/businesses";

/**
 * A listing's own colours, handed to CSS as variables. A [data-ground="brand"] scope (globals.css)
 * then turns the colour roles into this brand's, so the same components paint in its colours.
 */
export const brandVars = (b: Business): CSSProperties =>
  ({
    "--brand-ground": b.brand.ground,
    "--brand-ink": b.brand.ink,
    "--brand-accent": b.brand.accent,
  }) as CSSProperties;
