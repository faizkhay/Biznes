// Taking turns by the day. A list too long to show whole is shown a few at a time, and the date
// decides which: so everyone sees the same ones on a given day, and every one has its turn. It is
// what the Home page's top businesses use (src/lib/top.ts). Nothing here reads a file or a clock:
// the day is given, so a check can ask for any day it likes (scripts/behaviour.mjs does).

/** The same numbers for the same seed, each from 0 up to 1 (mulberry32): an order can be made again from its seed alone. */
function numbersFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A list in an order made from a seed: the same seed gives the same order. */
function mixed<T>(items: T[], seed: number): T[] {
  const next = numbersFrom(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** How many days it takes for every one of `n` things to be shown, `shown` at a time. */
export const roundOf = (n: number, shown: number) => (shown > 0 ? Math.max(1, Math.ceil(n / shown)) : 1);

/**
 * The day's turn of a list, `shown` at a time. The date is the seed: the count of days since
 * 1970 says which round it is and which day of the round. Each round puts the whole list in an
 * order of its own, and each day of it shows the next `shown`, so every one has its turn once a
 * round, and the same day gives everyone the same ones. A list no longer than `shown` is shown
 * whole, and its first place goes round by the day.
 */
export function turnOf<T>(items: T[], shown: number, day: string): T[] {
  if (shown <= 0 || items.length === 0) return [];
  const days = Math.floor(Date.parse(day) / 864e5);
  if (items.length <= shown) return items.map((_, i) => items[(i + days) % items.length]);
  const round = roundOf(items.length, shown);
  const order = mixed(items, Math.floor(days / round));
  const from = (days % round) * shown;
  return Array.from({ length: shown }, (_, i) => order[(from + i) % order.length]);
}
