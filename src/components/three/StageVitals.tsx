"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/**
 * Keeps a canvas alive and cheap: it says when the canvas is on screen, survives a lost WebGL
 * context, and gives the context back when the canvas goes.
 *
 * Why each part exists (Details, "Stop WebGL stages going white"):
 * - Chrome caps live WebGL contexts and enforces the cap by silently killing the oldest one. A page
 *   with several stages, or a visitor moving between pages, hits it, and a killed canvas turns white.
 * - `dispose()` alone does not return the slot; `forceContextLoss()` does. It is deferred, and only
 *   runs if the canvas has really left the document, so React's development double mount does not
 *   kill a live canvas.
 * - `preventDefault()` on `webglcontextlost` is what lets `webglcontextrestored` fire; without it the
 *   loss is final and the canvas stays blank for good.
 * - Off screen, nothing should draw: pass the visibility to the Canvas's frameloop
 *   (`visible ? "demand" : "never"`). If the page already pauses the canvas from outside (kit
 *   Stage.tsx), leave `onVisibility` out and keep this for the context.
 *
 * Put it inside the <Canvas>. `onVisibility` must be stable (useCallback).
 *
 * KOS kit. From Details (CarStage.tsx), carried over to Windrush (VaultCanvas.tsx) unchanged.
 */
export default function StageVitals({
  onVisibility,
  margin = "200px",
}: {
  onVisibility?: (visible: boolean) => void;
  margin?: string;
}) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const io = onVisibility
      ? new IntersectionObserver(([entry]) => onVisibility(entry.isIntersecting), { rootMargin: margin })
      : null;
    io?.observe(canvas);
    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => onVisibility?.(true);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      io?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      setTimeout(() => {
        if (canvas.isConnected) return;
        gl.dispose();
        gl.forceContextLoss();
      }, 0);
    };
  }, [gl, onVisibility, margin]);
  return null;
}
