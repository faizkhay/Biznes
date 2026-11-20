import type { Metadata } from "next";
import Link from "next/link";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { Arrow, Store } from "@/components/Icons";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS, PLANS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireViewer } from "@/lib/accounts/session";
import { planNow, STATUS_NAMES, type Business } from "@/lib/accounts/types";
import { index } from "@/lib/index";

export const metadata: Metadata = { title: "Your businesses", robots: { index: false, follow: false } };

const SAID: Record<string, string> = { removed: "The business has been taken out." };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ said?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const viewer = await requireViewer("/dashboard");
  const { said } = await searchParams;
  const supabase = await db();
  const { data } = await supabase.from("businesses").select("*").eq("owner_id", viewer.id).order("created_at", { ascending: false });
  const businesses = (data ?? []) as Business[];
  const ids = businesses.map((b) => b.id);
  const [{ data: asked }, { data: waiting }] = ids.length
    ? await Promise.all([
        supabase.from("plan_requests").select("business_id, plan").eq("status", "open").in("business_id", ids),
        supabase.from("bookings").select("business_id").eq("status", "requested").in("business_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const askedFor = new Map((asked ?? []).map((r) => [r.business_id as string, r.plan as string]));
  const toAnswer = new Map<string, number>();
  for (const b of waiting ?? []) toAnswer.set(b.business_id as string, (toAnswer.get(b.business_id as string) ?? 0) + 1);
  const { categoryById, placeBySlug } = index();
  const planName = (id: string) => PLANS.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <PageHead title="Your businesses" path={[{ href: "/account", label: "Your account" }, { label: "Your businesses" }]} lede="Every business you have listed or claimed, with where it stands. Open one to change its details, ask for a plan, or look after its bookings." />
      <div className="shell max-w-4xl">
        {said && SAID[said] && (
          <p role="status" className="note body-3 mb-8">
            {SAID[said]}
          </p>
        )}
        {businesses.length === 0 ? (
          <div className="card card-panel max-w-xl">
            <span className="tile-icon bg-paper">
              <Store />
            </span>
            <h2 className="heading-3 mt-4">Nothing listed yet</h2>
            <p className="body-2 mt-2 text-ink-subtle">List your business, or claim it if it is already in the directory. A basic listing is free for good.</p>
            <p className="mt-6">
              <Link prefetch={false} href="/dashboard/new" className="btn btn-filled button-md">
                {ACTIONS.list}
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6">
              <Link prefetch={false} href="/dashboard/new" className="btn btn-filled button-md">
                List another business
              </Link>
            </p>
            <ul className="rows">
              {businesses.map((b) => {
                const plan = planNow(b.plan, b.plan_until);
                const requests = toAnswer.get(b.id) ?? 0;
                const wants = askedFor.get(b.id);
                return (
                  <li key={b.id}>
                    <article className="row">
                      <p className="caption-1 flex flex-wrap items-center gap-2 text-ink-faint">
                        <span className={`tag ${b.status === "live" ? "tag-lit" : ""}`}>{STATUS_NAMES[b.status]}</span>
                        <span className="tag">{planName(plan)}</span>
                        {b.listing_id && b.status === "live" && plan === "free" && <span className="tag">Claimed by its owner</span>}
                      </p>
                      <h2 className="title-1 mt-2">
                        <Link prefetch={false} href={`/dashboard/${b.id}`} className="row-title">
                          {b.name}
                        </Link>
                        {b.verified && plan !== "free" && <VerifiedMark priority />}
                      </h2>
                      <p className="body-3 mt-0.5 text-ink-subtle">{[categoryById.get(b.category)?.one, placeBySlug.get(b.town)?.name].filter(Boolean).join(" · ")}</p>
                      {b.status_note && <p className="body-3 mt-2 max-w-prose">From us: {b.status_note}</p>}
                      {requests > 0 && (
                        <p className="body-3 mt-2 font-semibold">
                          {requests} {requests === 1 ? "booking request" : "booking requests"} to answer
                        </p>
                      )}
                      {wants && <p className="body-3 mt-2 text-ink-subtle">You asked for {planName(wants)}. We will contact you to arrange payment.</p>}
                      {b.status === "live" && plan === "free" && !wants && (
                        <p className="body-3 mt-2">
                          <Link prefetch={false} href={`/dashboard/${b.id}#plan`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-link">
                            Ask for Biznes Go or Biznes Grow <Arrow className="size-4" />
                          </Link>
                        </p>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
