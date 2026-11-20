import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import VatCalc from "@/components/VatCalc";
import { count, day } from "@/lib/format";
import { vatFigures } from "@/lib/figures";

export const metadata: Metadata = {
  title: "VAT calculator for Mauritius",
  description: "Add VAT to a price or take it out at the rate in force in Mauritius, and check a year's turnover against the registration threshold. Figures from the VAT guide, with sources.",
  alternates: { canonical: "/tools/vat" },
};

const money = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function VatPage() {
  const { guide, rate, threshold } = vatFigures();
  return (
    <>
      <PageHead path={[{ href: "/tools", label: "Tools" }, { label: "VAT calculator" }]} title="VAT calculator" lede="Add VAT to a price or take it out, and check a year's turnover against the registration threshold." />
      <div className="shell">
        {!guide || !rate ? (
          <p className="body-2 note max-w-prose">The calculator takes its rate from the VAT guide, and that figure is not available just now, so it will not guess one. The Mauritius Revenue Authority publishes the rate in force.</p>
        ) : (
          <>
            {/* The figures in use, in the guide's own words, each with its source. */}
            <dl className="facts body-3 mb-12 max-w-2xl">
              <dt>{rate.label}</dt>
              <dd>
                {rate.said}
                {rate.detail ? `. ${rate.detail}` : ""}
              </dd>
              {threshold && (
                <>
                  <dt>{threshold.label}</dt>
                  <dd>
                    {threshold.said}
                    {threshold.detail ? `. ${threshold.detail}` : ""}
                  </dd>
                </>
              )}
              <dt>From</dt>
              <dd>
                <Link href={`/learn/${guide.slug}`}>{guide.title}</Link>, checked {day(guide.checked)}
              </dd>
            </dl>

            <VatCalc rate={rate.value} threshold={threshold?.value ?? null} />

            {/* The same sums for a visitor without script: a few amounts worked out here. */}
            <noscript>
              <div className="table-wrap mt-8 max-w-xl">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Before VAT</th>
                      <th scope="col">VAT at {rate.value}%</th>
                      <th scope="col">With VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[100, 500, 1000, 5000, 10000, 50000].map((n) => (
                      <tr key={n}>
                        <td className="data-1">MUR {count(n)}</td>
                        <td className="data-1">MUR {money.format((n * rate.value) / 100)}</td>
                        <td className="data-1">MUR {money.format(n * (1 + rate.value / 100))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </noscript>

            <p className="caption-1 mt-12 max-w-prose text-ink-faint">
              A calculator, not advice. Some supplies are zero-rated or exempt, and the rules change with each Finance Act: read <Link href={`/learn/${guide.slug}`}>the guide</Link> and its sources.
            </p>
          </>
        )}
      </div>
    </>
  );
}
