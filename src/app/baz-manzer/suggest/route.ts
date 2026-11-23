import type { NextRequest } from "next/server";
import { owned } from "@/lib/accounts/owned";
import { foodSuggest } from "@/lib/food";

/** A few answers for a question still being typed in Baz Manzer's own search box: pages of the section, and places to eat. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 120);
  return Response.json({ suggestions: foodSuggest(q, (await owned()).overlay) }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600", "X-Robots-Tag": "noindex" } });
}
