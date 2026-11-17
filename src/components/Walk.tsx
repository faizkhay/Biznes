"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Business } from "@/data/businesses";
import { ACTIONS, site } from "@/data/site";
import { STOPS } from "@/data/walk";
import { walk } from "@/lib/walk";
import { Arrow } from "./Icons";
import PaintedStage from "./stage/PaintedStage";
import { ROOFLINE_AT_REST } from "./stage/roofline";

const still = (id: string, frame: "desk" | "phone") => `/img/walk/${id}-${frame}.webp`;

/**
 * The walk: the home page's story. One shopfront is walked from the street to the room behind its
 * shutter, in eight stops (src/data/walk.ts), so a visitor sees what comes with a business and what
 * does not.
 *
 * The page is whole before any of this runs. As prerendered, every stop is a plain section: a still
 * of the painted street at that stop and its words. Where script runs, the section becomes a stage:
 * the paintings pin under the header, the stills step aside, the words scroll over the stage a
 * screen at a time, and the scroll moves through the paintings (components/stage). Without script,
 * or with ?plain, the plain sections stay.
 *
 * The scroll position is read from one passive listener, at most once a frame, and only while the
 * walk is near the screen.
 */
export default function Walk({ businesses }: { businesses: Business[] }) {
  const section = useRef<HTMLElement>(null);
  const [live, setLive] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el || !live) return;
    let frame = 0;
    let near = false;
    const read = () => {
      frame = 0;
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
      const rect = el.getBoundingClientRect();
      const span = rect.height - (window.innerHeight - nav);
      const p = span > 0 ? Math.min(1, Math.max(0, (nav - rect.top) / span)) : 0;
      if (Math.abs(p - walk.progress) > 1e-5) {
        walk.progress = p;
        walk.onChange?.();
      }
      setCurrent(Math.round(p * (STOPS.length - 1)));
    };
    const onScroll = () => {
      if (near && !frame) frame = requestAnimationFrame(read);
    };
    const io = new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    read();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [live]);

  const first = businesses[0];

  return (
    <section ref={section} className="walk" data-mode={live ? "live" : "plain"} aria-label="What comes with a business">
      <div className="walk-stage">
        <PaintedStage
          businesses={businesses}
          still={still("street", "desk")}
          stillNarrow={still("street", "phone")}
          stillAlt={`A painted street of ${businesses.length} shopfronts at dusk, each in its own colour under a tin roof, its sign lit by two lamps. The nearest, ${first.name}, has its shutter raised over a lit, empty room.`}
          stillSize={[1600, 920]}
          onLive={setLive}
        />
        {/* The stops, as a row of marks at the stage's foot: where the walk is, and a way to jump
              along it. Only where the stage is live, and only on a wide screen. */}
        {live && (
          <nav aria-label="Stops on the walk" className="walk-stops">
            <ol className="flex">
              {STOPS.map((stop, i) => (
                <li key={stop.id}>
                  <a href={`#walk-${stop.id}`} aria-current={i === current ? "step" : undefined} className="walk-stop" aria-label={`${stop.place}, stop ${i + 1} of ${STOPS.length}`}>
                    {/* Where this stop is, shown beside its mark when it is pointed at or focused. */}
                    <span aria-hidden className="walk-stop-name caption-4">
                      {stop.place}
                    </span>
                    <span aria-hidden className="walk-stop-mark" />
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      <ol className="walk-chapters">
        {STOPS.map((stop, i) =>
          i === 0 ? (
            <li key={stop.id} id={`walk-${stop.id}`} className="walk-chapter walk-hero">
              <div className="walk-words-first shell relative h-full pb-10 pt-8">
                {/* On a wide screen the words keep above the painted roofline: this float fills
                    their column and carries the roofline as its shape, so each line ends before the
                    roofs. The stage sets the shape from the real boxes; this is the house desk's. */}
                <div className="walk-roofline" style={{ shapeOutside: ROOFLINE_AT_REST }} aria-hidden />
                {/* The heading breaks where the thought breaks, and nowhere else. */}
                <h1 className="heading-1">
                  Buy a business
                  <br />
                  ready to open
                </h1>
                <p className="title-1 mt-6 story:max-w-xl">
                  In Mauritius, built by {site.builder.name}. {site.lede}
                </p>
                <p className="walk-actions pointer-events-auto mt-6">
                  <Link href="/businesses" className="btn btn-filled button-md">
                    {ACTIONS.browse}
                  </Link>
                  <Link href="/how-it-works" className="arrow-link button-md">
                    {ACTIONS.how}
                    <Arrow />
                  </Link>
                </p>
                {/* Where the street is live the next section is eight screens away, so the first
                    screen says the page moves: a quiet way into the walk, at its foot. */}
                {live && (
                  <a href="#walk-sign" className="walk-cue pointer-events-auto button-sm">
                    Walk the street
                    <Arrow className="rotate-90" />
                  </a>
                )}
              </div>
            </li>
          ) : (
            <li
              key={stop.id}
              id={`walk-${stop.id}`}
              className={["walk-chapter", i === STOPS.length - 1 ? "walk-chapter-last" : "", stop.id === "room" ? "walk-chapter-low" : ""].filter(Boolean).join(" ")}
            >
              <picture className="walk-still">
                <source media="(max-width: 899px)" srcSet={still(stop.id, "phone")} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={still(stop.id, "desk")} alt="" width={1600} height={920} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </picture>
              <div className="walk-words">
                <div className="walk-card pointer-events-auto">
                  <h2 className="heading-3">{stop.title}</h2>
                  <p className="body-3 mt-3">{stop.line}</p>
                  {i === STOPS.length - 1 && (
                    <Link href="/businesses" className="btn btn-filled button-md mt-6">
                      {ACTIONS.browse}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ),
        )}
      </ol>

    </section>
  );
}
