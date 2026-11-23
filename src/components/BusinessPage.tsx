import Link from "next/link";
import AdSlot from "@/components/account/AdSlot";
import ListingClaim from "@/components/account/Claim";
import OwnedExtras from "@/components/account/OwnedExtras";
import { ACTIONS, CREDITS, site } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import type { Owned } from "@/lib/accounts/owned";
import type { Showcase } from "@/lib/accounts/showcase";
import { rupees } from "@/lib/accounts/types";
import { chartPoints, degrees } from "@/lib/chart";
import { day, directionsHref, directionsToHref, distance, hoursByDay, hoursLines, mapHref, month, osmHref, shortUrl, spanWords, telHref, wikidataHref, yearsSince } from "@/lib/format";
import { index, whereOf, type Listing } from "@/lib/index";
import { breadcrumbs, schemaType, servesFood } from "@/lib/schema";
import { siteUrl } from "@/lib/site-url";
import { todayInMauritius } from "@/lib/theme";
import { Crumbs } from "./Bits";
import Chart from "./Chart";
import { CategoryIcon } from "./Glyphs";
import { Arrow, Clock, Fork, Globe, Info, Phone, Pin, Route } from "./Icons";
import JsonLd from "./JsonLd";
import MapSwitch from "./MapSwitch";
import { ListingRow } from "./Rows";
import { SaveButton, ShareButton } from "./Save";
import { VerifiedMark } from "./Verified";

const SOCIAL_NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", tiktok: "TikTok" };

/** A block of what is known: a small heading with its icon, and the facts under it. */
function Block({ id, icon, title, children, wide = false }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section aria-labelledby={id} className={wide ? "known sm:col-span-2" : "known"}>
      <h2 id={id} className="known-head title-2">
        <span aria-hidden>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A business's page: the one page for a listing from the open index (`listing`, with `owned` when
 * its owner has claimed it) and for a business its owner listed outside the index (`owned` alone).
 *
 * A free or unclaimed listing is a calm page a person on a phone can act on at once: call, be
 * taken there, open the website. What is known is laid out in blocks (how to reach it, where it
 * is, when it is open, what it says of itself), each saying where it came from, with a plain card
 * for its owner to claim it. A business on a paid plan has the same blocks and more above them:
 * its own picture across the top, its line, its pictures, its menu if it serves food, and on
 * Biznes Grow its services and the way to ask for a booking. The vivid mark and the saffron ring
 * are for a verified business on a paid plan and nothing else. No advertisement is shown on a
 * paid page.
 *
 * Nothing is made up for a business: a block with nothing to show is not drawn.
 */
export default function BusinessPage({
  listing: l,
  owned: o,
  showcase,
  preview = false,
  within,
}: {
  listing?: Listing;
  owned?: Owned;
  /**
   * Drawn inside a section of the site (Baz Manzer): the path at the page's head, where another
   * listing's page is inside the section, and where "all of this kind in this town" is. The
   * page's one address for a search engine does not change with it.
   */
  within?: { path: { href?: string; label: string }[]; listing: (l: Listing) => string; all?: string };
  /** What a paid plan adds: pictures, a line, a menu. Absent with accounts off, and for a business with none. */
  showcase?: Showcase;
  /** True on the design's own preview page: the content is made up, and the page says so. */
  preview?: boolean;
}) {
  if (!l && !o) return null;
  const data = index();
  const name = l?.name ?? o!.name;
  const path = l ? `/b/${l.slug}` : o!.path;
  const category = data.categoryById.get(l?.cat ?? o!.category);
  const town = o ? data.placeBySlug.get(o.town) : undefined;
  const where = l ? whereOf(l) : (town?.name ?? "");
  const paid = Boolean(o?.paid);
  // Pictures, a line of its own and a menu are a paid plan's, for as long as the plan runs.
  const rich = o && o.plan !== "free" ? showcase : undefined;
  const menu = rich?.menu?.filter((section) => section.items.length > 0) ?? [];
  const photos = rich?.photos ?? [];
  // An owner's own number and website are newer than the map's, so the buttons use them.
  const phone = o?.phone || l?.phone?.[0];
  const web = o?.website || l?.web;
  const placed = l != null && l.lat != null && l.lon != null;
  const address = l
    ? [l.street, l.area, l.place, l.postcode, l.district && l.district !== l.place ? `${l.district} district` : null].filter(Boolean).join(", ")
    : [o!.address, town?.name, town?.district && town.district !== town.name ? `${town.district} district` : null].filter(Boolean).join(", ");
  const way = placed ? directionsHref(l.lat!, l.lon!) : o && (o.address || town) ? directionsToHref([o.name, o.address, town?.name, "Mauritius"].filter(Boolean).join(", ")) : undefined;
  const what = [l?.kind && category?.id !== "companies" ? `${category?.one}, ${l.kind}` : (l?.kind ?? category?.one), where].filter(Boolean).join(" · ");

  // Hours: the owner's own words when they have given them, else the map's, read day by day.
  const said = showcase?.hours?.filter(Boolean) ?? [];
  const mapped = !said.length && l?.hours ? hoursByDay(l.hours) : null;
  const today = (new Date(`${todayInMauritius()}T00:00:00Z`).getUTCDay() + 6) % 7;
  const now = mapped?.days[today];
  const edited = l?.src.osm && l.src.edited ? month(l.src.edited) : "";
  const stale = yearsSince(l?.src.edited) > 2;
  const bare = !phone && !web;

  const near =
    placed && category
      ? data.listings
          .filter((other) => other.id !== l.id && other.cat === l.cat && other.lat != null && other.region === l.region)
          .map((other) => ({ other, d: Math.hypot((other.lon! - l.lon!) * 104, (other.lat! - l.lat!) * 111) }))
          // "Nearby" means within eight kilometres: farther than that is another town.
          .filter(({ d }) => d <= 8)
          .sort((a, b) => a.d - b.d)
          .slice(0, 5)
      : [];
  const point = l ? chartPoints().at.get(l.id) : undefined;
  const onIsland = placed && l.region !== "outer";
  const aboutFrom = l?.aboutFrom === "site" ? "its own website" : l?.aboutFrom === "wikidata" ? "Wikidata" : "OpenStreetMap";
  const about = l?.about ?? (l ? undefined : o?.about);
  const more = l && (l.alt?.length || l.extras?.length || l.stars || l.since || l.exchange || (l.seat && !l.place));
  const crumbs = within
    ? [...within.path, { label: name }]
    : [
        { href: "/directory", label: "Directory" },
        ...(category ? [{ href: `/directory/${category.id}`, label: category.label }] : []),
        ...(category && l?.placeSlug ? [{ href: `/directory/${category.id}/${l.placeSlug}`, label: l.place! }] : []),
        { label: name },
      ];
  const absolute = (src: string) => (src.startsWith("/") ? `${siteUrl}${src}` : src);
  const food = servesFood(category?.id);

  // A business with no place on the island has no map to show at the side: there the side of a
  // wide page holds the blocks of what is known, and stays in view beside its pictures and menu.
  const side = !onIsland && Boolean(o);
  const two = onIsland || side;
  // What is known, in blocks: how to reach it, where it is, when it is open, what it says of itself.
  const blocks = (
    <div className={side ? "known-grid known-grid-one" : "known-grid mt-8"}>
      <Block id="reach" icon={<Phone />} title="Contact">
        {l?.phone?.length || l?.web || (o && !l && (o.phone || o.website)) ? (
          <dl className="known-facts body-3">
            {(l ? (l.phone ?? []) : o!.phone ? [o!.phone] : []).length > 0 && (
              <div>
                <dt>Telephone</dt>
                <dd className="data-1">
                  {(l ? (l.phone ?? []) : [o!.phone]).map((p, i) => (
                    <span key={p}>
                      {i > 0 && ", "}
                      <a href={telHref(p)} className="inline-flex min-h-11 items-center whitespace-nowrap">
                        {p}
                      </a>
                    </span>
                  ))}
                  {l?.phoneFrom === "site" && <span className="caption-1 block font-normal text-ink-faint">From its own website.</span>}
                </dd>
              </div>
            )}
            {(l ? l.web : o!.website) && (
              <div>
                <dt>Website</dt>
                <dd>
                  <a href={l ? l.web : o!.website} rel="noopener nofollow" className="data-1 inline-flex min-h-11 items-center break-all">
                    {shortUrl((l ? l.web : o!.website)!)}
                  </a>
                  {l?.site?.gone && <span className="caption-1 block text-ink-faint">When our crawler tried this address on {day(l.site.checked)}, the site answered that the page was not there.</span>}
                </dd>
              </div>
            )}
            {l?.social && Object.keys(l.social).length > 0 && (
              <div>
                <dt>Elsewhere</dt>
                <dd className="flex flex-wrap gap-x-4">
                  {Object.entries(l.social).map(([network, href]) => (
                    <a key={network} href={href} rel="noopener nofollow" className="inline-flex min-h-11 items-center">
                      {SOCIAL_NAMES[network] ?? network}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="body-3 text-ink-subtle">
            No telephone number or website is recorded for it.{l ? " If you know them, " : ""}
            {l && <Link href={`/add?listing=${l.id}`}>add them</Link>}
            {l ? "." : ""}
          </p>
        )}
        {l && o && (o.phone || o.website) && <p className="caption-1 mt-2 text-ink-faint">As the map records them. The owner&rsquo;s own, which are newer, are further down.</p>}
      </Block>

      {(address || placed) && (
        <Block id="where" icon={<Pin />} title="Where">
          <dl className="known-facts body-3">
            {address && (
              <div>
                <dt>Address</dt>
                <dd>{address}</dd>
              </div>
            )}
            {placed && (
              <div>
                <dt>Position</dt>
                <dd>
                  <a href={mapHref(l.lat!, l.lon!)} rel="noopener" className="data-1 inline-flex min-h-11 items-center">
                    {degrees(l.lat!, "lat")} {degrees(l.lon!, "lon")}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {/* On a phone the street map opens here, beside the address: the card above already shows the neighbourhood. A wide screen has the island and the map at the side. */}
          {onIsland && (
            <div className="mt-3 chart:hidden">
              <MapSwitch focus={{ lon: l.lon!, lat: l.lat!, name }} back="Close the street map" />
            </div>
          )}
        </Block>
      )}

      {(said.length > 0 || l?.hours) && (
        <Block id="hours" icon={<Clock />} title="Opening hours">
          {said.length > 0 ? (
            <ul className="hours body-3">
              {said.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : mapped ? (
            <dl className="hours body-3">
              {mapped.days.map((d, i) => (
                <div key={d.code} data-today={i === today || undefined}>
                  <dt>
                    {d.day}
                    {i === today && <span className="sr-only"> (today)</span>}
                  </dt>
                  <dd className={d.spans.length ? "data-1" : "text-ink-faint"}>{d.closed ? "Closed" : d.spans.length ? d.spans.map(spanWords).join(" and ") : "Not recorded"}</dd>
                </div>
              ))}
              {mapped.holidays && (
                <div>
                  <dt>Public holidays</dt>
                  <dd className="data-1">{mapped.holidays === "closed" ? "Closed" : mapped.holidays}</dd>
                </div>
              )}
            </dl>
          ) : (
            <ul className="hours body-3">
              {hoursLines(l!.hours!).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <p className="caption-1 mt-2 text-ink-faint">{said.length > 0 ? "In the words of the business." : edited ? `As mapped, ${edited}. Ring before a special trip.` : "As recorded on the map."}</p>
        </Block>
      )}

      {(about || more) && (
        <Block id="about" icon={<Info />} title="About" wide={Boolean(about && about.length > 160)}>
          {about && (
            <>
              <p className="body-2 measure whitespace-pre-line">{about}</p>
              <p className="caption-1 mt-2 text-ink-faint">{l ? `In the words of ${aboutFrom}.` : "In the words of the business."}</p>
            </>
          )}
          {more && l && (
            <dl className={`known-facts body-3 ${about ? "mt-4" : ""}`}>
              {l.alt?.length ? (
                <div>
                  <dt>Also known as</dt>
                  <dd>{l.alt.join(", ")}</dd>
                </div>
              ) : null}
              {l.extras?.length ? (
                <div>
                  <dt>Good to know</dt>
                  <dd className="flex flex-wrap gap-2 pt-1">
                    {l.extras.map((extra) => (
                      <span key={extra} className="tag caption-1">
                        {extra}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {l.stars ? (
                <div>
                  <dt>Stars</dt>
                  <dd>{l.stars}, as recorded on the map</dd>
                </div>
              ) : null}
              {l.since ? (
                <div>
                  <dt>Since</dt>
                  <dd className="data-1">{l.since}</dd>
                </div>
              ) : null}
              {l.exchange && (
                <div>
                  <dt>Listed on</dt>
                  <dd>{l.exchange}</dd>
                </div>
              )}
              {l.seat && !l.place && (
                <div>
                  <dt>Head office</dt>
                  <dd>{l.seat}</dd>
                </div>
              )}
            </dl>
          )}
        </Block>
      )}
    </div>
  );

  return (
    <article className="shell pt-8 pb-8 lg:pt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": l && !l.src.osm ? "Organization" : schemaType(category?.id),
          name,
          url: `${siteUrl}${path}`,
          ...(about ? { description: about } : {}),
          ...(phone ? { telephone: phone } : {}),
          ...(web || l?.social || l?.wikidata ? { sameAs: [...(web ? [web] : []), ...Object.values(l?.social ?? {}), ...(l?.wikidata ? [wikidataHref(l.wikidata)] : [])] } : {}),
          ...(address
            ? {
                address: {
                  "@type": "PostalAddress",
                  ...((l?.street ?? o?.address) ? { streetAddress: l?.street ?? o?.address } : {}),
                  ...((l?.place ?? town?.name) ? { addressLocality: l?.place ?? town?.name } : {}),
                  ...(l?.postcode ? { postalCode: l.postcode } : {}),
                  addressCountry: "MU",
                },
              }
            : {}),
          ...(placed ? { geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lon } } : {}),
          ...(mapped ? { openingHours: mapped.days.flatMap((d) => d.spans.map((span) => `${d.code} ${span}`)) } : {}),
          ...(rich?.cover || photos.length ? { image: [...(rich?.cover ? [rich.cover] : []), ...photos].map(absolute) } : {}),
          ...(food && menu.length
            ? {
                hasMenu: {
                  "@type": "Menu",
                  hasMenuSection: menu.map((section) => ({
                    "@type": "MenuSection",
                    name: section.title,
                    hasMenuItem: section.items.map((item) => ({ "@type": "MenuItem", name: item.name, ...(item.description ? { description: item.description } : {}), ...(item.price != null ? { offers: { "@type": "Offer", price: item.price, priceCurrency: "MUR" } } : {}) })),
                  })),
                },
              }
            : {}),
        }}
      />
      <JsonLd data={breadcrumbs([{ href: "/", label: "Home" }, ...crumbs], path)} />
      <Crumbs path={crumbs} />
      {preview && (
        <p className="note body-3 mt-4" role="note">
          A preview of the design, with made-up content. This is not a real business, and nothing here is a real menu, price or picture of one.
        </p>
      )}

      {/* On a wide screen: the card and, under it, the rest on the left; the island (or, with no place on it, the blocks) on the right, staying in view. On a phone, one after the other in that order. */}
      <div className={two ? "mt-6 grid gap-x-12 chart:grid-cols-12 chart:grid-rows-[auto_1fr]" : "mt-6 max-w-3xl"}>
        <div className={two ? "chart:col-span-7" : undefined}>
          <header className={paid ? "biz-head biz-paid" : "biz-head"}>
            {/* The top of the card: on a paid plan the business's own picture; otherwise the map, drawn in on where it is, among its neighbours. */}
            {rich?.cover ? (
              <div className="biz-cover biz-cover-photo">
                <img src={rich.cover} alt={`${name}, in a picture of its own.`} />
              </div>
            ) : point != null ? (
              <div className="biz-cover">
                <Chart lit={[point]} focus={l} zoom span={96} says={`A map of the streets around ${name}, with the other listings near it.`} />
              </div>
            ) : (
              <div className="biz-cover biz-cover-plain" aria-hidden />
            )}
            <div className="biz-body">
              <span className="biz-icon" aria-hidden>
                <CategoryIcon id={category?.id} group={category?.group} />
              </span>
              <h1 className="heading-1 mt-4">{name}</h1>
              {/* The vivid mark is for a verified business on a paid plan, and for nothing else. */}
              {o && <p className="mt-3">{paid ? <VerifiedMark size="lg" priority /> : <span className="tag caption-1">{l ? "Claimed by its owner" : "Listed by its owner"}</span>}</p>}
              {rich?.tagline && <p className="biz-tagline body-1 mt-3">{rich.tagline}</p>}
              <p className={`${rich?.tagline ? "body-2 mt-1" : "body-1 mt-3"} text-ink-subtle`}>{what}</p>
              {now && (now.closed || now.spans.length > 0) && (
                <p className="body-3 mt-2 flex items-center gap-2 text-ink-subtle">
                  <Clock className="size-4 flex-none" />
                  <span>
                    {now.day}: {now.closed ? "closed" : now.spans.map(spanWords).join(" and ")}
                    {edited ? <span className="text-ink-faint">, as mapped in {edited}</span> : null}
                  </span>
                </p>
              )}

              {(phone || web || way || o?.books) && (
                <p className="biz-acts mt-6">
                  {phone && (
                    <a href={telHref(phone)} className="btn btn-filled button-md">
                      <Phone /> {ACTIONS.call} <span className="data-1">{phone}</span>
                    </a>
                  )}
                  {way && (
                    <a href={way} rel="noopener" className={`btn button-md ${!phone && !web ? "btn-filled" : "btn-quiet"}`}>
                      <Route /> {ACTIONS.directions}
                    </a>
                  )}
                  {web && (
                    <a href={web} rel="noopener nofollow" className={`btn button-md ${phone ? "btn-quiet" : "btn-filled"}`}>
                      <Globe /> {ACTIONS.website}
                    </a>
                  )}
                  {o?.books && (
                    <a href="#book" className="btn btn-ink button-md">
                      {ACTIONS.book}
                    </a>
                  )}
                </p>
              )}
              {/* Saving and sharing need the page's script. Their room is kept, so the card does not grow when they come. */}
              <p className="biz-acts biz-acts-pair mt-3 min-h-11">
                {/* The shortlist holds listings of the open index, so only those can be saved. */}
                {l && <SaveButton id={l.id} name={name} words />}
                <ShareButton title={name} words />
              </p>
            </div>
          </header>

          {edited && (
            <p className={`caption-1 mt-4 max-w-prose ${stale ? "note" : "text-ink-faint"}`}>
              {stale
                ? `These details are as the map recorded them, and were last edited there in ${edited}, ${yearsSince(l!.src.edited) >= 3 ? `${Math.floor(yearsSince(l!.src.edited))} years ago` : "over two years ago"}. Check before you rely on them.`
                : `As recorded on the map, last edited there in ${edited}.`}
            </p>
          )}
        </div>

        {onIsland && (
          <aside className="hidden chart:col-span-5 chart:row-span-2 chart:block">
            <div className="mx-auto max-w-md chart:sticky chart:top-24">
              <MapSwitch focus={{ lon: l.lon!, lat: l.lat!, name }}>
                <Chart focus={l} says={`A chart of Mauritius marking where ${name} is${where ? `, in ${where}` : ""}.`} />
                <p className="caption-1 mt-3 text-ink-faint">The mark is {name}. The points are everything else listed.</p>
              </MapSwitch>
            </div>
          </aside>
        )}
        {side && (
          <aside aria-label={`${name}: contact, where and hours`} className="mt-8 chart:col-span-5 chart:row-span-2 chart:mt-0">
            <div className="chart:sticky chart:top-24">{blocks}</div>
          </aside>
        )}

        <div className={two ? "chart:col-span-7" : undefined}>
          {/* A paid plan's own: pictures, and for a place that serves food, its menu. */}
          {photos.length > 0 && (
            <section aria-labelledby="pictures" className="mt-10">
              <h2 id="pictures" className="heading-2">
                Pictures
              </h2>
              <ul className={`biz-gallery mt-4 ${photos.length === 1 ? "biz-gallery-one" : ""}`} aria-label={`${photos.length} pictures from ${name}`}>
                {photos.map((src, i) => (
                  <li key={src}>
                    <a href={src}>
                      <img src={src} alt={`A picture from ${name}, ${i + 1} of ${photos.length}.`} loading="lazy" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="caption-1 mt-3 text-ink-faint">The pictures are the business&rsquo;s own.</p>
            </section>
          )}

          {menu.length > 0 && (
            <section id="menu" aria-labelledby="menu-h" className="mt-10 scroll-mt-24">
              <h2 id="menu-h" className="heading-2">
                Menu
              </h2>
              <div className="dishes mt-4">
                {menu.map((section) => (
                  <section key={section.title} aria-label={section.title}>
                    <h3 className="label-1 text-ink-faint">{section.title}</h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item.name} className="dish">
                          <div className="min-w-0">
                            <p className="title-2">{item.name}</p>
                            {item.description && <p className="body-3 text-ink-subtle">{item.description}</p>}
                          </div>
                          {item.price != null && <p className="data-1 whitespace-nowrap">{rupees(item.price)}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <p className="caption-1 mt-3 text-ink-faint">The menu and its prices are the business&rsquo;s own, in Mauritian rupees. Ask the business what is on today.</p>
            </section>
          )}

          {!side && blocks}

          {/* What its owner adds, once they have claimed the listing; or, for a business listed by its owner, what Biznes Grow adds. */}
          {l && o && <ListingClaim listing={l} claim={o} />}
          {!l && o && <OwnedExtras business={o} />}

          {/* The way to claim a listing nobody has claimed: plain about what it is and what it costs. */}
          {l && !o && (
            <aside aria-labelledby="claim" className="claim mt-10">
              <div>
                <h2 id="claim" className="heading-3">
                  Is this your business?
                </h2>
                <p className="body-3 mt-1 max-w-prose text-ink-subtle">Claim it free. You say it is yours, a person at {site.name} checks, and from then on its details are your own words and not the map&rsquo;s. The paid plans are there if you want more, and nothing obliges you to take one.</p>
              </div>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link prefetch={false} href={accountsOn ? `/dashboard/new?listing=${l.id}` : `/add?claim=${l.id}`} className="btn btn-ink button-md" rel="nofollow">
                  {ACTIONS.claim}
                  <span className="btn-dot">
                    <Arrow />
                  </span>
                </Link>
                <Link href="/pricing" className="body-3 inline-flex min-h-11 items-center font-semibold text-link">
                  What the plans add
                </Link>
              </p>
            </aside>
          )}
          {/* A quiet word for a business with no website on record. */}
          {!web && !paid && (
            <p className="body-3 mt-4 max-w-prose text-ink-subtle">
              No website on record. {site.builder.name}, who make {site.name},{" "}
              <a href={site.builder.url} rel="noopener">
                build them for Mauritian businesses
              </a>
              .
            </p>
          )}

          {/* A place for an advertisement on a free page, marked as one. A paid page carries none. */}
          {!paid && !preview && <AdSlot place="listing" className="mt-10" />}

          {/* Where every part of the page came from: the promise the whole index makes. */}
          <section aria-labelledby="from" className="mt-10">
            <h2 id="from" className="heading-3">
              Where this comes from
            </h2>
            <ul className="body-3 mt-3 grid max-w-prose gap-2 text-ink-subtle">
              {l?.src.osm && (
                <li>
                  Its name, place and contact details are from{" "}
                  <a href={osmHref(l.src.osm)} rel="noopener">
                    OpenStreetMap ({l.src.osm.replace("/", " ")})
                  </a>
                  {l.src.edited ? `, last edited there on ${day(l.src.edited)}` : ""}. © <a href={CREDITS.osm.href}>{CREDITS.osm.label}</a>.
                </li>
              )}
              {l?.src.wikidata && (
                <li>
                  {l.src.osm ? "Company facts are" : "This entry is"} from{" "}
                  <a href={wikidataHref(l.src.wikidata)} rel="noopener">
                    Wikidata ({l.src.wikidata})
                  </a>
                  .
                </li>
              )}
              {l?.src.site && <li>Its website was read by our crawler on {day(l.src.site.checked)}.</li>}
              {!l && <li>This page was written by the business itself, and a person at {site.name} read it before it went live.</li>}
              {rich && (rich.cover || photos.length > 0 || menu.length > 0) && <li>The pictures{menu.length > 0 ? ", the menu and its prices" : ""} are the business&rsquo;s own.</li>}
              {!l &&
                (paid ? (
                  <li>
                    It is verified: we have checked that the business is real. It is on a paid plan, so it is shown before others that answer a search, and it is marked wherever it is. <Link href="/pricing">What paying changes, and what it does not</Link>.
                  </li>
                ) : (
                  <li>It is not marked verified: nobody at {site.name} has visited or vetted this business.</li>
                ))}
              <li>
                Being listed here does not say a business is registered or licensed. <Link href="/tools/verify">The official registers</Link> do.
              </li>
              {l ? (
                <li>
                  {paid ? "We have checked that this business is real; that is all the verified mark says." : `Nobody at ${site.name} has visited or vetted this business.`} If you run it, or know it has changed, <Link href={`/add?listing=${l.id}`}>tell us what to correct</Link>. To have it taken out, use the same form.
                </li>
              ) : (
                <li>
                  Something wrong on this page? <Link href="/add">Tell us</Link>.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      {near.length > 0 && category && (
        <section aria-labelledby="near" className="mt-16 max-w-3xl">
          <h2 id="near" className="heading-2">
            {category.label} nearby
          </h2>
          <ul className="rows mt-6">
            {near.map(({ other, d }) => (
              <li key={other.id}>
                <ListingRow listing={other} note={`${distance(d)} away`} within={within?.listing(other)} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
            {l?.placeSlug && (
              <Link href={within?.all ?? `/directory/${category.id}/${l.placeSlug}`} className="body-3 inline-flex min-h-11 items-center font-semibold text-link">
                All {category.label.toLowerCase()} in {l.place}
              </Link>
            )}
            {food && (
              <Link href="/baz-manzer" className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                <Fork className="size-4" /> Baz Manzer, every place to eat
              </Link>
            )}
          </p>
        </section>
      )}
    </article>
  );
}
