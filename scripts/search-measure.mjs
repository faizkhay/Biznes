// How long the search takes: to build its index, and to answer a question.
//
//   npm run search:measure                       times, beside the last ones written down
//   npm run search:measure -- --write            and writes them down (scripts/search-measure.json)
//   npm run search:measure -- --results out.json the first ten answers to every question, to compare
//   npm run search:measure -- --compare out.json what differs from a file written that way
//   npm run search:measure -- --names            every business asked for by its own name: is it found?
//
// It asks the site's own search() (src/lib/search.ts) in plain Node, with no build and no server,
// so the time is the search's and not the page's. The questions are scripts/search-questions.mjs:
// those written by hand and those drawn from the index, more than 200.
//
// The times before the site had an engine of its own are kept in scripts/search-measure.json
// ("library"): the same script, the same questions, the same machine, at the commit named there.
// So is how often a business was found by its own name, which is the plainest measure of whether
// the search is any good: every name in the index is asked for as written, with one slip of four
// kinds in its longest word, and with its last two letters not yet typed.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASKED, drawn } from "./search-questions.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const kept = join(here, "search-measure.json");
const flag = (name) => process.argv.includes(name);
const value = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);

// The index's own files are read first, so that reading them is not counted as building.
const { index } = await import("../src/lib/index.ts");
const data = index();
const questions = [...new Set([...ASKED, ...drawn(data)])];

// The time spent putting documents into the index, whichever index it is.
let indexing = 0;
const timed = (holder) => {
  const addAll = holder.prototype.addAll;
  holder.prototype.addAll = function (docs) {
    const from = performance.now();
    const out = addAll.call(this, docs);
    indexing += performance.now() - from;
    return out;
  };
};
let which = "engine";
try {
  timed((await import("../src/lib/engine.ts")).Engine);
} catch {
  which = "library";
  timed((await import("minisearch")).default);
}

const { search, suggest } = await import("../src/lib/search.ts");
let from = performance.now();
search("pharmacy");
const first = performance.now() - from;
// The first question with a typing mistake: the engine files its vocabulary for close spellings then, and once.
from = performance.now();
search("pharmcy");
const mistake = performance.now() - from;

if (value("--results") || value("--compare")) {
  const where = (l) => l.place ?? l.district ?? "";
  const results = {};
  for (const q of questions) {
    const a = search(q);
    results[q] = {
      read: [a.readAs ?? "", a.who ? "who" : "", a.spelling ? "close spellings" : "", a.loose ? "some of its words" : "", a.ignored ? `left out: ${a.ignored}` : "", a.near ? `near: ${a.near.label}` : ""].filter(Boolean).join("; "),
      counts: a.counts,
      listings: a.listings.slice(0, 10).map((l) => `${l.name}${where(l) ? ` (${where(l)})` : ""}`),
      leads: a.leads.map((l) => `${l.tag}: ${l.line.slice(0, 60)} ${l.href}`),
      mentions: a.mentions.map((l) => l.href),
      official: a.official.map((o) => o.title),
      sites: a.sites.map((s) => s.host),
      suggest: suggest(q).suggestions.map((s) => s.label),
    };
  }
  if (value("--results")) {
    writeFileSync(value("--results"), JSON.stringify(results, null, 1));
    console.log(`The first ten answers to ${questions.length} questions are in ${value("--results")}.`);
  } else {
    const before = JSON.parse(readFileSync(value("--compare"), "utf8"));
    let same = 0;
    for (const q of questions) {
      const was = before[q];
      const now = results[q];
      if (!was) continue;
      const parts = Object.keys(now).filter((part) => JSON.stringify(was[part]) !== JSON.stringify(now[part]));
      if (!parts.length) {
        same++;
        continue;
      }
      console.log(`\n“${q}”`);
      for (const part of parts) {
        if (!Array.isArray(now[part])) {
          console.log(`  ${part}: ${JSON.stringify(was[part])}\n    now: ${JSON.stringify(now[part])}`);
          continue;
        }
        const gone = was[part].filter((item) => !now[part].includes(item));
        const come = now[part].filter((item) => !was[part].includes(item));
        if (!gone.length && !come.length) console.log(`  ${part}: the same, in another order\n    was: ${was[part].join(" | ")}\n    now: ${now[part].join(" | ")}`);
        else console.log(`  ${part}:${gone.length ? `\n    gone: ${gone.join(" | ")}` : ""}${come.length ? `\n    come: ${come.join(" | ")}` : ""}\n    was: ${was[part].join(" | ")}\n    now: ${now[part].join(" | ")}`);
      }
    }
    console.log(`\n${same} of ${questions.length} questions are answered exactly as before.`);
  }
  process.exit(0);
}

let record = {};
try {
  record = JSON.parse(readFileSync(kept, "utf8"));
} catch {}
/** The commit this was measured at, with a plus when the files have changed since. */
const commit = async () => {
  const { execSync } = await import("node:child_process");
  try {
    return execSync("git rev-parse --short HEAD", { cwd: here }).toString().trim() + (execSync("git status --porcelain", { cwd: here }).toString().trim() ? "+" : "");
  } catch {
    return "";
  }
};

if (flag("--names")) {
  const plain = (text) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const names = [...new Set(data.listings.map((l) => l.name))].filter((name) => plain(name).length >= 3);
  // One slip in the longest word of a name, when that word has five letters or more.
  const slipped = (name, slip) => {
    const words = plain(name).split(" ");
    const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
    return longest.length < 5 ? undefined : words.map((word) => (word === longest ? slip(word) : word)).join(" ");
  };
  const ways = [
    ["as written", (name) => name, 10],
    ["two letters changed places", (name) => slipped(name, (w) => w.slice(0, 2) + w[3] + w[2] + w.slice(4)), 10],
    ["a letter left out", (name) => slipped(name, (w) => w.slice(0, 2) + w.slice(3)), 10],
    ["a letter doubled", (name) => slipped(name, (w) => w.slice(0, 3) + w[2] + w.slice(3)), 10],
    ["a letter wrong", (name) => slipped(name, (w) => w.slice(0, 3) + (w[3] === "e" ? "a" : "e") + w.slice(4)), 10],
    ["all but the last two letters", (name) => (plain(name).length >= 6 ? plain(name).slice(0, -2) : undefined), 5],
  ];
  const now = {};
  for (const [way, make, top] of ways) {
    let asked = 0;
    let first = 0;
    let within = 0;
    let nothing = 0;
    for (const name of names) {
      const q = make(name);
      if (!q) continue;
      asked++;
      const a = search(q);
      const got = a.listings.slice(0, top).map((l) => plain(l.name));
      if (got[0] === plain(name)) first++;
      if (got.includes(plain(name))) within++;
      if (a.counts.listing === 0) nothing++;
    }
    const share = (n) => Math.round((1000 * n) / asked) / 10;
    now[way] = { asked, first: share(first), within: share(within), top, nothing: share(nothing) };
  }
  const line = (name, m) => `${name.padEnd(9)} ${Object.values(m).map((w) => `${String(w.first).padStart(5)} ${String(w.within).padStart(5)} ${String(w.nothing).padStart(4)} `).join(" ")}`;
  console.log(`${names.length} names, each asked for six ways. For each way: the share (%) found first, the share in the\nfirst ten (the first five for a name half typed), and the share for which nothing at all was found.\n`);
  console.log(`${"".padEnd(9)} ${ways.map(([way]) => way.slice(0, 17).padEnd(18)).join(" ")}`);
  if (which !== "library" && record.library?.names) console.log(line("library", record.library.names));
  if (record[which]?.names) console.log(line(`${which}*`, record[which].names));
  console.log(line(which, now));
  if (flag("--write")) {
    writeFileSync(kept, `${JSON.stringify({ ...record, [which]: { ...record[which], names: now, namesAt: await commit() } }, null, 2)}\n`);
    console.log(`\nWritten to scripts/search-measure.json as "${which}".`);
  }
  process.exit(0);
}

// Every question once to warm the code, then five times, each timed.
for (const q of questions) search(q);
const times = [];
let slowest = { ms: 0, q: "" };
for (let round = 0; round < 5; round++) {
  for (const q of questions) {
    from = performance.now();
    search(q);
    const ms = performance.now() - from;
    times.push(ms);
    if (ms > slowest.ms) slowest = { ms, q };
  }
}
times.sort((a, b) => a - b);
const at = (share) => times[Math.min(times.length - 1, Math.floor(times.length * share))];
const round = (ms) => Math.round(ms * 100) / 100;
const now = {
  questions: questions.length,
  indexing: round(indexing),
  first: round(first),
  mistake: round(mistake),
  median: round(at(0.5)),
  p95: round(at(0.95)),
  p99: round(at(0.99)),
  slowest: round(slowest.ms),
  slowestQuestion: slowest.q.slice(0, 60),
  memory: Math.round(process.memoryUsage().heapUsed / 1048576),
};

const row = (name, m) => (m ? `${name.padEnd(9)} ${String(m.indexing).padStart(8)} ${String(m.first).padStart(8)} ${String(m.mistake ?? "").padStart(8)} ${String(m.median).padStart(8)} ${String(m.p95).padStart(8)} ${String(m.p99).padStart(8)} ${String(m.slowest).padStart(8)}   ${m.slowestQuestion}` : "");
console.log(`${questions.length} questions, five times each, in milliseconds.`);
console.log(`${"".padEnd(9)} ${"indexing".padStart(8)} ${"first".padStart(8)} ${"mistake".padStart(8)} ${"median".padStart(8)} ${"p95".padStart(8)} ${"p99".padStart(8)} ${"slowest".padStart(8)}   the slowest question`);
if (which !== "library" && record.library) console.log(row("library", record.library));
if (record[which]) console.log(row(`${which}*`, record[which]));
console.log(row(which, now));
console.log(`\n"indexing" is the documents going into the index; "first" is the first question, which builds\neverything the search holds; "mistake" is the first question with a typing mistake, when the engine\nfiles its words for close spellings. A row with a star is the one written down${record[which]?.at ? ` at ${record[which].at}` : ""}.`);
if (which !== "library" && record.library) {
  const slower = now.indexing > record.library.indexing * 1.5;
  console.log(`The index is built in ${round(now.indexing / record.library.indexing)} times the library's time${slower ? ", which is over the 1.5 allowed" : ""}; the 95th percentile is ${now.p95} ms${now.p95 > 30 ? ", which is over the 30 ms allowed" : ""}.`);
  if (slower || now.p95 > 30) process.exitCode = 1;
}
if (flag("--write")) {
  writeFileSync(kept, `${JSON.stringify({ ...record, [which]: { ...record[which], ...now, at: await commit(), node: process.version } }, null, 2)}\n`);
  console.log(`Written to scripts/search-measure.json as "${which}".`);
}
