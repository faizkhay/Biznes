"use server";

import { headers } from "next/headers";
import { accountsOn } from "@/lib/accounts/config";
import { field, PHONE, SOON, typed, UUID, type FormState } from "@/lib/accounts/form";
import { owned } from "@/lib/accounts/owned";
import { db, publicDb } from "@/lib/accounts/server";
import { getViewer } from "@/lib/accounts/session";
import { mauritiusToday } from "@/lib/accounts/types";

// A request for a booking, from anyone: signed in or not. The form's own checks are repeated here,
// and the database has the last word (supabase/migrations, part 3): only a live business on Biznes
// Grow can be asked, a time must be still to come, and one telephone number can send only so many.

/** A careless loop or a lazy bot: no more than this many tries from one connection in ten minutes. */
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 8;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [key, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
  return recent.length > LIMIT;
}

const FIELDS = ["service", "date", "time", "name", "phone", "note"];

export async function requestBooking(_: FormState, data: FormData): Promise<FormState> {
  if (!accountsOn) return { message: SOON };
  const values = typed(data, FIELDS);
  // A filled honeypot gets a quiet success: the bot learns nothing.
  if (field(data, "website")) return { ok: true, message: "Your request has been sent." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return { message: "Too many requests have come from this connection. Wait a few minutes, or call the business.", values };

  const id = field(data, "business");
  const business = UUID.test(id) ? (await owned()).byId.get(id) : undefined;
  if (!business?.books) return { message: "This business is not taking bookings here just now. Call it to book.", values };

  const service = field(data, "service");
  const date = field(data, "date", 10);
  const time = field(data, "time", 5);
  const name = field(data, "name", 80);
  const phone = field(data, "phone", 40);
  const note = field(data, "note", 500);
  const errors: Record<string, string> = {};
  if (service && !business.services.some((s) => s.id === service)) errors.service = "Choose one of the services listed.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Choose the day you would like.";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Choose the time you would like.";
  // The day and the time are Mauritius's own: UTC+4, with no summer time.
  const wanted = errors.date || errors.time ? undefined : new Date(`${date}T${time}:00+04:00`);
  if (wanted && Number.isNaN(wanted.getTime())) errors.date = "That is not a day in the calendar.";
  else if (wanted && wanted.getTime() <= Date.now()) errors[date < mauritiusToday() ? "date" : "time"] = "Choose a time that is still to come.";
  else if (wanted && wanted.getTime() > Date.now() + 365 * 864e5) errors.date = "Choose a day within the next year.";
  if (name.length < 2) errors.name = "Tell the business your name.";
  if (!phone) errors.phone = "Give a number the business can reach you on.";
  else if (!PHONE.test(phone)) errors.phone = "That phone number does not look right.";
  if (Object.keys(errors).length || !wanted) return { errors, values };

  // Signed in, the request is made as that person, so it is kept with their account. Otherwise as a visitor.
  const viewer = await getViewer();
  const supabase = viewer ? await db() : publicDb();
  const { error } = await supabase.from("bookings").insert({ business_id: business.id, service_id: service || null, name, phone, wanted_at: wanted.toISOString(), note });
  if (error) {
    if (error.hint === "booking_rate") return { message: "Several requests have already come from this number. Try again later, or call the business.", values };
    if (error.hint === "booking_busy") return { message: "This business has had many requests in the last hour. Try again later, or call it.", values };
    if (error.hint === "booking_past") return { errors: { time: "Choose a time that is still to come." }, values };
    if (error.hint === "booking_service") return { errors: { service: "That service is no longer offered. Choose another." }, values };
    if (error.code === "42501") return { message: "This business is not taking bookings here just now. Call it to book.", values };
    return { message: "Your request could not be sent just now. Try again in a moment, or call the business.", values };
  }
  return {
    ok: true,
    message: `Your request has been sent to ${business.name}. It is not a booking until they confirm it: they will reach you on ${phone}. ${
      business.juiceNumber ? `Pay by MCB Juice to ${business.juiceNumber}, in the name of ${business.juiceName}. You pay the business directly: biznes.mu takes no part in the payment.` : "You pay the business directly."
    }${viewer ? " It is kept in your account." : ""}`,
  };
}
