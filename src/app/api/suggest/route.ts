import type { NextRequest } from "next/server";
import { suggest } from "@/lib/search";

/** A few answers for a question still being typed, and where its listings are on the chart. */
export function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  return Response.json(suggest(q), { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } });
}
