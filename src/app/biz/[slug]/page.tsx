import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OwnedExtras from "@/components/account/OwnedExtras";
import { Crumbs } from "@/components/Bits";
import { Globe, GroupIcon, Phone } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { ShareButton } from "@/components/Save";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS } from "@/data/site";
import { owned, type Owned } from "@/lib/accounts/owned";
import { shortUrl, telHref } from "@/lib/format";
import { index } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

// A business's page is made the first time it is asked for and then kept, as a listing's is. It is
// made again when an admin or the owner changes the business (the read is tagged), and at the
// latest five minutes after.
export const generateStaticParams = () => [];

/** A live business listed by its owner that is not in the open index. One that claimed a listing lives on the listing's page. */
async function find(slug: string): Promise<Owned | undefined> {
  return (await owned()).bySlug.get(slug);
}

function placeOf(b: Owned) {
  const { placeBySlug, categoryById } = index();
  return { category: categoryById.get(b.category), town: placeBySlug.get(b.town) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = await find((await params).slug);
  if (!b || b.listingId) return {};
  const { category, town } = placeOf(b);
  return {
    title: `${b.name}${town ? `, ${town.name}` : ""}`,
    description: `${b.name}: ${(category?.one ?? "business").toLowerCase()}${town ? ` in ${town.name}` : ""}, Mauritius. ${[b.address, b.phone].filter(Boolean).join(". ")}`.trim(),
    alternates: { canonical: b.path },
  };
}

export default async function OwnedBusinessPage({ params }: Props) {
  const b = await find((await params).slug);
  if (!b) notFound();
  // One business, one page: a claimed listing is shown on the listing's own.
  if (b.listingId) redirect(b.path);

  const { category, town } = placeOf(b);
  return (
    <article className="shell pt-8 pb-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: b.name,
          url: `${siteUrl}${b.path}`,
          ...(b.about ? { description: b.about } : {}),
          ...(b.phone ? { telephone: b.phone } : {}),
          ...(b.website ? { sameAs: [b.website] } : {}),
          ...(b.address || town ? { address: { "@type": "PostalAddress", ...(b.address ? { streetAddress: b.address } : {}), ...(town ? { addressLocality: town.name } : {}), addressCountry: "MU" } } : {}),
        }}
      />
      <Crumbs path={[{ href: "/directory", label: "Directory" }, ...(category ? [{ href: `/directory/${category.id}`, label: category.label }] : []), { label: b.name }]} />

      <div className="mt-6 max-w-3xl">
        <span className="listing-icon mb-6" aria-hidden>
          <GroupIcon group={category?.group} />
        </span>
        <h1 className="heading-1">{b.name}</h1>
        <p className="body-1 mt-3 text-ink-subtle">{[category?.one, town?.name].filter(Boolean).join(" · ")}</p>
        <p className="mt-4">{b.paid ? <VerifiedMark size="lg" priority /> : <span className="tag caption-1">Listed by its owner</span>}</p>

        {(b.phone || b.website) && (
          <p className="mt-6 flex flex-wrap gap-3">
            {b.phone && (
              <a href={telHref(b.phone)} className="btn btn-filled button-md">
                <Phone /> {ACTIONS.call} <span className="data-1">{b.phone}</span>
              </a>
            )}
            {b.website && (
              <a href={b.website} rel="noopener nofollow" className={`btn button-md ${b.phone ? "btn-quiet" : "btn-filled"}`}>
                <Globe /> {ACTIONS.website}
              </a>
            )}
          </p>
        )}
        <p className="mt-3 flex flex-wrap gap-3 empty:hidden">
          <ShareButton title={b.name} words />
        </p>

        {b.about && (
          <div className="mt-8">
            <p className="body-2 measure whitespace-pre-line">{b.about}</p>
            <p className="caption-1 mt-2 text-ink-faint">In the words of the business.</p>
          </div>
        )}

        <dl className="facts body-3 mt-8">
          {(b.address || town) && (
            <>
              <dt>Address</dt>
              <dd>{[b.address, town?.name, town?.district && town.district !== town.name ? `${town.district} district` : null].filter(Boolean).join(", ")}</dd>
            </>
          )}
          {b.phone && (
            <>
              <dt>Telephone</dt>
              <dd className="data-1">
                <a href={telHref(b.phone)} className="inline-flex min-h-11 items-center whitespace-nowrap">
                  {b.phone}
                </a>
              </dd>
            </>
          )}
          {b.website && (
            <>
              <dt>Website</dt>
              <dd>
                <a href={b.website} rel="noopener nofollow" className="data-1 break-all">
                  {shortUrl(b.website)}
                </a>
              </dd>
            </>
          )}
        </dl>

        <OwnedExtras business={b} />

        <section aria-labelledby="from" className="mt-10">
          <h2 id="from" className="heading-3">
            Where this comes from
          </h2>
          <ul className="body-3 mt-3 grid max-w-prose gap-2 text-ink-subtle">
            <li>This page was written by the business itself, and a person at biznes.mu read it before it went live.</li>
            {b.paid ? (
              <li>
                It is verified: we have checked that the business is real. It is on a paid plan, so it is shown before others that answer a search, and it is marked wherever it is. <Link href="/pricing">What paying changes, and what it does not</Link>.
              </li>
            ) : (
              <li>It is not marked verified: nobody at biznes.mu has visited or vetted this business.</li>
            )}
            <li>
              Being listed here does not say a business is registered or licensed. <Link href="/tools/verify">The official registers</Link> do.
            </li>
            <li>
              Something wrong on this page? <Link href="/add">Tell us</Link>.
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
