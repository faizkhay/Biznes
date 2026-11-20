import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { mauritiusToday, type Subscriber } from "@/lib/accounts/types";
import { siteUrl } from "@/lib/site-url";

const HEAD = ["Email address", "Pocket guide", "Magazine", "Joined", "Link to leave the list"];

const cell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  // A cell that begins like a formula is kept as text, so a spreadsheet does not run it.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/**
 * The list of subscribers, as a file a spreadsheet or a mail service opens. For admins only:
 * anyone else, signed in or not, is told there is nothing here. The database gives the list to an
 * admin and to nobody else whatever is asked here. `?want=guide` or `?want=magazine` narrows it.
 * Each row carries the person's own link to leave the list.
 */
export async function GET(request: NextRequest) {
  const viewer = accountsOn ? await getViewer() : null;
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "superadmin")) notFound();
  const want = request.nextUrl.searchParams.get("want");
  const supabase = await db();
  const rows: Subscriber[] = [];
  // In pages of a thousand, the most the API gives at once.
  for (let from = 0; from < 100_000; from += 1000) {
    let page = supabase.from("subscribers").select("email, wants_guide, wants_magazine, token, created_at").order("created_at").order("id").range(from, from + 999);
    if (want === "guide") page = page.eq("wants_guide", true);
    if (want === "magazine") page = page.eq("wants_magazine", true);
    const { data, error } = await page;
    if (error) return new Response("The list could not be read just now. Try again in a moment.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });
    rows.push(...((data ?? []) as Subscriber[]));
    if (!data || data.length < 1000) break;
  }
  const lines = rows.map((s) => [s.email, s.wants_guide ? "yes" : "", s.wants_magazine ? "yes" : "", s.created_at.slice(0, 10), `${siteUrl}/unsubscribe?token=${s.token}`].map(cell).join(","));
  const name = ["subscribers", want === "guide" || want === "magazine" ? want : "", mauritiusToday()].filter(Boolean).join("-");
  // The byte order mark is what Excel needs to read accents.
  return new Response(`﻿${HEAD.join(",")}\n${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
