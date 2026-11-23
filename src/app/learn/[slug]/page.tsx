import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AdSlot from "@/components/account/AdSlot";
import { Crumbs } from "@/components/Bits";
import GuideBlocks, { Cites } from "@/components/GuideBlocks";
import { CategoryIcon } from "@/components/Glyphs";
import { Arrow, Fork, Out } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import RailMark from "@/components/RailMark";
import { ARTICLE_BUSINESSES, BAZ, site } from "@/data/site";
import { count } from "@/lib/format";
import { listingsIn } from "@/lib/index";
import { anchorOf, day, shortUrl } from "@/lib/format";
import { TOOLS } from "@/lib/tools";
import { SHELVES } from "@/data/site";
import { index } from "@/lib/index";
import { publisher } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { pageMeta } from "@/lib/meta";

type Props = { params: Promise<{ slug: string }> };

// Every article is made ahead. An address that is not an article is made when asked for, and is a
// 404 or, for an article's name with ".md" after it, the way to that article as Markdown.
export const generateStaticParams = () => index().guides.map((g) => ({ slug: g.slug }));

const anchor = anchorOf;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = index().guideBySlug.get((await params).slug);
  if (!g) return {};
  // The description a search engine shows: the summary's first sentences, kept under 160 characters.
  const whole = g.summary.slice(0, 160).match(/^.{90,}[.!?](?=\s|$)/)?.[0];
  const short = g.summary.length <= 160 ? g.summary : (whole ?? `${g.summary.slice(0, 156).replace(/[\s,;:]+\S*$/, "")}...`);
  return pageMeta({ title: g.title, description: short, path: `/learn/${g.slug}`, article: { modified: g.checked }, markdown: `/learn/md/${g.slug}.md`, drawn: true });
}

export default async function GuidePage({ params }: Props) {
  const data = index();
  const { slug } = await params;
  if (slug.endsWith(".md") && data.guideBySlug.has(slug.slice(0, -3))) permanentRedirect(`/learn/md/${slug}`);
  const g = data.guideBySlug.get(slug);
  if (!g) notFound();
  const at = data.guides.indexOf(g);
  // The parts whose heading is a question, each with its first paragraph as the answer: what the page says, said again for machines.
  const asked = g.sections.map((section) => ({ question: section.heading, answer: section.blocks[0]?.type === "p" ? section.blocks[0].text : "" })).filter((qa) => qa.question.trim().endsWith("?") && qa.answer);
  // What follows on: the other articles of the same shelf, in their order from this one, then the
  // rest. And the article's own pointers, split into this site's pages and the official ones.
  const after = [...data.guides.slice(at + 1), ...data.guides.slice(0, at)];
  const shelf = g.shelf ?? "business";
  const inside = g.resources.filter((r) => r.url.startsWith("/")).slice(0, 2);
  const related = [...after.filter((o) => (o.shelf ?? "business") === shelf), ...after.filter((o) => (o.shelf ?? "business") !== shelf)].slice(0, 4 - inside.length);
  const outside = g.resources.filter((r) => !r.url.startsWith("/"));
  const words = g.sections.reduce((n, section) => n + JSON.stringify(section.blocks).split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 220));
  const tool = TOOLS.find((t) => t.guide === g.slug);
  // The kinds of business that go with the article, where the tie is plain (src/data/site.ts): an
  // article on the food shelf goes with every kind of place to eat.
  const goes = g.shelf === "food" ? data.categories.filter((c) => c.group === "eat").map((c) => c.id) : [...((ARTICLE_BUSINESSES as Record<string, readonly string[]>)[g.slug] ?? [])];
  const kinds = goes
    .map((id) => data.categoryById.get(id))
    .filter((c) => c != null && c.n > 0)
    .slice(0, 3)
    .map((c) => ({ category: c!, first: listingsIn({ cat: c!.id }).slice(0, 3) }));

  return (
    <article className="shell pt-8 pb-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.summary,
          dateModified: g.checked,
          inLanguage: "en",
          url: `${siteUrl}/learn/${g.slug}`,
          mainEntityOfPage: `${siteUrl}/learn/${g.slug}`,
          isAccessibleForFree: true,
          author: { "@type": "Organization", name: site.name, url: siteUrl },
          publisher: publisher(),
          citation: g.sources.map((s) => s.url),
        }}
      />
      {asked.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: asked.map((qa) => ({ "@type": "Question", name: qa.question, acceptedAnswer: { "@type": "Answer", text: qa.answer } })),
          }}
        />
      )}
      <Crumbs here={`/learn/${g.slug}`} path={[{ href: "/", label: "Home" }, { href: "/learn", label: "Articles" }, { label: g.title }]} />
      <h1 className="heading-1 mt-4 max-w-4xl">{g.title}</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">{g.summary}</p>
      <p className="caption-1 mt-6 text-ink-faint">
        {minutes} minute read. Checked {day(g.checked)} against {g.sources.length} sources. General information, not legal or tax advice.
      </p>
      {tool && (
        <p className="mt-6">
          <Link href={tool.href} className="btn btn-quiet button-md">
            {tool.title}
          </Link>
        </p>
      )}

      {/* On a phone the way through a long guide is a list that opens. */}
      <details className="note mt-8 lg:hidden">
        <summary className="title-2 cursor-pointer">In this article</summary>
        <ol className="mt-3 grid gap-1">
          {[...g.sections.map((s) => s.heading), "References"].map((heading) => (
            <li key={heading}>
              <a href={`#${anchor(heading)}`} className="body-3 inline-flex min-h-11 items-center text-ink-subtle">
                {heading}
              </a>
            </li>
          ))}
        </ol>
      </details>

      {g.facts.length > 0 && (
        <section aria-labelledby="glance" className="mt-10 scroll-mt-8">
          <h2 id="glance" className="label-1 pb-3 text-ink-faint">
            At a glance
          </h2>
          <dl className="grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
            {g.facts.map((f) => (
              <div key={f.label} className="border-b border-line py-4">
                <dt className="caption-1 text-ink-faint">{f.label}</dt>
                <dd className="title-1 mt-1">
                  {f.value}
                  <Cites ids={f.sources} guide={g} />
                </dd>
                {f.detail && <dd className="body-3 mt-1 text-ink-subtle">{f.detail}</dd>}
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-12 grid gap-x-12 lg:grid-cols-12">
        <nav aria-label="In this article" className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <h2 className="label-1 pb-3 text-ink-faint">In this article</h2>
            <ol id="rail" className="grid gap-1 border-l border-line">
              {[...g.sections.map((s) => s.heading), "References"].map((heading) => (
                <li key={heading}>
                  <a href={`#${anchor(heading)}`} className="rail-link body-3 -ml-px block border-l border-transparent py-1 pl-4 text-ink-subtle no-underline hover:border-signal hover:text-ink">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
            <RailMark rail="rail" />
          </div>
        </nav>

        <div className="lg:col-span-9">
          {g.sections.map((section) => (
            <section key={section.heading} aria-labelledby={anchor(section.heading)} className="mb-12">
              <h2 id={anchor(section.heading)} className="heading-2">
                {section.heading}
              </h2>
              <div className="prose body-2 mt-4">
                <GuideBlocks blocks={section.blocks} guide={g} />
              </div>
            </section>
          ))}

          {g.unverified && g.unverified.length > 0 && (
            <section aria-labelledby="open" className="mb-12 max-w-prose">
              <h2 id="open" className="heading-3">
                What this article could not confirm
              </h2>
              <p className="body-3 mt-2 text-ink-subtle">These points were looked for and not found on an official page, so the article does not state them. Check them with the body concerned.</p>
              <ul className="prose body-3 mt-3 text-ink-subtle">
                {g.unverified.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </section>
          )}

          {/* The references: where every figure came from, and the official pages themselves, for
              whoever wants to check or go further. They close the page; they are not its way on. */}
          <section aria-labelledby="references" className="max-w-prose border-t border-line pt-8">
            <h2 id="references" className="heading-3">
              References
            </h2>
            <p className="body-3 mt-2 text-ink-subtle">Every figure above carries the number of the page it was read on.</p>
            <ol className="mt-4 grid gap-3">
              {g.sources.map((s, i) => (
                <li key={s.id} id={`source-${i + 1}`} className="body-3 grid grid-cols-[2.5rem_1fr] text-ink-subtle">
                  <span className="data-2 pt-0.5 text-ink-faint">[{i + 1}]</span>
                  <span>
                    <a href={s.url} rel="noopener" className="text-ink">
                      {s.title}
                    </a>
                    . {s.publisher}
                    {s.published ? `. ${s.published}` : ""}. Read {day(s.accessed)}. <span className="data-2 text-ink-faint [overflow-wrap:anywhere]">{shortUrl(s.url)}</span>
                  </span>
                </li>
              ))}
            </ol>
            {outside.length > 0 && (
              <>
                <h3 className="title-1 mt-8">The official pages to go to</h3>
                <ul className="mt-3 grid gap-3">
                  {outside.map((r) => (
                    <li key={r.url} className="body-3 text-ink-subtle">
                      <a href={r.url} rel="noopener" className="inline-flex items-baseline gap-2 text-ink">
                        {r.title} <Out className="size-4 shrink-0 self-center text-ink-faint" />
                      </a>
                      . {r.what} <span className="text-ink-faint">{r.publisher}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
          {/* The businesses that go with the article: the kinds of place a reader of it may want next, from the directory. */}
          {kinds.length > 0 && (
            <section aria-labelledby="goes-with" className="mt-12">
              <h2 id="goes-with" className="heading-2">
                In the directory
              </h2>
              <p className="body-3 mt-2 max-w-prose text-ink-subtle">The kinds of business that go with this article, as the open map lists them. Being listed does not say a business is registered or recommended.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kinds.map(({ category, first }) => (
                  <li key={category.id}>
                    <article className="card h-full">
                      <p className="flex items-center gap-3">
                        <span className="suggest-icon" aria-hidden>
                          <CategoryIcon id={category.id} group={category.group} />
                        </span>
                        <span className="data-2 text-ink-faint">{count(category.n)} listed</span>
                      </p>
                      <h3 className="title-1 mt-3">
                        <Link prefetch={false} href={`/directory/${category.id}`} className="row-title text-ink">
                          {category.label}
                        </Link>
                      </h3>
                      <ul className="body-3 mt-2 grid gap-1 text-ink-subtle">
                        {first.map((l) => (
                          <li key={l.id} className="truncate">
                            <Link prefetch={false} href={`/b/${l.slug}`}>
                              {l.name}
                            </Link>
                            {l.place ? `, ${l.place}` : ""}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </li>
                ))}
              </ul>
              {g.shelf === "food" && (
                <p className="mt-4">
                  <Link href={BAZ.href} className="btn btn-quiet button-md">
                    <Fork /> {BAZ.name}: every place to eat
                    <span className="btn-dot">
                      <Arrow />
                    </span>
                  </Link>
                </p>
              )}
            </section>
          )}
          <AdSlot place="article" className="mt-12" />

          {/* Keep reading: the pages of this site that follow on, after its references: the last thing on the page is a way on, not a way out. */}
          <section aria-labelledby="keep-reading" className="mt-12">
            <h2 id="keep-reading" className="heading-2">
              Keep reading
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {inside.map((r) => (
                <li key={r.url}>
                  <article className="card h-full">
                    <p className="label-1 text-ink-faint">On biznes.mu</p>
                    <h3 className="title-1 mt-2">
                      <Link href={r.url} className="row-title text-ink">
                        {r.title}
                      </Link>
                    </h3>
                    <p className="body-3 mt-2 line-clamp-2 text-ink-subtle">{r.what}</p>
                  </article>
                </li>
              ))}
              {related.map((r) => (
                <li key={r.slug}>
                  <article className="card h-full">
                    <p className="label-1 text-ink-faint">{SHELVES.find((shelf) => shelf.id === (r.shelf ?? "business"))?.label}</p>
                    <h3 className="title-1 mt-2">
                      <Link href={`/learn/${r.slug}`} className="row-title text-ink">
                        {r.title}
                      </Link>
                    </h3>
                    <p className="body-3 mt-2 line-clamp-2 text-ink-subtle">{r.summary}</p>
                  </article>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </article>
  );
}
