import { CHART_W, chart, chartHalftone, chartPoints, degrees, pointOf, ringsPath } from "@/lib/chart";
import { index } from "@/lib/index";
import ChartLive from "./ChartLive";

/**
 * The chart: the island of Mauritius drawn only by what is listed on it.
 *
 * It is the site's one picture, and it is the data itself: every dot is a listing at its own place.
 * On the first screen it is the whole directory at a glance; beside a list it draws in on the
 * listings that answer and lights them; on a listing's page it marks where that one is.
 *
 * Drawn here as SVG, so it is whole without script: the coast and the districts from the open map,
 * the listings gathered into dots, and the lit ones as marks. With script a canvas draws every
 * listing as its own point over it (ChartLive), follows the question being typed on the first
 * screen, and rings the point of the row under the pointer or the keyboard. Its lettering is set
 * in the page's own type, over the drawing, so it is the same size on a phone as on a desk.
 *
 * It is a picture of what the lists beside it say in words, so it is hidden from assistive
 * technology, with one sentence saying what it shows.
 */
export default function Chart({
  lit,
  focus,
  follow = false,
  zoom = false,
  degreesShown = false,
  span = 170,
  says,
  className,
}: {
  /** Positions in chartPoints() to light. */
  lit?: number[];
  /** One listing to mark, by where it is. */
  focus?: { lon?: number; lat?: number; region?: "mauritius" | "rodrigues" | "outer" };
  /** True on the first screen: the chart lights what the search box is finding. */
  follow?: boolean;
  /** Draw in on the lit points when they lie close together, with the whole island as a small key. */
  zoom?: boolean;
  /** How wide, in the chart's own units of a thousand across, the view may be drawn in to at its closest. */
  span?: number;
  /** Letter the graticule in degrees and minutes. */
  degreesShown?: boolean;
  /** What the picture shows, in a sentence, for a visitor who cannot see it. */
  says: string;
  className?: string;
}) {
  const c = chart();
  const { geo, places } = index();
  const [faint, mid, strong] = chartHalftone();
  const { flat } = chartPoints();
  const mark = focus ? pointOf(focus) : null;

  // The view: the whole chart, or, drawn in, the smallest part of it in the chart's own shape that
  // holds every lit point with room around it.
  let view = { x: 0, y: 0, w: CHART_W, h: c.h };
  if (zoom && lit?.length) {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const i of lit) {
      x0 = Math.min(x0, flat[i * 2] / 10);
      x1 = Math.max(x1, flat[i * 2] / 10);
      y0 = Math.min(y0, flat[i * 2 + 1] / 10);
      y1 = Math.max(y1, flat[i * 2 + 1] / 10);
    }
    const w = Math.max(span, (x1 - x0) * 1.3, ((y1 - y0) * 1.3 * CHART_W) / c.h);
    if (w < CHART_W * 0.6) {
      const h = (w * c.h) / CHART_W;
      view = { w, h, x: Math.max(0, Math.min(CHART_W - w, (x0 + x1) / 2 - w / 2)), y: Math.max(0, Math.min(c.h - h, (y0 + y1) / 2 - h / 2)) };
    }
  }
  const drawnIn = view.w < CHART_W;
  const scale = view.w / CHART_W;
  const left = (x: number) => `${(((x - view.x) / view.w) * 100).toFixed(2)}%`;
  const top = (y: number) => `${(((y - view.y) / view.h) * 100).toFixed(2)}%`;
  const inView = (x: number, y: number, edge = 0.04) => x > view.x + view.w * edge && x < view.x + view.w * (1 - edge) && y > view.y + view.h * edge && y < view.y + view.h * (1 - edge);

  // The places the chart names: the largest in view, none crowding another. Drawn in, a
  // neighbourhood may be named; on the whole island, only towns.
  // A name is kept only if its lettering would not run into a name already placed. The lettering
  // is a fixed size on the screen, so its size in chart units is reckoned for a chart about 520
  // pixels wide, which is what it is beside a list and on the first screen.
  const unit = view.w / 520;
  const named: { name: string; x: number; y: number; left: boolean; box: [number, number, number, number] }[] = [];
  for (const p of [...places].filter((p) => p.lon != null && p.region === "mauritius" && (drawnIn || p.kind === "town")).sort((a, b) => b.n - a.n)) {
    if (named.length >= (drawnIn ? 7 : 9)) break;
    const [x, y] = c.main(p.lon!, p.lat!);
    if (!inView(x, y, 0.06)) continue;
    const left = (x - view.x) / view.w > 0.66;
    const wide = (p.name.length * 8.6 + 14) * unit;
    const box: [number, number, number, number] = left ? [x - wide, y - 12 * unit, x, y + 12 * unit] : [x, y - 12 * unit, x + wide, y + 12 * unit];
    if (box[0] < view.x || box[2] > view.x + view.w) continue;
    if (named.some((o) => box[0] < o.box[2] && box[2] > o.box[0] && box[1] < o.box[3] && box[3] > o.box[1])) continue;
    named.push({ name: p.name, x, y, left, box });
  }
  // Without script at most this many are lit as marks; the canvas lights them all.
  const marks = (lit ?? []).slice(0, 500);
  const lights = marks.map((i) => `M${flat[i * 2] / 10} ${flat[i * 2 + 1] / 10}h0`).join("");
  const box = c.insetBox;

  return (
    <div className={["chart", className].filter(Boolean).join(" ")} role="img" aria-label={says}>
      <svg viewBox={`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`} aria-hidden focusable="false">
        {c.meridians.map((lon) => {
          const [x] = c.main(lon, 0);
          return <path key={`m${lon}`} className="chart-grid" d={`M${x.toFixed(1)} 0V${c.h}`} />;
        })}
        {c.parallels.map((lat) => {
          const [, y] = c.main(0, lat);
          return <path key={`p${lat}`} className="chart-grid" d={`M0 ${y.toFixed(1)}H${CHART_W}`} />;
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

        <path className="chart-dots" d={faint} strokeWidth={2.4 * scale} opacity={0.42} />
        <path className="chart-dots" d={mid} strokeWidth={3.8 * scale} opacity={0.66} />
        <path className="chart-dots" d={strong} strokeWidth={5.4 * scale} opacity={0.92} />

        {/* The lit points, as the gathered dots are drawn: one path of strokes with no length, which a
            round cap draws as dots. Three of them make a point: its soft light, its ring of ink and
            its saffron. A list of a thousand answers is then a few lines of the page, not two
            thousand shapes. */}
        {marks.length > 0 && (
          <>
            <path className="chart-halo" d={lights} strokeWidth={18 * scale} />
            <path className="chart-lit chart-lit-ring" d={lights} strokeWidth={6.8 * scale + 2.5 * unit} />
            <path className="chart-lit chart-lit-point" d={lights} strokeWidth={6.8 * scale} />
          </>
        )}
      </svg>

      <ChartLive lit={lit} follow={follow} focus={mark ?? undefined} view={[view.x, view.y, view.w, view.h]} />

      {/* What must stay readable over the points: the mark, then the lettering, in the page's own type. */}
      {mark && (
        <svg viewBox={`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`} aria-hidden focusable="false" className="chart-over">
          <path className="chart-tick" d={`M${mark[0].toFixed(1)} 0V${(mark[1] - 22).toFixed(1)}M${mark[0].toFixed(1)} ${(mark[1] + 22).toFixed(1)}V${c.h}M0 ${mark[1].toFixed(1)}H${(mark[0] - 22).toFixed(1)}M${(mark[0] + 22).toFixed(1)} ${mark[1].toFixed(1)}H${CHART_W}`} />
          <circle cx={mark[0]} cy={mark[1]} r={22 * scale} fill="color-mix(in srgb, var(--palette-saffron) 30%, transparent)" stroke="var(--palette-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          <circle cx={mark[0]} cy={mark[1]} r={6 * scale} fill="var(--palette-saffron)" stroke="var(--palette-ink)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <div className="chart-letters" aria-hidden>
        {degreesShown &&
          c.meridians.slice(0, -1).map((lon) => (
            <span key={`m${lon}`} className="chart-degree label-1" style={{ left: left(c.main(lon, 0)[0]), top: 0 }}>
              {degrees(lon, "lon")}
            </span>
          ))}
        {degreesShown &&
          c.parallels.slice(0, -1).map((lat) => (
            <span key={`p${lat}`} className="chart-degree chart-degree-side label-1" style={{ left: 0, top: top(c.main(0, lat)[1]) }}>
              {degrees(lat, "lat")}
            </span>
          ))}
        {named.map((t) => (
          <span key={t.name} className={`chart-town label-1 ${t.left ? "chart-town-left" : ""}`} style={{ left: left(t.x), top: top(t.y) }}>
            {t.name}
          </span>
        ))}
        {!drawnIn && (
          <span className="chart-town chart-town-left label-1 text-ink-faint" style={{ left: left(box.x + box.w), top: top(box.y - 12) }}>
            Rodrigues, {c.apartKm} km east
          </span>
        )}
      </div>

      {/* Drawn in, a small key shows which part of the island this is. */}
      {drawnIn && (
        <svg viewBox={`0 0 ${CHART_W} ${c.h}`} aria-hidden focusable="false" className="chart-key">
          <path className="chart-coast" d={ringsPath([geo.mauritius.coast[0]], c.main)} />
          <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="color-mix(in srgb, var(--palette-saffron) 45%, transparent)" stroke="var(--palette-ink)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}
