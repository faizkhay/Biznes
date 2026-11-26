import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { AI } from "@/data/ai";
import { search } from "@/lib/search";
import { aiOn, GEMINI_MODEL } from "./config";
import { passagesFor, supported, worthAsking, type Passage } from "./context";
import { ask, Upstream } from "./gemini";

/** The answer as the page shows it: the words, and the articles they are taken from. */
export type AiAnswer = { text: string; sources: { title: string; href: string }[] };
/**
 * Why there is no answer, in one word, for whoever is finding out why. None of them holds anything
 * private: "off" (no key), "gate" (not a question the site's articles answer), "limit" (too many
 * new questions from one connection), "cap" (the day's guard), "none" (the model found no answer
 * in the passages), "unsupported" (it wrote a figure the passages do not hold, and was thrown
 * away), and "upstream ..." (Google refused or could not be read, with its own short code).
 */
export type AiResult = { answer: AiAnswer | null; why?: string };

/** A day's count of questions put to the model, on this server instance. */
const today = { day: "", asked: 0 };
/** One connection's new questions in the last ten minutes, on this server instance. */
const WINDOW_MS = 10 * 60 * 1000;
const recent = new Map<string, number[]>();
class Refused extends Error {}

function count(connection: string) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  if (today.day !== day) Object.assign(today, { day, asked: 0 });
  if (today.asked >= AI.perDay) throw new Refused("cap");
  const mine = (recent.get(connection) ?? []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= AI.perVisitor) throw new Refused("limit");
  mine.push(now);
  recent.set(connection, mine);
  if (recent.size > 5000) for (const [key, times] of recent) if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
  today.asked++;
}

/**
 * The model's answer to a question, checked. The model is asked, then the site checks what it
 * wrote: that it says it answered, that every figure in it is in the passages, that it names the
 * passages it used. Whatever fails a check is no answer.
 */
async function written(question: string, passages: Passage[]): Promise<AiResult> {
  const wrote = await ask(question, passages);
  if (!wrote.answered || !wrote.answer) return { answer: null, why: "none" };
  if (!supported(wrote.answer, passages)) return { answer: null, why: "unsupported" };
  const used = [...new Set(wrote.sources)].map((n) => passages.find((p) => p.n === n)).filter((p): p is Passage => Boolean(p));
  // An answer that names no passage it was given rests on nothing the page can show.
  if (!used.length) return { answer: null, why: "unsupported" };
  const pages = new Map(used.map((p) => [p.href.split("#")[0], { title: p.title, href: p.href }]));
  return { answer: { text: wrote.answer, sources: [...pages.values()].slice(0, 3) } };
}

/**
 * The AI answer to a question, or the reason there is none.
 *
 * It is made to cost as little as it can. The model is not asked at all unless the site's own
 * articles have something to say (`worthAsking`). An answer, or the finding that there is none, is
 * kept for a week under the question and the passages together, so the same question costs once,
 * and an article that has been corrected is asked about afresh. New questions are counted, by
 * connection and by day; a kept one is not. A refusal by Google is not kept.
 */
export async function aiAnswer(question: string, connection: string): Promise<AiResult> {
  if (!aiOn) return { answer: null, why: "off" };
  const q = question.replace(/\s+/g, " ").trim();
  const found = search(q);
  if (!worthAsking(q, found)) return { answer: null, why: "gate" };
  const passages = passagesFor(found);
  if (!passages.length) return { answer: null, why: "gate" };
  const key = createHash("sha256").update(JSON.stringify([GEMINI_MODEL, q.toLowerCase(), passages])).digest("hex");
  try {
    return await unstable_cache(
      async () => {
        count(connection);
        return written(q, passages);
      },
      ["ai-answer", key],
      { revalidate: AI.keep },
    )();
  } catch (error) {
    if (error instanceof Refused) return { answer: null, why: error.message };
    if (error instanceof Upstream) {
      console.warn(`[ai] no answer: upstream ${error.code}`);
      return { answer: null, why: `upstream ${error.code}` };
    }
    console.warn("[ai] no answer: error");
    return { answer: null, why: "error" };
  }
}

/** Whether the page should make room for an answer: the same rule the endpoint keeps, with no call to anyone. */
export const aiLikely = (question: string, found: Parameters<typeof worthAsking>[1]) => aiOn && worthAsking(question, found) && passagesFor(found).length > 0;
