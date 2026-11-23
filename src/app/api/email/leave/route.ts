import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { UUID } from "@/lib/accounts/form";
import { tooMany } from "@/lib/accounts/limit";
import { publicDb } from "@/lib/accounts/server";

// Leaving the list in one press, as mail programs ask for it (RFC 8058). Every message to the
// list carries two headers:
//
//   List-Unsubscribe: <https://the-site/api/email/leave?token=...>
//   List-Unsubscribe-Post: List-Unsubscribe=One-Click
//
// A mail program that shows its own "Unsubscribe" beside the message posts to that address when
// its reader presses it: a POST whose body says List-Unsubscribe=One-Click, with no cookie and no
// page in between. The token in the address is the only key, as on the page a reader's own link
// opens (/unsubscribe), and it takes off its own address and no other. The body is not asked
// for: whoever holds the token may already leave by the page, and a mail program that posts
// without it should not leave its reader on the list.
//
// The answer is the same whether the token was anyone's or not, so the address tells nothing
// about tokens. A plain visit (a GET) takes nobody off: it leads to the page with its one button,
// because a mail service that only looks at links must not be the one to leave for its reader.

const PLAIN = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function POST(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  if (!accountsOn) return new Response("The list has not opened yet, so there is nothing to leave.\n", { status: 404, headers: PLAIN });
  if (!UUID.test(token)) return new Response("That link is not whole.\n", { status: 400, headers: PLAIN });
  if (await tooMany("leave", 120)) return new Response("Too many tries from this connection. Try again in a few minutes.\n", { status: 429, headers: PLAIN });
  const { error } = await publicDb().rpc("unsubscribe", { leave_token: token });
  if (error) {
    if (error.code === "42501") console.error("[accounts] the database refused a call from the site: BIZNES_SITE_PROOF is not set, or is not the word whose hash is kept in private.site_proof (supabase/migrations, part 11).");
    // The mail program may try again: nobody was taken off.
    return new Response("That could not be done just now.\n", { status: 503, headers: PLAIN });
  }
  revalidatePath("/admin/subscribers");
  return new Response("You are off the list. Nothing more will be sent to you.\n", { status: 200, headers: PLAIN });
}

export function GET(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  const to = new URL("/unsubscribe", request.nextUrl.origin);
  if (UUID.test(token)) to.searchParams.set("token", token);
  return NextResponse.redirect(to, { status: 303, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
