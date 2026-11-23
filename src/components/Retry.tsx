"use client";

import { useEffect, useState } from "react";

/**
 * "Try again", on a page shown when there is no connection (/offline, and Baz Manzer's own). The
 * worker shows that page in place of the one asked for, at the address asked for, so trying
 * again is asking for this same address once more. Without script it is a plain link to
 * `fallback`: the first page of the site, or of the section.
 */
export default function Retry({ fallback, children }: { fallback: string; children: React.ReactNode }) {
  const [href, setHref] = useState(fallback);
  useEffect(() => {
    // The page's own address, unless that is the offline page itself.
    if (!window.location.pathname.endsWith("/offline")) setHref(window.location.pathname + window.location.search);
  }, []);
  return (
    <a href={href} className="btn btn-filled button-md">
      {children}
    </a>
  );
}
