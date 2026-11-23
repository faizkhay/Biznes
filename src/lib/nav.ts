import { HOME } from "@/data/site";

/**
 * Where a visitor is, for a link in the menu: "page" when the link's address is the page itself,
 * "true" when the page lies beneath it (or beneath an address that belongs to the same way in),
 * and nothing otherwise. It is what `aria-current` takes, so a screen reader says the first as
 * "current page" and the second as "current", and the stylesheet lights both.
 */
export function mark(pathname: string, href: string, also: readonly string[] = []): "page" | "true" | undefined {
  const at = href.split("#")[0];
  if (pathname === at) return "page";
  return [at, ...also].some((under) => pathname === under || pathname.startsWith(`${under}/`)) ? "true" : undefined;
}

/**
 * The path to a page, as it is shown and as it is written out for machines. Its first step is
 * the Home page, by the name the menu gives it. A path that still begins at the landing page (an
 * older page's own, written when the first screen was the home) is led to the Home page here,
 * so no page has to be changed for its path to be right.
 */
export function trail<T extends { href?: string; label: string }>(path: T[]): (T | { href: string; label: string })[] {
  return path.map((step, i) => (i === 0 && step.href === "/" ? { href: HOME.href, label: HOME.label } : step));
}
