import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The index, to download. It is derived from OpenStreetMap, whose licence asks that what is derived
 * from the map stays open to anyone: so here it is, as the crawler wrote it.
 */
const FILES = ["listings.json", "places.json", "categories.json", "districts.json", "geo.json", "sites.json", "meta.json"];

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => FILES.map((file) => ({ file }));

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!FILES.includes(file)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(join(process.cwd(), "data", "index", file)), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="biznes-mu-${file}"` },
  });
}
