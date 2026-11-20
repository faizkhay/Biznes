import type { Metadata } from "next";
import Link from "next/link";
import { PartHead } from "@/components/account/Bits";
import Checkout, { type CartItem } from "@/components/account/Checkout";
import { PageHead } from "@/components/Bits";
import { Arrow } from "@/components/Icons";
import { siteCatalogue, type Sold } from "@/lib/accounts/catalogue";
import { rupees } from "@/lib/accounts/types";

export const metadata: Metadata = { title: "Place an order", robots: { index: false, follow: false } };

const KINDS: { kind: Sold["kind"]; title: string; line: string }[] = [
  { kind: "guide", title: "The pocket guide", line: "The edition on sale now." },
  { kind: "sponsor", title: "A place on the guide's sponsors' pages", line: "For a coming month. An edition carries four sponsored pages at most." },
  { kind: "plan", title: "A plan for a business", line: "A month of a paid plan. We switch it on once it is paid." },
  { kind: "ad", title: "An advertisement", line: "A place on the site or in the magazine, priced on request." },
];

const priceOf = (s: Pick<Sold, "price" | "per">) => (s.price == null ? "Price on request" : `${rupees(s.price)}${s.per === "month" ? " a month" : ""}`);

/**
 * An order without the cart: what the site sells, each with a link that puts it in an order, and
 * the checkout for whatever the address names (`?item=plan:go&item=sponsor:listing*2`). Anyone may
 * order, signed in or not. What is shown comes from the site's own data, never from the address:
 * a thing the site does not sell is left out, and the order is priced again when it is placed.
 * With accounts off the checkout is a link to the request form, which carries the order in words.
 */
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ item?: string | string[] }> }) {
  const asked = [(await searchParams).item ?? []].flat().slice(0, 20);
  const sold = siteCatalogue();
  const byId = new Map(sold.map((s) => [s.id, s]));
  const items: CartItem[] = [];
  for (const one of asked) {
    const [id, times] = one.split("*");
    const thing = byId.get(id);
    const qty = Math.min(24, Math.max(1, Math.trunc(Number(times ?? 1)) || 1));
    if (!thing || items.some((i) => `${i.kind}:${i.id}` === id)) continue;
    items.push({ id: id.slice(thing.kind.length + 1), kind: thing.kind, name: thing.name, price: thing.price, qty, ...(thing.per === "month" ? { detail: qty > 1 ? `${qty} months` : "one month" } : {}) });
  }
  const total = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);

  return (
    <>
      <PageHead title="Place an order" path={[{ href: "/account", label: "Your account" }, { label: "Place an order" }]} lede="Ask for what you want and a person contacts you with how to pay. Nothing is paid on this site." />
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        {items.length > 0 ? (
          <>
            <section aria-labelledby="basket" className="lg:col-span-5">
              <PartHead id="basket" title="Your order" />
              <ul className="rows mt-6">
                {items.map((i) => (
                  <li key={`${i.kind}:${i.id}`} className="row">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-6">
                      <span className="title-1">
                        {i.qty > 1 ? `${i.qty} × ` : ""}
                        {i.name}
                      </span>
                      <span className="data-1">{i.price == null ? "On request" : rupees(i.price * i.qty)}</span>
                    </p>
                    {i.detail && <p className="body-3 mt-0.5 text-ink-subtle">{i.detail}</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6">
                <span className="title-2">Total</span>
                <span className="data-1">{total ? rupees(total) : "On request"}</span>
              </p>
              <p className="body-3 mt-6">
                <Link prefetch={false} href="/account/order" className="inline-flex min-h-11 items-center gap-2 text-link">
                  Choose something else <Arrow className="size-4" />
                </Link>
              </p>
            </section>
            <div className="lg:col-span-7">
              <Checkout items={items} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-8">
            {KINDS.map(({ kind, title, line }) => {
              const things = sold.filter((s) => s.kind === kind);
              if (!things.length) return null;
              return (
                <section key={kind} aria-labelledby={`sold-${kind}`} className="mb-12">
                  <PartHead id={`sold-${kind}`} title={title} line={line} />
                  <ul className="rows mt-6">
                    {things.map((s) => (
                      <li key={s.id}>
                        <article className="row flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="title-1">
                              <Link prefetch={false} href={`/account/order?item=${encodeURIComponent(s.id)}`} className="row-title">
                                {s.name}
                              </Link>
                            </h3>
                            <p className="body-3 mt-0.5 text-ink-subtle">{priceOf(s)}</p>
                          </div>
                          <Arrow className="size-5 flex-none text-ink-faint" />
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
