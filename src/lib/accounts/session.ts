import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { accountsOn } from "./config";
import { holdsSession } from "./cookies";
import { db } from "./server";
import { isRole, type Viewer } from "./types";

/**
 * Who is signed in, or null. Asked of Supabase Auth itself (`getUser`), never read from the cookie
 * alone, so a forged or revoked session is nobody. The role comes from the person's own profile,
 * read under row level security. It decides what a page shows; the database decides again, on its
 * own, what each request may do.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!accountsOn) return null;
  const store = await cookies();
  // No session cookie, nobody signed in: no need to ask.
  if (!store.getAll().some((c) => holdsSession(c.name))) return null;
  try {
    const supabase = await db();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const { data: profile } = await supabase.from("profiles").select("email, name, phone, role").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? profile?.email ?? "",
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      role: isRole(profile?.role) ? profile.role : "user",
    };
  } catch {
    return null;
  }
});

/** The address of the sign-in page that comes back to `next` afterwards. */
export const signInPath = (next: string) => `/account/sign-in?next=${encodeURIComponent(next)}`;

/** The viewer, or the sign-in page, which returns to `next`. */
export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(signInPath(next));
  return viewer;
}

/**
 * An admin or the superadmin. Anyone else who is signed in is told the page is not there, the same
 * as for an address that does not exist, so the admin pages do not confirm themselves to a stranger.
 */
export async function requireAdmin(next: string): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (viewer.role !== "admin" && viewer.role !== "superadmin") notFound();
  return viewer;
}

export async function requireSuperadmin(next: string): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (viewer.role !== "superadmin") notFound();
  return viewer;
}
