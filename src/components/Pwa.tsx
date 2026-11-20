"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { Close, Share } from "./Icons";

/** The browser's offer to install the site. TypeScript's own list of events does not carry it. */
type InstallOffer = Event & { prompt: () => Promise<unknown>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const CLOSED = "biznes:install-closed";
const QUIET_FOR = 30 * 24 * 60 * 60 * 1000; // a card that was closed stays away for thirty days

function closedLately() {
  try {
    const at = Number(window.localStorage.getItem(CLOSED));
    return at > 0 && Date.now() - at < QUIET_FOR;
  } catch {
    // Storage is closed to the page: nothing is remembered, and nothing breaks.
    return false;
  }
}

function rememberClosed() {
  try {
    window.localStorage.setItem(CLOSED, String(Date.now()));
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
 * and offers to put the site on the home screen. Where the browser makes the offer the card has an
 * Install button; on an iPhone or an iPad it says where to tap. It shows nothing on the server,
 * nothing until the page has loaded, nothing inside the installed app, and nothing for thirty days
 * once it has been closed.
 */
export default function Pwa() {
  const [way, setWay] = useState<"offer" | "ios" | null>(null);
  const offer = useRef<InstallOffer | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // After the page's own files, so the worker never competes with them.
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
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
      if (closedLately()) return;
      offer.current = event as InstallOffer;
      setWay("offer");
    };
    const onInstalled = () => {
      offer.current = null;
      setWay(null);
    };
    window.addEventListener("beforeinstallprompt", onOffer);
    window.addEventListener("appinstalled", onInstalled);
    if (ios() && !closedLately()) setWay("ios");
    return () => {
      window.removeEventListener("beforeinstallprompt", onOffer);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!way) return null;

  /** Take the card away, and hand the keyboard back to the page it sat on. */
  const leave = () => {
    offer.current = null;
    setWay(null);
    document.getElementById("main")?.focus({ preventScroll: true });
  };
  const close = () => {
    rememberClosed();
    leave();
  };
  const install = async () => {
    const event = offer.current;
    if (!event) return;
    leave(); // an offer can be taken up once
    try {
      await event.prompt();
      if ((await event.userChoice).outcome === "dismissed") rememberClosed();
    } catch {
      // The browser withdrew the offer: nothing to do.
    }
  };

  // On a phone the card sits above the tab bar, clear of the home indicator. A wide screen has no
  // tab bar, so there it sits in the bottom right corner. `--lift` is how far it is raised.
  return (
    <div
      role="region"
      aria-label={`Install ${site.name}`}
      className="card fixed inset-x-2 z-50 flex items-center gap-2 p-4 shadow-[var(--shadow-lg)] [--lift:5rem] lg:left-auto lg:right-4 lg:w-full lg:max-w-sm lg:[--lift:1rem] print:hidden"
      style={{ bottom: "calc(var(--lift) + env(safe-area-inset-bottom))" }}
    >
      <div className="min-w-0 flex-1">
        <p className="title-2 text-ink">Add {site.name} to your home screen</p>
        {way === "ios" && (
          <p className="caption-1 mt-1 flex items-center gap-1 text-ink-subtle">
            <Share className="h-4 w-4 flex-none" />
            Tap Share, then Add to Home Screen.
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
