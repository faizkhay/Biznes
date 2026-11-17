import Link from "next/link";
import { type Business, STATUS_LABEL } from "@/data/businesses";
import { PAINTED, TERRACE } from "@/data/plates";
import { site } from "@/data/site";
import { formatPrice, listPlaces } from "@/lib/format";
import Shopfront from "./Shopfront";
import { EmptyStreet } from "./ShopCard";

/**
 * The street as one terrace: the painting of all six shopfronts, whole, with what a buyer compares
 * on plaques and in plain type beneath each shop. It is the home page's list of businesses, and it
 * is a street, not a grid of cards: one picture, and nothing between one shop and the next but the
 * pier they share.
 *
 * The painting is drawn once, behind the row. Each shop is a column of it, from party wall to party
 * wall, and each column is one link: over the picture it carries the listing's own lettering, its
 * number and its tag (Shopfront), and under it its facts. Pointing at a real business, or focusing
 * it, raises its shutter. Where the terrace is wider than the screen it scrolls sideways, and a
 * keyboard reaches every shop.
 *
 * A shop whose business has been sold has no column: it stands in the painting with its sign blank.
 * A listing that is not one of the six painted is not on this street (README, "Known gaps").
 */
export default function Terrace({ businesses, label }: { businesses: Business[]; label: string }) {
  const shown = businesses.filter((b) => PAINTED.includes(b.slug));
  if (!shown.length) return <EmptyStreet />;
  const columns = TERRACE.shops.map((shop) => `${shop.column[1]}fr`).join(" ");
  const src = (w: number) => `${TERRACE.src}-${w}.webp`;
  return (
    <div className="terrace">
      <div className="terrace-street">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(TERRACE.widths[1])}
          srcSet={TERRACE.widths.map((w) => `${src(w)} ${w}w`).join(", ")}
          sizes="(min-width: 80rem) 80rem, (min-width: 40rem) 80rem, 384vw"
          width={TERRACE.w}
          height={TERRACE.height}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          draggable={false}
          className="terrace-picture"
        />
        <ul aria-label={label} className="terrace-row" style={{ gridTemplateColumns: columns }}>
          {shown.map((b) => (
            <li key={b.slug} className="terrace-shop" style={{ gridColumn: PAINTED.indexOf(b.slug) + 1 }}>
              <Link href={`/businesses/${b.slug}`} className="group block no-underline">
                <Shopfront business={b} terrace />
                <div className="px-3 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="plaque caption-4">No. {b.number}</span>
                    <span className="plaque caption-4">{b.sample ? "Sample" : STATUS_LABEL[b.status]}</span>
                  </div>
                  <h3 className="heading-5 link mt-3 group-hover:decoration-current">{b.name}</h3>
                  <p className="caption-2 text-ink-subtle">{b.sector}</p>
                  <p className="caption-2 text-ink-subtle">{listPlaces(b.places)}</p>
                  {site.showPrices &&
                    (b.sample ? (
                      // Two short lines, so the figure never breaks from its unit or the note from itself.
                      <p className="caption-2 tabular mt-2 text-ink-subtle">
                        <span className="whitespace-nowrap">{formatPrice(b.price)},</span> <span className="whitespace-nowrap">a placeholder</span>
                      </p>
                    ) : (
                      <p className="title-4 mt-2">{formatPrice(b.price)}</p>
                    ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
