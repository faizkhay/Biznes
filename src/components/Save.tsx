"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toggleSaved, useReady, useSaved } from "@/lib/saved";
import { Bookmark, Share, Tick } from "./Icons";

/**
 * Save a listing to the shortlist, or take it off. The shortlist lives in the visitor's browser.
 * Until the page's script has loaded the button's place is held and nothing is offered, so there
 * is never a button that does nothing.
 */
export function SaveButton({ id, name, edge = false, words = false }: { id: string; name: string; edge?: boolean; words?: boolean }) {
  const ready = useReady();
  const saved = useSaved().includes(id);
  if (words) {
    if (!ready) return null;
    return (
      <button type="button" className="btn btn-quiet button-md" aria-pressed={saved} onClick={() => toggleSaved(id)}>
        <Bookmark style={saved ? { fill: "var(--color-signal)" } : undefined} /> {saved ? "Saved" : "Save"}
      </button>
    );
  }
  if (!ready) return <span className="icon-btn" aria-hidden />;
  return (
    <button type="button" className={`icon-btn ${edge ? "icon-btn-edge" : ""}`} aria-pressed={saved} aria-label={saved ? `Remove ${name} from your saved list` : `Save ${name}`} title={saved ? "Saved" : "Save"} onClick={() => toggleSaved(id)}>
      <Bookmark />
    </button>
  );
}

/**
 * Share a page: the phone's own share sheet where there is one, and the link copied where there is
 * not. `path` is the page to share; without it, the page being read.
 */
export function ShareButton({ title, path, words = false, label }: { title: string; path?: string; words?: boolean; label?: string }) {
  const ready = useReady();
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (!said) return;
    const timer = setTimeout(() => setSaid(""), 2400);
    return () => clearTimeout(timer);
  }, [said]);
  if (!ready) return words ? null : <span className="icon-btn" aria-hidden />;
  const share = async () => {
    const url = path ? new URL(path, window.location.origin).href : window.location.href;
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The visitor closed the sheet: nothing to say.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setSaid("Link copied");
    } catch {
      setSaid(url);
    }
  };
  const name = label ?? `Share ${title}`;
  return (
    <>
      {words ? (
        <button type="button" className="btn btn-quiet button-md" onClick={share}>
          <Share /> {label ?? "Share"}
        </button>
      ) : (
        <button type="button" className="icon-btn" aria-label={name} title="Share" onClick={share}>
          <Share />
        </button>
      )}
      {/* The toast sits outside any row, so it is never under a row's link. */}
      <span role="status" className={said ? "toast body-3" : "sr-only"}>
        {said && <Tick />}
        {said}
      </span>
    </>
  );
}

/** The header's way to the shortlist, with how many are on it. */
export function SavedLink() {
  const n = useSaved().length;
  return (
    <Link href="/saved" prefetch={false} className="icon-btn icon-btn-sq" aria-label={n ? `Saved, ${n}` : "Saved"} title="Saved">
      <Bookmark />
      {n > 0 && (
        <span className="badge" aria-hidden>
          {n > 99 ? "99" : n}
        </span>
      )}
    </Link>
  );
}
