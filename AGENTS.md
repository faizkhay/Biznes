# biznes.mu

The search engine for business in Mauritius, built and run by Khay Digital. This repository is the
website and the crawler that feeds it.

- Built with KOS, Khay Digital's method and standards (`faizkhay/Khay-Original-Skill`,
  `.claude/skills/kos/SKILL.md`). Read it before changing the site; `README.md`, `PRODUCT.md`,
  `STORY.md` and `DESIGN.md` describe this build, and `REVENUE.md` how it can earn.
- Nothing the site shows is written into a component. The site's own facts are `src/data/site.ts`.
  Listings are `data/index`, written by the crawler (`npm run crawl`) and never edited by hand.
  Guides are `content/guides`, each fact with its source; the tools read their figures from them.
- Never invent a listing, a figure or a source. A guide's figure must be on a page that was read,
  and named. What could not be confirmed goes in the guide's `unverified` list, not its prose.
- The crawler obeys robots.txt, reads one page a site, and never takes an email address
  (`crawler/config.mjs`). Keep it so.
- The order of a page of results is: our own pages that answer, then businesses, then parts of
  articles that only mention the words, then pages elsewhere. Businesses are ordered by how well a
  listing answers and how full it is. A business on a paid plan comes first among equal answers
  and is always marked as a priority listing. In the health categories a listing with a telephone
  number comes before one without. The site says all of it (`/data`, `/pricing`). If the order
  ever changes, those pages change first.
- The plans, their prices and what each gives are the owner's words (`PLANS` in
  `src/data/site.ts`). Never add a feature or a price to a plan that the owner has not given.
- The picture behind the page follows the calendar (`src/data/themes.ts`, `src/lib/theme.ts`).
  Holiday dates come only from `content/holidays.json`, written from the official notice.
- House style in every file: British spelling, plain sentences, no em or en dashes.
- Before committing: `npm run typecheck && npm run build && npm run copy && npm run tokens`, then
  the behaviour, accessibility and capture checks against a production server (README,
  "Verification").

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
