import { PageHead } from "@/components/Bits";
import SectionNav, { type Section } from "@/components/account/SectionNav";
import { VerifiedMark } from "@/components/Verified";
import { PLANS } from "@/data/site";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { STATUS_NAMES } from "@/lib/accounts/types";

/**
 * The head of every page of one business: its name, where it stands, and a bar of its parts. The
 * parts follow the plan it is on today. Bookings, customers, services and payments are Biznes
 * Grow's; its page and, for a food outlet, its menu come with Biznes Go; advertising is open to
 * any live business.
 */
export default async function BusinessLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  if (!accountsOn) return children;
  const { id } = await params;
  const { business: b, plan, paid, grow, food } = await ownBusiness(id);
  const supabase = await db();
  const { count: waiting } = grow ? await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("business_id", b.id).eq("status", "requested") : { count: 0 };
  const at = `/dashboard/${b.id}`;
  const sections: Section[] = [
    { href: at, label: "Overview" },
    ...(grow
      ? [
          { href: `${at}/bookings`, label: "Bookings", count: waiting ?? 0 },
          { href: `${at}/customers`, label: "Customers" },
          { href: `${at}/services`, label: "Services" },
          { href: `${at}/payments`, label: "Payments" },
        ]
      : []),
    ...(paid ? [{ href: `${at}/showcase`, label: "Its page" }] : []),
    ...(paid && food ? [{ href: `${at}/menu`, label: "Menu" }] : []),
    ...(b.status === "live" ? [{ href: `${at}/ads`, label: "Advertising" }] : []),
  ];
  return (
    <>
      <PageHead title={b.name} path={[{ href: "/dashboard", label: "Your businesses" }, { label: b.name }]}>
        <p className="caption-1 mt-4 flex flex-wrap items-center gap-2">
          <span className={`tag ${b.status === "live" ? "tag-lit" : ""}`}>{STATUS_NAMES[b.status]}</span>
          <span className="tag">{PLANS.find((p) => p.id === plan)?.name}</span>
          {b.verified && paid ? <VerifiedMark priority /> : b.status === "live" && <span className="tag">{b.listing_id ? "Claimed by its owner" : "Listed by its owner"}</span>}
        </p>
      </PageHead>
      <div className="shell">
        <SectionNav label="The parts of this business" sections={sections} />
      </div>
      {children}
    </>
  );
}
