/**
 * The one object the page and the canvas share.
 *
 * The page writes what the canvas should show (the scroll's progress through the walk, reduced
 * motion); the canvas reads it inside useFrame, every frame, so nothing per frame ever goes through
 * React state. The canvas writes back the little the page needs to know (`ready`). For the rare
 * moment React must hear something, a window event (STAGE_READY) is dispatched instead of sharing
 * state.
 *
 * A plain object of plain values: no three.js types here, or every page that imports it would
 * download three.js.
 *
 * KOS kit. From KYÔ (src/components/three/state.ts), with this build's own fields.
 */
export const stage = {
  /** 0 to 1 through the walk's scroll, written by a passive scroll listener (components/Walk.tsx). */
  progress: 0,
  /** The pointer in normalised device coordinates, -1 to 1. Active only for a mouse. */
  pointer: { x: 0, y: 0, active: false },
  /** prefers-reduced-motion: the camera cuts from stop to stop, and nothing moves by itself. */
  reduced: false,
  /** Set by the canvas once a finished frame of the street has drawn. */
  ready: false,
  /** Until when (performance.now()) something is moving that wants every frame (Pacing.tsx). */
  busyUntil: 0,
  /**
   * A shutter a visitor has raised or lowered by hand, by shop: how far down it should be, from 0
   * (rolled up) to 1 (down), or null to follow the walk. Play only: nothing a visitor needs.
   */
  hand: [null, null, null, null, null, null] as (number | null)[],
};

/** Dispatched on window by the canvas when it has drawn a finished frame, so the stand-in can go. */
export const STAGE_READY = "stage:ready";

/** Ask the canvas for every frame for the next `ms` milliseconds. */
export function busy(ms = 1500) {
  const t = performance.now() + ms;
  if (t > stage.busyUntil) stage.busyUntil = t;
}

/**
 * `?debug` hands the clock to a script (capture.ts) and exposes this object on window, so a headless
 * browser can step the scene frame by frame for screenshots and stills.
 */
export function debugMode(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
}
