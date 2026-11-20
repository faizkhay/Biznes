"use client";

// The order: what the cart hands over to be placed. The accounts work writes the real one, with
// this same signature: it places the order with the account. Until then, and with accounts off, it
// is nothing at all, and the cart offers the request form instead.

export type CartItem = { id: string; kind: "guide" | "sponsor" | "plan" | "ad"; name: string; detail?: string; price: number | null; qty: number };

export default function Checkout(_props: { items: CartItem[] }) {
  return null;
}
