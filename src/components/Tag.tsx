import Link from "next/link";
import type { CSSProperties } from "react";
import { type Business, STATUS_LABEL } from "@/data/businesses";
import { site } from "@/data/site";
import { brandVars } from "@/lib/brand";
import { formatPrice, listPlaces } from "@/lib/format";
import Wordmark from "./Wordmark";

/** How far each tag hangs below the rail, in rem, so the row has a rhythm. */
const STRINGS = [3.5, 1.5, 5, 2.5, 4, 2];
/** Which way, and how far, each tag stirs when the page opens. */
const SWINGS = [4, -3, 3.5, -4, 3, -3.5];

/**
 * A business on the rail: its tag, hanging by its string, in its own colours and lettering, then its
 * name, what it is, where it is meant for and its price in the page's own type. The whole thing is
 * one link to its page.
 *
 * The name is real text under the tag, so the lettering on the tag is decoration to a screen reader.
 * A sample wears "Sample" on the tag itself, where it survives a screenshot, and its price is set
 * quieter than a real one's, so a placeholder never reads as an offer. On a phone the strings are
 * shorter (globals.css, .hang), so the first tag is whole in the first screen.
 */
export default function Tag({ business: b, index }: { business: Business; index: number }) {
  const hang = {
    "--string": `${STRINGS[index % STRINGS.length]}rem`,
    "--swing": `${SWINGS[index % SWINGS.length]}deg`,
    "--hang-delay": `${index * 90}ms`,
  } as CSSProperties;

  return (
    <li className="hang border-t border-line-strong px-2 pb-8 lg:px-3" style={hang}>
      <Link href={`/businesses/${b.slug}`} className="group block rounded-2xl no-underline">
        <div className="tag" data-ground="brand" style={brandVars(b)}>
          <span className="tag-hole" aria-hidden />
          <div className="flex flex-1 items-center justify-center">
            <Wordmark slug={b.slug} name={b.name} decorative />
          </div>
          <div className="caption-4 flex items-end justify-between gap-2 px-3 pb-3">
            <span>No. {b.number}</span>
            {b.sample ? <span>Sample</span> : <span>{STATUS_LABEL[b.status]}</span>}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="title-3 underline decoration-transparent transition-colors duration-300 ease-out group-hover:decoration-current">
            {b.name}
          </h3>
          <p className="caption-2 text-ink-subtle">{b.sector}</p>
          <p className="caption-2 text-ink-subtle">{listPlaces(b.places)}</p>
          {/* A real price is set as tag writing. A sample's is set quietly, in the caption's own type:
              the tag above it says Sample, and the line over the rail says what that means. */}
          {site.showPrices &&
            (b.sample ? (
              <p className="caption-2 tabular mt-2 text-ink-subtle">{formatPrice(b.price)}</p>
            ) : (
              <p className="title-4 mt-2">{formatPrice(b.price)}</p>
            ))}
        </div>
      </Link>
    </li>
  );
}
