import { ACTIONS } from "@/data/site";
import type { Owned } from "@/lib/accounts/owned";
import { duration, mauritiusToday, rupees } from "@/lib/accounts/types";
import { requestBooking } from "@/app/biz/actions";
import { ActionForm, Field, Select, Submit, TextArea, Trap } from "./Form";

/**
 * Ask a business on Biznes Grow for a booking: a service if it lists any, a day, a time, a name and
 * a telephone number. It sends a request, and says so: nothing is booked until the business
 * confirms, and nothing is paid here.
 */
export default function BookingForm({ business }: { business: Pick<Owned, "id" | "name" | "services"> }) {
  const today = mauritiusToday();
  // A booking is for something done: a product is bought, not booked.
  const services = business.services.filter((s) => s.kind !== "product");
  return (
    <ActionForm action={requestBooking}>
      <input type="hidden" name="business" value={business.id} />
      {services.length > 0 && (
        <Select
          name="service"
          label="What for"
          optional
          empty="Not sure yet"
          choices={services.map((s) => ({ value: s.id, label: [s.name, s.price != null ? rupees(s.price) : "", s.minutes ? duration(s.minutes) : ""].filter(Boolean).join(", ") }))}
        />
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="date" label="Day" type="date" min={today} data />
        <Field name="time" label="Time" type="time" data hint="Mauritius time." />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="name" label="Your name" autoComplete="name" />
        <Field name="phone" label="Phone or WhatsApp number" type="tel" autoComplete="tel" inputMode="tel" data />
      </div>
      <TextArea name="note" label="Anything the business should know" optional rows={3} maxLength={500} />
      <Trap />
      <div>
        <Submit busy="Sending">{ACTIONS.book}</Submit>
        <p className="caption-1 mt-3 max-w-prose text-ink-faint">
          This sends a request to {business.name}, with your name and number. It is not a booking until they confirm it with you. You pay the business directly: biznes.mu takes no payment.
        </p>
      </div>
    </ActionForm>
  );
}
