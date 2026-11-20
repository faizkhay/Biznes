import type { Metadata } from "next";
import { PageHead } from "@/components/Bits";
import CartView from "@/components/Cart";
import { PLANS, PUBLICATIONS } from "@/data/site";
import { count } from "@/lib/format";
import { products, sponsorship } from "@/lib/shop";
import { pageMeta } from "@/lib/meta";

// The cart is one visitor's own, kept in their browser: there is nothing in it for a search engine.
export const metadata: Metadata = pageMeta({ title: "Your cart", description: "What you mean to buy on biznes.mu: the pocket guide, a place in it for your business, or a plan.", path: "/cart", index: false });

export default function CartPage() {
  const guide = products()[0];
  const rules = sponsorship();
  const paid = PLANS.filter((plan) => plan.price > 0);
  // What can be bought, each with its price from the data files.
  const buys = [
    ...(guide ? [{ href: "/shop", title: guide.title, line: guide.price ? `Rs ${count(guide.price)} an edition, and free in the weeks its sponsors pay for.` : "The guide to Mauritius for your phone." }] : []),
    ...(rules ? [{ href: "/shop#sponsor", title: `A place in the ${PUBLICATIONS.guide.short}`, line: `For a business: from Rs ${count(Math.min(...rules.options.map((o) => o.price)))} a month, on the sponsors' pages of a coming edition.` }] : []),
    { href: "/pricing", title: paid.map((plan) => plan.name).join(" or "), line: `For a business: ${paid.map((plan) => `Rs ${count(plan.price)}`).join(" or ")} a month.` },
  ];
  return (
    <>
      <PageHead title="Your cart" path={[{ label: "Cart" }]} lede="Kept in this browser until you send it. Nothing is paid on this site yet." />
      <div className="shell">
        <CartView buys={buys} />
      </div>
    </>
  );
}
