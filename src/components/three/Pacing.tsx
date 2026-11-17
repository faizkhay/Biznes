"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { busy, stage } from "./stage";

/**
 * How often the canvas draws.
 *
 * It used to draw every frame the display offered while on screen, 60 or 120
 * times a second, even with nothing moving but the glass's slow idle turn: a
 * phone ran hot for a picture that barely changed. Now the canvas draws on
 * demand (frameloop "demand"), and the Driver asks for every frame while
 * something is moving (a scroll, a pour, a hand on the glass: `stage.busyUntil`,
 * set through `busy()`, and for a moment after), and otherwise 30 a second,
 * which the slow turn and the drift need and no more. Every motion is worked
 * out from the time between frames, so it only runs less smoothly. With
 * reduced motion nothing moves by itself, so nothing is drawn unless asked.
 *
 * Wiring, inside the <Canvas> (see kit/README.md for the whole canvas):
 *   <Driver running={running} stepping={stepping} />
 *   {!stepping && <Governor max={1.5} start={narrow ? 0.5 : 1} onDpr={setDpr} onFallback={toLowTier} />}
 * with the Canvas's frameloop={stepping ? "never" : running ? "demand" : "never"} and dpr={dpr}.
 *
 * KOS kit. From KYÔ (src/components/three/Pacing.tsx), with two switches added for this build
 * (`idle` and `pointer`): the street has nothing that turns by itself and nothing that leans to a
 * mouse, so at rest it draws nothing and a moving pointer asks for nothing.
 * This Governor replaces the drei PerformanceMonitor one used on earlier builds: with on-demand
 * rendering, PerformanceMonitor measures the deliberately spaced idle frames and steps a fast device
 * down for no reason.
 */

/** Whether the frame about to be drawn follows the last one directly (read by the Governor). */
export const pace = { continuous: false };

const IDLE_MS = 1000 / 30;

/** The time of the display refresh being drawn (what requestAnimationFrame is handed). */
function frameTime() {
  const t = typeof document !== "undefined" ? document.timeline?.currentTime : null;
  return typeof t === "number" ? t : performance.now();
}

export function Driver({
  running,
  stepping,
  idle = true,
  pointer = true,
}: {
  running: boolean;
  stepping: boolean;
  /** False where nothing in the scene moves by itself: then nothing is drawn at rest. */
  idle?: boolean;
  /** False where nothing in the scene follows the pointer: then a moving mouse asks for no frames. */
  pointer?: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const last = useRef({ progress: stage.progress, drawn: 0, prev: 0, raf: 0 });

  // Back on screen: draw.
  useEffect(() => {
    if (running && !stepping) invalidate();
  }, [running, stepping, invalidate]);

  // A mouse over the page leans the glass and the camera, and a scroll walks
  // the camera: every frame for that. Nothing else asks for frames here.
  useEffect(() => {
    const move = (e: Event) => {
      // Only a mouse leans anything (a touch only scrolls, Stage.tsx), and with
      // reduced motion not even that: a held glass asks for its own frames.
      if (e.type === "pointermove" && (!pointer || (e as PointerEvent).pointerType !== "mouse" || stage.reduced)) return;
      // A scroll that does not move the walk (the menu's sticky glass, the page
      // below the walk) changes nothing in the picture.
      if (e.type === "scroll" && Math.abs(stage.progress - last.current.progress) < 1e-5) return;
      busy(1000);
      if (running && !stepping) invalidate();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", move);
    };
  }, [running, stepping, invalidate, pointer]);

  useEffect(() => () => cancelAnimationFrame(last.current.raf), []);

  useFrame(() => {
    if (stepping || !running) return;
    const l = last.current;
    const now = performance.now();
    l.drawn = frameTime();
    if (Math.abs(stage.progress - l.progress) > 1e-5) {
      l.progress = stage.progress;
      busy(1200);
    }
    cancelAnimationFrame(l.raf);
    if (now < stage.busyUntil) {
      // Every frame: invalidating from inside a frame asks for the next one.
      pace.continuous = true;
      invalidate();
      return;
    }
    pace.continuous = false;
    // Reduced motion: nothing turns or drifts by itself (the drinks, the
    // garnish and the ritual all stand still), so nothing is drawn until
    // something asks (a scroll, the pointer, a pour, a swap: busy()).
    if (stage.reduced || !idle) return;
    // Idle: 30 a second. An invalidate() takes effect on the next display
    // refresh, so it is made on the refresh before the one that should be
    // drawn: at 60 Hz every other refresh, at 120 Hz every fourth.
    l.prev = l.drawn;
    const wait = (t: number) => {
      const period = Math.max(4, t - l.prev);
      l.prev = t;
      if (t + period - l.drawn >= IDLE_MS - 2 || performance.now() < stage.busyUntil) invalidate();
      else l.raf = requestAnimationFrame(wait);
    };
    l.raf = requestAnimationFrame(wait);
  }, -10);

  return null;
}

/**
 * Keeps the canvas at a steady frame rate by trading resolution for it, as
 * drei's PerformanceMonitor does (the same windows, bounds and steps), but
 * counting only frames drawn back to back: the Driver's idle frames are
 * spaced out on purpose and say nothing about what the device can do.
 * `start` is the quality to begin at, 0 to 1 between a pixel ratio of 1 and
 * `max`.
 *
 * Unlike drei's, a step only counts as a change of mind when it reverses the
 * last one, and nothing is stepped or counted at the bounds: a device that
 * holds its frame rate at full quality stays there, instead of being counted
 * as flip-flopping every ten seconds and dropped to the plain tier. If the
 * rate does keep going up and down, it settles on the lower of the two.
 * `onFallback` (the plain tier) is only for a device that cannot hold the
 * rate even at a pixel ratio of 1, for three windows running.
 *
 * The pixel ratio it picks is handed to `onDpr`, for the canvas to pass back
 * as its `dpr` prop, rather than set on R3F's store directly: the Canvas
 * applies its prop again on every render (a pick on the menu, the fall to
 * the plain tier, going off screen and back), which would undo the step.
 */
export function Governor({
  max,
  start = 1,
  onFallback,
  onDpr,
}: {
  max: number;
  start?: number;
  onFallback: () => void;
  onDpr: (dpr: number) => void;
}) {
  const ceiling = Math.min(max, typeof window === "undefined" ? max : window.devicePixelRatio || 1);
  const api = useRef({ factor: start, frames: [] as number[], averages: [] as number[], index: 0, dir: 0, flips: 0, low: 0, refresh: 0, done: false });
  const fallback = useRef(onFallback);
  fallback.current = onFallback;
  const report = useRef(onDpr);
  report.current = onDpr;

  useFrame(() => {
    const a = api.current;
    if (a.done) return;
    const now = performance.now();
    if (!pace.continuous) {
      // After a gap the window starts again, from this frame.
      a.frames = [now];
      return;
    }
    a.frames.push(now);
    const passed = now - a.frames[0];
    if (passed < 250) return;
    const fps = Math.round((a.frames.length / passed) * 1000);
    a.frames = [now];
    a.refresh = Math.max(a.refresh, fps);
    a.averages[a.index++ % 10] = fps;
    if (a.averages.length < 10) return;
    const [lower, upper] = a.refresh > 100 ? [60, 100] : [40, 60];
    const up = a.averages.filter((v) => v >= upper).length > 7.5;
    const down = a.averages.filter((v) => v < lower).length > 7.5;
    a.averages = [];
    a.index = 0;
    let dir = 0;
    if (up && a.factor < 1) dir = 1;
    if (down && a.factor > 0) dir = -1;
    a.low = down && a.factor <= 0 ? a.low + 1 : 0;
    if (a.low >= 3) {
      a.done = true;
      fallback.current();
      return;
    }
    if (!dir) return;
    if (a.dir && dir !== a.dir && ++a.flips > 3) {
      // Up and down again: settle on the lower.
      a.done = true;
      if (dir > 0) return;
    }
    a.dir = dir;
    a.factor = Math.min(1, Math.max(0, Math.round((a.factor + dir * 0.1) * 10) / 10));
    report.current(Math.round((1 + (ceiling - 1) * a.factor) * 4) / 4);
  }, -20);

  return null;
}
