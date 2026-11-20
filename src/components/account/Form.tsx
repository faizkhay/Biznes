"use client";

import { createContext, useActionState, useContext, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { NO_STATE, type FormState } from "@/lib/accounts/form";
import { Alert, Tick } from "../Icons";

/**
 * The account forms. Each posts to a server action, which checks everything again on the server
 * and answers with a sentence for the form and an error in words for each field that needs one.
 * The error sits beside its field and is tied to it for a screen reader; focus moves to the first
 * field in error, or to the sentence when there is none. What was typed is put back, never lost.
 * With script off the form still posts, and the page comes back with the same answers.
 */

type Action = (state: FormState, data: FormData) => Promise<FormState>;

const Answer = createContext<FormState>(NO_STATE);

export function ActionForm({ action, children, className = "grid gap-6", quiet = false }: { action: Action; children: React.ReactNode; className?: string; /** Say only failures: the page itself shows that it worked. */ quiet?: boolean }) {
  const [state, send] = useActionState(action, NO_STATE);
  const form = useRef<HTMLFormElement>(null);
  const said = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state === NO_STATE) return;
    const first = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) first.focus();
    else said.current?.focus();
  }, [state]);

  const show = state.message && !(quiet && state.ok);
  return (
    <form ref={form} action={send} noValidate className={className}>
      {show && (
        <p ref={said} tabIndex={-1} role={state.ok ? "status" : "alert"} className="note body-3 flex items-start gap-2 outline-none">
          {state.ok ? <Tick className="mt-0.5 size-5 flex-none text-link" /> : <Alert className="mt-0.5 size-5 flex-none text-alert" />}
          <span>{state.message}</span>
        </p>
      )}
      <Answer.Provider value={state}>{children}</Answer.Provider>
    </form>
  );
}

/** A field's error, in words, where the field's `aria-describedby` points. */
function Said({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="caption-1 mt-2 flex items-start gap-2 text-alert">
      <Alert className="mt-0.5 size-4 flex-none" />
      {error}
    </p>
  );
}

type Shared = {
  name: string;
  label: string;
  /** A line under the label: what to put, or why it is asked. */
  hint?: React.ReactNode;
  optional?: boolean;
  defaultValue?: string;
  className?: string;
};

function useField({ name, hint, defaultValue = "" }: Shared, keep = true) {
  const state = useContext(Answer);
  const id = `${useId()}${name}`;
  const error = state.errors?.[name];
  return {
    id,
    error,
    value: keep ? (state.values?.[name] ?? defaultValue) : undefined,
    props: { id, name, "aria-invalid": error ? (true as const) : undefined, "aria-describedby": [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined },
  };
}

function Label({ id, label, hint, optional }: { id: string } & Pick<Shared, "label" | "hint" | "optional">) {
  return (
    <>
      <label htmlFor={id} className="title-2 block">
        {label} {optional && <span className="caption-1 font-normal text-ink-faint">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="caption-1 mt-1 text-ink-faint">
          {hint}
        </p>
      )}
    </>
  );
}

/** One line of text: a name, an email address, a telephone number, a password, a date. */
export function Field(p: Shared & { type?: "text" | "email" | "tel" | "password" | "url" | "date" | "time" | "number"; autoComplete?: string; inputMode?: "tel" | "numeric" | "email" | "url"; min?: string; max?: string; readOnly?: boolean; data?: boolean }) {
  const { type = "text" } = p;
  // A password is never sent back to the page.
  const f = useField(p, type !== "password");
  return (
    <div className={p.className}>
      <Label id={f.id} label={p.label} hint={p.hint} optional={p.optional} />
      <input {...f.props} type={type} defaultValue={f.value} autoComplete={p.autoComplete} inputMode={p.inputMode} min={p.min} max={p.max} readOnly={p.readOnly} aria-readonly={p.readOnly || undefined} className={`field mt-2 ${p.data ? "data-1" : ""} ${p.readOnly ? "bg-panel" : ""}`} />
      <Said id={f.id} error={f.error} />
    </div>
  );
}

/** Several lines of text. */
export function TextArea(p: Shared & { rows?: number; maxLength?: number }) {
  const f = useField(p);
  return (
    <div className={p.className}>
      <Label id={f.id} label={p.label} hint={p.hint} optional={p.optional} />
      <textarea {...f.props} rows={p.rows ?? 4} maxLength={p.maxLength} defaultValue={f.value} className="field mt-2" />
      <Said id={f.id} error={f.error} />
    </div>
  );
}

export type Choice = { value: string; label: string };

/** One of a list. `groups` puts the choices under headings. */
export function Select(p: Shared & { choices?: Choice[]; groups?: { label: string; choices: Choice[] }[]; empty?: string }) {
  const f = useField(p);
  const option = (c: Choice) => (
    <option key={c.value} value={c.value}>
      {c.label}
    </option>
  );
  return (
    <div className={p.className}>
      <Label id={f.id} label={p.label} hint={p.hint} optional={p.optional} />
      {/* Keyed by its value: a list keeps the choice it was made with, so it is made again when the answer changes it. */}
      <select key={f.value} {...f.props} defaultValue={f.value} className="field mt-2">
        {p.empty != null && <option value="">{p.empty}</option>}
        {p.choices?.map(option)}
        {p.groups?.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.choices.map(option)}
          </optgroup>
        ))}
      </select>
      <Said id={f.id} error={f.error} />
    </div>
  );
}

/** A choice among a few, as pills: the site's own radio. */
export function Chips({ name, legend, choices, defaultValue = "" }: { name: string; legend: string; choices: Choice[]; defaultValue?: string }) {
  const state = useContext(Answer);
  const id = useId();
  const error = state.errors?.[name];
  const value = state.values?.[name] ?? defaultValue;
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="title-2">{legend}</legend>
      <div key={value} className="mt-2 flex flex-wrap gap-2">
        {choices.map((c, i) => (
          <label key={c.value} className="chip body-3">
            <input type="radio" name={name} value={c.value} defaultChecked={value === c.value} aria-invalid={error && i === 0 ? true : undefined} className="sr-only" />
            {c.label}
          </label>
        ))}
      </div>
      <Said id={id} error={error} />
    </fieldset>
  );
}

/** A box to tick. */
export function Check({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  const state = useContext(Answer);
  const id = useId();
  const error = state.errors?.[name];
  const on = state.values ? state.values[name] === "on" : defaultChecked;
  return (
    <div>
      <label className="body-3 flex min-h-11 items-center gap-3">
        <input key={String(on)} type="checkbox" name={name} defaultChecked={on} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className="size-4 flex-none" />
        {label}
      </label>
      <Said id={id} error={error} />
    </div>
  );
}

/** The honeypot: hidden from people and from assistive technology; only a bot fills it. */
export function Trap() {
  const id = useId();
  return (
    <div aria-hidden className="hidden">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

/** The button that sends the form. While it is being sent it is disabled and says so. */
export function Submit({ children, busy = "Saving", className = "btn btn-filled button-md", name, value }: { children: React.ReactNode; busy?: string; className?: string; name?: string; value?: string }) {
  const { pending, data } = useFormStatus();
  // In a form with two buttons, only the one that was pressed says it is busy; both wait.
  const pressed = !name || data?.get(name) === value;
  return (
    <button type="submit" name={name} value={value} className={className} disabled={pending}>
      {pending && pressed ? busy : children}
    </button>
  );
}
