"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ACTIONS, BAZ } from "@/data/site";
import { baz } from "@/lib/baz";
import type { FoodSuggestion } from "@/lib/food";
import { CategoryIcon } from "../Glyphs";
import { Arrow, Glass } from "../Icons";

/**
 * Baz Manzer's own search box. It is the site's box in shape and in manners (SearchBox), and it
 * asks the section and nothing else: a plain form that asks /baz-manzer/search, so it works with
 * no script at all, and with script a few answers while the question is typed (a combobox: arrow
 * keys move, Enter goes, Escape closes), every one a page inside the section.
 */
export default function BazSearchBox({ size = "md", initial = "", autoFocus = false, hotkey = false, id }: { size?: "md" | "lg"; initial?: string; autoFocus?: boolean; /** Answer to the "/" key, as search boxes do. */ hotkey?: boolean; id?: string }) {
  const router = useRouter();
  const own = useId();
  const listId = `${id ?? own}-list`;
  const [value, setValue] = useState(initial);
  const [found, setFound] = useState<FoodSuggestion[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const asked = useRef(0);

  useEffect(() => {
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
  }, [hotkey]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setFound(null);
      return;
    }
    const mine = ++asked.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${baz.suggest}?q=${encodeURIComponent(q)}`);
        if (!res.ok || mine !== asked.current) return;
        setFound(((await res.json()) as { suggestions: FoodSuggestion[] }).suggestions);
        setActive(-1);
      } catch {
        // The form still works: Enter asks the section's search page.
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const away = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const items = open && found ? found : [];
  const go = (s: FoodSuggestion) => {
    setOpen(false);
    router.push(s.href);
  };

  return (
    <form
      ref={box}
      action={baz.search()}
      method="get"
      role="search"
      className={`search search-${size}`}
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
        placeholder={size === "lg" ? BAZ.search.placeholder : BAZ.search.label}
        aria-label={BAZ.search.label}
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
              <span className="suggest-icon">{s.kind === "way" ? <Arrow /> : <CategoryIcon group="eat" />}</span>
              <span className="suggest-label body-3">{s.label}</span>
              <span className="suggest-note data-2">{s.note}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
