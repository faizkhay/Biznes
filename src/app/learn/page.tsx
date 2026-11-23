import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { day } from "@/lib/format";
import { SHELVES } from "@/data/site";
import { index } from "@/lib/index";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Articles about Mauritius",
  description: "Plain articles about Mauritius: the island, doing business, food, visiting, moving and living here. Every figure names the official page it was read on.",
  path: "/learn",
});

export default function LearnPage() {
  const { guides } = index();
  const shelves = SHELVES.map((shelf) => ({ ...shelf, guides: guides.filter((g) => (g.shelf ?? "business") === shelf.id) })).filter((shelf) => shelf.guides.length > 0);
  return (
    <>
      <PageHead here="/learn" title="Articles about Mauritius" path={[{ label: "Articles" }]} lede="Plain articles about Mauritius: the island itself, doing business here, visiting, moving here and living here. Each is written from the official pages themselves, names its source beside every figure, and says the day it was checked and what could not be confirmed." />
      <div className="shell">
        {guides.length === 0 && <p className="body-2 text-ink-subtle">The articles are being written.</p>}
        {shelves.length > 1 && (
          <nav aria-label="Shelves">
            <ul className="narrow">
              {shelves.map((shelf) => (
                <li key={shelf.id}>
                  <a href={`#${shelf.id}`} className="body-3">
                    {shelf.label} <span className="data-2 text-ink-faint">{shelf.guides.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {shelves.map((shelf) => (
          <section key={shelf.id} id={shelf.id} aria-labelledby={`${shelf.id}-h`} className="mt-10 scroll-mt-24">
            <h2 id={`${shelf.id}-h`} className="heading-2">
              {shelf.label}
            </h2>
            <p className="body-2 mt-2 text-ink-subtle">{shelf.line}</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.guides.map((g) => (
                <li key={g.slug}>
                  <article className="card h-full">
                    <h3 className="title-1">
                      <Link href={`/learn/${g.slug}`} className="row-title text-ink">
                        {g.title}
                      </Link>
                    </h3>
                    <p className="body-3 mt-2 line-clamp-3 text-ink-subtle">{g.summary}</p>
                    <p className="caption-1 mt-4 text-ink-faint">
                      {g.sources.length} sources, checked {day(g.checked)}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="body-3 mt-12 flex flex-wrap gap-3">
          <Link href="/emergency" className="btn btn-ink button-md">
            Emergency numbers
          </Link>
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
