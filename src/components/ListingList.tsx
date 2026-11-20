import Link from "next/link";
import { chartPoints } from "@/lib/chart";
import { count } from "@/lib/format";
import type { Listing } from "@/lib/index";
import { narrowed, narrowOf, PAGE_SIZE } from "@/lib/search";
import { Pager } from "./Bits";
import Chart from "./Chart";
import Filters, { narrowQuery } from "./Filters";
import { ListingRow } from "./Rows";

/**
 * A page of a list of listings with the island beside it: what a category's page, a town's page
 * and the two together all are. `narrow` are the ways to make the list smaller by going elsewhere
 * (towns for a category, categories for a town), each with how many it would leave; the filters
 * narrow it where it stands, by what a listing has. `params` is the page's own address after "?".
 */
export default function ListingList({
  listings: all,
  path,
  params,
  narrow,
  narrowLabel,
  says,
}: {
  listings: Listing[];
  path: string;
  params: { page?: string; phone?: string; web?: string };
  narrow?: { href: string; label: string; n: number }[];
  narrowLabel?: string;
  says: string;
}) {
  const chosen = narrowOf(params);
  const { facets, listings } = narrowed(all, chosen);
  const { at } = chartPoints();
  const lit = listings.map((l) => at.get(l.id)).filter((i): i is number => i != null);
  const pages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pages);
  const shown = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const query = (n: number, how = chosen) => {
    const q = `${narrowQuery(how)}${n > 1 ? `&page=${n}` : ""}`.slice(1);
    return q ? `${path}?${q}` : path;
  };
  const onChart = `On the island: ${count(lit.length)} of ${count(listings.length)}.`;
  return (
    <div className="shell grid gap-x-12 chart:grid-cols-12">
      <div className="chart:col-span-7">
        {narrow && narrow.length > 0 && (
          <nav aria-label={narrowLabel} className="mb-4">
            <h2 className="label-1 text-ink-faint">{narrowLabel}</h2>
            <ul className="narrow">
              {narrow.map((w) => (
                <li key={w.href}>
                  <Link prefetch={false} href={w.href} className="body-3">
                    {w.label} <span className="data-2 text-ink-faint">{count(w.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="mb-6">
          <Filters facets={facets} narrow={chosen} href={(how) => query(1, how)} town={false} />
        </div>
        {listings.length === 0 ? (
          <p className="body-2 text-ink-subtle" role="status">
            None of the {count(all.length)} listed here has that on record.{" "}
            <Link prefetch={false} href={path}>
              Show them all
            </Link>
          </p>
        ) : (
          <ul className="rows">
            {shown.map((l) => (
              <li key={l.id}>
                <ListingRow listing={l} />
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} pages={pages} href={(n) => query(n)} />
        {/* On a phone the island comes after the list: the first thing a visitor needs is a name and a number. */}
        {lit.length > 0 && (
          <div className="mt-10 flex items-center gap-4 chart:hidden">
            <Chart className="chart-strip" lit={lit} zoom says={says} />
            <p className="caption-1 text-ink-faint">{onChart}</p>
          </div>
        )}
      </div>
      {lit.length > 0 && (
        <aside className="hidden chart:col-span-5 chart:block">
          <div className="sticky top-24">
            <Chart className="chart-side" lit={lit} zoom says={says} />
            <p className="caption-1 mt-3 text-ink-faint">{onChart} Point at a row to see where it is.</p>
          </div>
        </aside>
      )}
    </div>
  );
}
