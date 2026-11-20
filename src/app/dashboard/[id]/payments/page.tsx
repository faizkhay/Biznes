import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Empty, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Field, Select, Submit } from "@/components/account/Form";
import { Wallet } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { mauritiusToday, monthAfter, monthName, PAYMENT_METHODS, PAYMENT_NAMES, rupees, thisMonth, type Customer, type Payment } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { recordPayment, removePayment } from "../../crm-actions";

export const metadata: Metadata = { title: "Payments", robots: { index: false, follow: false } };

export default async function PaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, grow } = await ownBusiness(id);
  if (!grow) notFound();
  const supabase = await db();
  const [{ data: rows }, { data: totalRows }, { data: customerRows }] = await Promise.all([
    supabase.from("payments").select("*").eq("business_id", b.id).order("paid_on", { ascending: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("payment_totals").select("month, total, payments").eq("business_id", b.id).order("month", { ascending: false }).limit(12),
    supabase.from("customers").select("id, name").eq("business_id", b.id).order("name").limit(500),
  ]);
  const payments = (rows ?? []) as Payment[];
  const totals = new Map(((totalRows ?? []) as { month: string; total: number; payments: number }[]).map((t) => [t.month, t]));
  const customers = (customerRows ?? []) as Pick<Customer, "id" | "name">[];
  const month = thisMonth();
  // This month and the three before it, whether or not anything was taken in them.
  const months = [0, -1, -2, -3].map((back) => monthAfter(month, back));
  const today = mauritiusToday();
  const methods = PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_NAMES[m] }));

  return (
    <div className="shell">
      <PartHead id="payments" title="Payments" line="A ledger you keep by hand: what you were paid, when, by whom and how. biznes.mu takes no payment and checks none. It adds up what you write here, and nobody else sees it." />
      <div className="mt-6">
        <Stats>
          {months.map((m) => (
            <Stat key={m} label={m === month ? "This month" : monthName(m)} figure={rupees(totals.get(m)?.total ?? 0)} note={`${count(totals.get(m)?.payments ?? 0)} ${totals.get(m)?.payments === 1 ? "payment" : "payments"}`} />
          ))}
        </Stats>
      </div>

      <div className="mt-10 grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <section aria-labelledby="ledger" className="lg:col-span-7">
          <h3 id="ledger" className="heading-3">
            The ledger
          </h3>
          {payments.length === 0 ? (
            <div className="mt-4">
              <Empty icon={<Wallet />} title="Nothing written yet">
                Write down a payment when you take one, or mark a booking paid from Bookings. The months above add themselves up.
              </Empty>
            </div>
          ) : (
            <div className="table-wrap mt-4" tabIndex={0} role="region" aria-label="The ledger">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Paid on</th>
                    <th scope="col">By</th>
                    <th scope="col">For</th>
                    <th scope="col">How</th>
                    <th scope="col">Amount</th>
                    <th scope="col">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <th scope="row" className="data-2 whitespace-nowrap">
                        {day(p.paid_on)}
                      </th>
                      <td data-label="By">{p.payer || <span className="text-ink-faint">Not noted</span>}</td>
                      <td data-label="For">
                        {p.what || <span className="text-ink-faint">Not noted</span>}
                        {p.booking_id && <span className="tag caption-1 ml-2">A booking</span>}
                      </td>
                      <td data-label="How">{PAYMENT_NAMES[p.method]}</td>
                      <td data-label="Amount" className="data-1 whitespace-nowrap">
                        {rupees(p.amount_mur)}
                      </td>
                      <td>
                        <ActionForm action={removePayment} className="grid">
                          <input type="hidden" name="business" value={b.id} />
                          <input type="hidden" name="payment" value={p.id} />
                          <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                            Remove<span className="sr-only">: {rupees(p.amount_mur)} on {day(p.paid_on)}</span>
                          </Submit>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {payments.length === 200 && <p className="caption-1 mt-3 text-ink-faint">The latest two hundred are shown. The months above count them all.</p>}
        </section>

        <aside className="lg:col-span-5">
          <div className="card card-panel">
            <h3 className="heading-3">Write down a payment</h3>
            <div className="mt-4">
              <ActionForm action={recordPayment}>
                <input type="hidden" name="business" value={b.id} />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field name="amount" label="Amount, in rupees" inputMode="numeric" data />
                  <Field name="paid_on" label="Paid on" type="date" max={today} defaultValue={today} data />
                </div>
                <Select name="method" label="How it was paid" choices={methods} defaultValue="juice" />
                <Field name="payer" label="Who paid" optional />
                {customers.length > 0 && <Select name="customer" label="One of your customers" optional empty="Nobody on the list" choices={customers.map((c) => ({ value: c.id, label: c.name }))} />}
                <Field name="what" label="What for" optional />
                <div>
                  <Submit className="btn btn-ink button-md" busy="Writing">
                    Write it in the ledger
                  </Submit>
                </div>
              </ActionForm>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
