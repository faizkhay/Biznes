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

  /** The agency that builds and runs the site (K), and who developed it (U, 20 November 2026). */
  builder: {
    name: "Khay Digital",
    developer: "Faiz Khayrattee",
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

/**
 * The menu, grouped: what a visitor may be after, in three words. Each line says what is behind it.
 * The header opens these as lists; the footer and the phone's tab bar use NAV.
 */
export const MENU = [
  {
    label: "Explore",
    items: [
      { href: "/directory", label: "Directory", line: "Every kind of business, by category" },
      { href: "/places", label: "Places", line: "Town by town, village by village" },
      { href: "/baz-manzer", label: "Baz Manzer", line: "Where to eat, by kind of food and by town" },
      { href: "/emergency", label: "Emergency numbers", line: "Who to call, from official pages" },
      { href: "/holidays", label: "Public holidays", line: "Every date, with its day of the week" },
      { href: "/shop", label: "Pocket Guide", line: "Mauritius, place by place, on your phone" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/learn", label: "Articles", line: "Mauritius explained, with its sources" },
      { href: "/tools", label: "Tools", line: "VAT, legal structures, checking a business" },
      { href: "/learn/glossary", label: "Glossary", line: "BRN, TAN, CSG and the other initials" },
      { href: "/official", label: "Official pages", line: "The registers and the forms themselves" },
    ],
  },
  {
    label: "For business",
    items: [
      { href: "/pricing", label: "List your business", line: "Biznes Free, Go and Grow" },
      { href: "/add", label: "Add or correct a listing", line: "Put a listing right, or take it out" },
      { href: "/shop#sponsor", label: "Sponsor the Pocket Guide", line: "A place for your business in a coming edition" },
      { href: "/data", label: "Where the data comes from", line: "Sources, order, and what is never taken" },
    ],
  },
] as const;

/**
 * The first things under the search on the first screen: the pages people most often need, as a
 * start page for Mauritius. Each is a page of the menu, named as the menu names it; what is said
 * under each name is counted from the data on the day.
 */
export const START = ["/baz-manzer", "/emergency", "/holidays", "/directory", "/learn", "/places"] as const;

/** The shelves of the guides page: who each set of guides is for. */
export const SHELVES = [
  { id: "mauritius", label: "About Mauritius", line: "The island, its people, its money, its weather and how it runs." },
  { id: "business", label: "Starting and running a business", line: "Registration, companies, tax, VAT, staff, licences and the rest." },
  { id: "food", label: "Food and eating out", line: "What is eaten here, and where to find it." },
  { id: "visitors", label: "Visiting Mauritius", line: "What to know before you come, and what there is to see and do." },
  { id: "newcomers", label: "Moving here", line: "The ways to live in Mauritius, and settling in once you have arrived." },
  { id: "everyday", label: "Living here", line: "The paperwork and the bills of everyday life." },
] as const;

/**
 * The kinds of business that go with an article: the directory categories a reader of it may want
 * next. An article ends with them, and a search for one of those kinds leads with the article.
 * Only where the tie is plain and holds both ways: the article about money goes with banks, and
 * someone looking for a bank may want it. None goes with a kind of business the index does not
 * hold (there is no category for accountants, so the tax articles have none). Articles on the food
 * shelf go with every category for eating and drinking without being named here.
 */
export const ARTICLE_BUSINESSES = {
  "money-and-banking-in-mauritius": ["banks", "atms", "money-exchange"],
  "getting-around-mauritius": ["taxis", "car-rental"],
  "visiting-mauritius": ["hotels", "guest-houses"],
  "things-to-do-in-mauritius": ["attractions"],
  "schools-and-universities-in-mauritius": ["schools", "colleges"],
  "settling-in-mauritius": ["banks", "estate-agents"],
  "support-and-finance": ["banks", "finance"],
} as const;

/**
 * Baz Manzer: the home of everything for eating and drinking (U, 20 November 2026: "special
 * category for food biznesses, we should have the best Baz Manzer on our apps"; and "food outlets
 * using biznes go (at least) can list their menu"). The name is Kreol for a place to eat.
 */
export const BAZ = {
  name: "Baz Manzer",
  href: "/baz-manzer",
  kicker: "Eat and drink",
  line: "Where to eat in Mauritius",
  meaning: "Baz manzer is Kreol for a place to eat.",
  owners: { title: "Run a place to eat?", line: "It is probably listed here already, free. On Biznes Go and Biznes Grow your page carries your own pictures and your menu." },
} as const;

/**
 * What biznes.mu publishes (U, 20 November 2026). There is one pocket guide, renewed every month:
 * "i suggest 1 big guide, like a biznes.mu pocket guide". The magazine is to come: "later we will
 * have 1 biznes.mu biznes magazine, where we list biznesses of the month etc, manual monthly
 * e-magazine release for free (for that we need a subcribers list for that and for our pocket
 * guide)". It is said to be coming, and nothing more is said of it than the owner has.
 */
export const PUBLICATIONS = {
  guide: { name: "biznes.mu Pocket Guide", short: "Pocket Guide", href: "/shop" },
  magazine: { name: "biznes.mu Biznes Magazine", short: "Biznes Magazine", line: "A free monthly e-magazine with the businesses of the month. It is on its way; no issue is out yet." },
} as const;

/** The last column of the footer: the site itself. The other columns are the menu's groups. */
export const ABOUT = [
  { href: "/about", label: "About biznes.mu" },
  { href: "/bot", label: "Our crawler" },
  { href: "/privacy", label: "Privacy" },
  { href: "/saved", label: "Saved" },
  { href: "/cart", label: "Cart" },
] as const;

/** The quieter pages, for the footer. */
export const MORE = [
  { href: "/about", label: "About" },
  { href: "/emergency", label: "Emergency numbers" },
  { href: "/holidays", label: "Public holidays" },
  { href: "/pricing", label: "List your business" },
  { href: "/shop", label: "Pocket Guide" },
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
  signIn: "Sign in",
  signUp: "Create an account",
  signOut: "Sign out",
  claim: "Claim this listing",
  book: "Ask for a booking",
} as const;

/** Questions the first screen offers, each a real search. Chosen to show the three things it answers. */
export const EXAMPLES = ["pharmacy in Curepipe", "quincaillerie", "register a company", "VAT", "restaurants in Grand Baie"] as const;

/**
 * The plans a business can be listed on (U, 20 November 2026): their names, their prices in rupees
 * a month for each business, and what each gives, in the owner's words. Biznes Grow holds everything in Biznes
 * Go. The fuller page and the menu are the owner's later words of the same day: "paid listings
 * should have a more beautiful biznes page", and "food outlets using biznes go (at least) can list
 * their menu". Plans will be paid for through Stripe, which is not connected yet: until it is, a business
 * asks for a plan and a person answers. A customer pays a business directly, by MCB Juice, from
 * the details the business shows; the site takes no part in that payment.
 */
export const PLANS = [
  { id: "free", name: "Biznes Free", price: 0, line: "A basic listing, free for good.", gives: ["Already yours if our crawler found you: every business on the open map is listed", "Claim the listing to show it is yours and keep it right", "Your name, what you do, where you are and how to reach you"] },
  { id: "go", name: "Biznes Go", price: 550, line: "Verified, and listed with priority.", gives: ["Everything in Biznes Free", "A verified mark, once we have checked the business is real", "Listed with priority, and marked as such", "A fuller page, with your own pictures", "For a place to eat: your menu on your page"] },
  { id: "grow", name: "Biznes Grow", price: 1250, line: "Everything in Go, with bookings and sales.", gives: ["Everything in Biznes Go", "Manage your bookings in one place", "Sell your services online", "Show your MCB Juice details, so customers can pay you"] },
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

/**
 * The street map: the one a visitor opens to see streets, pan and zoom. It is drawn in the
 * browser by MapLibre GL from OpenFreeMap's public vector tiles, which need no key and set no
 * limit on views (openfreemap.org, read 20 November 2026). The credit below is the one
 * OpenFreeMap asks for, and it is always shown on the map. Nothing is fetched from that host
 * until a visitor opens the map.
 */
export const STREET_MAP = {
  style: "https://tiles.openfreemap.org/styles/liberty",
  host: "tiles.openfreemap.org",
  credit: [
    { label: "OpenFreeMap", href: "https://openfreemap.org" },
    { label: "© OpenMapTiles", href: "https://www.openmaptiles.org/" },
    { label: "Data from OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
  ],
  /** Mauritius and Rodrigues, with sea around them: the map does not wander further. West, south, east, north. */
  bounds: [56.9, -20.9, 63.9, -19.3],
  /** The main island alone, for a map opened with nothing lit. */
  island: [57.28, -20.54, 57.83, -19.96],
} as const;

/**
 * The site's own pages that a search should find by name: who makes it, how to list a business,
 * the pocket guide. Each answers in a line of its own. `words` are what people type for it.
 */
export const PAGES = [
  { href: "/about", title: "About biznes.mu and Khay Digital", line: "biznes.mu is a product of Khay Digital, a Mauritian digital agency, and was developed by Faiz Khayrattee. Khay Digital builds websites and digital experiences.", words: "khay digital khaydigital faiz khayrattee agency web design website developer who made built owner about us contact" },
  { href: "/pricing", title: "List your business on biznes.mu", line: "Biznes Free is a basic listing at no cost. Biznes Go is Rs 550 a month: verified, and listed with priority. Biznes Grow is Rs 1,250 a month: everything in Go, with bookings and sales.", words: "list my business add business advertise price pricing plans biznes free go grow subscription verified claim" },
  { href: "/shop", title: "The biznes.mu pocket guide", line: "A guide to Mauritius for your phone, place by place, renewed every month, with every fact from an official source.", words: "pocket guide pdf magazine places to visit things to do sponsor sponsorship advert" },
  { href: "/data", title: "Where the data comes from", line: "Listings come from the open map and Wikidata, each saying its source. A paid place in the results is always marked.", words: "sources data openstreetmap wikidata order of results ranking correct remove privacy crawler" },
] as const;
