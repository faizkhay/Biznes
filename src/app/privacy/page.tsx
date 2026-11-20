import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What biznes.mu keeps about its visitors and about the businesses it lists, and what it does not.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const { contact, builder } = site;
  return (
    <>
      <PageHead title="Privacy" lede="What this site keeps, and what it does not." />
      <div className="shell">
        <div className="prose body-2">
          <h2 className="heading-3">If you only look</h2>
          <p>The site sets no cookies and runs no analytics or advertising scripts. A search is sent to our server to be answered and is not stored against you. Our hosting provider keeps ordinary server logs, as every website&rsquo;s does.</p>
          <h2 className="heading-3 mt-8">If you save listings</h2>
          <p>
            The <Link href="/saved">saved list</Link> is kept in your own browser, on your own device. It is not sent to us and we cannot see it. If you share it, the link you send holds the listings&rsquo; reference numbers and nothing about you. Clearing your browser&rsquo;s data for this site clears the list.
          </p>
          <h2 className="heading-3 mt-8">If you add the site to your home screen</h2>
          <p>Your device keeps copies of the pages you have opened, so they load quickly and still open with no connection. Those copies stay on your device.</p>
          <h2 className="heading-3 mt-8">If you send a request</h2>
          <p>The form on the page for adding or correcting a listing sends us what you type: the business, the details, your name, and the email address or number you ask us to reply to. We use it to deal with the request and to reply, and for nothing else. We do not sell it or pass it on.</p>
          <h2 className="heading-3 mt-8">If your business is listed</h2>
          <p>
            Listings describe businesses, not people. They are built from open data, each saying its source, and hold no email addresses. If a listing shows something about you that it should not, or you want it taken out, <Link href="/add">ask</Link> and it will be. <Link href="/data">Where the data comes from</Link> sets out the sources.
          </p>
          <h2 className="heading-3 mt-8">Who is responsible</h2>
          <p>
            {site.name} is run by {builder.legalName} (BRN {builder.brn}), Mauritius. Write to <a href={`mailto:${contact.email}`}>{contact.email}</a> to see, correct or delete anything we hold about you.
          </p>
        </div>
      </div>
    </>
  );
}
