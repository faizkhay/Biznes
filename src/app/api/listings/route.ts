import { NextResponse } from "next/server";
import { index, whereOf } from "@/lib/index";

/**
 * The listings behind a shortlist: given their ids, what a row needs to show each one. The
 * shortlist itself is in the visitor's browser; this only looks the ids up, and keeps nothing.
 */
export function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 200);
  const { byId, categoryById } = index();
  const listings = ids
    .map((id) => byId.get(id))
    .filter((l) => l != null)
    .map((l) => {
      const category = categoryById.get(l.cat);
      return { id: l.id, slug: l.slug, name: l.name, group: category?.group, what: [l.kind && category?.id !== "companies" ? `${category?.one}, ${l.kind}` : (l.kind ?? category?.one), whereOf(l)].filter(Boolean).join(" · "), phone: l.phone?.[0], web: l.web };
    });
  return NextResponse.json({ listings }, { headers: { "Cache-Control": "private, max-age=60", "X-Robots-Tag": "noindex" } });
}
