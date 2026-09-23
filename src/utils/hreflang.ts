import type { Locale } from './i18n';

export type PagePair = {
  readonly en: string;
  readonly es: string;
  /**
   * When `true`, the page must be excluded from the sitemap and marked
   * `noindex` (e.g. post-form success pages).
   */
  readonly noindex?: boolean;
};

/**
 * Fixed pages of the site. Adding one means appending an entry here; every
 * downstream helper (hreflang tags, language switcher, coverage tests) reads
 * from `getPagePairs()`, which is this list plus the article pairs derived
 * from the content collection — articles are not registered by hand on
 * purpose, because a forgotten entry ships a page without alternates.
 * All paths include the trailing slash to match `astro.config.mjs`
 * `trailingSlash: 'always'`.
 */
export const STATIC_PAGE_PAIRS: readonly PagePair[] = [
  { en: '/', es: '/es/' },
  { en: '/about/', es: '/es/sobre/' },
  { en: '/products/', es: '/es/productos/' },
  { en: '/products/accuvideo/', es: '/es/productos/accuvideo/' },
  { en: '/products/sosnav/', es: '/es/productos/sosnav/' },
  { en: '/products/sweet-enough/', es: '/es/productos/sweet-enough/' },
  { en: '/products/github-counter/', es: '/es/productos/contador-github/' },
  { en: '/articles/', es: '/es/articulos/' },
  { en: '/privacy/', es: '/es/privacidad/' },
  { en: '/cookies/', es: '/es/cookies/' },
  { en: '/legal/', es: '/es/aviso-legal/' },
  { en: '/thanks/', es: '/es/gracias/', noindex: true },
];

const SITE_URL = 'https://www.acornjuice.com';

/**
 * Every pair the site ships: the fixed pages plus one per published article.
 *
 * The articles module is imported dynamically on purpose. `astro.config.mjs`
 * imports STATIC_PAGE_PAIRS from this file, and the config is evaluated before
 * the `astro:content` virtual module exists — a top-level import of
 * `./articles` would crash the config with "Cannot find module 'astro:content'".
 * Deferring it means only the code paths that actually render articles pull it
 * in, when the module already exists. The config gets its own article pairs
 * from `scripts/article-pairs.mjs`, which reads the same files.
 */
export async function getPagePairs(): Promise<PagePair[]> {
  const { getArticlePairs } = await import('./articles');
  const articles = await getArticlePairs();
  return [
    ...STATIC_PAGE_PAIRS,
    ...articles.map((a) => ({
      en: `/articles/${a.en.data.slug}/`,
      es: `/es/articulos/${a.es.data.slug}/`,
    })),
  ];
}

/** Look up the pair (en+es paths) that contains the given path. */
export async function getPair(currentPath: string): Promise<PagePair> {
  const pairs = await getPagePairs();
  const pair = pairs.find(
    (p) => p.en === currentPath || p.es === currentPath,
  );
  if (!pair) {
    throw new Error(`No hreflang pair registered for path: ${currentPath}`);
  }
  return pair;
}

/** Return the path for the opposite locale of the current URL. */
export async function getOppositeLocalePath(
  currentPath: string,
): Promise<string> {
  const pair = await getPair(currentPath);
  return currentPath === pair.en ? pair.es : pair.en;
}

/**
 * Absolute URLs for all `<link rel="alternate" hreflang>` tags of a page.
 * `x-default` always points to the English variant.
 */
export async function getHreflangs(currentPath: string): Promise<
  Array<{
    hreflang: string;
    href: string;
  }>
> {
  const pair = await getPair(currentPath);
  return [
    { hreflang: 'en', href: SITE_URL + pair.en },
    { hreflang: 'es', href: SITE_URL + pair.es },
    { hreflang: 'x-default', href: SITE_URL + pair.en },
  ];
}

/** Absolute canonical URL for the current path. */
export function canonicalUrl(currentPath: string): string {
  return SITE_URL + currentPath;
}

/** True if this page should carry `<meta name="robots" content="noindex">`. */
export async function isNoindex(currentPath: string): Promise<boolean> {
  return (await getPair(currentPath)).noindex === true;
}

/** All paths that should appear in the sitemap (i.e. not marked noindex). */
export async function getIndexablePairs(): Promise<PagePair[]> {
  return (await getPagePairs()).filter((p) => !p.noindex);
}

/**
 * Convert a `Locale` into the correct pair path (useful when rendering
 * the language switcher from a locale-aware component).
 */
export function pathForLocale(pair: PagePair, locale: Locale): string {
  return locale === 'es' ? pair.es : pair.en;
}
