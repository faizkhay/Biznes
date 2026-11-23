// The directory's icons: one for each of its thirteen groups and one for each kind of business
// (data/index/categories.json). Each is a drawing of the thing itself, with the set's one solid
// point where it means something: the keyhole, the bulb, the olive in the glass.
import { box, ring, type Drawing } from "./draw";

// Drawings that more than one thing wears.
const CAR = "M4 16.5v-3.2a2 2 0 0 1 .6-1.4L6 10.5l1.2-3.6a2 2 0 0 1 1.9-1.4h5.8a2 2 0 0 1 1.9 1.4L18 10.5l1.4 1.4a2 2 0 0 1 .6 1.4v3.2H4ZM6.5 16.5v2M17.5 16.5v2M6 10.5h12";
/** A fork and a knife, and the plate between them as the point. */
export const CUTLERY: Drawing = ["M5.5 3.5v17M3 3.5v4a2.5 2.5 0 0 0 5 0v-4M18.5 20.5v-7M18.5 13.5c-1.7 0-3-1.3-3-3.8 0-3.4 1.4-6.2 3-6.2v10Z", 12, 12];
/** A mortarboard; the point is the end of its tassel. */
const CAP: Drawing = ["M1.5 9.5 11 5l9.5 4.5L11 14 1.5 9.5ZM5.5 11.5V16c1.5 1.4 3.4 2 5.5 2s4-.6 5.5-2v-4.5M20.5 9.5v4", 20.5, 15.5];
/** A public building under a dome; the point is the finial. */
const DOME: Drawing = ["M3.5 20.5h17M5 17.5h14M7 17.5v-5M12 17.5v-5M17 17.5v-5M5 12.5h14M7 12.5a5 5 0 0 1 10 0", 12, 5.25];
/** An office block; the point is the one lit window. */
const TOWER: Drawing = ["M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 5v15.5M15 9.5h3.5A1.5 1.5 0 0 1 20 11v9.5M3.5 20.5h17M8.5 7.5h3M8.5 16.5h3", 10, 12];
/** A carton of chips. */
export const CHIPS: Drawing = ["M6.5 11 8 20.5h8L17.5 11M6.5 11c2 1.2 9 1.2 11 0M8.5 10.5V5M11 11V3.5M13.5 11V4.5M16 10.5V6", 12, 15.75];
/** A slice of bread. */
const BREAD: Drawing = ["M5.5 10.5A3.5 3.5 0 0 1 7 4h10a3.5 3.5 0 0 1 1.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19v-8.5Z", 12, 12.5];
/** A shop front: any business, when nothing says which kind. */
export const SHOP: Drawing = ["M4 9.5 5.5 4.5h13L20 9.5a2.67 2.67 0 0 1-5.33 0 2.67 2.67 0 0 1-5.34 0 2.67 2.67 0 0 1-5.33 0M5.5 12.5V20h13v-7.5M13.5 20v-4.5h3V20", 9, 16];

/** The thirteen groups of the directory, by id. */
export const GROUPS: Record<string, Drawing> = {
  eat: CUTLERY,
  // A shopping bag; the point is its clasp.
  shops: ["M6 8h12l1 12.5H5L6 8ZM9 8V7a3 3 0 0 1 6 0v1", 12, 14],
  // A bed; the point is the sleeper's head.
  stay: ["M3.5 18.5v-12M3.5 14.5h17v4M20.5 14.5v-2a3 3 0 0 0-3-3h-6v5", 7.5, 10.5],
  // The cross of a place of care; the point is its middle.
  health: ["M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5V4Z", 12, 12],
  // A banknote; the point is its seal.
  money: [box(3, 6.5, 18, 11, 2) + "M3 10a3.5 3.5 0 0 0 3.5-3.5M17.5 6.5A3.5 3.5 0 0 0 21 10M21 14a3.5 3.5 0 0 0-3.5 3.5M6.5 17.5A3.5 3.5 0 0 0 3 14", 12, 12],
  // A car from the front; the point is its badge.
  motoring: [CAR + "M7 13.5h1M16 13.5h1", 12, 13.5],
  // A house; the point is a window with the light on.
  home: ["M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5", 12, 14],
  // Scissors; the point is the pin they turn on.
  beauty: [ring(6, 7, 2.5) + ring(6, 17, 2.5) + "M8 8.5 20 18M8 15.5 20 6", 12.4, 12],
  learning: CAP,
  // A briefcase; the point is its clasp.
  offices: [box(3.5, 7.5, 17, 12, 2) + "M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h6M14.5 12.5h6", 12, 12.5],
  // The sun over the sea; the point is the sun.
  leisure: [
    "M12 4.5V3M8 8.5H6.5M16 8.5h1.5M9 5.5l-1-1M15 5.5l1-1M9 11.5l-1 1M15 11.5l1 1M3 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 20.5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0",
    12,
    8.5,
    2.25,
  ],
  public: DOME,
  companies: TOWER,
};

/** Each kind of business, by its id in the index. */
export const CATEGORIES: Record<string, Drawing> = {
  // Eat and drink: the five stand side by side on Baz Manzer.
  // A plate between a fork and a knife; the point is what is served.
  restaurants: ["M2.5 3.5V7a2 2 0 0 0 4 0V3.5M4.5 9v11.5" + ring(12.75, 12, 4.75) + "M21 20.5v-17c-1.8.8-2.5 3.6-2.5 6.3 0 1.9.8 3.2 2.5 3.2", 12.75, 12],
  "fast-food": CHIPS,
  // A cup on its saucer, steaming; the point is the mark on the cup.
  cafes: ["M5 10h11v3a5.5 5.5 0 0 1-11 0v-3ZM16 11h1.5a2.5 2.5 0 0 1 0 5h-2M3.5 20.5h14M8.5 7c-1-1.2 1-2 0-3.5M12.5 7c-1-1.2 1-2 0-3.5", 10.5, 14],
  // A cocktail glass; the point is the olive.
  bars: ["M4 5h16l-8 8.5L4 5ZM12 13.5v7M8 20.5h8", 12, 8],
  bakeries: BREAD,

  // Shops.
  // A shopping basket; the point is what is in it.
  supermarkets: ["M3.5 10h17l-2 10h-13l-2-10ZM8 10l4-6 4 6M8.5 13.5v3M15.5 13.5v3", 12, 15],
  // A tabagie under its awning; the point is the shopkeeper at the counter.
  "corner-shops": ["M3.5 8.5 5 4h14l1.5 4.5a2.83 2.83 0 0 1-5.67 0 2.83 2.83 0 0 1-5.66 0 2.83 2.83 0 0 1-5.67 0M5 11.5v9h14v-9M7.5 18h9", 12, 15],
  // A market stall; the point is the fruit on it.
  markets: ["M2.5 10l3-5.5h13l3 5.5h-19ZM4.5 10v10.5M19.5 10v10.5M4.5 16h15M13.5 16v-3H17v3", 9, 13.25],
  // Two shopping bags; the point is the clasp of the nearer.
  malls: ["M3.5 11h10l1 9.5h-12l1-9.5ZM6 11V9.5a2.5 2.5 0 0 1 5 0V11M12 7.5v-1h7.5l1 14H17M14 6.5v-1a2 2 0 0 1 4 0v1", 8.5, 15.5],
  // A carrot; the point is its crown.
  "fresh-food": ["M15.5 8.5c1.5 1.5 1 4-1.5 6.5-3 3-8.5 5.5-10 5-.5-1.5 2-7 5-10 2.5-2.5 5-3 6.5-1.5ZM16 8l1-4.5M16 8l4.5-1M16 8l3.5-3.5M9.5 12.5 11 14M7 15.5 8.5 17", 15.5, 8.5],
  // A bottle; the point is its label.
  "drinks-shops": ["M10 3h4v5c2 1 3 2.5 3 5v6.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 19.5V13c0-2.5 1-4 3-5V3ZM10 5.5h4", 12, 15],
  // A shirt; the point is the mark on its chest.
  clothes: ["M8.5 4 3 7l2 4 2.5-1v10.5h9V10l2.5 1 2-4-5.5-3a3.5 3.5 0 0 1-7 0Z", 12, 13],
  // A ring; the point is its stone.
  jewellery: [ring(12, 14.5, 6), 12, 6.25, 2.25],
  // A telephone; the point is its button.
  electronics: [box(6.5, 2.5, 11, 19, 2.5) + "M10.5 5.5h3", 12, 17.5, 1.75],
  // An open book; the point is the picture on the page.
  "books-stationery": ["M12 6.5C10 5 7 4.5 3 4.5V18c4 0 7 .5 9 2 2-1.5 5-2 9-2V4.5c-4 0-7 .5-9 2ZM12 6.5V20M6 9.5h3M6 13h3", 16.5, 11],
  // A present; the point is the knot of its ribbon.
  "gifts-crafts": [box(3.5, 8, 17, 4, 1) + "M5 12v8.5h14V12M12 12v8.5M12 8C10.5 5.5 8 3.5 6.5 5S8 8 12 8ZM12 8c1.5-2.5 4-4.5 5.5-3S16 8 12 8Z", 12, 8],
  // A bicycle; the point is the crank.
  "sports-outdoor": [ring(5.75, 15.5, 3.75) + ring(18.25, 15.5, 3.75) + "M5.75 15.5 9.5 9l2.5 6.5L16 9H9.5M16 9l2.25 6.5M8 7h3M9.5 9V7M17.5 6.5h-2L16 9", 12, 15.5, 1.75],
  // A flower; the point is its heart.
  "florists-garden": ["M10.1 5.9a2.2 2.2 0 1 1 3.8 0 2.2 2.2 0 1 1 1.15 3.6 2.2 2.2 0 1 1-3.05 2.2 2.2 2.2 0 1 1-3.05-2.2 2.2 2.2 0 1 1 1.15-3.6ZM12 14.5V21M12 18.5c0-2 1.5-3.5 4.5-3.5 0 2-1.5 3.5-4.5 3.5Z", 12, 8.5],
  // A cat; the point is its nose.
  pets: ["M5 4.5 8.5 8h7L19 4.5V13a7 7 0 0 1-14 0V4.5ZM8.5 12H10M14 12h1.5", 12, 15, 1.75],
  // A price tag; the point is the hole for its string.
  "other-shops": ["M3.5 4.5a1 1 0 0 1 1-1H12l8.6 8.6a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0L3.5 12V4.5Z", 8, 8],

  // Places to stay.
  // The bell on a reception desk; the point is its button.
  hotels: ["M3 17h18v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19v-2ZM5 17a7 7 0 0 1 14 0M12 10V8.5", 12, 6.5],
  // A door key; the point is the eye of its bow.
  "guest-houses": [ring(8, 9, 4.5) + "M11.2 12.2l8.3 8.3M16 17l2-2M18.5 19.5l2-2", 8, 9, 1.75],

  // Health.
  // A capsule and a tablet; the point is the tablet.
  pharmacies: ["M4.4 12.9l8.5-8.5a3 3 0 0 1 4.2 4.2l-8.5 8.5a3 3 0 0 1-4.2-4.2ZM8.6 8.6l4.3 4.3", 17.5, 17.5, 2.25],
  // A stethoscope; the point is the piece laid on the chest.
  doctors: ["M6 3.5v6a4.5 4.5 0 0 0 9 0v-6M4.5 3.5H6M15 3.5h1.5M10.5 14v2a4 4 0 0 0 8 0v-1.5", 18.5, 12.5],
  // A hospital with its cross; the point is the lamp on the roof.
  hospitals: ["M5 20.5V8h14v12.5M3 20.5h18M12 11v5M9.5 13.5h5", 12, 5.5],
  // A tooth; the point is a filling.
  dentists: ["M7.5 3.5c-2 0-3.5 1.5-3.5 4 0 2 1 3.5 1.5 5.5.5 2.5.5 7.5 2.5 7.5s1.5-5.5 4-5.5 2 5.5 4 5.5 2-5 2.5-7.5c.5-2 1.5-3.5 1.5-5.5 0-2.5-1.5-4-3.5-4-1.5 0-3 1-4.5 1s-3-1-4.5-1Z", 12, 9.5],
  // An eye; the point is the pupil.
  opticians: ["M2.5 12c2.5-4 5.5-6 9.5-6s7 2 9.5 6c-2.5 4-5.5 6-9.5 6s-7-2-9.5-6Z", 12, 12, 2.5],
  // A laboratory flask; the point is a bubble in it.
  "health-services": ["M9.5 3.5h5M10.5 3.5V9l-5 8.8A1.5 1.5 0 0 0 6.8 20h10.4a1.5 1.5 0 0 0 1.3-2.2L13.5 9V3.5M8 14h8", 12, 17],

  // Money and insurance.
  // A bank's columns and pediment; the point is the seal in the pediment.
  banks: ["M3.5 20.5h17M5 17.5h14M6.5 17.5v-7M10.25 17.5v-7M13.75 17.5v-7M17.5 17.5v-7M3.5 10.5V9L12 4l8.5 5v1.5h-17Z", 12, 7.75, 1.75],
  // A note coming out of a slot; the point is the note's seal.
  atms: [box(3, 4, 18, 5.5, 1.5) + "M7 6.75h10M7 9.5v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-8M7 15.5a3 3 0 0 1 3 3M17 15.5a3 3 0 0 0-3 3", 12, 13, 1.75],
  // One coin goes and another comes back; the point is the coin that goes.
  "money-exchange": ["M8 8h11.5M16 4.5 19.5 8 16 11.5M16 16H4.5M8 12.5 4.5 16 8 19.5" + ring(19, 16, 1.75), 5, 8],
  // An umbrella; the point is its tip.
  insurance: ["M4 13a8 8 0 0 1 16 0c-1.3-1.5-4-1.5-5.3 0-1.4-1.5-4-1.5-5.4 0-1.3-1.5-4-1.5-5.3 0ZM12 13v6a2 2 0 0 1-4 0", 12, 3.75, 1.75],
  // A line rising on a chart; the point is where it has reached.
  finance: ["M4 4v16h16.5M7.5 15.5l3.5-4 3 2.5 4-5.5", 18.5, 7.5],

  // Cars and transport.
  // A pump; the point is the nozzle.
  fuel: ["M4.5 20.5v-15a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15M3 20.5h13M7 6.5h5v4H7zM14.5 12H16a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0v-7L18 7.5", 17.5, 5.75, 1.75],
  // A spanner; the point is the nut.
  "car-repair": ["M4.44 17.44l8-8a4.5 4.5 0 0 1 6-6l-2.5 2.5 2.12 2.12 2.5-2.5a4.5 4.5 0 0 1-6 6l-8 8a1.5 1.5 0 0 1-2.12-2.12Z", 18, 17.5],
  // A battery; the point marks one terminal and the dash the other.
  "car-parts": [box(3.5, 8.5, 17, 11.5, 1.5) + "M6.5 8.5V6H10v2.5M14 8.5V6h3.5v2.5M14 14.25h3.5", 8.25, 14.25],
  // A car under a showroom's roof; the point is its badge.
  "car-dealers": ["M2.5 8.5 12 3.5l9.5 5M5 19v-2.7a2 2 0 0 1 .6-1.4l1.2-1.2 1-2.6a1.8 1.8 0 0 1 1.7-1.1h5a1.8 1.8 0 0 1 1.7 1.1l1 2.6 1.2 1.2a2 2 0 0 1 .6 1.4V19H5ZM7 19v1.5M17 19v1.5M6.8 13.7h10.4", 12, 16.25, 1.75],
  // A car key; the point is its button.
  "car-rental": [box(2.5, 8, 9.5, 8, 3) + "M12 12h9.5M17 12v2.5M20 12v2", 7.25, 12, 1.75],
  // A taxi; the point is the lamp on its roof.
  taxis: ["M4 18.5v-3.2a2 2 0 0 1 .6-1.4L6 12.5l1.2-3.6a2 2 0 0 1 1.9-1.4h5.8a2 2 0 0 1 1.9 1.4L18 12.5l1.4 1.4a2 2 0 0 1 .6 1.4v3.2H4ZM6.5 18.5v2M17.5 18.5v2M6 12.5h12M7 15.5h1.5M15.5 15.5H17", 12, 5.25],
  // A steering wheel; the point is its hub.
  "driving-schools": [ring(12, 12, 8.5) + "M3.5 12h6M14.5 12h6M12 14.5v6", 12, 12, 2.5],

  // Home and building.
  // A claw hammer; the point is the end of its handle.
  hardware: ["M5.5 3.5h4v1H13c3 0 5.5 1.5 7 4-2-.8-4-1-6-1H9.5V9h-4a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1ZM10.5 7.5v10M13.5 7.5v10", 17.3, 17.3, 2, "rotate(-45 12 12)"],
  // An armchair; the point is the button on its back.
  furniture: ["M6 11V7.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V11M3.5 12.75a1.75 1.75 0 0 1 3.5 0V15h10v-2.25a1.75 1.75 0 0 1 3.5 0V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5.25ZM6 19v1.5M18 19v1.5", 12, 10],
  // A hard hat; the point is its lamp.
  trades: ["M4.5 15.5v-2a7.5 7.5 0 0 1 15 0v2" + box(2.5, 15.5, 19, 3, 1) + "M12 6v2.5", 12, 11.5],
  // A key whose bow is a house; the point is the eye of the key.
  "estate-agents": ["M3 11.5 7.5 7l4.5 4.5V17H3v-5.5ZM12 14h9.5M17.5 14v2.5M20.5 14v2", 7.5, 13, 1.75],
  // A washing machine; the point is its dial.
  laundry: [box(4, 2.5, 16, 19, 2) + "M4 9h16M13 5.75h4" + ring(12, 15, 3.75), 8, 5.75, 1.75],

  // Beauty and wellbeing.
  // A hair dryer; the point is its motor.
  hairdressers: ["M3.5 7.5 12 4.9a5 5 0 1 1 0 9.2L3.5 11.5v-4ZM12.5 14.3v5.2a1.5 1.5 0 0 0 3 0v-4.8", 14, 9.5],
  // A lotus; the point is the drop above it.
  "beauty-salons": ["M12 6.5c2 2 3 4.5 3 7 0 2-1.2 3.6-3 4.5-1.8-.9-3-2.5-3-4.5 0-2.5 1-5 3-7ZM9.2 11.3C7.8 10.2 5.7 9.6 3.5 9.5c0 4 2.5 7.5 6.5 8.5h2M14.8 11.3c1.4-1.1 3.5-1.7 5.7-1.8 0 4-2.5 7.5-6.5 8.5h-2M5 20.5h14", 12, 3.5, 1.75],
  // A dumbbell; the point is the grip.
  fitness: ["M8.5 12h7" + box(5.5, 7, 3, 10) + box(2.5, 9, 3, 6) + box(15.5, 7, 3, 10) + box(18.5, 9, 3, 6), 12, 12],

  // Schools and training.
  // A schoolhouse; the point is its clock.
  schools: ["M3.5 20.5v-8H8V8.5L12 5l4 3.5v4h4.5v8M2.5 20.5h19M10.5 20.5v-4h3v4", 12, 10, 1.75],
  colleges: CAP,
  // A board on an easel; the point is what the lesson is about.
  training: [box(3.5, 4, 17, 11, 1.5) + "M8.5 20.5l2-5.5M15.5 20.5l-2-5.5M7 8h5M7 11.5h3", 16, 9.5],

  // Offices and professional services.
  // The scales; the point is the pin they hang from.
  lawyers: ["M12 7.5v13M8 20.5h8M5 7.5h14M5 7.5l-2.25 6a2.25 2.25 0 0 0 4.5 0L5 7.5M19 7.5l-2.25 6a2.25 2.25 0 0 0 4.5 0L19 7.5", 12, 5.5],
  // A mast sending; the point is the transmitter.
  "it-telecom": ["M8.5 20.5 12 10l3.5 10.5M7.5 4a5.5 5.5 0 0 0 0 7M16.5 4a5.5 5.5 0 0 1 0 7M4.5 2.5a9 9 0 0 0 0 10M19.5 2.5a9 9 0 0 1 0 10", 12, 7.5],
  // A cog; the point is its axle.
  "architects-engineers": ["M10.3 5.9 10.5 3.5h3l.2 2.4 1.4.6L17 5l2 2-1.5 1.9.6 1.4 2.4.2v3l-2.4.2-.6 1.4L19 17l-2 2-1.9-1.5-1.4.6-.2 2.4h-3l-.2-2.4-1.4-.6L7 19l-2-2 1.5-1.9-.6-1.4-2.4-.2v-3l2.4-.2.6-1.4L5 7l2-2 1.9 1.5Z", 12, 12, 2.5],
  // An aeroplane; the point is the place it leaves.
  "travel-agents": ["M0-7.5c.8.7 1.1 1.6 1.1 2.8v2.2L7 1v1.8L1.1.9v3.4l2.2 1.7V7.3L0 6.4l-3.3.9V6l2.2-1.7V.9L-7 2.8V1l5.9-3.5v-2.2c0-1.2.3-2.1 1.1-2.8Z", 4.5, 19.5, 2, "translate(13.5 10.5) rotate(45)"],
  // A parcel; the point is its label.
  logistics: ["M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5", 8, 14.5, 1.75],
  // A marquee; the point is the ball on its pole.
  "event-venues": ["M2.5 11.5 12 5.5l9.5 6M2.5 11.5c1.6 1.5 3.2 1.5 4.75 0 1.6 1.5 3.2 1.5 4.75 0 1.6 1.5 3.2 1.5 4.75 0 1.6 1.5 3.2 1.5 4.75 0M4.5 13v7.5M19.5 13v7.5M9.5 20.5c0-3 1-5.5 2.5-7.5 1.5 2 2.5 4.5 2.5 7.5M3 20.5h18", 12, 3.75, 1.75],
  // A candle; the point is the heart of its flame.
  funeral: ["M9.5 20.5v-7.3c1 .8 1.5.8 2.5 0s1.5-.8 2.5 0v7.3M6.5 20.5h11M12 12.6v-1.9M12 3c1.8 2 2.8 3.3 2.8 4.8a2.8 2.8 0 0 1-5.6 0C9.2 6.3 10.2 5 12 3Z", 12, 7.8, 1.5],
  // A shield; the point is its boss.
  "security-firms": ["M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z", 12, 11.5, 2.25],
  // Three people; the point is the head of the one in front.
  associations: ["M7.5 19.5v-2a4.5 4.5 0 0 1 9 0v2" + ring(5, 9.5, 1.75) + ring(19, 9.5, 1.75) + "M2.5 18.5V17a3.5 3.5 0 0 1 3-3.45M21.5 18.5V17a3.5 3.5 0 0 0-3-3.45", 12, 8, 2.5],
  // A desk lamp; the point is the bulb.
  "other-offices": ["M5.5 20.5h10M10.5 20.5 8 12l5-5M12 9.5a4.5 4.5 0 0 1 9 0Z", 16.5, 11.75],

  // Things to do.
  // Mountains; the point is the sun.
  attractions: ["M2.5 19.5 9 8l4 7 2.5-4 6 8.5Z", 17.5, 6, 2.25],
  // A flag on a golf green; the point is the ball.
  sports: ["M8 20.5V3.5l8 3.5-8 3.5M3.5 20.5h17", 15, 17.75],
  // A die; the point is the middle of its three.
  casinos: [box(4, 4, 16, 16, 3.5) + "M8 8v.01M16 16v.01", 12, 12, 2.25, "rotate(-12 12 12)"],

  // Public services.
  government: DOME,
  // The lamp on an emergency vehicle; the point is the bulb.
  "police-fire": ["M7 16v-4.5a5 5 0 0 1 10 0V16" + box(4.5, 16, 15, 4, 1) + "M12 2.5v2M4.5 5.5 6 7M19.5 5.5 18 7M2.5 11.5h2M19.5 11.5h2", 12, 12],
  // A letter; the point is its seal.
  "post-offices": [box(3, 5.5, 18, 13, 2) + "M3.5 7l8.5 6.5L20.5 7", 12, 13.5],
  // A passport; the point is its emblem.
  embassies: ["M6 3h11.5A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5H6V3ZM9.5 15.5h6M10.5 18h4", 12.5, 9.5, 2.25],
  // A person under a roof; the point is the person's head.
  community: ["M3 11 12 4.5l9 6.5M7 20.5v-1a5 5 0 0 1 10 0v1", 12, 11.5, 2.25],

  // Companies and organisations.
  companies: TOWER,
};
