"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lenis: Lenis | null = null;
/** The running Lenis, or null (touch, reduced motion, captures). For code that scrolls the page. */
export const getLenis = () => lenis;

/** The header's height from the --nav-h token, so a section lands under the header, not behind it. */
const navHeight = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;

/**
 * Lenis on wheel and trackpad only; touch keeps the platform's own momentum, which people's thumbs
 * are tuned to. Skipped entirely under reduced motion, and for captures (?still, ?debug, ?record),
 * which set the scroll position themselves.
 *
 * Also marks <html>: `js` whenever script runs, and `can-animate` only when motion is welcome.
 * `can-animate` is what lets [data-reveal] start hidden (see globals.css); until then every word
 * is visible.
 *
 * KOS kit. From DHE (the <html> classes and ?still) and KYÔ (landing on a #hash under the header).
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("js");
    if (!reduce) root.classList.add("can-animate");
    const q = new URLSearchParams(window.location.search);
    if (reduce || q.has("still") || q.has("debug") || q.has("record")) return;

    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -navHeight() } });
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // A new page starts at the top, without gliding there from the last one, unless the link was to
  // a place on it.
  useEffect(() => {
    if (!lenis) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (el) lenis.scrollTo(el, { immediate: true, offset: -navHeight() });
    else lenis.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
