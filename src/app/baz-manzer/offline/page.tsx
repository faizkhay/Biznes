import type { Metadata } from "next";
import Retry from "@/components/Retry";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { pageMeta } from "@/lib/meta";

// What the service worker shows inside Baz Manzer in place of a page it could not fetch and holds
// no copy of (public/sw.js). It is the site's offline page in the section's own words, under the
// section's own header and bar, and its two ways on stay inside the section, so an installed Baz
// Manzer with no connection is still Baz Manzer. Kept on the device from the first visit, and
// never a page to index.
export const metadata: Metadata = pageMeta({ title: BAZ.offline.title, description: "This page of Baz Manzer is shown when there is no connection. The places to eat that were opened before can still be read.", path: baz.offline, index: false });

export default function BazOfflinePage() {
  return (
    <div className="shell pt-8 pb-10 lg:pt-12">
      <p className="label-1 flex items-center gap-2 text-ink-subtle">
        <span className="baz-mark" aria-hidden /> {BAZ.name}
      </p>
      <h1 className="heading-1 mt-4 max-w-4xl">{BAZ.offline.title}</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">{BAZ.offline.lede}</p>
      {/* Plain links, so each one loads a whole page and asks the network again. */}
      <p className="mt-8 flex flex-wrap gap-3">
        <Retry fallback={baz.home}>{BAZ.offline.retry}</Retry>
        <a href={baz.saved} className="btn btn-quiet button-md">
          {BAZ.offline.saved}
        </a>
      </p>
    </div>
  );
}
