"use server";

import { revalidatePath } from "next/cache";
import { accountsOn } from "@/lib/accounts/config";
import { field, SOON, TRY_AGAIN, typed, UUID, type FormState } from "@/lib/accounts/form";
import { emptyFolder } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { isAdPlace, thisMonth } from "@/lib/accounts/types";

// An owner's advertisements. The owner drafts one, gives it a picture (through a route of its own:
// ads/[ad]/upload), sends it in, takes it back, mends one that was not accepted, or takes it out.
// Approving it, declining it and marking it paid are an admin's, and the database holds each of
// those lines for itself (supabase/migrations, part 8).

const SIGN_IN = "Sign in to do that.";

async function asOwner() {
  return accountsOn ? getViewer() : null;
}

/** What the database said, in the page's words. */
function refusal(error: { code?: string; hint?: string | null; message?: string }): FormState {
  switch (error.hint) {
    case "ad_months":
      return { errors: { months: "Choose months still to come: never the one that has begun." } };
    case "ad_artwork":
      return { message: "Add the picture before you send it in." };
    case "ad_live":
      return { message: "Only a live business can advertise." };
    case "ad_submitted":
      return { message: "Take the advertisement back before you change it." };
    case "ad_approved":
      return { message: "An approved advertisement is changed by us. Ask and we will." };
    case "ad_step":
      return { message: "That advertisement cannot be changed that way." };
    case "too_many":
      return { message: "A business keeps twenty advertisements at most. Take one out first." };
    default:
      return { message: error.code === "42501" ? "Only a live business can advertise, and only its owner." : TRY_AGAIN };
  }
}

/** Draft an advertisement, or change one that is a draft or was not accepted. */
export async function saveAd(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "ad");
  if (!UUID.test(business) || (id && !UUID.test(id))) return { message: TRY_AGAIN };
  const months = [...new Set(data.getAll("months").map(String))].filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
  const values = { ...typed(data, ["headline", "line", "link_to", "place"]), months: months.join(",") };
  const row = { headline: field(data, "headline", 60), line: field(data, "line", 120), link_to: field(data, "link_to", 8) === "website" ? "website" : "page", place: field(data, "place", 20), months };
  const errors: Record<string, string> = {};
  if (row.headline.length < 2) errors.headline = "Give the advertisement a headline.";
  if (!isAdPlace(row.place)) errors.place = "Choose where it should run.";
  if (!months.length) errors.months = "Choose at least one month.";
  else if (months.some((m) => m <= thisMonth())) errors.months = "Choose months still to come: never the one that has begun.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { data: saved, error } = id
    ? await supabase.from("ads").update(row).eq("id", id).eq("business_id", business).select("id")
    : await supabase.from("ads").insert({ ...row, business_id: business }).select("id");
  if (error) return { ...refusal(error), values };
  if (!saved?.length) return { message: TRY_AGAIN, values };
  revalidatePath(`/dashboard/${business}/ads`);
  return id ? { ok: true, message: "Saved.", values } : { ok: true, message: "Drafted. Add its picture, then send it in." };
}

/** Send a draft in to be checked, take it back, or take an advertisement out for good. */
export async function moveAd(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "ad");
  const what = field(data, "do", 8);
  if (!UUID.test(business) || !UUID.test(id) || !["send", "back", "remove"].includes(what)) return { message: TRY_AGAIN };
  const supabase = await db();
  if (what === "remove") {
    const cannot = { message: "That advertisement could not be taken out. An approved one is changed by us: ask and we will." };
    const { data: ad } = await supabase.from("ads").select("status, artwork").eq("id", id).eq("business_id", business).maybeSingle();
    if (!ad || ad.status === "approved") return cannot;
    // Its pictures go first, while the bucket still knows whose they are: it lets an owner remove
    // them only while the advertisement is there and is a draft or was declined. One that is
    // waiting to be checked is taken back first, for the same reason. If it cannot be taken back
    // (its months have come), the pictures go after the row instead, as its uploader's own.
    if (ad.status === "submitted") await supabase.from("ads").update({ status: "draft" }).eq("id", id).eq("business_id", business);
    await emptyFolder(supabase, `ads/${id}`, [ad.artwork as string]);
    const { data: gone, error } = await supabase.from("ads").delete().eq("id", id).eq("business_id", business).select("id");
    if (error || !gone?.length) return cannot;
    // Anything still there is now nobody's but its uploader's, and the bucket lets them remove that too.
    await emptyFolder(supabase, `ads/${id}`, [ad.artwork as string]);
    revalidatePath(`/dashboard/${business}/ads`);
    revalidatePath("/admin/ads");
    return { ok: true, message: "Taken out, with its picture." };
  }
  const { data: moved, error } = await supabase.from("ads").update({ status: what === "send" ? "submitted" : "draft" }).eq("id", id).eq("business_id", business).select("id");
  if (error) return refusal(error);
  if (!moved?.length) return { message: TRY_AGAIN };
  revalidatePath(`/dashboard/${business}/ads`);
  revalidatePath("/admin/ads");
  return { ok: true, message: what === "send" ? "Sent in. A person checks it, then contacts you about payment. It runs once it is approved and paid." : "Taken back. It is a draft again." };
}
