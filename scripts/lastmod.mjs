// Resolves a real <lastmod> per page for the sitemap.
//
// Why git and not the build time: a sitemap that stamps "now" on every URL at
// every deploy is telling Google that 22 pages changed when one did. Google's
// documented response is to stop trusting lastmod for the whole site, which
// costs us the one signal that actually helps a new domain get re-crawled.
// So each page's date comes from the last commit that touched *its own*
// sources — its route file plus, for product pages, its content entry.
//
// Shared files (BaseLayout, design tokens, i18n bundles) are deliberately NOT
// counted: a CSS tweak is not a content change, and folding it in would make
// every date identical again, which is the exact failure mode above.

import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Build start — last-resort fallback when a page has no traceable source. */
const BUILD_TIME = new Date().toISOString();

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
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
function detectShallow() {
  if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') {
    console.warn(
      '[sitemap] Not a git checkout — lastmod falls back to file mtime.',
    );
    return true;
  }
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
    console.warn(
      '[sitemap] Shallow git clone detected — lastmod dates will be unreliable. ' +
        'Set `fetch-depth: 0` on actions/checkout in the build job.',
    );
    return true;
  }
  return false;
}

/** ISO date of the last commit touching any of `files`, or '' if unknown. */
function lastCommitDate(files) {
  const existing = files.filter((f) => existsSync(join(ROOT, f)));
  if (existing.length === 0) return '';
  return git(['log', '-1', '--format=%cI', '--', ...existing]);
}

/** Newest mtime across `files`, or '' if none exist. */
function newestMtime(files) {
  let newest = 0;
  for (const f of files) {
    const full = join(ROOT, f);
    if (!existsSync(full)) continue;
    const { mtimeMs } = statSync(full);
    if (mtimeMs > newest) newest = mtimeMs;
  }
  return newest === 0 ? '' : new Date(newest).toISOString();
}

/**
 * Source files that genuinely determine a page's content.
 * `enPath` disambiguates product slugs: /es/productos/contador-github/ is
 * rendered from src/content/products/github-counter.md, whose name follows the
 * English slug.
 */
function sourcesFor(pathname, enPath) {
  const segments = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
  const base = segments.length === 0 ? 'index' : segments.join('/');

  const candidates = [
    `src/pages/${base}.astro`,
    `src/pages/${base}/index.astro`,
  ];
  const found = candidates.filter((c) => existsSync(join(ROOT, c)));
  if (found.length > 0) return found;

  // Dynamic product route: the last segment is the slug, not a file.
  const dir = segments.slice(0, -1).join('/');
  const route = `src/pages/${dir}/[slug].astro`;
  const contentSlug = enPath.replace(/^\/|\/$/g, '').split('/').pop();
  const entry = `src/content/products/${contentSlug}.md`;

  return [route, entry].filter((c) => existsSync(join(ROOT, c)));
}

/**
 * Returns `(pathname, enPath) => ISO datetime`. Memoised: a build asks for
 * ~20 paths and each miss costs a git process.
 */
export function createLastmodResolver() {
  const cache = new Map();
  const shallow = detectShallow();

  return function lastmodFor(pathname, enPath) {
    const cached = cache.get(pathname);
    if (cached) return cached;

    const files = sourcesFor(pathname, enPath);
    let iso = '';

    if (!shallow) iso = lastCommitDate(files);
    if (!iso) iso = newestMtime(files);
    if (!iso) {
      console.warn(`[sitemap] No source found for ${pathname} — using build time.`);
      iso = BUILD_TIME;
    }

    cache.set(pathname, iso);
    return iso;
  };
}
