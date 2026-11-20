import { NextResponse } from "next/server";
import { getViewer } from "@/lib/accounts/session";

/**
 * Who is signed in, for the header: an initial and a name, or nothing. The header asks only when
 * the browser holds the marker that says someone is, so a visitor who never signs in never calls
 * this. It is never cached.
 */
export async function GET() {
  const viewer = await getViewer();
  const name = viewer?.name || viewer?.email || "";
  const body = viewer ? { in: true, name, initial: (Array.from(name.trim())[0] ?? "").toUpperCase(), role: viewer.role } : { in: false };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
