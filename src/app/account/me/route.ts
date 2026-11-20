import { NextResponse } from "next/server";
import { getViewer } from "@/lib/accounts/session";

/**
 * Who is signed in, for the header and the checkout: an initial, a name and how to reach them, or nothing. The header asks only when
 * the browser holds the marker that says someone is, so a visitor who never signs in never calls
 * this. It is never cached.
 */
export async function GET() {
  const viewer = await getViewer();
  const name = viewer?.name || viewer?.email || "";
  // Their own details only: the checkout fills its fields from them.
  const body = viewer ? { in: true, name, initial: (Array.from(name.trim())[0] ?? "").toUpperCase(), role: viewer.role, given: viewer.name, email: viewer.email, phone: viewer.phone } : { in: false };
  return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
