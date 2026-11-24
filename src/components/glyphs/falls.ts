// What falls over the landing page (src/components/Leaves.tsx), drawn on the icons' 24px grid.
// Each is a body, filled, and a few lines on it: a vein, or where the light falls. Which one a
// season uses, and its name, is FALLS in src/data/themes.ts; its two colours are globals.css.
import type { FALLS } from "@/data/themes";

export type FallShape = (typeof FALLS)[keyof typeof FALLS]["shape"];

export const FALL_SHAPES: Record<FallShape, { body: string; line: string }> = {
  // A flamboyant's petal: a spoon on a narrow claw.
  petal: { body: "M12 22.5c-.4-3.2-1.2-5-3.4-7.4C6.3 12.6 5 10.4 5 8a7 7 0 0 1 14 0c0 2.4-1.3 4.6-3.6 7.1-2.2 2.4-3 4.2-3.4 7.4Z", line: "M12 18c.3-3.6.3-7.4 0-11M9.2 8.6 12 11l2.8-2.4" },
  // A green leaf, pointed at both ends, with its midrib.
  leaf: { body: "M12 2C7 6.5 5 10.5 5 14c0 4 3 7 7 8 4-1 7-4 7-8 0-3.5-2-7.5-7-12Z", line: "M12 22V7.5M12 12l3.2-2.4M12 12 8.8 9.6M12 16.5l3.8-2.7M12 16.5l-3.8-2.7" },
  // A wisp of cane flower: a thin spine and its down.
  wisp: { body: "M12 2c1.5 5 1.5 14 0 20-1.5-6-1.5-15 0-20Z", line: "M12 7.5 15.5 4.5M12 7.5 8.5 4.5M12 12l5-3.5M12 12 7 8.5M12 16.5l4-3M12 16.5 8 13.5" },
  // A dry leaf, broad at the shoulder, with its veins.
  broad: { body: "M12 21.5c-4.5-1.2-7.5-4.5-7.5-9 0-4 3-7.8 7.5-10 4.5 2.2 7.5 6 7.5 10 0 4.5-3 7.8-7.5 9Z", line: "M12 23V5.5M12 10l4-2.5M12 10 8 7.5M12 14.5l5-2.7M12 14.5l-5-2.7" },
  // A bougainvillea's petal: paper thin, pointed, veined like a leaf.
  bract: { body: "M12 2.5c3 2 6.5 5.5 6.5 10.5 0 4-2.8 7.5-6.5 8.5-3.7-1-6.5-4.5-6.5-8.5 0-5 3.5-8.5 6.5-10.5Z", line: "M12 21.5V6M12 11c2-.5 3.5-1.5 4.5-3M12 11c-2-.5-3.5-1.5-4.5-3M12 15.5c2-.5 4-1.8 5-3.5M12 15.5c-2-.5-4-1.8-5-3.5" },
};
