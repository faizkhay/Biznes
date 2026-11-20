import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import RequestForm from "@/components/RequestForm";
import { PLANS, site } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { monthName, offer, products } from "@/lib/shop";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Add or correct a listing",
  description: "Add a business to biznes.mu, correct a listing, or have one removed. Free, and answered by a person.",
  path: "/add",
});

export default async function AddPage({ searchParams }: { searchParams: Promise<{ listing?: string; claim?: string; plan?: string; product?: string; sponsor?: string; message?: string }> }) {
  const { listing: named, claim: claimed, plan: asked, product: guide, sponsor: sponsored, message: sent } = await searchParams;
  // Words to begin the request with, as the cart's checkout writes them when accounts are off
  // ("I would like to order: ..."). They are shown in the message's field and nowhere else.
  const words = String(sent ?? "").slice(0, 900).replace(/[<>]/g, "").trim();
  // A cart of several things names neither one plan nor one guide: the page is then for an order.
  const order = words && !asked && !guide ? words : "";
  // A listing's owner who comes to claim it, where there are no accounts to claim it with: the same form, opened for that.
  const wanted = named ?? claimed;
  const claiming = Boolean(claimed) && !named;
  const toSponsor = products().find((p) => p.slug === sponsored);
  const plan = PLANS.find((p) => p.id === asked);
  const product = products().find((p) => p.slug === guide);
  const listing = wanted ? index().byId.get(wanted) : undefined;
  const { contact } = site;
  // With no route for requests set on the server, a form that posts would fail every time. The
  // same fields then write the request out for the visitor's own WhatsApp or email.
  const compose = process.env.NODE_ENV === "production" && !process.env.ENQUIRY_WEBHOOK_URL && !process.env.RESEND_API_KEY;
  return (
    <>
      <PageHead
        title={order ? "Send your order" : plan ? (plan.price ? `Ask for ${plan.name}` : "List your business free") : product ? "Ask for the pocket guide" : toSponsor ? "Sponsor the pocket guide" : claiming && listing ? "Claim this listing" : "Add or correct a listing"}
        path={[{ label: order ? "Your order" : plan ? plan.name : product ? "Pocket guide" : toSponsor ? "Sponsor the guide" : claiming && listing ? "Claim a listing" : "Add or correct a listing" }]}
        lede={
          order
            ? "What is in your cart is written into the message below. Paying online is not open yet: send it, and a person replies with how to pay."
            : plan
            ? plan.price
              ? `${plan.name} is Rs ${count(plan.price)} a month for each business. Paying online is not open yet: tell us about the business, and a person replies with how to pay and what we need to verify it.`
              : "A basic listing costs nothing. If your business is already here, say so and we will make the listing yours; if not, tell us about it and we add it."
            : product
              ? `The ${product.title} is ${product.price ? `Rs ${count(product.price)} an edition` : "not yet priced"}. Paying online is not open yet: ask for it here, and a person sends it and tells you how to pay.`
              : toSponsor
                ? `A place on the sponsors' pages of the ${toSponsor.title}, from ${monthName(offer(toSponsor).next)}. Say which option you want and for which months; a person replies with how to pay and what to send us.`
                : listing && claiming
                  ? `${listing.name}. Tell us it is yours and how we can check, and a person replies. Claiming a listing costs nothing.`
                  : listing
                    ? `About ${listing.name}. Tell us what should change, or that it should be taken out.`
                  : "Add a business, put a listing right, or have one taken out. It costs nothing, and a person reads every request."
        }
      />
      <div className="shell grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RequestForm
            compose={compose}
            about={words || product || toSponsor ? "other" : undefined}
            start={words ? `${words} ` : claiming && listing ? "This is my business, and I would like to claim its listing. " : plan ? `I would like ${plan.name} for my business.` : product ? `I would like the ${product.title}.` : toSponsor ? `I would like to sponsor the pocket guide (the ${toSponsor.title}) from ${monthName(offer(toSponsor).next)}. The option I want: ` : ""} listing={listing ? { id: listing.id, name: listing.name, path: `/b/${listing.slug}` } : undefined} />
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="heading-3">Other ways</h2>
          <ul className="body-3 mt-3 grid gap-2 text-ink-subtle">
            <li>
              Call{" "}
              <a href={contact.phoneHref} className="data-1 whitespace-nowrap">
                {contact.phone}
              </a>
            </li>
            <li>
              <a href={contact.whatsappHref} rel="noopener">
                WhatsApp
              </a>{" "}
              the same number
            </li>
            <li>
              Email <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          </ul>
          <p className="caption-1 mt-3 text-ink-faint">We answer {contact.hours}.</p>
          <h2 className="heading-3 mt-10">The surest fix</h2>
          <p className="body-3 mt-3 text-ink-subtle">
            Most listings come from OpenStreetMap. A correction made there reaches this site at the next crawl, and every other map that uses it. <Link href="/data">Where the data comes from</Link> explains.
          </p>
        </aside>
      </div>
    </>
  );
}
