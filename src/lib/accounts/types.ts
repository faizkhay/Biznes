// The shapes of what the accounts database holds (supabase/migrations), and the one word the site
// uses for each state. Safe to read from a page or from the browser: there is no code here that
// talks to the database.
import type { PlanId } from "@/data/site";

export const ROLES = ["user", "admin", "superadmin"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_NAMES: Record<Role, string> = { user: "User", admin: "Admin", superadmin: "Superadmin" };
export const isRole = (v: unknown): v is Role => typeof v === "string" && (ROLES as readonly string[]).includes(v);

/** Whoever is signed in, as the pages need them. */
export type Viewer = { id: string; email: string; name: string; phone: string; role: Role };

export const STATUSES = ["pending", "live", "rejected", "suspended"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_NAMES: Record<Status, string> = { pending: "Waiting to be checked", live: "Live", rejected: "Not accepted", suspended: "Suspended" };

export const PAID_PLANS = ["go", "grow"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];
export const isPlan = (v: unknown): v is PlanId => v === "free" || v === "go" || v === "grow";
export const isPaidPlan = (v: unknown): v is PaidPlan => v === "go" || v === "grow";

export const BOOKING_STATUSES = ["requested", "confirmed", "declined", "cancelled", "done"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const BOOKING_NAMES: Record<BookingStatus, string> = { requested: "Requested", confirmed: "Confirmed", declined: "Declined", cancelled: "Cancelled", done: "Done" };

export type Business = {
  id: string;
  owner_id: string;
  listing_id: string | null;
  slug: string;
  name: string;
  category: string;
  town: string;
  address: string;
  phone: string;
  website: string;
  about: string;
  plan: PlanId;
  plan_until: string | null;
  verified: boolean;
  status: Status;
  status_note: string;
  created_at: string;
  updated_at: string;
};

export type PlanRequest = { id: string; business_id: string; requested_by: string | null; plan: PaidPlan; note: string; status: "open" | "done" | "declined"; handled_by: string | null; handled_at: string | null; created_at: string };

/** How a business is paid by MCB Juice: details only. The site takes no part in a payment. */
export type PayDetails = { business_id: string; juice_number: string; juice_name: string };

/**
 * A Mauritian mobile number as "5XXX XXXX": eight digits beginning with 5, with or without the
 * country's +230 in front. Empty if what was typed is not one.
 */
export function mobileNumber(typedIn: string): string {
  const digits = typedIn.replace(/\D/g, "").replace(/^230(?=\d{8}$)/, "");
  return /^5\d{7}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4)}` : "";
}

export type Service = { id: string; business_id: string; name: string; description: string; price_mur: number | null; minutes: number | null; active: boolean; created_at: string };

export type Booking = {
  id: string;
  business_id: string;
  service_id: string | null;
  customer_id: string | null;
  name: string;
  phone: string;
  wanted_at: string;
  note: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type Profile = { id: string; email: string | null; name: string; phone: string; role: Role; created_at: string };

/** Today's date in Mauritius (UTC+4, no summer time), as YYYY-MM-DD. */
export const mauritiusToday = (now = Date.now()) => new Date(now + 4 * 3600e3).toISOString().slice(0, 10);

/**
 * The plan a business is on today: a paid plan whose last day has passed counts as free. The same
 * rule as `plan_now` in the database, which is the one that decides anything.
 */
export const planNow = (plan: PlanId, until: string | null, today = mauritiusToday()): PlanId => (plan !== "free" && until && until < today ? "free" : plan);

/** A moment as it is in Mauritius: "Friday, 4 December 2026, 14:30". */
export function when(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Indian/Mauritius", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(at).replace(" at ", ", ");
}

/** A price in rupees: "Rs 1,250". */
export const rupees = (n: number) => `Rs ${new Intl.NumberFormat("en-GB").format(n)}`;

/** How long a service takes: "45 minutes", "1 hour", "1 hour 30 minutes". */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} ${h === 1 ? "hour" : "hours"}` : "", m ? `${m} minutes` : ""].filter(Boolean).join(" ");
}
