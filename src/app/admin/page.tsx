import type { Metadata } from "next";
import Link from "next/link";
import { Reach, type Owner } from "@/components/account/AdminBits";
import AdminNav from "@/components/account/AdminNav";
import { Empty, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Field, Select, Submit } from "@/components/account/Form";
import { Tag } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Chevron, Store } from "@/components/Icons";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { BOOKING_NAMES, BOOKING_STATUSES, mauritiusToday, ORDER_NAMES, planNow, STATUS_NAMES, STATUSES, when, type Business, type OrderStatus, type PlanRequest } from "@/lib/accounts/types";
import { count, day, shortUrl } from "@/lib/format";
import { index, whereOf } from "@/lib/index";
import { answerPlanRequest, setPlan, setStatus, setVerified } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

type Logged = { id: number; at: string; actor: string | null; action: string; detail: Record<string, unknown> };

const planName = (id: string) => PLANS.find((p) => p.id === id)?.name ?? id;
const plusDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * 864e5).toISOString().slice(0, 10);

/** What the record says of an action, in words. */
function told(entry: Logged): string {
  const d = entry.detail;
  const name = typeof d.name === "string" ? d.name : "";
  switch (entry.action) {
    case "business.listed":
      return `${name} was listed${d.listing ? ", as a claim on a listing" : ""}`;
    case "business.removed":
      return `${name} was removed`;
    case "business.status":
      return `${name}: ${STATUS_NAMES[d.to as Business["status"]] ?? d.to}`;
    case "business.plan":
      return `${name}: ${planName(String(d.to))}${d.until ? `, until ${day(String(d.until))}` : ""}`;
    case "business.verified":
      return `${name}: ${d.to ? "marked verified" : "verified mark taken off"}`;
    case "plan_request.done":
      return `A request for ${planName(String(d.plan))} was switched on`;
    case "plan_request.declined":
      return `A request for ${planName(String(d.plan))} was declined`;
    case "role.set":
      return `A role was changed from ${d.from} to ${d.to}`;
    case "role.first_superadmin":
      return "The first account became the superadmin";
    case "settings.look":
      return "The site's look was changed";
    case "ad.submitted":
      return `${name} sent in an advertisement: ${d.headline ?? ""}`;
    case "ad.approved":
      return `An advertisement of ${name} was approved: ${d.headline ?? ""}`;
    case "ad.declined":
      return `An advertisement of ${name} was declined: ${d.headline ?? ""}`;
    case "ad.draft":
      return `${name} took an advertisement back: ${d.headline ?? ""}`;
    case "ad.paid":
      return `An advertisement of ${name} was marked paid: ${d.headline ?? ""}`;
    case "ad.unpaid":
      return `An advertisement of ${name} was marked not paid: ${d.headline ?? ""}`;
    case "picture.added":
      return `A picture was added for behind the page: ${d.label ?? ""}`;
    case "picture.removed":
      return `A picture for behind the page was removed: ${d.label ?? ""}`;
    case "subscriber.removed":
      return "An address was taken off the list of subscribers";
    case "catalogue.set":
      return "The catalogue was brought level with the site";
    default:
      if (entry.action.startsWith("order.")) return `Order ${d.number ?? ""}: ${ORDER_NAMES[entry.action.slice(6) as OrderStatus]?.toLowerCase() ?? entry.action.slice(6)}`;
      return entry.action;
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Admin" />;
  const viewer = await requireAdmin("/admin");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const supabase = await db();
  const today = mauritiusToday();

  const tally = (table: "businesses" | "bookings", status: string) => supabase.from(table).select("id", { count: "exact", head: true }).eq("status", status);
  // A name typed into the search, with the marks a pattern would read as its own taken out.
  const like = q.replace(/[%_*\\,()]/g, " ").trim();
  const everyQuery = supabase.from("businesses").select("*").order("updated_at", { ascending: false }).limit(30);

  const [{ data: pendingRows }, { data: requestRows }, { data: everyRows }, { data: logRows }, businessCounts, bookingCounts] = await Promise.all([
    supabase.from("businesses").select("*").eq("status", "pending").order("created_at").limit(50),
    supabase.from("plan_requests").select("*").eq("status", "open").order("created_at").limit(50),
    like ? everyQuery.ilike("name", `%${like}%`) : everyQuery,
    supabase.from("audit_log").select("id, at, actor, action, detail").order("id", { ascending: false }).limit(15),
    Promise.all(STATUSES.map((s) => tally("businesses", s))),
    Promise.all(BOOKING_STATUSES.map((s) => tally("bookings", s))),
  ]);
  const pending = (pendingRows ?? []) as Business[];
  const requests = (requestRows ?? []) as PlanRequest[];
  const every = (everyRows ?? []) as Business[];
  const log = (logRows ?? []) as Logged[];

  // The businesses the requests are about, and everyone who owns or did something shown here.
  const missing = requests.map((r) => r.business_id).filter((id) => ![...pending, ...every].some((b) => b.id === id));
  const { data: moreRows } = missing.length ? await supabase.from("businesses").select("*").in("id", missing) : { data: [] };
  const businessById = new Map([...pending, ...every, ...((moreRows ?? []) as Business[])].map((b) => [b.id, b]));
  const people = [...new Set([...businessById.values()].map((b) => b.owner_id).concat(log.map((l) => l.actor ?? "").filter(Boolean)))];
  const { data: ownerRows } = people.length ? await supabase.from("profiles").select("id, name, email, phone").in("id", people) : { data: [] };
  const owners = new Map(((ownerRows ?? []) as Owner[]).map((o) => [o.id, o]));

  const { categoryById, placeBySlug, byId } = index();
  const what = (b: Business) => [categoryById.get(b.category)?.one, placeBySlug.get(b.town)?.name].filter(Boolean).join(" · ");
  const n = (results: { count: number | null }[], i: number) => count(results[i]?.count ?? 0);
  const plans = PLANS.map((p) => ({ value: p.id, label: p.name }));

  return (
    <>
      <PageHead title="Admin" path={[{ href: "/account", label: "Your account" }, { label: "Admin" }]} lede="New businesses to check, requests for a plan, and every business an owner has listed. Everything done here is recorded with your name." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin" />

        <section aria-labelledby="glance">
          <h2 id="glance" className="sr-only">
            At a glance
          </h2>
          <Stats>
            <Stat label="To check" figure={count(pending.length)} note="New businesses and claims." href="#queue" />
            <Stat label="Requests for a plan" figure={count(requests.length)} note="Open." href="#plans" />
            <Stat label="Live businesses" figure={n(businessCounts, STATUSES.indexOf("live"))} note={STATUSES.filter((s) => s !== "live" && s !== "pending").map((s) => `${n(businessCounts, STATUSES.indexOf(s))} ${STATUS_NAMES[s].toLowerCase()}`).join(", ")} href="#every" />
            <Stat label="Bookings asked for" figure={n(bookingCounts, BOOKING_STATUSES.indexOf("requested"))} note={`${n(bookingCounts, BOOKING_STATUSES.indexOf("confirmed"))} ${BOOKING_NAMES.confirmed.toLowerCase()}, ${n(bookingCounts, BOOKING_STATUSES.indexOf("done"))} ${BOOKING_NAMES.done.toLowerCase()}.`} />
          </Stats>
        </section>

        <section aria-labelledby="queue" className="mt-12 scroll-mt-24">
          <PartHead id="queue" title="To check" line="New businesses and claims on a listing, the oldest first. Nothing goes live until you approve it." />
          {pending.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Store />} title="No business is waiting">
                When an owner lists a business or claims a listing, it waits here for you.
              </Empty>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {pending.map((b) => {
                const claimed = b.listing_id ? byId.get(b.listing_id) : undefined;
                return (
                  <li key={b.id}>
                    <article className="card grid gap-x-10 gap-y-6 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                      <p className="caption-1 text-ink-faint">Listed {day(b.created_at)}</p>
                      <h3 className="title-1 mt-1">{b.name}</h3>
                      <p className="body-3 mt-0.5 text-ink-subtle">{what(b)}</p>
                      {b.listing_id && (
                        <p className="note body-3 mt-4">
                          {claimed ? (
                            <>
                              A claim on the listing <Link href={`/b/${claimed.slug}`}>{claimed.name}</Link> ({whereOf(claimed) || "no place on record"}). Approve it only once you are satisfied the business is theirs.
                            </>
                          ) : (
                            `A claim on listing ${b.listing_id}, which is no longer in the index.`
                          )}
                        </p>
                      )}
                      <dl className="facts body-3 mt-4">
                        {b.address && (
                          <>
                            <dt>Address</dt>
                            <dd>{b.address}</dd>
                          </>
                        )}
                        {b.phone && (
                          <>
                            <dt>Telephone</dt>
                            <dd className="data-1">{b.phone}</dd>
                          </>
                        )}
                        {b.website && (
                          <>
                            <dt>Website</dt>
                            <dd>
                              <a href={b.website} rel="noopener nofollow" className="data-1 break-all">
                                {shortUrl(b.website)}
                              </a>
                            </dd>
                          </>
                        )}
                        {b.about && (
                          <>
                            <dt>In their words</dt>
                            <dd className="whitespace-pre-line">{b.about}</dd>
                          </>
                        )}
                        <dt>Owner</dt>
                        <dd>
                          <Reach owner={owners.get(b.owner_id)} />
                        </dd>
                      </dl>
                      </div>
                      <ActionForm action={setStatus} className="grid content-start gap-4 lg:col-span-5">
                        <input type="hidden" name="business" value={b.id} />
                        <Field name="note" label="If you do not accept it, why" hint="One line. The owner is shown it, and can change the details and send it back." />
                        <div className="flex flex-wrap gap-3">
                          <Submit name="status" value="live" busy="Approving">
                            Approve
                          </Submit>
                          <Submit name="status" value="rejected" className="btn btn-quiet button-md">
                            Do not accept
                          </Submit>
                        </div>
                      </ActionForm>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="plans" className="mt-12 scroll-mt-24">
          <PartHead id="plans" title="Requests for a plan" line="Nothing is paid on the site yet. Arrange payment with the owner, check the business is real, then switch the plan on with the last day it is paid for. Switching a plan on marks the business verified. A request to stop keeps the plan to the end of its period." />
          {requests.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Tag />} title="No request is open">
                When an owner asks for a plan, to change one or to stop one, the request waits here.
              </Empty>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {requests.map((r) => {
                const b = businessById.get(r.business_id);
                const stop = r.plan === "free";
                return (
                  <li key={r.id}>
                    <article className="card grid gap-x-10 gap-y-6 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                          <span className="tag tag-lit">{stop ? "Stop the plan" : planName(r.plan)}</span>
                          Asked {day(r.created_at)}
                          {b && <span className="tag">{STATUS_NAMES[b.status]}</span>}
                        </p>
                        <h3 className="title-1 mt-2">{b?.name ?? "A business"}</h3>
                        {b && <p className="body-3 mt-0.5 text-ink-subtle">{what(b)}</p>}
                        {b && (
                          <p className="body-3 mt-3">
                            {stop
                              ? `They asked to stop ${planName(b.plan)} at the end of its period${b.plan_until ? `, which runs to ${day(b.plan_until)}` : ""}.`
                              : b.plan !== "free" && planNow(b.plan, b.plan_until) !== "free"
                                ? `It is on ${planName(b.plan)}${b.plan_until ? ` to ${day(b.plan_until)}` : ""} and asks for ${planName(r.plan)}.`
                                : `It is on Biznes Free and asks for ${planName(r.plan)}.`}
                          </p>
                        )}
                        {r.note && <p className="body-3 mt-3 max-w-prose">Their note: {r.note}</p>}
                        <p className="body-3 mt-3 text-ink-subtle">
                          <Reach owner={b ? owners.get(b.owner_id) : undefined} />
                        </p>
                      </div>
                      <ActionForm action={answerPlanRequest} className="grid content-start gap-4 lg:col-span-5">
                        <input type="hidden" name="request" value={r.id} />
                        {stop && <input type="hidden" name="kind" value="stop" />}
                        <Field name="until" label={stop ? "Its last day" : "Paid until"} type="date" min={today} defaultValue={stop && b?.plan_until && b.plan_until >= today ? b.plan_until : plusDays(today, stop ? 0 : 30)} data className="max-w-xs" hint={stop ? "The plan runs to this day, then the business is on Biznes Free." : undefined} />
                        <div className="flex flex-wrap gap-3">
                          <Submit name="answer" value="accept" busy={stop ? "Confirming" : "Switching it on"}>
                            {stop ? "Confirm the stop" : "Switch the plan on"}
                          </Submit>
                          <Submit name="answer" value="decline" className="btn btn-quiet button-md">
                            Decline
                          </Submit>
                        </div>
                      </ActionForm>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="every" className="mt-12 max-w-3xl scroll-mt-24">
          <PartHead id="every" title="Every business" line="Each business an owner has listed or claimed. Open one to verify it, suspend it or set its plan by hand." />
          <form action="/admin" method="get" className="mt-6 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="admin-q" className="title-2 block">
                Find one by name
              </label>
              <input id="admin-q" name="q" type="search" defaultValue={q} className="field mt-2" />
            </div>
            <button type="submit" className="btn btn-ink button-md">
              {ACTIONS.search}
            </button>
          </form>
          <p className="caption-1 mt-3 text-ink-faint" role="status">
            {q ? `${count(every.length)} found for “${q}”.` : `The ${count(every.length)} changed most lately.`}
            {every.length === 30 ? " Only the first thirty are shown: search by name for another." : ""}
          </p>
          <ul className="rows mt-4">
            {every.map((b) => {
              const plan = planNow(b.plan, b.plan_until);
              return (
                <li key={b.id}>
                  <details className="row">
                    <summary className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                      <span className="min-w-0">
                        <span className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                          <span className={`tag ${b.status === "live" ? "tag-lit" : ""}`}>{STATUS_NAMES[b.status]}</span>
                          <span className="tag">
                            {planName(b.plan)}
                            {b.plan !== "free" && b.plan_until ? `, ${plan === "free" ? "ended" : "until"} ${day(b.plan_until)}` : ""}
                          </span>
                        </span>
                        <span className="title-1 mt-2 block">
                          {b.name}
                          {b.verified && plan !== "free" && <VerifiedMark priority />}
                        </span>
                        <span className="body-3 block text-ink-subtle">{what(b)}</span>
                      </span>
                      <span className="body-3 inline-flex items-center gap-2 font-semibold text-link">
                        Change <Chevron className="size-4" />
                      </span>
                    </summary>
                    <div className="mt-4 grid gap-8">
                      <p className="body-3 text-ink-subtle">
                        <Reach owner={owners.get(b.owner_id)} />
                        {b.status_note ? ` · Note to the owner: ${b.status_note}` : ""}
                      </p>

                      <ActionForm action={setVerified} className="grid gap-3">
                        <input type="hidden" name="business" value={b.id} />
                        <input type="hidden" name="verified" value={b.verified ? "no" : "yes"} />
                        <p className="body-3">{b.verified ? "Verified: someone has checked that this business is real." : "Not verified."}</p>
                        <div>
                          <Submit className="btn btn-quiet btn-sm button-sm">{b.verified ? "Take the verified mark off" : "Mark verified"}</Submit>
                        </div>
                      </ActionForm>

                      {b.status !== "pending" && (
                        <ActionForm action={setStatus} className="grid gap-4">
                          <input type="hidden" name="business" value={b.id} />
                          {b.status === "live" ? (
                            <>
                              <Field name="note" label="Why it is being suspended" hint="One line. The owner is shown it." />
                              <div>
                                <Submit name="status" value="suspended" className="btn btn-quiet btn-sm button-sm" busy="Suspending">
                                  Suspend
                                </Submit>
                              </div>
                            </>
                          ) : (
                            <div>
                              <Submit name="status" value="live" className="btn btn-quiet btn-sm button-sm">
                                Make it live
                              </Submit>
                            </div>
                          )}
                        </ActionForm>
                      )}

                      <ActionForm action={setPlan} className="grid gap-4">
                        <input type="hidden" name="business" value={b.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Select name="plan" label="Plan" choices={plans} defaultValue={b.plan} />
                          <Field name="until" label="Paid until" type="date" min={today} defaultValue={b.plan_until ?? plusDays(today, 30)} data hint="Not used for Biznes Free." />
                        </div>
                        <div>
                          <Submit className="btn btn-quiet btn-sm button-sm">Set the plan</Submit>
                        </div>
                      </ActionForm>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="record" className="mt-12 max-w-3xl">
          <PartHead id="record" title="The record" line="The last fifteen things done, by whom and when." />
          <ul className="rows mt-4">
            {log.map((entry) => (
              <li key={entry.id}>
                <p className="row body-3">
                  <span className="caption-1 block text-ink-faint">
                    {when(entry.at)} · {entry.actor ? owners.get(entry.actor)?.name || owners.get(entry.actor)?.email || "Someone" : "The database"}
                  </span>
                  {told(entry)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
