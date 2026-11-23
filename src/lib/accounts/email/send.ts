import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Outcome, Sender } from "./letter";
import { confirmMessage, drawCampaign, frameOf, lettersFor, listHeaders } from "./message";
import { personal, toDocument, toText } from "./render";
import { batchSize, fromLine } from "./sender";
import { soundProgress, type Campaign, type EmailSettings, type Progress } from "./types";

// Sending, a batch at a time. The database hands out the next addresses (email_claim), the
// sender hands each its message, and the database is told how each went (email_mark). An address
// is handed out once: a batch that is taken and never answered for is closed by the database as
// unsure, and is not tried again.

type Claimed = { id: number; email: string; leave_token: string; confirm_token: string | null; claim: string };

export type BatchResult = { progress: Progress; /** How many of this batch went. */ went: number; /** What the mail service said of the ones that did not. */ refused: string[]; error?: string };

/** Take the next batch of a campaign that is being sent, hand it over, and say how it went. */
export async function sendNextBatch(supabase: SupabaseClient, campaign: Campaign, settings: EmailSettings, sender: Sender): Promise<BatchResult> {
  const progress = async () => soundProgress((await supabase.rpc("email_progress", { campaign: campaign.id })).data);
  const { data, error } = await supabase.rpc("email_claim", { campaign: campaign.id, most: batchSize() });
  if (error) return { progress: await progress(), went: 0, refused: [], error: error.hint === "email_step" || error.hint === "missing" ? error.message : "The next batch could not be taken just now. Nothing was sent. Try again in a moment." };
  const rows = (data ?? []) as Claimed[];
  if (rows.length === 0) return { progress: await progress(), went: 0, refused: [] };

  const letters = lettersFor(drawCampaign(campaign, settings), rows);
  const outcomes = await sender.send({ from: fromLine(settings.from_name, settings.from_email), replyTo: settings.reply_to || undefined, key: rows[0].claim }, letters);
  const results = outcomes.map((o) => (o.ok ? { id: o.ref, ok: true, ref: o.id } : { id: o.ref, ok: false, why: o.why, unsure: o.unsure }));
  const marked = await supabase.rpc("email_mark", { campaign: campaign.id, claim: rows[0].claim, results });
  const refused = [...new Set(outcomes.filter((o): o is Extract<Outcome, { ok: false }> => !o.ok).map((o) => o.why))];
  // The batch went and the record could not be written: the database closes it as unsure by itself.
  if (marked.error) return { progress: await progress(), went: outcomes.filter((o) => o.ok).length, refused, error: "The batch was handed over, but how it went could not be written down. Those addresses are marked as unsure and are not written to again." };
  return { progress: soundProgress(marked.data), went: outcomes.filter((o) => o.ok).length, refused };
}

/** One message of a campaign to one address, with a link to leave that leads nowhere: for looking at it in a real inbox. */
export async function sendTest(campaign: Campaign, settings: EmailSettings, sender: Sender, to: string): Promise<Outcome> {
  const [letter] = lettersFor(drawCampaign(campaign, settings), [{ id: 0, email: to, leave_token: "a-test-message", confirm_token: "a-test-message" }], "[Test] ");
  const [outcome] = await sender.send({ from: fromLine(settings.from_name, settings.from_email), replyTo: settings.reply_to || undefined, key: `test-${campaign.id}-${Date.now()}` }, [letter]);
  return outcome ?? { ref: 0, ok: false, why: "The sender gave no answer.", unsure: true };
}

/** The message that asks one address to confirm, as it joins. What it is sent with comes from the database along with the link. */
export async function sendConfirmation(sender: Sender, to: string, handed: { confirm: string; leave: string; from_name: string; from_email: string; reply_to: string; postal_address: string }): Promise<Outcome> {
  const message = confirmMessage();
  const frame = frameOf("unconfirmed", handed, handed.leave);
  const tokens = { leave: handed.leave, confirm: handed.confirm };
  const letter = { ref: 0, to, subject: message.subject, html: personal(toDocument(message, frame), tokens), text: personal(toText(message, frame), tokens), headers: listHeaders(handed.leave) };
  const [outcome] = await sender.send({ from: fromLine(handed.from_name, handed.from_email), replyTo: handed.reply_to || undefined, key: `confirm-${handed.confirm}-${new Date().toISOString().slice(0, 10)}` }, [letter]);
  return outcome ?? { ref: 0, ok: false, why: "The sender gave no answer.", unsure: true };
}
