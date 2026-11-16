import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Icons";
import Included from "@/components/Included";
import JsonLd from "@/components/JsonLd";
import Rail from "@/components/Rail";
import Reveal from "@/components/Reveal";
import Ring from "@/components/Ring";
import Steps from "@/components/Steps";
import TaglineReveal from "@/components/TaglineReveal";
import Yours from "@/components/Yours";
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
 * The home page. The rail comes first: the businesses themselves, hanging ready, are the site's
 * organising image. Then what hangs on each one's ring, the sale in four steps, the honest half on
 * night, the line said large, and who builds them. STORY.md has the chapters.
 */
export default function Home() {
  const forSale = BUSINESSES.filter((b) => b.status !== "sold");
  const hasSamples = forSale.some((b) => b.sample);

  return (
    <>
      <JsonLd data={pageGraph({ path: "/", name: `${site.name}: ${site.line}`, description: site.description })} />

      {/* The rail */}
      <section aria-labelledby="hero-heading">
        {/* On a wide screen the heading stands left and the lede and actions sit beside its last line,
            so the rail comes into the first view. Each column keeps the hero's 680px measure. The
            heading breaks where the thought breaks. */}
        <div className="shell grid gap-x-16 gap-y-6 pb-10 pt-16 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:pb-12 lg:pt-24">
          <h1 id="hero-heading" className="heading-1 measure-hero">
            Buy a business
            <br />
            ready to launch
          </h1>
          <div>
            <p className="title-2 measure-hero text-ink-subtle">
              In Mauritius, built by {site.builder.name}. Each one comes with its name, its brand, its website and its strategy, for a
              place on the island. Each is sold once, to one owner.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/businesses" className="btn btn-filled button-md">
                {ACTIONS.browse}
              </Link>
              <Link href="/how-it-works" className="arrow-link button-md">
                {ACTIONS.how}
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
        <div className="shell">
          {/* Said before the rail, not after it: a visitor reads this before any sample. */}
          {hasSamples && (
            <p className="caption-2 measure pb-6 text-ink-subtle">
              Tags marked Sample show how a business is presented here. Their names, looks and prices are placeholders, and they are
              not for sale.
            </p>
          )}
          <Rail businesses={forSale} label="Businesses for sale" />
        </div>
      </section>

      {/* The ring */}
      <section className="bg-paper-subtle" aria-labelledby="included-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal className="reveal-mask">
              <h2 id="included-heading" className="heading-2">
                Each business comes with six things, on one ring
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <Ring className="mt-10 w-full max-w-80" />
            </Reveal>
          </div>
          <Included />
        </div>
      </section>

      {/* The sale */}
      <section aria-labelledby="steps-heading">
        <div className="shell section-y">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4 pb-16">
            <Reveal className="reveal-mask">
              <h2 id="steps-heading" className="heading-2 measure-hero">
                From the rail to opening day, in four steps
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

      <Yours />

      {/* The line, said large */}
      <section aria-label="In one line">
        <div className="shell section-y">
          <TaglineReveal text={TAGLINE} className="heading-2 measure-hero mx-auto text-center" />
        </div>
      </section>

      {/* Who builds them */}
      <section className="bg-paper-subtle" aria-labelledby="builder-heading">
        <div className="shell section-y grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <Reveal className="reveal-mask">
            <h2 id="builder-heading" className="heading-3 measure-hero">
              Every business here is built by {site.builder.name}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="body-3 measure">
              {site.builder.name} is a Mauritian digital agency, founded in {site.builder.founded}. It builds brands and websites for
              businesses, and works by one belief: anyone can make a website; Khay tells stories. Each brand and website sold here is made
              the same way.
            </p>
            <a href={site.builder.url} target="_blank" rel="noopener noreferrer" className="arrow-link button-md mt-4">
              Visit {site.builder.name}
              <Arrow />
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
