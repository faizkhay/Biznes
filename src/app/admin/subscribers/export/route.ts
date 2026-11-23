import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { csv } from "@/lib/accounts/email/csv";
import { leavePage } from "@/lib/accounts/email/message";
import { SUPPRESSION_NAMES, type SuppressionReason } from "@/lib/accounts/email/types";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { mauritiusToday, type Subscriber } from "@/lib/accounts/types";

const HEAD = ["Email address", "Pocket guide", "Magazine", "Joined", "Confirmed", "Not written to", "Link to leave the list"];

/**
 * The list of subscribers, as a file a spreadsheet or a mail service opens. For admins only:
 * anyone else, signed in or not, is told there is nothing here. The database gives the list to an
 * admin and to nobody else whatever is asked here. `?want=guide` or `?want=magazine` narrows it.
 * Each row says whether the address is confirmed and whether it is kept from being written to
 * (and why), and carries the person's own link to leave the list.
 */
export async function GET(request: NextRequest) {
  const viewer = accountsOn ? await getViewer() : null;
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "superadmin")) notFound();
  const want = request.nextUrl.searchParams.get("want");
  const supabase = await db();
  const rows: Subscriber[] = [];
  // In pages of a thousand, the most the API gives at once.
  for (let from = 0; from < 100_000; from += 1000) {
    let page = supabase.from("subscribers").select("email, wants_guide, wants_magazine, token, confirmed_at, created_at").order("created_at").order("id").range(from, from + 999);
    if (want === "guide") page = page.eq("wants_guide", true);
    if (want === "magazine") page = page.eq("wants_magazine", true);
    const { data, error } = await page;
    if (error) return new Response("The list could not be read just now. Try again in a moment.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });
    rows.push(...((data ?? []) as Subscriber[]));
    if (!data || data.length < 1000) break;
  }
  // The addresses that are not written to, with the reason, to say so on each row.
  const kept = new Map<string, SuppressionReason>();
  for (let from = 0; from < 100_000; from += 1000) {
    const { data } = await supabase.from("email_suppressions").select("email, reason").order("email").range(from, from + 999);
    for (const row of data ?? []) kept.set(row.email as string, row.reason as SuppressionReason);
    if (!data || data.length < 1000) break;
  }
  const lines = rows.map((s) => [s.email, s.wants_guide ? "yes" : "", s.wants_magazine ? "yes" : "", s.created_at.slice(0, 10), s.confirmed_at ? s.confirmed_at.slice(0, 10) : "", kept.has(s.email) ? (SUPPRESSION_NAMES[kept.get(s.email)!] ?? "yes") : "", leavePage(s.token)]);
  const name = ["subscribers", want === "guide" || want === "magazine" ? want : "", mauritiusToday()].filter(Boolean).join("-");
  return new Response(csv(HEAD, lines), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
