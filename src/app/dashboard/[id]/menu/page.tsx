import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Empty, Notice, PartHead } from "@/components/account/Bits";
import { ActionForm, Field, Submit, TextArea } from "@/components/account/Form";
import { Plate } from "@/components/account/Icons";
import AccountsSoon from "@/components/account/Soon";
import { Chevron, Out } from "@/components/Icons";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import { rupees, type MenuItemRow, type MenuSectionRow } from "@/lib/accounts/types";
import { count } from "@/lib/format";
import { changeMenu, saveItem, saveSection } from "../../page-actions";

export const metadata: Metadata = { title: "Menu", robots: { index: false, follow: false } };

/** A small button that moves or removes a part of the menu. Its name says which part, for someone who cannot see where it sits. */
function Move({ business, of, id, what, label, name }: { business: string; of: "item" | "section"; id: string; what: "up" | "down" | "remove"; label: string; name: string }) {
  return (
    <ActionForm action={changeMenu} className="grid" quiet>
      <input type="hidden" name="business" value={business} />
      <input type="hidden" name="of" value={of} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="do" value={what} />
      <Submit className="btn btn-quiet btn-sm button-sm" busy={what === "remove" ? "Removing" : "Moving"}>
        {label}
        <span className="sr-only">: {name}</span>
      </Submit>
    </ActionForm>
  );
}

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, paid, food } = await ownBusiness(id);
  if (!paid || !food) notFound();
  const supabase = await db();
  const [{ data: sectionRows }, { data: itemRows }, shown] = await Promise.all([
    supabase.from("menu_sections").select("*").eq("business_id", b.id).order("position").order("created_at"),
    supabase.from("menu_items").select("*").eq("business_id", b.id).order("position").order("created_at"),
    owned(),
  ]);
  const sections = (sectionRows ?? []) as MenuSectionRow[];
  const items = (itemRows ?? []) as MenuItemRow[];
  const path = b.status === "live" ? shown.byId.get(b.id)?.path : undefined;
  // What a visitor is given today: the same read the public page makes, as someone not signed in.
  const seen = shown.byId.get(b.id)?.showcase?.menu ?? [];
  const seenItems = seen.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <PartHead id="menu" title="Menu" line="What you serve, in sections, with a price where you give one. It is shown on your page as you set it out here.">
          {path && (
            <a href={`${path}#menu`} className="btn btn-quiet btn-sm button-sm">
              See it on your page <Out />
            </a>
          )}
        </PartHead>
        {b.status !== "live" && <Notice className="mt-6">Your business is not live yet. The menu is kept, and shown when it is.</Notice>}
        {b.status === "live" && sections.length > 0 && (
          <p className="caption-1 mt-6 text-ink-faint" data-seen="menu">
            On your page now: {count(seen.length)} {seen.length === 1 ? "section" : "sections"}, {count(seenItems)} {seenItems === 1 ? "item" : "items"}.
          </p>
        )}

        {sections.length === 0 ? (
          <div className="mt-8">
            <Empty icon={<Plate />} title="No menu yet">
              Begin with a section, such as Starters or Drinks. Then add what is in it, with a price in rupees where you want one shown.
            </Empty>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-6">
              {sections.map((s, at) => {
                const inside = items.filter((i) => i.section_id === s.id);
                return (
                  <section key={s.id} aria-labelledby={`s-${s.id}`} className="card">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <h3 id={`s-${s.id}`} className="heading-3">
                        {s.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {at > 0 && <Move business={b.id} of="section" id={s.id} what="up" label="Up" name={`the section ${s.title}`} />}
                        {at < sections.length - 1 && <Move business={b.id} of="section" id={s.id} what="down" label="Down" name={`the section ${s.title}`} />}
                      </div>
                    </div>

                    {inside.length === 0 ? (
                      <p className="body-3 mt-3 text-ink-subtle">Nothing in this section yet.</p>
                    ) : (
                      <ul className="rows mt-4">
                        {inside.map((item, n) => (
                          <li key={item.id} className="row">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                              <p className="title-1">{item.name}</p>
                              <p className="data-1 whitespace-nowrap">{item.price_mur != null ? rupees(item.price_mur) : <span className="body-3 text-ink-faint">No price</span>}</p>
                            </div>
                            {item.description && <p className="body-3 mt-1 max-w-prose text-ink-subtle">{item.description}</p>}
                            <details className="mt-1">
                              <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                                Change<span className="sr-only">: {item.name}</span> <Chevron className="size-4" />
                              </summary>
                              <div className="mt-2 grid gap-4">
                                <ActionForm action={saveItem} className="grid gap-4">
                                  <input type="hidden" name="business" value={b.id} />
                                  <input type="hidden" name="section" value={s.id} />
                                  <input type="hidden" name="item" value={item.id} />
                                  <div className="grid gap-4 sm:grid-cols-3">
                                    <Field name="name" label="Name" defaultValue={item.name} className="sm:col-span-2" />
                                    <Field name="price" label="Price, in rupees" inputMode="numeric" data optional defaultValue={item.price_mur != null ? String(item.price_mur) : ""} />
                                  </div>
                                  <TextArea name="description" label="What it is" optional rows={2} maxLength={300} defaultValue={item.description} />
                                  <div>
                                    <Submit className="btn btn-quiet btn-sm button-sm">Save this item</Submit>
                                  </div>
                                </ActionForm>
                                <div className="flex flex-wrap gap-2">
                                  {n > 0 && <Move business={b.id} of="item" id={item.id} what="up" label="Up" name={item.name} />}
                                  {n < inside.length - 1 && <Move business={b.id} of="item" id={item.id} what="down" label="Down" name={item.name} />}
                                  <Move business={b.id} of="item" id={item.id} what="remove" label="Remove" name={item.name} />
                                </div>
                              </div>
                            </details>
                          </li>
                        ))}
                      </ul>
                    )}

                    <details className="mt-4" open={inside.length === 0}>
                      <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                        Add an item to {s.title} <Chevron className="size-4" />
                      </summary>
                      <div className="mt-2">
                        <ActionForm action={saveItem} className="grid gap-4">
                          <input type="hidden" name="business" value={b.id} />
                          <input type="hidden" name="section" value={s.id} />
                          <div className="grid gap-4 sm:grid-cols-3">
                            <Field name="name" label="Name" className="sm:col-span-2" autoComplete="off" />
                            <Field name="price" label="Price, in rupees" inputMode="numeric" data optional />
                          </div>
                          <TextArea name="description" label="What it is" optional rows={2} maxLength={300} />
                          <div>
                            <Submit className="btn btn-ink button-md" busy="Adding">
                              Add this item
                            </Submit>
                          </div>
                        </ActionForm>
                      </div>
                    </details>

                    <details className="mt-2">
                      <summary className="body-3 inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                        Rename or remove this section<span className="sr-only">: {s.title}</span> <Chevron className="size-4" />
                      </summary>
                      <div className="mt-2 grid gap-4">
                        <ActionForm action={saveSection} className="grid gap-4">
                          <input type="hidden" name="business" value={b.id} />
                          <input type="hidden" name="section" value={s.id} />
                          <Field name="title" label="Name of the section" defaultValue={s.title} />
                          <div>
                            <Submit className="btn btn-quiet btn-sm button-sm">Save the name</Submit>
                          </div>
                        </ActionForm>
                        <div>
                          <Move business={b.id} of="section" id={s.id} what="remove" label={inside.length ? "Remove the section and what is in it" : "Remove the section"} name={s.title} />
                        </div>
                      </div>
                    </details>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      <aside className="lg:col-span-4">
        <div className="card card-panel">
          <h3 className="heading-3">Add a section</h3>
          <div className="mt-4">
            <ActionForm action={saveSection}>
              <input type="hidden" name="business" value={b.id} />
              <Field name="title" label="Name of the section" hint="Starters, Mains, Drinks." autoComplete="off" />
              <div>
                <Submit className="btn btn-ink button-md" busy="Adding">
                  Add this section
                </Submit>
              </div>
            </ActionForm>
          </div>
        </div>
        <p className="caption-1 mt-4 text-ink-faint">Prices are yours to keep right. We show them as you give them and check none.</p>
      </aside>
    </div>
  );
}
