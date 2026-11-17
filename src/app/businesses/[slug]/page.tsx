import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Arrow, ArrowBack, Chat, Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import Lambrequin from "@/components/Lambrequin";
import Reveal from "@/components/Reveal";
import Shopfront from "@/components/Shopfront";
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
 * One business. Its shopfront at full size, shutter up, beside its name and price; then its brand
 * on a limewashed wall, what it is, what comes with it beside what the buyer brings, and the one
 * action: ask about it. The action is offered again in the footer's closing band.
 */
export default async function BusinessPage({ params }: Props) {
  const b = getBusiness((await params).slug);
  if (!b) notFound();

  const mark = wordmarkFor(b.slug);
  const askHref = `/enquire?business=${b.slug}`;
  // Only a real business still on the street can be asked about; a sample offers the way back.
  const canAsk = b.status === "available" && !b.sample;
  const next = BUSINESSES[(BUSINESSES.indexOf(b) + 1) % BUSINESSES.length];
  // The four colours a shopfront is painted in, as the brand would name them.
  const paints: [string, string][] = [
    [b.brand.colours[0], b.brand.ground],
    [b.brand.colours[1], b.brand.ink],
    [b.brand.colours[2], b.brand.accent],
    ["The wall", b.brand.wall],
  ];

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

      <header className="shell grid gap-x-20 gap-y-10 pb-16 pt-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:pb-24 lg:pt-12">
        <div>
          <Link href="/businesses" className="caption-2 link -ml-1 inline-flex min-h-11 items-center gap-2 text-ink-subtle">
            <ArrowBack className="size-4" />
            All businesses
          </Link>
          <p className="mt-4 flex flex-wrap items-center gap-2">
            <span className="plaque caption-4">No. {b.number}</span>
            <span className="plaque caption-4">{b.sample ? "Sample" : STATUS_LABEL[b.status]}</span>
            {b.places.map((place) => (
              <span key={place} className="plaque caption-4">
                {place}
              </span>
            ))}
          </p>
          <h1 className="heading-2 mt-4">{b.name}</h1>
          <p className="title-1 mt-3 text-ink-subtle">
            {b.sector}. {wherePhrase(b.places)}.
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
                <span className="heading-2 tabular">{formatPrice(b.price)}</span>
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
        {/* Its shopfront, shutter up: the room behind it is lit, and empty. */}
        <Reveal className="reveal-shop mx-auto w-full max-w-xl">
          <Shopfront business={b} open label />
        </Reveal>
      </header>

      {/* The brand, on a limewashed wall */}
      <section data-ground="limewash" aria-labelledby="brand-heading">
        <Lambrequin className="text-(--palette-dusk)" />
        <div className="shell section-y grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <Reveal className="reveal-mask">
              <h2 id="brand-heading" className="heading-2">
                Its brand, already made
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
            {/* The sign as it hangs, then reversed: its lettering as the ground, its ground as the letters. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-ground="brand" style={brandVars(b)} className="flex aspect-[16/9] items-center justify-center rounded-2xl">
                <Wordmark slug={b.slug} name={b.name} decorative scale={1.25} />
              </div>
              <div
                data-ground="brand"
                style={{ ...brandVars(b), "--brand-ground": b.brand.ink, "--brand-ink": b.brand.ground } as CSSProperties}
                className="flex aspect-[16/9] items-center justify-center rounded-2xl"
              >
                <Wordmark slug={b.slug} name={b.name} decorative scale={1.25} />
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label={`${b.name}'s colours`}>
              {paints.map(([name, hex]) => (
                <li key={name}>
                  <div className="aspect-[4/3] rounded-xl border border-line" style={{ background: hex }} />
                  <p className="title-3 mt-3">{name}</p>
                  <p className="caption-2 tabular uppercase text-ink-subtle">{hex}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* What it is, back at dusk */}
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

      {/* What comes with it, beside what you bring, on a saffron wall */}
      <section data-ground="saffron" aria-labelledby="with-heading">
        <Lambrequin className="text-(--palette-dusk)" />
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
            <p className="caption-1 measure mt-4">The price does not cover these, and we make no promise of income.</p>
          </Reveal>
        </div>
      </section>

      {/* The next shop on the street */}
      <nav aria-label="More businesses" data-ground="limewash">
        <Link href={`/businesses/${next.slug}`} className="shell group flex min-h-24 items-center justify-between gap-6 py-6 no-underline">
          <span>
            <span className="caption-2 block text-ink-subtle">Next on the street</span>
            <span className="heading-5 link block group-hover:decoration-current">{next.name}</span>
          </span>
          <Arrow className="size-6" />
        </Link>
      </nav>
    </article>
  );
}
