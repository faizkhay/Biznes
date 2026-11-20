"use client";

import Link from "next/link";

/**
 * The pieces the two tax tools share: how a sum is read and written, a field for one, a line of the
 * working, and the marks that say which of the guide's sources a figure came from.
 */
const money = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
/** A sum as the tools show a result: "MUR 1,150.00". */
export const rupees = (n: number) => `MUR ${money.format(n)}`;
/** A sum as a guide writes a threshold: "MUR 500,000". */
export const round = (n: number) => `MUR ${whole.format(n)}`;
export const percent = (n: number) => `${whole.format(Math.round(n * 10) / 10)}%`;

/** What was typed, as a number: with or without commas and spaces. Nothing typed is nought; anything else is null. */
export function read(text: string): number | null {
  const tidy = text.replace(/[,\s]/g, "");
  if (tidy === "") return 0;
  if (!/^\d+(\.\d+)?$/.test(tidy)) return null;
  const n = Number(tidy);
  return Number.isFinite(n) ? n : null;
}

/** The numbers of the guide's sources a figure was read from, each a link to that source in the guide. */
export function Marks({ cites, guide }: { cites?: number[]; guide: string }) {
  if (!cites?.length) return null;
  return (
    <span className="ml-1 whitespace-nowrap">
      {cites.map((n, i) => (
        <span key={n}>
          {i > 0 && " "}
          <Link prefetch={false} href={`/learn/${guide}#source-${n}`} className="cite" aria-label={`Source ${n} in the guide`}>
            [{n}]
          </Link>
        </span>
      ))}
    </span>
  );
}

/** A field for a sum of rupees. Its hint says what the law caps it at; its error says, in words, what to put right. */
export function Sum({ id, label, value, onChange, hint, error, placeholder }: { id: string; label: string; value: string; onChange: (text: string) => void; hint?: React.ReactNode; error?: string; placeholder?: string }) {
  const says = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="title-2 block">
        {label}
      </label>
      <input id={id} className="field data-1 mt-2" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-invalid={error ? true : undefined} aria-describedby={says} />
      {error && (
        <p id={`${id}-error`} className="caption-1 mt-2 text-alert">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="caption-1 mt-2 text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  );
}

/** One choice of a few, as pills: a set of radios under one name. */
export function Choice<T extends string | number>({ name, legend, options, value, onChange }: { name: string; legend: string; options: readonly (readonly [T, string])[]; value: T; onChange: (value: T) => void }) {
  return (
    <fieldset>
      <legend className="title-2">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map(([key, label]) => (
          <label key={key} className="chip body-3">
            <input type="radio" name={name} className="sr-only" checked={value === key} onChange={() => onChange(key)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Something that applies or does not: a tick, drawn as a pill that fills when it is on. */
export function Tick({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="chip body-3">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** A line of the working: what it is, the sources of its figure, the sum, and a word on how it was reached. */
export function Line({ id, label, cites, guide, children, note, strong }: { id: string; label: React.ReactNode; cites?: number[]; guide: string; children: React.ReactNode; note?: React.ReactNode; strong?: boolean }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <span data-line={id} className={strong ? "data-1 font-bold text-ink" : "data-1"}>
          {children}
        </span>
        <Marks cites={cites} guide={guide} />
        {note && <span className="caption-1 block text-ink-faint">{note}</span>}
      </dd>
    </>
  );
}
