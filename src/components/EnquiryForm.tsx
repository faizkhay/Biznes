"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ACTIONS, site } from "@/data/site";
import { REPLIES, REPLY_NAMES, TOPICS, TOPIC_NAMES, isTopic, validateEnquiry, type Enquiry, type EnquiryErrors, type Reply } from "@/lib/enquiry";
import { Alert, Tick } from "./Icons";

type State = "idle" | "sending" | "sent" | "failed";

/** Each error, said in words on its own field. */
const ERROR_TEXT: Record<string, Record<string, string>> = {
  topic: { required: "Choose what your request is about." },
  name: { required: "Tell us your name." },
  phone: {
    required: "Give us a number to reach you on.",
    reach: "Give us a number to reach you on.",
    phone: "That phone number doesn't look right.",
  },
  email: { required: "Give us an email address to reply to.", email: "That email address doesn't look right." },
};

const FIELD_ORDER = ["topic", "name", "phone", "email"] as const;

/**
 * The request form. It shares one validator with the server (src/lib/enquiry.ts), says each error on
 * its own field and moves focus to the first, and never loses a request quietly: if the request
 * cannot be delivered, it says so and gives the phone, WhatsApp and email instead.
 *
 * A business's page links here with ?business=<slug>; that is read in an effect, after hydration, so
 * the prerendered page and the first render agree.
 */
export default function EnquiryForm() {
  const [values, setValues] = useState<Enquiry>({ topic: "", name: "", phone: "", email: "", message: "", reply: "whatsapp", website: "" });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [state, setState] = useState<State>("idle");
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const failed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("business");
    if (wanted && isTopic(wanted)) setValues((v) => ({ ...v, topic: wanted }));
  }, []);

  useEffect(() => {
    if (state === "sent") done.current?.focus();
    if (state === "failed") failed.current?.focus();
  }, [state]);

  const set = <K extends keyof Enquiry>(key: K, value: Enquiry[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors(({ [key as keyof EnquiryErrors]: _, ...rest }) => rest);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateEnquiry(values);
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      const r = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; errors?: EnquiryErrors };
      if (r.status === 422 && body.errors) {
        setErrors(body.errors);
        setState("idle");
        return;
      }
      setState(r.ok && body.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  }

  const { contact } = site;

  if (state === "sent") {
    return (
      <div ref={done} tabIndex={-1} role="status" className="rounded-2xl border border-line-strong p-6 outline-none sm:p-8">
        <Tick className="size-8" />
        <h2 className="heading-3 mt-4">Thank you, {values.name.trim()}</h2>
        <p className="body-3 measure mt-3">
          We have your request about {TOPIC_NAMES[values.topic ?? ""] ?? "a business"}. We will reply by{" "}
          {values.reply === "email" ? `email, to ${values.email}` : `${values.reply === "phone" ? "phone" : "WhatsApp"}, on ${values.phone}`}.
        </p>
        <p className="caption-2 mt-3 text-ink-subtle">We answer {contact.hours}.</p>
      </div>
    );
  }

  const describe = (field: keyof EnquiryErrors, hint?: string) =>
    [errors[field] ? `${field}-error` : null, hint ? `${field}-hint` : null].filter(Boolean).join(" ") || undefined;

  const FieldError = ({ field }: { field: keyof EnquiryErrors }) =>
    errors[field] ? (
      <p id={`${field}-error`} className="caption-1 mt-2 flex items-start gap-2">
        <Alert className="mt-0.5 size-4 flex-none" />
        {ERROR_TEXT[field][errors[field]!]}
      </p>
    ) : null;

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-6">
      {/* The form is sent by script. Without script it says so, and gives the routes that still work. */}
      <noscript>
        <p className="body-3 rounded-2xl border border-ink p-6">
          This form needs JavaScript, which is switched off in your browser. Please call or WhatsApp {contact.phone}, or email{" "}
          {contact.email}.
        </p>
      </noscript>
      {state === "failed" && (
        <div ref={failed} tabIndex={-1} role="alert" className="rounded-2xl border border-ink p-6 outline-none">
          <p className="body-1 flex items-start gap-2">
            <Alert className="mt-0.5 size-5 flex-none" />
            We couldn&rsquo;t send that just now.
          </p>
          <p className="body-3 mt-2">
            Your request has not reached us. Please call or WhatsApp{" "}
            <a href={contact.phoneHref} className="tabular whitespace-nowrap underline">
              {contact.phone}
            </a>
            , or email{" "}
            <a href={`mailto:${contact.email}`} className="underline">
              {contact.email}
            </a>
            .
          </p>
        </div>
      )}

      <div>
        <label htmlFor="topic" className="title-3 block">
          Which business is it about?
        </label>
        <select
          id="topic"
          name="topic"
          className="field mt-2"
          value={values.topic}
          onChange={(e) => set("topic", e.target.value)}
          aria-invalid={errors.topic ? true : undefined}
          aria-describedby={describe("topic")}
          required
        >
          <option value="" disabled>
            Choose one
          </option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {TOPIC_NAMES[t]}
            </option>
          ))}
        </select>
        <FieldError field="topic" />
      </div>

      <div>
        <label htmlFor="name" className="title-3 block">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="field mt-2"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describe("name")}
          required
        />
        <FieldError field="name" />
      </div>

      <fieldset>
        <legend className="title-3">How should we reply?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {REPLIES.map((r) => (
            <label key={r} className="chip body-3">
              <input type="radio" name="reply" value={r} checked={values.reply === r} onChange={() => set("reply", r as Reply)} className="sr-only" />
              {REPLY_NAMES[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="title-3 block">
            Phone or WhatsApp number {values.reply === "email" && <span className="caption-2 text-ink-subtle">(optional)</span>}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className="field tabular mt-2"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={describe("phone")}
          />
          <FieldError field="phone" />
        </div>
        <div>
          <label htmlFor="email" className="title-3 block">
            Email address {values.reply !== "email" && <span className="caption-2 text-ink-subtle">(optional)</span>}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="field mt-2"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describe("email")}
          />
          <FieldError field="email" />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="title-3 block">
          Anything you would like us to know <span className="caption-2 text-ink-subtle">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="field mt-2"
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      {/* The honeypot: hidden from people and from assistive technology; only a bot fills it. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button type="submit" className="btn btn-filled button-md" disabled={state === "sending"}>
          {state === "sending" ? "Sending" : ACTIONS.send}
        </button>
        <p className="caption-2 text-ink-subtle">We use what you send only to reply to you.</p>
      </div>
    </form>
  );
}
