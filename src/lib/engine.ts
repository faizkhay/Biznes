/**
 * The engine: the site's own way of finding documents and putting them in order.
 *
 * It knows nothing of Mauritius, of listings or of the rest of the site, and it imports nothing,
 * so it can be tested by itself (`npm run search:test`). The search (src/lib/search.ts) reads a
 * question, decides what to ask, and asks it here.
 *
 * What it holds
 *
 * A document is an id, a kind, and a few fields of text (a name, other names, a description). Each
 * field has a weight: a word in a name says more than the same word in a description. The text is
 * folded (lower case, no accents, "œ" as "oe"), cut into words, and each word is put through the
 * caller's own rule for words (a plural and its singular are one word). For every word the index
 * keeps the documents that hold it and how often in each field; for every document it keeps its
 * words in order. A document is added or taken out by itself: nothing is rebuilt.
 *
 * How a word of the question is matched
 *
 * 1. As written. It counts in full.
 * 2. As the start of a longer word, for a word still being typed ("pharm" finds "pharmacy"). The
 *    words are kept in a sorted list, so the longer words are found by halving it, not by reading
 *    it. Such a match counts for between a quarter and a half of a whole one: more, the more of
 *    the word was typed. The start is the word as typed, so "winers" is not the start of "winery".
 * 3. As a close spelling, when the caller allows it. The distance between two words is the number
 *    of single slips between them: a letter missing, one too many, a wrong one, or two that
 *    changed places (which counts as one slip, not two). A word of four to seven letters may be
 *    one slip away; two words of eight letters or more may be two slips apart; a shorter word
 *    must be right. A word the index holds as written is given close spellings only from five
 *    letters, since a short real word has too many neighbours. Close spellings are found without
 *    reading the vocabulary: every word is filed under its first seven letters and under those
 *    letters with one taken out (two, for a long word), and the word typed is looked up the same
 *    way. Two words within reach of each other always share such a filing, and the few that
 *    share one are then measured exactly. A close spelling counts for 0.5 of a whole match at one
 *    slip and 0.35 at two, a little less when its first letter differs, and a little more the
 *    commoner the word is: a slip is likelier to be a common word than a rare one. So it always
 *    comes below the same word written right.
 *
 * How a document is scored
 *
 * For each word of the question, the document's best match among those three is taken. Its worth
 * is the field-weighted form of BM25, known as BM25F:
 *
 *     seen  = the sum, over the fields, of weight x times found / (1 - b + b x length / usual length)
 *             (the usual length is that field's, among documents of the same kind that have it)
 *     worth = closeness x rarity x seen / (K + seen)
 *
 * The length of each field is held against it by its own measure b: "MCB" in a name of one word
 * is more about MCB than in a name of six. `seen / (K + seen)` rises quickly and then levels, so
 * the tenth mention adds little and no one field can drown the rest. Rarity is the usual
 * ln(1 + (N - n + 0.5) / (n + 0.5)), for N documents of which n hold the word; every way of
 * matching one word of the question shares the rarity of the commonest of them, so that a rare
 * completion or a rare misspelling is not lifted for being rare.
 *
 * The worths of the words are added. Then the words are looked at together, in each field:
 *
 * - the question is the whole of a field marked for it (the name), each word whole and not the
 *   start of a longer one: the score is multiplied by that field's `whole`, which is 2 for a
 *   name. An exact match on the whole name comes above a name that only holds the words;
 * - words that stand side by side in the question stand side by side in the field: up to 0.6
 *   more, in proportion to how many such pairs there are, half for a pair the wrong way round,
 *   and less in a field of less weight. Words together come above the same words apart.
 *
 * Asked for every word (AND), a document that lacks one is not an answer. Asked for any word
 * (OR), a document is also weighed by how much of the question it holds, each word counting by
 * its rarity, and a document that holds every word is put above every one that does not.
 *
 * Equal scores keep the order the documents were added in, so the same question always gets the
 * same answer.
 */

/** A field of a document: its name, its weight, and how its length and a whole match count. */
export type Field = {
  name: string;
  /** How much a word found here counts, against the same word in another field. */
  weight: number;
  /** From 0 to 1: how far a long field is held against a word found in it. 0.5 when not given. */
  length?: number;
  /** When given, a question that is the whole of this field multiplies the score by it. */
  whole?: number;
};
export type Settings = {
  fields: Field[];
  /** The caller's rule for one folded word: a plural to its singular, say. An empty answer drops the word. */
  word?: (word: string) => string;
  /** K in the head of this file: how soon more of a word stops adding. 4 when not given. */
  levelling?: number;
};
/** A document: an id, perhaps a kind, and text under the names of the fields. */
export type Doc = { id: string; kind?: string; [field: string]: string | undefined };
export type Ask = {
  /** True (as it is when not given): every word must be held. False: any one is enough. */
  all?: boolean;
  /** Only documents of this kind. */
  kind?: string;
  /** The fewest letters a typed word must have to stand for the start of a longer one. 0, or not given: never. */
  prefix?: number;
  /** Allow close spellings. */
  close?: boolean;
  /**
   * The whole question, when the words asked for are only a part of it. It finds nothing by
   * itself: it is what a field is compared with, to see whether the field is the whole question
   * or holds its words side by side.
   */
  also?: string;
  /** No more than this many answers. */
  limit?: number;
};
export type Hit = {
  id: string;
  kind: string;
  score: number;
  /** How many of the question's words the document holds. Asked for every word, all of them. */
  words: number;
  /** True when one of the words was found in this document only as a close spelling. */
  close: boolean;
};
export type Spelling = { word: string; distance: number; held: number };

/** How quickly a word's worth levels off as it is found more, and in weightier fields, unless the caller says. */
const LEVELLING = 4;
/** What a word found only as the start of a longer one counts for: from LEAST_START up to LEAST_START + MORE_START. */
const LEAST_START = 0.25;
const MORE_START = 0.25;
/** What a close spelling counts for, at one slip and at two; and when its first letter differs. */
const ONE_SLIP = 0.5;
const TWO_SLIPS = 0.35;
const OTHER_FIRST_LETTER = 0.85;
/** How much the commonness of a close spelling counts: from 1 - COMMON for the rarest to 1. */
const COMMON = 0.2;
/** What is added, at most, when the question's words stand together in a field. */
const TOGETHER = 0.6;
/** How many letters of a word its close spellings are filed under. */
const REACH = 7;
/** The most words of one question that are weighed. */
const MOST_WORDS = 31;

const MARKS = /[\u0300-\u036f]/g;
const PLAIN = /^[\x20-\x7e]*$/;
/** Letters written as one and typed as two. */
const JOINED: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss" };

/** Lower case, unaccented, punctuation to spaces. */
export const fold = (text: string) =>
  (PLAIN.test(text) ? text : text.normalize("NFKD").replace(MARKS, ""))
    .toLowerCase()
    .replace(/[œæß]/g, (letter) => JOINED[letter])
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

let rows: Int32Array[] = [new Int32Array(40), new Int32Array(40), new Int32Array(40)];

/**
 * The number of slips between two words, where two letters that changed places are one slip.
 * It stops counting past `most` and answers `most + 1`.
 */
export function slips(a: string, b: string, most: number): number {
  const n = a.length;
  const m = b.length;
  if (Math.abs(n - m) > most) return most + 1;
  if (a === b) return 0;
  if (m + 1 > rows[0].length) rows = [new Int32Array(m + 9), new Int32Array(m + 9), new Int32Array(m + 9)];
  let [before, last, row] = rows;
  for (let j = 0; j <= m; j++) last[j] = j;
  for (let i = 1; i <= n; i++) {
    row[0] = i;
    let least = i;
    const letter = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const other = b.charCodeAt(j - 1);
      let cost = Math.min(last[j] + 1, row[j - 1] + 1, last[j - 1] + (letter === other ? 0 : 1));
      if (i > 1 && j > 1 && letter === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === other) cost = Math.min(cost, before[j - 2] + 1);
      row[j] = cost;
      if (cost < least) least = cost;
    }
    if (least > most) return most + 1;
    [before, last, row] = [last, row, before];
  }
  return Math.min(last[m], most + 1);
}

/**
 * Calls `each` with a word, with each one of its letters taken out in turn, and with each two
 * taken out if `two`. Taking either of a pair of the same letters gives the same word, so only
 * the first is taken; a word may still come up twice, and whoever is called must not mind.
 */
function shortened(word: string, two: boolean, each: (short: string) => void): void {
  each(word);
  for (let i = 0; i < word.length; i++) {
    if (i > 0 && word[i] === word[i - 1]) continue;
    const once = word.slice(0, i) + word.slice(i + 1);
    each(once);
    if (two) for (let j = i; j < once.length; j++) if (j === i || once[j] !== once[j - 1]) each(once.slice(0, j) + once.slice(j + 1));
  }
}

/** How many slips a typed word of this length may be from the word meant. */
const slipsFor = (length: number) => (length >= 8 ? 2 : length >= 4 ? 1 : 0);

/** The set bits of a number, counted. */
function bitsIn(n: number): number {
  let count = 0;
  for (; n; n &= n - 1) count++;
  return count;
}

/** One word of a question, and every word of the index it may stand for. */
type Term = {
  word: string;
  /** The words of the index, by number, with how close each is (1 as written), whether it is a close spelling, and whether it only begins with the word typed. */
  numbers: number[];
  near: number[];
  spelt: boolean[];
  starts: boolean[];
  /** How many of the index's entries would be read for it: the cheapest word is read first. */
  cost: number;
  rarity: number;
};

export class Engine {
  private readonly fields: Field[];
  private readonly word: (word: string) => string;
  private readonly K: number;
  /** How many times a word is counted in one field of one document: 63 with five fields. More adds nothing. */
  private readonly bits: number;
  private readonly most: number;

  // The words. A word is known by its number; a word no document holds any more keeps its number.
  private readonly numbers = new Map<string, number>();
  private readonly typed = new Map<string, number>();
  private readonly words: string[] = [];
  private readonly held: number[] = [];
  private readonly docsOf: number[][] = [];
  private readonly countsOf: number[][] = [];
  private sorted: string[] = [];
  private fresh: string[] = [];
  private filed: Map<string, number | number[]> | undefined;

  // The documents. A document is known by its place; a place left empty is used again.
  private readonly ids: (string | undefined)[] = [];
  private readonly places = new Map<string, number>();
  private readonly kindOf: number[] = [];
  private readonly kinds: string[] = [];
  private readonly lengths: number[] = [];
  private readonly inOrder: (number[] | undefined)[] = [];
  private readonly empty: number[] = [];
  /** For each kind and field: the words in that field over all documents of the kind, and how many of them have the field. */
  private readonly sums: number[] = [];
  private readonly filled: number[] = [];
  private live = 0;

  // Working space for a search, kept between searches and marked with a tick so it is never cleared.
  private tick = 0;
  private room = 0;
  private total = new Float64Array(0);
  private best = new Float64Array(0);
  private got = new Float64Array(0);
  private seen = new Int32Array(0);
  private seenFor = new Int32Array(0);
  private matched = new Uint8Array(0);
  private spelt = new Uint8Array(0);
  private bestSpelt = new Uint8Array(0);
  private roleTick = new Int32Array(0);
  private roleBits = new Int32Array(0);
  private roleStart = new Uint8Array(0);

  constructor(settings: Settings) {
    if (!settings.fields.length) throw new Error("An engine needs at least one field.");
    this.fields = settings.fields.map((field) => ({ ...field }));
    this.word = settings.word ?? ((word) => word);
    this.K = settings.levelling ?? LEVELLING;
    this.bits = Math.max(1, Math.floor(30 / this.fields.length));
    this.most = (1 << this.bits) - 1;
  }

  /** How many documents it holds. */
  get size(): number {
    return this.live;
  }

  /** How many different words it has met. */
  get vocabulary(): number {
    return this.words.length;
  }

  has(id: string): boolean {
    return this.places.has(id);
  }

  /** The words of a text as the index holds them, in order. */
  private wordsOf(text: string): number[] {
    const out: number[] = [];
    for (const raw of fold(text).split(" ")) {
      if (!raw) continue;
      let number = this.typed.get(raw);
      if (number === undefined) {
        const word = this.word(raw);
        number = word ? (this.numbers.get(word) ?? this.learn(word)) : -1;
        this.typed.set(raw, number);
      }
      if (number >= 0) out.push(number);
    }
    return out;
  }

  private learn(word: string): number {
    const number = this.words.length;
    this.numbers.set(word, number);
    this.words.push(word);
    this.held.push(0);
    this.docsOf.push([]);
    this.countsOf.push([]);
    this.fresh.push(word);
    if (this.filed) this.file(this.filed, number);
    return number;
  }

  /** Puts a document in. One with an id already held takes the place of the old one. */
  add(doc: Doc): void {
    if (this.places.has(doc.id)) this.discard(doc.id);
    const F = this.fields.length;
    const place = this.empty.pop() ?? this.ids.length;
    const kind = doc.kind ?? "";
    let k = this.kinds.indexOf(kind);
    if (k < 0) {
      k = this.kinds.push(kind) - 1;
      for (let f = 0; f < F; f++) {
        this.sums.push(0);
        this.filled.push(0);
      }
    }
    const order: number[] = [];
    const counts = new Map<number, number>();
    for (let f = 0; f < F; f++) {
      const text = doc[this.fields[f].name];
      const words = text ? this.wordsOf(text) : [];
      const shift = this.bits * f;
      for (const number of words) {
        order.push(number);
        const was = counts.get(number) ?? 0;
        counts.set(number, ((was >> shift) & this.most) < this.most ? was + (1 << shift) : was);
      }
      this.lengths[place * F + f] = words.length;
      this.sums[k * F + f] += words.length;
      if (words.length) this.filled[k * F + f]++;
    }
    for (const [number, count] of counts) {
      this.docsOf[number].push(place);
      this.countsOf[number].push(count);
      this.held[number]++;
    }
    this.ids[place] = doc.id;
    this.places.set(doc.id, place);
    this.kindOf[place] = k;
    this.inOrder[place] = order;
    this.live++;
  }

  addAll(docs: Doc[]): void {
    for (const doc of docs) this.add(doc);
  }

  /** Takes a document out, from every word that held it. False when there was none of that id. */
  discard(id: string): boolean {
    const place = this.places.get(id);
    if (place === undefined) return false;
    const F = this.fields.length;
    for (const number of new Set(this.inOrder[place])) {
      const docs = this.docsOf[number];
      const counts = this.countsOf[number];
      // The last entry takes the place of the one taken out: the order within a word does not matter.
      const at = docs.lastIndexOf(place);
      if (at < 0) continue;
      docs[at] = docs[docs.length - 1];
      counts[at] = counts[counts.length - 1];
      docs.pop();
      counts.pop();
      this.held[number]--;
    }
    const k = this.kindOf[place];
    for (let f = 0; f < F; f++) {
      const length = this.lengths[place * F + f];
      this.sums[k * F + f] -= length;
      if (length) this.filled[k * F + f]--;
      this.lengths[place * F + f] = 0;
    }
    this.ids[place] = undefined;
    this.inOrder[place] = undefined;
    this.places.delete(id);
    this.empty.push(place);
    this.live--;
    return true;
  }

  /** The words in order, for finding those that begin with some letters. New words are merged in when next needed. */
  private alphabet(): string[] {
    if (!this.fresh.length) return this.sorted;
    const fresh = this.fresh.sort();
    const old = this.sorted;
    const out: string[] = new Array(old.length + fresh.length);
    for (let i = 0, j = 0, k = 0; k < out.length; k++) out[k] = j >= fresh.length || (i < old.length && old[i] < fresh[j]) ? old[i++] : fresh[j++];
    this.fresh = [];
    return (this.sorted = out);
  }

  /** Calls `each` with the number of every word, held by some document, that begins with `start`. */
  private beginning(start: string, each: (number: number, word: string) => void): void {
    const sorted = this.alphabet();
    let low = 0;
    let high = sorted.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (sorted[middle] < start) low = middle + 1;
      else high = middle;
    }
    for (let i = low; i < sorted.length && sorted[i].startsWith(start); i++) {
      const number = this.numbers.get(sorted[i])!;
      if (this.held[number] > 0) each(number, sorted[i]);
    }
  }

  /** Files a word under its first letters, and under those with one letter out, or two for a long word. */
  private file(filed: Map<string, number | number[]>, number: number): void {
    const word = this.words[number];
    if (word.length < 3) return;
    shortened(word.slice(0, REACH), word.length >= 8, (under) => {
      const there = filed.get(under);
      if (there === undefined) filed.set(under, number);
      else if (typeof there === "number") {
        if (there !== number) filed.set(under, [there, number]);
      } else if (there[there.length - 1] !== number) there.push(number);
    });
  }

  /** The words of the index within reach of a word, with the slips between them. Not the word itself. */
  private closeTo(word: string): { number: number; distance: number }[] {
    const reach = slipsFor(word.length);
    if (!reach) return [];
    if (!this.filed) {
      // Worked out the first time a close spelling is asked for, and kept up from then on.
      this.filed = new Map();
      for (let number = 0; number < this.words.length; number++) this.file(this.filed, number);
    }
    const found = new Map<number, number>();
    const measure = (number: number) => {
      if (found.has(number) || this.held[number] === 0) return;
      const other = this.words[number];
      if (other === word) return;
      // Two slips only between two long words.
      const most = reach === 2 && other.length >= 8 ? 2 : 1;
      const distance = slips(word, other, most);
      found.set(number, distance <= most ? distance : 0);
    };
    const filed = this.filed;
    shortened(word.slice(0, REACH), reach === 2, (under) => {
      const there = filed.get(under);
      if (there === undefined) return;
      if (typeof there === "number") measure(there);
      else for (const number of there) measure(number);
    });
    const out: { number: number; distance: number }[] = [];
    for (const [number, distance] of found) if (distance > 0) out.push({ number, distance });
    return out;
  }

  /** True when some document holds the word as written or, from `prefix` letters, a word that begins with it. */
  knows(word: string, prefix = 0): boolean {
    const raw = fold(word);
    if (!raw || raw.includes(" ")) return false;
    const number = this.numbers.get(this.word(raw));
    if (number !== undefined && this.held[number] > 0) return true;
    let begun = false;
    if (prefix > 0 && raw.length >= prefix) this.beginning(raw, () => (begun = true));
    return begun;
  }

  /** The close spellings of a word that documents hold: the nearest first, and of those the commonest. */
  spell(word: string): Spelling[] {
    const raw = fold(word);
    if (!raw || raw.includes(" ")) return [];
    return this.closeTo(this.word(raw))
      .map(({ number, distance }) => ({ word: this.words[number], distance, held: this.held[number] }))
      .sort((a, b) => a.distance - b.distance || b.held - a.held || (a.word < b.word ? -1 : 1));
  }

  /** The words of a question, once each, as typed and as the index holds them. */
  private read(text: string): { raw: string; word: string }[] {
    const out: { raw: string; word: string }[] = [];
    for (const raw of fold(text).split(" ")) {
      if (!raw) continue;
      const word = this.word(raw);
      if (word && !out.some((other) => other.word === word)) out.push({ raw, word });
    }
    return out.slice(0, MOST_WORDS);
  }

  /** Every word of the index that one word of a question may stand for. */
  private term(raw: string, word: string, prefix: number, close: boolean): Term {
    const numbers: number[] = [];
    const near: number[] = [];
    const spelt: boolean[] = [];
    const starts: boolean[] = [];
    const exact = this.numbers.get(word);
    if (exact !== undefined && this.held[exact] > 0) {
      numbers.push(exact);
      near.push(1);
      spelt.push(false);
      starts.push(false);
    }
    if (prefix > 0 && raw.length >= prefix) {
      this.beginning(raw, (number, longer) => {
        if (number === exact) return;
        numbers.push(number);
        near.push(LEAST_START + (MORE_START * raw.length) / longer.length);
        spelt.push(false);
        starts.push(true);
      });
    }
    if (close && word.length >= (numbers.length ? 5 : 4)) {
      const spellings = this.closeTo(word).filter(({ number }) => !numbers.includes(number));
      let commonest = 1;
      for (const { number } of spellings) commonest = Math.max(commonest, this.held[number]);
      for (const { number, distance } of spellings) {
        const common = 1 - COMMON + (COMMON * Math.log(1 + this.held[number])) / Math.log(1 + commonest);
        numbers.push(number);
        near.push((distance === 1 ? ONE_SLIP : TWO_SLIPS) * (this.words[number][0] === word[0] ? 1 : OTHER_FIRST_LETTER) * common);
        spelt.push(true);
        starts.push(false);
      }
    }
    let cost = 0;
    let commonest = 0;
    for (const number of numbers) {
      cost += this.held[number];
      commonest = Math.max(commonest, this.held[number]);
    }
    return { word, numbers, near, spelt, starts, cost, rarity: Math.log(1 + (this.live - commonest + 0.5) / (commonest + 0.5)) };
  }

  /** Makes the working space as large as the index. */
  private makeRoom(): void {
    let again = this.tick > 2e9;
    if (this.room < this.ids.length) {
      this.room = this.ids.length + 256;
      this.total = new Float64Array(this.room);
      this.best = new Float64Array(this.room);
      this.got = new Float64Array(this.room);
      this.seen = new Int32Array(this.room);
      this.seenFor = new Int32Array(this.room);
      this.matched = new Uint8Array(this.room);
      this.spelt = new Uint8Array(this.room);
      this.bestSpelt = new Uint8Array(this.room);
      again = true;
    }
    if (this.roleTick.length < this.words.length) {
      this.roleTick = new Int32Array(this.words.length + 1024);
      this.roleBits = new Int32Array(this.roleTick.length);
      this.roleStart = new Uint8Array(this.roleTick.length);
      again = true;
    }
    // The ticks start again from nothing, so every mark made with an old one is wiped.
    if (again) {
      this.seen.fill(0);
      this.seenFor.fill(0);
      this.roleTick.fill(0);
      this.tick = 0;
    }
  }

  /** The documents that answer a question, the best first. The head of this file says how. */
  search(query: string, ask: Ask = {}): Hit[] {
    const { all = true, kind, prefix = 0, close = false, also, limit } = ask;
    if (!this.live) return [];
    const want = kind === undefined ? -1 : this.kinds.indexOf(kind);
    if (kind !== undefined && want < 0) return [];
    const asked = this.read(query);
    if (!asked.length) return [];
    const terms = asked.map(({ raw, word }) => this.term(raw, word, prefix, close));
    if (all && terms.some((term) => !term.numbers.length)) return [];
    const found = terms.filter((term) => term.numbers.length);
    if (!found.length) return [];
    // For every word, the fewest entries first: the documents still in the running thin out soonest.
    if (all) found.sort((a, b) => a.cost - b.cost);

    this.makeRoom();
    const { fields, bits, most, lengths, kindOf, total, best, got, seen, seenFor, matched, spelt, bestSpelt, K } = this;
    const F = fields.length;
    const weight = fields.map((field) => field.weight);
    const flat = fields.map((field) => 1 - (field.length ?? 0.5));
    // A field's length is held against it by the usual length of that field among documents of the same kind that have it.
    const slope = this.sums.map((sum, at) => (fields[at % F].length ?? 0.5) / (sum / this.filled[at] || 1));
    const mine = ++this.tick;
    const touched: number[] = [];

    for (let i = 0; i < found.length; i++) {
      const term = found[i];
      const forTerm = ++this.tick;
      const list: number[] = [];
      for (let v = 0; v < term.numbers.length; v++) {
        const docs = this.docsOf[term.numbers[v]];
        const counts = this.countsOf[term.numbers[v]];
        const near = term.near[v];
        const isSpelt = term.spelt[v] ? 1 : 0;
        for (let j = 0; j < docs.length; j++) {
          const doc = docs[j];
          if (want >= 0 && kindOf[doc] !== want) continue;
          if (all && i > 0 && (seen[doc] !== mine || matched[doc] !== i)) continue;
          const count = counts[j];
          const base = doc * F;
          const usual = kindOf[doc] * F;
          let x = 0;
          for (let f = 0; f < F; f++) {
            const times = (count >> (bits * f)) & most;
            if (times) x += (times * weight[f]) / (flat[f] + slope[usual + f] * lengths[base + f]);
          }
          const worth = (near * x) / (K + x);
          if (seenFor[doc] !== forTerm) {
            seenFor[doc] = forTerm;
            best[doc] = worth;
            bestSpelt[doc] = isSpelt;
            list.push(doc);
          } else if (worth > best[doc]) {
            best[doc] = worth;
            bestSpelt[doc] = isSpelt;
          }
        }
      }
      for (const doc of list) {
        if (seen[doc] !== mine) {
          seen[doc] = mine;
          total[doc] = 0;
          got[doc] = 0;
          matched[doc] = 0;
          spelt[doc] = 0;
          touched.push(doc);
        }
        total[doc] += term.rarity * best[doc];
        got[doc] += term.rarity;
        matched[doc]++;
        if (bestSpelt[doc]) spelt[doc] = 1;
      }
    }

    const answers = all ? touched.filter((doc) => matched[doc] === found.length) : touched;
    if (!answers.length) return [];

    // The words together: which word of the question each word of the index may stand for.
    const said = also === undefined ? asked : this.read(also);
    const n = said.length;
    const { roleTick, roleBits, roleStart } = this;
    const role = ++this.tick;
    const stand = (number: number, position: number, start: boolean) => {
      if (roleTick[number] !== role) {
        roleTick[number] = role;
        roleBits[number] = 0;
        roleStart[number] = 0;
      }
      roleBits[number] |= 1 << position;
      if (start) roleStart[number] = 1;
    };
    said.forEach(({ word }, position) => {
      const term = terms.find((other) => other.word === word);
      if (term) term.numbers.forEach((number, v) => stand(number, position, term.starts[v]));
      else {
        const number = this.numbers.get(word);
        if (number !== undefined) stand(number, position, false);
      }
    });
    const heaviest = Math.max(...weight);
    let allRarity = 0;
    for (const term of found) allRarity += term.rarity;

    for (const doc of answers) {
      const order = this.inOrder[doc]!;
      let lift = 0;
      let from = 0;
      for (let f = 0; f < F; f++) {
        const length = lengths[doc * F + f];
        const whole = fields[f].whole;
        if (length && (n > 1 || whole !== undefined)) {
          let pairs = 0;
          let back = 0;
          let before = 0;
          if (n > 1) {
            for (let p = from; p < from + length; p++) {
              const number = order[p];
              const now = roleTick[number] === role ? roleBits[number] : 0;
              if (now && before) {
                pairs |= (before << 1) & now;
                back |= (now << 1) & before;
              }
              before = now;
            }
          }
          let more = n > 1 ? (TOGETHER * (bitsIn(pairs) + 0.5 * bitsIn(back & ~pairs)) * weight[f]) / ((n - 1) * heaviest) : 0;
          if (whole !== undefined && length === n) {
            // Is the field the question, word for word, each word whole and not the start of a longer one?
            let same = true;
            for (let p = 0; p < n && same; p++) {
              const number = order[from + p];
              same = roleTick[number] === role && (roleBits[number] & (1 << p)) !== 0 && !roleStart[number];
            }
            if (same) more = Math.max(more, whole - 1);
          }
          if (more > lift) lift = more;
        }
        from += length;
      }
      let score = total[doc] * (1 + lift);
      // Asked for any word: a document counts for as much of the question as it holds.
      if (!all) score *= got[doc] / allRarity;
      total[doc] = score;
    }

    if (!all && found.length > 1) {
      // Every word above some words, whatever the scores.
      let partial = 0;
      let complete = false;
      for (const doc of answers) {
        if (matched[doc] === found.length) complete = true;
        else if (total[doc] > partial) partial = total[doc];
      }
      if (complete && partial > 0) for (const doc of answers) if (matched[doc] === found.length) total[doc] += partial;
    }

    answers.sort((a, b) => total[b] - total[a] || a - b);
    const top = limit === undefined ? answers : answers.slice(0, Math.max(0, limit));
    return top.map((doc) => ({ id: this.ids[doc]!, kind: this.kinds[kindOf[doc]], score: total[doc], words: matched[doc], close: spelt[doc] === 1 }));
  }
}
