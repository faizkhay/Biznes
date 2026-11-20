import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmergencyItem = { name: string; number: string; also?: string[]; what: string; hours?: string | null; sources: number[] };
export type Emergency = {
  checked: string;
  groups: { id: string; label: string; items: EmergencyItem[] }[];
  sources: { n: number; title: string; publisher: string; url: string; read: string }[];
  unverified: string[];
};

let held: Emergency | null | undefined;
/**
 * The emergency numbers and helplines (content/emergency.json): each from an official page that
 * was read, named with the day. Null until the file has been written.
 */
export function emergency(): Emergency | null {
  if (held !== undefined) return held;
  const file = join(process.cwd(), "content", "emergency.json");
  try {
    held = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Emergency) : null;
  } catch {
    held = null;
  }
  return held;
}

/** A number as a link to dial: a short code as it is, a full number without its spaces. */
export const dialHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;
