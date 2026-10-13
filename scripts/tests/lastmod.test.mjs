// Tests for the sitemap <lastmod> resolver.
//
// The bug this guards against: an article page took its date from the shared
// [slug].astro route alone, so a brand-new article shipped with a <lastmod>
// two weeks older than its own publication date, and the article listings
// never moved at all. Google reads lastmod to decide what to re-crawl, so a
// date that lies costs exactly the signal that gets a new page visited.
//
// Each case builds a throwaway tree, and the resolver cases turn it into a git
// repository with commits at fixed dates, so nothing here depends on this
// checkout's own history.

import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

import { createLastmodResolver, sourcesFor } from '../lastmod.mjs';

/** @type {string[]} */
const fixtures = [];

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/**
 * Writes `files` (relative path → contents) into `dir`, creating a fresh
 * temporary directory when none is given.
 * @param {Record<string, string>} files
 * @param {string} [dir]
 */
function tree(files, dir = mkdtempSync(join(tmpdir(), 'aj-lastmod-'))) {
  if (!fixtures.includes(dir)) fixtures.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body, 'utf8');
  }
  return dir;
}

/**
 * Runs git inside a fixture. Identity and signing are pinned on the command
 * line so the throwaway repository never depends on, or touches, the
 * developer's own git configuration.
 */
function git(dir, args, env = {}) {
  const proc = spawnSync(
    'git',
    [
      '-c',
      'user.name=fixture',
      '-c',
      'user.email=fixture@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.autocrlf=false',
      ...args,
    ],
    { cwd: dir, encoding: 'utf8', env: { ...process.env, ...env } },
  );
  assert.equal(proc.status, 0, `git ${args.join(' ')} failed: ${proc.stderr}`);
  return proc.stdout.trim();
}

/** A fresh, empty git repository. */
function repo() {
  const dir = tree({});
  git(dir, ['init', '-q']);
  return dir;
}

/** Writes `files` into `dir` and commits them at `isoDate`. */
function commit(dir, files, isoDate) {
  tree(files, dir);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', `change at ${isoDate}`], {
    GIT_AUTHOR_DATE: isoDate,
    GIT_COMMITTER_DATE: isoDate,
  });
}

const gitAvailable = spawnSync('git', ['--version']).status === 0;

// The same shape astro.config.mjs builds from STATIC_PAGE_PAIRS and
// scripts/article-pairs.mjs.
const ABOUT = { en: '/about/', es: '/es/sobre/' };
const PRODUCT = {
  en: '/products/github-counter/',
  es: '/es/productos/contador-github/',
};
const MEETING = {
  en: '/articles/meeting-cost/',
  es: '/es/articulos/coste-reuniones/',
  sources: {
    en: 'src/content/articles/coste-reuniones/en.md',
    es: 'src/content/articles/coste-reuniones/es.md',
  },
};
const CRA = {
  en: '/articles/cra/',
  es: '/es/articulos/cra/',
  sources: {
    en: 'src/content/articles/cra/en.md',
    es: 'src/content/articles/cra/es.md',
  },
};
const LISTING = {
  en: '/articles/',
  es: '/es/articulos/',
  sources: {
    en: [MEETING.sources.en, CRA.sources.en],
    es: [MEETING.sources.es, CRA.sources.es],
  },
};

/** A minimal copy of the site's source layout. */
function site() {
  const files = {};
  for (const f of [
    'src/pages/about.astro',
    'src/pages/es/sobre.astro',
    'src/pages/articles/index.astro',
    'src/pages/articles/[slug].astro',
    'src/pages/es/articulos/index.astro',
    'src/pages/es/articulos/[slug].astro',
    'src/pages/products/[slug].astro',
    'src/pages/es/productos/[slug].astro',
    'src/content/products/github-counter.md',
    MEETING.sources.en,
    MEETING.sources.es,
    CRA.sources.en,
    CRA.sources.es,
  ]) {
    files[f] = `${f}\n`;
  }
  return files;
}

const OLD = '2026-09-23T16:13:55Z';
const NEW = '2026-10-07T09:14:56Z';

/** Compares two datetimes by instant, so "+00:00" and "Z" spellings agree. */
function assertSameInstant(actual, expected, message) {
  assert.equal(Date.parse(actual), Date.parse(expected), `${message}: ${actual}`);
}

describe('sourcesFor', () => {
  const root = tree(site());

  it('resolves a fixed page to its own route file', () => {
    assert.deepEqual(sourcesFor('/about/', ABOUT, root), ['src/pages/about.astro']);
    assert.deepEqual(sourcesFor('/es/sobre/', ABOUT, root), [
      'src/pages/es/sobre.astro',
    ]);
  });

  it('resolves an article to the shared route plus its own locale entry', () => {
    assert.deepEqual(sourcesFor('/es/articulos/coste-reuniones/', MEETING, root), [
      'src/pages/es/articulos/[slug].astro',
      'src/content/articles/coste-reuniones/es.md',
    ]);
    assert.deepEqual(sourcesFor('/articles/meeting-cost/', MEETING, root), [
      'src/pages/articles/[slug].astro',
      'src/content/articles/coste-reuniones/en.md',
    ]);
  });

  it('resolves a listing to its route plus every article of that locale', () => {
    assert.deepEqual(sourcesFor('/es/articulos/', LISTING, root), [
      'src/pages/es/articulos/index.astro',
      'src/content/articles/coste-reuniones/es.md',
      'src/content/articles/cra/es.md',
    ]);
  });

  it('derives a product entry from the English slug', () => {
    assert.deepEqual(sourcesFor('/es/productos/contador-github/', PRODUCT, root), [
      'src/pages/es/productos/[slug].astro',
      'src/content/products/github-counter.md',
    ]);
  });

  it('drops registered sources that do not exist on disk', () => {
    const pair = {
      ...MEETING,
      sources: { en: 'src/content/articles/gone/en.md', es: 'src/content/articles/gone/es.md' },
    };
    assert.deepEqual(sourcesFor('/es/articulos/coste-reuniones/', pair, root), [
      'src/pages/es/articulos/[slug].astro',
    ]);
  });
});

describe('createLastmodResolver', { skip: !gitAvailable && 'git is not on PATH' }, () => {
  it('dates an article by its own content, not just the shared route', () => {
    const root = repo();
    commit(root, site(), OLD);
    commit(root, { [MEETING.sources.es]: 'edited\n', [MEETING.sources.en]: 'edited\n' }, NEW);

    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(MEETING.es, MEETING), NEW, 'es article');
    assertSameInstant(lastmodFor(MEETING.en, MEETING), NEW, 'en article');
    assertSameInstant(lastmodFor(ABOUT.en, ABOUT), OLD, 'untouched page');
  });

  it('moves only the locale whose entry changed', () => {
    const root = repo();
    commit(root, site(), OLD);
    commit(root, { [MEETING.sources.es]: 'edited\n' }, NEW);

    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(MEETING.es, MEETING), NEW, 'es article');
    assertSameInstant(lastmodFor(MEETING.en, MEETING), OLD, 'en article');
  });

  it('dates a listing by its newest article', () => {
    const root = repo();
    commit(root, site(), OLD);
    commit(root, { [CRA.sources.es]: 'edited\n' }, NEW);

    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(LISTING.es, LISTING), NEW, 'es listing');
    assertSameInstant(lastmodFor(LISTING.en, LISTING), OLD, 'en listing');
  });

  it('dates a product page by its content entry', () => {
    const root = repo();
    commit(root, site(), OLD);
    commit(root, { 'src/content/products/github-counter.md': 'edited\n' }, NEW);

    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(PRODUCT.es, PRODUCT), NEW, 'es product');
    assertSameInstant(lastmodFor(PRODUCT.en, PRODUCT), NEW, 'en product');
  });

  it('ignores shared files that are not a page source', () => {
    const root = repo();
    commit(root, site(), OLD);
    commit(root, { 'src/layouts/BaseLayout.astro': 'restyled\n' }, NEW);

    const lastmodFor = createLastmodResolver({ root });
    for (const [path, pair] of [
      [ABOUT.en, ABOUT],
      [LISTING.es, LISTING],
      [MEETING.es, MEETING],
      [PRODUCT.es, PRODUCT],
    ]) {
      assertSameInstant(lastmodFor(path, pair), OLD, path);
    }
  });

  it('memoises per path for the lifetime of a build', () => {
    const root = repo();
    commit(root, site(), OLD);
    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(MEETING.es, MEETING), OLD, 'first call');

    commit(root, { [MEETING.sources.es]: 'edited\n' }, NEW);
    assertSameInstant(lastmodFor(MEETING.es, MEETING), OLD, 'cached call');
  });

  it('rejects a call without a page pair', () => {
    const lastmodFor = createLastmodResolver({ root: repo() });
    assert.throws(() => lastmodFor('/about/', undefined), TypeError);
    assert.throws(() => lastmodFor('/about/', { es: '/es/sobre/' }), TypeError);
  });
});

describe('createLastmodResolver outside a git checkout', () => {
  it('falls back to the newest mtime of the page sources', () => {
    const root = tree(site());
    const stamp = new Date('2026-09-01T12:00:00Z');
    utimesSync(join(root, 'src/pages/about.astro'), stamp, stamp);

    const lastmodFor = createLastmodResolver({ root });
    assertSameInstant(lastmodFor(ABOUT.en, ABOUT), stamp.toISOString(), 'mtime');
  });

  it('falls back to the build time when nothing on disk matches', () => {
    const root = tree(site());
    const lastmodFor = createLastmodResolver({ root });
    const iso = lastmodFor('/nowhere/', { en: '/nowhere/', es: '/es/ninguna/' });

    assert.ok(!Number.isNaN(Date.parse(iso)), `not a datetime: ${iso}`);
    assert.ok(Date.parse(iso) <= Date.now(), `in the future: ${iso}`);
  });
});
