import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Crumbs } from "@/components/Bits";
import Chart from "@/components/Chart";
import { Globe, GroupIcon, Phone, Pin } from "@/components/Icons";
import { SaveButton, ShareButton } from "@/components/Save";
import JsonLd from "@/components/JsonLd";
import { ListingRow } from "@/components/Rows";
import { ACTIONS, CREDITS } from "@/data/site";
import { degrees } from "@/lib/chart";
import { chartPoints } from "@/lib/chart";
import { day, directionsHref, distance, hoursLines, mapHref, month, osmHref, shortUrl, telHref, wikidataHref, yearsSince } from "@/lib/format";
import { index, listingFromSlug, whereOf, type Listing } from "@/lib/index";
import { siteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

// Seven thousand pages are not built ahead: each is made the first time it is asked for, then kept.
export const generateStaticParams = () => [];

const SOCIAL_NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok" };

function describe(l: Listing): string {
  const category = index().categoryById.get(l.cat);
  const where = whereOf(l);
  return `${l.name}: ${(category?.one ?? "listing").toLowerCase()}${where ? ` in ${where}` : ""}, Mauritius. ${[l.street, l.phone?.[0]].filter(Boolean).join(". ")}`.trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = listingFromSlug((await params).slug);
  if (!l) return {};
  return { title: `${l.name}${l.place ? `, ${l.place}` : ""}`, description: describe(l), alternates: { canonical: `/b/${l.slug}` } };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const l = listingFromSlug(slug);
  if (!l) notFound();
  if (slug !== l.slug) permanentRedirect(`/b/${l.slug}`);

  const data = index();
  const category = data.categoryById.get(l.cat);
  const where = whereOf(l);
  const placed = l.lat != null && l.lon != null;
  const near = placed
    ? data.listings
        .filter((o) => o.id !== l.id && o.cat === l.cat && o.lat != null && o.region === l.region)
        .map((o) => ({ o, d: Math.hypot((o.lon! - l.lon!) * 104, (o.lat! - l.lat!) * 111) }))
        // "Nearby" means within eight kilometres: farther than that is another town.
        .filter(({ d }) => d <= 8)
        .sort((a, b) => a.d - b.d)
        .slice(0, 5)
    : [];
  const aboutFrom = l.aboutFrom === "site" ? "its own website" : l.aboutFrom === "wikidata" ? "Wikidata" : "OpenStreetMap";
  // How old the map's record is. A number or hours last looked at years ago may have changed.
  const mapped = l.src.osm && l.src.edited ? month(l.src.edited) : "";
  const stale = yearsSince(l.src.edited) > 2;
  const own = chartPoints().at.get(l.id);
  const bare = !l.phone?.length && !l.web;

  return (
    <article className="shell pt-8 pb-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": l.src.osm ? "LocalBusiness" : "Organization",
          name: l.name,
          url: `${siteUrl}/b/${l.slug}`,
          ...(l.about ? { description: l.about } : {}),
          ...(l.phone?.length ? { telephone: l.phone[0] } : {}),
          ...(l.web ? { sameAs: [l.web, ...Object.values(l.social ?? {}), ...(l.wikidata ? [wikidataHref(l.wikidata)] : [])] } : {}),
          ...(l.place || l.street ? { address: { "@type": "PostalAddress", ...(l.street ? { streetAddress: l.street } : {}), ...(l.place ? { addressLocality: l.place } : {}), ...(l.postcode ? { postalCode: l.postcode } : {}), addressCountry: "MU" } } : {}),
          ...(placed ? { geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lon } } : {}),
          ...(l.hours ? { openingHours: l.hours } : {}),
        }}
      />
      <Crumbs
        path={[
          { href: "/directory", label: "Directory" },
          ...(category ? [{ href: `/directory/${category.id}`, label: category.label }] : []),
          ...(category && l.placeSlug ? [{ href: `/directory/${category.id}/${l.placeSlug}`, label: l.place! }] : []),
          { label: l.name },
        ]}
      />

      <div className="mt-6 grid gap-x-12 gap-y-10 chart:grid-cols-12">
        <div className="chart:col-span-7">
          <header className="biz-head">
            {/* The top of the card is the map, drawn in on where the business is, among its neighbours. */}
            <div className="biz-cover">{own != null ? <Chart lit={[own]} focus={l} zoom span={96} says={`A map of the streets around ${l.name}, with the other listings near it.`} /> : null}</div>
            <div className="biz-body">
              <span className="biz-icon" aria-hidden>
                <GroupIcon group={category?.group} />
              </span>
              <h1 className="heading-1 mt-4">{l.name}</h1>
          <p className="body-1 mt-3 text-ink-subtle">{[l.kind && category?.id !== "companies" ? `${category?.one}, ${l.kind}` : (l.kind ?? category?.one), where].filter(Boolean).join(" · ")}</p>

          {(l.phone?.length || l.web || placed) && (
            <p className="biz-acts mt-6">
              {l.phone?.[0] && (
                <a href={telHref(l.phone[0])} className="btn btn-filled button-md">
                  <Phone /> {ACTIONS.call} <span className="data-1">{l.phone[0]}</span>
                </a>
              )}
              {l.web && (
                <a href={l.web} rel="noopener nofollow" className={`btn button-md ${l.phone?.length ? "btn-quiet" : "btn-filled"}`}>
                  <Globe /> {ACTIONS.website}
                </a>
              )}
              {placed && (
                <a href={directionsHref(l.lat!, l.lon!)} rel="noopener" className="btn btn-quiet button-md">
                  <Pin /> {ACTIONS.directions}
                </a>
              )}
            </p>
          )}
          <p className="biz-acts biz-acts-pair mt-3 empty:hidden">
            <SaveButton id={l.id} name={l.name} words />
            <ShareButton title={l.name} words />
          </p>
            </div>
          </header>

          {mapped && (
            <p className={`caption-1 mt-4 max-w-prose ${stale ? "note" : "text-ink-faint"}`}>
              {stale
                ? `These details are as the map recorded them, and were last edited there in ${mapped}, ${yearsSince(l.src.edited) >= 3 ? `${Math.floor(yearsSince(l.src.edited))} years ago` : "over two years ago"}. Check before you rely on them.`
                : `As recorded on the map, last edited there in ${mapped}.`}
            </p>
          )}
          {bare && (
            <p className="body-3 mt-4 max-w-prose text-ink-subtle">
              No telephone number or website is recorded for it. If you know them, <Link href={`/add?listing=${l.id}`}>add them</Link>.
            </p>
          )}

          {l.about && (
            <div className="mt-8">
              <p className="body-2 measure">{l.about}</p>
              <p className="caption-1 mt-2 text-ink-faint">In the words of {aboutFrom}.</p>
            </div>
          )}

          <dl className="facts body-3 mt-8">
            {(l.street || l.place) && (
              <>
                <dt>Address</dt>
                <dd>{[l.street, l.area, l.place, l.postcode, l.district && l.district !== l.place ? `${l.district} district` : null].filter(Boolean).join(", ")}</dd>
              </>
            )}
            {l.phone?.length ? (
              <>
                <dt>Telephone</dt>
                <dd className="data-1">
                  {l.phone.map((p, i) => (
                    <span key={p}>
                      {i > 0 && ", "}
                      <a href={telHref(p)} className="inline-flex min-h-11 items-center whitespace-nowrap">
                        {p}
                      </a>
                    </span>
                  ))}
                  {l.phoneFrom === "site" && <span className="caption-1 block font-sans text-ink-faint">From its own website.</span>}
                </dd>
              </>
            ) : null}
            {l.web && (
              <>
                <dt>Website</dt>
                <dd>
                  <a href={l.web} rel="noopener nofollow" className="data-1 break-all">
                    {shortUrl(l.web)}
                  </a>
                  {l.site?.gone && <span className="caption-1 block text-ink-faint">When our crawler tried this address on {day(l.site.checked)}, the site answered that the page was not there.</span>}
                </dd>
              </>
            )}
            {l.hours && (
              <>
                <dt>Opening hours</dt>
                <dd>
                  {hoursLines(l.hours).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {mapped && <span className="caption-1 block text-ink-faint">As mapped, {mapped}.</span>}
                </dd>
              </>
            )}
            {l.social && Object.keys(l.social).length > 0 && (
              <>
                <dt>Elsewhere</dt>
                <dd className="flex flex-wrap gap-x-4">
                  {Object.entries(l.social).map(([name, href]) => (
                    <a key={name} href={href} rel="noopener nofollow">
                      {SOCIAL_NAMES[name] ?? name}
                    </a>
                  ))}
                </dd>
              </>
            )}
            {l.alt?.length ? (
              <>
                <dt>Also known as</dt>
                <dd>{l.alt.join(", ")}</dd>
              </>
            ) : null}
            {l.extras?.length ? (
              <>
                <dt>Good to know</dt>
                <dd>{l.extras.join(", ")}</dd>
              </>
            ) : null}
            {l.stars ? (
              <>
                <dt>Stars</dt>
                <dd>{l.stars}, as recorded on the map</dd>
              </>
            ) : null}
            {l.since ? (
              <>
                <dt>Since</dt>
                <dd className="data-1">{l.since}</dd>
              </>
            ) : null}
            {l.exchange && (
              <>
                <dt>Listed on</dt>
                <dd>{l.exchange}</dd>
              </>
            )}
            {l.seat && !l.place && (
              <>
                <dt>Head office</dt>
                <dd>{l.seat}</dd>
              </>
            )}
            {placed && (
              <>
                <dt>Position</dt>
                <dd>
                  <a href={mapHref(l.lat!, l.lon!)} rel="noopener" className="data-1">
                    {degrees(l.lat!, "lat")} {degrees(l.lon!, "lon")}
                  </a>
                </dd>
              </>
            )}
          </dl>

          {/* Where every part of the listing came from: the promise the whole index makes. */}
          <section aria-labelledby="from" className="mt-10">
            <h2 id="from" className="heading-3">
              Where this comes from
            </h2>
            <ul className="body-3 mt-3 grid max-w-prose gap-2 text-ink-subtle">
              {l.src.osm && (
                <li>
                  Its name, place and contact details are from{" "}
                  <a href={osmHref(l.src.osm)} rel="noopener">
                    OpenStreetMap ({l.src.osm.replace("/", " ")})
                  </a>
                  {l.src.edited ? `, last edited there on ${day(l.src.edited)}` : ""}. © <a href={CREDITS.osm.href}>{CREDITS.osm.label}</a>.
                </li>
              )}
              {l.src.wikidata && (
                <li>
                  {l.src.osm ? "Company facts are" : "This entry is"} from{" "}
                  <a href={wikidataHref(l.src.wikidata)} rel="noopener">
                    Wikidata ({l.src.wikidata})
                  </a>
                  .
                </li>
              )}
              {l.src.site && <li>Its website was read by our crawler on {day(l.src.site.checked)}.</li>}
              <li>
                Being listed here does not say a business is registered or licensed. <Link href="/tools/verify">The official registers</Link> do.
              </li>
              <li>
                Nobody at biznes.mu has visited or vetted this business. If you run it, or know it has changed,{" "}
                <Link href={`/add?listing=${l.id}`}>tell us what to correct</Link>. To have it taken out, use the same form.
              </li>
            </ul>
          </section>
        </div>

        {placed && l.region !== "outer" && (
          <aside className="chart:col-span-5">
            <div className="mx-auto max-w-md chart:sticky chart:top-24">
              <Chart focus={l} says={`A chart of Mauritius marking where ${l.name} is${where ? `, in ${where}` : ""}.`} />
              <p className="caption-1 mt-3 text-ink-faint">The mark is {l.name}. The points are everything else listed.</p>
            </div>
          </aside>
        )}
      </div>

      {near.length > 0 && category && (
        <section aria-labelledby="near" className="mt-16 max-w-3xl">
          <h2 id="near" className="heading-2">
            {category.label} nearby
          </h2>
          <ul className="rows mt-6">
            {near.map(({ o, d }) => (
              <li key={o.id}>
                <ListingRow listing={o} note={`${distance(d)} away`} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
