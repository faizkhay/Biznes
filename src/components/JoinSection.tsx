import Link from "next/link";
import SubscribeForm from "@/components/account/SubscribeForm";
import { PUBLICATIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import { monthName, products } from "@/lib/shop";
import { Arrow } from "./Icons";

/**
 * The list for the monthly Pocket Guide and the magazine, as a section of its own between the
 * page and the footer (the owner, 24 November 2026: "a proper section on its own, a creative box,
 * like add a mockup image of the monthly release").
 *
 * The mock-up is not made up: it is this month's edition itself, its cover with two of its own
 * pages fanned behind it, the three pictures `npm run pdf` writes for the page that sells it. The
 * disc behind them is the lit point of the b, large. The form is the accounts' own; with accounts
 * off there is none, and the section is the edition and the way to its page. Before any edition
 * has been made there is nothing to show, and nothing is drawn.
 */
export default function JoinSection() {
  const guide = products()[0];
  if (!guide?.built) return null;
  const edition = monthName(guide.built.edition);
  return (
    <section className="join" aria-labelledby="join-title">
      <div className="join-in shell">
        <div className="join-pages">
          <img src={`/shop/${guide.slug}-sample.jpg`} alt="" width={560} height={794} loading="lazy" decoding="async" />
          <img src={`/shop/${guide.slug}-opener.jpg`} alt="" width={560} height={794} loading="lazy" decoding="async" />
          <img src={`/shop/${guide.slug}-cover.jpg`} alt={`The cover of the ${guide.title}, ${edition} edition.`} width={560} height={794} loading="lazy" decoding="async" />
        </div>
        <div className="min-w-0">
          <p className="label-1 tag tag-lit">{edition} edition</p>
          <h2 id="join-title" className="heading-2 mt-4">
            The {PUBLICATIONS.guide.short} and the {PUBLICATIONS.magazine.short}, by email
          </h2>
          <p className="body-2 mt-3 max-w-prose text-ink-subtle">Be sent each edition of the guide when it comes out, and the magazine when it begins. {PUBLICATIONS.magazine.line}</p>
          {accountsOn && <SubscribeForm compact className="mt-6 max-w-xl" />}
          <p className="mt-6">
            <Link href={PUBLICATIONS.guide.href} prefetch={false} className={`btn button-md ${accountsOn ? "btn-quiet" : "btn-ink"}`}>
              See this month&rsquo;s edition
              <span className="btn-dot">
                <Arrow />
              </span>
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
