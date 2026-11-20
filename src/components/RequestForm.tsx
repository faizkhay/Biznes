"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ACTIONS, site } from "@/data/site";
import { REPLIES, REPLY_NAMES, TOPICS, TOPIC_NAMES, validateEnquiry, type Enquiry, type EnquiryErrors, type Reply, type Topic } from "@/lib/request";
import { Alert, Tick } from "./Icons";

type State = "idle" | "sending" | "sent" | "failed";

/** Each error, said in words on its own field. */
const ERROR_TEXT: Record<string, Record<string, string>> = {
  topic: { required: "Choose what your request is about." },
  business: { required: "Give the name of the business." },
  message: { required: "Say what should be added, changed or removed." },
  name: { required: "Tell us your name." },
  phone: { required: "Give a number to reach you on.", phone: "That phone number does not look right." },
  email: { required: "Give an email address to reply to.", email: "That email address does not look right." },
};

const FIELD_ORDER = ["topic", "business", "message", "name", "email", "phone"] as const;

const ASKS: Record<Topic, string> = {
  add: "What should the listing say? The address, the telephone number, the website, the opening hours, what the business does.",
  correct: "What is wrong, and what should it say instead?",
  remove: "Tell us it is your business, or why the listing should go.",
  site: "Give your website's address and what you would like: to be left alone, to be read again, or to have a page forgotten.",
  other: "What would you like to tell us?",
};

/**
 * The request form: add a business, correct a listing, take one out. It shares one validator with
 * the server (src/lib/request.ts), says each error on its own field and moves focus to the first,
 * and never loses a request quietly: if it cannot be delivered, it says so and gives the phone,
 * WhatsApp and email instead.
 */
export default function RequestForm({ listing, compose = false, start = "" }: { listing?: { id: string; name: string; path: string }; /** No delivery route is set on the server: the request is written out and sent from the visitor's own WhatsApp or email. */ compose?: boolean; /** Words to begin the message with, when the form is opened for a plan. */ start?: string }) {
  const [values, setValues] = useState<Enquiry>({ topic: listing ? "correct" : "add", listing: listing?.id, business: listing?.name ?? "", message: start, name: "", phone: "", email: "", reply: "email", website: "" });
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [state, setState] = useState<State>("idle");
  const form = useRef<HTMLFormElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const failed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === "sent") done.current?.focus();
    if (state === "failed") failed.current?.focus();
  }, [state]);

  const set = <K extends keyof Enquiry>(key: K, value: Enquiry[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors(({ [key as keyof EnquiryErrors]: _, ...rest }) => rest);
  };

  /** Says what is missing, on the fields, and moves to the first. True when nothing is. */
  function checked(reach: boolean) {
    const found = validateEnquiry(values, { reach });
    setErrors(found);
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return !first;
  }

  /** The request in words, for a message the visitor sends themselves. */
  function written() {
    const lines = [`biznes.mu: ${TOPIC_NAMES[values.topic ?? "other"]}`, values.business.trim() ? `Business: ${values.business.trim()}` : "", listing ? `Listing: ${window.location.origin}${listing.path}` : "", "", values.message.trim(), "", `From ${values.name.trim()}`];
    return lines.filter((line, i) => line || (i > 0 && lines[i - 1])).join("\n");
  }
  const byWhatsApp = () => checked(false) && window.open(`${site.contact.whatsappHref}?text=${encodeURIComponent(written())}`, "_blank", "noopener");
  const byEmail = () => checked(false) && window.location.assign(`mailto:${site.contact.email}?subject=${encodeURIComponent(`biznes.mu: ${TOPIC_NAMES[values.topic ?? "other"]}`)}&body=${encodeURIComponent(written())}`);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (compose) {
      byWhatsApp();
      return;
    }
    if (!checked(true)) return;
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
      <div ref={done} tabIndex={-1} role="status" className="note outline-none">
        <Tick className="size-8 text-link" />
        <h2 className="heading-3 mt-4">Thank you, {values.name.trim()}</h2>
        <p className="body-3 measure mt-3 text-ink-subtle">
          We have your request{values.business ? ` about ${values.business.trim()}` : ""}. We will reply by {values.reply === "email" ? `email, to ${values.email}` : `${values.reply === "phone" ? "phone" : "WhatsApp"}, on ${values.phone}`}.
        </p>
        <p className="caption-1 mt-3 text-ink-faint">We answer {contact.hours}.</p>
      </div>
    );
  }

  const describe = (field: keyof EnquiryErrors) => (errors[field] ? `${field}-error` : undefined);
  const FieldError = ({ field }: { field: keyof EnquiryErrors }) =>
    errors[field] ? (
      <p id={`${field}-error`} className="caption-1 mt-2 flex items-start gap-2 text-alert">
        <Alert className="mt-0.5 size-4 flex-none" />
        {ERROR_TEXT[field][errors[field]!]}
      </p>
    ) : null;
  const topic = values.topic ?? "add";

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-6">
      {/* The form is sent by script. Without script it says so, and gives the routes that still work. */}
      <noscript>
        <p className="note body-3">
          This form needs JavaScript, which is switched off in your browser. Please call or WhatsApp {contact.phone}, or email {contact.email}.
        </p>
      </noscript>
      {state === "failed" && (
        <div ref={failed} tabIndex={-1} role="alert" className="note outline-none">
          <p className="title-1 flex items-start gap-2">
            <Alert className="mt-0.5 size-5 flex-none text-alert" />
            That could not be sent just now.
          </p>
          <p className="body-3 mt-2 text-ink-subtle">
            Your request has not reached us. Please call or WhatsApp{" "}
            <a href={contact.phoneHref} className="data-1 whitespace-nowrap">
              {contact.phone}
            </a>
            , or email <a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>
        </div>
      )}

      <fieldset>
        <legend className="title-2">What is it about?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label key={t} className="chip body-3">
              <input type="radio" name="topic" value={t} checked={topic === t} onChange={() => set("topic", t)} className="sr-only" />
              {TOPIC_NAMES[t]}
            </label>
          ))}
        </div>
        <FieldError field="topic" />
      </fieldset>

      <div>
        <label htmlFor="business" className="title-2 block">
          {topic === "site" ? "Your website's address" : "The business"} {topic === "other" && <span className="caption-1 font-normal text-ink-faint">(optional)</span>}
        </label>
        <input id="business" name="business" type="text" autoComplete="organization" className="field mt-2" value={values.business} onChange={(e) => set("business", e.target.value)} aria-invalid={errors.business ? true : undefined} aria-describedby={describe("business")} />
        <FieldError field="business" />
      </div>

      <div>
        <label htmlFor="message" className="title-2 block">
          The details
        </label>
        <p id="message-hint" className="caption-1 mt-1 text-ink-faint">
          {ASKS[topic]}
        </p>
        <textarea id="message" name="message" rows={5} className="field mt-2" value={values.message} onChange={(e) => set("message", e.target.value)} aria-invalid={errors.message ? true : undefined} aria-describedby={["message-hint", describe("message")].filter(Boolean).join(" ")} />
        <FieldError field="message" />
      </div>

      <div>
        <label htmlFor="name" className="title-2 block">
          Your name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" className="field mt-2" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby={describe("name")} />
        <FieldError field="name" />
      </div>

      {!compose && (
        <>
          <fieldset>
            <legend className="title-2">How should we reply?</legend>
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
              <label htmlFor="email" className="title-2 block">
                Email address {values.reply !== "email" && <span className="caption-1 font-normal text-ink-faint">(optional)</span>}
              </label>
              <input id="email" name="email" type="email" autoComplete="email" className="field mt-2" value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.email ? true : undefined} aria-describedby={describe("email")} />
              <FieldError field="email" />
            </div>
            <div>
              <label htmlFor="phone" className="title-2 block">
                Phone or WhatsApp number {values.reply === "email" && <span className="caption-1 font-normal text-ink-faint">(optional)</span>}
              </label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="field data-1 mt-2" value={values.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={describe("phone")} />
              <FieldError field="phone" />
            </div>
          </div>
        </>
      )}

      {/* The honeypot: hidden from people and from assistive technology; only a bot fills it. */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
      </div>

      {compose ? (
        <div>
          <p className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-filled button-md">
              Send by WhatsApp
            </button>
            <button type="button" className="btn btn-quiet button-md" onClick={byEmail}>
              Send by email
            </button>
          </p>
          <p className="caption-1 mt-3 max-w-prose text-ink-faint">This writes your request out in WhatsApp or in your email, ready for you to send to us. We reply the same way.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <button type="submit" className="btn btn-filled button-md" disabled={state === "sending"}>
            {state === "sending" ? "Sending" : ACTIONS.send}
          </button>
          <p className="caption-1 text-ink-faint">We use what you send only to deal with your request and to reply.</p>
        </div>
      )}
    </form>
  );
}
