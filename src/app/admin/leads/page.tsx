import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/account/AdminNav";
import AccountsSoon from "@/components/account/Soon";
import { PageHead, Pager } from "@/components/Bits";
import { accountsOn } from "@/lib/accounts/config";
import { requireAdmin } from "@/lib/accounts/session";
import { count, month, telHref } from "@/lib/format";
import { index } from "@/lib/index";
import { leads } from "@/lib/leads";

export const metadata: Metadata = { title: "Listings with no website", robots: { index: false, follow: false } };

const SIZE = 100;
type Params = { town?: string; group?: string; reach?: string; page?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!accountsOn) return <AccountsSoon title="Admin" />;
  const viewer = await requireAdmin("/admin/leads");
  const params = await searchParams;
  const { places, groups, categoryById, placeBySlug } = index();
  const town = params.town && placeBySlug.has(params.town) ? params.town : "";
  const group = params.group && groups.some((g) => g.id === params.group) ? params.group : "";
  const reachable = params.reach === "1";
  const rows = leads({ town: town || undefined, group: group || undefined, reachable });
  const withPhone = rows.filter((l) => l.phone?.length).length;
  const pages = Math.max(1, Math.ceil(rows.length / SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pages);
  const shown = rows.slice((page - 1) * SIZE, page * SIZE);
  const query = new URLSearchParams();
  if (town) query.set("town", town);
  if (group) query.set("group", group);
  if (reachable) query.set("reach", "1");
  const href = (n: number) => {
    const q = new URLSearchParams(query);
    if (n > 1) q.set("page", String(n));
    return `/admin/leads${q.size ? `?${q}` : ""}`;
  };
  const towns = places.filter((p) => p.kind === "town").sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHead
        title="Listings with no website"
        path={[{ href: "/admin", label: "Admin" }, { label: "No website" }]}
        lede="Every listing in the open index with no website on record, those with a telephone number first. It is the agency's own list to work from, and only admins see it. No email address is in the index at all."
      />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/leads" />

        <form action="/admin/leads" method="get" className="grid max-w-3xl items-end gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="leads-town" className="title-2 block">
              Town or village
            </label>
            <select id="leads-town" name="town" defaultValue={town} className="field mt-2">
              <option value="">Any</option>
              {towns.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="leads-group" className="title-2 block">
              Kind of business
            </label>
            <select id="leads-group" name="group" defaultValue={group} className="field mt-2">
              <option value="">Any</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-ink button-md">
            Show these
          </button>
          <label className="body-3 flex min-h-11 items-center gap-3 sm:col-span-3">
            <input type="checkbox" name="reach" value="1" defaultChecked={reachable} className="size-4 flex-none" />
            Only businesses with a telephone number, leaving out public bodies and schools
          </label>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="body-3 text-ink-subtle" role="status">
            {count(rows.length)} {rows.length === 1 ? "listing" : "listings"} with no website, {count(withPhone)} of them with a telephone number.
          </p>
          {rows.length > 0 && (
            // A file, not a page: a plain link, so the browser downloads it.
            <a href={`/admin/leads/export${query.size ? `?${query}` : ""}`} className="btn btn-quiet button-md" download>
              Download as CSV
            </a>
          )}
        </div>

        {shown.length > 0 && (
          <div className="table-wrap mt-6" tabIndex={0} role="region" aria-label="Listings with no website">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Town or village</th>
                  <th scope="col">Telephone</th>
                  <th scope="col">Last edited on the map</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id}>
                    <th scope="row">
                      <Link prefetch={false} href={`/b/${l.slug}`} className="text-link">
                        {l.name}
                      </Link>
                    </th>
                    <td data-label="Kind">{categoryById.get(l.cat)?.one ?? ""}</td>
                    <td data-label="Town or village">{[l.area, l.place].filter(Boolean).join(", ")}</td>
                    <td data-label="Telephone">
                      {l.phone?.length ? (
                        <a href={telHref(l.phone[0])} className="data-2 whitespace-nowrap">
                          {l.phone[0]}
                        </a>
                      ) : (
                        <span className="text-ink-faint">None on record</span>
                      )}
                    </td>
                    <td data-label="Last edited on the map">{month(l.src.edited) || <span className="text-ink-faint">Not from the map</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} href={href} />
      </div>
    </>
  );
}
