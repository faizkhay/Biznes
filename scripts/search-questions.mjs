// The questions the search is measured and compared with (scripts/search-measure.mjs).
//
// ASKED is written by hand: what a Mauritian would type, in English, French and Kreol, with the
// mistakes a thumb makes. drawn() adds questions taken from the index itself, the same ones every
// time: real names, a kind of business in a real town, and those names typed wrongly. Nothing here
// is shown on the site.

export const ASKED = [
  // Kinds of business, in the three languages.
  "pharmacy", "pharmacie", "farmasi", "pharmacies", "restaurant", "restaurants", "resto", "restoran", "snack", "quincaillerie", "hardware", "kinkayri",
  "boulangerie", "boulanjeri", "bakery", "dentist", "dentiste", "dokter", "docteur", "doctor", "lopital", "hopital", "hospital", "supermarket", "supermarché",
  "bank", "labank", "banque", "atm", "hotel", "lotel", "taxi", "garage", "school", "lekol", "école", "avocat", "lawyer", "notaire", "coiffeur", "hairdresser",
  "bar", "cafe", "café", "petrol station", "station service", "car rental", "location de voiture", "guest house", "gym", "bookshop", "librairie",
  // A kind and a town.
  "pharmacy in curepipe", "pharmacie rose hill", "farmasi curepipe", "restaurants in grand baie", "restaurant grand baie open now", "restaurants rose hill",
  "bank port louis", "hotel flic en flac", "school curepipe", "dentist quatre bornes", "supermarket vacoas", "boulangerie mahebourg", "taxi port louis",
  "garage in goodlands", "doctor in rose belle", "hardware triolet", "snack flacq", "bar grand baie", "atm ebene", "pharmacy near me", "where to eat in mahebourg",
  "kot manze", "restaurant indien", "food delivery", "pizza grand baie", "chinese restaurant port louis", "hotel in belle mare", "villa pereybere",
  // Dishes.
  "pizza", "dholl puri", "roti", "burger", "mine", "briani", "biryani", "sushi", "gato", "ice cream", "coffee", "cocktail",
  // Names: one word, two, three, with a number, with accents typed and not typed.
  "mcb", "sbm", "emtel", "winners", "shell", "kfc", "courts", "absa", "hsbc", "engen", "mauritius commercial bank", "state bank of mauritius", "bank one", "pizza hut",
  "burger king", "dream price", "indian oil", "debonairs pizza", "mauritius post", "alliance française", "alliance francaise", "bois chéri", "bois cheri", "bois cheri tea museum",
  "café coton", "cafe coton", "aux quatre épices", "aux quatre epices", "3m motors", "24/7 gym", "361", "20vin", "1974 cafe restaurant pub", "b 52 bar", "c-care darné", "c care",
  "le pescatore", "la clef des champs", "keiffel tours", "pharmacie espace santé", "active care pharmacy", "auberge le saladier", "body & soul", "mcdonald's", "mcdonalds",
  // Typing mistakes.
  "pharmcy curepipe", "pharmcy", "phramacy", "farmacy", "restorant", "restaraunt", "resturant grand baie", "quincailerie", "quincallerie", "boulangrie", "suprmarket",
  "dentsit", "hosptial", "emtell", "winers", "mauritus commercial bank", "debonair piza", "burgre king", "keifel tours", "alliance francais", "bois chery", "dhol puri",
  // Words still being typed.
  "ph", "pha", "phar", "pharm", "rest", "restau", "quin", "boul", "supe", "den", "gra", "cure", "mau", "ban", "hot",
  // One letter, a place alone, a district.
  "a", "b", "port louis", "curepipe", "grand baie", "rodrigues", "flic en flac", "quatre bornes", "ebene", "plaines wilhems",
  // Questions about how, and the site's own pages.
  "vat", "tva", "vat threshold", "vat calculator", "register a company", "open a company", "comment créer une entreprise", "kouma ouver enn biznes", "BRN",
  "cyclone season", "when is divali", "police number", "CEB number", "ambulance", "lapolis", "minimum wage", "salaire minimum", "permis de conduire", "jours fériés",
  "konze piblik", "time in mauritius", "population of mauritius", "capital of mauritius", "open a bank account", "ki pou fer dan moris", "metro", "bus", "chinese",
  "khay digital", "faiz khayrattee", "who made biznes.mu", "list my business", "work permit", "trade mark", "income tax", "public holidays 2027",
  // Narrower words, nothing, and odd input.
  "plumber", "plombier", "accountant", "electrician", "zzqqxx", "nonexistent company xyz", "khayzzq digital", "the", "in", "123", "+230", "!!!", "é", "pharmacy pharmacy pharmacy",
  "where can i find a good cheap restaurant open now near grand baie with delivery and takeaway for a family dinner tonight please",
  "je cherche une pharmacie ouverte près de curepipe avec un numéro de téléphone",
];

/** A word with two letters in its middle changed places: the commonest slip of a thumb. */
const slip = (word) => (word.length < 5 ? word : word.slice(0, 2) + word[3] + word[2] + word.slice(4));

/** Questions drawn from the index: `listings`, `categories` and `places` as data/index holds them. */
export function drawn({ listings, categories, places }) {
  const out = [];
  const every = (list, step, from = 0) => list.filter((_, i) => i % step === from);
  const names = every(listings, 89, 7).map((l) => l.name);
  out.push(...names);
  // The same names typed wrongly, and typed half way.
  for (const name of every(names, 3)) {
    const words = name.split(" ");
    const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
    out.push(words.map((word) => (word === longest ? slip(word) : word)).join(" "));
    if (name.length > 6) out.push(name.slice(0, Math.ceil(name.length * 0.6)));
  }
  const towns = places.filter((p) => p.kind === "town").sort((a, b) => b.n - a.n).slice(0, 8);
  const kinds = categories.filter((c) => !c.id.startsWith("other-")).sort((a, b) => b.n - a.n).slice(0, 12);
  kinds.forEach((c, i) => out.push(`${c.one} in ${towns[i % towns.length].name}`, `${c.label} ${towns[(i + 3) % towns.length].name}`));
  return out.filter((q) => q && q.trim().length > 0);
}
