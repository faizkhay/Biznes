import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localAnswers, localUrl } from "./local";
import { noSender, senderFrom, type Sender } from "./sender";
import { isWriteTo, NO_SETTINGS, NO_STATUS, type EmailSettings, type EmailStatus } from "./types";

// What the email pages read: the sender the server's variables name, the settings and the counts.

/**
 * The sender as it stands now. Resend and Mailgun are connected when their variables are set. The
 * local sender, which is for the checks, is connected only while something answers at its
 * address: so one run of the checks sees the site with no sender, and then with one.
 */
export async function currentSender(): Promise<Sender> {
  const sender = senderFrom();
  if (sender.name !== "local") return sender;
  const url = localUrl(process.env.EMAIL_TEST_URL);
  return url && (await localAnswers(url)) ? sender : noSender("EMAIL_PROVIDER is local, which is for the checks, and nothing answers at EMAIL_TEST_URL, so the site sends no email.", ["EMAIL_PROVIDER"]);
}

/** The settings, as an admin reads them. Empty where the database cannot be read. */
export async function emailSettings(supabase: SupabaseClient): Promise<EmailSettings> {
  const { data } = await supabase.from("email_settings").select("from_name, from_email, reply_to, postal_address, write_to, updated_by, updated_at").limit(1).maybeSingle();
  if (!data) return NO_SETTINGS;
  return { from_name: data.from_name ?? "", from_email: data.from_email ?? "", reply_to: data.reply_to ?? "", postal_address: data.postal_address ?? "", write_to: isWriteTo(data.write_to) ? data.write_to : "confirmed_once_connected", updated_at: data.updated_by ? (data.updated_at ?? "") : "" };
}

/** The counts, in one answer from the database. Null where it cannot be read: a database from before part 14 has no such function. */
export async function emailStatus(supabase: SupabaseClient): Promise<EmailStatus | null> {
  const { data, error } = await supabase.rpc("email_status");
  if (error || !data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const n = (k: keyof EmailStatus) => (typeof o[k] === "number" ? (o[k] as number) : 0);
  return { ...NO_STATUS, subscribers: n("subscribers"), confirmed: n("confirmed"), guide: n("guide"), magazine: n("magazine"), suppressed: n("suppressed"), to_ask: n("to_ask"), proof: o.proof === true };
}

/** What is still to set before the site itself may send, in words; empty when nothing is. */
export function notYet(settings: EmailSettings): string[] {
  return [settings.postal_address ? "" : "the sender's postal address", settings.from_name ? "" : "the name a message comes from", settings.from_email ? "" : "the address a message comes from"].filter(Boolean);
}
