import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import RequestForm from "@/components/RequestForm";
import { site } from "@/data/site";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Add or correct a listing",
  description: "Add a business to biznes.mu, correct a listing, or have one removed. Free, and answered by a person.",
  alternates: { canonical: "/add" },
};

export default async function AddPage({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const wanted = (await searchParams).listing;
  const listing = wanted ? index().byId.get(wanted) : undefined;
  const { contact } = site;
  return (
    <>
      <PageHead title="Add or correct a listing" lede={listing ? `About ${listing.name}. Tell us what should change, or that it should be taken out.` : "Add a business, put a listing right, or have one taken out. It costs nothing, and a person reads every request."} />
      <div className="shell grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RequestForm listing={listing ? { id: listing.id, name: listing.name } : undefined} />
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
