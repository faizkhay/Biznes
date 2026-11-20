import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/account/AdminNav";
import { ActionForm, Field, Select, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Chevron } from "@/components/Icons";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { BOOKING_NAMES, BOOKING_STATUSES, mauritiusToday, planNow, STATUS_NAMES, STATUSES, when, type Business, type PlanRequest, type Profile } from "@/lib/accounts/types";
import { count, day, shortUrl, telHref } from "@/lib/format";
import { index, whereOf } from "@/lib/index";
import { answerPlanRequest, setPlan, setStatus, setVerified } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

type Owner = Pick<Profile, "id" | "name" | "email" | "phone">;
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
    default:
      return entry.action;
  }
}

function Reach({ owner }: { owner?: Owner }) {
  if (!owner) return <span>Owner unknown</span>;
  return (
    <span>
      {owner.name || "No name given"}
      {owner.email && (
        <>
          {" · "}
          <a href={`mailto:${owner.email}`}>{owner.email}</a>
        </>
      )}
      {owner.phone && (
        <>
          {" · "}
          <a href={telHref(owner.phone)} className="data-2 whitespace-nowrap">
            {owner.phone}
          </a>
        </>
      )}
    </span>
  );
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

        <section aria-labelledby="glance" className="max-w-3xl">
          <h2 id="glance" className="heading-2">
            At a glance
          </h2>
          <dl className="facts body-3 mt-6">
            <dt>Businesses</dt>
            <dd>{STATUSES.map((s, i) => `${n(businessCounts, i)} ${STATUS_NAMES[s].toLowerCase()}`).join(", ")}</dd>
            <dt>Requests for a plan</dt>
            <dd className="data-1">{count(requests.length)} open</dd>
            <dt>Bookings</dt>
            <dd>{BOOKING_STATUSES.map((s, i) => `${n(bookingCounts, i)} ${BOOKING_NAMES[s].toLowerCase()}`).join(", ")}</dd>
          </dl>
        </section>

        <section aria-labelledby="queue" className="mt-12 max-w-3xl">
          <h2 id="queue" className="heading-2">
            To check
          </h2>
          {pending.length === 0 ? (
            <p className="body-2 mt-4 text-ink-subtle">No business is waiting.</p>
          ) : (
            <ul className="mt-6 grid gap-4">
              {pending.map((b) => {
                const claimed = b.listing_id ? byId.get(b.listing_id) : undefined;
                return (
                  <li key={b.id}>
                    <article className="card">
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
                      <ActionForm action={setStatus} className="mt-6 grid gap-4">
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

        <section aria-labelledby="plans" className="mt-12 max-w-3xl">
          <h2 id="plans" className="heading-2">
            Requests for a plan
          </h2>
          <p className="body-3 mt-2 max-w-prose text-ink-subtle">Nothing is paid on the site yet. Arrange payment with the owner, check the business is real, then switch the plan on with the last day it is paid for. Switching a plan on marks the business verified.</p>
          {requests.length === 0 ? (
            <p className="body-2 mt-4 text-ink-subtle">No request is open.</p>
          ) : (
            <ul className="mt-6 grid gap-4">
              {requests.map((r) => {
                const b = businessById.get(r.business_id);
                return (
                  <li key={r.id}>
                    <article className="card">
                      <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                        <span className="tag tag-lit">{planName(r.plan)}</span>
                        Asked {day(r.created_at)}
                        {b && <span className="tag">{STATUS_NAMES[b.status]}</span>}
                      </p>
                      <h3 className="title-1 mt-2">{b?.name ?? "A business"}</h3>
                      {b && <p className="body-3 mt-0.5 text-ink-subtle">{what(b)}</p>}
                      {r.note && <p className="body-3 mt-3 max-w-prose">Their note: {r.note}</p>}
                      <p className="body-3 mt-3 text-ink-subtle">
                        <Reach owner={b ? owners.get(b.owner_id) : undefined} />
                      </p>
                      <ActionForm action={answerPlanRequest} className="mt-6 grid gap-4">
                        <input type="hidden" name="request" value={r.id} />
                        <Field name="until" label="Paid until" type="date" min={today} defaultValue={plusDays(today, 30)} data className="max-w-xs" />
                        <div className="flex flex-wrap gap-3">
                          <Submit name="answer" value="accept" busy="Switching it on">
                            Switch the plan on
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

        <section aria-labelledby="every" className="mt-12 max-w-3xl">
          <h2 id="every" className="heading-2">
            Every business
          </h2>
          <form action="/admin" method="get" className="mt-4 flex flex-wrap items-end gap-3">
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
          <h2 id="record" className="heading-2">
            The record
          </h2>
          <p className="body-3 mt-2 text-ink-subtle">The last fifteen things done, by whom and when.</p>
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
