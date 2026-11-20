import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import IncomeTaxCalc from "@/components/IncomeTaxCalc";
import { count, day } from "@/lib/format";
import { incomeTaxFigures } from "@/lib/figures";
import { personal, type PersonalInput } from "@/lib/sums";

export const metadata: Metadata = {
  title: "Personal income tax calculator for Mauritius",
  description: "Work out a year's income tax in Mauritius from a salary and other income: the deductions for dependents, the reliefs and their caps, the tax band by band, and what CSG and the National Savings Fund take. Figures from the guide, with sources.",
  alternates: { canonical: "/tools/income-tax" },
};

const money = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rupees = (n: number | null | undefined) => (n == null ? "Not worked out" : `MUR ${money.format(n)}`);
/** A person with a salary and nothing else, for the examples a visitor without script is shown. */
const earner = (salary: number, dependents: number): PersonalInput => ({ resident: true, salary, months: 12, profit: 0, other: 0, dependents, retired: false, university: 0, schoolChildren: 0, schoolFees: 0, housing: 0, medical: 0, pension: 0, donations: 0, carer: 0 });

export default function IncomeTaxPage() {
  const { guide, figures } = incomeTaxFigures();
  const mra = guide?.resources.find((r) => /taxcalculator/.test(r.url));
  return (
    <>
      <PageHead
        path={[{ href: "/tools", label: "Tools" }, { label: "Personal income tax calculator" }]}
        title="Personal income tax calculator"
        lede="A year's income tax from a salary, a business or other income, worked line by line: the deductions, the tax band by band, and what CSG and the National Savings Fund take besides."
      />
      <div className="shell">
        {!guide || !figures.bands ? (
          <p className="body-2 note max-w-prose">The calculator takes its bands from the guide to personal income tax, and they are not available just now, so it will not guess them. The Mauritius Revenue Authority publishes the rates in force.</p>
        ) : (
          <>
            {/* The figures in use, in the guide's own words, with the year they are for and the day they were checked. */}
            <dl className="facts body-3 mb-12 max-w-2xl">
              {figures.year && (
                <>
                  <dt>{figures.year.label}</dt>
                  <dd>
                    {figures.year.said}. {figures.year.detail}
                  </dd>
                </>
              )}
              <dt>{figures.bands.label}</dt>
              <dd>
                {figures.bands.said}
                {figures.bands.detail ? `. ${figures.bands.detail}` : ""}
              </dd>
              {figures.dependents && (
                <>
                  <dt>{figures.dependents.label}</dt>
                  <dd>{figures.dependents.said}</dd>
                </>
              )}
              <dt>From</dt>
              <dd>
                <Link href={`/learn/${guide.slug}`}>{guide.title}</Link>, checked {day(guide.checked)}. The numbers in brackets beside a line are that guide&rsquo;s sources.
              </dd>
            </dl>

            <IncomeTaxCalc figures={figures} guide={guide.slug} />

            {/* The same sums for a visitor without script: a few salaries worked out here, from the same figures. */}
            <noscript>
              <p className="body-3 mt-12 max-w-prose">The calculator needs JavaScript. These examples are worked from the same figures, for a resident paid a salary over 12 months with no other income and no reliefs.</p>
              <div className="table-wrap mt-6 max-w-4xl">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Salary for the year</th>
                      <th scope="col">Income tax, no dependents</th>
                      <th scope="col">Income tax, two dependents</th>
                      <th scope="col">CSG for the year</th>
                      <th scope="col">National Savings Fund for the year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[360000, 600000, 780000, 1200000, 1500000, 3000000, 15000000].map((n) => {
                      const alone = personal(earner(n, 0), figures);
                      const family = personal(earner(n, 2), figures);
                      return (
                        <tr key={n}>
                          {/* On a phone a row stands alone, with no column head over its first figure, so the figure says what it is. */}
                          <th scope="row" className="data-1">
                            MUR {count(n)} a year
                          </th>
                          <td className="data-1" data-label="Income tax, no dependents">
                            {rupees(alone.tax)}
                          </td>
                          <td className="data-1" data-label="Income tax, two dependents">
                            {rupees(family.tax)}
                          </td>
                          <td className="data-1" data-label="CSG for the year">
                            {rupees(alone.csg?.year)}
                          </td>
                          <td className="data-1" data-label="National Savings Fund for the year">
                            {rupees(alone.nsf?.year)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </noscript>

            <p className="caption-1 mt-12 max-w-prose text-ink-faint">
              General information, not tax advice. The calculator leaves out what it cannot know: exempt income, fringe benefits, losses, tax credits and tax already withheld. The rules change with each Finance Act: read <Link href={`/learn/${guide.slug}`}>the guide</Link> and its sources.
              {mra && (
                <>
                  {" "}
                  The Mauritius Revenue Authority has{" "}
                  <a href={mra.url} rel="noopener">
                    its own tax calculator
                  </a>
                  . {mra.what.replace(/^[^.]*\.\s*/, "")}
                </>
              )}
            </p>
          </>
        )}
      </div>
    </>
  );
}
