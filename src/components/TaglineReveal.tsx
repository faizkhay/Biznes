"use client";

import { createElement, useEffect, useRef, type ReactNode } from "react";

/** Tags the line can be. Keeping this closed keeps the ref typed. */
type TaglineTag = "h2" | "h3" | "p";

/**
 * The tagline moment: the brand's line, said large, each word lighting from a muted tone (never below
 * 3:1, `--tagline-muted` in globals.css) to the full ink in reading order as the line crosses the
 * screen (references/story.md, references/motion.md).
 *
 * After Elaya's ai-design-skills (landing-page-design, "Tagline reveal section"), made visible by
 * default: the prerendered page, a page without script and the reduced-motion path show every word at
 * full ink, and only html.can-animate (SmoothScroll adds it) mutes them, in globals.css. The scroll is
 * read from one passive listener, at most once a frame, and only while the line is near the screen.
 * Words light once and stay lit, and every one is lit by the time the line's foot reaches the middle
 * of the screen, or the page ends, so no word is ever left muted.
 *
 * Write "\n" where the thought breaks: each part becomes its own line (Elaya: break where the thought
 * breaks, never mid-phrase).
 *
 * KOS kit. New, from Elaya's tagline reveal.
 *   <TaglineReveal text={"Le temps,\nun privilège"} className="heading-2 measure-hero" lang="fr" />
 */
export default function TaglineReveal({
  text,
  as: Tag = "h2",
  className,
  lang,
}: {
  /** The line, in the client's words; "\n" marks each meaningful break. */
  text: string;
  as?: TaglineTag;
  className?: string;
  /** The line's language when it differs from the page's (a French tagline on an English page). */
  lang?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
    let lit = 0;
    let frame = 0;
    let listening = false;

    const lightTo = (n: number) => {
      for (; lit < Math.min(n, words.length); lit++) words[lit].setAttribute("data-lit", "");
    };
    const stop = () => {
      listening = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    const update = () => {
      frame = 0;
      const { top, height } = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
      // From the line's top at 85% of the screen to its foot at the middle of it.
      const progress = atEnd ? 1 : (vh * 0.85 - top) / (vh * 0.35 + height);
      lightTo(Math.ceil(Math.max(0, progress) * words.length));
      if (lit >= words.length) {
        stop();
        io.disconnect();
      }
    };
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const start = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
    };

    const io = new IntersectionObserver(
      (entries) => {
        // One callback can carry several changes (out, then back in, in a fast scroll): the last is now.
        const entry = entries[entries.length - 1];
        if (entry.isIntersecting) return start();
        stop();
        // Scrolled past at speed: light what is left, so the line is whole on the way back.
        if (entry.boundingClientRect.top < 0) lightTo(words.length);
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [text]);

  // Each line is a block of word spans; the space between lines keeps the heading's accessible name
  // as one sentence ("Le temps, un privilège", not "Le temps,un privilège").
  const children: ReactNode[] = [];
  text.split("\n").forEach((line, i) => {
    if (i > 0) children.push(" ");
    children.push(
      <span key={i} className="tagline-line">
        {line
          .split(/(\s+)/)
          .filter(Boolean)
          .map((part, j) => (/^\s+$/.test(part) ? part : <span key={j} data-word="">{part}</span>))}
      </span>,
    );
  });

  return createElement(Tag, { ref, className: ["tagline-reveal", className].filter(Boolean).join(" "), lang }, children);
}
