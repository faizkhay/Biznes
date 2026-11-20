import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { Arrow, Tick } from "@/components/Icons";
import { count, day } from "@/lib/format";
import { products } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Pocket guides to Mauritius",
  description: "Pocket guides to Mauritius as PDFs for your phone: places to see and things to do, region by region, every fact taken from an official source.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const list = products();
  return (
    <>
      <PageHead title="Pocket guides" path={[{ label: "Pocket guides" }]} lede="Guides to keep on your phone, made to be read on the road with no signal. Each is written the way the rest of biznes.mu is: from official pages, with every source listed at the back." />
      <div className="shell">
        {list.length === 0 && <p className="body-2 text-ink-subtle">The first guide is being made. It will be here shortly.</p>}
        {list.map((p) => (
          <article key={p.slug} className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <img src={`/shop/${p.slug}-cover.jpg`} alt={`The cover of the guide: ${p.cover}`} width={560} height={794} className="w-full max-w-sm rounded-xl shadow-[var(--shadow-lg)]" />
            </div>
            <div className="lg:col-span-7">
              <p className="label-1 tag tag-lit">PDF, {count(p.built!.pages)} pages</p>
              <h2 className="heading-1 mt-4">{p.title}</h2>
              <p className="body-1 mt-3 text-ink-subtle">{p.line}</p>
              <ul className="body-2 mt-6 grid gap-3">
                {[
                  `${count(p.built!.places)} places and things to do, in ${count(p.built!.regions)} parts of the island`,
                  "What each place is, what one does there, and what to know before going, where an official page says",
                  "Days out that put nearby places together",
                  `${count(p.built!.sources)} sources listed, every fact checked on ${day(p.built!.checked)}`,
                  "Made for a phone: A5 pages, readable without zooming, and it works with no signal",
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
                <Link href={`/add?product=${p.slug}`} className="btn btn-filled button-md">
                  Ask for this guide
                  <span className="btn-dot">
                    <Arrow />
                  </span>
                </Link>
                <span className="heading-3 tabular">{p.price ? `Rs ${count(p.price)}` : "Price to be announced"}</span>
              </p>
              <p className="caption-1 mt-3 max-w-prose text-ink-faint">Paying online is not open yet. Ask for the guide and we will send it and tell you how to pay. More guides are being made, and a bundle of them all will cost less than buying each.</p>
              <h3 className="heading-3 mt-12">A look inside</h3>
              <div className="mt-4 grid max-w-xl grid-cols-2 gap-4">
                {["opener", "sample"].map((name) => (
                  <img key={name} src={`/shop/${p.slug}-${name}.jpg`} alt={name === "opener" ? "A page that opens a part of the island" : "A page of places, each with its source numbers"} width={560} height={794} loading="lazy" className="w-full rounded-lg border border-line" />
                ))}
              </div>
              <p className="caption-1 mt-3 max-w-prose text-ink-faint">The pictures in the guide are illustrations made for biznes.mu, not photographs of the places.</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
