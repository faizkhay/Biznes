import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { day } from "@/lib/format";
import { holidays, longDay, type Holiday } from "@/lib/holidays";
import { todayInMauritius } from "@/lib/theme";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Public holidays in Mauritius",
  description: "The public holidays of Mauritius, year by year, with the day of the week each falls on. Taken from the official notices in the Government Gazette.",
  path: "/holidays",
  drawn: true,
});

export default function HolidaysPage() {
  const data = holidays();
  const today = todayInMauritius();
  if (!data) {
    return (
      <>
        <PageHead here="/holidays" title="Public holidays" path={[{ label: "Public holidays" }]} lede="This page is being checked against the official notice and will be here shortly." />
        <div className="shell" />
      </>
    );
  }
  const years = Object.keys(data.years).sort();
  const row = (h: Holiday) => (
    <li key={`${h.date}-${h.name}`}>
      <div className="row grid grid-cols-[1fr_auto] items-baseline gap-x-6">
        <p className="title-2">{h.name}</p>
        <p className="data-1 text-right">{longDay(h.date).replace(/ \d{4}$/, "")}</p>
        {h.subjectToConfirmation && <p className="caption-1 col-span-2 mt-1 text-ink-faint">The date depends on the visibility of the moon and is subject to confirmation.</p>}
      </div>
    </li>
  );
  const next = years.flatMap((y) => data.years[y]).find((h) => h.date >= today);
  return (
    <>
      <PageHead here="/holidays" title="Public holidays in Mauritius" path={[{ label: "Public holidays" }]} lede={`Every public holiday, with the day of the week it falls on, taken from the official notices and last checked on ${day(data.checked)}.`}>
        {next && (
          <p className="mt-6">
            <span className="pill-note body-3">
              Next: {next.name}, {longDay(next.date)}
            </span>
          </p>
        )}
      </PageHead>
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-2">
        {years.map((year) => (
          <section key={year} id={year} aria-labelledby={`y-${year}`} className="scroll-mt-24">
            <h2 id={`y-${year}`} className="heading-2">
              {year}
            </h2>
            <ul className="rows mt-4">{data.years[year].filter((h) => h.date >= today).map(row)}</ul>
            {data.years[year].some((h) => h.date < today) && (
              <details className={data.years[year].some((h) => h.date >= today) ? "mt-4" : "mt-2"}>
                <summary className="filter body-3 inline-flex">
                  Earlier in {year} <span className="n data-2">{data.years[year].filter((h) => h.date < today).length}</span>
                </summary>
                <ul className="rows mt-4 text-ink-subtle">{data.years[year].filter((h) => h.date < today).map(row)}</ul>
              </details>
            )}
          </section>
        ))}
        <section aria-labelledby="h-sources" className="max-w-prose lg:col-span-2">
          <h2 id="h-sources" className="heading-3">
            References
          </h2>
          <ol className="body-3 mt-4 grid gap-2 text-ink-subtle">
            {data.sources.map((s) => (
              <li key={s.n} className="flex gap-3">
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
            What the law says about working on a public holiday is in <Link href="/learn/employing-people">Employing people in Mauritius</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
