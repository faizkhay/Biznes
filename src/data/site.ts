// Every fact about biznes.mu and the agency behind it, once. Each surface (the header, the footer,
// the forms' fallbacks, the structured data, llms.txt) reads from here, so no two can disagree.
//
// Sources:
//   U   the owner, in conversation, 15 to 20 November 2026.
//   K   Khay Digital's own published facts, https://www.khay.digital/llms.txt, read 16 November 2026.
// Anything marked "to confirm" is on the README's confirm list. What the search holds is not here:
// it is data/index, written by the crawler, and content/guides, each with its own sources.

export const site = {
  /** The name people say, and the address they type. */
  name: "biznes.mu",
  /** What it is, in one line (U: "the search engine for Mauritian businesses"). */
  line: "The search engine for business in Mauritius",
  /** One sentence for metadata and machines. */
  description:
    "biznes.mu is a search engine for business in Mauritius: a directory of businesses and services across the island, plain guides to starting and running a business with every fact sourced, and the official registers to check one against.",
  /**
   * False until the owner has confirmed the guides and chosen where requests go (README, "To
   * confirm"). While false, pages ask search engines not to index them and robots.txt closes the site.
   */
  launched: false,
  locale: "en_MU",

  /** The crawler, as it names itself once the site is live (crawler/config.mjs). */
  bot: { name: "BiznesBot", path: "/bot" },

  /** The agency that builds and runs the site (K). */
  builder: {
    name: "Khay Digital",
    legalName: "Khay Digital Ltd",
    brn: "C22187903",
    url: "https://khay.digital",
  },

  /**
   * How to reach the people behind the site. These are Khay Digital's own published routes (K),
   * used here until biznes.mu has its own: to confirm.
   */
  contact: {
    phone: "+230 5450 8600",
    phoneHref: "tel:+23054508600",
    whatsappHref: "https://wa.me/23054508600",
    email: "faiz@khay.digital",
    hours: "Monday to Thursday, 09:00 to 19:00, Mauritius time",
  },
} as const;

/** The pages in the header and the footer, in reading order. One label per page, everywhere. */
export const NAV = [
  { href: "/directory", label: "Directory" },
  { href: "/places", label: "Places" },
  { href: "/learn", label: "Learn" },
  { href: "/tools", label: "Tools" },
] as const;

/** The shelves of the guides page: who each set of guides is for. */
export const SHELVES = [
  { id: "business", label: "Starting and running a business", line: "Registration, companies, tax, VAT, staff, licences and the rest." },
  { id: "visitors", label: "Visiting Mauritius", line: "What to know before you come, and what there is to see and do." },
  { id: "newcomers", label: "Moving here", line: "The ways to live in Mauritius, and settling in once you have arrived." },
  { id: "everyday", label: "Living here", line: "The paperwork and the bills of everyday life." },
] as const;

/** The quieter pages, for the footer. */
export const MORE = [
  { href: "/emergency", label: "Emergency numbers" },
  { href: "/pricing", label: "List your business" },
  { href: "/shop", label: "Pocket guides" },
  { href: "/official", label: "Official pages" },
  { href: "/data", label: "Where the data comes from" },
  { href: "/bot", label: "Our crawler" },
  { href: "/privacy", label: "Privacy" },
] as const;

/** One label per intent, the same on every page. */
export const ACTIONS = {
  search: "Search",
  add: "Add or correct a listing",
  list: "List your business",
  send: "Send",
  call: "Call",
  website: "Visit website",
  directions: "Directions",
  whatsapp: "WhatsApp",
} as const;

/** Questions the first screen offers, each a real search. Chosen to show the three things it answers. */
export const EXAMPLES = ["pharmacy in Curepipe", "quincaillerie", "register a company", "VAT", "restaurants in Grand Baie"] as const;

/**
 * The plans a business can be listed on (U, 20 November 2026): their names, their prices in rupees
 * a month for each business, and what each gives, in the owner's words. How a plan is paid for is
 * not yet decided: to confirm. Until it is, a business asks for a plan and a person answers.
 */
export const PLANS = [
  { id: "free", name: "Biznes Free", price: 0, line: "A basic listing, free for good.", gives: ["A listing in the directory and in search", "Your name, what you do, where you are and how to reach you", "Correct it or take it out whenever you ask"] },
  { id: "go", name: "Biznes Go", price: 550, line: "Verified, and listed with priority.", gives: ["Everything in Biznes Free", "A verified mark, once we have checked the business is real", "Listed with priority, and marked as such"] },
  { id: "grow", name: "Biznes Grow", price: 1250, line: "Take bookings and sell your services online.", gives: ["Manage your bookings in one place", "Sell your services online", "Your own page to send customers to"] },
] as const;
export type PlanId = (typeof PLANS)[number]["id"];

/**
 * What the site holds itself to, in a line each. Each is said at length, with how it is kept, on
 * the page "Where the data comes from" and in PRODUCT.md ("Product Principles").
 */
export const PROMISES = ["Every listing says where it came from.", "Every figure in a guide names its source.", "A listing that pays to come first is marked as one.", "Our crawler takes no email addresses."] as const;

/** The sources of the index, as they must be credited. */
export const CREDITS = {
  osm: { label: "OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright", licence: "Open Database Licence 1.0" },
  wikidata: { label: "Wikidata", href: "https://www.wikidata.org/wiki/Wikidata:Licensing", licence: "CC0 1.0" },
} as const;
