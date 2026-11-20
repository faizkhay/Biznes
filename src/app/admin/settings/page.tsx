import type { Metadata } from "next";
import AdminNav from "@/components/account/AdminNav";
import { Notice, PartHead, Stat, Stats } from "@/components/account/Bits";
import { ActionForm, Chips, Field, Select, Submit, Ticks } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import UploadForm from "@/components/account/Upload";
import { PageHead } from "@/components/Bits";
import { PICTURES } from "@/data/themes";
import { accountsOn, mediaUrl } from "@/lib/accounts/config";
import { PICTURE_SAYS, type PictureProblem } from "@/lib/accounts/media";
import { db } from "@/lib/accounts/server";
import { requireSuperadmin } from "@/lib/accounts/session";
import { when } from "@/lib/accounts/types";
import { themeFor, themeNow } from "@/lib/theme";
import { removeSitePicture, saveLook } from "../actions";

export const metadata: Metadata = { title: "The look", robots: { index: false, follow: false } };

const MODES = [
  { value: "calendar", label: "By the calendar" },
  { value: "fixed", label: "One picture" },
  { value: "rotation", label: "A round, a new one each day" },
];
const MODE_NAMES: Record<string, string> = { calendar: "By the calendar", fixed: "One picture, fixed", rotation: "A round of pictures" };

type Uploaded = { id: string; path: string; label: string; created_at: string };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ said?: string; problem?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="The look" />;
  const viewer = await requireSuperadmin("/admin/settings");
  const { said, problem } = await searchParams;
  const supabase = await db();
  const [{ data: row }, { data: uploadedRows }, now] = await Promise.all([
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    supabase.from("site_pictures").select("id, path, label, created_at").order("created_at"),
    themeNow(),
  ]);
  const uploaded = (uploadedRows ?? []) as Uploaded[];
  // What the calendar gives today, with nothing chosen by hand.
  const calendar = themeFor();
  const builtIn = (Object.keys(PICTURES) as (keyof typeof PICTURES)[]).map((id) => ({ value: id as string, label: PICTURES[id].label }));
  const own = uploaded.map((u) => ({ value: u.id, label: u.label }));
  const mode: string = row?.mode ?? (row?.picture ? "fixed" : "calendar");
  const round: string[] = row?.pictures ?? [];
  const showing = now.chosen ? ([...builtIn, ...own].find((p) => p.value === now.chosen)?.label ?? "A picture") : PICTURES[now.picture].label;
  const wrong = problem === "label" ? "Give the picture a name first." : problem && problem in PICTURE_SAYS ? PICTURE_SAYS[problem as PictureProblem] : undefined;

  return (
    <>
      <PageHead title="The look" path={[{ href: "/admin", label: "Admin" }, { label: "The look" }]} lede="The picture behind every page, and the greeting on the first screen. Leave them to the calendar, keep one picture, or set a round of pictures that changes each day. Add pictures of your own below." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/settings" />
        <Stats>
          <Stat label="Showing today" figure={<span className="heading-3">{showing}</span>} note={now.holiday ? `For ${now.holiday}.` : undefined} />
          <Stat label="How it is chosen" figure={<span className="heading-3">{MODE_NAMES[mode]}</span>} note={mode === "rotation" ? `${round.length} in the round.` : undefined} />
          <Stat label="The calendar gives" figure={<span className="heading-3">{PICTURES[calendar.picture].label}</span>} note={`“${calendar.greeting}”`} />
          <Stat label="Pictures" figure={builtIn.length + uploaded.length} note={`${builtIn.length} built in, ${uploaded.length} of your own.`} href="#pictures" />
        </Stats>

        <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-12">
          <section aria-labelledby="choose" className="lg:col-span-6">
            <PartHead id="choose" title="How the picture is chosen" />
            <div className="card mt-6">
              <ActionForm action={saveLook}>
                <Chips name="mode" legend="Choose the picture" choices={MODES} defaultValue={mode} />
                <Select
                  name="picture"
                  label="The one picture"
                  empty="None chosen"
                  groups={[{ label: "Built in", choices: builtIn }, ...(own.length ? [{ label: "Your own", choices: own }] : [])]}
                  defaultValue={row?.picture ?? ""}
                  hint="Used when you choose one picture. It stays until you change it."
                />
                <Ticks name="pictures" legend="The round" hint="Used when you choose a round: tick two or more. They take turns, a new one each day, the same for every visitor." choices={[...builtIn, ...own]} defaultValue={round} />
                <Field name="greeting" label="The greeting" optional defaultValue={row?.greeting ?? ""} hint={`Up to 60 characters. Leave it empty for the calendar's: today, “${calendar.greeting}”.`} />
                <div>
                  <Submit>Save the look</Submit>
                </div>
              </ActionForm>
            </div>
            {row?.updated_at && <p className="caption-1 mt-4 text-ink-faint">Last changed {when(row.updated_at)}. Every change is on the record.</p>}
          </section>

          <section aria-labelledby="pictures" className="scroll-mt-24 lg:col-span-6">
            <PartHead id="pictures" title="The pictures" line="The four the site is built with, and any you have added. A picture of your own is shown as it is, at one size, on a phone and on a desk." />
            {said === "picture" && <Notice className="mt-6">The picture is added. Choose it on the left to use it.</Notice>}
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {builtIn.map((p) => (
                <li key={p.value} className="grid content-start gap-2">
                  <img src={PICTURES[p.value as keyof typeof PICTURES].small} alt="" className="thumb" loading="lazy" decoding="async" />
                  <p className="body-3">
                    {p.label} <span className="tag caption-1 ml-1">Built in</span>
                  </p>
                </li>
              ))}
              {uploaded.map((u) => (
                <li key={u.id} className="grid content-start gap-2">
                  <img src={mediaUrl(u.path)} alt="" className="thumb" loading="lazy" decoding="async" />
                  <p className="body-3">{u.label}</p>
                  <ActionForm action={removeSitePicture} className="grid" quiet>
                    <input type="hidden" name="picture" value={u.id} />
                    <div>
                      <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                        Remove<span className="sr-only">: {u.label}</span>
                      </Submit>
                    </div>
                  </ActionForm>
                </li>
              ))}
            </ul>
            <div className="card card-panel mt-6">
              <h3 className="heading-3">Add a picture</h3>
              <div className="mt-4">
                <UploadForm to="/admin/settings/upload" label="The picture" button="Add this picture" problem={wrong} hint="A wide picture, at least 1,600 pixels across. A JPEG, PNG or WebP, 3 MB at most. Use one that is yours to use.">
                  <div>
                    <label htmlFor="picture-label" className="title-2 block">
                      A name for it
                    </label>
                    <input id="picture-label" name="label" type="text" required maxLength={60} className="field mt-2" />
                  </div>
                </UploadForm>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
