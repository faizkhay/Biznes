"use client";

import Link from "next/link";
import { site } from "@/data/site";

/**
 * What an account page shows when something broke while it was being made: most often, the
 * accounts service could not be reached. It says so plainly, offers to try again, and gives the
 * ways to reach a person. Nothing was changed.
 */
export default function Broke({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { contact } = site;
  return (
    <div className="shell pt-16 pb-16">
      <p className="label-1 text-ink-faint">Something went wrong</p>
      <h1 className="heading-1 mt-4">This page could not be shown just now.</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">
        Nothing was changed. Try again in a moment. If it keeps happening, call or WhatsApp{" "}
        <a href={contact.phoneHref} className="data-1 whitespace-nowrap">
          {contact.phone}
        </a>
        .
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-filled button-md" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-quiet button-md">
          Home
        </Link>
      </p>
    </div>
  );
}
