import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Lambrequin from "@/components/Lambrequin";
import { Street } from "@/components/ShopCard";
import { BUSINESSES } from "@/data/businesses";
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
 * The catalogue: the whole street, front-on. Every business still for sale stands as its own
 * shopfront, with what a buyer compares under it. A sold business is not here.
 */
export default function Businesses() {
  const forSale = BUSINESSES.filter((b) => b.status !== "sold");
  const hasSamples = forSale.some((b) => b.sample);
  return (
    <>
      <JsonLd data={pageGraph({ type: "CollectionPage", path: "/businesses", name: title, description, crumbs: [{ name: "Businesses", path: "/businesses" }] })} />
      <div className="shell pb-12 pt-16 lg:pb-16 lg:pt-24">
        <h1 className="heading-2 measure-hero">Every business on the street</h1>
        <p className="title-1 measure-hero mt-6 text-ink-subtle">
          Each is sold once. Open one to see its brand, what comes with it and what you would bring.
        </p>
        {hasSamples && <p className="caption-1 mt-3">Shops marked Sample are placeholders, not for sale.</p>}
      </div>

      <section data-ground="limewash" aria-label="The street">
        <Lambrequin className="text-(--palette-dusk)" />
        <div className="shell section-y">
          <Street businesses={forSale} label="Businesses for sale" />
          <p className="caption-2 measure mt-12 text-ink-subtle">Prices are in Mauritian rupees, for the whole business as described on its page.</p>
        </div>
      </section>
    </>
  );
}
