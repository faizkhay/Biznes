import type { Metadata } from "next";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Lambrequin from "@/components/Lambrequin";
import Reveal from "@/components/Reveal";
import Steps from "@/components/Steps";
import { pageGraph } from "@/lib/structured";

const title = "How it works";
const description = "How buying a ready-to-launch business on biznes.mu works: the four steps from the street to opening day, and the questions people ask.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title, description, url: "/how-it-works" },
};

/**
 * The sale told in the order the buyer lives it, then the questions people ask. What every business
 * comes with and what stays with the buyer are told on the home page and on each business's own
 * page, so they are not said a third time here: the first design review found this page repeating
 * the home page word for word. As the owner answers what a buyer asks next (how payment is taken,
 * what holds a business, how long the handover takes), each answer joins FAQS in src/data/pack.ts.
 */
export default function HowItWorks() {
  return (
    <>
      <JsonLd data={pageGraph({ type: "FAQPage", path: "/how-it-works", name: title, description, crumbs: [{ name: title, path: "/how-it-works" }] })} />

      <div className="shell pb-12 pt-16 lg:pb-16 lg:pt-24">
        <h1 className="heading-2 measure-hero">From the street to opening day</h1>
        <p className="title-1 measure-hero mt-6 text-ink-subtle">
          Buying a business here takes four steps. We build everything up to the shutter, and you take it from there.
        </p>
      </div>

      <section data-ground="saffron" aria-label="The four steps">
        <Lambrequin className="text-(--palette-dusk)" />
        <div className="shell section-y">
          <Steps />
        </div>
      </section>

      <section data-ground="limewash" aria-labelledby="faq-heading">
        <Lambrequin className="text-(--palette-saffron)" />
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="reveal-mask lg:sticky lg:top-28 lg:self-start">
            <h2 id="faq-heading" className="heading-2">
              Questions people ask
            </h2>
          </Reveal>
          <Faq />
        </div>
      </section>
    </>
  );
}
