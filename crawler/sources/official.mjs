// The official pages: every government page, register and form the guides point to.
//
// The guides (content/guides/*.json) were written from pages read one by one, and each lists the
// pages a reader needs next. This gathers those into one list for the search, and visits each to
// record whether it still answers. A page that refuses crawlers, or is a PDF, stays in the list:
// it was read when the guide was written, and the list says when and whether it answered since.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { politeFetch, pool } from "../lib/fetcher.mjs";
import { hostOf, tidy } from "../lib/text.mjs";

export function readGuides(dir = "content/guides") {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));
}

export async function readOfficial(guides, { visit = true } = {}) {
  const byUrl = new Map();
  for (const guide of guides) {
    for (const r of guide.resources ?? []) {
      if (!r?.url || !/^https?:\/\//.test(r.url)) continue;
      const key = r.url.replace(/\/$/, "");
      const entry = byUrl.get(key) ?? { title: tidy(r.title, 140), url: r.url, publisher: tidy(r.publisher, 100), what: tidy(r.what, 260), guides: [] };
      if (!entry.guides.includes(guide.slug)) entry.guides.push(guide.slug);
      byUrl.set(key, entry);
    }
  }
  const list = [...byUrl.values()];
  if (visit) {
    await pool(list, 4, async (entry) => {
      const res = await politeFetch(entry.url);
      entry.checked = res.fetchedAt?.slice(0, 10);
      entry.answered = res.status >= 200 && res.status < 400 ? true : res.status === 0 && /robots|not HTML/.test(res.skipped ?? "") ? undefined : res.status ? false : undefined;
    });
  }
  return list.map((e) => ({ ...e, host: hostOf(e.url) })).sort((a, b) => a.publisher.localeCompare(b.publisher) || a.title.localeCompare(b.title));
}
