import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { day } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Guides to business in Mauritius",
  description: "Plain guides to starting and running a business in Mauritius: registration, companies, tax, VAT, employing people, licences, trade marks, data protection, investing from abroad. Every fact sourced.",
  alternates: { canonical: "/learn" },
};

export default function LearnPage() {
  const { guides } = index();
  return (
    <>
      <PageHead title="How business works in Mauritius" lede="Plain guides to starting and running a business. Each is written from the official pages and the Acts themselves, names its source beside every figure, and says the day it was last checked." />
      <div className="shell">
        {guides.length === 0 && <p className="body-2 text-ink-subtle">The guides are being written.</p>}
        <ol className="rows max-w-4xl">
          {guides.map((g) => (
            <li key={g.slug}>
              <article className="row">
                <h2 className="heading-3">
                  <Link href={`/learn/${g.slug}`} className="row-title">
                    {g.title}
                  </Link>
                </h2>
                <p className="body-3 mt-2 max-w-prose text-ink-subtle">{g.summary}</p>
                <p className="data-2 mt-3 text-ink-faint">
                  {g.sources.length} sources · checked {day(g.checked)}
                </p>
              </article>
            </li>
          ))}
        </ol>
        <p className="body-3 mt-10 flex flex-wrap gap-3">
          <Link href="/learn/glossary" className="btn btn-quiet button-md">
            Glossary
          </Link>
          <Link href="/official" className="btn btn-quiet button-md">
            Official pages
          </Link>
          <Link href="/tools" className="btn btn-quiet button-md">
            Tools
          </Link>
        </p>
      </div>
    </>
  );
}
