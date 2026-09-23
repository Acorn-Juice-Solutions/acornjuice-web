import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { STATIC_PAGE_PAIRS } from './src/utils/hreflang.ts';
import { articlePagePairs } from './scripts/article-pairs.mjs';
import { createLastmodResolver } from './scripts/lastmod.mjs';

const SITE = 'https://www.acornjuice.com';

// The fixed pages plus one pair per published article. Articles are derived
// from the filesystem rather than from the content collection because this
// config is evaluated before `astro:content` exists; src/utils/articles.ts is
// the equivalent for everything that renders.
const PAGE_PAIRS = [...STATIC_PAGE_PAIRS, ...articlePagePairs()];

// Index PAGE_PAIRS by both of its paths so a sitemap entry can find its twin.
const pairByPath = new Map();
for (const pair of PAGE_PAIRS) {
  pairByPath.set(pair.en, pair);
  pairByPath.set(pair.es, pair);
}

const lastmodFor = createLastmodResolver();

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  integrations: [
    sitemap({
      // PAGE_PAIRS is the single source of truth for what exists and what is
      // indexable, so the sitemap derives from it rather than hardcoding path
      // fragments. Anything not registered there cannot be built anyway —
      // getPair() throws during rendering — so an unknown path here means a
      // page slipped past the registry and should stay out of the sitemap.
      filter: (page) => {
        const pair = pairByPath.get(new URL(page).pathname);
        return pair !== undefined && pair.noindex !== true;
      },

      // Built-in `i18n` is deliberately not used: it only pairs URLs whose
      // paths are identical after the locale prefix, so every translated slug
      // (/about/ ↔ /es/sobre/, /products/ ↔ /es/productos/) shipped with no
      // alternates at all. Emitting them from PAGE_PAIRS keeps the sitemap
      // consistent with the <link rel="alternate"> tags in each page's head.
      serialize: (item) => {
        const pair = pairByPath.get(new URL(item.url).pathname);
        if (!pair) return item;

        return {
          ...item,
          lastmod: lastmodFor(new URL(item.url).pathname, pair.en),
          links: [
            { lang: 'en', url: SITE + pair.en },
            { lang: 'es', url: SITE + pair.es },
            { lang: 'x-default', url: SITE + pair.en },
          ],
        };
      },
    }),
  ],
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
