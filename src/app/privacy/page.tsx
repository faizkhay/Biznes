import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Privacy on biznes.mu",
  description: "What biznes.mu keeps about its visitors and about the businesses it lists, and what it does not.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const { contact, builder } = site;
  return (
    <>
      <PageHead here="/privacy" title="Privacy" lede="What this site keeps, and what it does not." />
      <div className="shell">
        <div className="prose body-2">
          <h2 className="heading-3">If you only look</h2>
          <p>{`${accountsOn ? "The site sets no cookies unless you sign in, and runs no analytics or advertising scripts." : "The site sets no cookies and runs no analytics or advertising scripts."} A search is sent to our server to be answered and is not stored against you. Our hosting provider keeps ordinary server logs, as every website’s does.`}</p>
          <h2 className="heading-3 mt-8">If you save listings</h2>
          <p>
            The <Link href="/saved">saved list</Link> is kept in your own browser, on your own device. It is not sent to us and we cannot see it. If you share it, the link you send holds the listings&rsquo; reference numbers and nothing about you. Clearing your browser&rsquo;s data for this site clears the list.
          </p>
          <h2 className="heading-3 mt-8">If you put things in the cart</h2>
          <p>
            The <Link href="/cart">cart</Link> is kept in your own browser too, and we cannot see it. Nothing in it reaches us until you send an order.
          </p>
          <h2 className="heading-3 mt-8">If you add the site to your home screen</h2>
          <p>Your device keeps copies of the pages you have opened, so they load quickly and still open with no connection. Those copies stay on your device.</p>
          {accountsOn && (
            <>
              <h2 className="heading-3 mt-8">If you create an account</h2>
              <p>
                We keep your name, your email address and, if you give it, your telephone number, to run your account and to reach you about a business you list. Your password is kept by our sign-in service, Supabase, in a form nobody can read, us included. Signing in sets cookies in your browser that keep you signed in, and nothing else; signing out removes them. What an admin does to a business is recorded with who did it.
              </p>
              <h2 className="heading-3 mt-8">If you list a business</h2>
              <p>What you write about the business is shown to everyone once a person has checked it, and it is shown as your own words. That you are its owner is not shown. You can change it or take it out from your account at any time.</p>
              <h2 className="heading-3 mt-8">If you ask for a booking</h2>
              <p>Your name, your telephone number, the time you asked for and your note go to the business you asked, and are kept so that it can answer you. If you are signed in the request is also kept in your account. We do not pass them to anyone else, and we take no payment.</p>
              <h2 className="heading-3 mt-8">If you place an order</h2>
              <p>An order keeps the name, the telephone number and the email address you give with it, to arrange payment and delivery. If you are signed in the order is also kept in your account. Nothing is paid on this site.</p>
              <h2 className="heading-3 mt-8">If you join the list</h2>
              <p>Your email address is kept to send you the pocket guide and the magazine when each comes out, and for nothing else. Every message we send has a link that takes your address off the list.</p>
            </>
          )}
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
