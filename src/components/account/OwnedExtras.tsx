import { ACTIONS } from "@/data/site";
import type { Owned } from "@/lib/accounts/owned";
import { duration, rupees } from "@/lib/accounts/types";
import BookingForm from "./BookingForm";

/** What Biznes Grow adds to a business's page: what it sells, and a way to ask for a booking. */
export default function OwnedExtras({ business: b }: { business: Owned }) {
  if (!b.books) return null;
  return (
    <>
      {b.services.length > 0 && (
        <section aria-labelledby="services" className="mt-10">
          <h2 id="services" className="heading-3">
            Services
          </h2>
          <ul className="rows mt-4">
            {b.services.map((s) => (
              <li key={s.id}>
                <div className="row flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <div className="min-w-0">
                    <h3 className="title-1">{s.name}</h3>
                    {s.description && <p className="body-3 mt-0.5 max-w-prose text-ink-subtle">{s.description}</p>}
                  </div>
                  <p className="data-1 whitespace-nowrap">{[s.price != null ? rupees(s.price) : "", s.minutes ? duration(s.minutes) : ""].filter(Boolean).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="caption-1 mt-3 text-ink-faint">Prices are the business&rsquo;s own, in Mauritian rupees.</p>
        </section>
      )}
      {b.juiceNumber && (
        <section aria-labelledby="pay" className="mt-10">
          <h2 id="pay" className="heading-3">
            How to pay
          </h2>
          <p className="body-2 mt-3 max-w-prose">
            Pay by MCB Juice to <span className="data-1 whitespace-nowrap">{b.juiceNumber}</span>, in the name of {b.juiceName}.
          </p>
          <p className="caption-1 mt-2 max-w-prose text-ink-faint">These are the business&rsquo;s own details. You pay the business directly: biznes.mu takes no part in the payment, and cannot return one.</p>
        </section>
      )}
      <section aria-labelledby="book" className="mt-10">
        <h2 id="book" className="heading-3">
          {ACTIONS.book}
        </h2>
        <div className="card mt-4">
          <BookingForm business={b} />
        </div>
      </section>
    </>
  );
}
