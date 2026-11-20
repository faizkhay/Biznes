import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, PartHead } from "@/components/account/Bits";
import { ActionForm, Field, Select, Submit, TextArea } from "@/components/account/Form";
import { Calendar } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { Chevron, Phone, Tick } from "@/components/Icons";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { BOOKING_NAMES, mauritiusToday, PAYMENT_METHODS, PAYMENT_NAMES, rupees, when, type Booking, type Payment, type Service } from "@/lib/accounts/types";
import { count, day as inWords, telHref } from "@/lib/format";
import { answerBooking } from "../../actions";
import { recordPayment, saveNote } from "../../crm-actions";

export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

export default async function BookingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, grow } = await ownBusiness(id);
  if (!grow) notFound();
  const asked = (await searchParams).day ?? "";
  const day = /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : "";
  const supabase = await db();
  const all = supabase.from("bookings").select("*").eq("business_id", b.id);
  // A day is Mauritius's own: from its midnight to the next, at UTC+4.
  const narrowed = day ? all.gte("wanted_at", `${day}T00:00:00+04:00`).lt("wanted_at", new Date(Date.parse(`${day}T00:00:00+04:00`) + 864e5).toISOString()) : all;
  const [{ data: bookingRows }, { data: serviceRows }] = await Promise.all([narrowed.order("wanted_at", { ascending: false }).limit(300), supabase.from("services").select("id, name, price_mur").eq("business_id", b.id)]);
  const bookings = (bookingRows ?? []) as Booking[];
  const ids = bookings.map((k) => k.id);
  const [{ data: noteRows }, { data: paidRows }] = ids.length
    ? await Promise.all([supabase.from("booking_notes").select("booking_id, note").in("booking_id", ids), supabase.from("payments").select("booking_id, amount_mur, method, paid_on").in("booking_id", ids)])
    : [{ data: [] }, { data: [] }];
  const noteOf = new Map((noteRows ?? []).map((n) => [n.booking_id as string, n.note as string]));
  const paidOf = new Map(((paidRows ?? []) as Pick<Payment, "booking_id" | "amount_mur" | "method" | "paid_on">[]).map((p) => [p.booking_id!, p]));
  const services = new Map(((serviceRows ?? []) as Pick<Service, "id" | "name" | "price_mur">[]).map((s) => [s.id, s]));
  const waiting = bookings.filter((k) => k.status === "requested").reverse();
  const confirmed = bookings.filter((k) => k.status === "confirmed").reverse();
  const done = bookings.filter((k) => k.status === "done");
  const others = bookings.filter((k) => k.status === "declined" || k.status === "cancelled");
  const today = mauritiusToday();
  const methods = PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_NAMES[m] }));

  const card = (k: Booking) => {
    const service = k.service_id ? services.get(k.service_id) : undefined;
    const paid = paidOf.get(k.id);
    const note = noteOf.get(k.id) ?? "";
    const live = k.status === "requested" || k.status === "confirmed";
    return (
      <li key={k.id}>
        <article className="row listing">
          <span className="listing-icon" aria-hidden>
            <Calendar />
          </span>
          <div className="min-w-0">
            <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
              <span className={`tag ${k.status === "confirmed" ? "tag-lit" : ""}`}>{BOOKING_NAMES[k.status]}</span>
              <span className="data-2">{when(k.wanted_at)}</span>
            </p>
            <h3 className="title-1 mt-2">{k.name}</h3>
            <p className="body-3 mt-0.5 text-ink-subtle">{[service?.name, k.note].filter(Boolean).join(" · ") || "No service chosen"}</p>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <a href={telHref(k.phone)} className="act data-2">
                <Phone /> <span>{k.phone}</span>
              </a>
              {paid && (
                <span className="tag tag-lit caption-1">
                  Paid {rupees(paid.amount_mur)}, {PAYMENT_NAMES[paid.method]}
                </span>
              )}
            </p>
            {note && <p className="note body-3 mt-3">Your note: {note}</p>}
            {live && (
              <ActionForm action={answerBooking} quiet className="mt-4 grid gap-3">
                <input type="hidden" name="business" value={b.id} />
                <input type="hidden" name="booking" value={k.id} />
                <div className="flex flex-wrap gap-2">
                  {k.status === "requested" ? (
                    <Submit name="step" value="confirmed" className="btn btn-filled btn-sm button-sm">
                      Confirm
                    </Submit>
                  ) : (
                    <Submit name="step" value="done" className="btn btn-filled btn-sm button-sm">
                      Mark as done
                    </Submit>
                  )}
                  <Submit name="step" value="declined" className="btn btn-quiet btn-sm button-sm">
                    Decline
                  </Submit>
                </div>
              </ActionForm>
            )}
            <details className="mt-3">
              <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                {note ? "Change your note" : "Add a note"} <Chevron className="size-4" />
              </summary>
              <ActionForm action={saveNote} className="mt-2 grid gap-3">
                <input type="hidden" name="business" value={b.id} />
                <input type="hidden" name="booking" value={k.id} />
                <TextArea name="note" label={`Your note on ${k.name}'s booking`} rows={2} maxLength={1000} defaultValue={note} hint="Only you see it. Save it empty to take it away." />
                <div>
                  <Submit className="btn btn-quiet btn-sm button-sm">Save the note</Submit>
                </div>
              </ActionForm>
            </details>
            {!paid && (k.status === "confirmed" || k.status === "done") && (
              <details>
                <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                  Mark as paid <Chevron className="size-4" />
                </summary>
                <ActionForm action={recordPayment} className="mt-2 grid gap-4">
                  <input type="hidden" name="business" value={b.id} />
                  <input type="hidden" name="booking" value={k.id} />
                  <input type="hidden" name="payer" value={k.name} />
                  <input type="hidden" name="what" value={service?.name ?? "Booking"} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field name="amount" label="Amount, in rupees" inputMode="numeric" data defaultValue={service?.price_mur != null ? String(service.price_mur) : ""} />
                    <Select name="method" label="How it was paid" choices={methods} defaultValue="juice" />
                    <Field name="paid_on" label="Paid on" type="date" max={today} defaultValue={today} data />
                  </div>
                  <div>
                    <Submit className="btn btn-quiet btn-sm button-sm">Write it in the ledger</Submit>
                  </div>
                </ActionForm>
              </details>
            )}
          </div>
        </article>
      </li>
    );
  };

  const part = (title: string, list: Booking[]) =>
    list.length > 0 && (
      <section aria-label={title}>
        <h3 className="label-1 pb-3 text-ink-faint">
          {title}, {count(list.length)}
        </h3>
        <ul className="rows">{list.map(card)}</ul>
      </section>
    );

  return (
    <div className="shell">
      <PartHead id="bookings" title="Bookings" line="Customers ask for a time on your page. Nothing is booked until you confirm it, and payment is between you and your customer: biznes.mu takes none.">
        <form action={`/dashboard/${b.id}/bookings`} method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="bookings-day" className="title-2 block">
              Only this day
            </label>
            <input id="bookings-day" name="day" type="date" defaultValue={day} className="field data-1 mt-2" />
          </div>
          <button type="submit" className="btn btn-ink button-md">
            Show
          </button>
          {day && (
            <Link prefetch={false} href={`/dashboard/${b.id}/bookings`} className="btn btn-quiet button-md">
              Every day
            </Link>
          )}
        </form>
      </PartHead>
      <div className="mt-8 grid max-w-3xl gap-10">
        {day && (
          <p className="body-3 text-ink-subtle" role="status">
            {count(bookings.length)} {bookings.length === 1 ? "booking" : "bookings"} for {inWords(day)}.
          </p>
        )}
        {bookings.length === 0 && (
          <Empty icon={<Calendar />} title={day ? "Nothing booked for that day" : "No bookings yet"}>
            When a customer asks for a time on your page, the request comes here for you to confirm or decline. Add your services first, so they can say what it is for.
          </Empty>
        )}
        {part("To answer", waiting)}
        {part("Confirmed", confirmed)}
        {part("Done", done)}
        {others.length > 0 && (
          <details>
            <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
              Declined and cancelled, {count(others.length)} <Chevron className="size-4" />
            </summary>
            <ul className="rows mt-2">{others.map(card)}</ul>
          </details>
        )}
        {done.length > 0 && (
          <p className="caption-1 flex items-center gap-2 text-ink-faint">
            <Tick className="size-4" /> A booking marked paid is written in your ledger, under Payments.
          </p>
        )}
      </div>
    </div>
  );
}
