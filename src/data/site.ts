// Every fact about biznes.mu and the agency behind it, once. Each surface (the header, the footer,
// the form's fallbacks, the structured data, llms.txt) reads from here, so no two can disagree.
//
// Sources:
//   U   the owner, in conversation, 15 and 16 November 2026.
//   K   Khay Digital's own published facts, https://www.khay.digital/llms.txt, read 16 November 2026.
// Anything marked "to confirm" is on the README's confirm list.

export const site = {
  /** The name people say, and the address they type. */
  name: "biznes.mu",
  /** What it is, in one line (U). */
  line: "Ready-to-launch businesses in Mauritius",
  /** One sentence for metadata and machines. */
  description:
    "biznes.mu sells ready-to-launch businesses in Mauritius. Each one comes with its name and identity, its domain, its website and its strategy, built by Khay Digital and sold to one owner.",
  /**
   * False until the listings are real. While false, pages ask search engines not to index them and
   * robots.txt closes the site, so sample listings can never be found as if they were for sale.
   */
  launched: false,
  /** One switch hides every price on the site, if the owner prefers to quote in person. */
  showPrices: true,
  locale: "en_MU",

  /** The agency that builds every business sold here (K). */
  builder: {
    name: "Khay Digital",
    legalName: "Khay Digital Ltd",
    brn: "C22187903",
    url: "https://khay.digital",
    founded: "June 2020",
    founder: "Faïz Khayrattee",
    belief: "Anyone can make a website; Khay tells stories.",
  },

  /**
   * How to reach us. These are Khay Digital's own published routes (K), used here until biznes.mu
   * has its own: to confirm.
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
  { href: "/businesses", label: "Businesses" },
  { href: "/how-it-works", label: "How it works" },
] as const;

/** One label per intent, the same on every page (voice rule 6). */
export const ACTIONS = {
  browse: "See the businesses",
  how: "How it works",
  reserve: "Reserve this business",
  enquire: "Enquire",
  send: "Send a request",
  whatsapp: "WhatsApp",
  call: "Call us",
  email: "Email us",
} as const;
