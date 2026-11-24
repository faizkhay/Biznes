"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BAZ, site } from "@/data/site";
import { inBaz } from "@/lib/baz";
import { Close, Share } from "./Icons";

/** The browser's offer to install the site. TypeScript's own list of events does not carry it. */
type InstallOffer = Event & { prompt: () => Promise<unknown>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * The two apps this site installs as: the whole of biznes.mu, and Baz Manzer, the section under
 * /baz-manzer, which has a manifest of its own. A page offers the one it belongs to, in that
 * app's own words. `closed` is where the browser notes that the offer was closed, and `quiet`
 * for how long it then stays away: thirty days for the site's, and for good for the section's.
 */
const APPS = {
  site: { name: site.name, words: `Add ${site.name} to your home screen`, ios: "Tap Share, then Add to Home Screen.", closed: "biznes:install-closed", quiet: 30 * 24 * 60 * 60 * 1000 },
  baz: { name: BAZ.name, words: BAZ.app.install, ios: BAZ.app.ios, closed: "biznes:install-closed-baz", quiet: Infinity },
} as const;
type App = keyof typeof APPS;

/** The app a page belongs to, by its address. */
const appOf = (pathname: string): App => (inBaz(pathname) ? "baz" : "site");

function closedLately(app: App) {
  try {
    const at = Number(window.localStorage.getItem(APPS[app].closed));
    return at > 0 && Date.now() - at < APPS[app].quiet;
  } catch {
    // Storage is closed to the page: nothing is remembered, and nothing breaks.
    return false;
  }
}

function rememberClosed(app: App) {
  try {
    window.localStorage.setItem(APPS[app].closed, String(Date.now()));
  } catch {
    // The card will come back on the next page; there is nowhere to note that it was closed.
  }
}

/** Already opened from the home screen: there is nothing left to install. */
const standalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * An iPhone or an iPad. Neither makes the offer to install, so the way is told in words. An iPad
 * may name itself a Mac, and is known then by its touch screen. Inside another app's own browser
 * there is no Share button to tap, so nothing is said there.
 */
function ios() {
  const agent = navigator.userAgent;
  const apple = /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);
  return apple && !/FBAN|FBAV|Instagram|Line\//.test(agent);
}

/**
 * What makes the site an app: it registers the service worker (public/sw.js), in production only,
 * and offers to put the app the page belongs to on the home screen: Baz Manzer on a page of that
 * section, biznes.mu everywhere else. Where the browser makes the offer the card has an Install
 * button; on an iPhone or an iPad it says where to tap. It shows nothing on the server, nothing
 * until the page has loaded, nothing inside an installed app, nothing on the landing page, and
 * nothing once it has been closed (for thirty days for the site's, for good for the section's).
 * There is never more than one card.
 *
 * The browser's offer is for the manifest the page named when the offer was made. A step from the
 * site into the section, or back, changes the manifest without loading a page, so an offer is
 * shown only on the pages of the app it was made for; the browser makes a new one for the other
 * app when it reads the new manifest, and until it does there is no card.
 */
export default function Pwa() {
  const pathname = usePathname();
  const app = appOf(pathname);
  // The landing page is one screen with one question on it, and has no bar at its foot for a
  // card to sit above: nothing is offered there. The offer waits for the next page.
  const bare = pathname === "/";
  /** The app the browser's held offer is for. */
  const [offered, setOffered] = useState<App | null>(null);
  /** On an iPhone or an iPad: the app whose way on to the home screen is being told. */
  const [told, setTold] = useState<App | null>(null);
  const offer = useRef<InstallOffer | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A worker left on this address by a production run would hand `next dev` its kept files.
      navigator.serviceWorker
        .getRegistrations()
        .then((all) => all.forEach((registration) => registration.unregister()))
        .catch(() => {});
      return;
    }
    // After the page's own files, so the worker never competes with them.
    const register = () => {
      // A page opened before any worker was here was fetched without it. Once the worker is
      // ready the page asks to be kept, so even the first page ever opened works with no connection.
      const first = !navigator.serviceWorker.controller;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => (first ? navigator.serviceWorker.ready : null))
        .then((registration) => registration?.active?.postMessage({ keep: window.location.pathname + window.location.search }))
        .catch(() => {
          // No worker: the site works as it did, with a connection.
        });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    if (standalone()) return;
    const onOffer = (event: Event) => {
      // The browser's own bar stays away: the card asks in its place, and only if it is welcome.
      event.preventDefault();
      // The offer is for the app whose manifest the page names now.
      const made = appOf(window.location.pathname);
      if (closedLately(made)) return;
      offer.current = event as InstallOffer;
      setOffered(made);
    };
    const onInstalled = () => {
      offer.current = null;
      setOffered(null);
    };
    window.addEventListener("beforeinstallprompt", onOffer);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onOffer);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // An iPhone makes no offer, so the way is told in words, for the app this page belongs to.
  useEffect(() => {
    setTold(!standalone() && ios() && !closedLately(app) ? app : null);
  }, [app]);

  const way = bare ? null : offered === app ? "offer" : told === app ? "ios" : null;
  if (!way) return null;

  /** Take the card away, and hand the keyboard back to the page it sat on. */
  const leave = () => {
    offer.current = null;
    setOffered(null);
    setTold(null);
    document.getElementById("main")?.focus({ preventScroll: true });
  };
  const close = () => {
    rememberClosed(app);
    leave();
  };
  const install = async () => {
    const event = offer.current;
    if (!event) return;
    leave(); // an offer can be taken up once
    try {
      await event.prompt();
      if ((await event.userChoice).outcome === "dismissed") rememberClosed(app);
    } catch {
      // The browser withdrew the offer: nothing to do.
    }
  };

  // On a phone the card sits above the tab bar, clear of the home indicator. A wide screen has no
  // tab bar, so there it sits in the bottom right corner. `--lift` is how far it is raised.
  return (
    <div
      role="region"
      aria-label={`Install ${APPS[app].name}`}
      data-app={app}
      className="card fixed inset-x-2 z-50 flex items-center gap-2 p-4 shadow-[var(--shadow-lg)] [--lift:5rem] lg:left-auto lg:right-4 lg:w-full lg:max-w-sm lg:[--lift:1rem] print:hidden"
      style={{ bottom: "calc(var(--lift) + env(safe-area-inset-bottom))" }}
    >
      {app === "baz" && <span className="baz-mark flex-none" aria-hidden />}
      <div className="min-w-0 flex-1">
        <p className="title-2 text-ink">{APPS[app].words}</p>
        {way === "ios" && (
          <p className="caption-1 mt-1 flex items-center gap-1 text-ink-subtle">
            <Share className="h-4 w-4 flex-none" />
            {APPS[app].ios}
          </p>
        )}
      </div>
      {way === "offer" && (
        <button type="button" className="btn btn-filled btn-sm button-sm" onClick={install}>
          Install
        </button>
      )}
      <button type="button" className="icon-btn -mr-2" aria-label="Close" onClick={close}>
        <Close />
      </button>
    </div>
  );
}
