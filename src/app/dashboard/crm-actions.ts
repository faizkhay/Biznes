"use server";

import { revalidatePath } from "next/cache";
import { accountsOn } from "@/lib/accounts/config";
import { field, PHONE, SOON, TRY_AGAIN, typed, UUID, type FormState } from "@/lib/accounts/form";
import { db } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { mauritiusToday, PAYMENT_METHODS, type PaymentMethod } from "@/lib/accounts/types";

// What a business on Biznes Grow keeps for itself: its customers, a note on a booking, and a
// ledger of the payments it has taken. Each action reads who is asking and writes as that person;
// the database gives these tables to the owner alone (supabase/migrations, part 7). The site takes
// no payment and checks none: the ledger is the owner's own record.

const SIGN_IN = "Sign in to do that.";
const NOT_GROW = "That is part of Biznes Grow, and this business is not on it today.";

async function asOwner() {
  return accountsOn ? getViewer() : null;
}
const refreshed = (business: string, part: string) => revalidatePath(`/dashboard/${business}/${part}`);

/** Add a customer by hand, or change one. */
export async function saveCustomer(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "customer");
  if (!UUID.test(business) || (id && !UUID.test(id))) return { message: TRY_AGAIN };
  const values = typed(data, ["name", "phone", "notes"]);
  const row = { name: field(data, "name", 80), phone: field(data, "phone", 40), notes: field(data, "notes", 1000) };
  const errors: Record<string, string> = {};
  if (!row.name) errors.name = "Give the customer's name.";
  if (row.phone && !PHONE.test(row.phone)) errors.phone = "That phone number does not look right.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { data: saved, error } = id
    ? await supabase.from("customers").update(row).eq("id", id).eq("business_id", business).select("id")
    : await supabase.from("customers").insert({ ...row, business_id: business }).select("id");
  if (error?.code === "23505") return { errors: { phone: "A customer with that number is already on your list." }, values };
  if (error?.code === "42501") return { message: NOT_GROW, values };
  if (error || !saved?.length) return { message: TRY_AGAIN, values };
  refreshed(business, "customers");
  return id ? { ok: true, message: "Saved.", values } : { ok: true, message: `Added: ${row.name}.` };
}

export async function removeCustomer(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "customer");
  if (!UUID.test(business) || !UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: gone, error } = await supabase.from("customers").delete().eq("id", id).eq("business_id", business).select("id");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  refreshed(business, "customers");
  return { ok: true, message: "Removed." };
}

/** The business's own word on a booking. The customer never sees it. Saved empty, it is taken away. */
export async function saveNote(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const booking = field(data, "booking");
  if (!UUID.test(business) || !UUID.test(booking)) return { message: TRY_AGAIN };
  const note = field(data, "note", 1000);
  const supabase = await db();
  if (!note) {
    await supabase.from("booking_notes").delete().eq("booking_id", booking).eq("business_id", business);
  } else {
    const { data: changed, error } = await supabase.from("booking_notes").update({ note }).eq("booking_id", booking).eq("business_id", business).select("booking_id");
    if (error) return { message: error.code === "42501" ? NOT_GROW : TRY_AGAIN, values: { note } };
    if (!changed?.length) {
      const { error: refused } = await supabase.from("booking_notes").insert({ booking_id: booking, note });
      if (refused) return { message: refused.code === "42501" ? NOT_GROW : TRY_AGAIN, values: { note } };
    }
  }
  refreshed(business, "bookings");
  return { ok: true, message: note ? "Note saved." : "Note removed.", values: { note } };
}

const isMethod = (v: string): v is PaymentMethod => (PAYMENT_METHODS as readonly string[]).includes(v);

/** A line in the ledger: a payment the business has taken, written down by hand. With a booking named, the booking is marked paid. */
export async function recordPayment(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const booking = field(data, "booking");
  const customer = field(data, "customer");
  if (!UUID.test(business) || (booking && !UUID.test(booking)) || (customer && !UUID.test(customer))) return { message: TRY_AGAIN };
  const values = typed(data, ["paid_on", "payer", "what", "amount", "method"]);
  const paidOn = field(data, "paid_on", 10);
  const amount = Number(field(data, "amount", 12).replace(/[\s,]/g, ""));
  const method = field(data, "method", 12);
  const errors: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) errors.paid_on = "Give the day it was paid.";
  else if (paidOn > mauritiusToday()) errors.paid_on = "That day has not come yet. The ledger is for payments already taken.";
  if (!Number.isInteger(amount) || amount < 1 || amount > 100_000_000) errors.amount = "Give the amount in whole rupees.";
  if (!isMethod(method)) errors.method = "Choose how it was paid.";
  if (Object.keys(errors).length) return { errors, values };
  const supabase = await db();
  const { error } = await supabase.from("payments").insert({ business_id: business, booking_id: booking || null, customer_id: customer || null, paid_on: paidOn, payer: field(data, "payer", 80), what: field(data, "what", 160), amount_mur: amount, method });
  if (error?.code === "23505") return { message: "That booking is already marked paid.", values };
  if (error?.code === "42501") return { message: NOT_GROW, values };
  if (error) return { message: TRY_AGAIN, values };
  refreshed(business, "payments");
  refreshed(business, "bookings");
  revalidatePath(`/dashboard/${business}`, "layout");
  return { ok: true, message: booking ? "Marked paid, and written in the ledger." : "Written in the ledger." };
}

export async function removePayment(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  if (!(await asOwner())) return { message: SIGN_IN };
  const business = field(data, "business");
  const id = field(data, "payment");
  if (!UUID.test(business) || !UUID.test(id)) return { message: TRY_AGAIN };
  const supabase = await db();
  const { data: gone, error } = await supabase.from("payments").delete().eq("id", id).eq("business_id", business).select("id");
  if (error || !gone?.length) return { message: TRY_AGAIN };
  refreshed(business, "payments");
  refreshed(business, "bookings");
  return { ok: true, message: "Taken out of the ledger." };
}
