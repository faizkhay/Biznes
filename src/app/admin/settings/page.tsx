import type { Metadata } from "next";
import AdminNav from "@/components/account/AdminNav";
import { ActionForm, Field, Select, Submit } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import { PageHead } from "@/components/Bits";
import { PICTURES } from "@/data/themes";
import { accountsOn } from "@/lib/accounts/config";
import { db } from "@/lib/accounts/server";
import { requireSuperadmin } from "@/lib/accounts/session";
import { when } from "@/lib/accounts/types";
import { isPicture, themeFor } from "@/lib/theme";
import { saveLook } from "../actions";

export const metadata: Metadata = { title: "The look", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  if (!accountsOn) return <AccountsSoon title="The look" />;
  const viewer = await requireSuperadmin("/admin/settings");
  const supabase = await db();
  const { data: row } = await supabase.from("site_settings").select("picture, greeting, updated_at").limit(1).maybeSingle();
  // What the calendar gives today, with nothing chosen by hand.
  const calendar = themeFor();
  const pictures = (Object.keys(PICTURES) as (keyof typeof PICTURES)[]).map((id) => ({ value: id, label: PICTURES[id].label }));

  return (
    <>
      <PageHead title="The look" path={[{ href: "/admin", label: "Admin" }, { label: "The look" }]} lede="The picture behind every page and the greeting on the first screen follow the calendar: the season, and the public holidays. Set either by hand here, or hand it back." />
      <div className="shell">
        <AdminNav role={viewer.role} current="/admin/settings" />
        <div className="max-w-xl">
          <ActionForm action={saveLook}>
            <Select
              name="picture"
              label="The picture"
              empty={`By the calendar (today: ${PICTURES[calendar.picture].label})`}
              choices={pictures}
              defaultValue={isPicture(row?.picture) ? row.picture : ""}
              hint="A picture chosen here stays until you hand it back to the calendar."
            />
            <Field name="greeting" label="The greeting" optional defaultValue={row?.greeting ?? ""} hint={`Up to 60 characters. Leave it empty for the calendar's: today, “${calendar.greeting}”.`} />
            <div>
              <Submit>Save the look</Submit>
            </div>
          </ActionForm>
          {row?.updated_at && (row.picture || row.greeting) && <p className="caption-1 mt-6 text-ink-faint">Last changed {when(row.updated_at)}. The change is on the record.</p>}
        </div>
      </div>
    </>
  );
}
