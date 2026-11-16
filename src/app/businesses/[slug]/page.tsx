import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, ArrowBack, Chat, Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import Plate from "@/components/Plate";
import Reveal from "@/components/Reveal";
import SampleMark from "@/components/SampleMark";
import Wordmark from "@/components/Wordmark";
import { BUSINESSES, SAMPLE_NOTE, STATUS_LABEL, getBusiness, wordmarkFor } from "@/data/businesses";
import { INCLUDED } from "@/data/pack";
import { ACTIONS, site } from "@/data/site";
import { brandVars } from "@/lib/brand";
import { formatPrice, wherePhrase } from "@/lib/format";
import { businessOffer, pageGraph } from "@/lib/structured";

type Props = { params: Promise<{ slug: string }> };

// One page per business in the data, and no others.
export const dynamicParams = false;
export const generateStaticParams = () => BUSINESSES.map((b) => ({ slug: b.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = getBusiness((await params).slug);
  if (!b) return {};
  const title = `${b.name}: ${b.sector.toLowerCase()}`;
  return {
    title,
    description: b.line,
    alternates: { canonical: `/businesses/${b.slug}` },
    openGraph: { title, description: b.line, url: `/businesses/${b.slug}` },
    // A sample is never indexed, even after launch.
    ...(b.sample ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * One business. Its tag at full size beside its name and price, then its brand in its own colours,
 * what it is, what comes with it beside what the buyer brings, and the one action: ask about it.
 * The action is offered again in the footer's closing band (components/ClosingBand.tsx).
 */
export default async function BusinessPage({ params }: Props) {
  const b = getBusiness((await params).slug);
  if (!b) notFound();

  const mark = wordmarkFor(b.slug);
  const where = wherePhrase(b.places);
  const askHref = `/enquire?business=${b.slug}`;
  // Only a real business that is still on the rail can be asked about; a sample offers the way back.
  const canAsk = b.status === "available" && !b.sample;
  const next = BUSINESSES[(BUSINESSES.indexOf(b) + 1) % BUSINESSES.length];

  return (
    <article>
      <JsonLd
        data={pageGraph({
          path: `/businesses/${b.slug}`,
          name: b.name,
          description: b.line,
          crumbs: [
            { name: "Businesses", path: "/businesses" },
            { name: b.name, path: `/businesses/${b.slug}` },
          ],
          extra: b.sample ? [] : [businessOffer(b)],
        })}
      />

      <header className="shell grid gap-x-20 gap-y-10 pb-16 pt-8 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:pb-24 lg:pt-12">
        <div>
          <Link href="/businesses" className="caption-2 -ml-1 inline-flex min-h-11 items-center gap-2 text-ink-subtle underline decoration-transparent transition-colors duration-300 ease-out hover:decoration-current">
            <ArrowBack className="size-4" />
            All businesses
          </Link>
          <p className="caption-4 mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-ink-subtle">
            <span>No. {b.number}</span>
            {b.sample ? <SampleMark className="text-ink" /> : <span>{STATUS_LABEL[b.status]}</span>}
          </p>
          <h1 className="heading-1 mt-3">{b.name}</h1>
          <p className="title-2 mt-3 text-ink-subtle">
            {b.sector}. {where}.
          </p>
          <p className="title-2 measure mt-6">{b.line}</p>
          {b.sample && <p className="body-6 measure mt-4 rounded-xl border border-line-strong p-4">{SAMPLE_NOTE}</p>}

          {/* A real price is an offer, set large. A sample's is a placeholder, and reads as one. */}
          {site.showPrices &&
            (b.sample ? (
              <p className="caption-2 mt-6 text-ink-subtle">
                <span className="tabular">{formatPrice(b.price)}</span>, a placeholder price
              </p>
            ) : (
              <p className="mt-8 flex flex-wrap items-baseline gap-x-3">
                <span className="heading-3 tabular">{formatPrice(b.price)}</span>
                <span className="caption-2 text-ink-subtle">for the whole business, sold once</span>
              </p>
            ))}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canAsk ? (
              <>
                <Link href={askHref} className="btn btn-filled button-md">
                  {ACTIONS.ask}
                </Link>
                <a href={site.contact.whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-quiet button-md">
                  <Chat className="size-5" />
                  {ACTIONS.whatsapp}
                </a>
                <a href={site.contact.phoneHref} className="btn btn-quiet button-md">
                  <Phone className="size-5" />
                  {ACTIONS.call}
                </a>
              </>
            ) : (
              <Link href="/businesses" className="btn btn-filled button-md">
                {ACTIONS.browse}
              </Link>
            )}
          </div>
        </div>
        <Reveal className="reveal-plate">
          <Plate business={b} />
        </Reveal>
      </header>

      {/* The brand, in its own colours */}
      <section className="bg-paper-subtle" aria-labelledby="brand-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <Reveal className="reveal-mask">
              <h2 id="brand-heading" className="heading-2">
                A brand of its own, already made
              </h2>
            </Reveal>
            <Reveal delay={120}>
              {b.nameNote && <p className="title-2 measure mt-6">{b.nameNote}</p>}
              <dl className="mt-8 border-t border-line-strong">
                <div className="grid grid-cols-[6rem_1fr] gap-4 border-b border-line py-3">
                  <dt className="caption-2 text-ink-subtle">Lettering</dt>
                  <dd className="body-3">{mark.face}</dd>
                </div>
                <div className="grid grid-cols-[6rem_1fr] gap-4 border-b border-line py-3">
                  <dt className="caption-2 text-ink-subtle">Colours</dt>
                  <dd className="body-3">{b.brand.colours.join(", ")}</dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal className="grid gap-4">
            {/* The lettering reversed: the brand's ink as the ground, its ground as the letters. */}
            <div
              data-ground="brand"
              style={{ ...brandVars(b), "--brand-ground": b.brand.ink, "--brand-ink": b.brand.ground } as CSSProperties}
              className="flex aspect-[16/7] items-center justify-center rounded-2xl"
            >
              <Wordmark slug={b.slug} name={b.name} decorative />
            </div>
            <ul className="grid grid-cols-3 gap-4" aria-label={`${b.name}'s colours`}>
              {[b.brand.ground, b.brand.ink, b.brand.accent].map((hex, i) => (
                <li key={hex}>
                  <div className="aspect-[4/3] rounded-xl border border-line" style={{ background: hex }} />
                  <p className="title-3 mt-3">{b.brand.colours[i]}</p>
                  <p className="caption-4 uppercase text-ink-subtle">{hex}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* What it is */}
      <section aria-labelledby="idea-heading">
        <div className="shell section-y grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal className="reveal-mask">
            <h2 id="idea-heading" className="heading-2">
              What {b.name} is
            </h2>
          </Reveal>
          <Reveal delay={120} className="grid gap-4">
            {b.idea.map((p) => (
              <p key={p} className="title-2 measure">
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* What comes with it, beside what you bring */}
      <section className="border-t border-line-strong" aria-labelledby="with-heading">
        <div className="shell section-y grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 id="with-heading" className="heading-3">
              What comes with it
            </h2>
            <ul className="mt-6 border-t border-line-strong">
              {INCLUDED.map((item) => (
                <li key={item.title} className="body-3 border-b border-line py-3">
                  {item.title}
                </li>
              ))}
            </ul>
            <Link href="/how-it-works" className="arrow-link button-md mt-2">
              {ACTIONS.how}
              <Arrow />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="heading-3">What you bring</h2>
            <ul className="mt-6 border-t border-line-strong">
              {b.bring.map((item) => (
                <li key={item} className="body-3 border-b border-line py-3">
                  {item}
                </li>
              ))}
            </ul>
            <p className="caption-2 measure mt-4 text-ink-subtle">The price does not cover these, and we make no promise of income.</p>
          </Reveal>
        </div>
      </section>

      {/* The next tag on the rail */}
      <nav aria-label="More businesses" className="border-t border-line-strong">
        <Link href={`/businesses/${next.slug}`} className="shell group flex min-h-24 items-center justify-between gap-6 py-6 no-underline">
          <span>
            <span className="caption-2 block text-ink-subtle">Next on the rail</span>
            <span className="heading-5 block underline decoration-transparent transition-colors duration-300 ease-out group-hover:decoration-current">
              {next.name}
            </span>
          </span>
          <Arrow className="size-6" />
        </Link>
      </nav>
    </article>
  );
}
