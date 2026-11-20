import "server-only";
import { headers } from "next/headers";

/**
 * A count of tries from one connection, kept in memory: enough to stop a careless loop or a lazy
 * bot, not a determined one. It is per server instance. The database has limits of its own behind
 * each of the things this guards (supabase/migrations).
 */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

/** True when this connection has tried `what` more than `most` times in ten minutes. This try is counted. */
export async function tooMany(what: string, most: number): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${what}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, times] of hits) if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return recent.length > most;
}
