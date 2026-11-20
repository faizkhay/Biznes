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

/** A request for a change of plan. Asked for as the free plan, it means: stop at the end of the period. */
export type PlanRequest = { id: string; business_id: string; requested_by: string | null; plan: PlanId; note: string; status: "open" | "done" | "declined"; handled_by: string | null; handled_at: string | null; created_at: string };

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

/** A month, written YYYY-MM, as it is now in Mauritius. */
export const thisMonth = (now = Date.now()) => mauritiusToday(now).slice(0, 7);
/** The month a number of months after another: `monthAfter("2026-12", 2)` is "2027-02". */
export function monthAfter(month: string, by = 1): string {
  const [y, m] = month.split("-").map(Number);
  const at = y * 12 + (m - 1) + by;
  return `${Math.floor(at / 12)}-${String((at % 12) + 1).padStart(2, "0")}`;
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** A month in words: "December 2026". */
export const monthName = (month: unknown) => (typeof month === "string" && /^\d{4}-\d{2}/.test(month) ? `${MONTH_NAMES[Number(month.slice(5, 7)) - 1] ?? ""} ${month.slice(0, 4)}`.trim() : "");
/** The months of a list, in words, with anything that is not a month left out: "December 2026, January 2027". */
export const monthNames = (months: unknown) => (Array.isArray(months) ? months.map(monthName).filter(Boolean).join(", ") : "");

/** What a paid plan adds to a business's page, as the database holds it (the pictures as paths in the bucket). */
export type ShowcaseRow = { business_id: string; tagline: string; hours: string[]; cover: string; photos: string[] };
export type MenuSectionRow = { id: string; business_id: string; title: string; position: number };
export type MenuItemRow = { id: string; section_id: string; business_id: string; name: string; description: string; price_mur: number | null; position: number };

/** A business's own record of a customer. */
export type Customer = { id: string; business_id: string; name: string; phone: string; phone_key: string; notes: string; created_at: string; updated_at: string };
/** How often a telephone number has booked with a business, counted by the database. */
export type CustomerTally = { business_id: string; phone_key: string; name: string; phone: string; bookings: number; done: number; last_wanted: string };

export const PAYMENT_METHODS = ["juice", "cash", "card", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_NAMES: Record<PaymentMethod, string> = { juice: "MCB Juice", cash: "Cash", card: "Card", transfer: "Bank transfer" };
/** A line of the ledger a business keeps by hand. The site takes no payment and checks none. */
export type Payment = { id: string; business_id: string; customer_id: string | null; booking_id: string | null; paid_on: string; payer: string; what: string; amount_mur: number; method: PaymentMethod; created_at: string };

/**
 * Where an advertisement may run: six places on the site, three on the pocket guide's sponsors'
 * pages, and the magazine. The guide's three are priced in content/pdf/sponsorship.json; the
 * others have no price yet and are shown as "Price on request".
 */
export const AD_PLACES = [
  { id: "home", name: "The first screen", where: "site", what: "Under the search box on the first page." },
  { id: "results", name: "Search results", where: "site", what: "Among the answers to a search." },
  { id: "listing", name: "A listing's page", where: "site", what: "On the pages of other listings." },
  { id: "food", name: "Food and drink", where: "site", what: "On the pages for places to eat and drink." },
  { id: "article", name: "The guides", where: "site", what: "Beside a guide to doing business." },
  { id: "directory", name: "The directory", where: "site", what: "On the pages that list businesses by kind and by town." },
  { id: "guide-listing", name: "Pocket guide: a sponsored listing", where: "guide", what: "Your name, what you do, your town and your number on the sponsors' page." },
  { id: "guide-panel", name: "Pocket guide: a sponsored panel", where: "guide", what: "A quarter of a page, with your picture and your own words." },
  { id: "guide-page", name: "Pocket guide: a sponsored page", where: "guide", what: "A full page of the guide to yourself. An edition carries four at most." },
  { id: "magazine", name: "The magazine", where: "magazine", what: "In the free monthly magazine, when it begins." },
] as const;
export type AdPlaceId = (typeof AD_PLACES)[number]["id"];
export const isAdPlace = (v: unknown): v is AdPlaceId => AD_PLACES.some((p) => p.id === v);
export const adPlace = (id: string) => AD_PLACES.find((p) => p.id === id);

export type AdStatus = "draft" | "submitted" | "approved" | "declined";
/** What an advertisement is doing today: its status, with "running" and "ended" read off the calendar. */
export type AdState = AdStatus | "running" | "ended";
export const AD_STATE_NAMES: Record<AdState, string> = { draft: "Draft", submitted: "With us to check", approved: "Approved", running: "Running", ended: "Ended", declined: "Not accepted" };
export type Ad = {
  id: string;
  business_id: string;
  headline: string;
  line: string;
  link_to: "page" | "website";
  /** The business's website as it was when an admin approved the advertisement, when it leads there. */
  link_url?: string;
  artwork: string;
  place: AdPlaceId;
  months: string[];
  status: AdStatus;
  paid: boolean;
  reason: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};
/** An advertisement as read from the database, with only what is a month among its months: a page never falls over on a row that holds something else. */
export const soundAd = (ad: Ad): Ad => ({ ...ad, months: (Array.isArray(ad.months) ? ad.months : []).filter((m): m is string => typeof m === "string" && /^\d{4}-\d{2}$/.test(m)) });

/** The same rule as `ad_state` in the database: approved and paid in a month it names is running; past its last month it has ended. */
export function adState(ad: Pick<Ad, "status" | "paid" | "months">, month = thisMonth()): AdState {
  if (ad.status !== "approved") return ad.status;
  // Only what is a month is read as one.
  const months = (Array.isArray(ad.months) ? ad.months : []).filter((m): m is string => typeof m === "string");
  if (months.every((m) => m < month)) return "ended";
  return ad.paid && months.includes(month) ? "running" : "approved";
}

export const ORDER_STATUSES = ["placed", "awaiting_payment", "paid", "fulfilled", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_NAMES: Record<OrderStatus, string> = { placed: "Placed", awaiting_payment: "Awaiting payment", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };
export type OrderItem = { id: number; order_id: string; item: string; kind: string; name: string; detail: string; unit_mur: number | null; per: "each" | "month"; qty: number };
export type Order = {
  id: string;
  number: number;
  customer_id: string | null;
  name: string;
  phone: string;
  email: string;
  note: string;
  total_mur: number;
  status: OrderStatus;
  admin_note: string;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscriber = { id: string; email: string; wants_guide: boolean; wants_magazine: boolean; token: string; confirmed_at: string | null; created_at: string };
