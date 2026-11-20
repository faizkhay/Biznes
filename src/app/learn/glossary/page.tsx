import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { index } from "@/lib/index";

export const metadata: Metadata = {
  title: "Glossary of business terms in Mauritius",
  description: "BRN, TAN, CSG, BLUP, GBC and the other names and initials a business in Mauritius meets, each explained in a sentence with the guide that covers it.",
  alternates: { canonical: "/learn/glossary" },
};

type Term = { term: string; full?: string; meaning: string; guide?: string };

/** content/glossary.json: each term's meaning is taken from the guide it names, so it has that guide's sources. */
function terms(): Term[] {
  const file = join(process.cwd(), "content", "glossary.json");
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Term[]).sort((a, b) => a.term.localeCompare(b.term)) : [];
}

export default function GlossaryPage() {
  const list = terms();
  const { guideBySlug } = index();
  return (
    <>
      <PageHead path={[{ href: "/learn", label: "Learn" }, { label: "Glossary" }]} title="Glossary" lede="The names and initials a business in Mauritius meets. Each meaning is taken from one of the guides, which gives its source." />
      <div className="shell">
        {list.length === 0 && <p className="body-2 text-ink-subtle">The glossary is being written.</p>}
        <dl className="max-w-4xl border-t border-line">
          {list.map((t) => (
            <div key={t.term} id={t.term.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="grid gap-x-12 gap-y-1 border-b border-line py-4 md:grid-cols-12">
              <dt className="md:col-span-4">
                <span className="title-1">{t.term}</span>
                {t.full && <span className="body-3 block text-ink-subtle">{t.full}</span>}
              </dt>
              <dd className="body-3 text-ink-subtle md:col-span-8">
                {t.meaning}
                {t.guide && guideBySlug.has(t.guide) && (
                  <>
                    {" "}
                    <Link href={`/learn/${t.guide}`} className="whitespace-nowrap">
                      Read the guide
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
