// Tests for the filesystem-derived article pairs.
//
// astro.config.mjs builds the sitemap from these pairs, and scripts/lastmod.mjs
// dates each URL from the `sources` they carry, so the properties pinned here
// are the ones the sitemap depends on: which articles ship, under which paths,
// and which content file stands behind each locale.
//
// Each case builds a throwaway tree and points the reader at it, so nothing
// here depends on the articles this checkout happens to contain.

import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, it } from 'node:test';

import { articleListingSources, articlePagePairs } from '../article-pairs.mjs';

/** @type {string[]} */
const fixtures = [];

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

/**
 * Builds a repository root whose articles are `articles`: folder name →
 * { en, es } frontmatter bodies (the string after the opening `---`).
 * @param {Record<string, {en?: string, es?: string}>} articles
 */
function root(articles) {
  const dir = mkdtempSync(join(tmpdir(), 'aj-articles-'));
  fixtures.push(dir);
  for (const [folder, locales] of Object.entries(articles)) {
    for (const [locale, front] of Object.entries(locales)) {
      const path = join(dir, 'src', 'content', 'articles', folder, `${locale}.md`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `---\n${front}\n---\n\nBody.\n`, 'utf8');
    }
  }
  return dir;
}

const published = (slugEn, slugEs) => ({
  en: `title: "T"\nslug: "${slugEn}"\ndate: 2026-10-07`,
  es: `title: "T"\nslug: "${slugEs}"\ndate: 2026-10-07`,
});

describe('articlePagePairs', () => {
  it('builds both paths from the slugs and the sources from the folder', () => {
    const dir = root({ 'coste-reuniones': published('meeting-cost', 'coste-reuniones') });

    assert.deepEqual(articlePagePairs(dir), [
      {
        en: '/articles/meeting-cost/',
        es: '/es/articulos/coste-reuniones/',
        sources: {
          en: 'src/content/articles/coste-reuniones/en.md',
          es: 'src/content/articles/coste-reuniones/es.md',
        },
      },
    ]);
  });

  it('orders articles by folder name so the sitemap is stable', () => {
    const dir = root({
      zeta: published('z-en', 'z-es'),
      alpha: published('a-en', 'a-es'),
    });

    assert.deepEqual(
      articlePagePairs(dir).map((p) => p.en),
      ['/articles/a-en/', '/articles/z-en/'],
    );
  });

  it('skips an article flagged draft in either locale', () => {
    const dir = root({
      visible: published('v-en', 'v-es'),
      'draft-en': { en: 'slug: "d-en"\ndraft: true', es: 'slug: "d-es"' },
      'draft-es': { en: 'slug: "e-en"', es: 'slug: "e-es"\ndraft: true' },
    });

    assert.deepEqual(
      articlePagePairs(dir).map((p) => p.en),
      ['/articles/v-en/'],
    );
  });

  it('fails when an article is missing one of its two languages', () => {
    const dir = root({ lonely: { en: 'slug: "only-en"' } });

    assert.throws(() => articlePagePairs(dir), /"lonely" is missing es\.md/);
  });

  it('fails when a locale file has no usable slug', () => {
    const dir = root({ unnamed: { en: 'title: "T"', es: 'slug: "x"' } });

    assert.throws(() => articlePagePairs(dir), /"unnamed\/en\.md" has no usable slug/);
  });

  it('returns nothing when the articles directory does not exist', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aj-articles-empty-'));
    fixtures.push(dir);

    assert.deepEqual(articlePagePairs(dir), []);
  });
});

describe('articleListingSources', () => {
  it('lists every published article entry per locale, in pair order', () => {
    const dir = root({
      b: published('b-en', 'b-es'),
      a: published('a-en', 'a-es'),
      hidden: { en: 'slug: "h-en"\ndraft: true', es: 'slug: "h-es"' },
    });

    assert.deepEqual(articleListingSources(dir), {
      en: ['src/content/articles/a/en.md', 'src/content/articles/b/en.md'],
      es: ['src/content/articles/a/es.md', 'src/content/articles/b/es.md'],
    });
  });

  it('is empty when there are no articles', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aj-articles-empty-'));
    fixtures.push(dir);

    assert.deepEqual(articleListingSources(dir), { en: [], es: [] });
  });
});
