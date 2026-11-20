import Link from "next/link";
import GuideBlocks from "@/components/GuideBlocks";
import { day } from "@/lib/format";
import { tablesOf } from "@/lib/figures";

/**
 * A tool that is a guide's own tables, shown on their own: the registers to check a business
 * against, the legal structures side by side. The tables are the guide's, with its sources; this
 * only brings them forward and links back.
 */
export default function GuideTables({ slug, missing }: { slug: string; missing: string }) {
  const found = tablesOf(slug);
  if (!found || !found.tables.length) return <p className="body-2 note max-w-prose">{missing}</p>;
  const { guide, tables } = found;
  return (
    <>
      {tables.map(({ heading, block }, i) => (
        <section key={i} aria-labelledby={`t-${i}`} className="mb-12">
          <h2 id={`t-${i}`} className="heading-2">
            {heading}
          </h2>
          <div className="prose body-2 mt-4 max-w-none">
            <GuideBlocks blocks={[block]} guide={guide} />
          </div>
        </section>
      ))}
      <p className="body-2 max-w-prose border-t border-line pt-6">
        These tables are from <Link href={`/learn/${guide.slug}`}>{guide.title}</Link>, checked {day(guide.checked)}. The guide explains each row and lists every source; the numbers in brackets are its source numbers.
      </p>
    </>
  );
}
