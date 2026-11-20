import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Bits";
import GuideBlocks, { Cites } from "@/components/GuideBlocks";
import { Out } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { site } from "@/data/site";
import { day, shortUrl } from "@/lib/format";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => index().guides.map((g) => ({ slug: g.slug }));
export const dynamicParams = false;

const anchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = index().guideBySlug.get((await params).slug);
  if (!g) return {};
  return { title: g.title, description: g.summary.slice(0, 300), alternates: { canonical: `/learn/${g.slug}` } };
}

export default async function GuidePage({ params }: Props) {
  const data = index();
  const g = data.guideBySlug.get((await params).slug);
  if (!g) notFound();
  const at = data.guides.indexOf(g);
  const next = data.guides[at + 1];

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
          publisher: { "@type": "Organization", name: site.name, url: siteUrl },
          citation: g.sources.map((s) => s.url),
        }}
      />
      <Crumbs path={[{ href: "/learn", label: "Learn" }, { label: g.title }]} />
      <h1 className="heading-1 mt-4 max-w-4xl">{g.title}</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">{g.summary}</p>
      <p className="data-2 mt-6 text-ink-faint">
        Checked {day(g.checked)} against {g.sources.length} sources. General information, not legal or tax advice.
      </p>

      {g.facts.length > 0 && (
        <section aria-labelledby="glance" className="mt-10">
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
        <nav aria-label="In this guide" className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <h2 className="label-1 pb-3 text-ink-faint">In this guide</h2>
            <ol className="grid gap-1 border-l border-line">
              {[...g.sections.map((s) => s.heading), "Sources"].map((heading) => (
                <li key={heading}>
                  <a href={`#${anchor(heading)}`} className="body-3 -ml-px block border-l border-transparent py-1 pl-4 text-ink-subtle no-underline hover:border-signal hover:text-ink">
                    {heading}
                  </a>
                </li>
              ))}
            </ol>
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

          {g.resources.length > 0 && (
            <section aria-labelledby="next-steps" className="mb-12">
              <h2 id="next-steps" className="heading-2">
                Where to go next
              </h2>
              <ul className="rows mt-4 max-w-prose">
                {g.resources.map((r) => (
                  <li key={r.url}>
                    <div className="row">
                      <a href={r.url} rel="noopener" className="row-title title-2 inline-flex items-baseline gap-2">
                        {r.title} <Out className="size-4 shrink-0 self-center text-ink-faint" />
                      </a>
                      <p className="body-3 mt-1 text-ink-subtle">{r.what}</p>
                      <p className="data-2 mt-2 text-ink-faint">{r.publisher}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {g.unverified && g.unverified.length > 0 && (
            <section aria-labelledby="open" className="mb-12 max-w-prose">
              <h2 id="open" className="heading-3">
                What this guide could not confirm
              </h2>
              <p className="body-3 mt-2 text-ink-subtle">These points were looked for and not found on an official page, so the guide does not state them. Check them with the body concerned.</p>
              <ul className="prose body-3 mt-3 text-ink-subtle">
                {g.unverified.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="sources" className="max-w-prose">
            <h2 id="sources" className="heading-3">
              Sources
            </h2>
            <ol className="mt-3 grid gap-3">
              {g.sources.map((s, i) => (
                <li key={s.id} id={`source-${i + 1}`} className="body-3 grid grid-cols-[2.5rem_1fr] text-ink-subtle">
                  <span className="data-2 pt-0.5 text-ink-faint">[{i + 1}]</span>
                  <span>
                    <a href={s.url} rel="noopener" className="text-ink">
                      {s.title}
                    </a>
                    . {s.publisher}
                    {s.published ? `. ${s.published}` : ""}. Read {day(s.accessed)}. <span className="data-2 break-all text-ink-faint">{shortUrl(s.url)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {next && (
            <p className="body-2 mt-12 border-t border-line pt-6">
              <span className="caption-1 block text-ink-faint">Next guide</span>
              <Link href={`/learn/${next.slug}`}>{next.title}</Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
