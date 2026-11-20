"use client";

import { useEffect } from "react";

/**
 * Marks, in an article's contents rail, the part being read. The rail is the page's own list of
 * links and works without this; with script, the link to the part at the top of the screen is
 * marked as the current one (aria-current), and the stylesheet shows it. It draws nothing itself.
 */
export default function RailMark({ rail }: { /** The id of the rail's list. */ rail: string }) {
  useEffect(() => {
    const list = document.getElementById(rail);
    if (!list) return;
    const links = [...list.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    const parts = links.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter((part): part is HTMLElement => part != null);
    if (!parts.length) return;
    let frame = 0;
    const mark = () => {
      frame = 0;
      // The part being read is the last whose heading has passed under the menu.
      let current = -1;
      parts.forEach((part, i) => {
        if (part.getBoundingClientRect().top <= 140) current = i;
      });
      links.forEach((link, i) => (i === current ? link.setAttribute("aria-current", "location") : link.removeAttribute("aria-current")));
    };
    const ask = () => (frame ||= requestAnimationFrame(mark));
    mark();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    return () => {
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      cancelAnimationFrame(frame);
    };
  }, [rail]);
  return null;
}
