// The engine by itself (src/lib/engine.ts), with no build, no server and none of the site's data.
//
//   npm run search:test
//
// Small sets of documents made up here, and what the engine must do with them: the order it puts
// them in, a word still being typed, typing mistakes, adding and taking out, every word and any
// word, and questions that are empty or odd. Exits 1 if any check fails.
import { Engine, fold, slips } from "../src/lib/engine.ts";

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok || detail === "" ? "" : `  (${detail})`}`);
};

const FIELDS = [
  { name: "name", weight: 4, length: 0.6, whole: 2 },
  { name: "what", weight: 2, length: 0.2 },
  { name: "text", weight: 1, length: 0.5 },
];
// A plural and its singular are one word, as on the site.
const word = (w) => (w.length > 3 ? w.replace(/([^s])s$/, "$1") : w);
const make = (docs, settings = {}) => {
  const engine = new Engine({ fields: FIELDS, word, ...settings });
  engine.addAll(docs);
  return engine;
};
const ids = (hits) => hits.map((hit) => hit.id).join(" ");
const before = (hits, first, second) => {
  const a = hits.findIndex((hit) => hit.id === first);
  const b = hits.findIndex((hit) => hit.id === second);
  return a >= 0 && b >= 0 && a < b;
};

// 1. The order.
const town = make([
  { id: "mcb", kind: "listing", name: "MCB", what: "bank", text: "" },
  { id: "mcb-juice", kind: "listing", name: "MCB Juice Service Centre", what: "bank", text: "" },
  { id: "note", kind: "listing", name: "Corner Shop", what: "shop", text: "There is an MCB cash machine outside." },
  { id: "blue-bay", kind: "listing", name: "Blue Bay Hotel", what: "hotel", text: "" },
  { id: "bay-blue", kind: "listing", name: "Bay Blue Hotel", what: "hotel", text: "" },
  { id: "blue-apart", kind: "listing", name: "Blue Lagoon and Turtle Bay Hotel", what: "hotel", text: "" },
  { id: "blue-only", kind: "listing", name: "Blue Penny Museum", what: "museum", text: "" },
  { id: "bay-only", kind: "listing", name: "Tamarin Bay Surf School", what: "school", text: "" },
  { id: "pharmacy", kind: "listing", name: "Pharmacy", what: "pharmacy chemist", text: "" },
  { id: "pharmacie", kind: "listing", name: "Pharmacie du Centre", what: "pharmacy chemist", text: "" },
  { id: "winery", kind: "listing", name: "Takamaka Winery", what: "wine", text: "" },
  { id: "winners", kind: "listing", name: "Winners", what: "supermarket", text: "" },
  { id: "article", kind: "guide", name: "Pharmacies and medicines", what: "", text: "How a pharmacy is licensed, and what a pharmacist may sell." },
]);
let hits = town.search("mcb");
check("order: an exact match on the whole name comes above a name that holds the word", ids(hits).startsWith("mcb mcb-juice"), ids(hits));
check("order: a word in a name comes above the same word in a description", before(hits, "mcb-juice", "note"), ids(hits));
hits = town.search("blue bay");
check("order: words that stand together come above the same words apart", before(hits, "blue-bay", "blue-apart"), ids(hits));
check("order: together and in the order asked comes above together the wrong way round, and that above apart", before(hits, "blue-bay", "bay-blue") && before(hits, "bay-blue", "blue-apart"), ids(hits));
check("every word: a document that lacks one is not an answer", hits.length === 3 && hits.every((hit) => hit.words === 2), ids(hits));
hits = town.search("blue bay", { all: false });
check("any word: every document with either word answers", hits.length === 5, ids(hits));
check("any word: all the words come above some of them", ["blue-bay", "bay-blue", "blue-apart"].every((both) => before(hits, both, "blue-only") && before(hits, both, "bay-only")), ids(hits));
check("any word: a hit says how many of the words it holds", hits.find((hit) => hit.id === "blue-only").words === 1 && hits[0].words === 2);
{
  // Whatever the scores: the one document with both words has them deep in a long description.
  const long = make([
    { id: "both", name: "Notes", what: "", text: `${"filler ".repeat(300)} alpha ${"filler ".repeat(300)} omega` },
    { id: "alpha", name: "Alpha", what: "alpha", text: "alpha alpha" },
    { id: "omega", name: "Omega", what: "omega", text: "omega omega" },
  ]);
  check("any word: every word above some words, even when the words are buried", ids(long.search("alpha omega", { all: false })).startsWith("both"), ids(long.search("alpha omega", { all: false })));
}
{
  const rare = make([
    { id: "common-1", name: "Hotel One" }, { id: "common-2", name: "Hotel Two" }, { id: "common-3", name: "Hotel Three" }, { id: "common-4", name: "Hotel Four" },
    { id: "rare", name: "Observatory One" },
  ]);
  const order = rare.search("hotel observatory", { all: false });
  check("order: a rare word counts for more than a common one", order[0].id === "rare", ids(order));
  const both = make([{ id: "name-only", name: "Dentist", what: "", text: "" }, { id: "name-and-kind", name: "Dentist", what: "dentist", text: "" }]);
  check("order: a word found in two fields counts for more than in one", ids(both.search("dentist")) === "name-and-kind name-only");
  const many = make([{ id: "once", name: "Shop", text: "rice" }, { id: "often", name: "Shop", text: "rice rice rice" }, { id: "flood", name: "Shop", text: "rice ".repeat(5000) }]);
  const rice = many.search("rice");
  check("order: more mentions count for more, and then level off", rice.length === 3 && rice.find((h) => h.id === "often").score > rice.find((h) => h.id === "once").score && Number.isFinite(rice.find((h) => h.id === "flood").score));
  const spill = make([{ id: "a", name: "x", what: "y", text: "rice ".repeat(100) }]);
  check("a word counted to the limit in one field is not counted in the next", spill.search("rice").length === 1 && spill.search("x").length === 1 && spill.search("y").length === 1);
}
hits = town.search("pharmacy", { kind: "listing" });
check("kind: only documents of the kind asked for", hits.length === 2 && hits.every((hit) => hit.kind === "listing"), ids(hits));
check("kind: one that no document has finds nothing", town.search("pharmacy", { kind: "nothing" }).length === 0);
check("a plural and its singular are one word, by the caller's rule", ids(town.search("pharmacies", { kind: "guide" })) === "article" && ids(town.search("medicine")) === "article");
check("limit: no more than asked for, the best first", ids(town.search("blue bay", { all: false, limit: 2 })) === ids(town.search("blue bay", { all: false }).slice(0, 2)));
{
  const banks = make([
    { id: "india", name: "State Bank of India", what: "bank" },
    { id: "mauritius", name: "State Bank of Mauritius", what: "bank" },
    { id: "short", name: "State Bank", what: "bank" },
  ]);
  check("also: without the whole question, the shortest name leads", banks.search("state")[0].id === "short", ids(banks.search("state")));
  const whole = banks.search("state", { also: "state bank of mauritius" });
  check("also: with it, the name that is the whole question leads, and it finds nothing by itself", whole[0].id === "mauritius" && whole.length === 3, ids(whole));
}
{
  const same = make([{ id: "first", name: "Total" }, { id: "second", name: "Total" }, { id: "third", name: "Total" }]);
  check("equal scores keep the order the documents were added in, every time", ids(same.search("total")) === "first second third" && ids(same.search("total")) === "first second third");
}

// 2. A word still being typed.
hits = town.search("pharm", { prefix: 3 });
check("start of a word: it finds the longer words", hits.length === 3 && ["pharmacy", "pharmacie", "article"].every((id) => hits.some((hit) => hit.id === id)), ids(hits));
check("start of a word: not unless it is asked for, and not below the fewest letters", town.search("pharm").length === 0 && town.search("ph", { prefix: 3 }).length === 0);
{
  const typed = make([{ id: "start", name: "Hotel Riu", what: "hotel hotel" }, { id: "exact", name: "Hot Kitchen", what: "" }]);
  const order = typed.search("hot", { prefix: 3 });
  check("start of a word: the word as written comes above a longer word it begins", ids(order) === "exact start", ids(order));
  const nearer = make([{ id: "far", name: "Pharmaceutical" }, { id: "near", name: "Pharma" }]);
  check("start of a word: the more of the word was typed, the more it counts", ids(nearer.search("pharm", { prefix: 3 })) === "near far");
}
check("start of a word: it is the word as typed, so a plural is not the start of another word", town.search("winers", { prefix: 3 }).length === 0 && ids(town.search("winer", { prefix: 3 })) === "winery");
check("start of a word: a name is not the whole question when its word is only begun", town.search("winn", { prefix: 3 })[0].score < town.search("winners")[0].score / 2);

// 3. Typing mistakes.
check("slips: none, one of each kind, and two letters that changed places as one", slips("bank", "bank", 2) === 0 && slips("bank", "bnk", 2) === 1 && slips("bank", "baank", 2) === 1 && slips("bank", "bonk", 2) === 1 && slips("bank", "bnak", 2) === 1);
check("slips: two, and it stops counting past the most allowed", slips("restorant", "restaurant", 2) === 2 && slips("pharmacy", "bakery", 2) === 3 && slips("abc", "abcdefgh", 1) === 2);
check("mistakes: not unless they are asked for", town.search("pharmcy").length === 0 && town.search("winers").length === 0);
hits = town.search("pharmcy", { close: true, kind: "listing" });
// Both pharmacies hold the word: one in its name and its kind, one in its kind alone.
check("mistakes: a letter missing still finds the word, and each hit says it is a close spelling", ids(hits) === "pharmacy pharmacie" && hits.every((hit) => hit.close === true), ids(hits));
check("mistakes: two letters that changed places", ids(town.search("phramacy", { close: true, kind: "listing" })) === "pharmacy pharmacie");
check("mistakes: a letter too many, and a wrong letter", ids(town.search("pharmmacy", { close: true, kind: "listing" })) === "pharmacy pharmacie" && ids(town.search("pharnacy", { close: true, kind: "listing" })) === "pharmacy pharmacie");
check("mistakes: a doubled letter left single", ids(town.search("winers", { close: true })).startsWith("winners"), ids(town.search("winers", { close: true })));
check("mistakes: a word of three letters must be right, and a word of four may have one slip", town.search("mbc", { close: true }).length === 0 && ids(town.search("bleu", { close: true })).includes("blue-bay"));
{
  const long = make([{ id: "restaurant", name: "Restaurant" }, { id: "boulangerie", name: "Boulangerie" }, { id: "dentist", name: "Dentist" }]);
  check("mistakes: two slips between long words", ids(long.search("restorant", { close: true })) === "restaurant" && ids(long.search("boulanjeri", { close: true })) === "boulangerie");
  check("mistakes: but only one in a word of seven letters or fewer, and never three", long.search("dantost", { close: true }).length === 0 && long.search("rastorent", { close: true }).length === 0);
  const pair = make([{ id: "right", name: "Emtel Shop" }, { id: "wrong", name: "Emtell Shop" }]);
  const order = pair.search("emtel", { close: true });
  check("mistakes: a close spelling comes below the same word written right", ids(order) === "right wrong" && order[0].close === false && order[1].close === true, ids(order));
  const short = make([{ id: "bank", name: "Bank" }, { id: "band", name: "Band" }, { id: "hotel", name: "Hotel" }, { id: "motel", name: "Motel" }]);
  check("mistakes: a short word the index holds is not given its neighbours; a longer one is", ids(short.search("bank", { close: true })) === "bank" && ids(short.search("hotel", { close: true })) === "hotel motel");
  const common = make([{ id: "rare", name: "Wines" }, ...["a", "b", "c", "d", "e", "f"].map((n) => ({ id: `common-${n}`, name: "Winner", what: n }))]);
  check("mistakes: of two spellings as close, the commoner word leads", common.search("winer", { close: true })[0].id.startsWith("common"), ids(common.search("winer", { close: true })));
  const first = make([{ id: "other", name: "Diner" }, { id: "same", name: "Tiger" }]);
  check("mistakes: a spelling that keeps the first letter comes above one that changes it", ids(first.search("tiner", { close: true })) === "same other", ids(first.search("tiner", { close: true })));
  check("spell: the nearest words first, and of those the commonest", long.spell("restorant")[0].word === "restaurant" && long.spell("restorant")[0].distance === 2 && common.spell("winer")[0].word === "winner" && common.spell("winer")[0].held === 6);
  check("knows: a word as written, or as the start of one when asked", long.knows("dentist") && !long.knows("dent") && long.knows("dent", 3) && !long.knows("dentsit", 3) && !long.knows(""));
}
{
  // Every close spelling a full reading of the vocabulary would find, the filing finds too.
  let seed = 7;
  const next = (n) => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
  const letters = "abcdefghilmnoprstu";
  const made = new Set();
  while (made.size < 1500) made.add(Array.from({ length: 3 + next(10) }, () => letters[next(letters.length)]).join(""));
  const vocabulary = [...made];
  const engine = new Engine({ fields: [{ name: "name", weight: 1 }] });
  engine.addAll(vocabulary.map((w, i) => ({ id: String(i), name: w })));
  const slip = (w) => {
    const at = next(w.length);
    const kind = next(4);
    if (kind === 0) return w.slice(0, at) + w.slice(at + 1);
    if (kind === 1) return w.slice(0, at) + letters[next(letters.length)] + w.slice(at);
    if (kind === 2) return w.slice(0, at) + letters[next(letters.length)] + w.slice(at + 1);
    return at + 1 < w.length ? w.slice(0, at) + w[at + 1] + w[at] + w.slice(at + 2) : w;
  };
  let missed = 0;
  let extra = 0;
  let pairs = 0;
  for (let i = 0; i < 1200; i++) {
    const from = vocabulary[next(vocabulary.length)];
    const typed = next(3) ? slip(from) : slip(slip(from));
    const reach = typed.length >= 8 ? 2 : typed.length >= 4 ? 1 : 0;
    const read = new Map();
    if (reach) for (const w of vocabulary) {
      if (w === typed) continue;
      const most = reach === 2 && w.length >= 8 ? 2 : 1;
      const d = slips(typed, w, most);
      if (d <= most) read.set(w, d);
    }
    const filed = new Map(engine.spell(typed).map((s) => [s.word, s.distance]));
    pairs += read.size;
    for (const [w, d] of read) if (filed.get(w) !== d) missed++;
    for (const w of filed.keys()) if (!read.has(w)) extra++;
  }
  check("mistakes: the filing finds every close spelling that reading the whole vocabulary finds, and no other", missed === 0 && extra === 0 && pairs > 500, `${missed} missed, ${extra} extra, of ${pairs}`);
}

// 4. Adding and taking out.
{
  const engine = make([{ id: "one", name: "Alpha Shop" }, { id: "two", name: "Beta Shop" }]);
  check("size: the documents it holds", engine.size === 2 && engine.has("one") && !engine.has("three"));
  engine.add({ id: "three", name: "Gamma Shop", text: "alpha" });
  check("add: a document added later is found", ids(engine.search("gamma")) === "three" && ids(engine.search("alpha")) === "one three" && engine.size === 3);
  const rarity = engine.search("alpha")[0].score;
  check("discard: it is found no more, by any of its words", engine.discard("one") === true && ids(engine.search("alpha")) === "three" && ids(engine.search("shop")) === "two three" && engine.size === 2 && !engine.has("one"));
  check("discard: one that is not there is left alone", engine.discard("one") === false && engine.discard("nothing") === false && engine.size === 2);
  engine.add({ id: "one", name: "Alpha Shop" });
  check("add again: back as it was, with the same score", ids(engine.search("alpha")) === "one three" && Math.abs(engine.search("alpha")[0].score - rarity) < 1e-9 && engine.size === 3);
  engine.add({ id: "one", name: "Delta Shop" });
  check("add: one with an id already held takes the old one's place", engine.size === 3 && ids(engine.search("delta")) === "one" && ids(engine.search("alpha")) === "three");
  engine.discard("three");
  check("discard: a word no document holds any more finds nothing, as written, begun or misspelt", engine.search("alpha").length === 0 && engine.search("alph", { prefix: 3 }).length === 0 && engine.search("alpah", { close: true }).length === 0 && !engine.knows("alpha") && engine.spell("alpah").length === 0);
  engine.search("shpo", { close: true });
  engine.add({ id: "four", name: "Epsilon Bazaar" });
  check("add: a word learnt after close spellings were first asked for is found by them too", ids(engine.search("epsilno", { close: true })) === "four" && ids(engine.search("bazar", { close: true })) === "four" && ids(engine.search("eps", { prefix: 3 })) === "four");
  for (let round = 0; round < 50; round++) {
    for (let i = 0; i < 20; i++) engine.add({ id: `extra-${i}`, name: `Extra ${round} Shop ${i}` });
    for (let i = 0; i < 20; i++) engine.discard(`extra-${i}`);
  }
  check("add and discard, many times over: nothing is left behind", engine.size === 3 && ids(engine.search("shop").sort((a, b) => (a.id < b.id ? -1 : 1))) === "one two" && engine.search("extra").length === 0 && engine.search("bazaar").length === 1, ids(engine.search("shop")));
  const big = make(Array.from({ length: 400 }, (_, i) => ({ id: `d${i}`, name: `Shop ${i}`, text: i % 2 ? "even odd" : "odd" })));
  const was = big.search("even").length;
  for (let i = 0; i < 400; i += 3) big.discard(`d${i}`);
  check("discard: the count of answers falls by exactly those taken out", was === 200 && big.search("even").length === 200 - Array.from({ length: 400 }, (_, i) => i).filter((i) => i % 3 === 0 && i % 2).length);
}

// 5. Empty and odd questions.
{
  const empty = new Engine({ fields: FIELDS });
  check("an empty engine answers nothing, and does not fail", empty.search("anything").length === 0 && empty.search("", { close: true, prefix: 1 }).length === 0 && empty.spell("word").length === 0 && empty.size === 0);
  let threw = false;
  try {
    new Engine({ fields: [] });
  } catch {
    threw = true;
  }
  check("an engine with no field is refused", threw);
  for (const odd of ["", "   ", "!!!", "?", "\n\t", "’", "·"]) if (town.search(odd, { close: true, prefix: 3, all: false }).length !== 0) check(`odd: “${odd}” finds nothing`, false);
  check("odd: a question of no letters finds nothing", true);
  check("fold: lower case, no accents, letters written as one as two, punctuation to spaces", fold("  Crève-Cœur, L'ÎLE  ") === "creve coeur l ile" && fold("Straße 24/7") === "strasse 24 7" && fold("") === "");
  const accents = make([{ id: "epices", name: "Aux Quatre Épices" }, { id: "coeur", name: "Grand Bay Cœur de Ville" }, { id: "gym", name: "24/7 Gym" }, { id: "b52", name: "B 52 Bar" }, { id: "blank", name: "", what: "", text: "" }, { id: "bare" }]);
  check("accents: typed or not, the same word", ids(accents.search("epices")) === "epices" && ids(accents.search("ÉPICES")) === "epices" && ids(accents.search("coeur de ville")) === "coeur" && ids(accents.search("cœur")) === "coeur");
  check("numbers and single letters are words too", ids(accents.search("24/7 gym")) === "gym" && ids(accents.search("24 7")) === "gym" && ids(accents.search("b 52")) === "b52" && ids(accents.search("52")) === "b52");
  check("a document with no words is held and never found", accents.size === 6 && accents.has("blank") && accents.has("bare") && accents.search("blank").length === 0);
  check("a word said twice is asked once", ids(town.search("mcb mcb mcb")) === ids(town.search("mcb")) && town.search("mcb mcb")[0].score === town.search("mcb")[0].score);
  const long = `${"where can i find a good pharmacy near the blue bay ".repeat(40)}`;
  const started = performance.now();
  const many = town.search(long, { all: false, prefix: 3, close: true });
  check("a very long question is answered, and quickly", many.length > 0 && performance.now() - started < 200, `${Math.round(performance.now() - started)} ms`);
  check("a very long question asked for every word finds nothing, and does not fail", town.search(long).length === 0);
  const dropped = new Engine({ fields: FIELDS, word: (w) => (w === "the" ? "" : w) });
  dropped.add({ id: "x", name: "The Shop" });
  check("a word the caller drops is not asked for", ids(dropped.search("the shop")) === "x" && dropped.search("the").length === 0);
  const scores = town.search("pharmacy blue bay hotel mcb", { all: false, prefix: 3, close: true });
  check("every score is a number above nothing, the best first", scores.length > 0 && scores.every((hit, i) => Number.isFinite(hit.score) && hit.score > 0 && (i === 0 || hit.score <= scores[i - 1].score)));
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
