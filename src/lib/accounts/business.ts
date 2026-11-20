import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { PlanId } from "@/data/site";
import { index } from "@/lib/index";
import { UUID } from "./form";
import { db } from "./server";
import { requireViewer } from "./session";
import { planNow, type Business, type Viewer } from "./types";

/** A business with what its owner's pages need to know of it today. */
export type Mine = {
  viewer: Viewer;
  business: Business;
  /** The plan it is on today: a paid plan past its last day is free. */
  plan: PlanId;
  /** On Biznes Go or Biznes Grow today. */
  paid: boolean;
  /** On Biznes Grow today: it has bookings, customers, services and a ledger. */
  grow: boolean;
  /** A food outlet (the index's "eat" group): on a paid plan it may keep a menu. */
  food: boolean;
};

/**
 * The business at /dashboard/[id], for its owner: read once a request, however many parts of the
 * page ask. Anyone not signed in is sent to sign in; a business that is not the viewer's own is
 * not there, the same as an address that does not exist. The database gives an owner only their
 * own rows whatever is asked here.
 */
export const ownBusiness = cache(async (id: string): Promise<Mine> => {
  if (!UUID.test(id)) notFound();
  const viewer = await requireViewer(`/dashboard/${id}`);
  const supabase = await db();
  const { data } = await supabase.from("businesses").select("*").eq("id", id).eq("owner_id", viewer.id).maybeSingle();
  if (!data) notFound();
  const business = data as Business;
  const plan = planNow(business.plan, business.plan_until);
  return { viewer, business, plan, paid: plan !== "free", grow: plan === "grow", food: index().categoryById.get(business.category)?.group === "eat" };
});
