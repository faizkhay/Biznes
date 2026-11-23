import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Notice, PartHead, WayIn } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import { Calendar, Cart, Cog, Mail, Megaphone, Pencil, People, Shield, Tag } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import SubscribeForm from "@/components/account/SubscribeForm";
import { Crumbs } from "@/components/Bits";
import { Arrow, Store } from "@/components/Icons";
import { Mark } from "@/components/Logo";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { requireViewer } from "@/lib/accounts/session";
import { BOOKING_NAMES, ORDER_NAMES, planNow, ROLE_NAMES, rupees, STATUS_NAMES, when, type Booking, type Business, type Order, type OrderItem } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { cancelBooking, saveProfile, signOut } from "./actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

const SAID: Record<string, string> = { password: "Your password is changed." };
const planName = (id: string) => PLANS.find((p) => p.id === id)?.name ?? id;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon />;
  const viewer = await requireViewer("/account");
  const { said } = await searchParams;
  const supabase = await db();
  const staff = viewer.role !== "user";
  const head = (table: string, status: string) => supabase.from(table).select("id", { count: "exact", head: true }).eq("status", status);
  const [{ data: bookingRows }, { data: businessRows }, { data: orderRows }, shown, toCheck, plansAsked, adsSent, ordersPlaced] = await Promise.all([
    supabase.from("bookings").select("id, business_id, service_id, wanted_at, note, status").eq("customer_id", viewer.id).order("wanted_at", { ascending: false }).limit(50),
    supabase.from("businesses").select("id, name, status, plan, plan_until").eq("owner_id", viewer.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("customer_id", viewer.id).order("created_at", { ascending: false }).limit(30),
    owned(),
    // What is waiting for an admin, for the figures on their tiles.
    ...(staff ? [head("businesses", "pending"), head("plan_requests", "open"), head("ads", "submitted"), head("orders", "placed")] : [null, null, null, null]),
  ]);
  const bookings = (bookingRows ?? []) as Pick<Booking, "id" | "business_id" | "service_id" | "wanted_at" | "note" | "status">[];
  const businesses = (businessRows ?? []) as Pick<Business, "id" | "name" | "status" | "plan" | "plan_until">[];
  const orders = (orderRows ?? []) as Order[];
  const { data: itemRows } = orders.length
    ? await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orders.map((o) => o.id))
        .order("id")
    : { data: [] };
  const items = (itemRows ?? []) as OrderItem[];
  const given = viewer.name.trim().split(/\s+/)[0] ?? "";
  const n = (asked: { count: number | null } | null) => asked?.count ?? 0;

  return (
    <>
      <div className="shell pt-8 pb-10 lg:pt-12">
        <Crumbs path={[{ href: "/", label: "Home" }, { label: "Your account" }]} />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <span className="account-mark" aria-hidden>
            <Mark />
          </span>
          <div className="min-w-0">
            <h1 className="heading-1">{given ? `Hello, ${given}` : "Welcome"}</h1>
            <p className="caption-1 mt-3 flex flex-wrap items-center gap-2 text-ink-subtle">
              <span className={`tag ${staff ? "tag-lit" : ""}`}>{staff ? ROLE_NAMES[viewer.role] : businesses.length ? "Business owner" : "Member"}</span>
              <span className="break-all">{viewer.email}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {said && SAID[said] && <Notice className="mb-8">{SAID[said]}</Notice>}

          <section aria-labelledby="yours">
            <h2 id="yours" className="heading-3">
              Where everything is
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-2">
              <li>
                <WayIn href="/dashboard" icon={<Store />} title="Your businesses" line={businesses.length ? "Details, plans, bookings and advertising." : "List one, or claim yours. It is free."} count={businesses.length} />
              </li>
              <li>
                <WayIn href="#plans" icon={<Tag />} title="Your plans" line="What each business is on, and until when." />
              </li>
              <li>
                <WayIn href="#orders" icon={<Cart />} title="Your orders" line="What you have asked us for." count={orders.length} />
              </li>
              <li>
                <WayIn href="#bookings" icon={<Calendar />} title="Your bookings" line="What you have asked of a business." count={bookings.filter((b) => b.status === "requested" || b.status === "confirmed").length} />
              </li>
            </ul>
          </section>

          {staff && (
            <section aria-labelledby="running" className="mt-12">
              <h2 id="running" className="heading-3">
                Running the site
              </h2>
              <p className="body-3 mt-1 text-ink-subtle">You are {viewer.role === "superadmin" ? "the superadmin" : "an admin"}. These are yours and no visitor&rsquo;s.</p>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-2 lg:grid-cols-3">
                <li>
                  <WayIn href="/admin" icon={<Shield />} title="Admin" line="Businesses to check, and requests for a plan." count={n(toCheck) + n(plansAsked)} />
                </li>
                <li>
                  <WayIn href="/admin/ads" icon={<Megaphone />} title="Advertisements" line="Approve, decline, mark paid." count={n(adsSent)} />
                </li>
                <li>
                  <WayIn href="/admin/orders" icon={<Cart />} title="Orders" line="What people have asked for." count={n(ordersPlaced)} />
                </li>
                <li>
                  <WayIn href="/admin/subscribers" icon={<Mail />} title="Subscribers" line="Who is sent the guide and the magazine." />
                </li>
                <li>
                  <WayIn href="/admin/email" icon={<Pencil />} title="Email" line="Write to the list, and send it." />
                </li>
                <li>
                  <WayIn href="/admin/leads" icon={<Store />} title="No website" line="Listings with no website, to call." />
                </li>
                {viewer.role === "superadmin" && (
                  <>
                    <li>
                      <WayIn href="/admin/people" icon={<People />} title="People" line="Who is an admin." />
                    </li>
                    <li>
                      <WayIn href="/admin/settings" icon={<Cog />} title="The look" line="The picture behind every page." />
                    </li>
                  </>
                )}
              </ul>
            </section>
          )}

          <section aria-labelledby="plans" className="mt-12 scroll-mt-24">
            <PartHead id="plans" title="Your plans" line="Every business of yours, the plan it is on and the day that plan runs to. Nothing is charged on the site: you ask for a change and we arrange it with you.">
              {businesses.length > 0 && (
                <Link prefetch={false} href="/dashboard/new" className="btn btn-quiet btn-sm button-sm">
                  {ACTIONS.list}
                </Link>
              )}
            </PartHead>
            {businesses.length === 0 ? (
              <div className="mt-6">
                <Empty
                  icon={<Store />}
                  title="No business yet"
                  action={
                    <Link prefetch={false} href="/dashboard/new" className="btn btn-filled button-md">
                      {ACTIONS.list}
                    </Link>
                  }
                >
                  List your business, or claim it if it is already in the directory. A basic listing is free for good.
                </Empty>
              </div>
            ) : (
              <ul className="rows mt-6">
                {businesses.map((b) => {
                  const plan = planNow(b.plan, b.plan_until);
                  return (
                    <li key={b.id}>
                      <article className="row listing">
                        <span className="listing-icon" aria-hidden>
                          <Store />
                        </span>
                        <div className="min-w-0">
                          <h3 className="title-1">
                            <Link prefetch={false} href={`/dashboard/${b.id}`} className="row-title">
                              {b.name}
                            </Link>
                          </h3>
                          <p className="caption-1 mt-2 flex flex-wrap items-center gap-2">
                            <span className={`tag ${plan !== "free" ? "tag-lit" : ""}`}>{planName(plan)}</span>
                            <span className="tag">{STATUS_NAMES[b.status]}</span>
                          </p>
                          <p className="body-3 mt-2 text-ink-subtle">
                            {plan !== "free" && b.plan_until ? `Runs to ${day(b.plan_until)}.` : b.plan !== "free" && b.plan_until ? `${planName(b.plan)} ended on ${day(b.plan_until)}.` : "Free for good."}
                          </p>
                        </div>
                        <Link prefetch={false} href={`/dashboard/${b.id}#plan`} className="btn btn-quiet btn-sm button-sm self-center">
                          Change<span className="sr-only">: the plan of {b.name}</span>
                        </Link>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="orders" className="mt-12 scroll-mt-24">
            <PartHead id="orders" title="Your orders" line="What you have ordered while signed in, and where each stands. Nothing is paid on the site: a person contacts you with how to pay." />
            {orders.length === 0 ? (
              <div className="mt-6">
                <Empty icon={<Cart />} title="No orders yet">
                  When you order a pocket guide, a place on its sponsors&rsquo; page or a plan while signed in, it is kept here.
                </Empty>
              </div>
            ) : (
              <ul className="rows mt-6">
                {orders.map((o) => {
                  const lines = items.filter((i) => i.order_id === o.id);
                  return (
                    <li key={o.id}>
                      <article className="row listing">
                        <span className="listing-icon listing-icon-quiet" aria-hidden>
                          <Cart />
                        </span>
                        <div className="min-w-0">
                          <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                            <span className={`tag ${o.status === "paid" || o.status === "fulfilled" ? "tag-lit" : ""}`}>{ORDER_NAMES[o.status]}</span>
                            <span>{day(o.created_at.slice(0, 10))}</span>
                          </p>
                          <h3 className="title-1 mt-2">
                            Order <span className="data-1">{o.number}</span>
                          </h3>
                          <ul className="body-3 mt-1 text-ink-subtle">
                            {lines.map((l) => (
                              <li key={l.id}>
                                {l.qty > 1 ? `${count(l.qty)} × ` : ""}
                                {l.name}
                                {l.detail ? ` (${l.detail})` : ""}
                                {l.unit_mur == null ? ", price on request" : ""}
                              </li>
                            ))}
                          </ul>
                          {o.admin_note && <p className="body-3 mt-2 max-w-prose">From us: {o.admin_note}</p>}
                        </div>
                        <p className="data-1 whitespace-nowrap">{o.total_mur ? rupees(o.total_mur) : "On request"}</p>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="bookings" className="mt-12 scroll-mt-24">
            <PartHead id="bookings" title="Your bookings" line="What you have asked of a business while signed in, with what it answered." />
            {bookings.length === 0 ? (
              <div className="mt-6">
                <Empty icon={<Calendar />} title="No bookings yet">
                  A business on Biznes Grow takes bookings on its page. Ask for one while signed in and it is kept here.
                </Empty>
              </div>
            ) : (
              <ul className="rows mt-6">
                {bookings.map((b) => {
                  const business = shown.byId.get(b.business_id);
                  const service = business?.services.find((s) => s.id === b.service_id);
                  const open = b.status === "requested" || b.status === "confirmed";
                  return (
                    <li key={b.id}>
                      <article className="row listing">
                        <span className="listing-icon listing-icon-quiet" aria-hidden>
                          <Calendar />
                        </span>
                        <div className="min-w-0">
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
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <section aria-labelledby="details" className="card">
            <h2 id="details" className="heading-3">
              Your details
            </h2>
            <div className="mt-4">
              <ActionForm action={saveProfile}>
                <Field name="name" label="Your name" autoComplete="name" defaultValue={viewer.name} />
                <Field name="phone" label="Phone or WhatsApp number" type="tel" autoComplete="tel" inputMode="tel" data optional defaultValue={viewer.phone} hint="So we can reach you about a business you list or an order." />
                <div>
                  <Submit className="btn btn-ink button-md">Save</Submit>
                </div>
              </ActionForm>
            </div>
          </section>
          <section aria-labelledby="list" className="card card-panel mt-6">
            <h2 id="list" className="heading-3">
              The guide and the magazine
            </h2>
            <p className="body-3 mt-1 text-ink-subtle">Be sent each one by email when it comes out.</p>
            <SubscribeForm className="mt-4" email={viewer.email} quiet />
          </section>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link prefetch={false} href="/account/update-password" className="body-3 inline-flex min-h-11 items-center gap-2 text-link">
              Change your password <Arrow className="size-4" />
            </Link>
            <form action={signOut}>
              <button type="submit" className="btn btn-quiet button-md">
                {ACTIONS.signOut}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
