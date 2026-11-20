"use client";

// The shortlist: the listings a visitor has saved. It is kept in the visitor's own browser and
// nowhere else, as a list of listing ids, so nothing about it is sent to or held by the site.
import { useSyncExternalStore } from "react";

const KEY = "biznes:saved";
const EVENT = "biznes:saved";
const LIMIT = 200;
const NONE: string[] = [];

let cacheText: string | null = null;
let cacheList: string[] = NONE;

function read(): string[] {
  let text: string | null = null;
  try {
    text = window.localStorage.getItem(KEY);
  } catch {
    // Storage is closed to the page: nothing is saved, and nothing breaks.
  }
  if (text === cacheText) return cacheList;
  cacheText = text;
  try {
    const list = JSON.parse(text ?? "[]");
    cacheList = Array.isArray(list) ? list.filter((id): id is string => typeof id === "string").slice(0, LIMIT) : NONE;
  } catch {
    cacheList = NONE;
  }
  return cacheList;
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The saved listing ids, newest first. Empty on the server and until the page has loaded. */
export const useSaved = () => useSyncExternalStore(subscribe, read, () => NONE);

/** True once the page runs in a browser: a control that needs script shows only then. */
export const useReady = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

export function toggleSaved(id: string) {
  const list = read();
  write(list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]);
}
export function saveAll(ids: string[]) {
  const list = read();
  write([...ids.filter((id) => !list.includes(id)), ...list]);
}
export const clearSaved = () => write([]);
