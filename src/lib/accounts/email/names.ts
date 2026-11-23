// What a message is for and who it goes to, in the site's own words. The names of the guide and
// the magazine are read from the site's facts (src/data/site.ts), never typed here.
import { PUBLICATIONS } from "@/data/site";
import type { Audience, CampaignKind } from "./types";

export const KIND_NAMES: Record<CampaignKind, string> = {
  guide: `An edition of the ${PUBLICATIONS.guide.short}`,
  magazine: `The ${PUBLICATIONS.magazine.short}`,
  note: "A note",
  confirm: "Asking the list to confirm",
};

export const AUDIENCE_NAMES: Record<Audience, string> = {
  guide: `Those who asked for the ${PUBLICATIONS.guide.short}`,
  magazine: `Those who asked for the ${PUBLICATIONS.magazine.short}`,
  everyone: "Both: everyone on the list",
  unconfirmed: "Those who have not confirmed yet",
};

/** Why a reader has the message, said at its foot. */
export const WHY: Record<Audience, string> = {
  guide: `You have this message because you asked to be sent the ${PUBLICATIONS.guide.name}.`,
  magazine: `You have this message because you asked to be sent the ${PUBLICATIONS.magazine.name}.`,
  everyone: `You have this message because you asked to be sent the ${PUBLICATIONS.guide.name}, the ${PUBLICATIONS.magazine.name}, or both.`,
  unconfirmed: `You have this message because this address was given to be sent the ${PUBLICATIONS.guide.name}, the ${PUBLICATIONS.magazine.name}, or both.`,
};
