"use server";

import { revalidatePath, updateTag } from "next/cache";
import { accountsOn, TAG_OWNED } from "@/lib/accounts/config";
import { field, SOON, TRY_AGAIN, typed, UUID, type FormState } from "@/lib/accounts/form";
import { dropPictures } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";

// What a paid plan adds to a business's page: a line of its own, its opening hours, its pictures,
// and a menu for a food outlet. The owner writes them; the database lets the owner of a business
// on Biznes Go or Biznes Grow write them and nobody else (supabase/migrations, part 6). Pictures
// are uploaded through a route of their own (showcase/upload), since a picture may be larger than
// a server action takes.

const SIGN_IN = "Sign in to do that.";
const NOT_PAID = "That is part of Biznes Go and Biznes Grow, and this business is on neither today.";

async function asOwner() {
  return accountsOn ? getViewer() : null;
}

/** Whatever changes a live business's page is shown at once: the public read is made fresh. */
function shown(business: string, part: string) {
  updateTag(TAG_OWNED);
  revalidatePath(`/dashboard/${business}/${part}`);
}

/** The line under the name, and the opening hours: a line a day, in the owner's words. */
export async function saveShowcase(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  if (!UUID.test(business)) return { message: TRY_AGAIN };
  const values = typed(data, ["tagline", "hours"]);
  const tagline = field(data, "tagline", 120);
  const hours = field(data, "hours", 1200)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errors: Record<string, string> = {};
  if (hours.length > 10) errors.hours = "Ten lines at most: a line a day, and a few to spare.";
  else if (hours.some((line) => line.length > 80)) errors.hours = "Keep each line to 80 characters.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { data: changed, error } = await supabase.from("showcases").update({ tagline, hours }).eq("business_id", business).select("business_id");
  if (error) return { message: error.code === "42501" ? NOT_PAID : TRY_AGAIN, values };
  if (!changed?.length) {
    const { error: refused } = await supabase.from("showcases").insert({ business_id: business, tagline, hours });
    if (refused) return { message: refused.code === "42501" ? NOT_PAID : TRY_AGAIN, values };
  }
  shown(business, "showcase");
  return { ok: true, message: "Saved.", values };
}

/** Take a picture off the page and out of storage, or put a photograph first. */
export async function changePicture(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const path = field(data, "path", 200);
  const what = field(data, "do", 12);
  if (!UUID.test(business) || !path.startsWith(`business/${business}/`)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: row } = await supabase.from("showcases").select("cover, photos").eq("business_id", business).maybeSingle();
  if (!row) return { message: TRY_AGAIN };
  const photos = (row.photos as string[]).filter((p) => p !== path);
  const next = what === "first" ? { photos: [path, ...photos] } : { cover: row.cover === path ? "" : row.cover, photos };
  const { data: changed, error } = await supabase.from("showcases").update(next).eq("business_id", business).select("business_id");
  if (error || !changed?.length) return { message: error?.code === "42501" ? NOT_PAID : TRY_AGAIN };
  if (what !== "first") await dropPictures(supabase, [path]);
  shown(business, "showcase");
  return { ok: true, message: what === "first" ? "That photograph is now first." : "Picture removed." };
}

/** A whole number from a form, or null when the field was left empty. `false` when it is not one. */
function whole(typedIn: string, least: number, most: number): number | null | false {
  if (!typedIn) return null;
  const n = Number(typedIn.replace(/[\s,]/g, ""));
  return Number.isInteger(n) && n >= least && n <= most ? n : false;
}

/** Add a section to the menu, or rename one. A new section goes last. */
export async function saveSection(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "section");
  if (!UUID.test(business) || (id && !UUID.test(id))) return { message: TRY_AGAIN };
  const title = field(data, "title", 80);
  if (!title) return { errors: { title: "Give the section a name: Starters, Drinks." }, values: { title } };
  const supabase = await db();
  let error;
  if (id) {
    ({ error } = await supabase.from("menu_sections").update({ title }).eq("id", id).eq("business_id", business));
  } else {
    const { data: last } = await supabase.from("menu_sections").select("position").eq("business_id", business).order("position", { ascending: false }).limit(1);
    ({ error } = await supabase.from("menu_sections").insert({ business_id: business, title, position: (last?.[0]?.position ?? 0) + 1 }));
  }
  if (error?.hint === "too_many") return { message: "A menu has twenty sections at most. Remove one first.", values: { title } };
  if (error) return { message: error.code === "42501" ? "A menu is for a food outlet on Biznes Go or Biznes Grow." : TRY_AGAIN, values: { title } };
  shown(business, "menu");
  return id ? { ok: true, message: "Saved.", values: { title } } : { ok: true, message: `Added: ${title}.` };
}

/** Add an item to a section, or change one. A new item goes last in its section. */
export async function saveItem(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const section = field(data, "section");
  const id = field(data, "item");
  if (!UUID.test(business) || !UUID.test(section) || (id && !UUID.test(id))) return { message: TRY_AGAIN };
  const values = typed(data, ["name", "description", "price"]);
  const name = field(data, "name", 100);
  const description = field(data, "description", 300);
  const price = whole(field(data, "price", 12), 0, 10_000_000);
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Give the item its name.";
  if (price === false) errors.price = "Give the price in whole rupees, or leave it empty.";
  if (Object.keys(errors).length || price === false) return { errors, values };
  const supabase = await db();
  let error;
  if (id) {
    ({ error } = await supabase.from("menu_items").update({ name, description, price_mur: price }).eq("id", id).eq("business_id", business));
  } else {
    const { data: last } = await supabase.from("menu_items").select("position").eq("section_id", section).order("position", { ascending: false }).limit(1);
    ({ error } = await supabase.from("menu_items").insert({ section_id: section, name, description, price_mur: price, position: (last?.[0]?.position ?? 0) + 1 }));
  }
  if (error?.hint === "too_many") return { message: "A menu holds three hundred items at most. Remove one first.", values };
  if (error) return { message: error.code === "42501" ? "A menu is for a food outlet on Biznes Go or Biznes Grow." : TRY_AGAIN, values };
  shown(business, "menu");
  return id ? { ok: true, message: "Saved.", values } : { ok: true, message: `Added: ${name}.` };
}

/** Remove a section with everything in it, or one item; or move either one place up or down. */
export async function changeMenu(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "id");
  const of = field(data, "of", 8) === "item" ? "menu_items" : "menu_sections";
  const what = field(data, "do", 8);
  if (!UUID.test(business) || !UUID.test(id) || !["remove", "up", "down"].includes(what)) return { message: TRY_AGAIN };
  const supabase = await db();
  if (what === "remove") {
    const { data: gone, error } = await supabase.from(of).delete().eq("id", id).eq("business_id", business).select("id");
    if (error || !gone?.length) return { message: TRY_AGAIN };
    shown(business, "menu");
    return { ok: true, message: "Removed." };
  }
  // The neighbours in order, then the two change places: every position is written afresh, so gaps and ties mend themselves.
  const { data: mine } = await supabase.from(of).select("*").eq("id", id).eq("business_id", business).maybeSingle();
  if (!mine) return { message: TRY_AGAIN };
  const beside = supabase.from(of).select("id, position").eq("business_id", business);
  const { data: rows } = await (of === "menu_items" ? beside.eq("section_id", mine.section_id) : beside).order("position").order("created_at");
  const order = (rows ?? []).map((r) => r.id as string);
  const at = order.indexOf(id);
  const to = what === "up" ? at - 1 : at + 1;
  if (at < 0 || to < 0 || to >= order.length) return { ok: true, message: "It is already there." };
  [order[at], order[to]] = [order[to], order[at]];
  for (const [i, row] of order.entries()) {
    const { error } = await supabase.from(of).update({ position: i + 1 }).eq("id", row).eq("business_id", business);
    if (error) return { message: error.code === "42501" ? "A menu is for a food outlet on Biznes Go or Biznes Grow." : TRY_AGAIN };
  }
  shown(business, "menu");
  return { ok: true, message: "Moved." };
}
