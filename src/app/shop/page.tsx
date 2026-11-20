import type { Metadata } from "next";
import Link from "next/link";
import SubscribeForm from "@/components/account/SubscribeForm";
import { PageHead } from "@/components/Bits";
import { AddToCart } from "@/components/Cart";
import { Arrow, Tick } from "@/components/Icons";
import { PUBLICATIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { count, day } from "@/lib/format";
import { freeFor, monthName, offer, products, sponsorPages, sponsorship } from "@/lib/shop";
import { pageMeta } from "@/lib/meta";

const description = "Mauritius, place by place, as a PDF for your phone. Renewed every month, every fact from an official source, and free in the weeks its sponsors pay for.";
export const metadata: Metadata = pageMeta({ title: PUBLICATIONS.guide.name, description, path: "/shop", drawn: true });

/** Parts of a page as a person says them: 0.125 is "an eighth of a page". */
const share = (pages: number) => (pages >= 1 ? `${count(pages)} ${pages === 1 ? "page" : "pages"}` : pages === 0.5 ? "half a page" : pages === 0.25 ? "a quarter of a page" : pages === 0.125 ? "an eighth of a page" : `${pages} of a page`);
const room = (pages: number) => (Number.isInteger(pages) ? `${count(pages)} ${pages === 1 ? "page" : "pages"}` : `${pages.toFixed(2).replace(/0+$/, "")} pages`);

/**
 * The pocket guide: there is one, renewed every month. This page sells this month's edition (or
 * hands it out, in the weeks its sponsors have paid for), takes a business's request to be on the
 * sponsors' pages of a coming edition, and says that a magazine is coming.
 */
export default function ShopPage() {
  const p = products()[0];
  const rules = sponsorship();
  if (!p) {
    return (
      <>
        <PageHead here="/shop" title={PUBLICATIONS.guide.name} path={[{ label: PUBLICATIONS.guide.short }]} lede="A guide to Mauritius for your phone, renewed every month." />
        <div className="shell">
          <p className="body-2 text-ink-subtle">This month&rsquo;s edition is being made. It will be here shortly.</p>
        </div>
      </>
    );
  }
  const o = offer(p);
  const built = p.built!;
  const coming = sponsorPages(p, o.next, rules);
  const steps = [...(rules?.free ?? [])].sort((a, b) => a.raised - b.raised);
  return (
    <>
      <PageHead here="/shop" title={PUBLICATIONS.guide.name} path={[{ label: PUBLICATIONS.guide.short }]} lede="One guide to Mauritius, to keep on your phone and read on the road with no signal. A new edition every month, written the way the rest of biznes.mu is: from official pages, with every source listed at the back." />
      <div className="shell">
        <article className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <img src={`/shop/${p.slug}-cover.jpg`} alt={`The cover of the ${p.title}, ${monthName(built.edition)} edition.`} width={560} height={794} className="w-full max-w-sm rounded-xl shadow-[var(--shadow-lg)]" />
          </div>
          <div className="lg:col-span-7">
            <p className="label-1 tag tag-lit">
              {monthName(built.edition)} edition, {count(built.pages)} pages
            </p>
            <h2 className="heading-1 mt-4">{p.line.split(":")[0]}</h2>
            <p className="body-1 mt-3 text-ink-subtle">{p.line.split(":").slice(1).join(":").trim().replace(/^./, (c) => c.toUpperCase())}</p>
            <ul className="body-2 mt-6 grid gap-3">
              {[
                `${count(built.places)} places and things to do, in ${count(built.regions)} parts of the island`,
                "What each place is, what one does there, and what to know before going, where an official page says",
                "Days out that put nearby places together",
                `${count(built.sources)} sources listed, every fact checked on ${day(built.checked)}`,
                "Made for a phone: A5 pages, readable without zooming, and it works with no signal",
                "A new edition every month",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1 grid size-6 flex-none place-items-center rounded-full bg-signal">
                    <Tick className="size-4" strokeWidth={2.25} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-8 flex flex-wrap items-center gap-3">
              {o.free ? (
                <a href={`/shop/${p.slug}/download`} className="btn btn-filled button-md">
                  Download it free
                  <span className="btn-dot">
                    <Arrow />
                  </span>
                </a>
              ) : (
                <>
                  <AddToCart item={{ id: `guide:${p.slug}:${built.edition}`, kind: "guide", name: p.title, detail: `${monthName(built.edition)} edition`, price: p.price, qty: 1 }} />
                  <Link href={`/add?product=${p.slug}`} className="btn btn-quiet button-md">
                    Ask for this guide
                  </Link>
                </>
              )}
              <span className="heading-3 tabular">{o.free ? (o.wholeMonth ? `Free all of ${monthName(o.month)}` : `Free until ${o.freeUntil} ${monthName(o.month)}`) : p.price ? `Rs ${count(p.price)}` : "Price to be announced"}</span>
            </p>
            <p className="caption-1 mt-3 max-w-prose text-ink-faint">
              {o.free
                ? `This month's sponsors have paid for this edition, so it is free for ${o.step ? freeFor(o.step).replace("its month", "the month") : "now"}.${o.wholeMonth ? "" : ` After that it is Rs ${count(p.price ?? 0)}.`}`
                : "Paying online is not open yet. Put the guide in your cart or ask for it, and a person sends it and tells you how to pay."}
            </p>

            {steps.length > 0 && (
              <section aria-labelledby="free-weeks" className="mt-8">
                <h3 id="free-weeks" className="heading-3">
                  When the guide is free
                </h3>
                <p className="body-3 mt-2 max-w-prose text-ink-subtle">The businesses that sponsor an edition can pay for everyone&rsquo;s copy. What they have paid together for the month decides how long it is free; the rest of the month it is Rs {count(p.price ?? 0)}.</p>
                <dl className="facts body-3 mt-4">
                  {steps.map((step) => (
                    <div key={step.raised} className="contents">
                      <dt className="data-1 text-ink">Rs {count(step.raised)}</dt>
                      <dd>Free for {freeFor(step)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="caption-1 mt-2 text-ink-faint">
                  For the {monthName(o.month)} edition, sponsors have paid Rs {count(o.raised)}.
                </p>
              </section>
            )}

            <h3 className="heading-3 mt-12">A look inside</h3>
            <div className="mt-4 grid max-w-xl grid-cols-2 gap-4">
              {["opener", "sample"].map((name) => (
                <img key={name} src={`/shop/${p.slug}-${name}.jpg`} alt={name === "opener" ? "A page that opens a part of the island" : "A page of places, each with its source numbers"} width={560} height={794} loading="lazy" className="w-full rounded-lg border border-line" />
              ))}
            </div>
            <p className="caption-1 mt-3 max-w-prose text-ink-faint">The pictures in the guide are illustrations made for biznes.mu, not photographs of the places.</p>
          </div>

          {rules && (
            <section id="sponsor" aria-labelledby="sponsor-h" className="card card-ink scroll-mt-24 lg:col-span-12">
              <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h3 id="sponsor-h" className="heading-2">
                    Put your business in the guide
                  </h3>
                  <p className="body-2 mt-3 opacity-80">
                    Each edition has sponsors&rsquo; pages. A business that pays to be on them is marked as a sponsor; nothing else in the guide is paid for. Sponsorship is taken for a coming month or months, from {monthName(o.next)} on.
                  </p>
                  <p className="body-3 mt-3 opacity-80">
                    An edition holds at most {count(rules.maxPages)} pages of sponsors. In the {monthName(o.next)} edition, {room(coming.left)} of {count(coming.most)} are free.
                  </p>
                  <p className="mt-6">
                    <Link href={`/add?sponsor=${p.slug}`} className="btn btn-filled button-md">
                      Sponsor the {monthName(o.next)} edition
                      <span className="btn-dot">
                        <Arrow />
                      </span>
                    </Link>
                  </p>
                </div>
                <ul className="grid gap-3 lg:col-span-7">
                  {rules.options.map((option) => (
                    <li key={option.id} className="grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-2 border-b border-line pb-3">
                      <span>
                        <span className="title-1 block">{option.name}</span>
                        <span className="body-3 mt-1 block opacity-80">
                          {option.what} It takes {share(option.pages)}.
                        </span>
                      </span>
                      <span className="heading-3 tabular whitespace-nowrap text-signal">Rs {count(option.price)}</span>
                      <span className="col-span-2 empty:hidden">
                        <AddToCart small quiet item={{ id: `sponsor:${option.id}:${o.next}`, kind: "sponsor", name: `${option.name} in the ${PUBLICATIONS.guide.short}`, detail: `From the ${monthName(o.next)} edition, counted by the month`, price: option.price, qty: 1 }} />
                      </span>
                    </li>
                  ))}
                  <li className="caption-1 opacity-80">Each price is for one month. The fees are the owner&rsquo;s, confirmed on 20 November 2026.</li>
                </ul>
              </div>
            </section>
          )}
        </article>

        {/* The magazine: said to be coming, and no more is said of it than is so. */}
        <section aria-labelledby="magazine" className="mt-12 grid gap-x-16 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label-1 tag">Coming</p>
            <h2 id="magazine" className="heading-2 mt-3">
              {PUBLICATIONS.magazine.name}
            </h2>
            <p className="body-2 mt-3 text-ink-subtle">{PUBLICATIONS.magazine.line}</p>
          </div>
          <div className="lg:col-span-7">
            <div className="card">
              <h3 className="title-1">Be sent the guide and the magazine</h3>
              <p className="body-3 mt-1 text-ink-subtle">One list for both: each edition of the {PUBLICATIONS.guide.short} when it comes out, and the {PUBLICATIONS.magazine.short} when it begins.</p>
              {accountsOn ? (
                <SubscribeForm className="mt-4" />
              ) : (
                <p className="body-3 mt-4 text-ink-subtle">
                  The list opens with accounts, which are not open yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
