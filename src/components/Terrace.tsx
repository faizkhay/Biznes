import Link from "next/link";
import { type Business, STATUS_LABEL } from "@/data/businesses";
import { site } from "@/data/site";
import { formatPrice, listPlaces } from "@/lib/format";
import Shopfront from "./Shopfront";
import { EmptyStreet } from "./ShopCard";

/**
 * The street as one terrace: every business still for sale, wall to wall under one roofline, on one
 * pavement, with what a buyer compares on plaques and in plain type beneath each shop. It is the
 * home page's list of businesses, and it is a street, not a grid of cards: nothing separates one
 * shop from the next but its own colour.
 *
 * Where the terrace is wider than the screen it scrolls sideways, and each shop is a link, so a
 * keyboard reaches every one. Pointing at a shop, or focusing it, raises its shutter.
 */
export default function Terrace({ businesses, label }: { businesses: Business[]; label: string }) {
  if (!businesses.length) return <EmptyStreet />;
  return (
    <div className="terrace">
      <ul aria-label={label} className="terrace-row">
        {businesses.map((b) => (
          <li key={b.slug} className="terrace-shop">
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
                    <p className="caption-2 tabular mt-2 text-ink-subtle">{formatPrice(b.price)}, a placeholder</p>
                  ) : (
                    <p className="title-4 mt-2">{formatPrice(b.price)}</p>
                  ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
