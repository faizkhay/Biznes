"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Choice, Line, Marks, Sum, Tick, percent, read, round, rupees } from "@/components/CalcBits";
import { MONTHS, apsQuarters, business, dueAfter, type BusinessTaxFigures, type Said } from "@/lib/sums";

const NUMBER = "Enter the amount in figures, such as 2400000 or 2,400,000.";
const ORDER = ["First", "Second", "Third"];
type Kind = "company" | "sole" | "societe";
/** A threshold read from another guide: the figure, the guide's words and where its sources are. */
type Borrowed = (Said & { value: number; guide: string }) | null;

/**
 * The business tax estimator. Every rate, test and due date is given to it by the page, which reads
 * them from the guide to business taxes (and the VAT and personal income tax guides for their two
 * thresholds); it holds no figure of its own, and a part whose figure is missing is not worked out.
 */
export default function BusinessTaxCalc({ figures: f, guide, vat, cps }: { figures: BusinessTaxFigures; guide: string; vat: Borrowed; cps: Borrowed }) {
  const id = useId();
  const [kind, setKind] = useState<Kind>("company");
  const [turnover, setTurnover] = useState("");
  const [profit, setProfit] = useState("");
  const [previous, setPrevious] = useState("");
  const [exporter, setExporter] = useState(false);
  const [exports, setExports] = useState("");
  const [partly, setPartly] = useState(false);
  const [qualifying, setQualifying] = useState("");
  const [presumptive, setPresumptive] = useState(false);
  const [yearEnd, setYearEnd] = useState(5);
  const [share, setShare] = useState("");

  const company = kind === "company";
  const typed = { turnover: read(turnover), profit: read(profit), previous: read(previous), exports: read(exports), qualifying: read(qualifying), share: read(share) };
  const tooMuch = company && exporter && typed.exports != null && typed.turnover != null && typed.exports > typed.turnover;
  const tooLarge = kind === "societe" && typed.share != null && typed.share > 100;
  const wrong =
    typed.turnover == null || typed.profit == null || (kind !== "sole" && typed.previous == null) || (company && exporter && (typed.exports == null || tooMuch)) || (company && partly && typed.qualifying == null) || (kind === "societe" && (typed.share == null || tooLarge));
  const sales = typed.turnover ?? 0;
  const earned = typed.profit ?? 0;
  const empty = sales <= 0 && earned <= 0;
  const sum = wrong
    ? null
    : business(
        {
          turnover: sales,
          profit: earned,
          previous: kind !== "sole" && previous.trim() !== "" ? typed.previous : null,
          exports: company && exporter ? typed.exports : null,
          qualifying: company && partly ? typed.qualifying : null,
          presumptive: kind !== "societe" && presumptive,
          societe: kind === "societe",
        },
        f,
      );
  const elected = kind !== "societe" && presumptive;
  const small = f.presumptive ? sales <= f.presumptive.ceiling : null;
  const due = (at: { month: number; days: number }) => (at.days > 0 ? `${at.days} days before the end of ${MONTHS[at.month]}, excluding Saturdays and public holidays` : `By the end of ${MONTHS[at.month]}`);
  const handOver = (amount: number) => `/tools/income-tax?profit=${Math.round(amount)}`;
  const associate = kind === "societe" && typed.share ? (earned * typed.share) / 100 : 0;

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <section aria-labelledby={`${id}-business`} className="content-start">
        <h2 id={`${id}-business`} className="heading-2">
          The business and its year
        </h2>
        <div className="mt-6 grid gap-6">
          <Choice
            name={`${id}-kind`}
            legend="The business is"
            options={
              [
                ["company", "A company"],
                ["sole", "A sole trader"],
                ["societe", "A société or partnership"],
              ] as const
            }
            value={kind}
            onChange={setKind}
          />
          <Sum id={`${id}-turnover`} label="Turnover for the year, in rupees" value={turnover} onChange={setTurnover} placeholder="For example, 2,400,000" hint="Gross income from every source." error={typed.turnover == null ? NUMBER : undefined} />
          <Sum
            id={`${id}-profit`}
            label={kind === "company" ? "Chargeable income for the year" : "Profit for the year"}
            value={profit}
            onChange={setProfit}
            hint={kind === "company" ? (partly ? "Gross income less allowable deductions, before the partial exemption is taken off." : "The taxable profit: gross income less allowable deductions.") : "What the business earned less what it cost to earn it."}
            error={typed.profit == null ? NUMBER : undefined}
          />
          {kind !== "sole" && (
            <Sum
              id={`${id}-previous`}
              label={company ? "Chargeable income of the year before" : "Net income of the year before"}
              value={previous}
              onChange={setPrevious}
              hint="The CSR Fund is worked on it. Left empty, this year's figure stands in."
              error={typed.previous == null ? NUMBER : undefined}
            />
          )}

          {kind !== "societe" && (
            <fieldset>
              <legend className="title-2">Tick what applies</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {company && f.exportRate && <Tick label="It exports goods" checked={exporter} onChange={setExporter} />}
                {company && f.exemption && <Tick label="Some income is partly exempt" checked={partly} onChange={setPartly} />}
                {f.presumptive && <Tick label="A small enterprise choosing the presumptive tax" checked={presumptive} onChange={setPresumptive} />}
              </div>
              {elected && f.presumptive && (
                <p className={`caption-1 mt-2 ${small === false ? "text-alert" : "text-ink-faint"}`}>
                  {small === false ? `Not open to this business: its gross income is above ${round(f.presumptive.ceiling)}. The usual working is shown.` : `${f.presumptive.detail}`}
                </p>
              )}
            </fieldset>
          )}
          {company && exporter && f.exportRate && (
            <Sum id={`${id}-exports`} label="Gross income from exporting goods" value={exports} onChange={setExports} hint={f.exportRate.detail} error={typed.exports == null ? NUMBER : tooMuch ? "Exports cannot be more than the turnover." : undefined} />
          )}
          {company && partly && f.exemption && (
            <Sum id={`${id}-qualifying`} label="Income of a kind that is partly exempt" value={qualifying} onChange={setQualifying} hint={f.exemption.detail} error={typed.qualifying == null ? NUMBER : undefined} />
          )}
          {company && (
            <div>
              <label htmlFor={`${id}-year-end`} className="title-2 block">
                The accounting year ends in
              </label>
              <select id={`${id}-year-end`} className="field body-3 mt-2" value={yearEnd} onChange={(e) => setYearEnd(Number(e.target.value))}>
                {MONTHS.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {kind === "societe" && <Sum id={`${id}-share`} label="One associate's share of the profit, in per cent" value={share} onChange={setShare} placeholder="For example, 50" error={typed.share == null ? "Enter the share in figures, such as 50." : tooLarge ? "A share cannot be more than 100 per cent." : undefined} />}
        </div>
      </section>

      <section aria-labelledby={`${id}-working`} className="content-start">
        <h2 id={`${id}-working`} className="heading-2">
          The working
        </h2>
        {/* The answer in a sentence. At a desk it stays in sight while the form beside it is filled in. */}
        <p className="body-2 note z-10 mt-4 lg:sticky lg:top-24" role="status">
          {wrong
            ? "Put right the field that is marked to see the working."
            : empty
              ? "Enter the turnover and the profit to see the taxes worked out line by line."
              : kind === "sole"
                ? "A sole trader pays income tax as a person, so the profit is carried to the personal calculator."
                : sum?.total == null
                  ? "Part of the total cannot be worked out. The lines below say which, and why."
                  : `${kind === "societe" ? "Borne by the société itself" : "Total for the year"}: ${rupees(sum.total)}${sum.effective != null ? `, ${percent(sum.effective)} of the profit` : ""}.`}
        </p>

        {sum && !empty && kind === "sole" && (
          <>
            <dl className="facts body-3 mt-10">
              <Line id="sole" label="A sole trader" cites={f.soleTrader?.cites} guide={guide} note={f.soleTrader?.detail}>
                {f.soleTrader?.said ?? "Not worked out"}
              </Line>
              <Line id="profit" label="Profit carried over" guide={guide} strong>
                {rupees(earned)}
              </Line>
              {elected && small && sum.presumptive != null && f.presumptive && (
                <Line id="presumptive" label={`Or presumptive tax, ${f.presumptive.rate}% of gross income`} cites={f.presumptive.cites} guide={guide} note="In place of income tax on the profit, with no deductions or reliefs">
                  {rupees(sum.presumptive)}
                </Line>
              )}
              {cps && (
                <Line id="cps" label="Paying during the year" cites={cps.cites} guide={cps.guide} note={cps.detail}>
                  {sales > cps.value ? `Quarterly statements: turnover is above ${round(cps.value)}` : `No quarterly statements at ${round(cps.value)} or less`}
                </Line>
              )}
            </dl>
            {earned > 0 && (
              <p className="mt-6">
                <Link href={handOver(earned)} className="btn btn-filled button-md">
                  Work out the income tax
                </Link>
              </p>
            )}
          </>
        )}

        {sum && !empty && kind !== "sole" && (
          <>
            <h3 className="label-1 mt-10 pb-3 text-ink-faint">{company ? "Chargeable income" : "Net income"}</h3>
            <dl className="facts body-3">
              {company && partly && (
                <>
                  <Line id="entered" label="As entered" guide={guide}>
                    {rupees(earned)}
                  </Line>
                  <Line id="exempt" label={f.exemption ? `Less ${f.exemption.value}% of the partly exempt income` : "Less the partial exemption"} cites={f.exemption?.cites} guide={guide} note={sum.exempt == null ? undefined : `On ${rupees(typed.qualifying ?? 0)}. The cost of earning exempt income cannot be deducted, which this leaves out.`}>
                    {sum.exempt == null ? "Not worked out" : rupees(sum.exempt)}
                  </Line>
                </>
              )}
              <Line id="chargeable" label={company ? "Chargeable income" : "Net income of the société"} guide={guide} strong>
                {sum.chargeable == null ? "Not worked out" : rupees(sum.chargeable)}
              </Line>
            </dl>

            <h3 className="label-1 mt-10 pb-3 text-ink-faint">Tax and levies for the year</h3>
            <dl className="facts body-3">
              {kind === "societe" ? (
                <Line id="income-tax" label="Income tax on the société" cites={f.societe?.cites} guide={guide}>
                  {f.societe?.said ?? "Not worked out"}
                </Line>
              ) : elected && small && sum.presumptive != null && f.presumptive ? (
                <Line id="income-tax" label={`Presumptive tax, ${f.presumptive.rate}% of gross income`} cites={f.presumptive.cites} guide={guide} note="In place of income tax on chargeable income, with no deductions or reliefs">
                  {rupees(sum.presumptive)}
                </Line>
              ) : sum.share > 0 && f.exportRate && f.rate ? (
                <>
                  <Line id="tax-exports" label={`${f.exportRate.value}% on the share from exports`} cites={f.exportRate.cites} guide={guide} note={`On ${rupees(sum.exported ?? 0)}: exports are ${percent(sum.share * 100)} of gross income`}>
                    {sum.onExports == null ? "Not worked out" : rupees(sum.onExports)}
                  </Line>
                  <Line id="tax-rest" label={`${f.rate.value}% on the rest`} cites={f.rate.cites} guide={guide} note={`On ${rupees((sum.chargeable ?? 0) - (sum.exported ?? 0))}`}>
                    {sum.onRest == null ? "Not worked out" : rupees(sum.onRest)}
                  </Line>
                  <Line id="income-tax" label="Income tax" guide={guide}>
                    {sum.incomeTax == null ? "Not worked out" : rupees(sum.incomeTax)}
                  </Line>
                </>
              ) : (
                <Line id="income-tax" label={f.rate ? `Income tax at ${f.rate.value}%` : "Income tax"} cites={f.rate?.cites} guide={guide}>
                  {sum.incomeTax == null ? "Not worked out" : rupees(sum.incomeTax)}
                </Line>
              )}
              <Line
                id="csr"
                label={f.csr ? `CSR Fund, ${f.csr.value}% of last year's ${company ? "chargeable" : "net"} income` : "CSR Fund"}
                cites={f.csr?.cites}
                guide={guide}
                note={!sum.csr ? undefined : sum.csr.estimated ? `On ${rupees(sum.csr.base)}: this year's figure, as last year's was not entered` : `On ${rupees(sum.csr.base)}`}
              >
                {sum.csr ? rupees(sum.csr.amount) : "Not worked out"}
              </Line>
              <Line id="ccr" label="CCR levy" cites={f.ccr?.cites} guide={guide} note={!sum.ccr || !f.ccr ? undefined : sum.ccr.due ? `${f.ccr.rate}% of ${company ? "chargeable" : "net"} income: turnover is above ${round(f.ccr.over)}` : `None: turnover is ${round(f.ccr.over)} or less`}>
                {sum.ccr ? rupees(sum.ccr.amount) : "Not worked out"}
              </Line>
              {company && (
                <Line
                  id="fair-share"
                  label="Fair Share Contribution"
                  cites={f.fairShare?.cites}
                  guide={guide}
                  note={
                    !sum.fairShare || !f.fairShare
                      ? undefined
                      : !sum.fairShare.due
                        ? `None: chargeable income is ${round(f.fairShare.over)} or less`
                        : sum.fairShare.rate == null
                          ? `It is ${f.fairShare.rate}% for a company taxed at ${f.rate?.value ?? ""}% and ${f.fairShare.low}% for one taxed at ${f.exportRate?.value ?? ""}%. The Act does not say how a company taxed at both is treated.`
                          : `${sum.fairShare.rate}% of chargeable income, which is above ${round(f.fairShare.over)}`
                  }
                >
                  {sum.fairShare?.amount == null ? "Not worked out" : rupees(sum.fairShare.amount)}
                </Line>
              )}
              <Line id="total" label={company ? "Total for the year" : "Borne by the société"} guide={guide} strong>
                {sum.total == null ? "Not worked out" : rupees(sum.total)}
              </Line>
              {sum.total != null && sum.effective != null && (
                <Line id="effective" label="Share of the profit" guide={guide}>
                  {percent(sum.effective)}
                </Line>
              )}
              {associate > 0 && (
                <Line
                  id="associate"
                  label="One associate's share"
                  guide={guide}
                  note={
                    <>
                      Taxed in the associate&rsquo;s own hands. <Link href={handOver(associate)}>Work out a person&rsquo;s income tax on it</Link>
                    </>
                  }
                >
                  {rupees(associate)}
                </Line>
              )}
            </dl>

            <h3 className="label-1 mt-10 pb-3 text-ink-faint">When to file and pay</h3>
            <dl className="facts body-3">
              {company && f.aps && (
                <Line id="aps" label="Advance Payment System" cites={f.aps.cites} guide={guide} note={f.aps.detail}>
                  {sales > f.aps.value && earned > 0 ? `Quarterly statements: turnover is above ${round(f.aps.value)}` : `No quarterly statements: ${earned > 0 ? `turnover is ${round(f.aps.value)} or less` : "there is no chargeable income"}`}
                </Line>
              )}
              {company &&
                f.aps &&
                f.apsDue &&
                sales > f.aps.value &&
                earned > 0 &&
                apsQuarters(yearEnd, f.apsDue.value, f.early).map((q, i) => (
                  <Line key={i} id={`quarter-${i + 1}`} label={`${ORDER[i]} quarter, ${MONTHS[q.from]} to ${MONTHS[q.to]}`} cites={q.due.days > 0 ? f.early?.cites : f.apsDue?.cites} guide={guide}>
                    {due(q.due)}
                  </Line>
                ))}
              {company && f.returnDue && (
                <Line id="return" label="Yearly return and the balance" cites={f.returnDue.cites} guide={guide} note={f.returnDue.detail}>
                  {due(dueAfter(yearEnd, f.returnDue.value, f.early))}
                </Line>
              )}
              {kind === "societe" && f.societe && (
                <Line id="return" label="Return of the société" cites={f.societe.cites} guide={guide}>
                  {f.societe.detail}
                </Line>
              )}
            </dl>
          </>
        )}

        {sum && sales > 0 && vat && (
          <p className="body-3 note mt-10" data-line="vat">
            {sales > vat.value
              ? `If that turnover is all taxable supplies, it is over the VAT registration threshold of ${round(vat.value)} by ${rupees(sales - vat.value)}, so registering for VAT is compulsory.`
              : `That turnover is not over the VAT registration threshold of ${round(vat.value)}. Some professions and businesses must register whatever their turnover.`}
            <Marks cites={vat.cites} guide={vat.guide} /> <Link href={`/learn/${vat.guide}`}>The VAT guide</Link> says how the threshold is applied.
          </p>
        )}
      </section>
    </div>
  );
}
