import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { PageHead } from "@/components/Bits";
import BusinessTaxCalc from "@/components/BusinessTaxCalc";
import { count, day } from "@/lib/format";
import { businessTaxFigures, citesOf, incomeTaxFigures, vatFigures } from "@/lib/figures";
import { business } from "@/lib/sums";

export const metadata: Metadata = {
  title: "Business tax estimator for Mauritius",
  description: "Estimate a year's taxes on a business in Mauritius: a company's income tax, CSR, the climate levy and the Fair Share Contribution, when the Advance Payment System applies, and how a sole trader or a société is taxed instead. Figures from the guide, with sources.",
  alternates: { canonical: "/tools/business-tax" },
};

const money = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rupees = (n: number | null | undefined) => (n == null ? "Not worked out" : `MUR ${money.format(n)}`);

export default function BusinessTaxPage() {
  const { guide, figures } = businessTaxFigures();
  // Two thresholds belong to other guides: the turnover at which VAT registration is compulsory, and
  // the gross income above which a self-employed person pays during the year.
  const vat = vatFigures();
  const person = incomeTaxFigures();
  const threshold = vat.guide && vat.threshold ? { label: vat.threshold.label, said: vat.threshold.said, detail: vat.threshold.detail, value: vat.threshold.value, cites: citesOf(vat.guide, vat.threshold.sources), guide: vat.guide.slug } : null;
  const cps = person.guide && person.figures.cps ? { ...person.figures.cps, guide: person.guide.slug } : null;
  const mra = guide?.resources.find((r) => /business\/corporate-tax/.test(r.url));
  // The guide says, in its own summary, which law its figures are those of.
  const inForce = guide?.summary.match(/Figures are[^.]*\./)?.[0] ?? "";
  return (
    <>
      <PageHead
        path={[{ href: "/tools", label: "Tools" }, { label: "Business tax estimator" }]}
        title="Business tax estimator"
        lede="A year's taxes on a business, worked line by line: a company's income tax and the levies charged with it, when to pay during the year, and how a sole trader or a société is taxed instead."
      />
      <div className="shell">
        {!guide || !figures.rate ? (
          <p className="body-2 note max-w-prose">The estimator takes its rates from the guide to business taxes, and they are not available just now, so it will not guess them. The Mauritius Revenue Authority publishes the rates in force.</p>
        ) : (
          <>
            <BusinessTaxCalc figures={figures} guide={guide.slug} vat={threshold} cps={cps} />

            <h2 className="heading-3 mt-16">The figures it uses</h2>
            {/* Below the calculator, so the calculator is the first thing on the screen. The figures in use, in the guide's own words, with the day they were checked. */}
            <dl className="facts body-3 mt-6 max-w-2xl">
              <dt>{figures.rate.label}</dt>
              <dd>
                {figures.rate.said}
                {figures.rate.detail ? `. ${figures.rate.detail}` : ""}
              </dd>
              {[figures.csr, figures.ccr, figures.fairShare].map(
                (fact) =>
                  fact && (
                    <Fragment key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.said}</dd>
                    </Fragment>
                  ),
              )}
              <dt>From</dt>
              <dd>
                <Link href={`/learn/${guide.slug}`}>{guide.title}</Link>, checked {day(guide.checked)}. {inForce} The numbers in brackets beside a line are that guide&rsquo;s sources.
              </dd>
            </dl>

            {/* The same sums for a visitor without script: a few companies worked out here, from the same figures. */}
            <noscript>
              <p className="body-3 mt-12 max-w-prose">The estimator needs JavaScript. These examples are worked from the same figures, for a company taxed at the standard rate whose chargeable income was the same the year before.</p>
              <div className="table-wrap mt-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Chargeable income</th>
                      <th scope="col">Turnover</th>
                      <th scope="col">Income tax</th>
                      <th scope="col">CSR Fund</th>
                      <th scope="col">CCR levy</th>
                      <th scope="col">Fair Share Contribution</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [500000, 5000000],
                      [2000000, 20000000],
                      [10000000, 60000000],
                      [30000000, 300000000],
                    ].map(([profit, turnover]) => {
                      const sum = business({ turnover, profit, previous: profit, exports: null, qualifying: null, presumptive: false }, figures);
                      return (
                        <tr key={profit}>
                          {/* On a phone a row stands alone, with no column head over its first figure, so the figure says what it is. */}
                          <th scope="row" className="data-1">
                            MUR {count(profit)} of chargeable income
                          </th>
                          <td className="data-1" data-label="Turnover">
                            MUR {count(turnover)}
                          </td>
                          <td className="data-1" data-label="Income tax">
                            {rupees(sum.incomeTax)}
                          </td>
                          <td className="data-1" data-label="CSR Fund">
                            {rupees(sum.csr?.amount)}
                          </td>
                          <td className="data-1" data-label="CCR levy">
                            {rupees(sum.ccr?.amount)}
                          </td>
                          <td className="data-1" data-label="Fair Share Contribution">
                            {rupees(sum.fairShare?.amount)}
                          </td>
                          <td className="data-1" data-label="Total">
                            {rupees(sum.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </noscript>

            <p className="caption-1 mt-12 max-w-prose text-ink-faint">
              General information, not tax advice. An estimate from the figures entered: it does not work out chargeable income, losses, tax credits or tax deducted at source, and it leaves out banks, global business companies and the alternative minimum tax. The rules change with each Finance Act: read <Link href={`/learn/${guide.slug}`}>the guide</Link> and its sources.
              {mra && (
                <>
                  {" "}
                  The Mauritius Revenue Authority sets out{" "}
                  <a href={mra.url} rel="noopener">
                    corporate taxation
                  </a>{" "}
                  on its own site.
                </>
              )}
            </p>
          </>
        )}
      </div>
    </>
  );
}
