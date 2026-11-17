/**
 * The one object the page and the painted stage share.
 *
 * The page writes where the walk is (the scroll's progress through it); the stage reads it and
 * places its plates, so nothing per frame goes through React state. Plain values only.
 */
export const walk = {
  /** 0 to 1 through the walk's scroll, written by a passive scroll listener (components/Walk.tsx). */
  progress: 0,
  /** prefers-reduced-motion: the stage cuts from stop to stop. */
  reduced: false,
  /** Called whenever `progress` changes. The stage sets it. */
  onChange: null as null | (() => void),
};

/**
 * The stage rests at each stop for the first and last `HOLD` of the way to the next, and travels
 * through the middle, so a visitor can stop and read without the picture drifting (after DHE).
 */
export const HOLD = 0.22;

/** The way between two stops: held at each end, eased through the middle, cut under reduced motion. */
export function travel(t: number) {
  if (walk.reduced) return t < 0.5 ? 0 : 1;
  const u = Math.min(1, Math.max(0, (t - HOLD) / (1 - 2 * HOLD)));
  return u * u * (3 - 2 * u);
}

/** `?debug` hands the walk to a script: `window.__walk(stop)` places the stage at a stop exactly. */
export function debugMode(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
}
