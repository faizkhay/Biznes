"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSaved } from "@/lib/saved";
import { Book, Bookmark, Glass, Pin, Store } from "./Icons";

const TABS = [
  { href: "/", label: "Search", icon: Glass },
  { href: "/directory", label: "Directory", icon: Store },
  { href: "/places", label: "Places", icon: Pin },
  { href: "/learn", label: "Learn", icon: Book },
  { href: "/saved", label: "Saved", icon: Bookmark },
] as const;

/** On a phone, the ways in: a bar at the foot of the screen, as in an app. A wide screen has them in the menu. */
export default function TabBar() {
  const pathname = usePathname();
  const saved = useSaved().length;
  const current = (href: string) => (href === "/" ? pathname === "/" || pathname === "/search" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Main" className="tabbar">
      {TABS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={current(href) ? "page" : undefined}>
          <Icon />
          {label}
          {href === "/saved" && saved > 0 && (
            <span className="badge" aria-hidden>
              {saved > 99 ? "99" : saved}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
