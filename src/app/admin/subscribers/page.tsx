import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/account/AdminNav";
import { Empty, Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import { Mail } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Tick } from "@/components/Icons";
import { ACTIONS, PUBLICATIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { currentSender, emailStatus } from "@/lib/accounts/email/store";
import { SUPPRESSION_NAMES, type Suppression } from "@/lib/accounts/email/types";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { mauritiusToday, type Subscriber } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { removeSubscriber } from "../actions";
import { suppressAddress, unsuppressAddress } from "../email/actions";

export const metadata: Metadata = { title: "Subscribers", robots: { index: false, follow: false } };

type Asked = { q?: string; want?: string; state?: string };
type Listed = Pick<Subscriber, "id" | "email" | "wants_guide" | "wants_magazine" | "created_at" | "confirmed_at"> & { confirm_sent_at: string | null };

/** The day a moment fell on in Mauritius, in words. */
const dayOf = (iso: string) => day(mauritiusToday(Date.parse(iso)));

const SOURCES: Record<string, string> = { admin: "Written down by an admin", resend: "Reported by Resend", mailgun: "Reported by Mailgun", local: "Reported by the local sender" };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<Asked> }) {
  if (!accountsOn) return <AccountsSoon title="Subscribers" />;
  const viewer = await requireAdmin("/admin/subscribers");
  const asked = await searchParams;
  const q = (asked.q ?? "").trim().slice(0, 80);
  const want = asked.want === "guide" || asked.want === "magazine" ? asked.want : "";
  const state = asked.state === "confirmed" || asked.state === "unconfirmed" ? asked.state : "";
  const like = q.replace(/[%_*\\,()"]/g, " ").trim();
  const supabase = await db();
  const listOf = (columns: string) => {
    let list = supabase.from("subscribers").select(columns).order("created_at", { ascending: false }).limit(200);
    if (like) list = list.ilike("email", `%${like}%`);
    if (want === "guide") list = list.eq("wants_guide", true);
    if (want === "magazine") list = list.eq("wants_magazine", true);
    if (state === "confirmed") list = list.not("confirmed_at", "is", null);
    if (state === "unconfirmed") list = list.is("confirmed_at", null);
    return list;
  };
  const OLD_COLUMNS = "id, email, wants_guide, wants_magazine, created_at, confirmed_at";
  const [first, counted, sender, { data: suppressedRows }] = await Promise.all([listOf(`${OLD_COLUMNS}, confirm_sent_at`), emailStatus(supabase), currentSender(), supabase.from("email_suppressions").select("email, reason, detail, source, created_at").order("created_at", { ascending: false }).limit(200)]);
  // A database from before part 14 does not say when an address was asked to confirm: the list is read as it was.
  const { data: rows } = first.error ? await listOf(OLD_COLUMNS) : first;
  const people = ((rows ?? []) as unknown as Listed[]).map((p) => ({ ...p, confirm_sent_at: p.confirm_sent_at ?? null }));
  const suppressed = (suppressedRows ?? []) as Suppression[];
  // Which of the addresses shown are kept from being written to: asked by name, so a long list of those is no matter.
  const { data: kept } = people.length ? await supabase.from("email_suppressions").select("email").in("email", people.map((p) => p.email)) : { data: [] };
  const notWritten = new Set((kept ?? []).map((k) => k.email as string));
  // Without the function that counts (a database from before part 14), the list is counted the way it was.
  const total = counted?.subscribers ?? (await supabase.from("subscribers").select("id", { count: "exact", head: true })).count ?? 0;
  const narrowed = Boolean(q || want || state);
  const href = (next: Partial<Asked>) => {
    const to = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, want, state, ...next })) if (value) to.set(key, value);
    return `/admin/subscribers${to.size ? `?${to}` : ""}#list`;
  };

  return (
    <>
      <PageHead title="Subscribers" path={[{ href: "/admin", label: "Admin" }, { label: "Subscribers" }]} lede="Everyone who asked to be sent the pocket guide each month, the magazine when it begins, or both. Each joined by their own act: nobody is added here by hand." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/subscribers" />
        {!counted && (
          <Notice bad className="mb-8">
            The database has not had part 14 of the migrations applied, so the list is shown as it was: nobody can confirm an address yet, and no address can be kept from being written to. Apply it, then open this page again.
          </Notice>
        )}
        <Stats five>
          <Stat label="On the list" figure={count(total)} href={href({ want: "", state: "" })} />
          <Stat label="Confirmed" figure={count(counted?.confirmed ?? 0)} note="Pressed the link in a message." href={href({ state: "confirmed" })} />
          <Stat label="Want the pocket guide" figure={count(counted?.guide ?? 0)} href={href({ want: "guide" })} />
          <Stat label="Want the magazine" figure={count(counted?.magazine ?? 0)} href={href({ want: "magazine" })} />
          <Stat label="Not written to" figure={count(counted?.suppressed ?? 0)} note="Bounced, complained, or asked us." href="#suppressed" />
        </Stats>

        <section aria-labelledby="send" className="mt-8 grid max-w-3xl gap-4">
          <h2 id="send" className="sr-only">
            Writing to the list
          </h2>
          <Notice bad={!sender.connected}>
            {sender.connected
              ? "The site sends its own email. Write a message on the Email page and send it from there: each address is sent its own copy, with its own link to leave."
              : "No sender is connected, so this site sends no email yet, and nobody can be asked to confirm their address. Write a message on the Email page all the same: it gives you the addresses for that message as a file, and the message to send from your own mail program."}
          </Notice>
          <p className="flex flex-wrap gap-3">
            <Link prefetch={false} href="/admin/email" className="btn btn-ink button-md">
              Write to the list
            </Link>
            <a href="/admin/subscribers/export" className="btn btn-quiet button-md" download>
              Take the whole list as a file
            </a>
            <a href="/admin/subscribers/export?want=guide" className="btn btn-quiet button-md" download>
              Only the pocket guide
            </a>
            <a href="/admin/subscribers/export?want=magazine" className="btn btn-quiet button-md" download>
              Only the magazine
            </a>
          </p>
          <p className="caption-1 text-ink-faint">The file says of each address whether it is confirmed and whether it may be written to, and carries that person&rsquo;s own link to leave the list.</p>
        </section>

        <section aria-labelledby="list" className="mt-12 scroll-mt-24">
          <PartHead id="list" title="The list" line="The latest to join first. Take an address off if its owner asks you to; they can also leave by their own link." />
          <form action="/admin/subscribers" method="get" className="mt-6 flex max-w-xl flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="subscribers-q" className="title-2 block">
                Find an address
              </label>
              <input id="subscribers-q" name="q" type="search" defaultValue={q} className="field mt-2" />
            </div>
            {want && <input type="hidden" name="want" value={want} />}
            {state && <input type="hidden" name="state" value={state} />}
            <button type="submit" className="btn btn-quiet button-md">
              {ACTIONS.search}
            </button>
          </form>
          <nav aria-label="Narrow the list" className="filters mt-4">
            <Link prefetch={false} href={href({ want: want === "guide" ? "" : "guide" })} aria-current={want === "guide" ? "true" : undefined} className="filter body-3">
              {want === "guide" && <Tick />}
              Want the {PUBLICATIONS.guide.short}
            </Link>
            <Link prefetch={false} href={href({ want: want === "magazine" ? "" : "magazine" })} aria-current={want === "magazine" ? "true" : undefined} className="filter body-3">
              {want === "magazine" && <Tick />}
              Want the magazine
            </Link>
            <Link prefetch={false} href={href({ state: state === "confirmed" ? "" : "confirmed" })} aria-current={state === "confirmed" ? "true" : undefined} className="filter body-3">
              {state === "confirmed" && <Tick />}
              Confirmed
            </Link>
            <Link prefetch={false} href={href({ state: state === "unconfirmed" ? "" : "unconfirmed" })} aria-current={state === "unconfirmed" ? "true" : undefined} className="filter body-3">
              {state === "unconfirmed" && <Tick />}
              Not confirmed
            </Link>
          </nav>
          {people.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Mail />} title={narrowed ? "No address like that" : "Nobody yet"}>
                {narrowed ? "Try a shorter part of the address, or take a filter off." : "When someone joins from the form on the site, their address appears here."}
              </Empty>
            </div>
          ) : (
            <>
              <p className="caption-1 mt-4 text-ink-faint" role="status">
                {count(people.length)} {people.length === 1 ? "address" : "addresses"}
                {q ? ` found for “${q}”` : ""}.{people.length === 200 ? " Only the first two hundred are shown: the file holds them all." : ""}
              </p>
              <div className="table-wrap mt-3" tabIndex={0} role="region" aria-label="Subscribers">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Email address</th>
                      <th scope="col">Wants</th>
                      <th scope="col">Confirmed</th>
                      <th scope="col">Joined</th>
                      <th scope="col">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((p) => (
                      <tr key={p.id}>
                        <th scope="row" className="break-all">
                          {p.email}
                        </th>
                        <td data-label="Wants">{p.wants_guide && p.wants_magazine ? "The pocket guide and the magazine" : p.wants_guide ? "The pocket guide" : "The magazine"}</td>
                        <td data-label="Confirmed">
                          {p.confirmed_at ? <span className="tag tag-lit">Confirmed {dayOf(p.confirmed_at)}</span> : <span className="tag">Not confirmed</span>}
                          {!p.confirmed_at && p.confirm_sent_at && <span className="mt-1 block text-ink-subtle">Asked on {dayOf(p.confirm_sent_at)}</span>}
                          {notWritten.has(p.email) && <span className="mt-1 block text-ink-subtle">Not written to</span>}
                        </td>
                        <td data-label="Joined" className="whitespace-nowrap">
                          {dayOf(p.created_at)}
                        </td>
                        <td>
                          <ActionForm action={removeSubscriber} className="flex sm:justify-end" quiet>
                            <input type="hidden" name="subscriber" value={p.id} />
                            <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                              Take off<span className="sr-only">: {p.email}</span>
                            </Submit>
                          </ActionForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section aria-labelledby="suppressed" className="mt-12 scroll-mt-24">
          <PartHead
            id="suppressed"
            title="Not written to"
            line="Addresses no message goes to: one that bounced for good, one whose reader marked a message as spam, one whose owner asked us. Each is looked up before every send. Joining again does not take an address out of here: a fresh confirmation does for one that bounced, and for the others only you do, below."
          />
          <div className="mt-6 grid gap-x-16 gap-y-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="card card-panel">
                <h3 className="title-1">Someone asked not to be written to</h3>
                <ActionForm action={suppressAddress} className="mt-4 grid gap-4">
                  <Field name="address" label="Their email address" type="email" inputMode="email" />
                  <Field name="why" label="How they asked" optional hint="For the record: by telephone, in a reply." />
                  <div>
                    <Submit className="btn btn-ink button-md">Stop writing to this address</Submit>
                  </div>
                </ActionForm>
              </div>
            </div>
            <div className="lg:col-span-7">
              {suppressed.length === 0 ? (
                <p className="note body-3">No address is kept from being written to.</p>
              ) : (
                <div className="table-wrap" tabIndex={0} role="region" aria-label="Addresses not written to">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Email address</th>
                        <th scope="col">Why</th>
                        <th scope="col">Since</th>
                        <th scope="col">
                          <span className="sr-only">Lift</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppressed.map((s) => (
                        <tr key={s.email}>
                          <th scope="row" className="break-all">
                            {s.email}
                          </th>
                          <td data-label="Why">
                            <span className="tag">{SUPPRESSION_NAMES[s.reason] ?? s.reason}</span>
                            <span className="mt-1 block text-ink-subtle">
                              {SOURCES[s.source] ?? s.source}
                              {s.detail ? `: ${s.detail}` : ""}
                            </span>
                          </td>
                          <td data-label="Since" className="whitespace-nowrap">
                            {dayOf(s.created_at)}
                          </td>
                          <td>
                            <ActionForm action={unsuppressAddress} className="flex sm:justify-end" quiet>
                              <input type="hidden" name="address" value={s.email} />
                              <Submit className="btn btn-quiet btn-sm button-sm" busy="Lifting">
                                Lift<span className="sr-only">: {s.email}</span>
                              </Submit>
                            </ActionForm>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {suppressed.length === 200 && <p className="caption-1 mt-3 text-ink-faint">Only the latest two hundred are shown.</p>}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
