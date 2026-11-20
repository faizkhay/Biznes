"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PICTURES } from "@/data/themes";
import { siteCatalogue } from "@/lib/accounts/catalogue";
import { accountsOn, TAG_ADS, TAG_OWNED, TAG_SETTINGS } from "@/lib/accounts/config";
import { field, SOON, TRY_AGAIN, UUID, type FormState } from "@/lib/accounts/form";
import { dropPictures, emptyFolder } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { isPlan, isRole, mauritiusToday, ORDER_NAMES, ORDER_STATUSES, STATUSES, type OrderStatus, type Viewer } from "@/lib/accounts/types";

// What an admin does. Each action reads who is asking again and refuses anyone who is not an
// admin, then calls a function in the database that checks the same thing for itself and records
// what was done (supabase/migrations, parts 1 and 2). The check here is for a plain answer; the
// one in the database is the one that holds.

const NOT_ADMIN = "Only an admin can do that.";
const NOT_SUPERADMIN = "Only the superadmin can do that.";
/** The refusals the database words itself, which can be shown as they are. */
const SAID_BY_THE_DATABASE = new Set(["claimed", "last_superadmin", "missing", "guide_full", "ad_step"]);

type Refusal = { message: string; hint?: string | null } | null;
const says = (error: Refusal) => (error?.hint && SAID_BY_THE_DATABASE.has(error.hint) ? error.message : error?.hint === "forbidden" ? NOT_ADMIN : TRY_AGAIN);

async function asAdmin(): Promise<Viewer | null> {
  const viewer = accountsOn ? await getViewer() : null;
  return viewer && (viewer.role === "admin" || viewer.role === "superadmin") ? viewer : null;
}

/** The public pages read from a cache: after a change to a business they are made fresh at once. */
function changed() {
  updateTag(TAG_OWNED);
  revalidatePath("/admin");
}

const STATUS_SAID: Record<string, string> = { live: "It is live.", rejected: "Not accepted. The owner sees your note.", suspended: "Suspended. It is off the site.", pending: "Back in the queue." };

/** Make a business live, reject it, suspend it, or put it back in the queue. */
export async function setStatus(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const business = field(data, "business");
  const status = field(data, "status", 12);
  const note = field(data, "note", 300);
  if (!UUID.test(business) || !(STATUSES as readonly string[]).includes(status)) return { message: TRY_AGAIN };
  if ((status === "rejected" || status === "suspended") && !note) return { errors: { note: "Say why, in a line: the owner is shown it." }, values: { note } };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_set_status", { business, new_status: status, note });
  if (error) return { message: says(error), values: { note } };
  changed();
  return { ok: true, message: STATUS_SAID[status] };
}

/** Put a business on a plan until a day, or back on the free one. */
export async function setPlan(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const business = field(data, "business");
  const plan = field(data, "plan", 8);
  const until = field(data, "until", 10);
  const values = { plan, until };
  if (!UUID.test(business)) return { message: TRY_AGAIN };
  if (!isPlan(plan)) return { errors: { plan: "Choose a plan." }, values };
  if (plan !== "free" && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { errors: { until: "Give the last day the plan is paid for." }, values };
  if (plan !== "free" && until < mauritiusToday()) return { errors: { until: "That day has passed. Give a day still to come." }, values };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_set_plan", { business, new_plan: plan, until: plan === "free" ? null : until });
  if (error) return { message: says(error), values };
  changed();
  return { ok: true, message: plan === "free" ? "Back on Biznes Free." : "The plan is on, and the business is marked verified." };
}

export async function setVerified(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const business = field(data, "business");
  const verified = field(data, "verified", 3) === "yes";
  if (!UUID.test(business)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_set_verified", { business, is_verified: verified });
  if (error) return { message: says(error) };
  changed();
  return { ok: true, message: verified ? "Marked verified." : "The verified mark is off." };
}

/** Answer an owner's request for a plan: switch it on until a day, or decline. */
export async function answerPlanRequest(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const request = field(data, "request");
  const accept = field(data, "answer", 8) === "accept";
  const until = field(data, "until", 10);
  // A request to stop: the plan keeps its last day and lapses by itself.
  const stop = field(data, "kind", 8) === "stop";
  if (!UUID.test(request)) return { message: TRY_AGAIN };
  if (accept && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { errors: { until: stop ? "Give the plan's last day." : "Give the last day the plan is paid for." }, values: { until } };
  if (accept && until < mauritiusToday()) return { errors: { until: "That day has passed. Give a day still to come." }, values: { until } };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_handle_plan_request", { request, accept, until: accept ? until : null });
  if (error) return { message: says(error), values: { until } };
  changed();
  return { ok: true, message: !accept ? "Declined." : stop ? "Confirmed. The plan runs to that day and then stops." : "The plan is on, and the business is marked verified." };
}

/** Promote or demote someone. The database refuses to demote the last superadmin. */
export async function setRole(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const person = field(data, "person");
  const role = field(data, "role", 12);
  if (!UUID.test(person)) return { message: TRY_AGAIN };
  if (!isRole(role)) return { errors: { role: "Choose a role." }, values: { role } };
  const supabase = await db();
  const { error } = await supabase.rpc("set_role", { target: person, new_role: role });
  if (error) return { message: error.hint === "forbidden" ? NOT_SUPERADMIN : says(error), values: { role } };
  revalidatePath("/admin/people");
  return { ok: true, message: "Saved.", values: { role } };
}

/**
 * How the picture behind the page is chosen, and the greeting: by the calendar, one picture fixed,
 * or a round of pictures, a new one each day. A picture is one the site is built with or one the
 * superadmin has uploaded.
 */
export async function saveLook(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const asked = field(data, "mode", 12);
  const mode = asked === "fixed" || asked === "rotation" ? asked : "calendar";
  const picture = field(data, "picture", 40);
  const round = [...new Set(data.getAll("pictures").map(String))].slice(0, 30);
  const greeting = field(data, "greeting", 60);
  const values = { mode, picture, pictures: round.join(","), greeting };
  const supabase = await db();
  const { data: uploaded } = await supabase.from("site_pictures").select("id");
  const known = new Set([...Object.keys(PICTURES), ...(uploaded ?? []).map((u) => u.id as string)]);
  if (mode === "fixed" && !picture) return { errors: { picture: "Choose the picture to keep." }, values };
  if (mode === "fixed" && !known.has(picture)) return { errors: { picture: "Choose one of the pictures." }, values };
  if (mode === "rotation" && round.length < 2) return { errors: { pictures: "Tick at least two pictures for the round." }, values };
  if (mode === "rotation" && round.some((id) => !known.has(id))) return { errors: { pictures: "One of those pictures is no longer here. Tick them again." }, values };
  const look = { picture: mode === "fixed" ? picture : null, greeting: greeting || null };
  let { data: saved, error } = await supabase
    .from("site_settings")
    .update({ ...look, mode, pictures: mode === "rotation" ? round : [] })
    .eq("id", true)
    .select("id");
  // A database from before there was a choice of how holds a fixed picture or none, and that much it can still be told.
  if (error && mode !== "rotation") ({ data: saved, error } = await supabase.from("site_settings").update(look).eq("id", true).select("id"));
  if (error || !saved?.length) return { message: TRY_AGAIN, values };
  // Every page carries the picture, so every page is made again.
  updateTag(TAG_SETTINGS);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The site takes the new look from the next page that is opened.", values };
}

/** Take an uploaded picture out: off the list, out of storage, and out of the look if it was chosen. */
export async function removeSitePicture(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const id = field(data, "picture");
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: settings } = await supabase.from("site_settings").select("mode, picture, pictures").limit(1).maybeSingle();
  if (settings) {
    // The look lets go of the picture first, so no page is left asking for one that is gone.
    const round = ((settings.pictures as string[] | null) ?? []).filter((p) => p !== id);
    const fixedOnIt = settings.mode === "fixed" && settings.picture === id;
    if (fixedOnIt || round.length !== ((settings.pictures as string[] | null) ?? []).length) {
      const mode = fixedOnIt || (settings.mode === "rotation" && round.length < 2) ? "calendar" : settings.mode;
      const { error } = await supabase.from("site_settings").update({ mode, picture: fixedOnIt ? null : settings.picture, pictures: mode === "rotation" ? round : [] }).eq("id", true);
      if (error) return { message: TRY_AGAIN };
    }
  }
  const { data: gone, error } = await supabase.from("site_pictures").delete().eq("id", id).select("path");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  await dropPictures(supabase, [gone[0].path as string]);
  updateTag(TAG_SETTINGS);
  revalidatePath("/", "layout");
  return { ok: true, message: "Picture removed." };
}

/** Approve an advertisement that was sent in, or decline it with a line its owner is shown. */
export async function reviewAd(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const ad = field(data, "ad");
  const approve = field(data, "answer", 8) === "approve";
  const reason = field(data, "reason", 300);
  // The stamp of the advertisement as the page showed it. The database approves only that one:
  // if its owner has changed it since, the admin is asked to look again.
  const seen = field(data, "seen", 40);
  if (!UUID.test(ad)) return { message: TRY_AGAIN };
  if (!approve && !reason) return { errors: { reason: "Say why, in a line: the owner is shown it." }, values: { reason } };
  if (approve && !/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/.test(seen)) return { message: "Open the page again, look at the advertisement, then approve it.", values: { reason } };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_review_ad", approve ? { ad, approve, why: "", seen } : { ad, approve, why: reason });
  if (error) {
    // The page is drawn again, so what is there now is what the admin sees next.
    if (error.hint === "ad_step") revalidatePath("/admin/ads");
    return { message: says(error), values: { reason } };
  }
  updateTag(TAG_ADS);
  revalidatePath("/admin/ads");
  return { ok: true, message: approve ? "Approved. It runs in its months once it is marked paid." : "Declined. The owner sees your reason, and can change it and send it again." };
}

/** Mark an approved advertisement paid, or not paid. Only a paid one is shown. */
export async function setAdPaid(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const ad = field(data, "ad");
  const paid = field(data, "paid", 3) === "yes";
  if (!UUID.test(ad)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_set_ad_paid", { ad, is_paid: paid });
  if (error) return { message: says(error) };
  updateTag(TAG_ADS);
  revalidatePath("/admin/ads");
  return { ok: true, message: paid ? "Marked paid. It shows in its place in the months it names." : "Marked not paid. It is not shown." };
}

/** Move an order on: awaiting payment, paid, fulfilled, cancelled, or back to placed. A note is for the person who ordered. */
export async function setOrder(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const order = field(data, "order");
  const status = field(data, "status", 20);
  const note = field(data, "note", 500);
  if (!UUID.test(order) || !(ORDER_STATUSES as readonly string[]).includes(status)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_set_order", { target: order, new_status: status, word: note || null });
  if (error) return { message: says(error), values: { note } };
  revalidatePath("/admin/orders");
  return { ok: true, message: `${ORDER_NAMES[status as OrderStatus]}.` };
}

/** Bring the database's copy of what the site sells level with the site's own data. The superadmin's alone. */
export async function levelCatalogue(_: FormState, _data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const supabase = await db();
  const { error } = await supabase.rpc("set_catalogue", { items: siteCatalogue().map((s) => ({ id: s.id, name: s.name, price: s.price, per: s.per })) });
  if (error) return { message: error.hint === "forbidden" ? NOT_SUPERADMIN : TRY_AGAIN };
  revalidatePath("/admin/orders");
  return { ok: true, message: "The catalogue now says what the site says." };
}

/** Take an address off the list of subscribers. */
export async function removeSubscriber(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const id = field(data, "subscriber");
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: gone, error } = await supabase.from("subscribers").delete().eq("id", id).select("id");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  revalidatePath("/admin/subscribers");
  return { ok: true, message: "Taken off the list." };
}

/**
 * Take the picture off an advertisement, as an admin: one that should not be shown, or one left
 * behind. An advertisement that was waiting or approved is declined with the reason, so it comes
 * down and its owner is told why. Then the file itself is removed from the bucket.
 */
export async function removeAdPicture(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const ad = field(data, "ad");
  const why = field(data, "why", 300);
  if (!UUID.test(ad)) return { message: TRY_AGAIN };
  if (!why) return { errors: { why: "Say why, in a line: the owner is shown it." }, values: { why } };
  const supabase = await db();
  const { data: row } = await supabase.from("ads").select("artwork").eq("id", ad).maybeSingle();
  const { error } = await supabase.rpc("admin_remove_ad_picture", { ad, why });
  if (error) return { message: says(error), values: { why } };
  await emptyFolder(supabase, `ads/${ad}`, [(row?.artwork as string | undefined) ?? ""]);
  updateTag(TAG_ADS);
  revalidatePath("/admin/ads");
  return { ok: true, message: "The picture is removed, and the owner is shown why." };
}

/** Take a picture off a business's page, as an admin: its cover or one of its photographs. Then the file is removed. */
export async function removeBusinessPicture(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asAdmin())) return { message: NOT_ADMIN };
  const business = field(data, "business");
  const path = field(data, "path", 200);
  if (!UUID.test(business) || !path.startsWith(`business/${business}/`)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_remove_business_picture", { business, path });
  if (error) return { message: says(error) };
  await dropPictures(supabase, [path]);
  changed();
  return { ok: true, message: "The picture is removed from the page and from storage." };
}
