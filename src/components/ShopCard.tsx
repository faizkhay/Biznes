import Link from "next/link";
import { type Business, STATUS_LABEL } from "@/data/businesses";
import { site } from "@/data/site";
import { formatPrice, listPlaces } from "@/lib/format";
import Reveal from "./Reveal";
import Shopfront from "./Shopfront";

/**
 * A business on the street: its shopfront, drawn in its own colours with its own lettering, then
 * what a buyer compares in the page's own type: its name, what it is, where it is meant for, and
 * its price. The whole thing is one link to its page, and pointing at it raises the shutter.
 *
 * The name is real text under the picture, so the drawing is decoration to a screen reader. A
 * sample wears its plaque in words, prints no status, and its price is set quietly as a
 * placeholder, so it never reads as an offer.
 */
export default function ShopCard({ business: b, index }: { business: Business; index: number }) {
  return (
    <Reveal as="li" delay={(index % 3) * 90} className="reveal-shop">
      <Link href={`/businesses/${b.slug}`} className="group block no-underline">
        <Shopfront business={b} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
      </Link>
    </Reveal>
  );
}

/** What the street says when every business on it has been sold. */
export function EmptyStreet() {
  return (
    <div className="rounded-2xl border border-line-strong p-8">
      <p className="heading-5">Every business on the street has been sold</p>
      <p className="body-3 measure mt-2 text-ink-subtle">New ones are being built. Ask, and we will tell you what is coming.</p>
      <Link href="/enquire" className="btn btn-filled button-md mt-6">
        Enquire
      </Link>
    </div>
  );
}

/** The street as a list: every business still for sale, or a word about why it is empty. */
export function Street({ businesses, label }: { businesses: Business[]; label: string }) {
  if (!businesses.length) return <EmptyStreet />;
  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-8 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
      {businesses.map((b, i) => (
        <ShopCard key={b.slug} business={b} index={i} />
      ))}
    </ul>
  );
}
