// A place on a public page where an advertisement may be shown. The accounts work fills it: an ad
// an owner has made and an admin has approved, for the place and the day, always marked
// "Sponsored". With accounts off, or with no ad for the place, it is nothing at all.
import { accountsOn } from "@/lib/accounts/config";
import { adFor, type ShownAd } from "@/lib/accounts/ads";

export type AdPlace = "home" | "results" | "listing" | "food" | "article" | "directory";

/**
 * An advertisement as a card: its picture, the word "Sponsored" and who it is from, its headline
 * as the link, and its line. The whole card answers to the link. It is a quiet white card: the
 * verified mark's colours are for a verified business and nothing else.
 */
export function AdCard({ ad, className = "" }: { ad: Pick<ShownAd, "headline" | "line" | "href" | "external" | "image" | "by">; className?: string }) {
  return (
    <aside className={`ad ${className}`} aria-label="Advertisement">
      {/* The headline says what the picture is for, so the picture itself is not read out. */}
      {ad.image && <img className="ad-picture" src={ad.image} alt="" loading="lazy" decoding="async" />}
      <div className="min-w-0">
        <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
          <span className="tag">Sponsored</span>
          <span>{ad.by}</span>
        </p>
        <p className="title-1 mt-2">
          <a href={ad.href} rel="sponsored noopener" className="row-title">
            {ad.headline}
          </a>
        </p>
        {ad.line && <p className="body-3 mt-1 text-ink-subtle">{ad.line}</p>}
      </div>
    </aside>
  );
}

/**
 * The advertisement for a place today, or nothing. A place holds one at a time: an ad that an
 * admin has approved and marked paid, of a live business, for a month that has begun. When
 * several run in one month they take turns by the day.
 */
export default async function AdSlot({ place, className }: { place: AdPlace; className?: string }) {
  if (!accountsOn) return null;
  const ad = await adFor(place);
  return ad ? <AdCard ad={ad} className={className} /> : null;
}
