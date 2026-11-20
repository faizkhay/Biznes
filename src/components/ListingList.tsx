import Link from "next/link";
import { count } from "@/lib/format";
import type { Listing } from "@/lib/index";
import { PAGE_SIZE } from "@/lib/search";
import { chartPoints } from "@/lib/chart";
import { Pager } from "./Bits";
import Chart from "./Chart";
import { ListingRow } from "./Rows";

/**
 * A page of a list of listings with the chart beside it: what a category's page, a town's page and
 * the two together all are. `narrow` are the ways to make the list smaller (towns for a category,
 * categories for a town), each with how many it would leave.
 */
export default function ListingList({ listings, page, href, narrow, narrowLabel, says }: { listings: Listing[]; page: number; href: (n: number) => string; narrow?: { href: string; label: string; n: number }[]; narrowLabel?: string; says: string }) {
  const { at } = chartPoints();
  const lit = listings.map((l) => at.get(l.id)).filter((i): i is number => i != null);
  const pages = Math.ceil(listings.length / PAGE_SIZE);
  const shown = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <div className="shell grid gap-x-12 chart:grid-cols-12">
      <div className="chart:col-span-7">
        {narrow && narrow.length > 0 && (
          <nav aria-label={narrowLabel} className="mb-8">
            <h2 className="label-1 pb-3 text-ink-faint">{narrowLabel}</h2>
            <ul className="flex flex-wrap gap-2">
              {narrow.map((w) => (
                <li key={w.href}>
                  <Link prefetch={false} href={w.href} className="btn btn-quiet button-sm">
                    {w.label} <span className="data-2 text-ink-faint">{count(w.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <ul className="rows">
          {shown.map((l) => (
            <li key={l.id}>
              <ListingRow listing={l} />
            </li>
          ))}
        </ul>
        <Pager page={page} pages={pages} href={href} />
      </div>
      {lit.length > 0 && (
        <aside className="hidden chart:col-span-5 chart:block">
          <div className="sticky top-24">
            <Chart className="chart-side" lit={lit} labels={false} says={says} />
            <p className="caption-1 mt-3 text-ink-faint">
              Lit on the chart: {count(lit.length)} of these {count(listings.length)}.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
}
