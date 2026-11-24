"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ACTIONS } from "@/data/site";
import type { Suggestion } from "@/lib/search";
import { CHART_EVENT, type ChartLit } from "./ChartLive";
import { Arrow, Book, Glass, Globe, Landmark, Store } from "./Icons";

const KIND_ICON = { listing: Store, guide: Book, official: Landmark, site: Globe, way: Arrow } as const;

type Found = { suggestions: Suggestion[]; points: number[]; n: number };

/**
 * The search box. It is a plain form that asks /search, so it works with no script at all. With
 * script it also offers a few answers while the question is typed (a combobox: arrow keys move,
 * Enter goes, Escape closes), and on the first screen it tells the chart which listings to light.
 */
export default function SearchBox({
  size = "md",
  initial = "",
  light = false,
  autoFocus = false,
  deskFocus = false,
  hotkey = false,
  hint,
  id,
}: {
  size?: "md" | "lg";
  initial?: string;
  /** Tell the chart which listings to light, as the question is typed. */
  light?: boolean;
  autoFocus?: boolean;
  /** Take focus on load where there is a keyboard and a wide screen, and never on a phone. */
  deskFocus?: boolean;
  /** Answer to the "/" key, as search boxes do. */
  hotkey?: boolean;
  /** What the box says while it is empty, where "Search" alone would say too little. */
  hint?: string;
  id?: string;
}) {
  const router = useRouter();
  const own = useId();
  const listId = `${id ?? own}-list`;
  const [value, setValue] = useState(initial);
  const [found, setFound] = useState<Found | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const asked = useRef(0);

  useEffect(() => {
    if (deskFocus && window.matchMedia("(min-width: 68rem) and (pointer: fine)").matches) field.current?.focus({ preventScroll: true });
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || el?.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      field.current?.focus();
      field.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deskFocus, hotkey]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setFound(null);
      if (light) window.dispatchEvent(new CustomEvent<ChartLit>(CHART_EVENT, { detail: { points: [] } }));
      return;
    }
    const mine = ++asked.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        if (!res.ok || mine !== asked.current) return;
        const data = (await res.json()) as Found;
        setFound(data);
        setActive(-1);
        if (light) window.dispatchEvent(new CustomEvent<ChartLit>(CHART_EVENT, { detail: { points: data.points } }));
      } catch {
        // The form still works: Enter asks the search page.
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [value, light]);

  useEffect(() => {
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const items = open && found ? found.suggestions : [];
  const go = (s: Suggestion) => {
    setOpen(false);
    if (s.href.startsWith("/")) router.push(s.href);
    else window.location.assign(s.href);
  };

  return (
    <form
      ref={box}
      action="/search"
      method="get"
      role="search"
      className={`search search-${size}`}
      onSubmit={(e) => {
        // With script the question is asked without leaving the page behind, so what is found can rise into place. Without it the form asks, as a form does.
        e.preventDefault();
        setOpen(false);
        const q = value.trim();
        router.push(q ? `/search?q=${encodeURIComponent(q).replace(/%20/g, "+")}` : "/search");
      }}
      onBlur={(e) => {
        // Focus has left the box altogether: the list goes with it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span className="search-glass">
        <Glass className="size-5" />
      </span>
      <input
        ref={field}
        id={id}
        type="search"
        name="q"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            // A search field's own Escape empties it. While the list is open, Escape only closes the list.
            if (items.length) e.preventDefault();
            setOpen(false);
          } else if (e.key === "ArrowDown" && items.length) {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp" && items.length) {
            e.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0 && items[active]) {
            e.preventDefault();
            go(items[active]);
          }
        }}
        placeholder={hint ?? (size === "lg" ? "What are you looking for?" : "Search")}
        aria-label="Search businesses, articles and numbers"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoFocus={autoFocus}
      />
      <button type="submit" className={`btn btn-filled search-go ${size === "lg" ? "button-md" : "button-sm"}`}>
        <Glass strokeWidth={2} />
        <span>{ACTIONS.search}</span>
      </button>
      {items.length > 0 && (
        <ul id={listId} role="listbox" aria-label="Suggestions" className="suggest">
          {items.map((s, i) => (
            <li
              key={`${s.href}-${i}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="suggest-item"
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => {
                e.preventDefault();
                go(s);
              }}
            >
              <span className="suggest-icon">{(() => {
                const Icon = KIND_ICON[s.kind];
                return <Icon />;
              })()}</span>
              <span className="suggest-label body-3">{s.label}</span>
              <span className="suggest-note data-2">{s.note}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
