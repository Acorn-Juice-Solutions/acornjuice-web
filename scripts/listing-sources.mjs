// Content entries behind the fixed pages that render a whole collection.
//
// A listing changes whenever one of its entries does: /products/ when a
// product's price moves, /about/ when a maker profile is edited, /articles/
// when an article is published. Their route files do not change for any of
// that, so dating them by the route alone (see scripts/lastmod.mjs) leaves
// the sitemap claiming the listing is older than the things it shows.
//
// This is the one place that knows which fixed page renders which collection.
// astro.config.mjs attaches the result to STATIC_PAGE_PAIRS as `sources`, the
// same shape scripts/article-pairs.mjs gives each article.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { articleListingSources } from './article-pairs.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Every Markdown entry of `src/content/<collection>/`, repo-relative and
 * sorted so the output is stable; [] when the collection does not exist.
 */
function collectionEntries(root, collection) {
  let names;
  try {
    names = readdirSync(join(root, 'src', 'content', collection));
  } catch {
    return [];
  }
  return names
    .filter((n) => n.endsWith('.md'))
    .sort()
    .map((n) => `src/content/${collection}/${n}`);
}

/** The same entries serve both locales (products and makers are one file each). */
function shared(root, collection) {
  const all = collectionEntries(root, collection);
  return { en: all, es: all };
}

/**
 * Fixed pages that render a collection, keyed by their English path as it
 * appears in STATIC_PAGE_PAIRS. A fixed page missing here is dated by its
 * route file alone.
 * @type {Record<string, (root: string) => {en: string[], es: string[]}>}
 */
const LISTINGS = {
  '/articles/': (root) => articleListingSources(root),
  '/products/': (root) => shared(root, 'products'),
  '/about/': (root) => shared(root, 'makers'),
};

/**
 * Sources for the fixed page whose English path is `enPath`, or undefined
 * when that page does not render a collection.
 * @param {string} enPath
 * @param {string} [root] repository root; defaults to this checkout.
 * @returns {{en: string[], es: string[]} | undefined}
 */
export function listingSourcesFor(enPath, root = ROOT) {
  const resolve = LISTINGS[enPath];
  return resolve ? resolve(root) : undefined;
}

/**
 * `pairs` with `sources` attached to every page registered in LISTINGS.
 * Fails if a registered page has no pair: a renamed path would otherwise
 * silently go back to being dated by its route alone.
 * @template {{en: string, es: string}} P
 * @param {readonly P[]} pairs
 * @param {string} [root]
 * @returns {Array<P | (P & {sources: {en: string[], es: string[]}})>}
 */
export function withListingSources(pairs, root = ROOT) {
  const known = new Set(pairs.map((p) => p.en));
  for (const enPath of Object.keys(LISTINGS)) {
    if (!known.has(enPath)) {
      throw new Error(
        `listing-sources: ${enPath} is registered but no page pair has that path`,
      );
    }
  }
  return pairs.map((pair) => {
    const sources = listingSourcesFor(pair.en, root);
    return sources ? { ...pair, sources } : pair;
  });
}
