import type { ReactNode } from "react";
import Chart from "./Chart";
import MapSwitch from "./MapSwitch";

/**
 * The island beside a list, drawn once for both sizes of screen. Under the chart's breakpoint it
 * is a small strip that comes after the list, with its count beside it; from there up it is the
 * tall chart that stays in view while the list scrolls. It is one drawing because the island is
 * the heaviest thing on a page of results, and a second copy for the other size was sent to every
 * visitor to be hidden.
 */
export default function IslandBeside({
  lit,
  says,
  onChart,
  className = "mt-10 chart:col-span-5 chart:mt-0",
  children,
}: {
  /** The points to light, by their place among the island's points. */
  lit: number[];
  says: string;
  /** How many of the list are on the island, in words. */
  onChart: string;
  className?: string;
  /** What else stays in view with the island, under it. */
  children?: ReactNode;
}) {
  return (
    <aside className={className}>
      <div className="chart:sticky chart:top-24">
        {lit.length > 0 && (
          <MapSwitch lit={lit}>
            <div className="flex items-center gap-4 chart:block">
              <Chart className="chart-fit" lit={lit} zoom says={says} />
              <p className="caption-1 text-ink-faint chart:mt-3">
                {onChart}
                <span className="hidden chart:inline"> Point at a row to see where it is.</span>
              </p>
            </div>
          </MapSwitch>
        )}
        {children}
      </div>
    </aside>
  );
}
