/**
 * What a form's server action sends back: whether it worked, a sentence to show above the form,
 * an error in words for each field that needs one, and what was typed, so nothing is lost.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export const NO_STATE: FormState = {};

/** One field of a posted form, trimmed and cut to a length. */
export const field = (data: FormData, name: string, max = 200) => {
  const v = data.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

/** The fields named, as typed, to hand back to the form. Passwords are never among them. */
export const typed = (data: FormData, names: string[]) => Object.fromEntries(names.map((n) => [n, field(data, n, 2000)]));

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE = /^\+?[\d ().-]{7,20}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What to say when the accounts service itself cannot be reached or answers with something unexpected. */
export const TRY_AGAIN = "That could not be done just now. Nothing was changed. Try again in a moment.";
export const SOON = "Accounts open soon.";

/**
 * Where to go after signing in: a path on this site and nothing else, so a link cannot send
 * someone to another site by way of ours.
 */
export function safeNext(next: unknown): string | undefined {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\s]/.test(next) || next.length > 300) return undefined;
  return next;
}
