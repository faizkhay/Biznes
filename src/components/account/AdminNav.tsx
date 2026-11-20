import Link from "next/link";
import type { Role } from "@/lib/accounts/types";

const PAGES: { href: string; label: string; only?: Role }[] = [
  { href: "/admin", label: "Businesses" },
  { href: "/admin/ads", label: "Advertisements" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/leads", label: "No website" },
  { href: "/admin/people", label: "People", only: "superadmin" },
  { href: "/admin/settings", label: "The look", only: "superadmin" },
];

/** The admin's pages, as tabs. The two that are the superadmin's alone are shown only to them. */
export default function AdminNav({ role, current }: { role: Role; current: string }) {
  return (
    <nav aria-label="Admin" className="tabs mb-8">
      {PAGES.filter((p) => !p.only || p.only === role).map((p) => (
        <Link prefetch={false} key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined} className="tab title-2">
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
