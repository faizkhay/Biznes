import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Check, Chips, Field, Select, Submit, TextArea } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Chevron, Out, Phone } from "@/components/Icons";
import { VerifiedMark } from "@/components/Verified";
import { PLANS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { requireViewer } from "@/lib/accounts/session";
import { BOOKING_NAMES, duration, planNow, rupees, STATUS_NAMES, when, type Booking, type Business, type PayDetails, type PlanRequest, type Service } from "@/lib/accounts/types";
import { count, day, telHref } from "@/lib/format";
import { index } from "@/lib/index";
import { answerBooking, askForPlan, removeBusiness, removeService, saveBusiness, savePayDetails, saveService, withdrawPlanRequest } from "../actions";

export const metadata: Metadata = { title: "Your business", robots: { index: false, follow: false } };

const SAID: Record<string, string> = {
  listed: "Your business is with us. A person checks every new one, usually within a working day, and it goes live once that is done.",
  claimed: "Your claim is with us. A person checks every claim, usually within a working day. Until then the listing stays as it is.",
};

const WHERE_IT_STANDS: Record<Business["status"], string> = {
  pending: "A person checks every business before it goes live, usually within a working day. You can keep changing its details meanwhile.",
  live: "It is live: anyone can find it.",
  rejected: "We could not accept it as it is. Change the details and save, and it comes back to us to look at again.",
  suspended: "It has been taken off the site for now. Write to us to put it right.",
};

export default async function BusinessPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const viewer = await requireViewer(`/dashboard/${id}`);
  const { said } = await searchParams;
  const supabase = await db();
  const { data: found } = await supabase.from("businesses").select("*").eq("id", id).eq("owner_id", viewer.id).maybeSingle();
  if (!found) notFound();
  const b = found as Business;
  const plan = planNow(b.plan, b.plan_until);
  const grow = plan === "grow";
  const lapsed = b.plan !== "free" && plan === "free";

  const [{ data: requests }, { data: serviceRows }, { data: bookingRows }, { data: payRow }, shown] = await Promise.all([
    supabase.from("plan_requests").select("*").eq("business_id", b.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("services").select("*").eq("business_id", b.id).order("created_at"),
    supabase.from("bookings").select("*").eq("business_id", b.id).order("wanted_at", { ascending: false }).limit(200),
    supabase.from("pay_details").select("business_id, juice_number, juice_name").eq("business_id", b.id).maybeSingle(),
    owned(),
  ]);
  const pay = payRow as PayDetails | null;
  const open = ((requests ?? []) as PlanRequest[]).find((r) => r.status === "open");
  const answered = ((requests ?? []) as PlanRequest[]).find((r) => r.status !== "open");
  const services = (serviceRows ?? []) as Service[];
  const bookings = (bookingRows ?? []) as Booking[];
  const waiting = bookings.filter((k) => k.status === "requested").reverse();
  const confirmed = bookings.filter((k) => k.status === "confirmed").reverse();
  const earlier = bookings.filter((k) => k.status !== "requested" && k.status !== "confirmed").slice(0, 40);

  const { groups, categories, places, byId } = index();
  const kinds = groups.map((g) => ({ label: g.label, choices: categories.filter((c) => c.group === g.id).map((c) => ({ value: c.id, label: c.one })) }));
  const towns = places
    .filter((p) => p.kind === "town" || p.slug === b.town)
    .sort((x, y) => x.name.localeCompare(y.name))
    .map((p) => ({ value: p.slug, label: p.name }));
  const planName = (which: string) => PLANS.find((p) => p.id === which)?.name ?? which;
  const page = shown.byId.get(b.id)?.path;
  const claimed = b.listing_id ? byId.get(b.listing_id) : undefined;
  const serviceName = (k: Booking) => services.find((s) => s.id === k.service_id)?.name;
  const { contact } = site;

  const booking = (k: Booking) => (
    <li key={k.id}>
      <article className="row">
        <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
          <span className={`tag ${k.status === "confirmed" ? "tag-lit" : ""}`}>{BOOKING_NAMES[k.status]}</span>
          <span className="data-2">{when(k.wanted_at)}</span>
        </p>
        <h3 className="title-1 mt-2">{k.name}</h3>
        <p className="body-3 mt-0.5 text-ink-subtle">{[serviceName(k), k.note].filter(Boolean).join(" · ")}</p>
        <p className="mt-3 flex flex-wrap gap-2">
          <a href={telHref(k.phone)} className="act data-2">
            <Phone /> {k.phone}
          </a>
        </p>
        {(k.status === "requested" || k.status === "confirmed") && (
          <ActionForm action={answerBooking} quiet className="mt-3 grid gap-3">
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
      </article>
    </li>
  );

  return (
    <>
      <PageHead title={b.name} path={[{ href: "/dashboard", label: "Your businesses" }, { label: b.name }]}>
        <p className="caption-1 mt-4 flex flex-wrap items-center gap-2">
          <span className={`tag ${b.status === "live" ? "tag-lit" : ""}`}>{STATUS_NAMES[b.status]}</span>
          <span className="tag">{planName(plan)}</span>
          {b.verified && plan !== "free" ? <VerifiedMark priority /> : b.status === "live" && <span className="tag">{b.listing_id ? "Claimed by its owner" : "Listed by its owner"}</span>}
        </p>
      </PageHead>
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="grid gap-12 lg:col-span-7">
          <section aria-labelledby="standing">
            <h2 id="standing" className="sr-only">
              Where it stands
            </h2>
            {said && SAID[said] && (
              <p role="status" className="note body-3 mb-6">
                {SAID[said]}
              </p>
            )}
            <p className="body-2 max-w-prose">{WHERE_IT_STANDS[b.status]}</p>
            {b.status_note && <p className="note body-3 mt-4">From us: {b.status_note}</p>}
            {claimed && b.status !== "live" && (
              <p className="body-3 mt-4 text-ink-subtle">
                You are claiming <Link href={`/b/${claimed.slug}`}>{claimed.name}</Link>, a listing from the open map. Until the claim is approved its page stays as it is.
              </p>
            )}
            {b.status === "live" && page && (
              <p className="mt-4">
                <Link href={page} className="btn btn-quiet button-md">
                  See its page <Out />
                </Link>
              </p>
            )}
          </section>

          {grow && (
            <section aria-labelledby="bookings">
              <h2 id="bookings" className="heading-2">
                Bookings
              </h2>
              <p className="body-3 mt-2 max-w-prose text-ink-subtle">Customers ask for a time on your page. Nothing is booked until you confirm it, and payment is between you and your customer: biznes.mu takes none.</p>
              {waiting.length + confirmed.length === 0 && <p className="body-2 mt-4">No requests to answer.</p>}
              {waiting.length > 0 && (
                <>
                  <h3 className="label-1 mt-6 pb-3 text-ink-faint">To answer, {count(waiting.length)}</h3>
                  <ul className="rows">{waiting.map(booking)}</ul>
                </>
              )}
              {confirmed.length > 0 && (
                <>
                  <h3 className="label-1 mt-8 pb-3 text-ink-faint">Confirmed, {count(confirmed.length)}</h3>
                  <ul className="rows">{confirmed.map(booking)}</ul>
                </>
              )}
              {earlier.length > 0 && (
                <details className="mt-8">
                  <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                    Earlier bookings <Chevron className="size-4" />
                  </summary>
                  <ul className="rows mt-2">{earlier.map(booking)}</ul>
                </details>
              )}
            </section>
          )}

          {(grow || services.length > 0) && (
            <section aria-labelledby="services">
              <h2 id="services" className="heading-2">
                Services
              </h2>
              <p className="body-3 mt-2 max-w-prose text-ink-subtle">
                {grow ? "What you sell, with its price. The ones switched on are shown on your page, and a customer can ask for one when they book." : "Services are part of Biznes Grow. Yours are kept, and are not shown while the business is off that plan."}
              </p>
              {services.length > 0 && (
                <ul className="rows mt-4">
                  {services.map((s) => (
                    <li key={s.id}>
                      <details className="row">
                        <summary className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                          <span>
                            <span className="title-1 block">{s.name}</span>
                            <span className="body-3 block text-ink-subtle">{[s.price_mur != null ? rupees(s.price_mur) : "No price given", s.minutes ? duration(s.minutes) : "", s.active ? "" : "Switched off"].filter(Boolean).join(" · ")}</span>
                          </span>
                          <span className="body-3 inline-flex items-center gap-2 font-semibold text-link">
                            Change <Chevron className="size-4" />
                          </span>
                        </summary>
                        <div className="mt-4 grid gap-6">
                          <ActionForm action={saveService}>
                            <input type="hidden" name="business" value={b.id} />
                            <input type="hidden" name="service" value={s.id} />
                            <Field name="name" label="Name" defaultValue={s.name} />
                            <div className="grid gap-6 sm:grid-cols-2">
                              <Field name="price" label="Price, in rupees" inputMode="numeric" data optional defaultValue={s.price_mur != null ? String(s.price_mur) : ""} />
                              <Field name="minutes" label="How long, in minutes" inputMode="numeric" data optional defaultValue={s.minutes ? String(s.minutes) : ""} />
                            </div>
                            <TextArea name="description" label="What it is" optional rows={3} maxLength={400} defaultValue={s.description} />
                            <Check name="active" label="Shown on your page" defaultChecked={s.active} />
                            <div>
                              <Submit className="btn btn-ink button-md">Save this service</Submit>
                            </div>
                          </ActionForm>
                          <ActionForm action={removeService} className="grid gap-3">
                            <input type="hidden" name="business" value={b.id} />
                            <input type="hidden" name="service" value={s.id} />
                            <div>
                              <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                                Remove this service
                              </Submit>
                            </div>
                          </ActionForm>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
              {grow && (
                <div className="card card-panel mt-6">
                  <h3 className="heading-3">Add a service</h3>
                  <div className="mt-4">
                    <ActionForm action={saveService}>
                      <input type="hidden" name="business" value={b.id} />
                      <Field name="name" label="Name" hint="As a customer would ask for it." />
                      <div className="grid gap-6 sm:grid-cols-2">
                        <Field name="price" label="Price, in rupees" inputMode="numeric" data optional />
                        <Field name="minutes" label="How long, in minutes" inputMode="numeric" data optional />
                      </div>
                      <TextArea name="description" label="What it is" optional rows={3} maxLength={400} />
                      <div>
                        <Submit className="btn btn-ink button-md" busy="Adding">
                          Add this service
                        </Submit>
                      </div>
                    </ActionForm>
                  </div>
                </div>
              )}
            </section>
          )}

          {grow && (
            <section aria-labelledby="pay">
              <h2 id="pay" className="heading-2">
                How customers pay you
              </h2>
              <p className="body-3 mt-2 max-w-prose text-ink-subtle">
                If you take MCB Juice, give the mobile number and the name your account is under. Customers see them beside your services and after they ask for a booking, and pay you themselves: biznes.mu takes no part in the payment and never sees it. Leave both empty to show nothing.
              </p>
              <div className="mt-6">
                <ActionForm action={savePayDetails}>
                  <input type="hidden" name="business" value={b.id} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field name="juice_number" label="MCB Juice mobile number" type="tel" inputMode="tel" data optional defaultValue={pay?.juice_number ?? ""} hint="Eight digits, beginning with 5." />
                    <Field name="juice_name" label="Name on the account" optional defaultValue={pay?.juice_name ?? ""} hint="So a customer can check they are paying the right account." />
                  </div>
                  <div>
                    <Submit className="btn btn-ink button-md">Save how you are paid</Submit>
                  </div>
                </ActionForm>
              </div>
            </section>
          )}

          <section aria-labelledby="details">
            <h2 id="details" className="heading-2">
              Its details
            </h2>
            <p className="body-3 mt-2 max-w-prose text-ink-subtle">What your page says. These are your own words, and the page says so.</p>
            <div className="mt-6">
              <ActionForm action={saveBusiness}>
                <input type="hidden" name="business" value={b.id} />
                <Field name="name" label="The name of the business" autoComplete="organization" defaultValue={b.name} readOnly={b.verified} hint={b.verified ? "The name of a verified business is changed by us. Ask and we will." : undefined} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Select name="category" label="What kind of business" groups={kinds} defaultValue={b.category} />
                  <Select name="town" label="Town or village" choices={towns} empty="Choose one" defaultValue={b.town} />
                </div>
                <Field name="address" label="Address" optional autoComplete="street-address" defaultValue={b.address} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field name="phone" label="Telephone number" type="tel" autoComplete="tel" inputMode="tel" data optional defaultValue={b.phone} />
                  <Field name="website" label="Website" type="url" autoComplete="url" inputMode="url" optional defaultValue={b.website} />
                </div>
                <TextArea name="about" label="What the business does" optional rows={5} maxLength={1200} defaultValue={b.about} />
                <div>
                  <Submit>Save the details</Submit>
                </div>
              </ActionForm>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <section id="plan" aria-labelledby="plan-title">
            <h2 id="plan-title" className="heading-3">
              Its plan
            </h2>
            <p className="body-2 mt-3">
              {planName(plan)}
              {plan !== "free" && b.plan_until ? `, paid until ${day(b.plan_until)}` : ""}.
            </p>
            {lapsed && (
              <p className="body-3 mt-2 text-ink-subtle">
                {planName(b.plan)} ended on {day(b.plan_until ?? "")}. Ask for it again to carry on.
              </p>
            )}
            {open ? (
              <div className="note mt-4">
                <p className="body-3">
                  You asked for {planName(open.plan)} on {day(open.created_at)}. We will contact you to arrange payment, and switch the plan on once that is done.
                </p>
                <ActionForm action={withdrawPlanRequest} className="mt-3 grid gap-3">
                  <input type="hidden" name="business" value={b.id} />
                  <input type="hidden" name="request" value={open.id} />
                  <div>
                    <Submit className="btn btn-quiet btn-sm button-sm" busy="Taking it back">
                      Take the request back
                    </Submit>
                  </div>
                </ActionForm>
              </div>
            ) : b.status === "live" ? (
              <div className="mt-6">
                {answered?.status === "declined" && <p className="body-3 mb-4 text-ink-subtle">Your last request, for {planName(answered.plan)}, was not taken up. Ask again whenever you like.</p>}
                <ActionForm action={askForPlan}>
                  <input type="hidden" name="business" value={b.id} />
                  <Chips
                    name="plan"
                    legend="Ask for a plan"
                    defaultValue={plan === "go" ? "grow" : "go"}
                    choices={PLANS.filter((p) => p.price > 0).map((p) => ({ value: p.id, label: `${p.name}, ${rupees(p.price)} a month` }))}
                  />
                  <TextArea name="note" label="Anything we should know" optional rows={3} maxLength={500} hint="The best time to call you, for one." />
                  <div>
                    <Submit busy="Asking">Ask for this plan</Submit>
                    <p className="caption-1 mt-3 text-ink-faint">Nothing is paid here. We will contact you to arrange payment, and the plan starts once that is done. Paying online is on its way.</p>
                  </div>
                </ActionForm>
              </div>
            ) : (
              <p className="body-3 mt-2 text-ink-subtle">Once the business is live you can ask for Biznes Go or Biznes Grow here.</p>
            )}
            <p className="body-3 mt-6 text-ink-subtle">
              <Link href="/pricing">What each plan gives</Link>
            </p>
          </section>

          <section aria-labelledby="help" className="mt-10">
            <h2 id="help" className="heading-3">
              Need a hand?
            </h2>
            <p className="body-3 mt-3 text-ink-subtle">
              Call or{" "}
              <a href={contact.whatsappHref} rel="noopener">
                WhatsApp
              </a>{" "}
              <a href={contact.phoneHref} className="data-1 whitespace-nowrap">
                {contact.phone}
              </a>
              , or email <a href={`mailto:${contact.email}`}>{contact.email}</a>. We answer {contact.hours}.
            </p>
          </section>

          <section aria-labelledby="remove" className="mt-10">
            <h2 id="remove" className="heading-3">
              Take it out
            </h2>
            <details className="mt-3">
              <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                Remove this business <Chevron className="size-4" />
              </summary>
              <p className="body-3 mt-2 text-ink-subtle">
                This removes the business from your account and from the site, with its services and its bookings. It cannot be undone.{claimed ? " The listing from the open map stays, as it was before you claimed it." : ""}
              </p>
              <ActionForm action={removeBusiness} className="mt-3 grid gap-3">
                <input type="hidden" name="business" value={b.id} />
                <Check name="sure" label={`Yes, remove ${b.name}`} />
                <div>
                  <Submit className="btn btn-quiet button-md" busy="Removing">
                    Remove it for good
                  </Submit>
                </div>
              </ActionForm>
            </details>
          </section>
        </aside>
      </div>
    </>
  );
}
