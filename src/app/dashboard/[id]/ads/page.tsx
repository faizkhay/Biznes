import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/account/AdSlot";
import { Empty, Notice, PartHead } from "@/components/account/Bits";
import { ActionForm, Chips, Field, Select, Submit, Ticks } from "@/components/account/Form";
import { Megaphone } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import UploadForm from "@/components/account/Upload";
import { Chevron } from "@/components/Icons";
import { placePrice } from "@/lib/accounts/ads";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn, mediaUrl } from "@/lib/accounts/config";
import { freshUrl, PICTURE_SAYS, type PictureProblem } from "@/lib/accounts/media";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { AD_PLACES, AD_STATE_NAMES, adPlace, adState, monthAfter, monthName, monthNames, rupees, soundAd, thisMonth, type Ad } from "@/lib/accounts/types";
import { moveAd, saveAd } from "../../ad-actions";

export const metadata: Metadata = { title: "Advertising", robots: { index: false, follow: false } };

const WHERE = [
  { id: "site", label: "On biznes.mu" },
  { id: "guide", label: "In the pocket guide" },
  { id: "magazine", label: "In the magazine" },
] as const;

/** What a place costs, in words: a price a month where the owner has given one, and "Price on request" where not. */
const priceOf = (place: string) => {
  const price = placePrice(place);
  return price == null ? "Price on request" : `${rupees(price)} a month`;
};

/** What an advertisement would come to, for the months it names. */
function costOf(ad: Pick<Ad, "place" | "months">): string {
  const price = placePrice(ad.place);
  if (price == null) return "Price on request";
  return ad.months.length > 1 ? `${rupees(price)} a month, ${rupees(price * ad.months.length)} for ${ad.months.length} months` : `${rupees(price)} for the month`;
}

const NEXT: Record<string, string> = {
  draft: "A draft. Add its picture, then send it in.",
  submitted: "With us. A person checks it, then contacts you about payment.",
  approved: "Approved. It runs in its months once it is marked paid.",
  running: "Running now, in its place.",
  ended: "Its months are over.",
  declined: "Not accepted. Change it and send it in again.",
};

export default async function AdsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ said?: string; problem?: string; at?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b } = await ownBusiness(id);
  if (b.status !== "live") notFound();
  const { said, problem, at } = await searchParams;
  const supabase = await db();
  const [{ data: rows }, shown] = await Promise.all([supabase.from("ads").select("*").eq("business_id", b.id).order("created_at", { ascending: false }).limit(60), owned()]);
  const ads = ((rows ?? []) as Ad[]).map(soundAd);
  const month = thisMonth();
  // The six months to come. Never the one that has begun.
  const coming = [1, 2, 3, 4, 5, 6].map((n) => monthAfter(month, n)).map((m) => ({ value: m, label: monthName(m) }));
  const places = WHERE.map((w) => ({ label: w.label, choices: AD_PLACES.filter((p) => p.where === w.id).map((p) => ({ value: p.id, label: `${p.name} (${priceOf(p.id)})` })) }));
  const page = shown.byId.get(b.id)?.path ?? "/";
  const links = [{ value: "page", label: "Your page on biznes.mu" }, ...(b.website ? [{ value: "website", label: "Your own website" }] : [])];
  const wrong = problem && problem in PICTURE_SAYS ? PICTURE_SAYS[problem as PictureProblem] : undefined;
  /** Where an advertisement leads: once approved, the address it was approved with; until then, the business's own as it is now. */
  const leadsTo = (ad: Ad) => (ad.status === "approved" ? (ad.link_url ?? "") : ad.link_to === "website" ? b.website : "");
  const preview = (ad: Ad) => ({ headline: ad.headline, line: ad.line, href: leadsTo(ad) || page, external: Boolean(leadsTo(ad)), by: b.name, ...(ad.artwork ? { image: freshUrl(mediaUrl(ad.artwork), ad.updated_at) } : {}) });

  const fields = (ad?: Ad) => (
    <>
      <Field name="headline" label="Headline" defaultValue={ad?.headline ?? ""} hint="60 characters at most." />
      <Field name="line" label="A line beneath it" optional defaultValue={ad?.line ?? ""} hint="120 characters at most." />
      <Select name="place" label="Where it runs" groups={places} defaultValue={ad?.place ?? "home"} />
      <Ticks name="months" legend="The months it runs" hint="Months still to come. The one that has begun is closed." choices={coming} defaultValue={ad?.months ?? []} />
      {links.length > 1 ? <Chips name="link_to" legend="Where it leads" choices={links} defaultValue={ad?.link_to ?? "page"} /> : <input type="hidden" name="link_to" value="page" />}
    </>
  );

  return (
    <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <PartHead id="ads" title="Advertising" line="An advertisement of your own, on biznes.mu or in the pocket guide. You make it here, a person checks it and contacts you about payment, and it runs in the months you chose once it is approved and paid. Every one is marked Sponsored." />
        {said === "picture" && <Notice className="mt-6">The picture is on your advertisement.</Notice>}

        {ads.length === 0 ? (
          <div className="mt-8">
            <Empty icon={<Megaphone />} title="No advertisements yet">
              Write a headline, choose where it runs and in which months, and add a picture. Nothing is charged here: we contact you about payment once it is checked.
            </Empty>
          </div>
        ) : (
          <ul className="mt-6 grid gap-6">
            {ads.map((ad) => {
              const state = adState(ad, month);
              const open = ad.status === "draft" || ad.status === "declined";
              return (
                <li key={ad.id} id={`ad-${ad.id}`} className="card scroll-mt-24">
                  <p className="caption-1 flex flex-wrap items-center gap-2">
                    <span className={`tag ${state === "running" ? "tag-lit" : ""}`}>{AD_STATE_NAMES[state]}</span>
                    {ad.status === "approved" && <span className="tag">{ad.paid ? "Paid" : "Not yet paid"}</span>}
                    <span className="text-ink-subtle">{adPlace(ad.place)?.name}</span>
                  </p>
                  <div className="mt-4">
                    <AdCard ad={preview(ad)} />
                  </div>
                  <dl className="facts body-3 mt-4">
                    <div className="contents">
                      <dt>Months</dt>
                      <dd>{monthNames(ad.months)}</dd>
                    </div>
                    <div className="contents">
                      <dt>Price</dt>
                      <dd>{costOf(ad)}</dd>
                    </div>
                    <div className="contents">
                      <dt>Leads to</dt>
                      <dd className="break-all">{leadsTo(ad) || "Your page on biznes.mu"}</dd>
                    </div>
                    <div className="contents">
                      <dt>Where it stands</dt>
                      <dd>{NEXT[state]}</dd>
                    </div>
                    {ad.status === "declined" && ad.reason && (
                      <div className="contents">
                        <dt>Why</dt>
                        <dd>{ad.reason}</dd>
                      </div>
                    )}
                  </dl>

                  {open && (
                    <div className="mt-6 grid gap-6">
                      <div className="card card-panel">
                        <UploadForm
                          to={`/dashboard/${b.id}/ads/${ad.id}/upload`}
                          label={ad.artwork ? "Change its picture" : "Add its picture"}
                          button={ad.artwork ? "Use this picture" : "Add this picture"}
                          problem={at === ad.id ? wrong : undefined}
                          hint={ad.place === "guide-listing" ? "A sponsored listing is words alone, so a picture is optional. A JPEG, PNG or WebP, 3 MB at most." : "Wide pictures work best. A JPEG, PNG or WebP, 3 MB at most."}
                          quiet
                        />
                      </div>
                      <details>
                        <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                          Change its words, place or months <Chevron className="size-4" />
                        </summary>
                        <div className="mt-3">
                          <ActionForm action={saveAd}>
                            <input type="hidden" name="business" value={b.id} />
                            <input type="hidden" name="ad" value={ad.id} />
                            {fields(ad)}
                            <div>
                              <Submit className="btn btn-quiet button-md">Save this advertisement</Submit>
                            </div>
                          </ActionForm>
                        </div>
                      </details>
                    </div>
                  )}

                  {(open || ad.status === "submitted") && (
                    <div className="mt-6">
                      <ActionForm action={moveAd} className="grid gap-3">
                        <input type="hidden" name="business" value={b.id} />
                        <input type="hidden" name="ad" value={ad.id} />
                        <div className="flex flex-wrap gap-3">
                          {open && (
                            <Submit name="do" value="send" className="btn btn-ink button-md" busy="Sending">
                              Send it in
                            </Submit>
                          )}
                          {ad.status === "submitted" && (
                            <Submit name="do" value="back" className="btn btn-quiet button-md" busy="Taking it back">
                              Take it back
                            </Submit>
                          )}
                          <Submit name="do" value="remove" className="btn btn-quiet button-md" busy="Taking it out">
                            Take it out<span className="sr-only">: {ad.headline}</span>
                          </Submit>
                        </div>
                      </ActionForm>
                    </div>
                  )}
                  {ad.status === "approved" && <p className="caption-1 mt-4 text-ink-faint">An approved advertisement is changed by us, and it leads where it led when we approved it. Write to us and we will change it.</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="lg:col-span-5">
        <section aria-labelledby="new-ad" className="card card-panel">
          <h3 id="new-ad" className="heading-3">
            A new advertisement
          </h3>
          <p className="body-3 mt-1 text-ink-subtle">Draft it first. You add its picture next, and send it in when it is ready.</p>
          <div className="mt-4">
            <ActionForm action={saveAd}>
              <input type="hidden" name="business" value={b.id} />
              {fields()}
              <div>
                <Submit className="btn btn-ink button-md" busy="Drafting">
                  Draft this advertisement
                </Submit>
              </div>
            </ActionForm>
          </div>
        </section>
        <section aria-labelledby="places" className="mt-8">
          <h3 id="places" className="heading-3">
            The places
          </h3>
          <ul className="rows mt-3">
            {AD_PLACES.map((p) => (
              <li key={p.id} className="row">
                <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="title-2">{p.name}</span>
                  <span className="data-2 text-ink-subtle">{priceOf(p.id)}</span>
                </p>
                <p className="caption-1 mt-1 text-ink-subtle">{p.what}</p>
              </li>
            ))}
          </ul>
          <p className="caption-1 mt-4 text-ink-faint">A place on the site holds one advertisement at a time: when several run in a month, each takes its turn by the day. No payment is taken on this site.</p>
        </section>
      </aside>
    </div>
  );
}
