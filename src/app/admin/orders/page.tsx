import type { Metadata } from "next";
import { Reach } from "@/components/account/AdminBits";
import AdminNav from "@/components/account/AdminNav";
import { Empty, Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Field, Submit } from "@/components/account/Form";
import { Cart } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { siteCatalogue, unlevel, type CatalogueRow } from "@/lib/accounts/catalogue";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireAdmin } from "@/lib/accounts/session";
import { ORDER_NAMES, ORDER_STATUSES, rupees, when, type Order, type OrderItem, type OrderStatus } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { levelCatalogue, setOrder } from "../actions";

export const metadata: Metadata = { title: "Orders", robots: { index: false, follow: false } };

type Logged = { id: number; at: string; actor: string | null; action: string; detail: Record<string, unknown> };

/** What can be done with an order from where it stands: the next step first. */
const STEPS: Record<OrderStatus, { to: OrderStatus; label: string; busy: string; first?: boolean }[]> = {
  placed: [
    { to: "awaiting_payment", label: "We have told them how to pay", busy: "Saving", first: true },
    { to: "paid", label: "Mark paid", busy: "Saving" },
    { to: "cancelled", label: "Cancel", busy: "Cancelling" },
  ],
  awaiting_payment: [
    { to: "paid", label: "Mark paid", busy: "Saving", first: true },
    { to: "cancelled", label: "Cancel", busy: "Cancelling" },
  ],
  paid: [
    { to: "fulfilled", label: "Mark fulfilled", busy: "Saving", first: true },
    { to: "cancelled", label: "Cancel", busy: "Cancelling" },
  ],
  fulfilled: [{ to: "paid", label: "Open it again", busy: "Opening" }],
  cancelled: [{ to: "placed", label: "Open it again", busy: "Opening" }],
};

function told(entry: Logged): string {
  const d = entry.detail;
  if (entry.action === "catalogue.set") return "The catalogue was brought level with the site";
  const status = entry.action.slice(6) as OrderStatus;
  return `Order ${d.number ?? ""}: ${ORDER_NAMES[status]?.toLowerCase() ?? status}`;
}

export default async function AdminOrdersPage() {
  if (!accountsOn) return <AccountsSoon title="Orders" />;
  const viewer = await requireAdmin("/admin/orders");
  const supabase = await db();
  const tally = (status: string) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status);
  const [{ data: openRows }, { data: closedRows }, { data: copy }, { data: logRows }, counts] = await Promise.all([
    supabase.from("orders").select("*").in("status", ["placed", "awaiting_payment", "paid"]).order("created_at").limit(100),
    supabase.from("orders").select("*").in("status", ["fulfilled", "cancelled"]).order("updated_at", { ascending: false }).limit(50),
    supabase.from("catalogue").select("id, name, price_mur, per, active"),
    supabase.from("audit_log").select("id, at, actor, action, detail").or("action.like.order.*,action.eq.catalogue.set").order("id", { ascending: false }).limit(12),
    Promise.all(ORDER_STATUSES.map(tally)),
  ]);
  const open = (openRows ?? []) as Order[];
  const closed = (closedRows ?? []) as Order[];
  const log = (logRows ?? []) as Logged[];
  const all = [...open, ...closed];
  const { data: itemRows } = all.length
    ? await supabase
        .from("order_items")
        .select("*")
        .in("order_id", all.map((o) => o.id))
        .order("id")
    : { data: [] };
  const items = (itemRows ?? []) as OrderItem[];
  const actors = [...new Set(log.map((l) => l.actor ?? "").filter(Boolean))];
  const { data: actorRows } = actors.length ? await supabase.from("profiles").select("id, name, email").in("id", actors) : { data: [] };
  const who = new Map((actorRows ?? []).map((p) => [p.id as string, (p.name as string) || (p.email as string)]));
  const apart = copy ? unlevel(siteCatalogue(), copy as CatalogueRow[]) : ["The catalogue could not be read"];
  const n = (status: OrderStatus) => count(counts[ORDER_STATUSES.indexOf(status)]?.count ?? 0);
  const lines = (o: Order) => items.filter((i) => i.order_id === o.id);

  return (
    <>
      <PageHead title="Orders" path={[{ href: "/admin", label: "Admin" }, { label: "Orders" }]} lede="What people have ordered: pocket guides, places on a guide's sponsors' page, plans. Nothing is paid on the site. Contact each person with how to pay, then move the order on as it goes." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/orders" />
        <Stats>
          <Stat label="Placed" figure={n("placed")} note="Waiting for you to reach them." href="#queue" />
          <Stat label="Awaiting payment" figure={n("awaiting_payment")} href="#queue" />
          <Stat label="Paid" figure={n("paid")} note="To be fulfilled." href="#queue" />
          <Stat label="Fulfilled" figure={n("fulfilled")} href="#done" />
        </Stats>

        <section aria-labelledby="catalogue" className="mt-8 max-w-3xl">
          <h2 id="catalogue" className="sr-only">
            The catalogue
          </h2>
          {apart.length === 0 ? (
            <p className="caption-1 text-ink-faint">Every order is priced by the database from its own catalogue, which says what the site says today.</p>
          ) : (
            <div className="grid gap-4">
              <Notice bad>
                The catalogue the database prices from does not say what the site says, so what differs cannot be ordered until the two are level: {apart.join("; ")}.{viewer.role === "superadmin" ? "" : " The superadmin brings them level from this page."}
              </Notice>
              {viewer.role === "superadmin" && (
                <ActionForm action={levelCatalogue} className="grid gap-3">
                  <div>
                    <Submit className="btn btn-ink button-md" busy="Bringing it level">
                      Bring the catalogue level
                    </Submit>
                  </div>
                </ActionForm>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="queue" className="mt-12 scroll-mt-24">
          <PartHead id="queue" title="To deal with" line="The oldest first. A note you write is shown to the person, on their account, with the order." />
          {open.length === 0 ? (
            <div className="mt-6">
              <Empty icon={<Cart />} title="No order is waiting">
                When someone places an order it waits here, with how to reach them.
              </Empty>
            </div>
          ) : (
            <ul className="mt-6 grid gap-4">
              {open.map((o) => (
                <li key={o.id}>
                  <article className="card grid gap-x-10 gap-y-6 lg:grid-cols-12" data-order={o.number}>
                    <div className="lg:col-span-7">
                      <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                        <span className={`tag ${o.status === "paid" ? "tag-lit" : ""}`}>{ORDER_NAMES[o.status]}</span>
                        <span>{when(o.created_at)}</span>
                        <span className="tag">{o.customer_id ? "Has an account" : "A guest"}</span>
                      </p>
                      <h3 className="title-1 mt-2 flex flex-wrap items-baseline justify-between gap-x-6">
                        <span>
                          Order <span className="data-1">{o.number}</span>
                        </span>
                        <span className="data-1">{o.total_mur ? rupees(o.total_mur) : "On request"}</span>
                      </h3>
                      <ul className="body-3 mt-2">
                        {lines(o).map((l) => (
                          <li key={l.id} className="flex flex-wrap justify-between gap-x-6">
                            <span>
                              {l.qty > 1 ? `${count(l.qty)} × ` : ""}
                              {l.name}
                              {l.detail ? ` (${l.detail})` : ""}
                            </span>
                            <span className="data-2 text-ink-subtle">{l.unit_mur == null ? "Price on request" : `${rupees(l.unit_mur)}${l.per === "month" ? " a month" : ""}`}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="body-3 mt-4 text-ink-subtle">
                        <Reach owner={{ name: o.name, email: o.email, phone: o.phone }} />
                      </p>
                      {o.note && <p className="body-3 mt-2 max-w-prose">Their note: {o.note}</p>}
                    </div>
                    <div className="lg:col-span-5">
                      <ActionForm action={setOrder} className="grid gap-4">
                        <input type="hidden" name="order" value={o.id} />
                        <Field name="note" label="A note for them" optional defaultValue={o.admin_note} hint="Shown with the order on their account." />
                        <div className="flex flex-wrap gap-2">
                          {STEPS[o.status].map((step) => (
                            <Submit key={step.to} name="status" value={step.to} busy={step.busy} className={step.first ? "btn btn-ink btn-sm button-sm" : "btn btn-quiet btn-sm button-sm"}>
                              {step.label}
                              <span className="sr-only">: order {o.number}</span>
                            </Submit>
                          ))}
                        </div>
                      </ActionForm>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="done" className="mt-12 scroll-mt-24">
          <PartHead id="done" title="Fulfilled and cancelled" line="The last fifty." />
          {closed.length === 0 ? (
            <p className="body-2 mt-4 text-ink-subtle">None yet.</p>
          ) : (
            <div className="table-wrap mt-6" tabIndex={0} role="region" aria-label="Fulfilled and cancelled orders">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Placed</th>
                    <th scope="col">By</th>
                    <th scope="col">What</th>
                    <th scope="col">Total</th>
                    <th scope="col">Stands</th>
                    <th scope="col">
                      <span className="sr-only">Change</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {closed.map((o) => (
                    <tr key={o.id}>
                      <th scope="row" className="data-2">
                        {o.number}
                      </th>
                      <td data-label="Placed" className="whitespace-nowrap">
                        {day(o.created_at.slice(0, 10))}
                      </td>
                      <td data-label="By">{o.name || o.email || o.phone}</td>
                      <td data-label="What">
                        {lines(o)
                          .map((l) => `${l.qty > 1 ? `${l.qty} × ` : ""}${l.name}`)
                          .join(", ")}
                      </td>
                      <td data-label="Total" className="data-2 whitespace-nowrap">
                        {o.total_mur ? rupees(o.total_mur) : "On request"}
                      </td>
                      <td data-label="Stands">{ORDER_NAMES[o.status]}</td>
                      <td>
                        <ActionForm action={setOrder} className="grid" quiet>
                          <input type="hidden" name="order" value={o.id} />
                          {STEPS[o.status].map((step) => (
                            <Submit key={step.to} name="status" value={step.to} busy={step.busy} className="btn btn-quiet btn-sm button-sm">
                              {step.label}
                              <span className="sr-only">: order {o.number}</span>
                            </Submit>
                          ))}
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="record" className="mt-12 max-w-3xl">
          <PartHead id="record" title="The record" line="The last things done to an order, by whom and when." />
          {log.length === 0 ? (
            <p className="body-2 mt-4 text-ink-subtle">Nothing yet.</p>
          ) : (
            <ul className="rows mt-4">
              {log.map((entry) => (
                <li key={entry.id}>
                  <p className="row body-3">
                    <span className="caption-1 block text-ink-faint">
                      {when(entry.at)} · {entry.actor ? (who.get(entry.actor) ?? "Someone") : "The database"}
                    </span>
                    {told(entry)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
