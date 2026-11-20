import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { anchorOf } from "@/lib/format";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Glossary of business terms in Mauritius",
  description: "BRN, TAN, CSG, PAYE, GBC and the other names and initials a business in Mauritius meets, each explained in a sentence with the guide that covers it.",
  path: "/learn/glossary",
});

export default function GlossaryPage() {
  const { glossary: list, guideBySlug } = index();
  const letter = (term: string) => (/[a-z]/i.exec(term)?.[0] ?? "#").toUpperCase();
  const letters = [...new Set(list.map((t) => letter(t.term)))];
  return (
    <>
      <PageHead here="/learn/glossary" path={[{ href: "/learn", label: "Learn" }, { label: "Glossary" }]} title="Glossary" lede="The names and initials a business in Mauritius meets. Each meaning is taken from one of the guides, which gives its source." />
      <div className="shell">
        {list.length === 0 && <p className="body-2 text-ink-subtle">The glossary is being written.</p>}
        <nav aria-label="Letters" className="mb-8">
          <ul className="narrow">
            {letters.map((l) => (
              <li key={l}>
                <a href={`#letter-${l.toLowerCase()}`} className="data-1">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <dl className="max-w-4xl border-t border-line">
          {list.map((t, i) => {
            const first = i === 0 || letter(list[i - 1].term) !== letter(t.term);
            const guide = t.guide ? guideBySlug.get(t.guide) : undefined;
            return (
              <div key={t.term} id={anchorOf(t.term)} className="grid scroll-mt-8 gap-x-12 gap-y-1 border-b border-line py-4 md:grid-cols-12">
                <dt className="md:col-span-4">
                  {first && <span id={`letter-${letter(t.term).toLowerCase()}`} className="scroll-mt-8" />}
                  <span className="title-1">{t.term}</span>
                  {t.full && <span className="body-3 block text-ink-subtle">{t.full}</span>}
                </dt>
                <dd className="body-3 text-ink-subtle md:col-span-8">
                  {t.meaning}
                  {guide && (
                    <span className="caption-1 mt-1 block text-ink-faint">
                      From <Link href={`/learn/${guide.slug}`}>{guide.title}</Link>
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </>
  );
}
