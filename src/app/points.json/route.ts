import { chartPoints } from "@/lib/chart";

export const dynamic = "force-static";

/** Every listing's point on the chart, for the canvas: [x0, y0, x1, y1, ...] in tenths of a chart unit. */
export function GET() {
  return Response.json(chartPoints().flat, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
