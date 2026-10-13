// Article URL pairs, derived from the filesystem instead of the content
// collection.
//
// `astro.config.mjs` needs the pairs to build the sitemap (its filter drops
// anything unregistered, and its serialize emits the hreflang alternates), but
// the config is evaluated before the `astro:content` virtual module exists, so
// it cannot use src/utils/articles.ts. This reads the same files that feed the
// collection, which is why the two cannot drift without both changing.
//
// Frontmatter is read with a narrow regex, like the other scripts here: the
// only field needed is `slug`, and zod validates the rest at build time.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** Where the articles live under a repository root. */
const articlesDir = (root) => join(root, 'src', 'content', 'articles');

function slugOf(source) {
  const m = source.match(/^slug:[ \t]*["']?([a-z0-9-]+)["']?[ \t]*$/m);
  return m ? m[1] : null;
}

function isDraft(source) {
  return /^draft:[ \t]*true[ \t]*$/m.test(source);
}

/**
 * @param {string} [root] repository root; defaults to this checkout. The unit
 *   tests point it at a throwaway tree.
 * @returns {Array<{en: string, es: string, sources: {en: string, es: string}}>}
 */
export function articlePagePairs(root = ROOT) {
  const articles = articlesDir(root);
  let folders;
  try {
    folders = readdirSync(articles, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }

  const pairs = [];

  for (const folder of folders.sort()) {
    const slugs = {};
    let draft = false;

    for (const locale of ['en', 'es']) {
      let source;
      try {
        source = readFileSync(join(articles, folder, `${locale}.md`), 'utf8');
      } catch {
        throw new Error(
          `article "${folder}" is missing ${locale}.md — every article ships in both languages`,
        );
      }
      if (isDraft(source)) draft = true;
      const slug = slugOf(source);
      if (!slug) {
        throw new Error(`article "${folder}/${locale}.md" has no usable slug`);
      }
      slugs[locale] = slug;
    }

    if (draft) continue;

    pairs.push({
      en: `/articles/${slugs.en}/`,
      es: `/es/articulos/${slugs.es}/`,
      // Content entry per locale, so the sitemap's <lastmod> follows the
      // commit that last touched the article itself (scripts/lastmod.mjs).
      sources: {
        en: `src/content/articles/${folder}/en.md`,
        es: `src/content/articles/${folder}/es.md`,
      },
    });
  }

  return pairs;
}

/**
 * Content entries that feed the article listing pages, per locale. A listing
 * changes whenever an article is added or edited, so its sitemap <lastmod>
 * must follow these files as well as its own route (see scripts/lastmod.mjs).
 * @param {string} [root] repository root; defaults to this checkout.
 * @returns {{en: string[], es: string[]}}
 */
export function articleListingSources(root = ROOT) {
  const pairs = articlePagePairs(root);
  return {
    en: pairs.map((p) => p.sources.en),
    es: pairs.map((p) => p.sources.es),
  };
}
