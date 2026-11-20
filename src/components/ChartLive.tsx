"use client";

import { useEffect, useRef } from "react";

/** Every listing's point, fetched once for the whole visit. */
let pointsOnce: Promise<number[]> | undefined;
const points = () => (pointsOnce ??= fetch("/points.json").then((r) => r.json() as Promise<number[]>));

/** What the search box tells the chart while a question is typed. */
export type ChartLit = { points: number[] };
export const CHART_EVENT = "biznes:lit";

/**
 * The chart, live: a canvas over the drawn chart with every listing as its own point of light.
 *
 * It draws only when something changes (the size, or which points are lit), never in a loop. When
 * a set of points is lit the rest dim and the lit ones come up over a third of a second; under
 * reduced motion they are simply lit. Once it has drawn, the drawn chart's gathered dots are
 * hidden (data-live on the parent), so the two never show at once.
 */
export default function ChartLive({ height, lit, follow, focus }: { height: number; lit?: number[]; follow?: boolean; focus?: [number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;
    let all: number[] | null = null;
    let current = new Set(lit ?? []);
    let frame = 0;
    let started = 0;
    let alive = true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(document.documentElement);
    const pale = style.getPropertyValue("--palette-limewash").trim() || "#f7f7f8";
    const signal = style.getPropertyValue("--palette-saffron").trim() || "#f8c618";

    const draw = (now: number) => {
      frame = 0;
      if (!all) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(parent.clientWidth * ratio);
      const tall = Math.round((parent.clientWidth * ratio * height) / 1000);
      if (canvas.width !== width || canvas.height !== tall) {
        canvas.width = width;
        canvas.height = tall;
      }
      const k = width / 10000;
      // A frame's own time can be a moment earlier than the time the change was asked for.
      const t = still ? 1 : Math.max(0, Math.min(1, (now - started) / 360));
      const ease = 1 - Math.pow(1 - t, 3);
      const some = current.size > 0;
      ctx.clearRect(0, 0, width, tall);
      const dot = Math.max(1, 1.5 * ratio);
      ctx.fillStyle = pale;
      ctx.globalAlpha = some ? 0.66 - 0.36 * ease : focus ? 0.42 : 0.8;
      for (let i = 0; i < all.length; i += 2) {
        if (some && current.has(i / 2)) continue;
        ctx.fillRect(all[i] * k - dot / 2, all[i + 1] * k - dot / 2, dot, dot);
      }
      if (some) {
        ctx.fillStyle = signal;
        ctx.globalAlpha = 0.16 * ease;
        ctx.beginPath();
        for (const i of current) {
          const x = all[i * 2] * k;
          const y = all[i * 2 + 1] * k;
          ctx.moveTo(x + 5.5 * ratio * ease, y);
          ctx.arc(x, y, 5.5 * ratio * ease, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.globalAlpha = 0.35 + 0.65 * ease;
        ctx.beginPath();
        for (const i of current) {
          const x = all[i * 2] * k;
          const y = all[i * 2 + 1] * k;
          ctx.moveTo(x + 1.7 * ratio, y);
          ctx.arc(x, y, 1.7 * ratio, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (t < 1) frame = requestAnimationFrame(draw);
    };
    const ask = (animate: boolean) => {
      if (animate) started = performance.now();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    points()
      .then((list) => {
        if (!alive) return;
        all = list;
        parent.dataset.live = "true";
        started = performance.now() - 1000;
        ask(false);
      })
      .catch(() => {
        // The drawn chart stays as it is.
      });

    const onLit = (event: Event) => {
      current = new Set((event as CustomEvent<ChartLit>).detail.points);
      ask(true);
    };
    if (follow) window.addEventListener(CHART_EVENT, onLit);
    const resize = new ResizeObserver(() => ask(false));
    resize.observe(parent);
    return () => {
      alive = false;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener(CHART_EVENT, onLit);
      delete parent.dataset.live;
    };
    // The lit set of a page is fixed when the page is made; a new page mounts a new chart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} aria-hidden />;
}
