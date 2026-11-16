import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import Plate from "@/components/Plate";
import Reveal from "@/components/Reveal";
import SampleMark from "@/components/SampleMark";
import { BUSINESSES, STATUS_LABEL } from "@/data/businesses";
import { site } from "@/data/site";
import { formatPrice, wherePhrase } from "@/lib/format";
import { pageGraph } from "@/lib/structured";

const title = "Businesses for sale";
const description = "Every ready-to-launch business for sale on biznes.mu, each with its brand, its website, its strategy and its price in rupees.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/businesses" },
  openGraph: { title, description, url: "/businesses" },
};

/**
 * The catalogue. Where the home page shows the businesses as tags on a rail, this page is the
 * ledger: one row each, divided by hairlines, with what a buyer compares (what it is, where it is
 * meant to open, the price) lined up in columns. Each row is one link.
 */
export default function Businesses() {
  const forSale = BUSINESSES.filter((b) => b.status !== "sold");
  return (
    <>
      <JsonLd data={pageGraph({ type: "CollectionPage", path: "/businesses", name: title, description, crumbs: [{ name: "Businesses", path: "/businesses" }] })} />
      <div className="shell pb-12 pt-16 lg:pb-16 lg:pt-24">
        <h1 className="heading-1 measure-hero">Every business on the rail</h1>
        <p className="title-2 measure-hero mt-6 text-ink-subtle">
          Each is sold once. Open one to see its brand, what comes with it and what you would bring.
        </p>
      </div>

      <div className="shell pb-24">
        <ul className="border-t border-line-strong">
          {forSale.map((b, i) => (
            <Reveal as="li" key={b.slug} delay={i * 50}>
              <Link
                href={`/businesses/${b.slug}`}
                className="group grid grid-cols-[7rem_1fr] items-center gap-x-4 gap-y-2 border-b border-line py-6 no-underline sm:grid-cols-[10rem_1fr] sm:gap-x-8 lg:grid-cols-[3rem_11rem_1.3fr_1fr_9rem_1.5rem]"
              >
                <span className="caption-4 hidden text-ink-subtle lg:block">No. {b.number}</span>
                <Plate business={b} small className="row-span-2 self-start lg:row-span-1" />
                <span className="self-end lg:self-center">
                  <span className="caption-4 mb-1 block text-ink-subtle lg:hidden">No. {b.number}</span>
                  <span className="heading-5 block underline decoration-transparent transition-colors duration-300 ease-out group-hover:decoration-current">
                    {b.name}
                  </span>
                  <span className="caption-2 block text-ink-subtle">{b.sector}</span>
                  {/* On a phone the place sits under the sector; on a desk it has its own column. */}
                  <span className="caption-2 block text-ink-subtle lg:hidden">{wherePhrase(b.places)}</span>
                  {b.sample && <SampleMark className="mt-2" />}
                </span>
                <span className="caption-2 hidden text-ink-subtle lg:block">{wherePhrase(b.places)}</span>
                {/* A sample has no status and no offer: its price is a quiet placeholder. */}
                <span className="col-start-2 self-start lg:col-start-auto lg:self-center">
                  {site.showPrices &&
                    (b.sample ? (
                      <>
                        <span className="caption-2 tabular block text-ink-subtle">{formatPrice(b.price)}</span>
                        <span className="caption-2 block whitespace-nowrap text-ink-subtle">Placeholder price</span>
                      </>
                    ) : (
                      <span className="title-4 block">{formatPrice(b.price)}</span>
                    ))}
                  {!b.sample && <span className="caption-2 block text-ink-subtle">{STATUS_LABEL[b.status]}</span>}
                </span>
                <Arrow className="hidden lg:block" />
              </Link>
            </Reveal>
          ))}
        </ul>
        <p className="caption-2 measure mt-6 text-ink-subtle">
          Prices are in Mauritian rupees, for the whole business as described on its page. Rows marked Sample listing are placeholders
          and are not for sale.
        </p>
      </div>
    </>
  );
}
