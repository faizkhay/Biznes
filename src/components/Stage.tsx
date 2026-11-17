"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import useNarrow from "@/lib/useNarrow";
import { hasWebGL } from "@/lib/webgl";
import { STAGE_READY, debugMode, stage } from "./three/stage";

/**
 * Where a 3D stage sits on the page, still picture first.
 *
 * A still of the street (a capture of this site's own 3D, made by scripts/stills.mjs) is painted
 * first, in the stage's frame, so there is never an empty frame. The canvas is mounted only once
 * the stage is within 200px of the screen and the framing (`narrow`) is known; it fades in over the
 * photograph when it dispatches STAGE_READY (after it has drawn a finished frame), and the photograph
 * is then taken away. Without WebGL, with `?no3d`, or if anything in the 3D throws, the photograph
 * stays for good, with its alt text, and every word on the page still reads.
 *
 * `children` renders the canvas, imported with next/dynamic and `ssr: false` so three.js is only
 * downloaded by pages with a stage:
 *
 *   const Journey = dynamic(() => import("./three/Journey"), { ssr: false });
 *   <Stage photo="/img/hero.webp" photoAlt="…" photoSize={[1600, 1200]} priority>
 *     {({ running, narrow }) => <Journey running={running} narrow={narrow} />}
 *   </Stage>
 *
 * `running` is false while the stage is off screen: pass it to the Canvas's frameloop.
 *
 * `onLive` tells the page whether the canvas will run (WebGL 2 present and nothing thrown), so the
 * walk can lay itself out as a pinned stage or as plain sections.
 *
 * KOS kit. From KYÔ (src/components/Stage.tsx), made generic, with a second still for a narrow
 * screen and the `onLive` report added for this build.
 */

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // R3F rethrows a failed shader, texture or context into the page; caught here, the page keeps
    // the photograph instead of going down with the canvas.
    console.warn("The 3D could not be shown, so the photograph stays.", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function Stage({
  photo,
  photoNarrow,
  photoAlt,
  photoSize,
  priority = false,
  narrowQuery = "(max-width: 899px)",
  className = "",
  onLive,
  children,
}: {
  /** The still picture, shown until the canvas is ready and instead of it without WebGL. */
  photo: string;
  /** The same moment framed for a narrow screen, where the stage stands above the words. */
  photoNarrow?: string;
  photoAlt: string;
  /** Its size in pixels, so the layout never shifts. */
  photoSize: [number, number];
  /** The first thing on the page: load it first. */
  priority?: boolean;
  narrowQuery?: string;
  className?: string;
  /** Called once the answer is known: true if the canvas will run, false if the still stays. */
  onLive?: (live: boolean) => void;
  children: (s: { running: boolean; narrow: boolean }) => ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [near, setNear] = useState(false);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  // Once the canvas has faded in over it, the photograph is taken away altogether.
  const [gone, setGone] = useState(false);
  const { narrow, ready: sized } = useNarrow(narrowQuery);

  useEffect(() => {
    setWebgl(hasWebGL());
    stage.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (debugMode()) (window as unknown as { __stage: typeof stage }).__stage = stage;
    const onReady = () => setReady(true);
    window.addEventListener(STAGE_READY, onReady);
    return () => window.removeEventListener(STAGE_READY, onReady);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(t);
  }, [ready]);

  const report = useRef(onLive);
  report.current = onLive;
  useEffect(() => {
    if (webgl !== null) report.current?.(webgl);
  }, [webgl]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setRunning(e.isIntersecting);
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = webgl === true && sized && near;
  const covered = ready && webgl === true;

  return (
    <div ref={host} className={`relative overflow-hidden ${className}`}>
      {(!gone || webgl !== true) && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: covered ? 0 : 1, transition: "opacity 700ms var(--ease-out)" }}
          aria-hidden={webgl === true ? true : undefined}
        >
          <picture>
            {photoNarrow && <source media={narrowQuery} srcSet={photoNarrow} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={webgl === true ? "" : photoAlt}
              width={photoSize[0]}
              height={photoSize[1]}
              decoding="async"
              fetchPriority={priority ? "high" : undefined}
              className="h-full w-full object-cover"
            />
          </picture>
        </div>
      )}
      {show && (
        <div
          className="absolute inset-0"
          style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms var(--ease-out)" }}
          aria-hidden
        >
          <CanvasBoundary onError={() => setWebgl(false)}>{children({ running, narrow })}</CanvasBoundary>
        </div>
      )}
    </div>
  );
}
