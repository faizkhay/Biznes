import type { EmailOtpType } from "@supabase/supabase-js";

/** The kinds of emailed link the site understands (src/app/auth). */
export const LINK_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** What a link's token may look like. Anything else is not sent on to be checked. */
export const LINK_TOKEN = /^[A-Za-z0-9_-]{8,200}$/;
