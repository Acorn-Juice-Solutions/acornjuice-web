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
 * Single source of truth for URL pairs. Adding a new page in the MVP means
 * appending one entry here — every downstream helper (hreflang tags, language
 * switcher, coverage tests) reads from this list.
 * All paths include the trailing slash to match `astro.config.mjs`
 * `trailingSlash: 'always'`.
 */
export const PAGE_PAIRS: readonly PagePair[] = [
  { en: '/', es: '/es/' },
  { en: '/about/', es: '/es/sobre/' },
  { en: '/products/', es: '/es/productos/' },
  { en: '/products/accuvideo/', es: '/es/productos/accuvideo/' },
  { en: '/products/sosnav/', es: '/es/productos/sosnav/' },
  { en: '/products/glucose-widget/', es: '/es/productos/widget-glucosa/' },
  { en: '/products/github-counter/', es: '/es/productos/contador-github/' },
  { en: '/privacy/', es: '/es/privacidad/' },
  { en: '/cookies/', es: '/es/cookies/' },
  { en: '/legal/', es: '/es/aviso-legal/' },
  { en: '/thanks/', es: '/es/gracias/', noindex: true },
];

const SITE_URL = 'https://acornjuice.com';

/** Look up the pair (en+es paths) that contains the given path. */
export function getPair(currentPath: string): PagePair {
  const pair = PAGE_PAIRS.find(
    (p) => p.en === currentPath || p.es === currentPath,
  );
  if (!pair) {
    throw new Error(`No hreflang pair registered for path: ${currentPath}`);
  }
  return pair;
}

/** Return the path for the opposite locale of the current URL. */
export function getOppositeLocalePath(currentPath: string): string {
  const pair = getPair(currentPath);
  return currentPath === pair.en ? pair.es : pair.en;
}

/**
 * Absolute URLs for all `<link rel="alternate" hreflang>` tags of a page.
 * `x-default` always points to the English variant.
 */
export function getHreflangs(currentPath: string): Array<{
  hreflang: string;
  href: string;
}> {
  const pair = getPair(currentPath);
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
export function isNoindex(currentPath: string): boolean {
  return getPair(currentPath).noindex === true;
}

/** All paths that should appear in the sitemap (i.e. not marked noindex). */
export function getIndexablePairs(): PagePair[] {
  return PAGE_PAIRS.filter((p) => !p.noindex);
}

/**
 * Convert a `Locale` into the correct pair path (useful when rendering
 * the language switcher from a locale-aware component).
 */
export function pathForLocale(pair: PagePair, locale: Locale): string {
  return locale === 'es' ? pair.es : pair.en;
}
