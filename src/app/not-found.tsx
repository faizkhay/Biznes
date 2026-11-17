import type { Metadata } from "next";
import Link from "next/link";
import { ACTIONS } from "@/data/site";

export const metadata: Metadata = { title: "No shop at this address", robots: { index: false, follow: false } };

/** The 404, in the site's own world: a plot with nothing built on it, and the way back to the street. */
export default function NotFound() {
  return (
    <div className="shell pb-24 pt-16 lg:pt-24">
      {/* An empty plot: a kerb, and the outline of a shopfront that is not there. */}
      <svg viewBox="0 0 240 150" className="w-full max-w-64" fill="none" aria-hidden focusable="false">
        <path d="M24 136V44h192v92" stroke="var(--color-line-strong)" strokeWidth="1.5" strokeDasharray="6 7" />
        <path d="M70 136V78h100v58" stroke="var(--color-line-strong)" strokeWidth="1.5" strokeDasharray="6 7" />
        <rect x="0" y="136" width="240" height="14" fill="var(--palette-pavement)" />
      </svg>
      <h1 className="heading-2 measure-hero mt-10">No shop at this address</h1>
      <p className="title-1 measure-hero mt-6 text-ink-subtle">The page you were looking for is not here. The street is.</p>
      <div className="mt-8">
        <Link href="/businesses" className="btn btn-filled button-md">
          {ACTIONS.browse}
        </Link>
      </div>
    </div>
  );
}
