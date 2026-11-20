// The polite fetcher: every page the crawler reads comes through here.
//
// It asks a site's robots.txt before anything else and obeys it. It never asks one site for two
// things at once, and waits between requests to the same site. It gives up on a slow site, reads
// only the start of a large page, reads only HTML, and keeps what it fetched so that a second run
// does not ask again.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.mjs";
import { allowed, groupFor, parseRobots } from "./robots.mjs";

const pagesDir = join(config.cacheDir, "pages");
const robotsDir = join(config.cacheDir, "robots");
mkdirSync(pagesDir, { recursive: true });
mkdirSync(robotsDir, { recursive: true });

const key = (text) => createHash("sha1").update(text).digest("hex");
const fresh = (file, hours) => existsSync(file) && Date.now() - statSync(file).mtimeMs < hours * 3600_000;
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Errors that are the line's fault, not the site's: worth asking again after a pause. */
const PASSING = /ECONNRESET|UND_ERR_SOCKET|EAI_AGAIN|UND_ERR_CONNECT_TIMEOUT|^0$|socket hang up|terminated/;

/** One request, asked again (twice at most) when the line drops. Never throws: an error is a result. */
async function request(url, options) {
  let res = await once(url, options);
  for (let attempt = 1; attempt <= 2 && res.status === 0 && PASSING.test(res.error ?? ""); attempt++) {
    await sleep(1500 * attempt);
    res = await once(url, options);
  }
  return res;
}

async function once(url, { accept = "text/html,application/xhtml+xml", maxBytes = config.web.maxBytes } = {}) {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), config.web.timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: control.signal,
      headers: { "user-agent": config.userAgent, accept, "accept-language": "en-GB,en;q=0.8,fr;q=0.7" },
    });
    const type = res.headers.get("content-type") ?? "";
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      return { status: res.status, location: new URL(location, url).href, type };
    }
    const chunks = [];
    let size = 0;
    if (res.body) {
      const reader = res.body.getReader();
      while (size < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.length;
      }
      await reader.cancel().catch(() => {});
    }
    return { status: res.status, type, bytes: Buffer.concat(chunks) };
  } catch (error) {
    return { status: 0, error: control.signal.aborted ? "timed out" : String(error?.cause?.code ?? error?.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

/** Each site's queue: a promise that settles when the site may be asked again. */
const hostGate = new Map();
async function turn(host, delayMs) {
  const before = hostGate.get(host) ?? Promise.resolve();
  let release;
  const mine = new Promise((done) => (release = done));
  hostGate.set(host, before.then(() => mine));
  await before;
  return () => setTimeout(release, delayMs);
}

const robotsMemo = new Map();
/** A site's rules for this crawler. A site whose robots.txt cannot be read is left alone. */
async function rulesFor(origin) {
  if (robotsMemo.has(origin)) return robotsMemo.get(origin);
  const load = (async () => {
    const file = join(robotsDir, `${key(origin)}.json`);
    if (fresh(file, config.web.maxAgeHours)) return JSON.parse(readFileSync(file, "utf8"));
    let url = `${origin}/robots.txt`;
    let res = null;
    for (let hop = 0; hop < 4; hop++) {
      res = await request(url, { accept: "text/plain,*/*", maxBytes: 300_000 });
      if (!res.location) break;
      url = res.location;
    }
    let saved;
    if (res.status >= 200 && res.status < 300) saved = { ok: true, group: groupFor(parseRobots(res.bytes.toString("utf8")), config.robotsToken) };
    // No robots.txt means no rules. A server error, or no answer, means the site cannot say, so it is not crawled.
    else if (res.status >= 400 && res.status < 500) saved = { ok: true, group: { agents: ["*"], rules: [], delay: null } };
    else saved = { ok: false, why: res.error ?? `robots.txt answered ${res.status}` };
    writeFileSync(file, JSON.stringify(saved));
    return saved;
  })();
  robotsMemo.set(origin, load);
  return load;
}

/**
 * Fetches one page, politely. Returns { url, status, html, fetchedAt } or { url, status: 0, skipped }.
 * `url` is where the page finally was, after any redirects.
 */
export async function politeFetch(startUrl) {
  const file = join(pagesDir, `${key(startUrl)}.json`);
  if (fresh(file, config.web.maxAgeHours)) return { ...JSON.parse(readFileSync(file, "utf8")), cached: true };

  let url = startUrl;
  let result = null;
  for (let hop = 0; hop < 5; hop++) {
    let at;
    try {
      at = new URL(url);
    } catch {
      result = { url, status: 0, skipped: "not an address" };
      break;
    }
    if (at.protocol !== "https:" && at.protocol !== "http:") {
      result = { url, status: 0, skipped: "not a web address" };
      break;
    }
    const rules = await rulesFor(at.origin);
    if (!rules.ok) {
      result = { url, status: 0, skipped: `robots.txt could not be read (${rules.why})` };
      break;
    }
    if (!allowed(rules.group, at.pathname + at.search)) {
      result = { url, status: 0, skipped: "robots.txt says no" };
      break;
    }
    // A site may ask for a longer pause than ours; one above ten seconds is honoured as ten.
    const delay = Math.max(config.web.hostDelayMs, Math.min(10, rules.group.delay ?? 0) * 1000);
    const done = await turn(at.host, delay);
    const res = await request(url);
    done();
    if (res.location) {
      url = res.location;
      continue;
    }
    if (res.status === 0) result = { url, status: 0, skipped: res.error };
    else if (!/html/i.test(res.type)) result = { url, status: res.status, skipped: `not HTML (${res.type || "no type"})` };
    else result = { url, status: res.status, html: decode(res.bytes, res.type) };
    break;
  }
  result ??= { url, status: 0, skipped: "too many redirects" };
  result.fetchedAt = new Date().toISOString();
  writeFileSync(file, JSON.stringify(result));
  return result;
}

/** Bytes to text, in the character set the page declares. */
function decode(bytes, type) {
  const head = bytes.subarray(0, 2048).toString("latin1");
  const named = /charset=["']?([\w-]+)/i.exec(type)?.[1] ?? /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(named.toLowerCase(), { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

/** Runs `work` over `items`, a few at a time. */
export async function pool(items, size, work) {
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      await work(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
}

/** A plain download to a file, for the map extract: tries each address until one works. */
export async function download(urls, file, maxAgeHours) {
  // Where a kept copy came from is written beside it, so the index can still say.
  const note = `${file}.from`;
  const kept = () => (existsSync(note) ? readFileSync(note, "utf8").trim() : "an earlier download");
  if (fresh(file, maxAgeHours)) return { file, from: kept() };
  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, { headers: { "user-agent": config.userAgent } });
        if (!res.ok) throw new Error(`answered ${res.status}`);
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        writeFileSync(note, url);
        return { file, from: url };
      } catch (error) {
        console.log(`  ${url}: ${error?.cause?.code ?? error.message} (try ${attempt})`);
        await sleep(2000 * attempt);
      }
    }
  }
  if (existsSync(file)) return { file, from: kept() };
  throw new Error("No mirror answered and there is no earlier copy.");
}
