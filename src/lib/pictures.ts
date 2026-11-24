import { existsSync } from "node:fs";
import { join } from "node:path";
import { PICTURES, type PictureId } from "@/data/themes";

const seen = new Map<PictureId, boolean>();
const onDisk = (id: PictureId) => {
  if (!seen.has(id)) seen.set(id, existsSync(join(process.cwd(), "public", PICTURES[id].src)) && existsSync(join(process.cwd(), "public", PICTURES[id].tall)));
  return seen.get(id)!;
};

/**
 * Of the pictures named, those whose two files are in public/themes on this machine, in the same
 * order. A picture named in src/data/themes.ts before its file has arrived is left out of the
 * day's turn, so the page is never without one. Where no file can be seen at all (a host that
 * keeps public files apart from the server), every picture named is taken to be there.
 */
export function picturesOnHand(ids: PictureId[]): PictureId[] {
  if (!(Object.keys(PICTURES) as PictureId[]).some(onDisk)) return ids;
  return ids.filter(onDisk);
}
