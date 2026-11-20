import { chartPoints } from "@/lib/chart";
import { index } from "@/lib/index";

export const dynamic = "force-static";

/**
 * Every listing that has a place, for the street map: where it is, its name, its id and its kind.
 * In the same order as /points.json, so a position in one is the same listing in the other. It is
 * asked for only when a visitor opens the street map. Everything in it is in the open index
 * already (/data/listings.json); this is the part of it a map needs.
 */
export function GET() {
  const { listings, categoryById } = index();
  const { at } = chartPoints();
  const kinds: string[] = [];
  const kindOf = new Map<string, number>();
  const points = listings
    .filter((l) => at.has(l.id))
    .map((l) => {
      const kind = categoryById.get(l.cat)?.one ?? "";
      if (!kindOf.has(kind)) kindOf.set(kind, kinds.push(kind) - 1);
      return [l.lon, l.lat, l.name, l.id, kindOf.get(kind)];
    });
  return Response.json({ kinds, points }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Robots-Tag": "noindex" } });
}
