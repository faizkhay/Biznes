import Link from "next/link";
import { VerifiedMark } from "@/components/Verified";
import { ACTIONS } from "@/data/site";
import { accountsOn } from "@/lib/accounts/config";
import type { Owned } from "@/lib/accounts/owned";
import { shortUrl, telHref } from "@/lib/format";
import OwnedExtras from "./OwnedExtras";

/**
 * What a listing from the open index gains from its owner. Unclaimed, a quiet way to claim it.
 * Claimed, and the claim approved by an admin: the owner's own details, which are newer than the
 * map's, and on Biznes Grow the services and the way to ask for a booking.
 *
 * The mark follows one rule everywhere. A business on Biznes Go or Biznes Grow that an admin has
 * verified carries the vivid mark, with the words that say it is shown first. A claimed listing on
 * the free plan carries the quiet words "Claimed by its owner", and never the vivid mark.
 */
export default function ListingClaim({ listing, claim }: { listing: { id: string; name: string }; claim?: Owned }) {
  if (!accountsOn) return null;
  if (!claim) {
    return (
      <p className="body-3 mt-8 text-ink-subtle">
        Is this your business?{" "}
        <Link prefetch={false} href={`/dashboard/new?listing=${listing.id}`} className="text-link">
          {ACTIONS.claim}
        </Link>
        . It is free.
      </p>
    );
  }
  const details = claim.about || claim.phone || claim.website || claim.address;
  return (
    <>
      <section aria-labelledby="owner" className="mt-10">
        <h2 id="owner" className="heading-3">
          From its owner
        </h2>
        <p className="mt-3">{claim.paid ? <VerifiedMark size="lg" priority /> : <span className="tag caption-1">Claimed by its owner</span>}</p>
        {claim.paid && (
          <p className="body-3 mt-3 max-w-prose text-ink-subtle">
            We have checked that this business is real. It is on a paid plan, so it is shown before others that answer a search, and it is marked wherever it is. <Link href="/pricing">What paying changes, and what it does not</Link>.
          </p>
        )}
        {details ? (
          <>
            {claim.about && <p className="body-2 measure mt-4 whitespace-pre-line">{claim.about}</p>}
            <dl className="facts body-3 mt-4">
              {claim.address && (
                <>
                  <dt>Address</dt>
                  <dd>{claim.address}</dd>
                </>
              )}
              {claim.phone && (
                <>
                  <dt>Telephone</dt>
                  <dd className="data-1">
                    <a href={telHref(claim.phone)} className="inline-flex min-h-11 items-center whitespace-nowrap">
                      {claim.phone}
                    </a>
                  </dd>
                </>
              )}
              {claim.website && (
                <>
                  <dt>Website</dt>
                  <dd>
                    <a href={claim.website} rel="noopener nofollow" className="data-1 break-all">
                      {shortUrl(claim.website)}
                    </a>
                  </dd>
                </>
              )}
            </dl>
            <p className="caption-1 mt-2 max-w-prose text-ink-faint">In the words of the business, which has claimed this listing. Where they differ from the map&rsquo;s above, these are the newer.</p>
          </>
        ) : (
          <p className="body-3 mt-3 max-w-prose text-ink-subtle">The business has claimed this listing and has not changed its details.</p>
        )}
      </section>
      <OwnedExtras business={claim} />
    </>
  );
}
