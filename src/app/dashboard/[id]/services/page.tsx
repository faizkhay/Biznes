import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Empty, PartHead } from "@/components/account/Bits";
import { ActionForm, Check, Chips, Field, Submit, TextArea } from "@/components/account/Form";
import { Tag } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { Chevron } from "@/components/Icons";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { duration, rupees, type PayDetails, type Service } from "@/lib/accounts/types";
import { count } from "@/lib/format";
import { removeService, savePayDetails, saveService } from "../../actions";

export const metadata: Metadata = { title: "Services and products", robots: { index: false, follow: false } };

type Sold = Service & { kind?: "service" | "product"; stock?: number | null };
const KINDS = [
  { value: "service", label: "A service" },
  { value: "product", label: "A product" },
];

export default async function ServicesPage({ params }: { params: Promise<{ id: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, grow } = await ownBusiness(id);
  if (!grow) notFound();
  const supabase = await db();
  const [{ data: rows }, { data: payRow }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", b.id).order("created_at"),
    supabase.from("pay_details").select("business_id, juice_number, juice_name").eq("business_id", b.id).maybeSingle(),
  ]);
  const sold = (rows ?? []) as Sold[];
  const pay = payRow as PayDetails | null;

  return (
    <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <section aria-labelledby="services" className="lg:col-span-7">
        <PartHead id="services" title="Services and products" line="What you sell, with its price. The ones switched on are shown on your page, and a customer can name one when they ask for a booking." />
        {sold.length === 0 ? (
          <div className="mt-8">
            <Empty icon={<Tag />} title="Nothing to sell yet">
              Add the first thing you do or sell: its name as a customer would ask for it, its price, and for a service how long it takes.
            </Empty>
          </div>
        ) : (
          <ul className="rows mt-6">
            {sold.map((s) => {
              const product = s.kind === "product";
              return (
                <li key={s.id}>
                  <details className="row">
                    <summary className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                      <span>
                        <span className="title-1 block">{s.name}</span>
                        <span className="body-3 block text-ink-subtle">
                          {[product ? "Product" : "", s.price_mur != null ? rupees(s.price_mur) : "No price given", !product && s.minutes ? duration(s.minutes) : "", product && s.stock != null ? `${count(s.stock)} in stock` : "", s.active ? "" : "Switched off"].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="body-3 inline-flex items-center gap-2 font-semibold text-link">
                        Change <Chevron className="size-4" />
                      </span>
                    </summary>
                    <div className="mt-4 grid gap-6">
                      <ActionForm action={saveService}>
                        <input type="hidden" name="business" value={b.id} />
                        <input type="hidden" name="service" value={s.id} />
                        <Chips name="kind" legend="What it is" choices={KINDS} defaultValue={product ? "product" : "service"} />
                        <Field name="name" label="Name" defaultValue={s.name} />
                        <div className="grid gap-6 sm:grid-cols-3">
                          <Field name="price" label="Price, in rupees" inputMode="numeric" data optional defaultValue={s.price_mur != null ? String(s.price_mur) : ""} />
                          <Field name="minutes" label="How long, in minutes" inputMode="numeric" data optional defaultValue={s.minutes ? String(s.minutes) : ""} hint="For a service." />
                          <Field name="stock" label="How many in stock" inputMode="numeric" data optional defaultValue={s.stock != null ? String(s.stock) : ""} hint="For a product. Only you see it." />
                        </div>
                        <TextArea name="description" label="What it is, in a line or two" optional rows={3} maxLength={400} defaultValue={s.description} />
                        <Check name="active" label="Shown on your page" defaultChecked={s.active} />
                        <div>
                          <Submit className="btn btn-ink button-md">Save this</Submit>
                        </div>
                      </ActionForm>
                      <ActionForm action={removeService} className="grid gap-3">
                        <input type="hidden" name="business" value={b.id} />
                        <input type="hidden" name="service" value={s.id} />
                        <div>
                          <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                            Remove this
                          </Submit>
                        </div>
                      </ActionForm>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        <div className="card card-panel mt-8">
          <h3 className="heading-3">Add a service or a product</h3>
          <div className="mt-4">
            <ActionForm action={saveService}>
              <input type="hidden" name="business" value={b.id} />
              <Chips name="kind" legend="What it is" choices={KINDS} defaultValue="service" />
              <Field name="name" label="Name" hint="As a customer would ask for it." />
              <div className="grid gap-6 sm:grid-cols-3">
                <Field name="price" label="Price, in rupees" inputMode="numeric" data optional />
                <Field name="minutes" label="How long, in minutes" inputMode="numeric" data optional hint="For a service." />
                <Field name="stock" label="How many in stock" inputMode="numeric" data optional hint="For a product. Only you see it." />
              </div>
              <TextArea name="description" label="What it is, in a line or two" optional rows={3} maxLength={400} />
              <div>
                <Submit className="btn btn-ink button-md" busy="Adding">
                  Add this
                </Submit>
              </div>
            </ActionForm>
          </div>
        </div>
      </section>

      <aside className="lg:col-span-5">
        <section aria-labelledby="pay">
          <h2 id="pay" className="heading-3">
            How customers pay you
          </h2>
          <p className="body-3 mt-2 text-ink-subtle">
            If you take MCB Juice, give the mobile number and the name your account is under. Customers see them beside your services and after they ask for a booking, and pay you themselves: biznes.mu takes no part in the payment and never sees it. Leave both empty to show nothing.
          </p>
          <div className="card mt-4">
            <ActionForm action={savePayDetails}>
              <input type="hidden" name="business" value={b.id} />
              <Field name="juice_number" label="MCB Juice mobile number" type="tel" inputMode="tel" data optional defaultValue={pay?.juice_number ?? ""} hint="Eight digits, beginning with 5." />
              <Field name="juice_name" label="Name on the account" optional defaultValue={pay?.juice_name ?? ""} hint="So a customer can check they are paying the right account." />
              <div>
                <Submit className="btn btn-ink button-md">Save how you are paid</Submit>
              </div>
            </ActionForm>
          </div>
        </section>
      </aside>
    </div>
  );
}
