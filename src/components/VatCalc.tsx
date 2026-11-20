"use client";

import { useId, useState } from "react";

const money = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rupees = (n: number) => `MUR ${money.format(n)}`;
const read = (text: string) => {
  const n = Number(text.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * The VAT calculator. The rate and the threshold are given to it by the page, which reads them from
 * the VAT guide; it holds no figure of its own. Results are announced as they change.
 */
export default function VatCalc({ rate, threshold }: { rate: number; threshold: number | null }) {
  const id = useId();
  const [amount, setAmount] = useState("1000");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [turnover, setTurnover] = useState("");
  const value = read(amount);
  const net = value == null ? null : mode === "add" ? value : value / (1 + rate / 100);
  const vat = net == null ? null : (net * rate) / 100;
  const gross = net == null || vat == null ? null : net + vat;
  const sales = turnover.trim() ? read(turnover) : null;

  return (
    <div className="grid gap-12">
      <section aria-labelledby={`${id}-price`}>
        <h2 id={`${id}-price`} className="heading-2">
          A price
        </h2>
        <div className="mt-6 grid max-w-xl gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-amount`} className="title-2 block">
              Amount, in rupees
            </label>
            <input id={`${id}-amount`} className="field data-1 mt-2" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={value == null ? true : undefined} aria-describedby={value == null ? `${id}-amount-error` : undefined} />
            {value == null && (
              <p id={`${id}-amount-error`} className="caption-1 mt-2 text-alert">
                Enter an amount in figures, such as 1000 or 1,250.50.
              </p>
            )}
          </div>
          <fieldset>
            <legend className="title-2">The amount is</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["add", "Before VAT"],
                  ["remove", "VAT included"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="chip body-3">
                  <input type="radio" name={`${id}-mode`} className="sr-only" checked={mode === key} onChange={() => setMode(key)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <dl className="facts body-3 mt-6 max-w-xl" aria-live="polite">
          <dt>Before VAT</dt>
          <dd className="data-1">{net == null ? "" : rupees(net)}</dd>
          <dt>VAT at {rate}%</dt>
          <dd className="data-1">{vat == null ? "" : rupees(vat)}</dd>
          <dt>With VAT</dt>
          <dd className="data-1 text-signal">{gross == null ? "" : rupees(gross)}</dd>
        </dl>
      </section>

      {threshold != null && (
        <section aria-labelledby={`${id}-reg`}>
          <h2 id={`${id}-reg`} className="heading-2">
            A year&rsquo;s turnover
          </h2>
          <div className="mt-6 max-w-xl">
            <label htmlFor={`${id}-turnover`} className="title-2 block">
              Turnover of taxable supplies in a year, in rupees
            </label>
            <input id={`${id}-turnover`} className="field data-1 mt-2" inputMode="decimal" value={turnover} onChange={(e) => setTurnover(e.target.value)} placeholder="2,400,000" />
          </div>
          <p className="body-2 mt-4 max-w-xl" role="status">
            {turnover.trim() === ""
              ? ""
              : sales == null
                ? "Enter the turnover in figures."
                : sales === threshold
                  ? `That is exactly the threshold of ${rupees(threshold)}. The guide says how the threshold is applied.`
                  : sales > threshold
                    ? `That is over the threshold of ${rupees(threshold)} by ${rupees(sales - threshold)}. The guide explains what the threshold means and who must register whatever their turnover.`
                    : `That is under the threshold of ${rupees(threshold)} by ${rupees(threshold - sales)}. Some professions and businesses must register whatever their turnover: the guide lists them.`}
          </p>
        </section>
      )}
    </div>
  );
}
