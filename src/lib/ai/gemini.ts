import "server-only";
import { AI, AI_BRIEF } from "@/data/ai";
import { GEMINI_KEY, GEMINI_MODEL, GEMINI_REVISION, GEMINI_URL } from "./config";
import type { Passage } from "./context";

/** What the model is asked to write: whether the passages answer, the answer, and which passages it is taken from. */
const SHAPE = {
  type: "object",
  properties: {
    answered: { type: "boolean" },
    answer: { type: "string" },
    sources: { type: "array", items: { type: "integer" } },
  },
  required: ["answered", "answer", "sources"],
} as const;

export type Written = { answered: boolean; answer: string; sources: number[]; tokens: { read: number; written: number } };

/** Google said no, or said something that could not be read. `code` is short and safe to show: it never holds the key or the question. */
export class Upstream extends Error {
  constructor(public code: string) {
    super(code);
  }
}

type Step = { type?: string; content?: { type?: string; text?: string }[] };
type Reply = { status?: string; steps?: Step[]; output_text?: string; usage?: { total_input_tokens?: number; total_output_tokens?: number; total_thought_tokens?: number }; error?: { code?: string | number; message?: string } };

/**
 * Puts one question to Gemini with the passages it may answer from, and reads back what it wrote.
 *
 * It is written to Google's Interactions API as its documentation stood on 26 November 2026
 * (README, "The AI answer"): one POST, the key in a header, the brief as the system instruction,
 * the reply held to a JSON shape, thinking at its least, and `store: false`, so Google does not
 * keep the exchange for later retrieval. Nothing that says who asked is sent: not an address,
 * not a name, not a cookie. It gives up after eight seconds; the page does not wait on it.
 */
export async function ask(question: string, passages: Passage[]): Promise<Written> {
  const input = [`Question: ${question}`, "", "Passages:", ...passages.map((p) => `[${p.n}] ${p.title}: ${p.text}`)].join("\n");
  let response: Response;
  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY, "Api-Revision": GEMINI_REVISION },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        system_instruction: AI_BRIEF,
        input,
        generation_config: { max_output_tokens: AI.maxOutputTokens, thinking_level: "minimal" },
        response_format: { type: "text", mime_type: "application/json", schema: SHAPE },
        store: false,
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch (error) {
    throw new Upstream(error instanceof Error && error.name === "TimeoutError" ? "timeout" : "unreachable");
  }
  const reply = (await response.json().catch(() => null)) as Reply | null;
  if (!response.ok) throw new Upstream(`${response.status}${reply?.error?.code ? ` ${String(reply.error.code).slice(0, 40)}` : ""}`);
  if (!reply || (reply.status && reply.status !== "completed")) throw new Upstream(`status ${String(reply?.status ?? "unread").slice(0, 24)}`);
  // The answer is the text of the model's own steps; its thinking, where there is any, is a step of another kind.
  const text = (reply.steps ?? []).filter((step) => step.type === "model_output").flatMap((step) => step.content ?? []).filter((part) => part.type === "text" && typeof part.text === "string").map((part) => part.text).join("") || reply.output_text || "";
  let wrote: { answered?: unknown; answer?: unknown; sources?: unknown };
  try {
    wrote = JSON.parse(text.replace(/^\s*```(?:json)?|```\s*$/g, ""));
  } catch {
    throw new Upstream("unread");
  }
  return {
    answered: wrote.answered === true,
    answer: typeof wrote.answer === "string" ? wrote.answer.replace(/\s+/g, " ").trim() : "",
    sources: Array.isArray(wrote.sources) ? wrote.sources.filter((n): n is number => Number.isInteger(n)) : [],
    tokens: { read: reply.usage?.total_input_tokens ?? 0, written: (reply.usage?.total_output_tokens ?? 0) + (reply.usage?.total_thought_tokens ?? 0) },
  };
}
