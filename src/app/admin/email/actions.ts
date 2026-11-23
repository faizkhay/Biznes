"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountsOn } from "@/lib/accounts/config";
import { editions, guideDraft, guideFacts } from "@/lib/accounts/email/guide";
import { sendNextBatch, sendTest } from "@/lib/accounts/email/send";
import { currentSender, emailSettings, notYet } from "@/lib/accounts/email/store";
import { BLOCK_LIMITS, BLOCK_MOST, blockProblem, emptyBlock, isAudience, isBlockType, isWritableKind, isWriteTo, NO_PROGRESS, soundBlocks, type Block, type Campaign, type Progress } from "@/lib/accounts/email/types";
import { EMAIL, field, SOON, TRY_AGAIN, UUID, type FormState } from "@/lib/accounts/form";
import { tooMany } from "@/lib/accounts/limit";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import type { Viewer } from "@/lib/accounts/types";

// What an admin does with the site's own email. As with the other admin work, each action reads
// who is asking again and refuses anyone who is not an admin, then calls a function in the
// database that checks the same for itself and writes what was done on the record
// (supabase/migrations, part 14). The check here is for a plain answer; the database's holds.

const NOT_ADMIN = "Only an admin can do that.";
const NOT_SUPERADMIN = "Only the superadmin can do that.";
/** The refusals the database words itself, which can be shown as they are. */
const SAID_BY_THE_DATABASE = new Set(["missing", "too_many", "email_step", "email_postal", "email_from", "email_nobody", "email_subject", "email_empty", "email_blocks", "email_address"]);

type Refusal = { message: string; hint?: string | null } | null;
const says = (error: Refusal) => (error?.hint && SAID_BY_THE_DATABASE.has(error.hint) ? error.message : error?.hint === "forbidden" ? NOT_ADMIN : TRY_AGAIN);

async function asAdmin(): Promise<Viewer | null> {
  const viewer = accountsOn ? await getViewer() : null;
  return viewer && (viewer.role === "admin" || viewer.role === "superadmin") ? viewer : null;
}

const pageOf = (campaign: string) => `/admin/email/${campaign}`;

/** Begin a message: a note, the magazine's, or the guide's with nothing filled in. It opens as a draft. */
export async function startCampaign(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const kind = field(data, "kind", 12);
  if (!isWritableKind(kind)) return { errors: { kind: "Say what the message is for." } };
  const supabase = await db();
  const { data: made, error } = await supabase.rpc("email_campaign_create", { kind, audience: kind === "note" ? "everyone" : kind });
  if (error || typeof made !== "string") return { message: says(error) };
  revalidatePath("/admin/email");
  redirect(pageOf(made));
}

/** Begin the Pocket Guide's message for an edition, with what the site already knows filled in. */
export async function startGuide(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const offered = editions();
  if (!offered) return { message: "The guide has not been made yet, so there is nothing to announce. Make an edition first (npm run pdf)." };
  const edition = field(data, "edition", 7) || offered.coming;
  if (!offered.all.includes(edition)) return { errors: { edition: "Choose one of the editions." } };
  const facts = await guideFacts(edition);
  if (!facts) return { message: TRY_AGAIN };
  const draft = guideDraft(facts);
  const supabase = await db();
  const { data: made, error } = await supabase.rpc("email_campaign_create", { kind: "guide", audience: "guide", subject: draft.subject, preheader: draft.preheader, blocks: draft.blocks, edition });
  if (error || typeof made !== "string") return { message: says(error) };
  revalidatePath("/admin/email");
  redirect(pageOf(made));
}

/** The blocks as the form holds them: `count` of them, each under b0, b1 and so on. */
function typedBlocks(data: FormData): Block[] {
  const n = Math.min(Number(field(data, "count", 3)) || 0, BLOCK_MOST);
  const blocks: Block[] = [];
  for (let i = 0; i < n; i++) {
    const type = field(data, `b${i}.type`, 12);
    if (!isBlockType(type)) continue;
    // A paragraph keeps its line breaks, and loses any other mark that is not a letter.
    const raw = data.get(`b${i}.text`);
    const paragraph = typeof raw === "string" ? raw.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").trim().slice(0, BLOCK_LIMITS.paragraph) : "";
    if (type === "heading") blocks.push({ type, text: field(data, `b${i}.text`, BLOCK_LIMITS.heading).replace(/\s+/g, " ") });
    else if (type === "paragraph") blocks.push({ type, text: paragraph });
    else if (type === "button") blocks.push({ type, label: field(data, `b${i}.label`, BLOCK_LIMITS.label).replace(/\s+/g, " "), href: field(data, `b${i}.href`, BLOCK_LIMITS.href) });
    else blocks.push({ type });
  }
  return blocks;
}

/** What was typed, to hand back to the form so nothing is lost. */
function typedValues(audience: string, subject: string, preheader: string, blocks: Block[]): Record<string, string> {
  const values: Record<string, string> = { audience, subject, preheader };
  blocks.forEach((b, i) => {
    if (b.type === "heading" || b.type === "paragraph") values[`b${i}.text`] = b.text;
    if (b.type === "button") Object.assign(values, { [`b${i}.label`]: b.label, [`b${i}.href`]: b.href });
  });
  return values;
}

/**
 * Save a draft: who it goes to, its subject, the line after it, and its blocks. The same form adds
 * a block, moves one up or down and takes one out (`do`), saving what was typed as it does, so
 * nothing is lost and nothing needs a script.
 */
export async function saveCampaign(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign)) return { message: TRY_AGAIN };
  const audience = field(data, "audience", 12);
  const subject = field(data, "subject", BLOCK_LIMITS.subject).replace(/\s+/g, " ");
  const preheader = field(data, "preheader", BLOCK_LIMITS.preheader).replace(/\s+/g, " ");
  const typed = typedBlocks(data);
  // What was typed is judged before anything is moved, so each word of an answer is beside its own field.
  const errors: Record<string, string> = {};
  if (!isAudience(audience)) errors.audience = "Say who the message goes to.";
  typed.forEach((b, i) => {
    const wrong = blockProblem(b, false);
    if (wrong) errors[`b${i}.${wrong.field}`] = wrong.says;
  });
  if (Object.keys(errors).length) return { errors, values: typedValues(audience, subject, preheader, typed) };

  let blocks = typed;
  const [op, arg] = field(data, "do", 20).split(":");
  const at = Number(arg);
  let said = "Saved.";
  if (op === "add" && isBlockType(arg)) {
    if (blocks.length >= BLOCK_MOST) return { message: `A message holds ${BLOCK_MOST} parts at most. Take one out first.`, values: typedValues(audience, subject, preheader, typed) };
    blocks = [...blocks, emptyBlock(arg)];
    said = arg === "line" ? "A line is added at the end." : "Added at the end. Fill it in, then save.";
  } else if (op === "remove" && Number.isInteger(at) && blocks[at]) {
    blocks = blocks.filter((_b, i) => i !== at);
    said = "Taken out.";
  } else if ((op === "up" || op === "down") && Number.isInteger(at) && blocks[at]) {
    const to = op === "up" ? at - 1 : at + 1;
    if (blocks[to]) {
      blocks = blocks.map((b, i) => (i === at ? blocks[to] : i === to ? blocks[at] : b));
      said = op === "up" ? "Moved up." : "Moved down.";
    }
  }
  const supabase = await db();
  const { error } = await supabase.rpc("email_campaign_save", { campaign, audience, subject, preheader, blocks });
  if (error) return { message: says(error), values: typedValues(audience, subject, preheader, typed) };
  revalidatePath(pageOf(campaign));
  revalidatePath("/admin/email");
  return { ok: true, message: said };
}

/** Move a message between draft, ready and cancelled. */
export async function stepCampaign(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  const to = field(data, "to", 12);
  if (!UUID.test(campaign) || !["draft", "ready", "cancelled"].includes(to)) return { message: TRY_AGAIN };
  const supabase = await db();
  if (to === "ready") {
    // Said part by part, in words, before the database is asked: it would only say that something is missing.
    const { data: row } = await supabase.from("email_campaigns").select("blocks").eq("id", campaign).maybeSingle();
    const blocks = soundBlocks(row?.blocks);
    const at = blocks.findIndex((b) => blockProblem(b, true));
    if (at >= 0) return { message: `Part ${at + 1} of the message is not finished: ${blockProblem(blocks[at], true)?.says} Then save, and call it ready.` };
  }
  const { error } = await supabase.rpc("email_campaign_step", { campaign, new_status: to });
  if (error) return { message: says(error) };
  revalidatePath(pageOf(campaign));
  revalidatePath("/admin/email");
  return { ok: true, message: to === "ready" ? "It is ready. Look at it once more below, then send it." : to === "draft" ? "It is a draft again, and can be changed." : "Cancelled. Nobody who was still waiting is written to." };
}

/** Take out for good a message that was never sent. */
export async function removeCampaign(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("email_campaign_remove", { campaign });
  if (error) return { message: says(error) };
  revalidatePath("/admin/email");
  redirect("/admin/email?said=removed");
}

/** "Send": write one row for each address, and go on to the page that sends them a batch at a time. */
export async function queueCampaign(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign)) return { message: TRY_AGAIN };
  const sender = await currentSender();
  if (!sender.connected) return { message: `${sender.says} Send it by hand, below, or connect a sender first.` };
  const supabase = await db();
  const { error } = await supabase.rpc("email_queue", { campaign });
  if (error) return { message: says(error) };
  revalidatePath(pageOf(campaign));
  revalidatePath("/admin/email");
  redirect(`${pageOf(campaign)}?go=1#send`);
}

/** How a run of batches stands, as the page that sends them keeps it between one batch and the next. */
export type RunState = { progress: Progress; /** What the last batch did, in a sentence. */ said: string; /** True when the last batch could not be taken or handed over at all: the run stops. */ stopped: boolean; /** How many batches this page has sent. */ batches: number };
// A server action's file may hand out only actions: the starting state is made where it is used.
const NO_RUN: RunState = { progress: NO_PROGRESS, said: "", stopped: false, batches: 0 };

/** Send the next batch of a campaign that is being sent. One call, one batch: the page calls again for the next. */
export async function sendBatch(prev: RunState, data: FormData): Promise<RunState> {
  const stop = (said: string): RunState => ({ ...(prev ?? NO_RUN), said, stopped: true });
  if (!accountsOn) return stop(SOON);
  if (!(await asAdmin())) return stop(NOT_ADMIN);
  const id = field(data, "campaign");
  if (!UUID.test(id)) return stop(TRY_AGAIN);
  const sender = await currentSender();
  if (!sender.connected) return stop(`${sender.says} Nothing was sent. The addresses still waiting stay as they are.`);
  const supabase = await db();
  const [{ data: row }, settings] = await Promise.all([supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle(), emailSettings(supabase)]);
  if (!row) return stop("That message is not here.");
  const missing = notYet(settings);
  if (missing.length) return stop(`Nothing was sent: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set.`);
  const result = await sendNextBatch(supabase, row as Campaign, settings, sender);
  revalidatePath(pageOf(id));
  if (result.progress.queued === 0) revalidatePath("/admin/email");
  const batches = (prev?.batches ?? 0) + 1;
  if (result.error) return { progress: result.progress, said: result.error, stopped: true, batches };
  const went = result.went === 1 ? "1 message went" : `${result.went} messages went`;
  // A batch the mail service refused whole stops the run: the next would be refused the same way.
  const refusedAll = result.went === 0 && result.refused.length > 0;
  const said = result.refused.length ? `${went} in this batch. ${result.refused.join(" ")}` : result.progress.queued === 0 && result.progress.sending === 0 ? "That was the last batch." : `${went} in this batch.`;
  return { progress: result.progress, said, stopped: refusedAll, batches };
}

/** Queue again the addresses the mail service plainly refused. */
export async function retryFailed(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: again, error } = await supabase.rpc("email_retry_failed", { campaign });
  if (error) return { message: says(error) };
  revalidatePath(pageOf(campaign));
  revalidatePath("/admin/email");
  return again ? { ok: true, message: `${again} ${again === 1 ? "address is" : "addresses are"} waiting again. Carry on sending, below.` } : { message: "There is nothing to try again: an address whose batch got no plain answer may already have the message, and is left as it is." };
}

/** "Mark as sent by hand": the message went from the owner's own mail program, and the record is written. */
export async function markByHand(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign)) return { message: TRY_AGAIN };
  if (field(data, "sure", 3) !== "on") return { errors: { sure: "Tick this once the message has gone from your own mail program." } };
  if ((await currentSender()).connected) return { message: "A sender is connected, so this message is sent from here: press Send." };
  const supabase = await db();
  const { error } = await supabase.rpc("email_sent_by_hand", { campaign });
  if (error) return { message: says(error) };
  revalidatePath(pageOf(campaign));
  revalidatePath("/admin/email");
  return { ok: true, message: "Marked as sent by hand. Who it went to is written into the record." };
}

/** One copy of a message to the admin's own address, to look at in a real inbox. */
export async function sendTestMessage(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (!viewer) return { message: NOT_ADMIN };
  const campaign = field(data, "campaign");
  if (!UUID.test(campaign) || !EMAIL.test(viewer.email)) return { message: TRY_AGAIN };
  const sender = await currentSender();
  if (!sender.connected) return { message: `${sender.says} A test message needs a sender.` };
  if (await tooMany("email-test", 5)) return { message: "Five test messages in ten minutes is the most. Wait a little, then try again." };
  const supabase = await db();
  const [{ data: row }, settings] = await Promise.all([supabase.from("email_campaigns").select("*").eq("id", campaign).maybeSingle(), emailSettings(supabase)]);
  if (!row) return { message: "That message is not here." };
  const missing = notYet(settings);
  if (missing.length) return { message: `A test message cannot be sent yet: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set.` };
  const outcome = await sendTest(row as Campaign, settings, sender, viewer.email);
  return outcome.ok ? { ok: true, message: `A test message is on its way to ${viewer.email}. Its link to leave leads nowhere: it is yours to look at.` } : { message: `The test message was not sent. ${outcome.why}` };
}

/** Ask the addresses that joined before to confirm, once: a campaign of its own kind, sent like any other. */
export async function askConfirm(_: FormState, _data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const sender = await currentSender();
  if (!sender.connected) return { message: `${sender.says} Nobody can be asked to confirm until a sender is connected.` };
  const supabase = await db();
  const { data: made, error } = await supabase.rpc("email_ask_confirm");
  if (error || typeof made !== "string") return { message: says(error) };
  revalidatePath("/admin/email");
  revalidatePath("/admin/subscribers");
  redirect(`${pageOf(made)}?go=1#send`);
}

const LIST_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

/** Who a message comes from, where a reply goes, the sender's postal address, and who is written to. The superadmin's alone. */
export async function saveEmailSettings(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const from_name = field(data, "from_name", 80).replace(/\s+/g, " ");
  const from_email = field(data, "from_email", 160).toLowerCase();
  const reply_to = field(data, "reply_to", 160).toLowerCase();
  const raw = data.get("postal_address");
  const postal_address = typeof raw === "string" ? raw.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").trim().slice(0, 300) : "";
  const write_to = field(data, "write_to", 30);
  const values = { from_name, from_email, reply_to, postal_address, write_to };
  const errors: Record<string, string> = {};
  if (/[<>"]/.test(from_name)) errors.from_name = "A name only: no address, and none of < > or a quotation mark.";
  if (from_email && !LIST_EMAIL.test(from_email)) errors.from_email = "That email address does not look right.";
  if (reply_to && !LIST_EMAIL.test(reply_to)) errors.reply_to = "That email address does not look right.";
  if (!isWriteTo(write_to)) errors.write_to = "Choose who is written to.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { data: saved, error } = await supabase.from("email_settings").update({ from_name, from_email, reply_to, postal_address, write_to }).eq("id", true).select("id");
  if (error || !saved?.length) return { message: TRY_AGAIN, values };
  revalidatePath("/admin/email", "layout");
  return { ok: true, message: "Saved. Every message from now on is sent with these.", values };
}

/** Write down that an address asked not to be written to. */
export async function suppressAddress(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const address = field(data, "address", 160).toLowerCase();
  const why = field(data, "why", 300);
  const values = { address, why };
  if (!address) return { errors: { address: "Give the email address." }, values };
  if (!EMAIL.test(address)) return { errors: { address: "That email address does not look right." }, values };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_suppress", { address, why });
  if (error) return { message: says(error), values };
  revalidatePath("/admin/subscribers");
  revalidatePath("/admin/email");
  return { ok: true, message: `${address} is not written to from now on.` };
}

/** Lift one by hand. The address, if it is still on the list, stays unconfirmed. */
export async function unsuppressAddress(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const address = field(data, "address", 160).toLowerCase();
  if (!EMAIL.test(address)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_unsuppress", { address });
  if (error) return { message: says(error) };
  revalidatePath("/admin/subscribers");
  revalidatePath("/admin/email");
  return { ok: true, message: "Lifted. The address may be written to again." };
}
