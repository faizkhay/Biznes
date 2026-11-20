"use client";

import Link from "next/link";
import Checkout, { type CartItem } from "@/components/account/Checkout";
import { addToCart, cartTotal, counted, removeFromCart, setQuantity, useCart } from "@/lib/cart";
import { count } from "@/lib/format";
import { useReady } from "@/lib/saved";
import { Arrow, Cart as CartIcon, Close, Minus, Plus, Tick } from "./Icons";

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
  const inside = useCart().some((own) => own.id === item.id);
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

/** The cart in words, for a message the visitor sends: a line for each thing, then the total. */
const written = (items: CartItem[]) =>
  [...items.map((item) => `${item.qty} x ${item.name}${item.detail ? ` (${item.detail})` : ""}${item.price != null ? `, ${rupees(item.price)} each` : ""}`), `Total: ${rupees(cartTotal(items))}`].join("; ");

/**
 * The cart's own page: what is in it, each at its price in rupees, the number where a thing is
 * bought by the number, a way to take each out, and the total. Nothing is paid here: the order is
 * sent, and a person replies with how to pay.
 */
export default function CartView({ buys }: { /** What can be bought, for an empty cart to point to. */ buys: { href: string; title: string; line: string }[] }) {
  const ready = useReady();
  const items = useCart();
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
        <ul className="cart-items" aria-label="In your cart">
          {items.map((item) => (
            <li key={item.id} className="cart-item" data-cart-item={item.id}>
              <div className="min-w-0">
                <p className="title-1">{item.name}</p>
                {item.detail && <p className="body-3 text-ink-subtle">{item.detail}</p>}
                <p className="data-1 mt-1">{item.price != null ? `${rupees(item.price)}${counted(item) && item.qty > 1 ? ` each, ${rupees(item.price * item.qty)} in all` : ""}` : "Price to be agreed"}</p>
              </div>
              <div className="cart-acts">
                {counted(item) && (
                  <p className="cart-qty" role="group" aria-label={`How many: ${item.name}`}>
                    <button type="button" className="icon-btn icon-btn-edge" aria-label="One fewer" disabled={item.qty <= 1} onClick={() => setQuantity(item.id, item.qty - 1)}>
                      <Minus />
                    </button>
                    <span className="data-1" aria-live="polite">
                      {item.qty}
                    </span>
                    <button type="button" className="icon-btn icon-btn-edge" aria-label="One more" onClick={() => setQuantity(item.id, item.qty + 1)}>
                      <Plus />
                    </button>
                  </p>
                )}
                <button type="button" className="icon-btn" aria-label={`Remove ${item.name} from your cart`} title="Remove" onClick={() => removeFromCart(item.id)}>
                  <Close />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="lg:col-span-5" aria-labelledby="cart-total">
        <div className="card">
          <h2 id="cart-total" className="label-1 text-ink-faint">
            Total
          </h2>
          <p className="heading-1 tabular mt-2" role="status">
            {rupees(cartTotal(items))}
          </p>
          <p className="body-3 mt-1 text-ink-subtle">In Mauritian rupees{unpriced ? ", without what has no price yet" : ""}. A plan and a place in the guide are charged by the month.</p>
          <p className="note body-3 mt-4">Paying online is not open yet. Nothing is charged here: send the order, and a person contacts you with how to pay.</p>
          {/* The order is placed with an account. With none, the same things are written into the request form. */}
          <div className="checkout mt-4">
            <Checkout items={items} />
          </div>
          <p className="checkout-else mt-4">
            <Link href={`/add?order=${encodeURIComponent(written(items))}`} prefetch={false} className="btn btn-filled button-md w-full">
              Send this order
              <span className="btn-dot">
                <Arrow />
              </span>
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
