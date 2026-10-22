// Resolves a real <lastmod> per page for the sitemap.
//
// Why git and not the build time: a sitemap that stamps "now" on every URL at
// every deploy is telling Google that 22 pages changed when one did. Google's
// documented response is to stop trusting lastmod for the whole site, which
// costs us the one signal that actually helps a new domain get re-crawled.
// So each page's date comes from the last commit that touched *its own*
// sources — its route file plus, for product and article pages, its content
// entry.
//
// Shared files (BaseLayout, design tokens, i18n bundles) are deliberately NOT
// counted: a CSS tweak is not a content change, and folding it in would make
// every date identical again, which is the exact failure mode above.
//
// Every function takes the repository root as a parameter, defaulting to this
// checkout, so the unit tests can point it at a throwaway git repository with
// commits at known dates instead of depending on this repo's history.

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Build start — last-resort fallback when a page has no traceable source. */
const BUILD_TIME = new Date().toISOString();

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * A shallow clone (actions/checkout defaults to fetch-depth: 1) only has the
 * tip commit, so every `git log` answer would collapse to the same date.
 * Detect it once and say so loudly rather than shipping plausible-looking
 * dates that are all wrong.
 */
function detectShallow(root) {
  if (git(root, ['rev-parse', '--is-inside-work-tree']) !== 'true') {
    console.warn(
      '[sitemap] Not a git checkout — lastmod falls back to file mtime.',
    );
    return true;
  }
  if (git(root, ['rev-parse', '--is-shallow-repository']) === 'true') {
    console.warn(
      '[sitemap] Shallow git clone detected — lastmod dates will be unreliable. ' +
        'Set `fetch-depth: 0` on actions/checkout in the build job.',
    );
    return true;
  }
  return false;
}

/** ISO date of the last commit touching any of `files`, or '' if unknown. */
function lastCommitDate(root, files) {
  const existing = files.filter((f) => existsSync(join(root, f)));
  if (existing.length === 0) return '';
  return git(root, ['log', '-1', '--format=%cI', '--', ...existing]);
}

/** Newest mtime across `files`, or '' if none exist. */
function newestMtime(root, files) {
  let newest = 0;
  for (const f of files) {
    const full = join(root, f);
    if (!existsSync(full)) continue;
    const { mtimeMs } = statSync(full);
    if (mtimeMs > newest) newest = mtimeMs;
  }
  return newest === 0 ? '' : new Date(newest).toISOString();
}

/**
 * Source files that genuinely determine a page's content, relative to `root`.
 * `pair` is the page's hreflang pair. `pair.sources[locale]` lists the content
 * entries behind the page: one file for an article (scripts/article-pairs.mjs),
 * every entry of a collection for the fixed pages that render one
 * (scripts/listing-sources.mjs), nothing for the rest. Product pages have no
 * registered sources, so their entry is derived from the English slug:
 * /es/productos/contador-github/ is rendered from
 * src/content/products/github-counter.md.
 *
 * Exported for the unit tests; the build only uses createLastmodResolver().
 */
export function sourcesFor(pathname, pair, root = DEFAULT_ROOT) {
  const segments = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const base = segments.length === 0 ? 'index' : segments.join('/');
  const locale = segments[0] === 'es' ? 'es' : 'en';
  const entries = [].concat(pair.sources?.[locale] ?? []);

  const candidates = [
    `src/pages/${base}.astro`,
    `src/pages/${base}/index.astro`,
  ];
  const found = candidates.filter((c) => existsSync(join(root, c)));
  if (found.length > 0) {
    return [...found, ...entries.filter((c) => existsSync(join(root, c)))];
  }

  // Dynamic route ([slug].astro): the last segment is the slug, not a file.
  const dir = segments.slice(0, -1).join('/');
  const route = `src/pages/${dir}/[slug].astro`;
  if (entries.length === 0) {
    const contentSlug = pair.en.replace(/^\/|\/$/g, '').split('/').pop();
    entries.push(`src/content/products/${contentSlug}.md`);
  }

  return [route, ...entries].filter((c) => existsSync(join(root, c)));
}

/**
 * Returns `(pathname, pair) => ISO datetime`. Memoised: a build asks for
 * ~20 paths and each miss costs a git process.
 * `root` is the repository to read dates from; it defaults to this checkout.
 */
export function createLastmodResolver({ root = DEFAULT_ROOT } = {}) {
  const cache = new Map();
  const shallow = detectShallow(root);

  return function lastmodFor(pathname, pair) {
    const cached = cache.get(pathname);
    if (cached) return cached;

    if (typeof pathname !== 'string' || !pair || typeof pair.en !== 'string') {
      throw new TypeError(
        `lastmodFor(${pathname}): a page pair with an \`en\` path is required`,
      );
    }

    const files = sourcesFor(pathname, pair, root);
    let iso = '';

    if (!shallow) iso = lastCommitDate(root, files);
    if (!iso) iso = newestMtime(root, files);
    if (!iso) {
      console.warn(`[sitemap] No source found for ${pathname} — using build time.`);
      iso = BUILD_TIME;
    }

    cache.set(pathname, iso);
    return iso;
  };
}
