"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import { shortUrl, telHref } from "@/lib/format";
import { saveAll, useReady, useSaved } from "@/lib/saved";
import { CategoryIcon, PageIcon } from "../Glyphs";
import { Bookmark, Globe, Phone } from "../Icons";
import { SaveButton, ShareButton } from "../Save";

/** Where the site's own saved list keeps its rows, so the list still opens with no connection. This list reads and writes the same. */
const ROWS_KEY = "biznes:saved-rows";

type Row = { id: string; slug: string; name: string; group?: string; what: string; phone?: string; web?: string };

/**
 * The saved places: the visitor's shortlist, narrowed to places to eat. It is the same shortlist
 * as the whole site's (src/lib/saved.ts), kept in the visitor's own browser, so a place saved
 * anywhere on biznes.mu is here, and what else has been saved is on the site's own list. With
 * `shared` it shows a list someone sent as a link, and offers to keep it. Every place leads to
 * its page inside the section.
 */
export default function BazSaved({ shared }: { shared?: string[] }) {
  const ready = useReady();
  const mine = useSaved();
  const ids = shared ?? mine;
  const key = ids.join(",");
  const sent = shared !== undefined;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!key) {
      setRows([]);
      return;
    }
    let on = true;
    fetch(`/api/listings?ids=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { listings: Row[] }) => {
        if (!on) return;
        setRows(data.listings);
        setFailed(false);
        try {
          if (!sent) window.localStorage.setItem(ROWS_KEY, JSON.stringify(data.listings));
        } catch {
          // Storage is closed to the page: the list simply needs a connection.
        }
      })
      .catch(() => {
        if (!on) return;
        try {
          const kept = JSON.parse(window.localStorage.getItem(ROWS_KEY) ?? "[]") as Row[];
          const wanted = new Set(key.split(","));
          const rows = kept.filter((row) => wanted.has(row.id));
          if (rows.length) return setRows(rows);
        } catch {
          // Nothing kept: say the list could not be loaded.
        }
        setFailed(true);
      });
    return () => {
      on = false;
    };
  }, [key, sent]);

  if (!ready || (rows === null && !failed)) {
    return (
      <div className="grid gap-4" aria-busy="true" aria-label="Loading your saved places">
        {[0, 1, 2].map((i) => (
          <div key={i} className="wait h-20" />
        ))}
      </div>
    );
  }
  if (failed) return <p className="note body-3">The list could not be loaded just now. Try again in a moment.</p>;
  const eats = (rows ?? []).filter((row) => row.group === "eat");
  const others = (rows ?? []).length - eats.length;
  // What else is on the shortlist is the whole site's to show: said, with the way to it.
  const elsewhere = others > 0 && !sent && (
    <p className="body-3 mt-8 text-ink-subtle">
      {others === 1 ? "One other listing you have saved is not a place to eat. It is" : `${others} other listings you have saved are not places to eat. They are`} on{" "}
      <a href="/saved" className="font-semibold text-link">
        your saved list on {BAZ.back.label}
      </a>
      .
    </p>
  );
  if (!eats.length) {
    return (
      <>
        <div className="card card-panel max-w-xl">
          <span className="tile-icon bg-paper">
            <PageIcon href="/saved" />
          </span>
          <h2 className="heading-3 mt-4">{sent ? "No place to eat is on that list" : "No place to eat saved yet"}</h2>
          <p className="body-2 mt-2 text-ink-subtle">Tap the bookmark on any place to keep it here. The list stays in this browser, on this device; nothing about it is sent to us.</p>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link href={baz.search()} className="btn btn-filled button-md">
              {BAZ.search.label}
            </Link>
            <Link href={baz.home} className="btn btn-quiet button-md">
              Every place to eat
            </Link>
          </p>
        </div>
        {elsewhere}
      </>
    );
  }
  const all = eats.map((r) => r.id);
  const kept = sent ? all.every((id) => mine.includes(id)) : false;
  return (
    <>
      <p className="mb-6 flex flex-wrap items-center gap-3">
        {sent ? (
          <button type="button" className="btn btn-filled button-md" disabled={kept} onClick={() => saveAll(all)}>
            <Bookmark /> {kept ? "Saved to your list" : `Save all ${eats.length} to your list`}
          </button>
        ) : (
          <ShareButton title={`Places to eat from ${BAZ.name}`} path={`${baz.saved}?ids=${all.join(",")}`} words label="Share this list" />
        )}
      </p>
      <ul className="rows">
        {eats.map((r) => (
          <li key={r.id}>
            <article className="row listing" data-listing={r.id}>
              <span className="listing-icon" aria-hidden>
                <CategoryIcon group={r.group} />
              </span>
              <div className="min-w-0">
                <h2 className="title-1">
                  <Link prefetch={false} href={baz.place(r.slug)} className="row-title">
                    {r.name}
                  </Link>
                </h2>
                <p className="body-3 mt-0.5 text-ink-subtle">{r.what}</p>
                {(r.phone || r.web) && (
                  <p className="mt-3 flex flex-wrap gap-2">
                    {r.phone && (
                      <a href={telHref(r.phone)} className="act data-2">
                        <Phone /> <span>{r.phone}</span>
                      </a>
                    )}
                    {r.web && (
                      <a href={r.web} rel="noopener nofollow" className="act data-2">
                        <Globe /> <span>{shortUrl(r.web).split("/")[0]}</span>
                      </a>
                    )}
                  </p>
                )}
              </div>
              <div className="listing-acts">
                <SaveButton id={r.id} name={r.name} />
                <ShareButton title={r.name} path={baz.place(r.slug)} />
              </div>
            </article>
          </li>
        ))}
      </ul>
      {elsewhere}
    </>
  );
}
