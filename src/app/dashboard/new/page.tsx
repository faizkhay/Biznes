import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, Field, Select, Submit, TextArea } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { GroupIcon } from "@/components/Icons";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { owned } from "@/lib/accounts/owned";
import { requireViewer } from "@/lib/accounts/session";
import { isPaidPlan } from "@/lib/accounts/types";
import { index, whereOf } from "@/lib/index";
import { search } from "@/lib/search";
import { createBusiness } from "../actions";

export const metadata: Metadata = { title: ACTIONS.list, robots: { index: false, follow: false } };

type Params = { listing?: string; find?: string; plan?: string };

export default async function NewBusinessPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!accountsOn) return <AccountsSoon title={ACTIONS.list} />;
  const params = await searchParams;
  const plan = isPaidPlan(params.plan) ? params.plan : undefined;
  const keep = plan ? `&plan=${plan}` : "";
  // Signing in on the way comes back to this page as it was asked for.
  const asked = new URLSearchParams();
  if (params.listing) asked.set("listing", params.listing.slice(0, 24));
  if (params.find) asked.set("find", params.find.slice(0, 120));
  if (plan) asked.set("plan", plan);
  await requireViewer(`/dashboard/new${asked.size ? `?${asked}` : ""}`);

  const { byId, groups, categories, places, categoryById } = index();
  const listing = params.listing ? byId.get(params.listing) : undefined;
  const claims = await owned();
  const taken = listing ? claims.byListing.has(listing.id) : false;
  const find = (params.find ?? "").trim().slice(0, 120);
  const found = !listing && find ? search(find, { kind: "listing" }).listings.slice(0, 10) : [];
  const wanted = PLANS.find((p) => p.id === plan);

  const kinds = groups.map((g) => ({ label: g.label, choices: categories.filter((c) => c.group === g.id).map((c) => ({ value: c.id, label: c.one })) }));
  const towns = places
    .filter((p) => p.kind === "town")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({ value: p.slug, label: p.name }));

  return (
    <>
      <PageHead
        title={listing ? ACTIONS.claim : ACTIONS.list}
        path={[{ href: "/dashboard", label: "Your businesses" }, { label: listing ? ACTIONS.claim : ACTIONS.list }]}
        lede={listing ? `Tell us ${listing.name} is yours. A person checks every claim before the listing changes.` : "A basic listing is free for good. Every new business is checked by a person before it goes live."}
      />
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {wanted && (
            <p className="note body-3 mb-8">
              You asked for {wanted.name}. List the business first: the request goes in with it, and we will contact you to arrange payment.
            </p>
          )}

          {listing ? (
            <div className="card card-panel mb-8">
              <p className="label-1 text-ink-faint">The listing you are claiming</p>
              <p className="title-1 mt-2">
                <Link href={`/b/${listing.slug}`} className="text-link">
                  {listing.name}
                </Link>
              </p>
              <p className="body-3 mt-0.5 text-ink-subtle">{[categoryById.get(listing.cat)?.one, whereOf(listing)].filter(Boolean).join(" · ")}</p>
              <p className="body-3 mt-3">
                <Link prefetch={false} href={`/dashboard/new${plan ? `?plan=${plan}` : ""}`} className="text-link">
                  Not this one
                </Link>
              </p>
            </div>
          ) : (
            <section aria-labelledby="find" className="card card-panel mb-10">
              <h2 id="find" className="heading-3">
                Is it already in the directory?
              </h2>
              <p className="body-3 mt-2 max-w-prose text-ink-subtle">Many businesses are, from the open map. Search for yours by name and claim it, so there is one listing and not two.</p>
              <form action="/dashboard/new" method="get" className="mt-4 flex flex-wrap items-end gap-3">
                {plan && <input type="hidden" name="plan" value={plan} />}
                <div className="min-w-0 flex-1">
                  <label htmlFor="find-name" className="title-2 block">
                    The name of the business
                  </label>
                  <input id="find-name" name="find" type="search" defaultValue={find} autoComplete="organization" className="field mt-2" />
                </div>
                <button type="submit" className="btn btn-ink button-md">
                  {ACTIONS.search}
                </button>
              </form>
              {find && (
                <div className="mt-6" role="status">
                  {found.length === 0 ? (
                    <p className="body-3 text-ink-subtle">Nothing in the directory matches “{find}”. List it from scratch below.</p>
                  ) : (
                    <ul className="rows">
                      {found.map((l) => (
                        <li key={l.id}>
                          <div className="row listing items-center">
                            <span className="listing-icon listing-icon-quiet" aria-hidden>
                              <GroupIcon group={categoryById.get(l.cat)?.group} />
                            </span>
                            <div className="min-w-0">
                              <p className="title-2">{l.name}</p>
                              <p className="body-3 text-ink-subtle">{[categoryById.get(l.cat)?.one, whereOf(l)].filter(Boolean).join(" · ")}</p>
                            </div>
                            {claims.byListing.has(l.id) ? (
                              <span className="tag caption-1">Claimed by its owner</span>
                            ) : (
                              <Link prefetch={false} href={`/dashboard/new?listing=${l.id}${keep}`} className="btn btn-quiet btn-sm button-sm">
                                {ACTIONS.claim}
                                <span className="sr-only">: {l.name}</span>
                              </Link>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

          {taken ? (
            <p className="note body-3">
              This listing already has an owner on biznes.mu. If it is yours, <Link href={`/add?listing=${listing!.id}`}>tell us</Link> and a person will look into it.
            </p>
          ) : (
            <section aria-labelledby="details">
              <h2 id="details" className="heading-3">
                {listing ? "Check its details" : "List it from scratch"}
              </h2>
              {listing && <p className="body-3 mt-2 max-w-prose text-ink-subtle">These are filled in from the listing as the open map has it. Put right anything that is wrong: once your claim is approved, yours are the details the page shows.</p>}
              <div className="card mt-6">
                <ActionForm action={createBusiness}>
                  <input type="hidden" name="listing" value={listing?.id ?? ""} />
                  <input type="hidden" name="plan" value={plan ?? ""} />
                  <Field name="name" label="The name of the business" autoComplete="organization" defaultValue={listing?.name} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Select name="category" label="What kind of business" groups={kinds} empty="Choose one" defaultValue={listing?.cat} />
                    <Select name="town" label="Town or village" choices={towns} empty="Choose one" defaultValue={listing?.placeSlug} />
                  </div>
                  <Field name="address" label="Address" optional autoComplete="street-address" defaultValue={[listing?.street, listing?.area].filter(Boolean).join(", ")} />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field name="phone" label="Telephone number" type="tel" autoComplete="tel" inputMode="tel" data optional defaultValue={listing?.phone?.[0]} hint="The number customers call." />
                    <Field name="website" label="Website" type="url" autoComplete="url" inputMode="url" optional defaultValue={listing?.web} />
                  </div>
                  <TextArea name="about" label="What the business does" optional rows={5} maxLength={1200} defaultValue={listing?.about} hint="A few plain sentences, in your own words." />
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <Submit busy="Sending">{listing ? ACTIONS.claim : ACTIONS.list}</Submit>
                    <p className="caption-1 text-ink-faint">Free. It goes live once a person has checked it.</p>
                  </div>
                </ActionForm>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="card">
            <h2 className="heading-3">What happens next</h2>
            <ol className="body-3 mt-4 grid gap-4">
              {["A person checks the business, usually within a working day.", "It goes live on Biznes Free, a basic listing at no cost.", "Once it is live you can ask for Biznes Go or Biznes Grow from your dashboard."].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="data-2 grid size-6 flex-none place-items-center rounded-full bg-panel text-ink" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="text-ink-subtle">{step}</span>
                </li>
              ))}
            </ol>
            <p className="body-3 mt-6">
              <Link href="/pricing" className="text-link">
                What each plan gives
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
