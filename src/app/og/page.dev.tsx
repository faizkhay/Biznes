import Chart from "@/components/Chart";
import { site } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";

/**
 * The link preview card, as a page: the name, the line and the chart at 1200 by 630. It exists only
 * under `next dev` (its file ends .dev.tsx), where scripts/og.mjs captures it into public/og.jpg.
 * So the card is always the site's own chart, drawn from the index of the day.
 */
export default function OgCard() {
  const { meta } = index();
  return (
    <div id="og" className="flex items-center gap-12 overflow-hidden bg-paper px-16" style={{ width: 1200, height: 630 }}>
      <div className="min-w-0 flex-1">
        <p className="wordmark">
          biznes<span className="dot">.</span>mu
        </p>
        <p className="heading-1 mt-8" style={{ fontSize: "4rem" }}>
          {site.line}.
        </p>
        <p className="data-1 mt-8 text-ink-faint">
          {count(meta.listings.all)} listings · {count(meta.places)} towns and villages · {count(meta.guides)} guides
        </p>
      </div>
      <div style={{ width: 496 }}>
        <Chart labels={false} says="" />
      </div>
    </div>
  );
}
