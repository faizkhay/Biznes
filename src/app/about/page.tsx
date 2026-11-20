import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import JsonLd from "@/components/JsonLd";
import { PROMISES, site } from "@/data/site";
import { count } from "@/lib/format";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About biznes.mu and Khay Digital",
  description: "biznes.mu is the search engine for business in Mauritius. It is a product of Khay Digital, a Mauritian digital agency, and was developed by Faiz Khayrattee.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const { meta, guides } = index();
  const { builder, contact } = site;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `About ${site.name}`,
          url: `${siteUrl}/about`,
          mainEntity: { "@type": "Organization", name: builder.legalName, alternateName: builder.name, url: builder.url, telephone: contact.phone, email: contact.email, address: { "@type": "PostalAddress", addressCountry: "MU" } },
        }}
      />
      <PageHead title={`About ${site.name}`} path={[{ label: "About" }]} lede={`${site.line}: ${count(meta.listings.all)} businesses and services, ${count(guides.length)} articles, the numbers to call and the days that are holidays, in one place.`} />
      <div className="shell grid gap-x-16 gap-y-10 lg:grid-cols-12">
        <div className="prose body-2 lg:col-span-7">
          <h2 className="heading-2">Who makes it</h2>
          <p>
            {site.name} is a product of{" "}
            <a href={builder.url} rel="noopener">
              {builder.name}
            </a>
            , a Mauritian digital agency, and was developed by {builder.developer}. {builder.name} builds websites and digital experiences.
          </p>
          <p>
            The company is {builder.legalName}, registered in Mauritius under business registration number {builder.brn}.
          </p>
          <h2 className="heading-2 mt-10">What it holds itself to</h2>
          <ul>
            {PROMISES.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
          <p>
            <Link href="/data">Where the data comes from</Link> sets out the sources, how results are ordered, and how a listing is corrected or taken out.
          </p>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="card">
            <h2 className="heading-3">Talk to {builder.name}</h2>
            <p className="body-3 mt-2 text-ink-subtle">About this site, or about a website for your own business.</p>
            <ul className="body-3 mt-4 grid gap-2">
              <li>
                <a href={contact.phoneHref} className="data-1 inline-flex min-h-11 items-center whitespace-nowrap">
                  {contact.phone}
                </a>
              </li>
              <li>
                <a href={contact.whatsappHref} rel="noopener" className="inline-flex min-h-11 items-center">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center">
                  {contact.email}
                </a>
              </li>
              <li>
                <a href={builder.url} rel="noopener" className="inline-flex min-h-11 items-center">
                  khay.digital
                </a>
              </li>
            </ul>
            <p className="caption-1 mt-3 text-ink-faint">{contact.hours}.</p>
          </div>
          <p className="mt-6">
            <Link href="/pricing" className="btn btn-ink button-md">
              List your business
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
