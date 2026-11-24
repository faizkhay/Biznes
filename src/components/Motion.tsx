"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** True once the first page has been shown: only a page reached from another one rises into place. */
let shown = false;

/**
 * Marks the page as arrived at (data-arrived on <main>), so that its parts rise into place
 * (globals.css, "Motion"). It is in the template, which is made afresh for every page, so it runs
 * once for each page that is reached; a page that only asks itself a new question (the search,
 * with other words) gives it the question as `of`, and it runs again when that changes.
 *
 * The page a visitor lands on is never marked: it is simply there. The mark is put on before the
 * new page is first painted, and stays, so nothing that is already on the screen begins to move.
 */
export function Arrival({ of }: { of?: string }) {
  const first = useRef(true);
  useLayoutEffect(() => {
    // A question asked of the same page: its first asking is the page itself arriving, or landing.
    if (of !== undefined && first.current) {
      first.current = false;
      return;
    }
    if (shown) document.getElementById("main")?.setAttribute("data-arrived", "");
    shown = true;
  }, [of]);
  return null;
}

/** An address on this site that a click would leave this page for, or nothing. */
function leavesFor(event: MouseEvent): string | null {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  // A link that hands out a file leaves the page where it is: no page is on its way.
  if (!link || link.target === "_blank" || link.hasAttribute("download") || /\/(download|export)$/.test(link.pathname) || link.origin !== window.location.origin) return null;
  const same = link.pathname === window.location.pathname && link.search === window.location.search;
  return same ? null : link.pathname + link.search;
}

/**
 * A thin line across the top of the screen while a page is on its way, so a press is answered at
 * once even when the page takes a moment. It starts when a link to another page of the site is
 * pressed or a search is sent, and ends when the address has changed. It is decoration: hidden
 * from assistive technology, which hears the new page itself. Needs a boundary above it, since it
 * reads the address's question (see the layout).
 */
export function Progress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "going" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The address changed: the page is here.
  useEffect(() => {
    setState((now) => (now === "going" ? "done" : now));
  }, [pathname, search]);
  useEffect(() => {
    clearTimeout(timer.current);
    // Done: the line runs out and goes. Going for too long: something went wrong, and it does not hang there.
    if (state === "done") timer.current = setTimeout(() => setState("idle"), 400);
    if (state === "going") timer.current = setTimeout(() => setState("done"), 12000);
    return () => clearTimeout(timer.current);
  }, [state]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (leavesFor(event)) setState("going");
    };
    const submit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (form?.method === "get") setState("going");
    };
    // Heard on the way down, before the link itself takes the press to go there without a new page load.
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
    };
  }, []);

  return <div className="progress" data-state={state} aria-hidden="true" />;
}
