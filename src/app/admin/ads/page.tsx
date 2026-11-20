import type { Metadata } from "next";
import { Reach, type Owner } from "@/components/account/AdminBits";
import AdminNav from "@/components/account/AdminNav";
import AdSlot, { AdCard } from "@/components/account/AdSlot";
import { Empty, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import { Megaphone } from "@/components/account/Icons";
import { Chevron } from "@/components/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { adFor, placePrice } from "@/lib/accounts/ads";
import { accountsOn, mediaUrl } from "@/lib/accounts/config";
import { freshUrl } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { AD_PLACES, AD_STATE_NAMES, adPlace, adState, monthAfter, monthName, monthNames, rupees, soundAd, thisMonth, type Ad, type Business } from "@/lib/accounts/types";
import { count, day, shortUrl } from "@/lib/format";
import { removeAdPicture, reviewAd, setAdPaid } from "../actions";

export const metadata: Metadata = { title: "Advertisements", robots: { index: false, follow: false } };

/** The places on the site an advertisement can be shown in. */
const ON_SITE = ["home", "results", "listing", "food", "article", "directory"] as const;

function costOf(ad: Pick<Ad, "place" | "months">): string {
  const price = placePrice(ad.place);
  if (price == null) return "Price on request";
  return ad.months.length > 1 ? `${rupees(price)} a month, ${rupees(price * ad.months.length)} in all` : rupees(price);
}

export default async function AdminAdsPage() {
  if (!accountsOn) return <AccountsSoon title="Advertisements" />;
  const viewer = await requireAdmin("/admin/ads");
  const supabase = await db();
  const { data: rows } = await supabase.from("ads").select("*").neq("status", "draft").order("updated_at", { ascending: false }).limit(200);
  const ads = ((rows ?? []) as Ad[]).map(soundAd);
  const ids = [...new Set(ads.map((a) => a.business_id))];
  const { data: businessRows } = ids.length ? await supabase.from("businesses").select("id, name, slug, website, owner_id, status").in("id", ids) : { data: [] };
  const businesses = new Map(((businessRows ?? []) as Pick<Business, "id" | "name" | "slug" | "website" | "owner_id" | "status">[]).map((b) => [b.id, b]));
  const people = [...new Set([...businesses.values()].map((b) => b.owner_id))];
  const { data: ownerRows } = people.length ? await supabase.from("profiles").select("id, name, email, phone").in("id", people) : { data: [] };
  const owners = new Map(((ownerRows ?? []) as Owner[]).map((o) => [o.id, o]));

  const month = thisMonth();
  const next = monthAfter(month);
  const toCheck = ads.filter((a) => a.status === "submitted").sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const approved = ads.filter((a) => a.status === "approved");
  const unpaid = approved.filter((a) => !a.paid && adState(a, month) !== "ended");
  const running = approved.filter((a) => adState(a, month) === "running");
  const pagesNext = approved.filter((a) => a.place === "guide-page" && a.months.includes(next)).length;
  const others = ads.filter((a) => a.status !== "submitted");
  // What a visitor is shown in each place today: the same read the public pages make.
  const showing = await Promise.all(ON_SITE.map((place) => adFor(place)));

  /** Where an advertisement leads: the address it was approved with, or, while it waits, the one it would be approved with now. */
  const leadsTo = (ad: Ad) => {
    const b = businesses.get(ad.business_id);
    const website = ad.status === "approved" ? (ad.link_url ?? "") : ad.link_to === "website" ? (b?.website ?? "") : "";
    return /^https?:\/\//i.test(website) ? website : "";
  };
  const preview = (ad: Ad) => {
    const b = businesses.get(ad.business_id);
    const website = leadsTo(ad);
    // The picture is asked for afresh whenever the row has changed, so a new file under an old name is never shown from a cache.
    return { headline: ad.headline, line: ad.line, href: website || (b ? `/biz/${b.slug}` : "/"), external: Boolean(website), by: b?.name ?? "A business", ...(ad.artwork ? { image: freshUrl(mediaUrl(ad.artwork), ad.updated_at) } : {}) };
  };
  const facts = (ad: Ad) => (
    <dl className="facts body-3 mt-4">
      <div className="contents">
        <dt>Where</dt>
        <dd>{adPlace(ad.place)?.name}</dd>
      </div>
      <div className="contents">
        <dt>Months</dt>
        <dd>{monthNames(ad.months)}</dd>
      </div>
      <div className="contents">
        <dt>Price</dt>
        <dd className="data-1">{costOf(ad)}</dd>
      </div>
      <div className="contents">
        <dt>Leads to</dt>
        <dd>
          {leadsTo(ad) ? (
            <>
              Their own website,{" "}
              <a href={leadsTo(ad)} rel="noopener nofollow" className="data-1 break-all">
                {shortUrl(leadsTo(ad))}
              </a>
              . Approving fixes this address: a later change to the business does not move it.
            </>
          ) : ad.link_to === "website" ? (
            "Their page on biznes.mu: they chose their own website, and the business has none."
          ) : (
            "Their page on biznes.mu"
          )}
        </dd>
      </div>
      <div className="contents">
        <dt>Owner</dt>
        <dd>
          <Reach owner={owners.get(businesses.get(ad.business_id)?.owner_id ?? "")} />
        </dd>
      </div>
    </dl>
  );

  return (
    <>
      <PageHead title="Advertisements" path={[{ href: "/admin", label: "Admin" }, { label: "Advertisements" }]} lede="What owners have sent in. Check each one, arrange payment with its owner, then mark it paid: an approved, paid advertisement shows in its place for the months it names, and nothing else does." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/ads" />
        <Stats>
          <Stat label="To check" figure={count(toCheck.length)} href="#queue" />
          <Stat label="Approved, not yet paid" figure={count(unpaid.length)} href="#all" />
          <Stat label="Running now" figure={count(running.length)} href="#today" />
          <Stat label={`Guide pages, ${monthName(next)}`} figure={`${pagesNext} of 4`} note="An edition carries four sponsored pages at most." />
        </Stats>

        <section aria-labelledby="queue" className="mt-12 scroll-mt-24">
          <PartHead id="queue" title="To check" line="The oldest first. Approving promises nothing about payment: the advertisement runs only once it is also marked paid." />
          {toCheck.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Megaphone />} title="Nothing to check">
                When an owner sends an advertisement in, it waits here.
              </Empty>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {toCheck.map((ad) => (
                <li key={ad.id}>
                  <article className="card grid gap-x-10 gap-y-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <p className="caption-1 text-ink-faint">Sent in {day(ad.updated_at.slice(0, 10))}</p>
                      <h3 className="title-1 mt-1">{businesses.get(ad.business_id)?.name ?? "A business"}</h3>
                      <div className="mt-4">
                        <AdCard ad={preview(ad)} />
                      </div>
                      {facts(ad)}
                    </div>
                    <div className="lg:col-span-5">
                      <ActionForm action={reviewAd} className="grid gap-4">
                        <input type="hidden" name="ad" value={ad.id} />
                        {/* The stamp of the row as it is shown here. Approval is refused if the row has been written since. */}
                        <input type="hidden" name="seen" value={ad.updated_at} />
                        <Field name="reason" label="If you decline it, why" hint="One line. The owner is shown it, and can change the advertisement and send it again." />
                        <div className="flex flex-wrap gap-3">
                          <Submit name="answer" value="approve" busy="Approving">
                            Approve
                          </Submit>
                          <Submit name="answer" value="decline" className="btn btn-quiet button-md" busy="Declining">
                            Decline
                          </Submit>
                        </div>
                      </ActionForm>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="all" className="mt-12 scroll-mt-24">
          <PartHead id="all" title="Checked" line="Every advertisement that has been approved or declined. Mark one paid when its owner has paid you; mark it not paid to take it down." />
          {others.length === 0 ? (
            <p className="body-2 mt-4 text-ink-subtle">None yet.</p>
          ) : (
            <ul className="rows mt-6">
              {others.map((ad) => {
                const state = adState(ad, month);
                return (
                  <li key={ad.id}>
                    <article className="row listing">
                      <span className="listing-icon listing-icon-quiet" aria-hidden>
                        <Megaphone />
                      </span>
                      <div className="min-w-0">
                        <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                          <span className={`tag ${state === "running" ? "tag-lit" : ""}`}>{AD_STATE_NAMES[state]}</span>
                          {ad.status === "approved" && <span className="tag">{ad.paid ? "Paid" : "Not yet paid"}</span>}
                          <span>{adPlace(ad.place)?.name}</span>
                        </p>
                        <h3 className="title-1 mt-2">{ad.headline}</h3>
                        <p className="body-3 mt-0.5 text-ink-subtle">
                          {businesses.get(ad.business_id)?.name ?? "A business"} · {monthNames(ad.months)} · {costOf(ad)}
                        </p>
                        {ad.status === "declined" && ad.reason && <p className="body-3 mt-2 max-w-prose">Why: {ad.reason}</p>}
                        <p className="body-3 mt-2 text-ink-subtle">
                          <Reach owner={owners.get(businesses.get(ad.business_id)?.owner_id ?? "")} />
                        </p>
                        {ad.artwork && (
                          <details className="mt-1">
                            <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                              Its picture<span className="sr-only">: {ad.headline}</span> <Chevron className="size-4" />
                            </summary>
                            <div className="mt-2 grid max-w-md gap-4">
                              <img src={freshUrl(mediaUrl(ad.artwork), ad.updated_at)} alt="" className="thumb thumb-wide" loading="lazy" decoding="async" />
                              <ActionForm action={removeAdPicture} className="grid gap-3">
                                <input type="hidden" name="ad" value={ad.id} />
                                <Field name="why" label="Why the picture is removed" hint={ad.status === "approved" ? "One line. The advertisement comes down, and its owner is shown this." : "One line. The owner is shown it."} />
                                <div>
                                  <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                                    Remove its picture<span className="sr-only">: {ad.headline}</span>
                                  </Submit>
                                </div>
                              </ActionForm>
                            </div>
                          </details>
                        )}
                      </div>
                      {ad.status === "approved" && state !== "ended" && (
                        <ActionForm action={setAdPaid} className="grid justify-items-end gap-2 self-center" quiet>
                          <input type="hidden" name="ad" value={ad.id} />
                          <input type="hidden" name="paid" value={ad.paid ? "no" : "yes"} />
                          <Submit className={ad.paid ? "btn btn-quiet btn-sm button-sm" : "btn btn-ink btn-sm button-sm"}>
                            {ad.paid ? "Mark not paid" : "Mark paid"}
                            <span className="sr-only">: {ad.headline}</span>
                          </Submit>
                        </ActionForm>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="today" className="mt-12 scroll-mt-24">
          <PartHead id="today" title="Showing today" line="Each place on the site as a visitor has it today. A place holds one advertisement at a time: when several run in a month, each takes its turn by the day." />
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {ON_SITE.map((place, i) => {
              const turns = running.filter((a) => a.place === place).length;
              return (
                <li key={place} data-place={place} className="card card-panel">
                  <p className="caption-1 flex flex-wrap items-center justify-between gap-2 text-ink-faint">
                    <span className="title-2 text-ink">{AD_PLACES.find((p) => p.id === place)?.name}</span>
                    <span>{turns > 1 ? `${turns} taking turns` : turns === 1 ? "One running" : "Empty"}</span>
                  </p>
                  <div className="mt-3">{showing[i] ? <AdSlot place={place} /> : <p className="body-3 text-ink-subtle">Nothing is running here this month.</p>}</div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
