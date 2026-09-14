# acornjuice-web

Corporate landing for **Acorn Juice Solutions SL** — served at
[https://acornjuice.com](https://acornjuice.com).

Bilingual (EN + ES) static site built with [Astro](https://astro.build/),
deployed to GitHub Pages. See `.my-notes/` (local, not tracked) for the
design spec and pending manual actions.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run check` | Type-check (Astro + TypeScript + content schemas) |
| `npm run test` | Run all static tests (`check`, `i18n`, `hreflang`, `schema`) |
| `npm run test:links` | Link checker over the built site |
| `npm run test:axe` | Accessibility tests with Playwright + axe-core |
| `npm run test:lighthouse` | Lighthouse CI over 4 key pages |

## Structure

- `src/content/` — typed content collections (products, makers)
- `src/pages/` — routes; `es/` for Spanish variants
- `src/components/` — reusable UI (header, footer, cards, etc.)
- `src/layouts/BaseLayout.astro` — shell used by every page
- `src/i18n/{en,es}.json` — microcopy (nav, footer, form labels)
- `src/utils/` — i18n, hreflang, structured-data helpers
- `src/styles/` — design tokens + globals
- `public/` — static assets served as-is (CNAME, robots, logo, OG images)
- `scripts/` — CI test scripts (i18n coverage, hreflang reciprocity, schema)

## Deploy

Automated via `.github/workflows/deploy.yml` on push to `main`:
`checkout → setup-node → npm ci → npm test → npm run build →
upload-pages-artifact → deploy-pages`.

Custom domain configured via `public/CNAME`. DNS setup and GitHub Pages
settings are documented in the manual actions file.
