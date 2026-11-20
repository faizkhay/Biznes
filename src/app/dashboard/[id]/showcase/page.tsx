import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice, PartHead } from "@/components/account/Bits";
import { ActionForm, Field, Submit, TextArea } from "@/components/account/Form";
import AccountsSoon from "@/components/account/Soon";
import UploadForm from "@/components/account/Upload";
import { Out } from "@/components/Icons";
import { ownBusiness } from "@/lib/accounts/business";
import { accountsOn, mediaUrl } from "@/lib/accounts/config";
import { PICTURE_SAYS, type PictureProblem } from "@/lib/accounts/media";
import { owned } from "@/lib/accounts/owned";
import { db } from "@/lib/accounts/server";
import type { ShowcaseRow } from "@/lib/accounts/types";
import { changePicture, saveShowcase } from "../../page-actions";

export const metadata: Metadata = { title: "Its page", robots: { index: false, follow: false } };

const PHOTOS = 8;
const SAID: Record<string, string> = { cover: "The cover is on your page.", photo: "The photograph is on your page." };
/** What an upload answered, in words. */
const problemSays = (problem?: string) => (problem === "full" ? "Your page holds eight photographs. Remove one to add another." : problem && problem in PICTURE_SAYS ? PICTURE_SAYS[problem as PictureProblem] : undefined);

export default async function ShowcasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ said?: string; problem?: string; at?: string }> }) {
  if (!accountsOn) return <AccountsSoon title="Your businesses" />;
  const { id } = await params;
  const { business: b, paid } = await ownBusiness(id);
  if (!paid) notFound();
  const { said, problem, at } = await searchParams;
  const supabase = await db();
  const [{ data }, shown] = await Promise.all([supabase.from("showcases").select("*").eq("business_id", b.id).maybeSingle(), owned()]);
  const page = data as ShowcaseRow | null;
  const photos = page?.photos ?? [];
  const path = b.status === "live" ? shown.byId.get(b.id)?.path : undefined;
  const upload = `/dashboard/${b.id}/showcase/upload`;
  const wrong = problemSays(problem);

  return (
    <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <PartHead id="its-page" title="Its page" line="What your plan adds to your page on biznes.mu: a line of your own under the name, your opening hours, a cover and up to eight photographs.">
          {path && (
            <a href={path} className="btn btn-quiet btn-sm button-sm">
              See your page <Out />
            </a>
          )}
        </PartHead>
        {said && SAID[said] && <Notice className="mt-6">{SAID[said]}</Notice>}
        {b.status !== "live" && <Notice className="mt-6">Your business is not live yet. What you put here is kept, and shown when it is.</Notice>}

        <section aria-labelledby="words" className="card mt-6">
          <h3 id="words" className="heading-3">
            Your words
          </h3>
          <div className="mt-4">
            <ActionForm action={saveShowcase}>
              <input type="hidden" name="business" value={b.id} />
              <Field name="tagline" label="A line under your name" optional defaultValue={page?.tagline ?? ""} hint="What you would say first to a customer. 120 characters at most." />
              <TextArea name="hours" label="Opening hours" optional rows={7} maxLength={1200} defaultValue={(page?.hours ?? []).join("\n")} hint="A line a day, in your own words: Monday to Friday, 9 am to 5 pm." />
              <div>
                <Submit className="btn btn-ink button-md">Save your words</Submit>
              </div>
            </ActionForm>
          </div>
        </section>

        <section aria-labelledby="photo" className="mt-12">
          <h3 id="photo" className="heading-3">
            Photographs
          </h3>
          <p className="body-3 mt-2 text-ink-subtle">
            {photos.length ? `${photos.length} of ${PHOTOS}. The first is shown largest.` : `Up to ${PHOTOS}: the place, the work, the people. The first is shown largest.`}
          </p>
          {photos.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, i) => (
                <li key={photo} className="grid content-start gap-2">
                  {/* An owner's own photograph, with no words of its own to describe it. */}
                  <img src={mediaUrl(photo)} alt={`Photograph ${i + 1}`} className="thumb" loading="lazy" decoding="async" />
                  <div className="flex flex-wrap gap-2">
                    {i > 0 && (
                      <ActionForm action={changePicture} className="grid" quiet>
                        <input type="hidden" name="business" value={b.id} />
                        <input type="hidden" name="path" value={photo} />
                        <input type="hidden" name="do" value="first" />
                        <Submit className="btn btn-quiet btn-sm button-sm" busy="Moving">
                          Put first<span className="sr-only">: photograph {i + 1}</span>
                        </Submit>
                      </ActionForm>
                    )}
                    <ActionForm action={changePicture} className="grid" quiet>
                      <input type="hidden" name="business" value={b.id} />
                      <input type="hidden" name="path" value={photo} />
                      <input type="hidden" name="do" value="remove" />
                      <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                        Remove<span className="sr-only">: photograph {i + 1}</span>
                      </Submit>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {photos.length < PHOTOS ? (
            <div className="card card-panel mt-6">
              <UploadForm to={upload} label="Add a photograph" button="Add this photograph" problem={at === "photo" ? wrong : undefined}>
                <input type="hidden" name="kind" value="photo" />
              </UploadForm>
            </div>
          ) : (
            <p className="note body-3 mt-6">Your page holds eight photographs. Remove one to add another.</p>
          )}
        </section>
      </div>

      <aside className="lg:col-span-5">
        <section aria-labelledby="cover" className="card">
          <h3 id="cover" className="heading-3">
            The cover
          </h3>
          <p className="body-3 mt-2 text-ink-subtle">One wide picture across the top of your page. A new one takes the place of the old.</p>
          {page?.cover ? (
            <>
              <img src={mediaUrl(page.cover)} alt="Your cover as it is now" className="thumb thumb-wide mt-4" />
              <div className="mt-3">
                <ActionForm action={changePicture} className="grid" quiet>
                  <input type="hidden" name="business" value={b.id} />
                  <input type="hidden" name="path" value={page.cover} />
                  <input type="hidden" name="do" value="remove" />
                  <div>
                    <Submit className="btn btn-quiet btn-sm button-sm" busy="Removing">
                      Remove the cover
                    </Submit>
                  </div>
                </ActionForm>
              </div>
            </>
          ) : (
            <p className="note body-3 mt-4">No cover yet. Your page shows the picture of the day until you add one.</p>
          )}
          <div className="mt-6">
            <UploadForm to={upload} label={page?.cover ? "Change the cover" : "Add a cover"} button={page?.cover ? "Use this cover" : "Add this cover"} problem={at === "cover" || (wrong && !at) ? wrong : undefined} quiet>
              <input type="hidden" name="kind" value="cover" />
            </UploadForm>
          </div>
        </section>
        <p className="caption-1 mt-4 text-ink-faint">Use pictures that are yours to use. Anyone can see them once your business is live.</p>
      </aside>
    </div>
  );
}
