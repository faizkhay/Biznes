import type { CookieOptions } from "@supabase/ssr";
import { AUTH_COOKIE, SIGNED_IN_COOKIE } from "./config";

type Jar = { name: string; value: string; options: CookieOptions }[];

/**
 * How the session's cookies are set. HttpOnly, because nothing in the browser needs to read them:
 * every call to Supabase is made on the server. Secure wherever the site is served for real.
 */
export const SESSION_COOKIE = {
  name: AUTH_COOKIE,
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
} as const;

/** True for the cookies that hold the session itself: the whole of it, or one of its pieces. */
export const holdsSession = (name: string) => name === AUTH_COOKIE || (name.startsWith(`${AUTH_COOKIE}.`) && /^\d+$/.test(name.slice(AUTH_COOKIE.length + 1)));

/**
 * Whenever the session's cookies are written, the marker is written with them: set while there is
 * a session, cleared when it goes. The header reads the marker to know whether to ask who is
 * signed in, so a visitor who never signs in costs the site no request at all.
 */
export function withMarker(jar: Jar): Jar {
  const session = jar.filter((c) => holdsSession(c.name));
  if (!session.length) return jar;
  const live = session.find((c) => c.value && (c.options.maxAge ?? 1) > 0);
  const { path, sameSite, secure } = SESSION_COOKIE;
  return [...jar, { name: SIGNED_IN_COOKIE, value: live ? "1" : "", options: { path, sameSite, secure, httpOnly: false, maxAge: live ? (live.options.maxAge ?? 0) : 0 } }];
}
