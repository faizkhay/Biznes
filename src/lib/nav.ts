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
