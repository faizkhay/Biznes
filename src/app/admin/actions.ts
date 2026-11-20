"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PICTURES } from "@/data/themes";
import { accountsOn, TAG_OWNED, TAG_SETTINGS } from "@/lib/accounts/config";
import { field, SOON, TRY_AGAIN, UUID, type FormState } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { isPlan, isRole, mauritiusToday, STATUSES, type Viewer } from "@/lib/accounts/types";

// What an admin does. Each action reads who is asking again and refuses anyone who is not an
// admin, then calls a function in the database that checks the same thing for itself and records
// what was done (supabase/migrations, parts 1 and 2). The check here is for a plain answer; the
// one in the database is the one that holds.

const NOT_ADMIN = "Only an admin can do that.";
const NOT_SUPERADMIN = "Only the superadmin can do that.";
/** The refusals the database words itself, which can be shown as they are. */
const SAID_BY_THE_DATABASE = new Set(["claimed", "last_superadmin", "missing"]);

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
  if (!UUID.test(request)) return { message: TRY_AGAIN };
  if (accept && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { errors: { until: "Give the last day the plan is paid for." }, values: { until } };
  if (accept && until < mauritiusToday()) return { errors: { until: "That day has passed. Give a day still to come." }, values: { until } };
  const supabase = await db();
  const { error } = await supabase.rpc("admin_handle_plan_request", { request, accept, until: accept ? until : null });
  if (error) return { message: says(error), values: { until } };
  changed();
  return { ok: true, message: accept ? "The plan is on, and the business is marked verified." : "Declined." };
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

/** Choose the picture behind the page and the greeting by hand, or hand either back to the calendar. */
export async function saveLook(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asAdmin();
  if (viewer?.role !== "superadmin") return { message: NOT_SUPERADMIN };
  const picture = field(data, "picture", 40);
  const greeting = field(data, "greeting", 60);
  const values = { picture, greeting };
  if (picture && !Object.hasOwn(PICTURES, picture)) return { errors: { picture: "Choose one of the pictures." }, values };
  const supabase = await db();
  const { data: saved, error } = await supabase
    .from("site_settings")
    .update({ picture: picture || null, greeting: greeting || null })
    .eq("id", true)
    .select("id");
  if (error || !saved?.length) return { message: TRY_AGAIN, values };
  // Every page carries the picture, so every page is made again.
  updateTag(TAG_SETTINGS);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved. The site takes the new look from the next page that is opened.", values };
}
