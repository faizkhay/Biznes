// The web: the front page of each business's own site, and of the Mauritian sites those link to.
//
// It starts from the websites the listings name. From each front page it takes what the page says
// about itself (lib/html.mjs) and notes the other sites it links to. A linked site is visited too
// when its address ends in one of the endings in config.web.follow (".mu"), up to the limits set
// there. That is the whole of the crawl: one page a site, robots.txt obeyed, a pause between
// requests, nothing behind a form or a login, no email addresses.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config.mjs";
import { extract } from "../lib/html.mjs";
import { politeFetch } from "../lib/fetcher.mjs";
import { SHARED_HOSTS, hostOf } from "../lib/text.mjs";
import { HUBS, LISTS } from "../seeds.mjs";

const saved = join(config.cacheDir, "web.json");

/** `seeds` is [{ url }]. Returns { pages: { host: page }, stats }. */
export async function crawlWeb(seeds, { visit = true } = {}) {
  if (!visit) {
    if (existsSync(saved)) return JSON.parse(readFileSync(saved, "utf8"));
    return { pages: {}, stats: { visited: 0, note: "no sites were visited in this run" } };
  }

  const pages = {};
  const queue = [];
  const queued = new Set();
  let discovered = 0;
  const add = (url, depth, via, { any = false, hub = false } = {}) => {
    const host = hostOf(url);
    if (!host || queued.has(host) || SHARED_HOSTS.test(host)) return;
    if (queue.length >= config.web.maxHosts) return;
    if (depth > 0) {
      // Found by a link: followed if a hub named it, or if its address has one of the endings we follow.
      if (!any && !config.web.follow.some((ending) => host.endsWith(ending))) return;
      if (discovered >= config.web.maxDiscovered) return;
      discovered++;
    }
    queued.add(host);
    // An address written with http is tried over https first, and as written only if that fails.
    const secure = url.replace(/^http:\/\//i, "https://");
    queue.push({ url: secure, plain: secure === url ? undefined : url, host, depth, via, hub });
  };
  for (const seed of seeds) add(seed.url, 0, null);
  const named = queue.length;
  for (const hub of HUBS) add(hub, 0, null, { hub: true });
  const hubHosts = new Set(HUBS.map(hostOf));
  const hubPagesRead = new Map();
  const hubPagesSeen = new Set();

  const stats = { named, hubs: HUBS.length, hubPages: 0, visited: 0, read: 0, refused: 0, unreachable: 0, notHtml: 0, fromCache: 0 };
  let next = 0;
  let active = 0;
  /** A hub's own page that lists members: read for its links, and not kept as a page of the index. */
  const hubPage = async (job) => {
    const res = await politeFetch(job.url);
    stats.hubPages++;
    if (!res.html || res.status >= 400) return;
    follow(job, extract(res.html, res.url));
  };
  const follow = (job, found) => {
    for (const origin of found.links) add(`${origin}/`, 1, job.host, { any: true });
    const read = hubPagesRead.get(job.host) ?? 0;
    let more = 0;
    for (const { href, words } of found.own) {
      if (read + more >= config.web.hubPages) break;
      if (hubPagesSeen.has(href) || /\.(pdf|jpe?g|png|zip|docx?|xlsx?)$/i.test(href)) continue;
      // On a page already reached as a list, the links to its next pages are followed too.
      const lists = LISTS.test(words) || LISTS.test(decodeURIComponent(new URL(href).pathname)) || (job.listing && /[?&/]page[=/]?\d+|\/\d+\/?$/i.test(href));
      if (!lists) continue;
      hubPagesSeen.add(href);
      more++;
      queue.push({ url: href, host: job.host, depth: 0, via: job.host, hub: true, listing: true });
    }
    hubPagesRead.set(job.host, read + more);
  };

  const one = async (job) => {
    if (job.listing) return hubPage(job);
    let res = await politeFetch(job.url);
    if (!res.html && job.plain && !/says no/.test(res.skipped ?? "")) res = await politeFetch(job.plain);
    stats.visited++;
    if (res.cached) stats.fromCache++;
    const page = { host: job.host, asked: job.url, url: res.url, status: res.status, checked: res.fetchedAt?.slice(0, 10), depth: job.depth, via: job.via ?? undefined };
    if (res.html) {
      stats.read++;
      const found = extract(res.html, res.url);
      Object.assign(page, { title: found.title, description: found.description, siteName: found.siteName, lang: found.lang, declared: found.declared ?? undefined, tel: found.tel ?? undefined, social: found.social, parked: found.parked || undefined, mauritian: found.mauritian || undefined, hub: job.hub || undefined, words: found.words });
      if (res.status < 400) {
        if (job.hub && hubHosts.has(job.host)) follow(job, found);
        else if (job.depth < 2) for (const origin of found.links) add(`${origin}/`, job.depth + 1, job.host);
      }
    } else {
      page.skipped = res.skipped;
      if (/says no/.test(res.skipped ?? "")) stats.refused++;
      else if (/not HTML/.test(res.skipped ?? "")) stats.notHtml++;
      else stats.unreachable++;
    }
    pages[job.host] = page;
    if (stats.visited % 100 === 0) console.log(`  ${stats.visited} of ${queue.length} sites (${stats.read} read, ${stats.refused} closed to crawlers by robots.txt, ${stats.unreachable} did not answer)`);
  };
  await new Promise((resolve) => {
    const pump = () => {
      while (active < config.web.concurrency && next < queue.length) {
        active++;
        one(queue[next++])
          .catch((error) => console.log(`  ${error.message}`))
          .finally(() => {
            active--;
            pump();
          });
      }
      if (active === 0 && next >= queue.length) resolve();
    };
    pump();
  });
  stats.discovered = discovered;
  const result = { pages, stats };
  writeFileSync(saved, JSON.stringify(result));
  return result;
}
