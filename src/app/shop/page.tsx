import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { Arrow, Tick } from "@/components/Icons";
import { count, day } from "@/lib/format";
import { monthName, offer, products, sponsorship } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Pocket guides to Mauritius",
  description: "Pocket guides to Mauritius as PDFs for your phone, renewed every month: places to see and things to do, region by region, every fact taken from an official source.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const list = products();
  const rules = sponsorship();
  return (
    <>
      <PageHead title="Pocket guides" path={[{ label: "Pocket guides" }]} lede="Guides to keep on your phone, made to be read on the road with no signal, and renewed every month. Each is written the way the rest of biznes.mu is: from official pages, with every source listed at the back." />
      <div className="shell">
        {list.length === 0 && <p className="body-2 text-ink-subtle">The first guide is being made. It will be here shortly.</p>}
        {list.map((p) => {
          const o = offer(p);
          const built = p.built!;
          return (
            <article key={p.slug} className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <img src={`/shop/${p.slug}-cover.jpg`} alt={`The cover of the guide: ${p.cover}`} width={560} height={794} className="w-full max-w-sm rounded-xl shadow-[var(--shadow-lg)]" />
              </div>
              <div className="lg:col-span-7">
                <p className="label-1 tag tag-lit">
                  {monthName(built.edition)} edition, {count(built.pages)} pages
                </p>
                <h2 className="heading-1 mt-4">{p.title}</h2>
                <p className="body-1 mt-3 text-ink-subtle">{p.line}</p>
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
                <p className="mt-8 flex flex-wrap items-center gap-4">
                  {o.free ? (
                    <a href={`/shop/${p.slug}/download`} className="btn btn-filled button-md">
                      Download it free
                      <span className="btn-dot">
                        <Arrow />
                      </span>
                    </a>
                  ) : (
                    <Link href={`/add?product=${p.slug}`} className="btn btn-filled button-md">
                      Ask for this guide
                      <span className="btn-dot">
                        <Arrow />
                      </span>
                    </Link>
                  )}
                  <span className="heading-3 tabular">{o.free ? `Free until ${o.freeUntil} ${monthName(o.month)}` : p.price ? `Rs ${count(p.price)}` : "Price to be announced"}</span>
                </p>
                <p className="caption-1 mt-3 max-w-prose text-ink-faint">
                  {o.free
                    ? `This month's sponsors have paid for this edition, so it is free for the first three weeks of the month. In the last week it is Rs ${count(p.price ?? 0)}.`
                    : "Paying online is not open yet. Ask for the guide and we will send it and tell you how to pay. In a month when sponsors pay for an edition, it is free for the first three weeks and paid in the last. More guides are being made, and a bundle of them all will cost less than buying each."}
                </p>
                <h3 className="heading-3 mt-12">A look inside</h3>
                <div className="mt-4 grid max-w-xl grid-cols-2 gap-4">
                  {["opener", "sample"].map((name) => (
                    <img key={name} src={`/shop/${p.slug}-${name}.jpg`} alt={name === "opener" ? "A page that opens a part of the island" : "A page of places, each with its source numbers"} width={560} height={794} loading="lazy" className="w-full rounded-lg border border-line" />
                  ))}
                </div>
                <p className="caption-1 mt-3 max-w-prose text-ink-faint">The pictures in the guide are illustrations made for biznes.mu, not photographs of the places.</p>
              </div>

              {rules && (
                <section aria-labelledby={`sponsor-${p.slug}`} className="card card-ink lg:col-span-12">
                  <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <h3 id={`sponsor-${p.slug}`} className="heading-2">
                        Put your business in the guide
                      </h3>
                      <p className="body-2 mt-3 opacity-80">
                        Each edition has a sponsors&rsquo; page. A business that pays to be on it is marked as a sponsor; nothing else in the guide is paid for. Sponsorship is taken for a coming month or months, from {monthName(o.next)} on.
                      </p>
                      <p className="body-3 mt-3 opacity-80">When an edition&rsquo;s sponsors together cover it, everyone gets that guide free for the first three weeks of its month.</p>
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
                        <li key={option.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-line pb-3">
                          <span>
                            <span className="title-1 block">{option.name}</span>
                            <span className="body-3 mt-1 block opacity-80">{option.what}</span>
                          </span>
                          <span className="heading-3 tabular whitespace-nowrap text-signal">Rs {count(option.price)}</span>
                        </li>
                      ))}
                      <li className="caption-1 opacity-80">Each price is for one month in one guide.</li>
                    </ul>
                  </div>
                </section>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
