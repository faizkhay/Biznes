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
 * It draws only when something changes (the size, which points are lit, which row is under the
 * pointer), never in a loop. When a set of points is lit the rest dim and the lit ones come up
 * over a third of a second; under reduced motion they are simply lit. A row of a list that carries
 * its point (data-point) rings that point while the pointer or the keyboard is on it. Once the
 * canvas has drawn, the drawn chart's gathered dots are hidden (data-live on the parent), so the
 * two never show at once.
 */
export default function ChartLive({ lit, follow, focus, view }: { lit?: number[]; follow?: boolean; focus?: [number, number]; view: [number, number, number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;
    const [vx, vy, vw, vh] = view;
    let all: number[] | null = null;
    let current = new Set(lit ?? []);
    let ringed = -1;
    let frame = 0;
    let started = 0;
    let alive = true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(document.documentElement);
    const ink = style.getPropertyValue("--palette-ink").trim() || "#0a1639";
    const signal = style.getPropertyValue("--palette-saffron").trim() || "#f8c618";

    const draw = (now: number) => {
      frame = 0;
      if (!all || !parent.clientWidth) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(parent.clientWidth * ratio);
      const tall = Math.round((width * vh) / vw);
      if (canvas.width !== width || canvas.height !== tall) {
        canvas.width = width;
        canvas.height = tall;
      }
      // A point is kept in tenths of a chart unit; the view is in chart units.
      const k = width / (vw * 10);
      const x = (i: number) => (all![i * 2] - vx * 10) * k;
      const y = (i: number) => (all![i * 2 + 1] - vy * 10) * k;
      // A frame's own time can be a moment earlier than the time the change was asked for.
      const t = still ? 1 : Math.max(0, Math.min(1, (now - started) / 360));
      const ease = 1 - Math.pow(1 - t, 3);
      const some = current.size > 0;
      ctx.clearRect(0, 0, width, tall);
      const dot = Math.max(1, 1.5 * ratio);
      ctx.fillStyle = ink;
      ctx.globalAlpha = some ? 0.5 - 0.3 * ease : focus ? 0.3 : 0.55;
      for (let i = 0; i < all.length / 2; i++) {
        if (some && current.has(i)) continue;
        const px = x(i);
        const py = y(i);
        if (px < -2 || py < -2 || px > width + 2 || py > tall + 2) continue;
        ctx.fillRect(px - dot / 2, py - dot / 2, dot, dot);
      }
      if (some) {
        // A point that answers: a soft saffron light, then a saffron point ringed in ink, so it
        // reads on the white of the land as well as among the other points.
        for (const [radius, alpha, colour] of [
          [6.5 * ratio * ease, 0.32 * ease, signal],
          [3.1 * ratio, 0.35 + 0.65 * ease, ink],
          [2.1 * ratio, 0.35 + 0.65 * ease, signal],
        ] as const) {
          ctx.fillStyle = colour;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          for (const i of current) {
            ctx.moveTo(x(i) + radius, y(i));
            ctx.arc(x(i), y(i), radius, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }
      if (ringed >= 0 && ringed * 2 < all.length) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2 * ratio;
        ctx.beginPath();
        ctx.arc(x(ringed), y(ringed), 11 * ratio, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(x(ringed), y(ringed), 4.4 * ratio, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = signal;
        ctx.beginPath();
        ctx.arc(x(ringed), y(ringed), 3 * ratio, 0, Math.PI * 2);
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

    // The row under the pointer or the keyboard has its point ringed.
    const ring = (event: Event) => {
      const row = (event.target as Element | null)?.closest?.("[data-point]");
      const next = row ? Number(row.getAttribute("data-point")) : -1;
      if (next !== ringed) {
        ringed = Number.isFinite(next) ? next : -1;
        ask(false);
      }
    };
    document.addEventListener("pointerover", ring);
    document.addEventListener("focusin", ring);

    const resize = new ResizeObserver(() => ask(false));
    resize.observe(parent);
    return () => {
      alive = false;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener(CHART_EVENT, onLit);
      document.removeEventListener("pointerover", ring);
      document.removeEventListener("focusin", ring);
      delete parent.dataset.live;
    };
    // The lit set and the view of a page are fixed when the page is made; a new page mounts a new chart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} aria-hidden />;
}
