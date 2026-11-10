// Tests for the registry of fixed pages that render a whole collection.
//
// The sitemap dates a listing by the newest of its own route and the entries
// it shows (scripts/lastmod.mjs). This registry is what tells it which fixed
// page shows which collection, so the properties pinned here are: each
// registered page gets the right entries per locale, unregistered pages are
// left alone, and a registered path that no longer exists fails the build
// instead of silently going back to being dated by its route alone.
//
// Each case builds a throwaway tree, so nothing here depends on the content
// this checkout happens to contain.

import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

import { listingSourcesFor, withListingSources } from '../listing-sources.mjs';

/** @type {string[]} */
const fixtures = [];

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/**
 * Builds a repository root. `files` maps a repo-relative path to its contents.
 * @param {Record<string, string>} files
 */
function root(files) {
  const dir = mkdtempSync(join(tmpdir(), 'aj-listings-'));
  fixtures.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body, 'utf8');
  }
  return dir;
}

const article = (slugEn, slugEs) => ({
  en: `---\nslug: "${slugEn}"\n---\n`,
  es: `---\nslug: "${slugEs}"\n---\n`,
});

/** A small site: two products, two makers, one article. */
function site() {
  const meeting = article('meeting-cost', 'coste-reuniones');
  return {
    'src/content/products/sosnav.md': '---\nname: SOSNav\n---\n',
    'src/content/products/accuvideo.md': '---\nname: AccuVideo\n---\n',
    'src/content/products/notes.txt': 'not an entry',
    'src/content/makers/javier.md': '---\nname: Javier\n---\n',
    'src/content/makers/iosune.md': '---\nname: Iosune\n---\n',
    'src/content/articles/coste-reuniones/en.md': meeting.en,
    'src/content/articles/coste-reuniones/es.md': meeting.es,
  };
}

// The fixed pairs that matter here, in the shape src/utils/hreflang.ts uses.
const PAIRS = [
  { en: '/', es: '/es/' },
  { en: '/about/', es: '/es/sobre/' },
  { en: '/products/', es: '/es/productos/' },
  { en: '/articles/', es: '/es/articulos/' },
  { en: '/thanks/', es: '/es/gracias/', noindex: true },
];

describe('listingSourcesFor', () => {
  it('gives the products listing every product entry, sorted, for both locales', () => {
    const dir = root(site());
    const expected = [
      'src/content/products/accuvideo.md',
      'src/content/products/sosnav.md',
    ];

    assert.deepEqual(listingSourcesFor('/products/', dir), { en: expected, es: expected });
  });

  it('gives the about page every maker entry', () => {
    const dir = root(site());
    const expected = ['src/content/makers/iosune.md', 'src/content/makers/javier.md'];

    assert.deepEqual(listingSourcesFor('/about/', dir), { en: expected, es: expected });
  });

  it('gives the articles listing one entry per locale', () => {
    const dir = root(site());

    assert.deepEqual(listingSourcesFor('/articles/', dir), {
      en: ['src/content/articles/coste-reuniones/en.md'],
      es: ['src/content/articles/coste-reuniones/es.md'],
    });
  });

  it('returns undefined for a page that renders no collection', () => {
    const dir = root(site());

    assert.equal(listingSourcesFor('/', dir), undefined);
    assert.equal(listingSourcesFor('/es/productos/', dir), undefined);
  });

  it('returns empty lists when the collection directory is missing', () => {
    const dir = root({});

    assert.deepEqual(listingSourcesFor('/products/', dir), { en: [], es: [] });
    assert.deepEqual(listingSourcesFor('/about/', dir), { en: [], es: [] });
    assert.deepEqual(listingSourcesFor('/articles/', dir), { en: [], es: [] });
  });
});

describe('withListingSources', () => {
  it('attaches sources to the registered pages and leaves the rest untouched', () => {
    const dir = root(site());
    const out = withListingSources(PAIRS, dir);

    assert.deepEqual(
      out.map((p) => [p.en, p.sources?.en.length ?? null]),
      [
        ['/', null],
        ['/about/', 2],
        ['/products/', 2],
        ['/articles/', 1],
        ['/thanks/', null],
      ],
    );
    assert.deepEqual(out[0], PAIRS[0]);
    assert.deepEqual(out[4], PAIRS[4]);
  });

  it('does not mutate the pairs it is given', () => {
    const dir = root(site());
    const input = PAIRS.map((p) => ({ ...p }));
    withListingSources(input, dir);

    assert.deepEqual(input, PAIRS);
  });

  it('fails when a registered page has no pair', () => {
    const dir = root(site());
    const withoutProducts = PAIRS.filter((p) => p.en !== '/products/');

    assert.throws(
      () => withListingSources(withoutProducts, dir),
      /\/products\/ is registered but no page pair has that path/,
    );
  });
});
