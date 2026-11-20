import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Empty, PartHead } from "@/components/account/Bits";
import { ActionForm, Field, Submit, TextArea } from "@/components/account/Form";
import { People, Person } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { Chevron, Phone } from "@/components/Icons";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import type { Customer, CustomerTally } from "@/lib/accounts/types";
import { count, day, telHref } from "@/lib/format";
import { removeCustomer, saveCustomer } from "../../crm-actions";

export const metadata: Metadata = { title: "Customers", robots: { index: false, follow: false } };

/** One person on the page: from the owner's own list, from the bookings made with one number, or both. */
type Known = { key: string; kept?: Customer; name: string; phone: string; notes: string; bookings: number; done: number; last?: string };

export default async function CustomersPage({ params }: { params: Promise<{ id: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, grow } = await ownBusiness(id);
  if (!grow) notFound();
  const supabase = await db();
  const [{ data: keptRows }, { data: tallyRows }] = await Promise.all([
    supabase.from("customers").select("*").eq("business_id", b.id).order("name").limit(2000),
    supabase.from("customer_tallies").select("*").eq("business_id", b.id).order("last_wanted", { ascending: false }).limit(2000),
  ]);
  const kept = (keptRows ?? []) as Customer[];
  const tallies = new Map(((tallyRows ?? []) as CustomerTally[]).map((t) => [t.phone_key, t]));
  const listed = new Set(kept.map((c) => c.phone_key).filter(Boolean));
  const people: Known[] = [
    ...kept.map((c) => {
      const t = c.phone_key ? tallies.get(c.phone_key) : undefined;
      return { key: c.id, kept: c, name: c.name, phone: c.phone, notes: c.notes, bookings: t?.bookings ?? 0, done: t?.done ?? 0, last: t?.last_wanted };
    }),
    // Numbers that have booked and are not on the list yet.
    ...[...tallies.values()].filter((t) => !listed.has(t.phone_key)).map((t) => ({ key: `t-${t.phone_key}`, name: t.name, phone: t.phone, notes: "", bookings: t.bookings, done: t.done, last: t.last_wanted })),
  ].sort((x, y) => (y.last ?? "").localeCompare(x.last ?? "") || x.name.localeCompare(y.name));

  return (
    <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <section aria-labelledby="customers" className="lg:col-span-7">
        <PartHead id="customers" title="Customers" line="Everyone who has asked you for a booking, by their telephone number, and anyone you add yourself. The list is yours alone: nobody else sees it, not even us." />
        {people.length === 0 ? (
          <div className="mt-8">
            <Empty icon={<People />} title="No customers yet">
              A customer appears here the first time they ask for a booking. You can also add one by hand, with a note for yourself.
            </Empty>
          </div>
        ) : (
          <>
            <p className="caption-1 mt-6 text-ink-faint" role="status">
              {count(people.length)} {people.length === 1 ? "customer" : "customers"}, the latest to book first.
            </p>
            <ul className="rows mt-3">
              {people.map((p) => (
                <li key={p.key}>
                  <article className="row listing">
                    <span className="listing-icon" aria-hidden>
                      <Person />
                    </span>
                    <div className="min-w-0">
                      <h3 className="title-1">{p.name}</h3>
                      <p className="body-3 mt-0.5 text-ink-subtle">
                        {p.bookings ? `${count(p.bookings)} ${p.bookings === 1 ? "booking" : "bookings"}, ${count(p.done)} done` : "No bookings yet"}
                        {p.last ? ` · last asked for ${day(p.last.slice(0, 10))}` : ""}
                      </p>
                      {p.notes && <p className="body-3 mt-2 max-w-prose">{p.notes}</p>}
                      <p className="mt-3 flex flex-wrap items-center gap-2">
                        {p.phone && (
                          <a href={telHref(p.phone)} className="act data-2">
                            <Phone /> <span>{p.phone}</span>
                          </a>
                        )}
                        {!p.kept && <span className="tag caption-1">From a booking</span>}
                      </p>
                      <details className="mt-2">
                        <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                          {p.kept ? "Change" : "Keep on your list, with a note"} <Chevron className="size-4" />
                        </summary>
                        <div className="mt-2 grid gap-4">
                          <ActionForm action={saveCustomer} className="grid gap-4">
                            <input type="hidden" name="business" value={b.id} />
                            {p.kept && <input type="hidden" name="customer" value={p.kept.id} />}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <Field name="name" label="Name" defaultValue={p.name} />
                              <Field name="phone" label="Phone or WhatsApp number" type="tel" inputMode="tel" data optional defaultValue={p.phone} />
                            </div>
                            <TextArea name="notes" label="Your notes" optional rows={2} maxLength={1000} defaultValue={p.notes} />
                            <div>
                              <Submit className="btn btn-quiet btn-sm button-sm">{p.kept ? "Save this customer" : "Keep this customer"}</Submit>
                            </div>
                          </ActionForm>
                          {p.kept && (
                            <ActionForm action={removeCustomer} className="grid gap-3">
                              <input type="hidden" name="business" value={b.id} />
                              <input type="hidden" name="customer" value={p.kept.id} />
                              <div>
                                <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                                  Take off your list
                                </Submit>
                              </div>
                            </ActionForm>
                          )}
                        </div>
                      </details>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <aside className="lg:col-span-5">
        <div className="card card-panel">
          <h2 className="heading-3">Add a customer</h2>
          <p className="body-3 mt-1 text-ink-subtle">Someone who comes to you without booking here.</p>
          <div className="mt-4">
            <ActionForm action={saveCustomer}>
              <input type="hidden" name="business" value={b.id} />
              <Field name="name" label="Name" autoComplete="off" />
              <Field name="phone" label="Phone or WhatsApp number" type="tel" inputMode="tel" data optional hint="Bookings from this number are counted with them." />
              <TextArea name="notes" label="Your notes" optional rows={3} maxLength={1000} />
              <div>
                <Submit className="btn btn-ink button-md" busy="Adding">
                  Add this customer
                </Submit>
              </div>
            </ActionForm>
          </div>
        </div>
      </aside>
    </div>
  );
}
