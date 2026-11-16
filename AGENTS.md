# biznes.mu

Ready-to-launch businesses in Mauritius, built by Khay Digital. This repository is the website.

- Built with KOS, Khay Digital's method and standards (`faizkhay/Khay-Original-Skill`,
  `.claude/skills/kos/SKILL.md`). Read it before changing the site; `README.md`, `PRODUCT.md`,
  `STORY.md` and `DESIGN.md` describe this build.
- Everything the owner will change is data: `src/data/site.ts`, `src/data/businesses.ts`,
  `src/data/pack.ts`. Never write a fact into a component.
- House style in every file: British spelling, plain sentences, no em or en dashes.
- Before committing: `npm run typecheck && npm run build && npm run copy && npm run tokens`, then
  the screenshot, reveal and accessibility checks against a production server (README,
  "Verification").

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`; verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
