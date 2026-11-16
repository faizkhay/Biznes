import type { Metadata } from "next";
import Faq from "@/components/Faq";
import Included from "@/components/Included";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import Ring from "@/components/Ring";
import Steps from "@/components/Steps";
import Yours from "@/components/Yours";
import { pageGraph } from "@/lib/structured";

const title = "How it works";
const description = "How buying a ready-to-launch business on biznes.mu works: the four steps, what every business comes with, and what stays with you.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title, description, url: "/how-it-works" },
};

/**
 * The sale told in the order the buyer lives it, then what comes with every business, the honest
 * half, and the questions people ask. The same data as the home page, at reading length.
 */
export default function HowItWorks() {
  return (
    <>
      <JsonLd data={pageGraph({ type: "FAQPage", path: "/how-it-works", name: title, description, crumbs: [{ name: title, path: "/how-it-works" }] })} />

      <div className="shell pb-16 pt-16 lg:pb-24 lg:pt-24">
        <h1 className="heading-1 measure-hero">From the rail to opening day</h1>
        <p className="title-2 measure-hero mt-6 text-ink-subtle">
          Buying a business here takes four steps. We prepare everything up to the door, and you take it from there.
        </p>
      </div>

      <section aria-label="The four steps" className="shell pb-24">
        <Steps detailed />
      </section>

      <section className="bg-paper-subtle" aria-labelledby="included-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal className="reveal-mask">
              <h2 id="included-heading" className="heading-2">
                What every business comes with
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <Ring className="mt-10 w-full max-w-80" />
            </Reveal>
          </div>
          <Included />
        </div>
      </section>

      <Yours />

      <section aria-labelledby="faq-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="reveal-mask lg:sticky lg:top-24 lg:self-start">
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
