import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, accountsOn } from "@/lib/accounts/config";
import { SESSION_COOKIE, holdsSession, withMarker } from "@/lib/accounts/cookies";

/**
 * Keeps a signed-in person's session fresh, and does nothing else.
 *
 * A session is a short-lived token and a longer-lived one to renew it with, both in cookies. A
 * page cannot write cookies while it renders, so the renewal happens here, before the page: the
 * new cookies go to the page in the request and to the browser in the response.
 *
 * It runs only for the account pages (the matcher below), and only when accounts are on and the
 * request carries a session. Every public page is untouched by it, so those stay cacheable.
 *
 * It protects nothing by itself: each page and each server action reads the person again, and the
 * database decides what they may do.
 */
export async function proxy(request: NextRequest) {
  if (!accountsOn || !request.cookies.getAll().some((c) => holdsSession(c.name))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: SESSION_COOKIE,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(jar, headers) {
        const all = withMarker(jar);
        for (const { name, value } of all) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of all) response.cookies.set(name, value, options);
        // A response that sets a session must never be kept by a cache between us and the browser.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });
  try {
    // Reads the session and renews it if it is about to run out.
    await supabase.auth.getClaims();
  } catch {
    // The accounts service could not be reached. The page will find nobody signed in, and say so.
  }
  return response;
}

export const config = {
  matcher: ["/account/:path*", "/dashboard/:path*", "/admin/:path*", "/auth/:path*"],
};
