"use server";

import { revalidatePath } from "next/cache";
import { siteCatalogue, soldId, type CatalogueRow } from "./catalogue";
import { accountsOn } from "./config";
import { EMAIL, field, PHONE, SOON, type FormState } from "./form";
import { tooMany } from "./limit";
import { db, publicDb } from "./server";
import { getViewer } from "./session";
import { rupees } from "./types";

// Placing an order. Nothing is paid here and nothing is promised about how: the order is a
// request, and a person answers it with how to pay.
//
// What the browser sends is only what is wanted and how many. Each line is priced twice: here,
// from the site's own data, and in the database, from its catalogue (supabase/migrations, part
// 10), which is the price the order is written with. An order is taken only when the two agree,
// so a catalogue that has fallen behind the site cannot charge yesterday's price.

type Line = { id: string; qty: number; detail: string };

/** The lines a cart sent, as far as they can be trusted: a known shape and nothing more. */
function read(text: string): Line[] | null {
  try {
    const sent: unknown = JSON.parse(text);
    if (!Array.isArray(sent) || sent.length === 0 || sent.length > 20) return null;
    return sent.map((line: { id?: unknown; kind?: unknown; qty?: unknown; detail?: unknown }) => ({
      id: soldId(String(line.kind ?? ""), String(line.id ?? "")).slice(0, 100),
      qty: Math.trunc(Number(line.qty)),
      detail: typeof line.detail === "string" ? line.detail.trim().slice(0, 200) : "",
    }));
  } catch {
    return null;
  }
}

const NOT_NOW = "We could not take the order just now. Nothing was placed. Try again in a moment, or call us.";

export async function placeOrder(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const values = { name: field(data, "name", 120), phone: field(data, "phone", 40), email: field(data, "email", 160).toLowerCase(), note: field(data, "note", 500) };
  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (field(data, "website")) return { ok: true, message: "We have your order. A person will contact you with how to pay." };

  const lines = read(String(data.get("lines") ?? ""));
  if (!lines) return { message: "There is nothing in the order. Add something to your cart first.", values };
  const sold = new Map(siteCatalogue().map((s) => [s.id, s]));
  const unknown = lines.find((line) => !sold.has(line.id));
  if (unknown) return { message: "Something in your cart is no longer sold here. Take it out, and order the rest.", values };
  if (lines.some((line) => !(line.qty >= 1 && line.qty <= 24))) return { message: "Order from one to twenty-four of each thing.", values };

  const viewer = await getViewer();
  const errors: Record<string, string> = {};
  if (!viewer && values.name.length < 2) errors.name = "Tell us your name.";
  if (values.phone && !PHONE.test(values.phone)) errors.phone = "That phone number does not look right.";
  if (values.email && !EMAIL.test(values.email)) errors.email = "That email address does not look right.";
  if (!viewer && !values.phone && !values.email && !errors.phone && !errors.email) errors.phone = "Give a telephone number or an email address, so we can reach you.";
  if (Object.keys(errors).length) return { errors, values };
  if (await tooMany("order", 8)) return { message: "Too many tries from this connection. Wait a few minutes, then try again.", values };

  // The database's copy of the prices must say what the site says, for everything in this order.
  const { data: copy, error: unread } = await publicDb()
    .from("catalogue")
    .select("id, name, price_mur, per, active")
    .in("id", [...new Set(lines.map((line) => line.id))]);
  if (unread || !copy) return { message: NOT_NOW, values };
  const held = new Map((copy as CatalogueRow[]).map((row) => [row.id, row]));
  const behind = lines.find((line) => {
    const row = held.get(line.id);
    const site = sold.get(line.id)!;
    return !row || !row.active || row.price_mur !== site.price;
  });
  if (behind) {
    console.error(`[accounts] an order was refused: the catalogue and the site disagree about ${behind.id}. The superadmin brings them level at /admin/orders.`);
    return { message: NOT_NOW, values };
  }

  const supabase = viewer ? await db() : publicDb();
  const { data: placed, error } = await supabase.rpc("place_order", { lines, buyer_name: values.name, buyer_phone: values.phone, buyer_email: values.email, buyer_note: values.note });
  if (error) {
    if (error.hint === "order_name") return { errors: { name: "Tell us your name." }, values };
    if (error.hint === "order_phone") return { errors: { phone: "That phone number does not look right." }, values };
    if (error.hint === "order_email") return { errors: { email: "That email address does not look right." }, values };
    if (error.hint === "order_reach") return { errors: { phone: "Give a telephone number or an email address, so we can reach you." }, values };
    if (error.hint === "order_rate") return { message: "Five orders have come from you in the last hour. We have them: a person will be in touch.", values };
    if (error.hint === "order_busy") return { message: "Many orders have come in the last hour. Try again later.", values };
    if (error.hint === "order_item") return { message: "Something in your cart is no longer sold here. Take it out, and order the rest.", values };
    return { message: NOT_NOW, values };
  }
  const { number, total, on_request: onRequest } = placed as { number: number; total: number; on_request: boolean };
  revalidatePath("/account");
  revalidatePath("/admin/orders");
  return {
    ok: true,
    // The number and the total ride along for the page to show; the sentence is the one promise made.
    values: { number: String(number), total: String(total), onRequest: onRequest ? "yes" : "" },
    message: `We have your order, number ${number}${total ? `, for ${rupees(total)}` : ""}. A person will contact you with how to pay.${onRequest ? " For what is priced on request, they will give you the price first." : ""}`,
  };
}
