// The businesses for sale. Adding one is one entry here, plus its wordmark in
// scripts/make-wordmarks.mjs: the home page's rail, the catalogue, its own page, the request form,
// the sitemap, the structured data and llms.txt all read this list.
//
// Sources:
//   U   the owner, in conversation, 16 November 2026: "LePalatier.mu a restaurant/cafe, exclusive
//       brand look and feel, ideally has a spot in the middle of moka, grand baie or tamarin", and a
//       proposed price of 350k.
//   KD  Khay Digital's creative direction for this build (the owner gave carte blanche): each brand's
//       look, its lettering and its colours. A first direction, to confirm.
//   C   The mock-up the owner approved on 17 November 2026 (.impeccable/mocks/comp-b-perspective.png):
//       LePalatier's wall colour is sampled from it (#711425). The samples' walls are chosen to sit
//       beside it on the street, and are placeholders like the rest of each sample.
//
// `sample: true` marks a listing the owner asked for as a placeholder ("5 other random for now").
// A sample wears a "Sample listing" mark on its tag and its page, is kept out of the structured
// data, and must be replaced or removed before launch (README, confirm list). Its name, look and
// price are placeholders, not offers.

import { WORDMARKS, type Wordmark } from "./wordmarks";

export type Status = "available" | "reserved" | "sold";

export type Business = {
  slug: string;
  /** The number on its tag, in the order the businesses were made. */
  number: string;
  name: string;
  /** Printed only once the owner confirms the domain is held. */
  domain?: string;
  /** What kind of business it is, in plain words. */
  sector: string;
  /** Where it is meant to open. */
  places: string[];
  /** Whole rupees. */
  price: number;
  status: Status;
  sample: boolean;
  /** One sentence: what it is. */
  line: string;
  /** The idea, in short paragraphs. */
  idea: string[];
  /** Where the name comes from, when it has a story. */
  nameNote?: string;
  /**
   * Its own identity. `ground` and `ink` are its sign: the lettering in `ink` on a board of
   * `ground`, a pair measured in DESIGN.md. `wall` is the colour its shopfront is painted, and
   * `accent` its trim: the sign's frame and its lamps.
   */
  brand: {
    wall: string;
    ground: string;
    ink: string;
    accent: string;
    /** The swatches as the brand would name them, in the order ground, ink, accent. */
    colours: [string, string, string];
  };
  /** What the buyer brings: the parts of a business no brand can supply. */
  bring: string[];
};

/** Said on every sample's own page, beside its name. */
export const SAMPLE_NOTE =
  "This is a sample listing. It shows how a business is presented here. The name, the look and the price are placeholders, and it is not for sale.";

export const BUSINESSES: Business[] = [
  {
    slug: "lepalatier",
    number: "01",
    name: "LePalatier",
    sector: "Restaurant and café",
    places: ["Moka", "Grand Baie", "Tamarin"],
    price: 350000, // U, proposed: to confirm
    status: "available",
    sample: false,
    line: "A restaurant and café brand with a look and feel made for it alone.",
    idea: [
      "LePalatier is a restaurant and café, ready for a place at the centre of things: the middle of Moka, Grand Baie or Tamarin.",
      "The identity is built for the table. Deep bordeaux, ivory and a little brass, with the name set in a classical serif that reads as well on a menu as over a door.",
      "The kitchen, the menu and the room are yours to shape. The brand is finished and waiting for them.",
    ],
    nameNote: "The name is built on the palate, the part of us that decides what is good.",
    brand: { wall: "#711425", ground: "#4a1626", ink: "#f3e9d8", accent: "#c6a15b", colours: ["Bordeaux", "Ivory", "Brass"] },
    bring: [
      "Premises in Moka, Grand Baie or Tamarin, and the lease",
      "The fit-out, the kitchen and the equipment",
      "Licences and permits for food and drink",
      "The chef, the menu and the team",
      "Working capital for the first months",
    ],
  },
  {
    slug: "lakrem",
    number: "02",
    name: "Lakrem",
    sector: "Ice cream parlour",
    places: ["Grand Baie", "Flic en Flac"],
    price: 280000,
    status: "available",
    sample: true,
    line: "An ice cream parlour brand, named the Kreol way.",
    idea: ["Lakrem is an ice cream parlour for the coast: a counter, a short list of flavours and a name people already know how to say."],
    nameNote: "Lakrem is Kreol for cream.",
    brand: { wall: "#f0a92b", ground: "#fcefd9", ink: "#a61e3c", accent: "#8fb37a", colours: ["Cream", "Cherry", "Pistachio"] },
    bring: ["A shop or a kiosk, and its lease", "Freezers, a counter and equipment", "Food licences and permits", "The recipes and the team"],
  },
  {
    slug: "souffle",
    number: "03",
    name: "Souffle",
    sector: "Pilates and breathwork studio",
    places: ["Moka", "Ebène"],
    price: 320000,
    status: "available",
    sample: true,
    line: "A Pilates and breathwork studio brand, light and unhurried.",
    idea: ["Souffle is a small studio for classes of a few people at a time, with an identity as quiet as the room should be."],
    nameNote: "Souffle is French for breath.",
    brand: { wall: "#1c9a8f", ground: "#dce2d6", ink: "#2e3b33", accent: "#c28766", colours: ["Pale sage", "Deep sage", "Clay"] },
    bring: ["A studio space, and its lease", "Mats, reformers and equipment", "Qualified instructors", "A class timetable"],
  },
  {
    slug: "bouke",
    number: "04",
    name: "Bouké",
    sector: "Florist and flower delivery",
    places: ["Curepipe", "Quatre Bornes"],
    price: 220000,
    status: "available",
    sample: true,
    line: "A florist and flower delivery brand, named the way the island says bouquet.",
    idea: ["Bouké is a florist that takes orders online and delivers the same day, with a name that sounds like a gift."],
    brand: { wall: "#e8604c", ground: "#1f3a2d", ink: "#f4cfc9", accent: "#e98a6e", colours: ["Forest", "Blush", "Coral"] },
    bring: ["A workshop or a shop", "Flower suppliers", "A delivery vehicle or a courier", "A florist and the team"],
  },
  {
    slug: "larout",
    number: "05",
    name: "Larout",
    sector: "Private drivers and day tours",
    places: ["Islandwide"],
    price: 180000,
    status: "available",
    sample: true,
    line: "A private driver and day tour brand for visitors to the island.",
    idea: ["Larout is a driver and day tour service that takes bookings online: airport transfers, and days out planned around the visitor."],
    nameNote: "Larout is Kreol for the road.",
    brand: { wall: "#16808c", ground: "#0e5f6b", ink: "#f7e9cc", accent: "#f2a65a", colours: ["Lagoon", "Sand", "Amber"] },
    bring: ["Vehicles, or drivers with their own", "Tourism and transport licences", "Insurance", "The routes and the drivers"],
  },
  {
    slug: "kazprop",
    number: "06",
    name: "Kazprop",
    sector: "Home cleaning",
    places: ["Islandwide"],
    price: 150000,
    status: "available",
    sample: true,
    line: "A home cleaning brand that books by the week.",
    idea: ["Kazprop is a home cleaning service booked online by the week or the month, with a name that says what it does."],
    nameNote: "In Kreol, kaz is a house and prop is clean.",
    brand: { wall: "#5aa9e6", ground: "#ddeafb", ink: "#1b46c2", accent: "#7ed6b5", colours: ["Sky", "Cobalt", "Mint"] },
    bring: ["A trained team", "Cleaning equipment and products", "Transport", "Insurance"],
  },
];

export const getBusiness = (slug: string) => BUSINESSES.find((b) => b.slug === slug);

/** The wordmark drawn for a business. A listing without one fails the build, never the page. */
export function wordmarkFor(slug: string): Wordmark {
  const mark = WORDMARKS[slug];
  if (!mark) throw new Error(`No wordmark for "${slug}": add it to scripts/make-wordmarks.mjs and run npm run wordmarks.`);
  return mark;
}

export const STATUS_LABEL: Record<Status, string> = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
};
