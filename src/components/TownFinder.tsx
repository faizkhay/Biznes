"use client";

import { useId, useState } from "react";
import { Glass } from "./Icons";

const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * "Find a town": a box that makes the list of towns under it smaller as a name is typed. The list
 * itself is the page's own, written out in full, so with no script the box is a plain form that
 * asks the search for the name typed, and the whole list is still there to read.
 *
 * It works on the page as it stands: every town carries its name and its neighbourhoods' names
 * (data-town), and a district with no town left is hidden with them.
 */
export default function TownFinder({ target, total }: { /** The id of the element that holds the list. */ target: string; total: number }) {
  const id = useId();
  const [said, setSaid] = useState("");

  function filter(typed: string) {
    const root = document.getElementById(target);
    if (!root) return;
    const wanted = fold(typed);
    let left = 0;
    for (const town of root.querySelectorAll<HTMLElement>("[data-town]")) {
      const own = fold(town.dataset.name ?? "");
      const areas = town.querySelector<HTMLDetailsElement>("details");
      const inArea = Boolean(wanted) && !own.includes(wanted) && fold(town.dataset.town ?? "").includes(wanted);
      const show = !wanted || own.includes(wanted) || inArea;
      town.hidden = !show;
      // A town found by one of its neighbourhoods opens to show it.
      if (areas) areas.open = inArea;
      if (show) left++;
    }
    for (const district of root.querySelectorAll<HTMLElement>("[data-district]")) district.hidden = !district.querySelector("[data-town]:not([hidden])");
    setSaid(!wanted ? "" : left === 0 ? "No town or village here has that name." : `${left} of ${total} towns and villages.`);
  }

  return (
    <form action="/search" role="search" className="town-finder">
      <label htmlFor={id} className="title-2 block">
        Find a town
      </label>
      <div className="search search-md mt-2">
        <span className="search-glass" aria-hidden>
          <Glass className="size-5" />
        </span>
        <input id={id} type="search" name="q" autoComplete="off" spellCheck={false} placeholder="A town, a village or a neighbourhood" onInput={(event) => filter(event.currentTarget.value)} aria-describedby={`${id}-said`} />
        <button type="submit" className="btn btn-filled btn-sm button-sm search-go">
          Search
        </button>
      </div>
      <p id={`${id}-said`} role="status" className="caption-1 mt-2 min-h-5 text-ink-faint">
        {said}
      </p>
    </form>
  );
}
