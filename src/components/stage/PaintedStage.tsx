"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Business } from "@/data/businesses";
import { PLATES, STREET_SKY, type PlateId } from "@/data/plates";
import useNarrow from "@/lib/useNarrow";
import { debugMode, travel, walk } from "@/lib/walk";
import { CertificatePlate, CounterPlate, ShopPlate, StreetPlate } from "./Plates";
import { rooflinePolygon, skyFloor } from "./roofline";
import { TIMELINE, type View } from "./views";

/**
 * The painted stage: the walk's pictures, moved by the scroll.
 *
 * The street is painted, not rendered. Four plates (src/data/plates.ts) lie in the stage, each a
 * painting at its own size with the listings' lettering set over it (Plates.tsx). The scroll's
 * progress picks two neighbouring stops (views.ts) and the way between them; this places each
 * plate from that, with one 2D transform and an opacity. Within one painting the stage travels;
 * between two it dissolves while it pushes in. Nothing here is WebGL, so there is nothing to fall
 * back from but script itself.
 *
 * Still first: the stage is prerendered as a still of its first view (a capture of this same stage,
 * scripts/stills.mjs), with its alt text. The plates are mounted only in the browser, fade in over
 * the still once the first has decoded, and the still goes only when that fade has finished. With
 * `?plain`, or without script, the still stays and the walk stays plain sections.
 *
 * A plate is placed by pure arithmetic from the progress, so the walk can run backwards, stop
 * anywhere or jump. Reduced motion cuts from stop to stop (lib/walk.ts). Under `?debug`,
 * `window.__walk(stop)` places the stage at a stop exactly, for the stills.
 */

/** Which edges of the stage a plate must always reach, so no bare ground shows past it. */
const COVERS: Record<PlateId, { sides: boolean; foot: boolean; head: boolean }> = {
  // The street's sky runs off its top edge into the stage's own ground, the same blue.
  street: { sides: true, foot: true, head: false },
  lepalatier: { sides: true, foot: true, head: true },
  counter: { sides: true, foot: true, head: true },
  certificate: { sides: true, foot: true, head: true },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/** Where a view puts its plate on a stage `W` by `H`: a scale and the plate's top left corner. */
function place(view: View, W: number, H: number, zoom = 1) {
  const p = PLATES[view.plate];
  const covers = COVERS[view.plate];
  let s = (view.by === "width" ? (view.size * W) / p.w : (view.size * H) / p.h) * zoom;
  if (covers.sides) s = Math.max(s, W / p.w);
  if (covers.head && covers.foot) s = Math.max(s, H / p.h);
  let x = view.at[0] * W - view.focus[0] * p.w * s;
  let y = view.at[1] * H - view.focus[1] * p.h * s;
  if (covers.sides) x = Math.min(0, Math.max(W - p.w * s, x));
  if (covers.foot) y = Math.max(H - p.h * s, y);
  if (covers.head) y = Math.min(0, y);
  return { s, x, y };
}

/** The view part of the way from one to the next on the same plate: a push is even in scale, not in size. */
function between(a: View, b: View, t: number): View {
  const mix = (u: number, v: number) => u + (v - u) * t;
  return {
    plate: a.plate,
    by: a.by,
    focus: [mix(a.focus[0], b.focus[0]), mix(a.focus[1], b.focus[1])],
    at: [mix(a.at[0], b.at[0]), mix(a.at[1], b.at[1])],
    size: a.size * Math.pow(b.size / a.size, t),
  };
}

type Debug = Window & { __walk?: (stop: number) => void; __stage?: { ready: boolean } };

export default function PaintedStage({
  businesses,
  still,
  stillNarrow,
  stillAlt,
  stillSize,
  onLive,
}: {
  businesses: Business[];
  /** The still of the first view, shown until the plates are ready and instead of them without script. */
  still: string;
  stillNarrow: string;
  stillAlt: string;
  stillSize: [number, number];
  /** Called once the answer is known: true if the plates will run, false if the still stays. */
  onLive?: (live: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const layers = useRef<Partial<Record<PlateId, HTMLDivElement | null>>>({});
  const layer = (id: PlateId) => (el: HTMLDivElement | null) => {
    layers.current[id] = el;
  };
  const shutter = useRef<HTMLImageElement>(null);
  const forced = useRef<number | null>(null);
  const [live, setLive] = useState(false);
  const [shown, setShown] = useState(false);
  const [rest, setRest] = useState(false);
  const [gone, setGone] = useState(false);
  const { narrow, ready: sized } = useNarrow("(max-width: 899px)");

  const report = useRef(onLive);
  report.current = onLive;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const on = !q.has("plain");
    walk.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLive(on);
    report.current?.(on);
  }, []);

  /** Places every plate for where the walk is now. */
  const frame = useCallback(() => {
    const el = host.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const mode = narrow ? "phone" : "desk";
    const n = TIMELINE.length - 1;
    const at = clamp01(forced.current ?? walk.progress) * n;
    const i = Math.min(n - 1, Math.floor(at));
    // A stop placed by a script is placed exactly, with no travel.
    const t = forced.current === null ? travel(at - i) : at - i;
    const a = TIMELINE[i][mode];
    const b = TIMELINE[i + 1][mode];

    const placed: Partial<Record<PlateId, { s: number; x: number; y: number; o: number }>> = {};
    if (a.plate === b.plate) placed[a.plate] = { ...place(between(a, b, t), W, H), o: 1 };
    else {
      // From one painting to the next: both push in, and the next arrives through the first.
      const f = smooth(0.22, 0.78, t);
      placed[a.plate] = { ...place(a, W, H, 1 + 0.1 * t), o: 1 - f };
      placed[b.plate] = { ...place(b, W, H, 0.93 + 0.07 * t), o: f };
    }

    for (const id of Object.keys(PLATES) as PlateId[]) {
      const el = layers.current[id];
      if (!el) continue;
      const p = placed[id];
      if (!p || p.o < 0.002) {
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      el.style.opacity = String(p.o);
      el.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) scale(${p.s.toFixed(5)})`;
    }

    // The shutter on the first shop's own plate: how far down it is, as a part of the doorway.
    const down = TIMELINE[i].shutter + (TIMELINE[i + 1].shutter - TIMELINE[i].shutter) * t;
    if (shutter.current) shutter.current.style.transform = `translateY(${(-(1 - down) * 100).toFixed(2)}%)`;
  }, [narrow]);

  /**
   * Shapes the first screen's words to the roofline as it really falls on this stage: the float in
   * their column (components/Walk.tsx) takes the roofline as its shape, so no line runs into a roof.
   */
  const shape = useCallback(() => {
    const el = host.current;
    const page = el?.closest(".walk");
    const float = page?.querySelector<HTMLElement>(".walk-roofline");
    if (!el || !page || !float || narrow) return;
    const origin = page.getBoundingClientRect();
    const box = float.getBoundingClientRect();
    float.style.shapeOutside = rooflinePolygon(el.clientWidth, el.clientHeight, { left: box.left - origin.left, top: box.top - origin.top, width: box.width, height: box.height });
    // A line that finds no room above the roofs is pushed below the float altogether, and a
    // sentence must also end above the afterglow, where white would not read. Until every word
    // stands clear, the second route steps aside (it is in the header too), then the headline
    // steps down a size.
    const words = float.parentElement;
    if (!words) return;
    const parts = [...words.querySelectorAll<HTMLElement>("h1, p")];
    const lede = words.querySelector<HTMLElement>("p.title-1");
    const link = words.querySelector<HTMLElement>(".walk-actions .arrow-link");
    const floor = el.getBoundingClientRect().top + skyFloor(el.clientWidth, el.clientHeight);
    const clear = (tight: boolean) => {
      const foot = float.getBoundingClientRect().bottom;
      if (!parts.every((part) => part.getBoundingClientRect().bottom <= foot)) return false;
      if (lede && lede.getBoundingClientRect().bottom > floor) return false;
      return tight || !link || link.getBoundingClientRect().bottom <= floor;
    };
    // While it is being fitted nothing in the words may transition. Under reduced motion every
    // transition is cut to a hundredth of a millisecond, not removed, so a size set here would not
    // read back until the next frame and each step would measure the one before it (measured by
    // the agent recording DESIGN.md, 17 November 2026).
    words.setAttribute("data-fitting", "");
    fitting: for (const fit of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52]) {
      for (const tight of [false, true]) {
        words.style.setProperty("--fit", String(fit));
        words.toggleAttribute("data-tight", tight);
        if (clear(tight)) break fitting;
      }
    }
    words.removeAttribute("data-fitting");
  }, [narrow]);

  // The walk tells the stage when it has moved; the stage places itself at most once a frame.
  useEffect(() => {
    if (!live || !sized) return;
    let raf = 0;
    const ask = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          frame();
        });
    };
    walk.onChange = ask;
    shape();
    const ro = new ResizeObserver(() => {
      ask();
      shape();
    });
    if (host.current) ro.observe(host.current);
    // The first words are measured to be fitted, and a measure taken before the sign face has
    // loaded is a measure of the fallback: wider letters, more lines, a headline stepped down for
    // no reason (found by the finish review, 17 November 2026). So they are fitted again once the
    // fonts are in.
    let alive = true;
    document.fonts.ready.then(() => alive && shape());
    document.fonts.addEventListener("loadingdone", shape);
    frame();
    const w = window as Debug;
    if (debugMode()) {
      w.__walk = (stop: number) => {
        forced.current = stop / (TIMELINE.length - 1);
        frame();
      };
    }
    return () => {
      alive = false;
      document.fonts.removeEventListener("loadingdone", shape);
      walk.onChange = null;
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [live, sized, frame, shape, rest]);

  // The first plate decodes, the stage fades in over the still, and only then do the others load.
  useEffect(() => {
    if (!live || !sized) return;
    const img = layers.current.street?.querySelector("img");
    if (!img) return;
    let alive = true;
    const done = () => {
      if (!alive) return;
      frame();
      setShown(true);
      setRest(true);
    };
    if (img.complete && img.naturalWidth) img.decode().then(done, done);
    else {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    }
    return () => {
      alive = false;
    };
  }, [live, sized, frame]);

  // For the stills: the stage says when every plate has decoded.
  useEffect(() => {
    if (!rest || !debugMode()) return;
    const w = window as Debug;
    w.__stage = { ready: false };
    const imgs = [...(host.current?.querySelectorAll("img") ?? [])];
    Promise.all(imgs.map((img) => img.decode().catch(() => undefined))).then(() => {
      frame();
      if (w.__stage) w.__stage.ready = true;
    });
  }, [rest, frame]);

  return (
    <div ref={host} className="stage">
      {(!gone || !live) && (
        <picture className="stage-still" aria-hidden={live ? true : undefined}>
          <source media="(max-width: 899px)" srcSet={stillNarrow} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={still} alt={live ? "" : stillAlt} width={stillSize[0]} height={stillSize[1]} decoding="async" fetchPriority="high" />
        </picture>
      )}
      {live && sized && (
        <div
          className="stage-live"
          aria-hidden
          style={{ opacity: shown ? 1 : 0, background: STREET_SKY }}
          onTransitionEnd={(e) => {
            // The still goes only once the plates have finished arriving over it, never on a clock.
            if (shown && e.target === e.currentTarget && e.propertyName === "opacity") setGone(true);
          }}
        >
          <div ref={layer("street")} className="stage-layer stage-layer-street">
            <StreetPlate businesses={businesses} />
          </div>
          {rest && (
            <>
              <div ref={layer("lepalatier")} className="stage-layer" style={{ visibility: "hidden" }}>
                <ShopPlate business={businesses[0]} shutterRef={shutter} />
              </div>
              <div ref={layer("counter")} className="stage-layer" style={{ visibility: "hidden" }}>
                <CounterPlate business={businesses[0]} />
              </div>
              <div ref={layer("certificate")} className="stage-layer" style={{ visibility: "hidden" }}>
                <CertificatePlate />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
