"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTIONS } from "@/data/site";
import { SIGNED_IN_COOKIE, accountsOn } from "@/lib/accounts/config";

type Who = { name: string; initial: string };

const marked = () => document.cookie.split("; ").includes(`${SIGNED_IN_COOKIE}=1`);

/**
 * The header's way to an account: "Sign in", or, once signed in, the person's initial as a round
 * button that leads to their account. With accounts off it is nothing at all.
 *
 * Pages are served from a cache, so the page cannot know who is looking: this finds out in the
 * browser. It asks the server only when the browser holds the marker that someone is signed in
 * (src/lib/accounts/cookies.ts), so a visitor who never signs in costs no request. Without script
 * the link to sign in is there, and the account page itself knows who has come.
 *
 * The header's pill has no room for it on a phone, so there it is hidden and the footer carries
 * the way in (SiteFooter).
 */
export default function AccountControl() {
  const pathname = usePathname();
  const [who, setWho] = useState<Who | null>(null);

  useEffect(() => {
    if (!accountsOn) return;
    if (!marked()) {
      setWho(null);
      return;
    }
    let on = true;
    fetch("/account/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: ({ in: boolean } & Partial<Who>) | null) => on && setWho(me?.in ? { name: me.name ?? "", initial: me.initial ?? "" } : null))
      .catch(() => on && setWho(null));
    return () => {
      on = false;
    };
    // Asked again when the page changes: signing in and out both end on a new page.
  }, [pathname]);

  if (!accountsOn) return null;
  if (who) {
    return (
      <Link prefetch={false} href="/account" className="icon-btn icon-btn-edge title-2 hidden text-ink sm:inline-grid" aria-label={who.name ? `Your account, ${who.name}` : "Your account"} title="Your account">
        <span aria-hidden>{who.initial || "?"}</span>
      </Link>
    );
  }
  return (
    <Link prefetch={false} href="/account/sign-in" className="nav-link title-2 hidden shrink-0 px-2 sm:inline-flex">
      {ACTIONS.signIn}
    </Link>
  );
}
