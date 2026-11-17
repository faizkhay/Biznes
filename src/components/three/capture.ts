"use client";

import { advance } from "@react-three/fiber";
import { useEffect } from "react";
import { debugMode, stage } from "./stage";

/**
 * Frame-exact capture, for verification screenshots and the proposal film.
 *
 * Under `?debug` the canvas stops its own loop (frameloop "never") and hands the clock to a script:
 * `window.__step(seconds)` advances exactly that much time through R3F's advance(), in substeps of
 * at most 1/20 s so springs stay stable, and the shared state is on `window[name]`. With smooth
 * scrolling, the governor and camera smoothing also off (they read debugMode()), every frame is a
 * function of the scroll position and the stepped time only. `__step(1 / 30)` is one frame of a
 * 30 fps film.
 *
 * In frameloop "never", advance() takes an absolute time in seconds, so the stepped clock is kept
 * here and passed whole each time.
 *
 * The hook works on a production build (captures run against `next start`) and changes nothing for
 * a visitor who does not ask for it. Seed any random numbers the scene uses, or no two takes match.
 *
 * KOS kit. From KYÔ (src/components/three/DrinkStage.tsx, useDebugStepping and stepDpr).
 */

/** Under `?debug`, draw at the device's own pixel ratio up to 2 and hold it: no governor. */
export function stepDpr() {
  return typeof window === "undefined" ? 1 : Math.min(2, Math.max(1, window.devicePixelRatio || 1));
}

/** Call in the component that renders the <Canvas>; returns whether the clock is being stepped. */
export function useDebugStepping(name = "__stage") {
  const stepping = debugMode();
  useEffect(() => {
    if (!stepping) return;
    const w = window as unknown as Record<string, unknown>;
    w[name] = stage;
    let now = 0;
    w.__step = (secs: number) => {
      const n = Math.max(1, Math.round(secs * 20));
      for (let i = 0; i < n; i++) {
        now += secs / n;
        advance(now);
      }
    };
  }, [stepping, name]);
  return stepping;
}
