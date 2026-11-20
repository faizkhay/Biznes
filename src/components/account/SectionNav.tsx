"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Section = { href: string; label: string; count?: number };

/**
 * The parts of a business an owner looks after, or of the admin's work, as a bar of pills: the
 * site's own tabs. The part being read is filled with ink. On a phone the bar scrolls sideways.
 */
export default function SectionNav({ label, sections }: { label: string; sections: Section[] }) {
  const pathname = usePathname();
  // The longest address that fits is the part being read: "/dashboard/x/ads" before "/dashboard/x".
  const here = [...sections].sort((a, b) => b.href.length - a.href.length).find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))?.href;
  return (
    <nav aria-label={label} className="tabs mb-8">
      {sections.map((s) => (
        <Link key={s.href} prefetch={false} href={s.href} aria-current={s.href === here ? "page" : undefined} className="tab title-2">
          {s.label}
          {s.count ? <span className="n data-2">{s.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
