// The picture behind the page, and when each one is shown. The site picks today's by itself
// (src/lib/theme.ts): a public holiday's look on its day, else the season's, else the lagoon.
// To change a picture, put a new file in public/themes and name it here. To add a look for a
// holiday, add a line to HOLIDAY_LOOKS; the dates themselves come from content/holidays.json,
// which is written from the official notice and never by hand here.

/** The pictures. Each is an illustration made for this site (see the .json beside each file). */
export const PICTURES = {
  lagoon: { src: "/themes/lagoon.jpg", small: "/themes/lagoon-sm.jpg", label: "Lagoon morning" },
  flamboyant: { src: "/themes/flamboyant.jpg", small: "/themes/flamboyant-sm.jpg", label: "Flamboyants in bloom" },
  cane: { src: "/themes/cane.jpg", small: "/themes/cane-sm.jpg", label: "Cane in flower" },
  lights: { src: "/themes/lights.jpg", small: "/themes/lights-sm.jpg", label: "Festival of lights" },
} as const;
export type PictureId = keyof typeof PICTURES;

/** The picture when nothing else applies. */
export const DEFAULT_PICTURE: PictureId = "lagoon";

/** The seasons, as month and day. A season may run over the new year. */
export const SEASONS: { id: string; picture: PictureId; from: string; to: string }[] = [
  { id: "summer", picture: "flamboyant", from: "11-15", to: "02-15" },
  { id: "harvest", picture: "cane", from: "06-15", to: "09-30" },
];

/**
 * How a public holiday looks, matched on its official name. `lead` is how many days before it the
 * look begins. A holiday with no line here still gets its name in the greeting on its day.
 */
export const HOLIDAY_LOOKS: { match: RegExp; greeting: string; picture?: PictureId; lead?: number }[] = [
  { match: /divali|deepavali|diwali/i, greeting: "Happy Divali", picture: "lights", lead: 2 },
  { match: /christmas/i, greeting: "Merry Christmas", picture: "lights", lead: 3 },
  { match: /new year/i, greeting: "Happy New Year" },
  { match: /independence|national day/i, greeting: "Happy Independence Day", lead: 1 },
  { match: /eid/i, greeting: "Eid Mubarak" },
  { match: /spring festival|chinese/i, greeting: "Happy Spring Festival" },
  { match: /labour/i, greeting: "Happy Labour Day" },
  { match: /ganesh/i, greeting: "Happy Ganesh Chaturthi" },
  { match: /shivarat/i, greeting: "Happy Maha Shivaratree" },
  { match: /ugadi|ougadi/i, greeting: "Happy Ugadi" },
];

/** The everyday greeting: hello, in Kreol. */
export const GREETING = "Bonzour";
