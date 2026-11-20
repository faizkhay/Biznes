"use client";

// The cart: what a visitor means to buy. Like the shortlist (src/lib/saved.ts) it is kept in the
// visitor's own browser and nowhere else, and nothing about it is sent to the site until the
// visitor sends an order. An event tells the header's badge when it changes.
//
// A thing's `id` is its own id among what the site sells, as the checkout expects it: the pocket
// guide's slug, "listing", "panel" or "page" for a place in the guide, "go" or "grow" for a plan.
import { useSyncExternalStore } from "react";
import type { CartItem } from "@/components/account/Checkout";

export type { CartItem };

const KEY = "biznes:cart";
const EVENT = "biznes:cart";
const LIMIT = 30;
const MOST = 24;
const NONE: CartItem[] = [];
const KINDS = ["guide", "sponsor", "plan", "ad"];

let cacheText: string | null = null;
let cacheList: CartItem[] = NONE;

const sound = (item: unknown): item is CartItem => {
  const i = item as Partial<CartItem> | null;
  return Boolean(i) && typeof i!.id === "string" && typeof i!.name === "string" && KINDS.includes(i!.kind ?? "") && (i!.price === null || typeof i!.price === "number") && Number.isInteger(i!.qty) && i!.qty! > 0;
};

/**
 * What tells one thing in the cart from another: its kind and its own id. The id alone would not
 * do, since a sponsored listing and an advertisement on a listing's page are both "listing".
 */
export const keyOf = (item: Pick<CartItem, "kind" | "id">) => `${item.kind}:${item.id}`;

function read(): CartItem[] {
  let text: string | null = null;
  try {
    text = window.localStorage.getItem(KEY);
  } catch {
    // Storage is closed to the page: nothing is kept, and nothing breaks.
  }
  if (text === cacheText) return cacheList;
  cacheText = text;
  try {
    const list = JSON.parse(text ?? "[]");
    cacheList = Array.isArray(list) ? list.filter(sound).slice(0, LIMIT) : NONE;
  } catch {
    cacheList = NONE;
  }
  return cacheList;
}

function write(list: CartItem[]) {
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

/** What is in the cart. Empty on the server and until the page has loaded. */
export const useCart = () => useSyncExternalStore(subscribe, read, () => NONE);

/** Of what a thing is bought by the number: a plan is for each business, a sponsorship for each month. The guide is one. */
export const counted = (item: Pick<CartItem, "kind">) => item.kind === "plan" || item.kind === "sponsor" || item.kind === "ad";

/** Puts a thing in the cart. One already there is left as it is. */
export function addToCart(item: CartItem) {
  const list = read();
  if (!list.some((own) => keyOf(own) === keyOf(item))) write([...list, { ...item, qty: Math.max(1, Math.min(MOST, item.qty)) }]);
}
/** Takes a thing out, and sets how many of a thing, each by its key (`keyOf`). */
export const removeFromCart = (key: string) => write(read().filter((item) => keyOf(item) !== key));
export const setQuantity = (key: string, qty: number) => write(read().map((item) => (keyOf(item) === key && counted(item) ? { ...item, qty: Math.max(1, Math.min(MOST, Math.round(qty) || 1)) } : item)));
export const clearCart = () => write([]);

/** What the cart comes to, in rupees. A thing with no price yet adds nothing, and the cart says so. */
export const cartTotal = (items: CartItem[]) => items.reduce((sum, item) => sum + (item.price ?? 0) * item.qty, 0);
