import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { SESSION_COOKIE, withMarker } from "./cookies";

/**
 * The database, as whoever is signed in. One client a request, made from the request's cookies
 * with the publishable key, so everything it reads or writes passes the row level security of the
 * person asking. Call it only where accounts are on.
 *
 * A server action and a route handler can write cookies, so there a refreshed session is kept. A
 * page cannot: for the pages that need a session, src/proxy.ts has refreshed it before they render.
 */
export const db = cache(async (): Promise<SupabaseClient> => {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: SESSION_COOKIE,
    cookies: {
      getAll: () => store.getAll(),
      setAll(jar) {
        try {
          for (const { name, value, options } of withMarker(jar)) store.set(name, value, options);
        } catch {
          // A page being rendered cannot set cookies. The proxy has already refreshed the session.
        }
      },
    },
  });
});

/** Give up on the accounts service after this long, so a page never hangs on it. */
const PATIENCE_MS = 4000;

let visitor: SupabaseClient | undefined;
/**
 * The database, as a visitor who is not signed in: the publishable key and no cookies. It reads
 * only what the public may read (live businesses, their active services, the site's look), so its
 * answers can be cached and shared between everyone.
 */
export function publicDb(): SupabaseClient {
  return (visitor ??= createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(PATIENCE_MS) }) },
  }));
}
