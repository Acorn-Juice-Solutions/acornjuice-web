import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://acornjuice.com';

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
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
        },
      },
      filter: (page) =>
        !page.includes('/thanks/') && !page.includes('/gracias/'),
    }),
  ],
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
