import type { Metadata } from "next";
import Link from "next/link";
import { ACTIONS } from "@/data/site";

export const metadata: Metadata = { title: "Nothing on this hook", robots: { index: false, follow: false } };

/** The 404, in the site's own world: an empty hook on the rail, and the way back to the full ones. */
export default function NotFound() {
  return (
    <div className="shell pb-24 pt-16 lg:pt-24">
      {/* A short rail, a string, and an empty ring where a tag would hang. */}
      <div className="w-40" aria-hidden>
        <div className="rail" />
        <div className="mx-auto h-10 w-px bg-line-strong" />
        <div className="mx-auto size-4 rounded-full border border-line-strong" />
      </div>
      <h1 className="heading-1 measure-hero mt-12">Nothing hangs on this hook</h1>
      <p className="title-2 measure-hero mt-6 text-ink-subtle">The page you were looking for is not here. The businesses are.</p>
      <div className="mt-8">
        <Link href="/businesses" className="btn btn-filled button-md">
          {ACTIONS.browse}
        </Link>
      </div>
    </div>
  );
}
