import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { Arrow, Tick } from "@/components/Icons";
import { PLANS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { count } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "List your business",
  description: "List a business on biznes.mu: Biznes Free is a basic listing at no cost, Biznes Go is verified and listed with priority, and Biznes Grow takes bookings and sells services online.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const { meta } = index();
  return (
    <>
      <PageHead title="List your business" path={[{ label: "List your business" }]} lede={`${count(meta.listings.all)} businesses and services are already here, found on the open map. Yours can be too, free. Two paid plans do more when you want them to.`} />
      <div className="shell">
        <ul className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => {
            const main = p.id === "go";
            return (
              <li key={p.id}>
                <article className={`card flex h-full flex-col ${main ? "card-ink" : ""}`}>
                  <h2 className="heading-3">{p.name}</h2>
                  <p className={`body-3 mt-1 ${main ? "opacity-80" : "text-ink-subtle"}`}>{p.line}</p>
                  <p className="mt-6">
                    <span className="heading-1 tabular block whitespace-nowrap">{p.price ? `Rs ${count(p.price)}` : "Free"}</span>
                    <span className={`body-3 mt-1 block ${main ? "opacity-80" : "text-ink-subtle"}`}>{p.price ? "a month, for each business" : "no card, no catch"}</span>
                  </p>
                  <ul className="body-3 mt-6 grid gap-3">
                    {p.gives.map((g) => (
                      <li key={g} className="flex gap-3">
                        <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-signal text-on-signal">
                          <Tick className="size-3.5" strokeWidth={2.25} />
                        </span>
                        {g}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-8">
                    {/* With accounts on, an owner lists the business themselves, signing up on the way. */}
                    <Link href={accountsOn ? `/dashboard/new${p.price ? `?plan=${p.id}` : ""}` : `/add?plan=${p.id}`} className={`btn button-md w-full ${main ? "btn-filled" : p.id === "free" ? "btn-ink" : "btn-quiet"}`}>
                      {p.price ? `Ask for ${p.name}` : "List it free"}
                      <span className="btn-dot">
                        <Arrow />
                      </span>
                    </Link>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-x-16 gap-y-8 lg:grid-cols-2">
          <div>
            <h2 className="heading-3">How it works</h2>
            <ol className="body-2 mt-4 grid gap-3 text-ink-subtle">
              <li>1. {accountsOn ? "Create an account, then tell us about the business, or find its listing and claim it." : "Tell us about the business, or find its listing and say it is yours."}</li>
              <li>2. A person checks it and answers, usually within a working day.</li>
              <li>3. On a paid plan, we confirm the business is real before it is marked verified.{accountsOn ? " We contact you to arrange payment: nothing is paid on this site yet, and paying online is on its way." : ""}</li>
            </ol>
          </div>
          <div>
            <h2 className="heading-3">What paying changes, and what it does not</h2>
            <p className="body-2 mt-4 text-ink-subtle">
              A business on Biznes Go or Biznes Grow is shown before others that answer a search equally well, and it is marked, so nobody mistakes a paid place for a better answer. Paying never hides another business, changes what a listing says about someone else, or buys a place in a guide.{" "}
              <Link href="/data">How results are ordered</Link>.
            </p>
            <p className="body-3 mt-4 text-ink-subtle">
              Prices are in Mauritian rupees. Questions: <a href={site.contact.phoneHref}>{site.contact.phone}</a> or <a href={site.contact.whatsappHref}>WhatsApp</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
