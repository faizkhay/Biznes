"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** Tags Reveal is allowed to render as. Keeping this closed keeps the ref typed. */
type RevealTag = "div" | "section" | "article" | "li" | "span" | "header" | "figure" | "blockquote";

/**
 * Reveal-on-scroll, from an already-visible default. The transition lives in globals.css on
 * [data-reveal] and only applies once script has marked <html> `can-animate` (SmoothScroll does),
 * so the markup reads in full without script, under reduced motion and for crawlers.
 * One IntersectionObserver per element, released once it fires.
 *
 * KOS kit. From DHE (src/components/Reveal.tsx), the latest of five builds that share it.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
  id,
}: {
  children: ReactNode;
  as?: RevealTag;
  /** Stagger, in milliseconds. */
  delay?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.setAttribute("data-reveal", "in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-reveal", "in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    Tag,
    {
      ref,
      id,
      "data-reveal": "",
      className,
      style: delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined,
    },
    children,
  );
}
