import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { getViewer } from "@/lib/accounts/session";
import { leads, leadsCsv } from "@/lib/leads";

/**
 * The list of listings with no website, as a file. For admins only: anyone else, signed in or
 * not, is told there is nothing here. With accounts off there are no admins, so there is no file.
 */
export async function GET(request: NextRequest) {
  const viewer = accountsOn ? await getViewer() : null;
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "superadmin")) notFound();
  const params = request.nextUrl.searchParams;
  const town = params.get("town")?.slice(0, 80) || undefined;
  const group = params.get("group")?.slice(0, 40) || undefined;
  const rows = leads({ town, group, reachable: params.get("reach") === "1" });
  const name = ["no-website", town, group, params.get("reach") === "1" ? "with-telephone" : ""].filter(Boolean).join("-").replace(/[^a-z0-9-]/g, "");
  return new Response(leadsCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
  });
}
