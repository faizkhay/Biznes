"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { SIGNED_IN_COOKIE, accountsOn } from "@/lib/accounts/config";
import { NO_STATE } from "@/lib/accounts/form";
import { placeOrder } from "@/lib/accounts/orders";
import { Alert, Tick } from "../Icons";

/**
 * What a cart holds. `id` is the thing's own id among what the site sells: a pocket guide's slug
 * for "guide"; "listing", "panel" or "page" for "sponsor"; "go" or "grow" for "plan"; a place
 * ("home", "results", "listing", "food", "article", "directory", "magazine") for "ad". The price
 * is for showing: an order is priced again on the server, from the site's own data.
 */
export type CartItem = { id: string; kind: "guide" | "sponsor" | "plan" | "ad"; name: string; detail?: string; price: number | null; qty: number };

/** The name of the event sent to the window once an order is placed, for the cart to empty itself. Its `detail` is `{ number, total }`. */
export const ORDER_PLACED = "biznes:order-placed";

const money = (n: number) => `Rs ${new Intl.NumberFormat("en-GB").format(n)}`;

/** The cart in words, for the request form when accounts are off. */
function inWords(items: CartItem[]): string {
  return `I would like to order: ${items.map((i) => `${i.qty} x ${i.name}${i.detail ? ` (${i.detail})` : ""}${i.price != null ? `, ${money(i.price)} each` : ", price on request"}`).join("; ")}.`;
}

type Me = { in: boolean; name?: string; given?: string; email?: string; phone?: string };

/**
 * The checkout for a cart. With accounts on it places an order: a request, written to the
 * database with the site's own prices, that a person answers with how to pay. Payment is not
 * connected, and the page says so. Signed in, the order is kept with the account. With accounts
 * off it is a link to the request form, carrying the cart in its message.
 */
export default function Checkout(props: { items: CartItem[] }) {
  const { items } = props;
  const [state, send, pending] = useActionState(placeOrder, NO_STATE);
  const [me, setMe] = useState<Me>({ in: false });
  const form = useRef<HTMLFormElement>(null);
  const said = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountsOn || !document.cookie.split("; ").includes(`${SIGNED_IN_COOKIE}=1`)) return;
    let on = true;
    fetch("/account/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((who: Me | null) => on && who?.in && setMe(who))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    if (state === NO_STATE) return;
    if (state.ok) {
      said.current?.focus();
      // The cart is the page's own, kept in the browser: it is told, and empties itself.
      window.dispatchEvent(new CustomEvent(ORDER_PLACED, { detail: { number: Number(state.values?.number), total: Number(state.values?.total) } }));
      return;
    }
    const first = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) first.focus();
    else said.current?.focus();
  }, [state]);

  if (!items.length) return null;

  if (!accountsOn) {
    return (
      <div className="card card-panel">
        <p className="body-2">Ordering on the site is not open yet. Send us what is in your cart, and a person replies with how to pay.</p>
        <p className="mt-4">
          <Link href={`/add?message=${encodeURIComponent(inWords(items))}`} className="btn btn-filled button-md">
            Ask for these
          </Link>
        </p>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div ref={said} tabIndex={-1} role="status" className="card outline-none">
        <Tick className="size-8 text-link" />
        <h2 className="heading-3 mt-4">We have your order</h2>
        <p className="body-2 measure mt-2">{state.message}</p>
        <p className="body-3 measure mt-3 text-ink-subtle">Nothing has been paid, and nothing is taken on this site. Paying online is on its way; until then we arrange it with you directly.</p>
        <p className="mt-6 flex flex-wrap gap-3">
          {me.in && (
            <Link prefetch={false} href="/account#orders" className="btn btn-ink button-md">
              Your orders
            </Link>
          )}
          <Link href="/" className="btn btn-quiet button-md">
            Back to the search
          </Link>
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);
  const onRequest = items.some((i) => i.price == null);
  const lines = items.map((i) => ({ id: i.id, kind: i.kind, qty: i.qty, detail: i.detail ?? "" }));
  const error = (name: string) => state.errors?.[name];
  const input = (name: string) => ({ id: `checkout-${name}`, name, defaultValue: state.values?.[name] ?? (name === "name" ? me.given : me[name as "email" | "phone"]) ?? "", "aria-invalid": error(name) ? (true as const) : undefined, "aria-describedby": error(name) ? `checkout-${name}-error` : undefined });
  const Said = ({ name }: { name: string }) =>
    error(name) ? (
      <p id={`checkout-${name}-error`} className="caption-1 mt-2 flex items-start gap-2 text-alert">
        <Alert className="mt-0.5 size-4 flex-none" />
        {error(name)}
      </p>
    ) : null;

  return (
    <form ref={form} action={send} noValidate className="card grid gap-6">
      <div>
        <h2 className="heading-3">Place the order</h2>
        <p className="body-3 mt-1 text-ink-subtle">
          {total > 0 && <span className="data-1 text-ink">{money(total)}</span>}
          {total > 0 && onRequest ? ", and " : ""}
          {onRequest ? "a price on request" : ""}
          {total > 0 || onRequest ? ". " : ""}
          Nothing is paid here: a person contacts you with how to pay.
        </p>
      </div>
      {state.message && (
        <div ref={said} tabIndex={-1} role="alert" className="note body-3 flex items-start gap-2 outline-none">
          <Alert className="mt-0.5 size-5 flex-none text-alert" />
          <span>{state.message}</span>
        </div>
      )}
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      {me.in && (
        <p className="note body-3">
          Ordering as {me.name || me.email}. The order is kept in your account. Change the details below only if we should reach someone else about it.
        </p>
      )}
      {/* Keyed by who is ordering, so the fields take a signed-in person's details when they are known. */}
      <div key={me.in ? "in" : "out"} className="grid gap-6">
        <div>
          <label htmlFor="checkout-name" className="title-2 block">
            Your name
          </label>
          <input {...input("name")} type="text" autoComplete="name" className="field mt-2" />
          <Said name="name" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="checkout-phone" className="title-2 block">
              Phone or WhatsApp number
            </label>
            <input {...input("phone")} type="tel" autoComplete="tel" inputMode="tel" className="field data-1 mt-2" />
            <Said name="phone" />
          </div>
          <div>
            <label htmlFor="checkout-email" className="title-2 block">
              Email address
            </label>
            <input {...input("email")} type="email" autoComplete="email" inputMode="email" className="field mt-2" />
            <Said name="email" />
          </div>
        </div>
        <p className="caption-1 -mt-3 text-ink-faint">One of the two is enough: it is how we reach you about the order.</p>
        <div>
          <label htmlFor="checkout-note" className="title-2 block">
            Anything we should know <span className="caption-1 font-normal text-ink-faint">(optional)</span>
          </label>
          <textarea id="checkout-note" name="note" rows={3} maxLength={500} defaultValue={state.values?.note ?? ""} className="field mt-2" />
        </div>
      </div>
      {/* The honeypot: hidden from people and from assistive technology; only a bot fills it. */}
      <div aria-hidden className="hidden">
        <label htmlFor="checkout-website">Website</label>
        <input id="checkout-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div>
        <button type="submit" className="btn btn-filled button-md" disabled={pending}>
          {pending ? "Placing the order" : "Place the order"}
        </button>
        <p className="caption-1 mt-3 max-w-prose text-ink-faint">
          We use what you give only to deal with this order and to reach you about it. {!me.in && "With an account, your orders are kept in one place."}
        </p>
      </div>
    </form>
  );
}
