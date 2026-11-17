import type { Metadata } from "next";
import Link from "next/link";
import Faq from "@/components/Faq";
import { Arrow } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import Lambrequin from "@/components/Lambrequin";
import Reveal from "@/components/Reveal";
import { Street } from "@/components/ShopCard";
import Steps from "@/components/Steps";
import TaglineReveal from "@/components/TaglineReveal";
import Walk from "@/components/Walk";
import { BUSINESSES } from "@/data/businesses";
import { TAGLINE } from "@/data/pack";
import { ACTIONS, site } from "@/data/site";
import { pageGraph } from "@/lib/structured";

export const metadata: Metadata = {
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: { title: `${site.name} · ${site.line}`, description: site.description, url: "/" },
};

/**
 * The home page. It opens on the street: finished shopfronts at dusk, the first with its shutter
 * half raised. The walk then takes one shop from its sign to the room behind its shutter, which is
 * how the page says what comes with a business and what does not. After the walk the page settles
 * on solid ground, each section a wall of its own colour: the street as a list, the sale in four
 * steps, the line said large, the questions, and who builds every one. STORY.md has the chapters.
 */
export default function Home() {
  const forSale = BUSINESSES.filter((b) => b.status !== "sold");
  const hasSamples = forSale.some((b) => b.sample);

  return (
    <>
      <JsonLd data={pageGraph({ type: "FAQPage", path: "/", name: `${site.name}: ${site.line}`, description: site.description })} />

      <Walk businesses={forSale} />

      {/* The street, as a list */}
      <section id="street" data-ground="limewash" aria-labelledby="street-heading">
        <Lambrequin className="text-(--palette-dusk)" />
        <div className="shell section-y">
          <div className="grid gap-x-16 gap-y-4 pb-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
            <Reveal className="reveal-mask">
              <h2 id="street-heading" className="heading-2">
                On the street now
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="title-2 measure text-ink-subtle">
                Each business is sold once. Open one to see its brand, what comes with it and what you would bring.
              </p>
              {hasSamples && <p className="caption-1 mt-3">Shops marked Sample are placeholders, not for sale.</p>}
            </Reveal>
          </div>
          <Street businesses={forSale} label="Businesses for sale" />
        </div>
      </section>

      {/* The sale, on a saffron wall */}
      <section data-ground="saffron" aria-labelledby="steps-heading">
        <Lambrequin className="text-(--palette-limewash)" />
        <div className="shell section-y">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4 pb-12">
            <Reveal className="reveal-mask">
              <h2 id="steps-heading" className="heading-2 measure-hero">
                From the street to opening day
              </h2>
            </Reveal>
            <Link href="/how-it-works" className="arrow-link button-md">
              {ACTIONS.how}
              <Arrow />
            </Link>
          </div>
          <Steps />
        </div>
      </section>

      {/* The line, said large, back at dusk */}
      <section aria-label="In one line">
        <Lambrequin className="text-(--palette-saffron)" />
        <div className="shell section-y">
          <TaglineReveal text={TAGLINE} className="heading-2 measure-hero mx-auto text-center" />
        </div>
      </section>

      {/* The questions, on limewash: the objections are answered before the last ask */}
      <section data-ground="limewash" aria-labelledby="faq-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal className="reveal-mask">
              <h2 id="faq-heading" className="heading-2">
                Questions people ask
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="title-2 measure mt-6 text-ink-subtle">
                Every shopfront here is built by {site.builder.name}, a Mauritian digital agency founded in {site.builder.founded}, with{" "}
                {site.builder.projects} projects delivered.
              </p>
              <a href={site.builder.url} target="_blank" rel="noopener noreferrer" className="arrow-link button-md mt-2">
                Visit {site.builder.name}
                <Arrow />
              </a>
            </Reveal>
          </div>
          <Faq />
        </div>
      </section>
    </>
  );
}
