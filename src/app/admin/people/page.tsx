import type { Metadata } from "next";
import AdminNav from "@/components/account/AdminNav";
import { ActionForm, Select, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireSuperadmin } from "@/lib/accounts/session";
import { ROLE_NAMES, ROLES, type Profile } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { setRole } from "../actions";

export const metadata: Metadata = { title: "People", robots: { index: false, follow: false } };

const CAN: Record<string, string> = {
  user: "Lists and looks after their own businesses, and asks for bookings.",
  admin: "Also checks new businesses, switches plans on, verifies and suspends.",
  superadmin: "Also changes roles and the site's look.",
};

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="People" />;
  const viewer = await requireSuperadmin("/admin/people");
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  // A name typed into the search, with the marks a filter would read as its own taken out.
  const like = q.replace(/[%_*\\,()"]/g, " ").trim();
  const supabase = await db();
  const base = supabase.from("profiles").select("id, email, name, phone, role, created_at").order("created_at").limit(200);
  const { data } = await (like ? base.or(`name.ilike."%${like}%",email.ilike."%${like}%"`) : base);
  const people = (data ?? []) as Profile[];
  const roles = ROLES.map((r) => ({ value: r, label: ROLE_NAMES[r] }));

  return (
    <>
      <PageHead title="People" path={[{ href: "/admin", label: "Admin" }, { label: "People" }]} lede="Everyone with an account, and what each may do. Only the superadmin sees this page." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/people" />
        <div className="max-w-3xl">
          <dl className="facts body-3">
            {ROLES.map((r) => (
              <div key={r} className="contents">
                <dt>{ROLE_NAMES[r]}</dt>
                <dd>{CAN[r]}</dd>
              </div>
            ))}
          </dl>
          <p className="caption-1 mt-3 text-ink-faint">There is always a superadmin: the last one cannot be demoted.</p>

          <form action="/admin/people" method="get" className="mt-8 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="people-q" className="title-2 block">
                Find someone by name or email address
              </label>
              <input id="people-q" name="q" type="search" defaultValue={q} className="field mt-2" />
            </div>
            <button type="submit" className="btn btn-ink button-md">
              {ACTIONS.search}
            </button>
          </form>
          <p className="caption-1 mt-3 text-ink-faint" role="status">
            {count(people.length)} {people.length === 1 ? "person" : "people"}
            {q ? ` found for “${q}”` : ""}.{people.length === 200 ? " Only the first two hundred are shown: search for another." : ""}
          </p>

          <ul className="rows mt-4">
            {people.map((p) => (
              <li key={p.id}>
                <article className="row">
                  <h2 className="title-1">
                    {p.name || "No name given"}
                    {p.id === viewer.id && <span className="tag caption-1 ml-2 align-middle font-normal">You</span>}
                  </h2>
                  <p className="body-3 mt-0.5 text-ink-subtle">
                    {[p.email, p.phone].filter(Boolean).join(" · ")} · joined {day(p.created_at)}
                  </p>
                  <ActionForm action={setRole} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="person" value={p.id} />
                    <Select name="role" label={`Role of ${p.name || p.email || "this person"}`} choices={roles} defaultValue={p.role} className="w-full max-w-xs" />
                    <Submit className="btn btn-quiet button-md">Save the role</Submit>
                  </ActionForm>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
