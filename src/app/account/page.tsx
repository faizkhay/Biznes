import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Arrow, Store } from "@/components/Icons";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { requireViewer } from "@/lib/accounts/session";
import { BOOKING_NAMES, ROLE_NAMES, when, type Booking } from "@/lib/accounts/types";
import { cancelBooking, saveProfile, signOut } from "./actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

const SAID: Record<string, string> = { password: "Your password is changed." };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon />;
  const viewer = await requireViewer("/account");
  const { said } = await searchParams;
  const supabase = await db();
  const [{ data: bookings }, { count: businesses }, shown] = await Promise.all([
    supabase.from("bookings").select("id, business_id, service_id, wanted_at, note, status").eq("customer_id", viewer.id).order("wanted_at", { ascending: false }).limit(50),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", viewer.id),
    owned(),
  ]);
  const mine = (bookings ?? []) as Pick<Booking, "id" | "business_id" | "service_id" | "wanted_at" | "note" | "status">[];
  const staff = viewer.role !== "user";

  return (
    <>
      <PageHead title="Your account" lede={`Signed in as ${viewer.email}${staff ? `, ${ROLE_NAMES[viewer.role].toLowerCase()}` : ""}.`} />
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {said && SAID[said] && (
            <p role="status" className="note body-3 mb-8">
              {SAID[said]}
            </p>
          )}

          <ul className="grid gap-4 sm:grid-cols-2">
            <li>
              <article className="card flex h-full gap-4">
                <span className="tile-icon">
                  <Store />
                </span>
                <div>
                  <h2 className="title-1">
                    <Link href="/dashboard" className="row-title text-ink">
                      Your businesses
                    </Link>
                  </h2>
                  <p className="body-3 mt-1 text-ink-subtle">{businesses ? `${businesses} listed. Change their details, ask for a plan, look after bookings.` : "List a business, or claim one that is already here. It is free."}</p>
                </div>
              </article>
            </li>
            {staff && (
              <li>
                <article className="card card-ink flex h-full gap-4">
                  <div>
                    <h2 className="title-1">
                      <Link href="/admin" className="row-title">
                        Admin
                      </Link>
                    </h2>
                    <p className="body-3 mt-1 opacity-80">New businesses to check, requests for a plan, and everyone&rsquo;s listings.</p>
                  </div>
                </article>
              </li>
            )}
          </ul>

          <section aria-labelledby="bookings" className="mt-12">
            <h2 id="bookings" className="heading-3">
              Your bookings
            </h2>
            {mine.length === 0 ? (
              <p className="body-2 mt-3 text-ink-subtle">You have not asked for a booking while signed in. When you do, it is kept here with what the business answered.</p>
            ) : (
              <ul className="rows mt-4">
                {mine.map((b) => {
                  const business = shown.byId.get(b.business_id);
                  const service = business?.services.find((s) => s.id === b.service_id);
                  const open = b.status === "requested" || b.status === "confirmed";
                  return (
                    <li key={b.id}>
                      <article className="row">
                        <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                          <span className={`tag ${b.status === "confirmed" ? "tag-lit" : ""}`}>{BOOKING_NAMES[b.status]}</span>
                          <span className="data-2">{when(b.wanted_at)}</span>
                        </p>
                        <h3 className="title-1 mt-2">
                          {business ? (
                            <Link href={business.path} className="text-link">
                              {business.name}
                            </Link>
                          ) : (
                            "A business that is no longer listed"
                          )}
                        </h3>
                        {(service || b.note) && <p className="body-3 mt-1 text-ink-subtle">{[service?.name, b.note].filter(Boolean).join(" · ")}</p>}
                        {open && (
                          <ActionForm action={cancelBooking} className="mt-3 grid gap-3">
                            <input type="hidden" name="booking" value={b.id} />
                            <div>
                              <Submit className="btn btn-quiet btn-sm button-sm" busy="Cancelling">
                                Cancel this booking
                              </Submit>
                            </div>
                          </ActionForm>
                        )}
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="heading-3">Your details</h2>
          <div className="mt-4">
            <ActionForm action={saveProfile}>
              <Field name="name" label="Your name" autoComplete="name" defaultValue={viewer.name} />
              <Field name="phone" label="Phone or WhatsApp number" type="tel" autoComplete="tel" inputMode="tel" data optional defaultValue={viewer.phone} hint="So we can reach you about a business you list." />
              <div>
                <Submit>Save</Submit>
              </div>
            </ActionForm>
          </div>
          <p className="body-3 mt-8">
            <Link href="/account/update-password" className="inline-flex min-h-11 items-center gap-2 text-link">
              Change your password <Arrow className="size-4" />
            </Link>
          </p>
          <form action={signOut} className="mt-2">
            <button type="submit" className="btn btn-quiet button-md">
              {ACTIONS.signOut}
            </button>
          </form>
        </aside>
      </div>
    </>
  );
}
