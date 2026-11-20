import type { Metadata } from "next";
import AdminNav from "@/components/account/AdminNav";
import { Empty, Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Submit } from "@/components/account/Form";
import { Mail } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { thisMonth, type Subscriber } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { removeSubscriber } from "../actions";

export const metadata: Metadata = { title: "Subscribers", robots: { index: false, follow: false } };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Subscribers" />;
  const viewer = await requireAdmin("/admin/subscribers");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const like = q.replace(/[%_*\\,()"]/g, " ").trim();
  const supabase = await db();
  const tally = () => supabase.from("subscribers").select("id", { count: "exact", head: true });
  const list = supabase.from("subscribers").select("id, email, wants_guide, wants_magazine, created_at").order("created_at", { ascending: false }).limit(200);
  const [{ data: rows }, all, guide, magazine, lately] = await Promise.all([
    like ? list.ilike("email", `%${like}%`) : list,
    tally(),
    tally().eq("wants_guide", true),
    tally().eq("wants_magazine", true),
    tally().gte("created_at", `${thisMonth()}-01T00:00:00+04:00`),
  ]);
  const people = (rows ?? []) as Pick<Subscriber, "id" | "email" | "wants_guide" | "wants_magazine" | "created_at">[];
  const n = (asked: { count: number | null }) => count(asked.count ?? 0);

  return (
    <>
      <PageHead title="Subscribers" path={[{ href: "/admin", label: "Admin" }, { label: "Subscribers" }]} lede="Everyone who asked to be sent the pocket guide each month, the magazine when it begins, or both." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/subscribers" />
        <Stats>
          <Stat label="On the list" figure={n(all)} />
          <Stat label="Want the pocket guide" figure={n(guide)} />
          <Stat label="Want the magazine" figure={n(magazine)} />
          <Stat label="Joined this month" figure={n(lately)} />
        </Stats>

        <section aria-labelledby="send" className="mt-8 grid max-w-3xl gap-4">
          <h2 id="send" className="sr-only">
            Sending to the list
          </h2>
          <Notice>
            This site sends no email. To write to the list, take it as a file and send from your own mail service. Each row carries that person&rsquo;s own link to leave the list: put it in every message you send them.
          </Notice>
          <p className="flex flex-wrap gap-3">
            <a href="/admin/subscribers/export" className="btn btn-ink button-md" download>
              Take the whole list as a file
            </a>
            <a href="/admin/subscribers/export?want=guide" className="btn btn-quiet button-md" download>
              Only the pocket guide
            </a>
            <a href="/admin/subscribers/export?want=magazine" className="btn btn-quiet button-md" download>
              Only the magazine
            </a>
          </p>
        </section>

        <section aria-labelledby="list" className="mt-12">
          <PartHead id="list" title="The list" line="The latest to join first. Take an address off if its owner asks you to; they can also leave by their own link." />
          <form action="/admin/subscribers" method="get" className="mt-6 flex max-w-xl flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="subscribers-q" className="title-2 block">
                Find an address
              </label>
              <input id="subscribers-q" name="q" type="search" defaultValue={q} className="field mt-2" />
            </div>
            <button type="submit" className="btn btn-quiet button-md">
              {ACTIONS.search}
            </button>
          </form>
          {people.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Mail />} title={q ? "No address like that" : "Nobody yet"}>
                {q ? "Try a shorter part of the address." : "When someone joins from the form on the site, their address appears here."}
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
                        <td data-label="Joined" className="whitespace-nowrap">
                          {day(p.created_at.slice(0, 10))}
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
      </div>
    </>
  );
}
