"use client";

import { useEffect, useId, useState } from "react";
import { Choice, Line, Marks, Sum, Tick, percent, read, round, rupees } from "@/components/CalcBits";
import { Chevron } from "@/components/Icons";
import { medicalCap, personal, type IncomeTaxFigures, type Relief } from "@/lib/sums";

const NUMBER = "Enter the amount in figures, such as 45000 or 45,000.";
const COUNTS = ["None", "One", "Two", "Three", "Four"];

/**
 * The personal income tax calculator. Every band, deduction, cap and rate is given to it by the
 * page, which reads them from the guide to personal income tax; it holds no figure of its own, and
 * a part whose figure is missing is not worked out. The working is shown line by line, each figure
 * with the number of the guide's source it came from.
 */
export default function IncomeTaxCalc({ figures: f, guide }: { figures: IncomeTaxFigures; guide: string }) {
  const id = useId();
  const [resident, setResident] = useState<"yes" | "no">("yes");
  const [salary, setSalary] = useState("");
  const [per, setPer] = useState<"month" | "year">("month");
  const [months, setMonths] = useState<12 | 13>(12);
  const [profit, setProfit] = useState("");
  const [other, setOther] = useState("");
  const [dependents, setDependents] = useState(0);
  const [retired, setRetired] = useState(false);
  const [university, setUniversity] = useState(0);
  const [pupils, setPupils] = useState(0);
  const [fees, setFees] = useState("");
  const [housing, setHousing] = useState("");
  const [medical, setMedical] = useState("");
  const [pension, setPension] = useState("");
  const [donations, setDonations] = useState("");
  const [carer, setCarer] = useState("");

  // The business tax tool hands a sole trader's profit over in the address: /tools/income-tax?profit=1200000.
  useEffect(() => {
    const handed = new URLSearchParams(window.location.search).get("profit");
    if (handed && read(handed)) setProfit(handed);
  }, []);

  const here = resident === "yes";
  const typed = { salary: read(salary), profit: read(profit), other: read(other), fees: read(fees), housing: read(housing), medical: read(medical), pension: read(pension), donations: read(donations), carer: read(carer) };
  const most = Math.min(dependents, f.university?.most ?? dependents);
  const students = Math.min(university, most);
  const atSchool = Math.min(pupils, dependents);
  const feesAlone = here && (typed.fees ?? 0) > 0 && atSchool === 0;
  const wrong = Object.values(typed).some((n) => n == null) || feesAlone;
  const yearly = (typed.salary ?? 0) * (per === "month" ? months : 1);
  const sum = wrong
    ? null
    : personal(
        // A non-resident's deductions are not asked for, so none is passed on.
        here
          ? { resident: true, salary: yearly, months, profit: typed.profit ?? 0, other: typed.other ?? 0, dependents, retired, university: students, schoolChildren: atSchool, schoolFees: typed.fees ?? 0, housing: typed.housing ?? 0, medical: typed.medical ?? 0, pension: typed.pension ?? 0, donations: typed.donations ?? 0, carer: typed.carer ?? 0 }
          : { resident: false, salary: yearly, months, profit: typed.profit ?? 0, other: typed.other ?? 0, dependents: 0, retired: false, university: 0, schoolChildren: 0, schoolFees: 0, housing: 0, medical: 0, pension: 0, donations: 0, carer: 0 },
        f,
      );
  const empty = !sum || sum.income <= 0;

  const names: Record<string, { label: string; cites?: number[] }> = {
    dependents: { label: `Deduction for ${dependents === 4 ? "four or more dependents" : dependents === 1 ? "one dependent" : `${COUNTS[dependents]?.toLowerCase()} dependents`}`, cites: f.dependents?.cites },
    retired: { label: "Additional deduction, retired or disabled person", cites: f.retired?.cites },
    university: { label: `${students === 1 ? "One child" : `${COUNTS[students]} children`} at university`, cites: f.university?.cites },
    school: { label: "Private school fees", cites: f.school?.cites },
    housing: { label: "Interest on a housing loan", cites: f.housing?.cites },
    medical: { label: "Medical insurance premium", cites: f.medical?.cites },
    pension: { label: "Personal pension scheme", cites: f.pension?.cites },
    donations: { label: "Donations to charities", cites: f.donations?.cites },
    carer: { label: "Wages of a carer", cites: f.carer?.cites },
  };
  const why = (r: Relief) =>
    r.why === "cap"
      ? `${rupees(r.asked)} was entered. The most allowed is ${rupees(r.cap ?? 0)}.`
      : r.why === "income"
        ? `Not allowed: income is above ${round(f.housing?.ceiling ?? 0)}.`
        : r.why === "figure"
          ? "Not worked out: the guide's figure for this is not available."
          : undefined;

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="grid content-start gap-10">
        <section aria-labelledby={`${id}-you`}>
          <h2 id={`${id}-you`} className="heading-2">
            Your income for the year
          </h2>
          <div className="mt-6 grid gap-6">
            <Choice
              name={`${id}-resident`}
              legend="In the income year you are"
              options={
                [
                  ["yes", "Resident in Mauritius"],
                  ["no", "Not resident"],
                ] as const
              }
              value={resident}
              onChange={setResident}
            />
            {!here && f.nonResident && (
              <p className="body-3 note">
                {f.nonResident.detail}
                <Marks cites={f.nonResident.cites} guide={guide} /> A non-resident&rsquo;s rent, royalties and other income from property are taxed at a flat rate, outside these bands: leave them out here.
              </p>
            )}
            <div className="grid gap-6 sm:grid-cols-2">
              <Sum id={`${id}-salary`} label="Basic salary, in rupees" value={salary} onChange={setSalary} placeholder="For example, 45,000" error={typed.salary == null ? NUMBER : undefined} />
              <Choice
                name={`${id}-per`}
                legend="That salary is for"
                options={
                  [
                    ["month", "A month"],
                    ["year", "The year"],
                  ] as const
                }
                value={per}
                onChange={setPer}
              />
            </div>
            <Choice
              name={`${id}-months`}
              legend="In the year you are paid"
              options={
                [
                  [12, "12 months"],
                  [13, "13 months, with an end of year bonus"],
                ] as const
              }
              value={months}
              onChange={setMonths}
            />
            <Sum id={`${id}-profit`} label="Profit from a business or profession, for the year" value={profit} onChange={setProfit} hint="For a self-employed person: what the business earned less what it cost to earn it." error={typed.profit == null ? NUMBER : undefined} />
            <Sum id={`${id}-other`} label="Other taxable income, for the year" value={other} onChange={setOther} hint="A pension, rent, taxable allowances and the like. Leave out income that is exempt from tax." error={typed.other == null ? NUMBER : undefined} />
          </div>
        </section>

        {here && (
          <section aria-labelledby={`${id}-less`}>
            <h2 id={`${id}-less`} className="heading-2">
              Dependents and reliefs
            </h2>
            <div className="mt-6 grid gap-6">
              <div>
                <label htmlFor={`${id}-dependents`} className="title-2 block">
                  Dependents you claim for
                </label>
                <select id={`${id}-dependents`} className="field body-3 mt-2" value={dependents} onChange={(e) => setDependents(Number(e.target.value))} aria-describedby={`${id}-dependents-hint`}>
                  <option value={0}>None</option>
                  {(f.dependents?.amounts ?? []).map((amount, i) => (
                    <option key={i} value={i + 1}>
                      {i === 3 ? "Four or more" : COUNTS[i + 1]}: {round(amount)}
                    </option>
                  ))}
                </select>
                <p id={`${id}-dependents-hint`} className="caption-1 mt-2 text-ink-faint">
                  {f.dependents?.detail ?? "The deduction for dependents is not available from the guide just now, so none is taken off."}
                </p>
              </div>
              {f.retired && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Tick label={`Retired or disabled person: ${round(f.retired.value)} more`} checked={retired} onChange={setRetired} />
                  </div>
                  <p className="caption-1 mt-2 text-ink-faint">{f.retired.detail}</p>
                </div>
              )}

              {/* Folded away until asked for, as the references under a search are: most people claim none. */}
              <details className="elsewhere">
                <summary className="filter body-3">
                  Reliefs you can claim, each with its cap <Chevron />
                </summary>
                <div className="mt-6 grid gap-6">
                  {dependents > 0 && f.university && (
                    <div>
                      <label htmlFor={`${id}-university`} className="title-2 block">
                        Dependent children at university
                      </label>
                      <select id={`${id}-university`} className="field body-3 mt-2" value={students} onChange={(e) => setUniversity(Number(e.target.value))} aria-describedby={`${id}-university-hint`}>
                        {COUNTS.slice(0, most + 1).map((name, i) => (
                          <option key={i} value={i}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <p id={`${id}-university-hint`} className="caption-1 mt-2 text-ink-faint">
                        {f.university.said}. {f.university.detail}
                      </p>
                    </div>
                  )}
                  {dependents > 0 && f.school && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`${id}-pupils`} className="title-2 block">
                          Children at a fee-paying private school
                        </label>
                        <select id={`${id}-pupils`} className="field body-3 mt-2" value={atSchool} onChange={(e) => setPupils(Number(e.target.value))}>
                          {COUNTS.slice(0, dependents + 1).map((name, i) => (
                            <option key={i} value={i}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Sum id={`${id}-fees`} label="Fees paid for them in the year" value={fees} onChange={setFees} hint={`${f.school.said}. ${f.school.detail ?? ""}`} error={typed.fees == null ? NUMBER : feesAlone ? "Choose how many children the fees are for." : undefined} />
                    </div>
                  )}
                  <Sum id={`${id}-housing`} label="Interest paid on a housing loan" value={housing} onChange={setHousing} hint={f.housing ? `${f.housing.said}. ${f.housing.detail ?? ""}` : undefined} error={typed.housing == null ? NUMBER : undefined} />
                  <Sum id={`${id}-medical`} label="Medical or health insurance premium" value={medical} onChange={setMedical} hint={f.medical ? `Up to ${round(medicalCap(f.medical, dependents))} with the dependents you claim for. ${f.medical.detail ?? ""}` : undefined} error={typed.medical == null ? NUMBER : undefined} />
                  <Sum id={`${id}-pension`} label="Paid into an approved personal pension scheme" value={pension} onChange={setPension} hint={f.pension ? `${f.pension.said}. ${f.pension.detail ?? ""}` : undefined} error={typed.pension == null ? NUMBER : undefined} />
                  <Sum id={`${id}-donations`} label="Given to charitable institutions" value={donations} onChange={setDonations} hint={f.donations ? `${f.donations.said}. ${f.donations.detail ?? ""}` : undefined} error={typed.donations == null ? NUMBER : undefined} />
                  <Sum id={`${id}-carer`} label="Wages paid to a carer" value={carer} onChange={setCarer} hint={f.carer ? `${f.carer.said}. ${f.carer.detail ?? ""}` : undefined} error={typed.carer == null ? NUMBER : undefined} />
                  <p className="caption-1 text-ink-faint">Not reckoned here: the allowances for a solar energy unit, a rainwater harvesting system and a fast charger for an electric car, which are deducted in full.</p>
                </div>
              </details>
            </div>
          </section>
        )}
      </div>

      <section aria-labelledby={`${id}-working`} className="content-start">
        <h2 id={`${id}-working`} className="heading-2">
          The working
        </h2>
        {/* The answer in a sentence. At a desk it stays in sight while the form beside it is filled in. */}
        <p className="body-2 note z-10 mt-4 lg:sticky lg:top-24" role="status">
          {wrong
            ? "Put right the field that is marked to see the working."
            : empty
              ? "Enter a salary, a profit or other income to see the tax worked out line by line."
              : sum.tax == null
                ? "The tax cannot be worked out: a figure it needs is missing from the guide."
                : `Income tax for the year: ${rupees(sum.tax)}. That is ${rupees(sum.tax / 12)} a month, ${percent(sum.effective ?? 0)} of the income.`}
        </p>
        {sum && !empty && (
          <>
            <h3 className="label-1 mt-10 pb-3 text-ink-faint">Income</h3>
            <dl className="facts body-3">
              {yearly > 0 && (
                <Line id="salary" label="Salary for the year" guide={guide} note={per === "month" ? `${months} months at ${rupees(typed.salary ?? 0)}` : `${months} months at ${rupees(yearly / months)}`}>
                  {rupees(yearly)}
                </Line>
              )}
              {(typed.profit ?? 0) > 0 && (
                <Line id="profit" label="Profit from business" guide={guide}>
                  {rupees(typed.profit ?? 0)}
                </Line>
              )}
              {(typed.other ?? 0) > 0 && (
                <Line id="other" label="Other income" guide={guide}>
                  {rupees(typed.other ?? 0)}
                </Line>
              )}
              <Line id="income" label="Net income" guide={guide} strong>
                {rupees(sum.income)}
              </Line>
            </dl>

            <h3 className="label-1 mt-10 pb-3 text-ink-faint">Less deductions and reliefs</h3>
            <dl className="facts body-3">
              {!here && (
                <Line id="none" label="A non-resident" cites={f.nonResident?.cites} guide={guide} note="Cannot claim the deductions and reliefs">
                  {rupees(0)}
                </Line>
              )}
              {sum.reliefs.map((r) => (
                <Line key={r.key} id={r.key} label={names[r.key]?.label ?? r.key} cites={names[r.key]?.cites} guide={guide} note={why(r)}>
                  {r.allowed == null ? "Not worked out" : rupees(r.allowed)}
                </Line>
              ))}
              {here && sum.reliefs.length === 0 && (
                <Line id="none" label="None claimed" guide={guide}>
                  {rupees(0)}
                </Line>
              )}
              <Line id="chargeable" label="Chargeable income" guide={guide} strong>
                {rupees(sum.chargeable)}
              </Line>
            </dl>

            <h3 className="label-1 mt-10 pb-3 text-ink-faint">Tax, band by band</h3>
            {sum.slices ? (
              <dl className="facts body-3">
                {sum.slices.map((s, i) => (
                  <Line key={i} id={`band-${i}`} label={`${s.rate}% on the ${s.width == null ? "remainder" : `${i === 0 ? "first" : "next"} ${round(s.width)}`}`} cites={f.bands?.cites} guide={guide} note={`On ${rupees(s.slice)}`}>
                    {rupees(s.tax)}
                  </Line>
                ))}
                <Line id="fair-share" label="Fair Share Contribution" cites={f.fairShare?.cites} guide={guide} note={f.fairShare?.rate != null ? `${f.fairShare.rate}% of chargeable income above ${round(f.fairShare.over)}` : undefined}>
                  {!f.fairShare ? "Not worked out" : f.fairShare.rate == null ? f.fairShare.said : rupees(sum.fairShare ?? 0)}
                </Line>
                <Line id="tax" label="Income tax for the year" guide={guide} strong>
                  {sum.tax == null ? "Not worked out" : rupees(sum.tax)}
                </Line>
                {sum.tax != null && (
                  <>
                    <Line id="tax-month" label="A month, on average" guide={guide}>
                      {rupees(sum.tax / 12)}
                    </Line>
                    <Line id="effective" label="Share of net income" guide={guide}>
                      {percent(sum.effective ?? 0)}
                    </Line>
                  </>
                )}
              </dl>
            ) : (
              <p className="body-3 note">The bands are not available from the guide just now, so the tax is not worked out.</p>
            )}

            {(yearly > 0 || (typed.profit ?? 0) > 0) && (
              <>
                <h3 className="label-1 mt-10 pb-3 text-ink-faint">Besides income tax</h3>
                <dl className="facts body-3">
                  {yearly > 0 && (
                    <>
                      <Line id="csg" label={sum.csg ? `CSG, ${sum.csg.rate}% of basic pay` : "CSG on the salary"} cites={f.csg?.cites} guide={guide} note={sum.csg ? `${rupees(sum.csg.month)} a month, on ${months} months` : undefined}>
                        {sum.csg ? rupees(sum.csg.year) : "Not worked out"}
                      </Line>
                      <Line
                        id="nsf"
                        label="National Savings Fund"
                        cites={f.nsf?.cites}
                        guide={guide}
                        note={!sum.nsf || !f.nsf ? undefined : sum.nsf.below ? `None: the monthly pay is under ${round(f.nsf.floor ?? 0)}.` : `${rupees(sum.nsf.month)} a month: ${f.nsf.rate}% of basic pay up to ${round(f.nsf.ceiling)}, on 12 months`}
                      >
                        {sum.nsf ? rupees(sum.nsf.year) : "Not worked out"}
                      </Line>
                    </>
                  )}
                  {(typed.profit ?? 0) > 0 && (
                    <Line id="self-csg" label="CSG as a self-employed person" cites={f.selfCsg?.cites} guide={guide} note={sum.selfCsg ? `${rupees(sum.selfCsg.month)} a month, on a monthly net income of ${rupees((typed.profit ?? 0) / 12)}` : undefined}>
                      {sum.selfCsg ? rupees(sum.selfCsg.year) : "Not worked out"}
                    </Line>
                  )}
                  {sum.left != null && (
                    <>
                      <Line id="left" label="Left of the income" guide={guide} strong note="After income tax and the contributions above">
                        {rupees(sum.left)}
                      </Line>
                      <Line id="left-month" label="A month, on average" guide={guide} note="Tax is withheld on a running total, so one month's pay can differ">
                        {rupees(sum.left / 12)}
                      </Line>
                    </>
                  )}
                </dl>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
