"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { accountsOn, TAG_ADS, TAG_OWNED } from "@/lib/accounts/config";
import { field, PHONE, SOON, TRY_AGAIN, typed, UUID, type FormState } from "@/lib/accounts/form";
import { owned } from "@/lib/accounts/owned";
import { emptyFolder } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { isPaidPlan, isPlan, mobileNumber, type Viewer } from "@/lib/accounts/types";
import { PLANS } from "@/data/site";
import { index } from "@/lib/index";

// What an owner does with their businesses. Each action reads who is asking again, checks what it
// was sent, and writes as that person: the database's row level security is the final word on
// whether they may (supabase/migrations). Nothing here can change a status, a plan or the
// verified mark: those columns are not theirs to write.

const SIGN_IN = "Sign in to do that.";
type Row = { name: string; category: string; town: string; address: string; phone: string; website: string; about: string };
const DETAILS = ["name", "category", "town", "address", "phone", "website", "about"];

async function asOwner(): Promise<Viewer | null> {
  return accountsOn ? getViewer() : null;
}

/** A web address as typed, made whole: "example.mu" is "https://example.mu". Empty if it is not one. */
function webAddress(typedIn: string): string {
  if (!typedIn) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(typedIn) ? typedIn : `https://${typedIn}`);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".") && !/\s/.test(typedIn) ? url.href.slice(0, 200) : "";
  } catch {
    return "";
  }
}

/** The details of a business as the form sent them, checked. The category and the town must be ones the index knows. */
function readDetails(data: FormData): { row: Row; errors: Record<string, string> } {
  const { categoryById, placeBySlug } = index();
  const row: Row = { name: field(data, "name", 120), category: field(data, "category", 60), town: field(data, "town", 80), address: field(data, "address", 200), phone: field(data, "phone", 40), website: field(data, "website", 200), about: field(data, "about", 1200) };
  const errors: Record<string, string> = {};
  if (row.name.length < 2) errors.name = "Give the name of the business.";
  if (!categoryById.has(row.category)) errors.category = "Choose what kind of business it is.";
  if (!placeBySlug.has(row.town)) errors.town = "Choose the town or village it is in.";
  if (row.phone && !PHONE.test(row.phone)) errors.phone = "That phone number does not look right.";
  if (row.website) {
    const whole = webAddress(row.website);
    if (whole) row.website = whole;
    else errors.website = "That web address does not look right. It should be like example.mu.";
  }
  return { row, errors };
}

/** List a business, or claim one from the open index. It always starts waiting to be checked. */
export async function createBusiness(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const values = typed(data, [...DETAILS, "listing", "plan"]);
  const { row, errors } = readDetails(data);
  if (Object.keys(errors).length) return { errors, values };

  const listing = field(data, "listing", 24);
  const claimed = listing ? index().byId.get(listing) : undefined;
  if (listing && !claimed) return { message: "That listing is no longer in the directory. List the business from scratch.", values };
  if (claimed && (await owned()).byListing.has(claimed.id)) return { message: "That listing already has an owner here. If it is yours, tell us and a person will look into it.", values };

  const supabase = await db();
  const { data: made, error } = await supabase
    .from("businesses")
    .insert({ ...row, listing_id: claimed?.id ?? null })
    .select("id")
    .single();
  if (error || !made) {
    if (error?.code === "23505") return { message: "You have already claimed that listing. It is among your businesses.", values };
    if (error?.hint === "too_many") return { message: "One account can list twenty businesses. Ask us if you need more.", values };
    return { message: TRY_AGAIN, values };
  }

  // Arriving from the plans page, the plan asked for goes in with the business.
  const plan = field(data, "plan", 8);
  if (isPaidPlan(plan)) await supabase.from("plan_requests").insert({ business_id: made.id, plan });

  revalidatePath("/dashboard");
  redirect(`/dashboard/${made.id}?said=${claimed ? "claimed" : "listed"}`);
}

export async function saveBusiness(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const id = field(data, "business");
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  const values = typed(data, DETAILS);
  const { row, errors } = readDetails(data);
  if (Object.keys(errors).length) return { errors, values };

  const supabase = await db();
  const { data: before } = await supabase.from("businesses").select("status").eq("id", id).eq("owner_id", viewer.id).maybeSingle();
  if (!before) return { message: "That business is not yours to change.", values };
  const { data: saved, error } = await supabase.from("businesses").update(row).eq("id", id).eq("owner_id", viewer.id).select("status");
  if (error?.hint === "verified_name") return { errors: { name: "The name of a verified business is changed by us. Ask and we will." }, values };
  if (error || !saved?.length) return { message: TRY_AGAIN, values };

  // The public pages read live businesses from a cache: a change to one is shown at once.
  if (before.status === "live") updateTag(TAG_OWNED);
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: before.status === "rejected" ? "Saved, and sent back to us to look at again." : "Saved.", values };
}

/** Take a business out for good. Its services, its bookings and its requests go with it. */
export async function removeBusiness(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const id = field(data, "business");
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  if (data.get("sure") !== "on") return { errors: { sure: "Tick the box to say you are sure." } };
  const supabase = await db();
  const { data: mine } = await supabase.from("businesses").select("id").eq("id", id).eq("owner_id", viewer.id).maybeSingle();
  if (!mine) return { message: TRY_AGAIN };
  // Its pictures go with it. The bucket lets an owner remove a picture while the business or the
  // advertisement it belongs to is there, so they are removed first: the page's own, then each
  // advertisement's (one that is waiting to be checked is taken back so the bucket lets go of it).
  const { data: ads } = await supabase.from("ads").select("id, status, artwork").eq("business_id", id);
  const adverts = (ads ?? []) as { id: string; status: string; artwork: string }[];
  await emptyFolder(supabase, `business/${id}`);
  for (const ad of adverts) {
    if (ad.status === "submitted") await supabase.from("ads").update({ status: "draft" }).eq("id", ad.id).eq("business_id", id);
    if (ad.status !== "approved") await emptyFolder(supabase, `ads/${ad.id}`, [ad.artwork]);
  }
  const { data: gone, error } = await supabase.from("businesses").delete().eq("id", id).eq("owner_id", viewer.id).select("id");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  // An approved advertisement's picture could not be touched while it was approved. With the
  // advertisement gone it is its uploader's to remove, and so is anything else left behind.
  await emptyFolder(supabase, `business/${id}`);
  for (const ad of adverts) await emptyFolder(supabase, `ads/${ad.id}`, [ad.artwork]);
  updateTag(TAG_OWNED);
  updateTag(TAG_ADS);
  revalidatePath("/dashboard");
  redirect("/dashboard?said=removed");
}

/**
 * Ask for a change of plan: a step up, a step down, or to stop at the end of the period (asked for
 * as the free plan). Nothing is paid here: a person answers, arranges payment and makes the change.
 */
export async function askForPlan(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const id = field(data, "business");
  const plan = field(data, "plan", 8);
  const note = field(data, "note", 500);
  const values = { plan, note };
  if (!UUID.test(id)) return { message: TRY_AGAIN };
  if (!isPlan(plan)) return { errors: { plan: "Choose what you would like." }, values };
  const supabase = await db();
  const { error } = await supabase.from("plan_requests").insert({ business_id: id, plan, note });
  if (error?.code === "23505") return { message: "You have already asked for a change of plan for this business. We will be in touch." };
  if (error) return { message: TRY_AGAIN, values };
  revalidatePath(`/dashboard/${id}`);
  revalidatePath("/account");
  if (plan === "free") return { ok: true, message: "Asked. Once we have confirmed it, the plan runs to its last day and is not renewed." };
  return { ok: true, message: `Asked for ${PLANS.find((p) => p.id === plan)?.name}. We will contact you to arrange payment, and make the change once that is done.` };
}

export async function withdrawPlanRequest(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const id = field(data, "request");
  const business = field(data, "business");
  if (!UUID.test(id) || !UUID.test(business)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: gone, error } = await supabase.from("plan_requests").delete().eq("id", id).eq("business_id", business).eq("status", "open").select("id");
  if (error || !gone?.length) return { message: "That request could not be taken back. It may already have been answered." };
  revalidatePath(`/dashboard/${business}`, "layout");
  return { ok: true, message: "Taken back." };
}

/** A whole number from a form, or null when the field was left empty. `false` when it is not one. */
function whole(typedIn: string, least: number, most: number): number | null | false {
  if (!typedIn) return null;
  const n = Number(typedIn.replace(/[\s,]/g, ""));
  return Number.isInteger(n) && n >= least && n <= most ? n : false;
}

/** Add a service, or change one. Services are part of Biznes Grow: the database refuses them otherwise. */
export async function saveService(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "service");
  if (!UUID.test(business) || (id && !UUID.test(id))) return { message: TRY_AGAIN };
  const values = { ...typed(data, ["name", "description", "price", "minutes", "kind", "stock"]), active: data.get("active") === "on" ? "on" : "" };
  const kind = field(data, "kind", 8) === "product" ? "product" : "service";
  const stock = kind === "product" ? whole(field(data, "stock", 8), 0, 1_000_000) : null;
  const name = field(data, "name", 80);
  const description = field(data, "description", 400);
  const price = whole(field(data, "price", 12), 0, 10_000_000);
  const minutes = whole(field(data, "minutes", 6), 5, 1440);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Give the service a name.";
  if (price === false) errors.price = "Give the price in whole rupees, or leave it empty.";
  if (minutes === false) errors.minutes = "Give how long it takes in minutes, from 5 to 1,440, or leave it empty.";
  if (stock === false) errors.stock = "Give how many are in stock as a whole number, or leave it empty.";
  if (Object.keys(errors).length || price === false || minutes === false || stock === false) return { errors, values };

  const supabase = await db();
  // A product takes no time: how long is a service's.
  const service = { name, description, price_mur: price, minutes: kind === "product" ? null : minutes, active: id ? data.get("active") === "on" : true };
  const write = (row: typeof service & { kind?: string; stock?: number | null }) =>
    id ? supabase.from("services").update(row).eq("id", id).eq("business_id", business).select("id") : supabase.from("services").insert({ ...row, business_id: business }).select("id");
  let { data: saved, error } = await write({ ...service, kind, stock });
  // A database from before there were products has neither column: a service is still a service there.
  if (error?.code === "PGRST204" && kind === "service") ({ data: saved, error } = await write(service));
  if (error?.hint === "too_many") return { message: "A business can list sixty services. Remove one first.", values };
  if (error?.code === "42501") return { message: "Services are part of Biznes Grow, and this business is not on it today.", values };
  if (error || !saved?.length) return { message: TRY_AGAIN, values };
  updateTag(TAG_OWNED);
  revalidatePath(`/dashboard/${business}/services`);
  return id ? { ok: true, message: "Saved.", values } : { ok: true, message: `Added: ${name}.` };
}

export async function removeService(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "service");
  if (!UUID.test(business) || !UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: gone, error } = await supabase.from("services").delete().eq("id", id).eq("business_id", business).select("id");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  updateTag(TAG_OWNED);
  revalidatePath(`/dashboard/${business}`, "layout");
  return { ok: true, message: "Removed." };
}

/**
 * How customers pay the business by MCB Juice: a mobile number and the name the account is under.
 * Details only. Nothing here touches a payment, and the site takes no part in one. The public sees
 * them only while the business is live and on Biznes Grow: the database sees to that.
 */
export async function savePayDetails(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const business = field(data, "business");
  if (!UUID.test(business)) return { message: TRY_AGAIN };
  const values = typed(data, ["juice_number", "juice_name"]);
  const typedNumber = field(data, "juice_number", 24);
  const name = field(data, "juice_name", 80);
  const number = mobileNumber(typedNumber);
  const errors: Record<string, string> = {};
  if (typedNumber && !number) errors.juice_number = "Give a Mauritian mobile number: eight digits, beginning with 5.";
  if (number && !name) errors.juice_name = "Give the name the MCB Juice account is under, so customers can check it.";
  if (name && !typedNumber) errors.juice_number = "Give the mobile number of the MCB Juice account.";
  if (Object.keys(errors).length) return { errors, values };

  const supabase = await db();
  // Both left empty takes the details away.
  const { data: saved, error } = number
    ? await supabase.from("pay_details").upsert({ business_id: business, juice_number: number, juice_name: name }, { onConflict: "business_id" }).select("business_id")
    : await supabase.from("pay_details").delete().eq("business_id", business).select("business_id");
  if (error || (number && !saved?.length)) return { message: error?.code === "42501" ? "That business is not yours to change." : TRY_AGAIN, values };
  updateTag(TAG_OWNED);
  revalidatePath(`/dashboard/${business}`, "layout");
  return { ok: true, message: number ? "Saved." : "Taken off your page.", values: { juice_number: number, juice_name: name } };
}

const STEPS: Record<string, string> = { confirmed: "Confirmed.", declined: "Declined.", done: "Marked as done." };

/** The business answers a booking: confirms or declines a request, or marks a confirmed one done. */
export async function answerBooking(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const viewer = await asOwner();
  if (!viewer) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "booking");
  const step = field(data, "step", 12);
  if (!UUID.test(business) || !UUID.test(id) || !STEPS[step]) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: changed, error } = await supabase.from("bookings").update({ status: step }).eq("id", id).eq("business_id", business).select("id");
  if (error || !changed?.length) return { message: "That booking could not be changed that way. It may have been cancelled." };
  revalidatePath(`/dashboard/${business}`, "layout");
  return { ok: true, message: STEPS[step] };
}
