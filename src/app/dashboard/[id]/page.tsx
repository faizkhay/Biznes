import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Check, Chips, Field, Select, Submit, TextArea } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { Chevron, Out, Tick } from "@/components/Icons";
import { PLANS, site } from "@/data/site";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { rupees, STATUS_NAMES, thisMonth, type Business, type PlanRequest } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";
import { askForPlan, removeBusiness, saveBusiness, withdrawPlanRequest } from "../actions";

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
  const { business: b, plan, paid, grow } = await ownBusiness(id);
  const { said } = await searchParams;
  const supabase = await db();
  const month = thisMonth();
  const [{ data: requests }, { count: waiting }, { data: totals }, shown] = await Promise.all([
    supabase.from("plan_requests").select("*").eq("business_id", b.id).order("created_at", { ascending: false }).limit(5),
    grow ? supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", b.id).eq("status", "requested") : Promise.resolve({ count: 0 }),
    grow ? supabase.from("payment_totals").select("month, total, payments").eq("business_id", b.id).eq("month", month) : Promise.resolve({ data: [] }),
    owned(),
  ]);
  const open = ((requests ?? []) as PlanRequest[]).find((r) => r.status === "open");
  const answered = ((requests ?? []) as PlanRequest[]).find((r) => r.status !== "open");
  const taken = (totals ?? [])[0] as { total: number; payments: number } | undefined;

  const { groups, categories, places, byId } = index();
  const kinds = groups.map((g) => ({ label: g.label, choices: categories.filter((c) => c.group === g.id).map((c) => ({ value: c.id, label: c.one })) }));
  const towns = places
    .filter((p) => p.kind === "town" || p.slug === b.town)
    .sort((x, y) => x.name.localeCompare(y.name))
    .map((p) => ({ value: p.slug, label: p.name }));
  const now = PLANS.find((p) => p.id === plan)!;
  const planName = (which: string) => PLANS.find((p) => p.id === which)?.name ?? which;
  const lapsed = b.plan !== "free" && plan === "free";
  // What can be asked for from here: the paid plans it is not on, and, on a paid plan, to stop at the end of the period.
  const changes = [
    ...PLANS.filter((p) => p.price > 0 && p.id !== plan).map((p) => ({ value: p.id, label: `${p.price > now.price ? "" : "Step down to "}${p.name}, ${rupees(p.price)} a month` })),
    ...(paid ? [{ value: "free", label: "Stop at the end of the period" }] : []),
  ];
  const asked = (r: PlanRequest) => (r.plan === "free" ? "to stop at the end of the period" : `for ${planName(r.plan)}`);
  const page = shown.byId.get(b.id)?.path;
  const claimed = b.listing_id ? byId.get(b.listing_id) : undefined;
  const { contact } = site;

  return (
    <div className="shell grid gap-12">
      <section aria-labelledby="standing">
        <h2 id="standing" className="sr-only">
          Where it stands
        </h2>
        {said && SAID[said] && <Notice className="mb-6">{SAID[said]}</Notice>}
        <Stats>
          <Stat label="Status" figure={<span className="heading-3">{STATUS_NAMES[b.status]}</span>} note={b.status === "live" ? "Anyone can find it" : b.status === "pending" ? "A person is checking it" : undefined} />
          <Stat label="Plan" figure={<span className="heading-3">{now.name}</span>} note={paid && b.plan_until ? `Paid until ${day(b.plan_until)}` : paid ? "No last day on record" : "Free for good"} href={`/dashboard/${b.id}#plan`} />
          {grow && <Stat label="Bookings to answer" figure={count(waiting ?? 0)} note={waiting ? "Waiting for your word" : "Nothing waiting"} href={`/dashboard/${b.id}/bookings`} />}
          {grow && <Stat label="Paid this month" figure={rupees(taken?.total ?? 0)} note={taken ? `${count(taken.payments)} in your ledger` : "Nothing in your ledger yet"} href={`/dashboard/${b.id}/payments`} />}
        </Stats>
        <p className="body-2 mt-6 max-w-prose">{WHERE_IT_STANDS[b.status]}</p>
        {b.status_note && <p className="note body-3 mt-4 max-w-prose">From us: {b.status_note}</p>}
        {claimed && b.status !== "live" && (
          <p className="body-3 mt-4 max-w-prose text-ink-subtle">
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

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <section aria-labelledby="details" className="lg:col-span-7">
          <PartHead id="details" title="Its details" line="What your page says. These are your own words, and the page says so." />
          <div className="card mt-6">
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

        <aside className="grid content-start gap-10 lg:col-span-5">
          <section id="plan" aria-labelledby="plan-title">
            <h2 id="plan-title" className="heading-3">
              Its plan
            </h2>
            <div className={`card mt-4 ${paid ? "card-ink" : ""}`}>
              <p className="title-1">{now.name}</p>
              <p className={`body-3 mt-1 ${paid ? "opacity-80" : "text-ink-subtle"}`}>
                {paid ? `${rupees(now.price)} a month${b.plan_until ? `, paid until ${day(b.plan_until)}` : ""}.` : "A basic listing, free for good."}
              </p>
              <ul className="body-3 mt-4 grid gap-2">
                {now.gives.map((g) => (
                  <li key={g} className="flex gap-3">
                    <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-signal text-on-signal">
                      <Tick className="size-3.5" strokeWidth={2.25} />
                    </span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
            {lapsed && (
              <p className="body-3 mt-4 text-ink-subtle">
                {planName(b.plan)} ended on {day(b.plan_until ?? "")}. Ask for it again to carry on.
              </p>
            )}
            {open ? (
              <div className="note mt-4">
                <p className="body-3">
                  You asked {asked(open)} on {day(open.created_at)}. {open.plan === "free" ? "Once we have confirmed it, the plan runs to its last day and is not renewed." : "We will contact you to arrange payment, and make the change once that is done."}
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
                {answered?.status === "declined" && <p className="body-3 mb-4 text-ink-subtle">Your last request, {asked(answered)}, was not taken up. Ask again whenever you like.</p>}
                <ActionForm action={askForPlan}>
                  <input type="hidden" name="business" value={b.id} />
                  <Chips name="plan" legend={paid ? "Ask for a change" : "Ask for a plan"} defaultValue={changes[0]?.value} choices={changes} />
                  <TextArea name="note" label="Anything we should know" optional rows={3} maxLength={500} hint="The best time to call you, for one." />
                  <div>
                    <Submit busy="Asking" className="btn btn-ink button-md">
                      {paid ? "Ask for this change" : "Ask for this plan"}
                    </Submit>
                    <p className="caption-1 mt-3 text-ink-faint">Nothing is paid here. We will contact you to arrange payment, and the plan starts once that is done. Paying online is on its way.</p>
                  </div>
                </ActionForm>
              </div>
            ) : (
              <p className="body-3 mt-4 text-ink-subtle">Once the business is live you can ask for Biznes Go or Biznes Grow here.</p>
            )}
            <p className="body-3 mt-6 text-ink-subtle">
              <Link href="/pricing">What each plan gives</Link>
            </p>
          </section>

          <section aria-labelledby="help">
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

          <section aria-labelledby="remove">
            <h2 id="remove" className="heading-3">
              Take it out
            </h2>
            <details className="mt-3">
              <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                Remove this business <Chevron className="size-4" />
              </summary>
              <p className="body-3 mt-2 text-ink-subtle">
                This removes the business from your account and from the site, with its services, its bookings and everything else you keep here. It cannot be undone.{claimed ? " The listing from the open map stays, as it was before you claimed it." : ""}
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
    </div>
  );
}
