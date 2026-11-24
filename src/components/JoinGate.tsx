"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Where the section is left out: the guide's own page, which carries the same form, and a visitor's own pages, where they are in the middle of something. The landing page, which has no footer, is left out too. */
const WITHOUT = ["/shop", "/cart", "/account", "/dashboard", "/admin", "/auth", "/subscribe", "/unsubscribe", "/offline", "/preview"];
const wantedAt = (pathname: string) => pathname !== "/" && !WITHOUT.some((root) => pathname === root || pathname.startsWith(`${root}/`));

/**
 * Shows what it is given on every page but those. The section itself is made on the server and
 * handed in.
 *
 * Its first drawing in the browser is whatever the server drew, and only then what this address
 * asks for. The two are the same but in one case: the page for when there is no connection is
 * drawn once, at its own address, and shown at any other, and a first drawing that disagreed
 * with it there would be an error on the page.
 */
export default function JoinGate({ children }: { children: React.ReactNode }) {
  const wanted = wantedAt(usePathname());
  const [first, setFirst] = useState(true);
  const drawn = useRef<boolean | null>(null);
  if (first && drawn.current === null && typeof document !== "undefined") drawn.current = document.querySelector("section.join") !== null;
  useEffect(() => setFirst(false), []);
  const show = first && drawn.current !== null ? drawn.current : wanted;
  return show ? children : null;
}
