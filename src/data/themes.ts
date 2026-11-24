// The picture behind the page, what falls over the landing page, and when each is shown. The site
// picks today's by itself (src/lib/theme.ts): a public holiday's look on its day; on any other day
// one of the season's pictures, a different one each day and the same for everyone on that day.
// To add or change a picture, make its two files with `npm run picture` and name it here. To add a
// look for a holiday, add a line to HOLIDAY_LOOKS; the dates themselves come from
// content/holidays.json, which is written from the official notice and never by hand here.

/** A picture's two files: the wide one for a desk, and the tall one, painted again for a phone held upright. */
const picture = <Id extends string>(id: Id, label: string) => ({ src: `/themes/${id}.jpg`, tall: `/themes/${id}-tall.jpg`, label }) as const;

/** The pictures. Each is an illustration made for this site (see the .json beside each file). */
export const PICTURES = {
  lagoon: picture("lagoon", "Lagoon morning"),
  flamboyant: picture("flamboyant", "Flamboyants in bloom"),
  cane: picture("cane", "Cane in flower"),
  lights: picture("lights", "Festival of lights"),
  market: picture("market", "Market day"),
  teafields: picture("teafields", "Tea fields"),
  chamarel: picture("chamarel", "Chamarel"),
  harbour: picture("harbour", "The harbour"),
  village: picture("village", "A village"),
  sunset: picture("sunset", "Sunset"),
  litchi: picture("litchi", "Litchi season"),
  picnic: picture("picnic", "A picnic on the beach"),
  rain: picture("rain", "After the rain"),
  lilies: picture("lilies", "The lily pond"),
  kites: picture("kites", "Kites on the lagoon"),
  harvest: picture("harvest", "The cane harvest"),
  streetfood: picture("streetfood", "Street food at dusk"),
  lanterns: picture("lanterns", "Lanterns"),
} as const;
export type PictureId = keyof typeof PICTURES;

/** The picture when nothing else applies, and the one a missing file falls back to. */
export const DEFAULT_PICTURE: PictureId = "lagoon";

/**
 * What falls over the landing page, slowly (src/components/Leaves.tsx). `name` is the word its
 * control uses ("Pause the falling petals"); `shape` is its drawing (src/components/glyphs/falls.ts).
 * Its two colours are sampled from a picture of its season and kept in globals.css.
 */
export const FALLS = {
  flamboyant: { name: "petals", shape: "petal" },
  green: { name: "leaves", shape: "leaf" },
  plume: { name: "cane flowers", shape: "wisp" },
  dry: { name: "leaves", shape: "broad" },
  bougainvillea: { name: "petals", shape: "bract" },
} as const;
export type FallId = keyof typeof FALLS;

/**
 * The seasons, as month and day. A season may run over the new year. `picture` is the season's own;
 * `also` are the others it is shown in turn with, a different one each day; `fall` is what falls
 * over the landing page through it. Together they cover the year.
 */
export const SEASONS: { id: string; picture: PictureId; also: PictureId[]; fall: FallId; from: string; to: string }[] = [
  { id: "summer", picture: "flamboyant", also: ["litchi", "picnic", "sunset", "market", "harbour", "lagoon"], fall: "flamboyant", from: "11-15", to: "02-15" },
  { id: "rains", picture: "rain", also: ["lilies", "teafields", "chamarel", "streetfood", "lagoon"], fall: "green", from: "02-16", to: "04-30" },
  { id: "flower", picture: "cane", also: ["kites", "village", "teafields", "harbour"], fall: "plume", from: "05-01", to: "06-14" },
  { id: "harvest", picture: "harvest", also: ["kites", "chamarel", "village", "teafields", "cane"], fall: "dry", from: "06-15", to: "09-30" },
  { id: "spring", picture: "lilies", also: ["market", "streetfood", "harbour", "sunset", "lagoon"], fall: "bougainvillea", from: "10-01", to: "11-14" },
];

/** Were a day ever outside every season: the pictures of any day of the year, in turn, and what falls. The first is the default. */
export const EVERYDAY_PICTURES: PictureId[] = [DEFAULT_PICTURE, "chamarel", "harbour", "village", "market", "teafields", "sunset"];
export const EVERYDAY_FALL: FallId = "green";

/**
 * How a public holiday looks, matched on its official name. `lead` is how many days before it the
 * look begins. A holiday with no line here keeps the everyday greeting: a day of remembrance is not
 * wished happy.
 */
export const HOLIDAY_LOOKS: { match: RegExp; greeting: string; picture?: PictureId; lead?: number }[] = [
  { match: /divali|deepavali|diwali/i, greeting: "Happy Divali", picture: "lights", lead: 2 },
  { match: /christmas/i, greeting: "Merry Christmas", picture: "lights", lead: 3 },
  { match: /new year/i, greeting: "Happy New Year" },
  { match: /independence|national day/i, greeting: "Happy Independence Day", lead: 1 },
  { match: /eid/i, greeting: "Eid Mubarak" },
  { match: /spring festival|chinese/i, greeting: "Happy Spring Festival", picture: "lanterns", lead: 1 },
  { match: /labour/i, greeting: "Happy Labour Day" },
  { match: /ganesh/i, greeting: "Happy Ganesh Chaturthi" },
  { match: /shivarat/i, greeting: "Happy Maha Shivaratree" },
  { match: /ugaa?di|ougadi/i, greeting: "Happy Ugadi" },
];

/** The everyday greeting: hello, in Kreol. */
export const GREETING = "Bonzour";
