/**
 * Accounts: sign in, owners' businesses, bookings, the admin pages. They run on a Supabase project
 * (Auth and Postgres), and they are on only when the site is told which one, by two variables:
 *
 *   NEXT_PUBLIC_SUPABASE_URL        the project's address
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY   its publishable (anon) key
 *
 * With either missing, accounts are off: the site builds and behaves as it did before they
 * existed, and each account page says "Accounts open soon". The key is safe in a browser because
 * every privilege is decided in the database (supabase/migrations); there is no service-role key
 * anywhere in this site.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const accountsOn = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** The cookie the session is kept in. It is HttpOnly: no script on a page can read it. */
export const AUTH_COOKIE = "biznes-auth";
/** A second cookie that says only "someone is signed in", for the header to read. It holds nothing else. */
export const SIGNED_IN_COOKIE = "biznes-in";

/** The tags the cached public reads carry, so an admin's action can make them fresh at once. */
export const TAG_OWNED = "biznes-owned";
export const TAG_SETTINGS = "biznes-settings";
export const TAG_ADS = "biznes-ads";

/** The one bucket of Supabase Storage every uploaded picture is kept in. Anyone may look in it. */
export const MEDIA_BUCKET = "media";
/** The address of a picture in the bucket, from its path there ("business/<id>/cover-1.jpg"). */
export const mediaUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
/** What may be uploaded: a JPEG, a PNG or a WebP of three megabytes at most. The bucket enforces the same. */
export const PICTURE_BYTES = 3 * 1024 * 1024;
export const PICTURE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const PICTURE_RULE = "A JPEG, PNG or WebP picture, 3 MB at most.";

/** How long a public read is kept, in seconds. */
export const KEEP = 300;
