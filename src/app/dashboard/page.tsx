import type { Metadata } from "next";
import Link from "next/link";
import { Empty, Notice } from "@/components/account/Bits";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { CategoryIcon } from "@/components/Glyphs";
import { Arrow, Store } from "@/components/Icons";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireViewer } from "@/lib/accounts/session";
import { planNow, STATUS_NAMES, type Business } from "@/lib/accounts/types";
import { count, day } from "@/lib/format";
import { index } from "@/lib/index";

export const metadata: Metadata = { title: "Your businesses", robots: { index: false, follow: false } };

const SAID: Record<string, string> = { removed: "The business has been taken out." };
const planName = (id: string) => PLANS.find((p) => p.id === id)?.name ?? id;

/** The one thing to do next for a business, in a sentence, and where it is done. */
type Next = { says: string; href?: string; does?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const viewer = await requireViewer("/dashboard");
  const { said } = await searchParams;
  const supabase = await db();
  const { data } = await supabase.from("businesses").select("*").eq("owner_id", viewer.id).order("created_at", { ascending: false });
  const businesses = (data ?? []) as Business[];
  const ids = businesses.map((b) => b.id);
  const [{ data: asked }, { data: waiting }, { data: pages }] = ids.length
    ? await Promise.all([
        supabase.from("plan_requests").select("business_id, plan").eq("status", "open").in("business_id", ids),
        supabase.from("bookings").select("business_id").eq("status", "requested").in("business_id", ids),
        supabase.from("showcases").select("business_id, cover, photos").in("business_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const askedFor = new Map((asked ?? []).map((r) => [r.business_id as string, r.plan as string]));
  const toAnswer = new Map<string, number>();
  for (const b of waiting ?? []) toAnswer.set(b.business_id as string, (toAnswer.get(b.business_id as string) ?? 0) + 1);
  const pictured = new Set((pages ?? []).filter((p) => p.cover || (p.photos as string[]).length).map((p) => p.business_id as string));
  const { categoryById, placeBySlug } = index();

  function nextFor(b: Business): Next {
    const at = `/dashboard/${b.id}`;
    const plan = planNow(b.plan, b.plan_until);
    const requests = toAnswer.get(b.id) ?? 0;
    const wants = askedFor.get(b.id);
    if (b.status === "pending") return { says: "A person is checking it, usually within a working day. Nothing to do until then." };
    if (b.status === "rejected") return { says: "We could not accept it as it is. Change its details and it comes back to us.", href: `${at}#details`, does: "Change its details" };
    if (b.status === "suspended") return { says: "It is off the site for now. Write to us to put it right." };
    if (plan === "grow" && requests) return { says: `${count(requests)} ${requests === 1 ? "booking request is" : "booking requests are"} waiting for your answer.`, href: `${at}/bookings`, does: "Answer them" };
    if (wants) return { says: wants === "free" ? "You asked to stop the plan at the end of its period. We will confirm it." : `You asked for ${planName(wants)}. We will contact you to arrange payment.` };
    if (b.plan !== "free" && plan === "free") return { says: `${planName(b.plan)} ended${b.plan_until ? ` on ${day(b.plan_until)}` : ""}. Ask for it again to have it back.`, href: `${at}#plan`, does: "See its plan" };
    if (plan === "free") return { says: "It is live on Biznes Free. A paid plan puts it first among equal answers and gives it a fuller page.", href: `${at}#plan`, does: "See the plans" };
    if (!pictured.has(b.id)) return { says: "Its page has no pictures yet. Add a cover and a few photographs.", href: `${at}/showcase`, does: "Add pictures" };
    return { says: "Nothing is waiting. It is live and up to date." };
  }

  return (
    <>
      <PageHead title="Your businesses" path={[{ href: "/account", label: "Your account" }, { label: "Your businesses" }]} lede="Every business you have listed or claimed, the plan it is on, and the next thing to do for it.">
        {businesses.length > 0 && (
          <p className="mt-6">
            <Link prefetch={false} href="/dashboard/new" className="btn btn-filled button-md">
              List another business
            </Link>
          </p>
        )}
      </PageHead>
      <div className="shell">
        {said && SAID[said] && <Notice className="mb-8 max-w-xl">{SAID[said]}</Notice>}
        {businesses.length === 0 ? (
          <Empty
            icon={<Store />}
            title="Nothing listed yet"
            action={
              <Link prefetch={false} href="/dashboard/new" className="btn btn-filled button-md">
                {ACTIONS.list}
              </Link>
            }
          >
            List your business, or claim it if it is already in the directory. A basic listing is free for good.
          </Empty>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {businesses.map((b) => {
              const plan = planNow(b.plan, b.plan_until);
              const next = nextFor(b);
              const kind = categoryById.get(b.category);
              const at = `/dashboard/${b.id}`;
              return (
                <li key={b.id}>
                  <article className="card flex h-full flex-col">
                    <div className="flex items-start gap-4">
                      <span className="tile-icon" aria-hidden>
                        <CategoryIcon id={kind?.id} group={kind?.group} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="title-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link prefetch={false} href={at} className="row-title">
                            {b.name}
                          </Link>
                          {b.verified && plan !== "free" && <VerifiedMark priority />}
                        </h2>
                        <p className="body-3 mt-0.5 text-ink-subtle">{[kind?.one, placeBySlug.get(b.town)?.name].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <p className="caption-1 mt-4 flex flex-wrap items-center gap-2">
                      <span className={`tag ${b.status === "live" ? "tag-lit" : ""}`}>{STATUS_NAMES[b.status]}</span>
                      <span className="tag">
                        {planName(plan)}
                        {plan !== "free" && b.plan_until ? `, to ${day(b.plan_until)}` : ""}
                      </span>
                      {b.listing_id && b.status === "live" && plan === "free" && <span className="tag">Claimed by its owner</span>}
                    </p>
                    {b.status_note && <p className="body-3 mt-3 max-w-prose">From us: {b.status_note}</p>}
                    <div className="note mt-4 grow">
                      <p className="label-1 text-ink-faint">Next</p>
                      <p className="body-3 mt-1">{next.says}</p>
                      {next.href && (
                        <p className="body-3 mt-1">
                          <Link prefetch={false} href={next.href} className="inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                            {next.does} <Arrow className="size-4" />
                          </Link>
                        </p>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
