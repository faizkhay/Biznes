import "server-only";
import { AI } from "@/data/ai";

/**
 * The AI answer runs on Google's Gemini API, and is on only when the site is told the key:
 *
 *   GEMINI_API_KEY   the key, from Google AI Studio. Server-only: it is never NEXT_PUBLIC_, never
 *                    in the repository, and never sent to a browser. Set it on the host.
 *   GEMINI_MODEL     optional: another model than the one in src/data/ai.ts, by its API name.
 *   AI_TEST_URL      for the checks only: an address on this machine (http://127.0.0.1 or
 *                    http://localhost) to ask in Google's place. Any other address is ignored.
 *
 * With no key the site behaves exactly as it did before: no card is drawn, nothing is asked of
 * anyone, and the endpoint says "off".
 */
export const GEMINI_KEY = process.env.GEMINI_API_KEY ?? "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || AI.model;
/** The checks' stand-in is taken only at an address on this machine: a question, and the key with it, can be sent nowhere but to Google or to here. */
const STAND_IN = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(process.env.AI_TEST_URL ?? "") ? process.env.AI_TEST_URL : undefined;
/** Where a question is sent: Google's Interactions API, or the checks' own stand-in. */
export const GEMINI_URL = STAND_IN || "https://generativelanguage.googleapis.com/v1beta/interactions";
/** The revision of the API the request is written to, as Google's own examples send it. */
export const GEMINI_REVISION = "2026-05-20";
export const aiOn = Boolean(GEMINI_KEY);
