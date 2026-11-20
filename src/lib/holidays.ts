import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type Holiday = { date: string; name: string; subjectToConfirmation?: boolean };
export type Holidays = {
  checked: string;
  years: Record<string, Holiday[]>;
  sources: { n: number; title: string; publisher: string; url: string; read: string }[];
  unverified: string[];
};

let held: Holidays | null | undefined;
/** The public holidays, from the official notices (content/holidays.json). Null if the file is not there. */
export function holidays(): Holidays | null {
  if (held !== undefined) return held;
  const file = join(process.cwd(), "content", "holidays.json");
  try {
    held = existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Holidays) : null;
  } catch {
    held = null;
  }
  return held;
}

/** A date with its weekday: "Sunday 8 November 2026". */
export const longDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).replace(",", "");
