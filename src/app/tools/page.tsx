import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Business tools",
  description: "Free tools for business and everyday life in Mauritius: check a business against the official registers, work out VAT, income tax and the taxes on a business, compare legal structures, and look up a term.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <PageHead title="Tools" lede="Small tools for common jobs. Each one takes its figures from the guides, so it is only ever as current as the guide it names." />
      <div className="shell">
        <ul className="rows max-w-4xl">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <article className="row">
                <h2 className="heading-3">
                  <Link href={t.href} className="row-title">
                    {t.title}
                  </Link>
                </h2>
                <p className="body-3 mt-2 max-w-prose text-ink-subtle">{t.what}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
