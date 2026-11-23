import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { accountsOn } from "@/lib/accounts/config";
import { csv } from "@/lib/accounts/email/csv";
import { frameOf, leavePage, messageOf } from "@/lib/accounts/email/message";
import { toDocument, toText } from "@/lib/accounts/email/render";
import { emailSettings } from "@/lib/accounts/email/store";
import { RECIPIENT_STATE_NAMES, reasonSays, type Campaign, type Recipient } from "@/lib/accounts/email/types";
import { UUID } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { mauritiusToday } from "@/lib/accounts/types";

const PRIVATE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
const busy = () => new Response("That could not be read just now. Try again in a moment.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", ...PRIVATE } });

/**
 * What an admin takes away from a campaign's page, as a file. For admins only: anyone else,
 * signed in or not, is told there is nothing here, and the database gives none of it to anyone
 * but an admin whatever is asked.
 *
 *   ?as=csv     the addresses a message sent by hand goes to today, each with its own link to
 *               leave: every address that is not kept from being written to, and, where the
 *               settings ask, only the confirmed ones
 *   ?as=html    the message as HTML, as it is sent by hand: its foot tells readers to reply to leave
 *   ?as=txt     its plain-text twin
 *   ?as=record  who it went to, once it has been sent, with how each went
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = accountsOn ? await getViewer() : null;
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "superadmin")) notFound();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const as = request.nextUrl.searchParams.get("as") ?? "csv";
  const supabase = await db();
  const { data: row } = await supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const campaign = row as Campaign;
  const name = `message-${mauritiusToday()}`;

  if (as === "html" || as === "txt") {
    const settings = await emailSettings(supabase);
    const message = messageOf(campaign);
    const frame = frameOf(campaign.audience, settings, null);
    const text = as === "html" ? toDocument(message, frame) : toText(message, frame);
    return new Response(text, { headers: { "Content-Type": `${as === "html" ? "text/html" : "text/plain"}; charset=utf-8`, "Content-Disposition": `attachment; filename="${name}.${as}"`, ...PRIVATE } });
  }

  if (as === "record") {
    const rows: Pick<Recipient, "email" | "state" | "reason" | "unsure" | "done_at">[] = [];
    // In pages of a thousand, the most the API gives at once.
    for (let from = 0; from < 200_000; from += 1000) {
      const { data, error } = await supabase.from("email_recipients").select("email, state, reason, unsure, done_at").eq("campaign_id", id).order("id").range(from, from + 999);
      if (error) return busy();
      rows.push(...((data ?? []) as typeof rows));
      if (!data || data.length < 1000) break;
    }
    return new Response(csv(["Email address", "How it went", "Why", "When"], rows.map((r) => [r.email, RECIPIENT_STATE_NAMES[r.state], reasonSays(r), r.done_at ?? ""])), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-record.csv"`, ...PRIVATE },
    });
  }

  const rows: { email: string; leave_token: string }[] = [];
  for (let from = 0; from < 200_000; from += 1000) {
    const { data, error } = await supabase.rpc("email_hand_list", { campaign: id }).range(from, from + 999);
    if (error) return busy();
    rows.push(...((data ?? []) as typeof rows));
    if (!data || data.length < 1000) break;
  }
  return new Response(csv(["Email address", "Link to leave the list"], rows.map((r) => [r.email, leavePage(r.leave_token)])), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-addresses.csv"`, ...PRIVATE },
  });
}
