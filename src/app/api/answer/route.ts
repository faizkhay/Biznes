import type { NextRequest } from "next/server";
import { AI } from "@/data/ai";
import { aiAnswer } from "@/lib/ai/answer";

/** The model is given eight seconds; the endpoint a little more. */
export const maxDuration = 15;

/**
 * The AI answer to a question: `/api/answer?q=...`. The results page asks it after the page is
 * drawn, so no page waits on the model, and nothing that reads a page without running its script
 * (a search engine's crawler, an AI's) ever causes the model to be asked.
 *
 * It answers `{ answer: { text, sources } }`, or `{ answer: null, why }`. An answer, and the
 * finding that there is none, may be kept by the host's own cache for a day, so the same address
 * asked again is not even run. A refusal (no key, a limit, Google saying no) is never kept.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, AI.maxQuestion + 1);
  const connection = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local").slice(0, 64);
  const result = await aiAnswer(q, connection);
  const settled = result.answer !== null || result.why === "gate" || result.why === "none" || result.why === "unsupported";
  return Response.json(result, { status: result.why === "limit" || result.why === "cap" ? 429 : 200, headers: { "Cache-Control": settled ? "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" : "no-store" } });
}
