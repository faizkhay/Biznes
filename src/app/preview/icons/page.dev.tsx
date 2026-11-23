import { PageHead } from "@/components/Bits";
import { CategoryIcon, DistrictIcon, FoodIcon, GroupGlyph, PageIcon } from "@/components/Glyphs";
import { ABOUT, MENU, MENU_LABELS, MORE_PAGE, YOURS } from "@/data/site";
import { food } from "@/lib/food";
import { index } from "@/lib/index";

/**
 * The site's own icons in the site's own dress: on the ink tile a group or a listing wears, and
 * in ink beside a name with the point lit. It exists only under `next dev` (its file ends
 * .dev.tsx). The sheet that is kept, and that judges the drawings at each size, is made by
 * `npm run icons:sheet`; this page shows the same icons where the site's classes meet them.
 *
 *   /preview/icons
 */
export default function IconsPreview() {
  const { groups, categories, districts } = index();
  const { cuisines } = food();
  const pages = [
    { label: "Home", items: [{ href: "/home", label: "Home" }, MORE_PAGE] },
    ...MENU.map((group) => ({ label: group.label, items: [...group.items] })),
    { label: MENU_LABELS.yours, items: [...YOURS] },
    { label: MENU_LABELS.about, items: [...ABOUT] },
  ];
  return (
    <>
      <PageHead title="The icons" lede="Every icon the site draws for itself, on the tile it wears and in ink with its point lit. A page for whoever builds the site: it is not part of it." />
      <div className="shell grid gap-12 pb-16">
        <section aria-labelledby="icons-groups">
          <h2 id="icons-groups" className="heading-3">
            Groups and kinds of business
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl bg-paper p-4">
                <p className="flex items-center gap-3">
                  <span className="tile-icon">
                    <GroupGlyph id={group.id} />
                  </span>
                  <span className="title-1">{group.label}</span>
                </p>
                <ul className="mt-4 grid gap-2">
                  {categories
                    .filter((category) => category.group === group.id)
                    .map((category) => (
                      <li key={category.id} className="body-3 flex items-center gap-3">
                        <span className="tile-icon">
                          <CategoryIcon id={category.id} group={category.group} />
                        </span>
                        <CategoryIcon id={category.id} group={category.group} lit width={20} height={20} className="shrink-0" />
                        {category.label}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="icons-districts">
          <h2 id="icons-districts" className="heading-3">
            Districts
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {districts.map((district) => (
              <li key={district.slug} className="body-3 flex items-center gap-3 rounded-xl bg-paper p-4">
                <DistrictIcon slug={district.slug} lit width={32} height={32} className="shrink-0" />
                {district.name}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="icons-food">
          <h2 id="icons-food" className="heading-3">
            Kinds of food, most listed first
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cuisines.map((cuisine) => (
              <li key={cuisine.id} className="body-3 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-2">
                <FoodIcon id={cuisine.id} lit width={20} height={20} className="shrink-0" />
                {cuisine.label}
                <span className="data-2 text-ink-faint">{cuisine.n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="icons-pages">
          <h2 id="icons-pages" className="heading-3">
            Pages
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {pages.map((group) => (
              <div key={group.label}>
                <h3 className="label-1 text-ink-faint">{group.label}</h3>
                <ul className="mt-2 grid gap-2">
                  {group.items.map((item) => (
                    <li key={item.href} className="body-3 flex items-center gap-3">
                      <span className="tile-icon">
                        <PageIcon href={item.href} />
                      </span>
                      <PageIcon href={item.href} lit width={24} height={24} className="shrink-0" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
