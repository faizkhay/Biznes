// The kinds of food on Baz Manzer (src/lib/food.ts): the map's own word for a place's cuisine,
// turned into an id. The twenty most listed are drawn; several words share a drawing where they
// mean the same table ("Regional", "Local", "Mauritian" and "Creole" are the island's own cooking).
// A kind with no drawing takes the fork and knife.
import { box, type Drawing } from "./draw";
import { CHIPS } from "./directory";

/** A pot on the fire: the island's own cooking. The point is the flame. */
const POT: Drawing = ["M5 7.5h14V13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7.5ZM3.5 7.5h17M10 5h4M7.5 18.5v2M16.5 18.5v2", 12, 19.5];
/** A bowl and chopsticks; the point is what they hold. */
const BOWL: Drawing = ["M3 11.5h18a9 9 0 0 1-18 0ZM9 20.5h6M20.5 2.5 12.5 7M21.5 5.5 13 8.5", 10.5, 8.25];
/** A slice of pizza. */
const PIZZA: Drawing = ["M12 21 4 7.5c2.5-1.5 5-2.5 8-2.5s5.5 1 8 2.5L12 21ZM5.5 10c2-1 4-1.5 6.5-1.5s4.5.5 6.5 1.5", 12, 13.5];
const BURGER: Drawing = ["M4 11.5c0-4 3.5-7 8-7s8 3 8 7H4ZM3.5 14.5c1.4-1.5 2.8 1.5 4.25 0s2.8 1.5 4.25 0 2.8 1.5 4.25 0 2.8 1.5 4.25 0M4.5 17.5h15v1a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-1Z", 12, 8, 1.75];
/** A chilli. */
const CHILLI: Drawing = ["M15.5 7c1 3.5-.5 7.5-3.5 10-2 1.7-4.5 2.5-7 2.5 2-1.5 3.5-3.5 4.5-6 .7-1.8 1-4 1-6M13.5 4c.5-1 1.5-1.5 3-1.5", 13, 6, 2.25];
/** A drumstick with a bite out of it; the point is the end of the bone. */
const DRUMSTICK: Drawing = ["M8.5 15 9 8.6a5.5 5.5 0 0 1 7.3-4.8 2.75 2.75 0 0 0 3.4 3.4 5.5 5.5 0 0 1-4.8 7.3L8.5 15ZM8.5 15l-2 2", 5, 18.5];
/** The world, and one place on it. */
const WORLD: Drawing = ["M3.5 12a8.5 8.5 0 1 0 17 0 8.5 8.5 0 1 0-17 0ZM3.5 12h17M12 3.5c-2.5 2.4-3.5 5.2-3.5 8.5s1 6.1 3.5 8.5", 15.5, 8, 1.75];
/** A plate of spaghetti; the point is the sauce on top. */
const PASTA: Drawing = ["M2.5 16h19M5 16c.5 2.5 3 4.5 7 4.5s6.5-2 7-4.5M5.5 16c0-4 2.8-7 6.5-7s6.5 3 6.5 7M9 16c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5M16.5 10l4-5.5", 12, 8, 2.25];
/** A scallop shell; the point is its hinge. */
const SHELL: Drawing = ["M12 17.5C7.5 16.5 3.5 13.5 3.5 9.5c0-3.5 3.5-6 8.5-6s8.5 2.5 8.5 6c0 4-4 7-8.5 8ZM12 17 8 4.5M12 17V3.5M12 17l4-12.5", 12, 19];
/** A fish; the point is its eye. */
const FISH: Drawing = ["M3 12c2.5-4 6-6 9.5-6 3 0 5 1.5 6.5 3.5l2.5-2.5v10L19 14.5c-1.5 2-3.5 3.5-6.5 3.5-3.5 0-7-2-9.5-6ZM12 8.5c1 2 1 5 0 7", 7.5, 11, 1.75];
/** A cup to take away. */
const CUP: Drawing = ["M6 7.5h12M7.5 7.5l1-3.5h7l1 3.5M6.5 7.5 8 20.5h8l1.5-13", 12, 13.75];
/** A cook's tall hat. */
const TOQUE: Drawing = [box(7.5, 15, 9, 5, 1) + "M7.5 15c-2.5-.5-4-2.3-4-4.5C3.5 8 5.5 6 8 6c.3 0 .7 0 1 .1a3.5 3.5 0 0 1 6 0c.3-.1.7-.1 1-.1 2.5 0 4.5 2 4.5 4.5 0 2.2-1.5 4-4 4.5", 12, 10.5];
/** A filled roll on a stick; the point is the olive. */
const SANDWICH: Drawing = ["M4 12c0-2.5 2-4.5 4.5-4.5h7c2.5 0 4.5 2 4.5 4.5H4ZM3.5 14.5c1.4-1.5 2.8 1.5 4.25 0s2.8 1.5 4.25 0 2.8 1.5 4.25 0 2.8 1.5 4.25 0M4.5 17h15v.5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3V17ZM12 7.5v-2", 12, 3.75, 1.75];
/** A skewer. */
const SKEWER: Drawing = [box(6, 14, 4, 4, 1) + box(14, 6, 4, 4, 1) + "M3.5 20.5 6 18M18 6l2.5-2.5", 12, 12, 2.25];
/** A flame over the grill; the point is the ember. */
const FLAME: Drawing = ["M12 3c.5 3 4.5 5 4.5 10.5a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.3 1.2 1 2 2 2.2C11.5 8.5 11 6 12 3ZM4 20.5h16", 12, 14.5, 1.75];
/** A roll of sushi, seen from its end. */
const ROLL: Drawing = ["M5 9a7 4 0 1 0 14 0 7 4 0 1 0-14 0ZM5 9v7a7 4 0 0 0 14 0V9", 12, 9];
/** An ice cream; the point is the cherry. */
const CONE: Drawing = ["M7.5 12 12 21l4.5-9M6.5 12a5.5 5.5 0 0 1 11 0Z", 12, 4.5];
/** A cake with one candle; the point is its flame. */
const CAKE: Drawing = [box(4, 12, 16, 8.5, 1.5) + "M4 16c1.3 1.2 2.7 1.2 4 0s2.7-1.2 4 0 2.7 1.2 4 0 2.7-1.2 4 0M12 12V8.5", 12, 6.25];
/** A glass with a straw. */
const GLASS: Drawing = ["M6.5 7.5h11l-1.5 13H8L6.5 7.5ZM13.5 12V4.5l3-1.5", 10.5, 13.5, 1.75];

/** Each drawn kind of food, by its id. */
export const FOODS: Record<string, Drawing> = {
  regional: POT,
  local: POT,
  mauritian: POT,
  creole: POT,
  traditional: POT,
  briani: POT,
  chinese: BOWL,
  asian: BOWL,
  thai: BOWL,
  korean: BOWL,
  noodle: BOWL,
  noodles: BOWL,
  dimsum: BOWL,
  boulette: BOWL,
  boulettes: BOWL,
  "mine-frite": BOWL,
  "boiled-noodle": BOWL,
  pizza: PIZZA,
  "italian-pizza": PIZZA,
  burger: BURGER,
  indian: CHILLI,
  curry: CHILLI,
  chicken: DRUMSTICK,
  "fried-chicken": DRUMSTICK,
  international: WORLD,
  european: WORLD,
  western: WORLD,
  fusion: WORLD,
  italian: PASTA,
  pasta: PASTA,
  seafood: SHELL,
  fish: FISH,
  "fish-and-chips": FISH,
  "coffee-shop": CUP,
  cafe: CUP,
  french: TOQUE,
  bistro: TOQUE,
  gourmet: TOQUE,
  sandwich: SANDWICH,
  panini: SANDWICH,
  kebab: SKEWER,
  barbecue: FLAME,
  grill: FLAME,
  steak: FLAME,
  "steak-house": FLAME,
  sushi: ROLL,
  japanese: ROLL,
  "ice-cream": CONE,
  cake: CAKE,
  juice: GLASS,
  jus: GLASS,
  milkshake: GLASS,
  fries: CHIPS,
  chips: CHIPS,
  "french-fries": CHIPS,
  "fast-food": CHIPS,
  snack: CHIPS,
};
