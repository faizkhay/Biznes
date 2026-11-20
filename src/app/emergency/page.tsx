import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { day } from "@/lib/format";
import { dialHref, emergency } from "@/lib/emergency";

export const metadata: Metadata = {
  title: "Emergency numbers in Mauritius",
  description: "The emergency numbers and helplines of Mauritius in one place: police, ambulance, fire, the coast guard, utilities and help lines. Each is taken from an official page, named with the day it was read.",
  alternates: { canonical: "/emergency" },
};

export default function EmergencyPage() {
  const data = emergency();
  if (!data) {
    return (
      <>
        <PageHead title="Emergency numbers" path={[{ label: "Emergency numbers" }]} lede="This page is being checked against the official sources and will be here shortly." />
        <div className="shell" />
      </>
    );
  }
  const [first, ...rest] = data.groups;
  const cites = (sources: number[]) =>
    [...sources]
      .sort((a, b) => a - b)
      .map((n) => (
        <a key={n} href={`#source-${n}`} className="cite cite-lg" aria-label={`Source ${n}`}>
          {n}
        </a>
      ));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Emergency numbers in Mauritius",
          dateModified: data.checked,
          mainEntity: data.groups.flatMap((g) => g.items.map((i) => ({ "@type": "ContactPoint", name: i.name, telephone: i.number, areaServed: "MU", description: i.what }))),
        }}
      />
      <PageHead title="Emergency numbers" path={[{ label: "Emergency numbers" }]} lede={`Who to call in Mauritius, in one place. Every number is taken from an official page, named below, and was last checked on ${day(data.checked)}. Tap a number to call it.`} />
      <div className="shell">
        {/* The first group is the one to find in a hurry: the numbers are the largest thing on the page. */}
        {first && (
          <section aria-labelledby={`g-${first.id}`}>
            <h2 id={`g-${first.id}`} className="sr-only">
              {first.label}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {first.items.map((i) => (
                <li key={i.name}>
                  <article className="card card-ink flex h-full flex-col">
                    <h3 className="title-1">{i.name}</h3>
                    <p className="body-3 mt-1 opacity-80">{i.what}</p>
                    <p className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                      <a href={dialHref(i.number)} className="btn btn-filled button-md">
                        <Phone /> <span className="heading-3 tabular">{i.number}</span>
                      </a>
                      {i.also?.map((n) => (
                        <a key={n} href={dialHref(n)} className="data-1 inline-flex min-h-11 items-center">
                          or {n}
                        </a>
                      ))}
                      <span className="ml-auto">{cites(i.sources)}</span>
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rest.map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`} className="mt-12">
            <h2 id={`g-${g.id}`} className="heading-2">
              {g.label}
            </h2>
            <ul className="rows mt-4 max-w-4xl">
              {g.items.map((i) => (
                <li key={i.name}>
                  <article className="row grid gap-x-8 gap-y-2 sm:grid-cols-12">
                    <div className="sm:col-span-7">
                      <h3 className="title-1">
                        {i.name} {cites(i.sources)}
                      </h3>
                      <p className="body-3 mt-1 text-ink-subtle">
                        {i.what}
                        {i.hours ? ` ${i.hours}.` : ""}
                      </p>
                    </div>
                    <p className="flex flex-wrap items-center gap-2 sm:col-span-5 sm:justify-end">
                      {[i.number, ...(i.also ?? [])].map((n) => (
                        <a key={n} href={dialHref(n)} className="act data-1">
                          <Phone /> {n}
                        </a>
                      ))}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section aria-labelledby="sources" className="mt-16 max-w-4xl">
          <h2 id="sources" className="heading-3">
            Where these come from
          </h2>
          <ol className="body-3 mt-4 grid gap-2 text-ink-subtle">
            {data.sources.map((s) => (
              <li key={s.n} id={`source-${s.n}`} className="flex gap-3">
                <span className="data-2 w-6 flex-none text-ink-faint">{s.n}</span>
                <span>
                  <a href={s.url} rel="noopener">
                    {s.title}
                  </a>
                  , {s.publisher}. Read {day(s.read)}.
                </span>
              </li>
            ))}
          </ol>
          {data.unverified.length > 0 && (
            <div className="note body-3 mt-8">
              <p className="font-semibold">What we could not confirm</p>
              <ul className="mt-2 grid gap-1 text-ink-subtle">
                {data.unverified.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="body-3 mt-8 text-ink-subtle">
            A number that is wrong here matters more than anywhere else on the site. If you find one, <Link href="/add">tell us</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
