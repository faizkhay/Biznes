import Link from "next/link";
import { PageHead } from "@/components/Bits";
import { ACTIONS } from "@/data/site";

/**
 * What an account page shows while accounts are off (src/lib/accounts/config.ts): a calm note, and
 * the way that works today.
 */
export default function AccountsSoon({ title = "Your account" }: { title?: string }) {
  return (
    <>
      <PageHead title={title} path={[{ label: title }]} />
      <div className="shell">
        <div className="card card-panel max-w-xl">
          <h2 className="heading-3">Accounts open soon</h2>
          <p className="body-2 mt-2 text-ink-subtle">Signing in, listing a business yourself and taking bookings are on their way. Until then, tell us about a business and a person will add it or put it right.</p>
          <p className="mt-6 flex flex-wrap gap-3">
            <Link href="/add" className="btn btn-filled button-md">
              {ACTIONS.add}
            </Link>
            <Link href="/pricing" className="btn btn-quiet button-md">
              {ACTIONS.list}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
