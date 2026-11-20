"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Checkout, { ORDER_PLACED, type CartItem } from "@/components/account/Checkout";
import { addToCart, cartTotal, clearCart, counted, keyOf, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { count } from "@/lib/format";
import { useReady } from "@/lib/saved";
import { Cart as CartIcon, Close, Minus, Plus, Tick } from "./Icons";

const rupees = (n: number) => `Rs ${count(n)}`;

/** The header's way to the cart, with how many things are in it. */
export function CartLink() {
  const n = useCart().length;
  return (
    <Link href="/cart" prefetch={false} className="icon-btn icon-btn-sq" aria-label={n ? `Cart, ${n}` : "Cart"} title="Cart">
      <CartIcon />
      {n > 0 && (
        <span className="badge" aria-hidden>
          {n > 99 ? "99" : n}
        </span>
      )}
    </Link>
  );
}

/**
 * Puts one thing in the cart. The page that shows the button builds the item from the data files
 * (its name and its price are never typed here). Until the page's script has loaded nothing is
 * offered, so there is never a button that does nothing, though its room is kept; once the thing
 * is in, the button is the way to the cart.
 */
export function AddToCart({ item, quiet = false, small = false }: { item: CartItem; /** A second action beside a filled one. */ quiet?: boolean; small?: boolean }) {
  const ready = useReady();
  const inside = useCart().some((own) => keyOf(own) === keyOf(item));
  const shape = `btn ${small ? "btn-sm button-sm" : "button-md"}`;
  // Its room is kept until the page's script has loaded, so nothing beside it moves when it comes.
  if (!ready)
    return (
      <span className={`${shape} invisible`} aria-hidden>
        <CartIcon /> Add to cart
      </span>
    );
  if (inside)
    return (
      <Link href="/cart" prefetch={false} className={`${shape} btn-quiet`}>
        <Tick /> In your cart
      </Link>
    );
  return (
    <button type="button" className={`${shape} ${quiet ? "btn-quiet" : "btn-filled"}`} onClick={() => addToCart(item)} aria-label={`Add to cart: ${item.name}`}>
      <CartIcon /> Add to cart
    </button>
  );
}

/**
 * The cart's own page: what is in it, each at its price in rupees, the number where a thing is
 * bought by the number, a way to take each out, and the total. Nothing is paid here: the order is
 * sent, and a person replies with how to pay.
 */
export default function CartView({ buys }: { /** What can be bought, for an empty cart to point to. */ buys: { href: string; title: string; line: string }[] }) {
  const ready = useReady();
  const held = useCart();
  // Once an order is placed the cart empties itself, and the page keeps what was ordered in view
  // beside the checkout's own words about it.
  const [placed, setPlaced] = useState<CartItem[] | null>(null);
  const now = useRef(held);
  useEffect(() => {
    now.current = held;
  }, [held]);
  useEffect(() => {
    const done = () => {
      setPlaced(now.current);
      clearCart();
    };
    window.addEventListener(ORDER_PLACED, done);
    return () => window.removeEventListener(ORDER_PLACED, done);
  }, []);
  const items = placed ?? held;
  if (!ready) return <div className="wait h-40 rounded-xl" role="status" aria-label="Your cart is loading" />;
  if (!items.length)
    return (
      <div>
        <p className="card card-panel body-2 text-ink-subtle" role="status">
          Your cart is empty.
        </p>
        <h2 className="heading-3 mt-10">What can be bought here</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {buys.map((buy) => (
            <li key={buy.href}>
              <article className="card h-full">
                <h3 className="title-1">
                  <Link href={buy.href} prefetch={false} className="row-title text-ink">
                    {buy.title}
                  </Link>
                </h3>
                <p className="body-3 mt-2 text-ink-subtle">{buy.line}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    );
  const unpriced = items.some((item) => item.price == null);
  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {placed && <h2 className="heading-3 mb-4">What you ordered</h2>}
        <ul className="cart-items" aria-label={placed ? "What you ordered" : "In your cart"}>
          {items.map((item) => (
            <li key={keyOf(item)} className="cart-item" data-cart-item={keyOf(item)}>
              <div className="min-w-0">
                <p className="title-1">{item.name}</p>
                {item.detail && <p className="body-3 text-ink-subtle">{item.detail}</p>}
                <p className="data-1 mt-1">{item.price != null ? `${rupees(item.price)}${counted(item) && item.qty > 1 ? ` each, ${rupees(item.price * item.qty)} in all` : ""}` : "Price to be agreed"}</p>
              </div>
              {!placed && (
                <div className="cart-acts">
                  {counted(item) && (
                    <p className="cart-qty" role="group" aria-label={`How many: ${item.name}`}>
                      <button type="button" className="icon-btn icon-btn-edge" aria-label="One fewer" disabled={item.qty <= 1} onClick={() => setQuantity(keyOf(item), item.qty - 1)}>
                        <Minus />
                      </button>
                      <span className="data-1" aria-live="polite">
                        {item.qty}
                      </span>
                      <button type="button" className="icon-btn icon-btn-edge" aria-label="One more" onClick={() => setQuantity(keyOf(item), item.qty + 1)}>
                        <Plus />
                      </button>
                    </p>
                  )}
                  <button type="button" className="icon-btn" aria-label={`Remove ${item.name} from your cart`} title="Remove" onClick={() => removeFromCart(keyOf(item))}>
                    <Close />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <aside className="grid content-start gap-4 lg:col-span-5" aria-label="Total and order">
        <div className="card" hidden={Boolean(placed)}>
          <h2 id="cart-total" className="label-1 text-ink-faint">
            Total
          </h2>
          <p className="heading-1 tabular mt-2" role="status">
            {rupees(cartTotal(items))}
          </p>
          <p className="body-3 mt-1 text-ink-subtle">In Mauritian rupees{unpriced ? ", without what has no price yet" : ""}. A plan and a place in the guide are charged by the month.</p>
          <p className="note body-3 mt-4">Paying online is not open yet. Nothing is charged here.</p>
        </div>
        {/* The accounts work places the order, or with accounts off hands the cart to the request form. It stays where it is once the order is placed, to say so. */}
        <div className="checkout">
          <Checkout items={items} />
        </div>
      </aside>
    </div>
  );
}
