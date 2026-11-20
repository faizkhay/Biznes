import { CHART_W, chart, chartHalftone, chartPoints, degrees, pointOf, ringsPath } from "@/lib/chart";
import { index } from "@/lib/index";
import ChartLive from "./ChartLive";

/**
 * The chart: the island of Mauritius drawn only by what is listed on it.
 *
 * It is the site's one picture, and it is the data itself: every dot is a listing at its own place.
 * On the first screen it is the whole directory at a glance; beside a search it lights the listings
 * that answer; on a listing's page it marks where that one is.
 *
 * Drawn here as SVG, so it is whole without script: the coast and the districts from the open map,
 * the listings gathered into dots, and the lit ones as marks. With script a canvas draws every
 * listing as its own point over it (ChartLive), and on the first screen follows the question being
 * typed. It is a picture of what the lists beside it say in words, so it is hidden from assistive
 * technology, with one sentence saying what it shows.
 */
export default function Chart({
  lit,
  focus,
  follow = false,
  labels = true,
  says,
  className,
}: {
  /** Positions in chartPoints() to light. */
  lit?: number[];
  /** One listing to mark, by where it is. */
  focus?: { lon?: number; lat?: number; region?: "mauritius" | "rodrigues" | "outer" };
  /** True on the first screen: the chart lights what the search box is finding. */
  follow?: boolean;
  labels?: boolean;
  /** What the picture shows, in a sentence, for a visitor who cannot see it. */
  says: string;
  className?: string;
}) {
  const c = chart();
  const { geo, places } = index();
  const [faint, mid, strong] = chartHalftone();
  const { flat } = chartPoints();
  const mark = focus ? pointOf(focus) : null;

  // The towns the chart names: the largest by listings, none closer than 90 units to another.
  const named: { name: string; x: number; y: number }[] = [];
  if (labels) {
    for (const p of [...places].filter((p) => p.kind === "town" && p.lon != null && p.region === "mauritius").sort((a, b) => b.n - a.n)) {
      if (named.length >= 9) break;
      const [x, y] = c.main(p.lon!, p.lat!);
      if (named.every((o) => Math.hypot(o.x - x, o.y - y) > 96)) named.push({ name: p.name, x, y });
    }
  }
  // Without script at most this many are lit as marks; the canvas lights them all.
  const marks = (lit ?? []).slice(0, 500);
  const box = c.insetBox;

  return (
    <div className={["chart", className].filter(Boolean).join(" ")} role="img" aria-label={says}>
      <svg viewBox={`0 0 ${CHART_W} ${c.h}`} aria-hidden focusable="false">
        {c.meridians.map((lon) => {
          const [x] = c.main(lon, 0);
          return <path key={`m${lon}`} className="chart-grid" d={`M${x.toFixed(1)} 0V${c.h}`} />;
        })}
        {c.parallels.map((lat) => {
          const [, y] = c.main(0, lat);
          return <path key={`p${lat}`} className="chart-grid" d={`M0 ${y.toFixed(1)}H${CHART_W}`} />;
        })}
        {labels &&
          c.meridians.map((lon) => {
            const [x] = c.main(lon, 0);
            return (
              <text key={`ml${lon}`} className="chart-label" x={x + 6} y={20}>
                {degrees(lon, "lon")}
              </text>
            );
          })}
        {labels &&
          c.parallels.slice(0, -1).map((lat) => {
            const [, y] = c.main(0, lat);
            return (
              <text key={`pl${lat}`} className="chart-label" x={6} y={y - 7}>
                {degrees(lat, "lat")}
              </text>
            );
          })}

        <path className="chart-coast" d={ringsPath(geo.mauritius.coast, c.main)} />
        {geo.districts
          .filter((d) => d.slug !== "rodrigues")
          .map((d) => (
            <path key={d.slug} className="chart-district" d={ringsPath(d.rings, c.main)} />
          ))}

        {/* Rodrigues, in an inset, as an atlas shows an island that lies off the sheet. */}
        <rect className="chart-frame" x={box.x} y={box.y} width={box.w} height={box.h} />
        <path className="chart-coast" d={ringsPath(geo.rodrigues.coast, c.inset)} />
        {labels && (
          <text className="chart-label" x={box.x + box.w} y={box.y - 9} textAnchor="end">
            Rodrigues, {c.apartKm} km east
          </text>
        )}

        <path className="chart-dots" d={faint} strokeWidth={2.4} opacity={0.42} />
        <path className="chart-dots" d={mid} strokeWidth={3.8} opacity={0.66} />
        <path className="chart-dots" d={strong} strokeWidth={5.4} opacity={0.92} />

        {marks.map((i) => (
          <circle key={`h${i}`} className="chart-halo" cx={flat[i * 2] / 10} cy={flat[i * 2 + 1] / 10} r={9} />
        ))}
        {marks.map((i) => (
          <circle key={`l${i}`} className="chart-lit" cx={flat[i * 2] / 10} cy={flat[i * 2 + 1] / 10} r={3.4} />
        ))}

      </svg>
      <ChartLive height={c.h} lit={lit} follow={follow} focus={mark ?? undefined} />
      {/* What must stay readable over the points: the towns' names and the mark. */}
      <svg viewBox={`0 0 ${CHART_W} ${c.h}`} aria-hidden focusable="false" className="chart-over">
        {named.map((t) => {
          const left = t.x > 720;
          return (
            <text key={t.name} className="chart-label chart-label-strong" x={t.x + (left ? -12 : 12)} y={t.y + 5} textAnchor={left ? "end" : "start"} paintOrder="stroke" stroke="var(--palette-night)" strokeWidth={5} strokeLinejoin="round">
              {t.name}
            </text>
          );
        })}

        {mark && (
          <g>
            <path className="chart-tick" d={`M${mark[0].toFixed(1)} 0V${(mark[1] - 22).toFixed(1)}M${mark[0].toFixed(1)} ${(mark[1] + 22).toFixed(1)}V${c.h}M0 ${mark[1].toFixed(1)}H${(mark[0] - 22).toFixed(1)}M${(mark[0] + 22).toFixed(1)} ${mark[1].toFixed(1)}H${CHART_W}`} />
            <circle cx={mark[0]} cy={mark[1]} r={22} fill="none" stroke="var(--palette-saffron)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <circle cx={mark[0]} cy={mark[1]} r={5} fill="var(--palette-saffron)" />
          </g>
        )}
      </svg>
    </div>
  );
}
