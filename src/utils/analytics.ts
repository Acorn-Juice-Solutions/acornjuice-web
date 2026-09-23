/**
 * Google Analytics 4 measurement ID for acornjuice.com.
 *
 * TODO(manual-actions §7): once the new GA4 data stream is created inside the
 * shared property (the one already used by AccuVideo), replace this placeholder
 * with the real `G-XXXXXXXXXX`. Until it is set, the value stays empty and no
 * analytics script is loaded even after consent.
 */
export const GA_MEASUREMENT_ID = 'G-BBTBREVTWR';

export function analyticsEnabled(): boolean {
  return GA_MEASUREMENT_ID.trim().length > 0;
}

/**
 * Content grouping used to segment page_view events in GA4. Each page passes
 * its type to BaseLayout, which surfaces it as `content_group` on every
 * `page_view` so we can slice by page kind independently of URL/language.
 *
 * Keep the list in sync with the pages under `src/pages/`. The
 * `scripts/check-page-types.mjs` build-time check asserts that every page
 * passes one of these values.
 */
export const PAGE_TYPES = [
  'home',
  'team',
  'products',
  'product_detail',
  'articles',
  'article_detail',
  'privacy',
  'cookies',
  'legal',
  'thanks',
] as const;

export type PageType = (typeof PAGE_TYPES)[number];
