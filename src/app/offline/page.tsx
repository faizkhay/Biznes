import type { Metadata } from "next";
import { PageHead } from "@/components/Bits";

// What the service worker shows in place of a page it could not fetch (public/sw.js). It is kept
// on the device from the first visit, and is never a page to index.
export const metadata: Metadata = { title: "You are offline", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <PageHead title="You are offline" lede="This page could not be loaded, because there is no connection just now. The pages you have already opened still work.">
      {/* Plain links, so each one loads a whole page and asks the network again. */}
      <p className="mt-8 flex flex-wrap gap-3">
        <a href="/" className="btn btn-filled button-md">
          Try again
        </a>
        <a href="/saved" className="btn btn-quiet button-md">
          Saved
        </a>
      </p>
    </PageHead>
  );
}
