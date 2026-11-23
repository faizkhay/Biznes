import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { Chevron } from "@/components/Icons";
import { ABOUT, ACTIONS, MENU, MENU_LABELS, MORE_PAGE, YOURS, site } from "@/data/site";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: `Every page of ${site.name}`,
  description: `Every page of ${site.name} in one list: the directory, where to eat, the numbers to call, articles and tools, your shortlist, and the pages for a business.`,
  path: MORE_PAGE.href,
  index: false,
});

/**
 * The page of every page. It is what the last tab of the phone's bar opens, and what the header's
 * "More" ends on: each page the site has a name for, once, under the heading it belongs to, with
 * a line that says what is behind it. A page and not a list that opens over another, so it works
 * with no script, the back button leaves it, and a screen reader meets it as any other page.
 */
export default function MorePage() {
  const groups = [...MENU.map((group) => ({ label: group.label, items: [...group.items] })), { label: MENU_LABELS.yours, items: [...YOURS] }, { label: MENU_LABELS.about, items: [...ABOUT] }];
  return (
    <>
      <PageHead here={MORE_PAGE.href} title={MORE_PAGE.title} lede={MORE_PAGE.lede} />
      <div className="shell pb-16">
        <nav aria-label="Every page" className="more-groups">
          {groups.map((group) => {
            const id = `more-${group.label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
            return (
              <section key={group.label} aria-labelledby={id}>
                <h2 id={id} className="heading-3">
                  {group.label}
                </h2>
                <ul className="more-list">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} prefetch={false} className="more-link">
                        <span>
                          <span className="title-1 block">{item.label}</span>
                          <span className="body-3 block text-ink-subtle">{item.line}</span>
                        </span>
                        <Chevron />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>
        {/* On a phone the header has no room for the way to list a business, so it is offered here. */}
        <p className="mt-12">
          <Link href="/pricing" className="btn btn-ink button-md">
            {ACTIONS.list}
          </Link>
        </p>
      </div>
    </>
  );
}
