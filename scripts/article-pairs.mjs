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
const ARTICLES = join(ROOT, 'src', 'content', 'articles');

function slugOf(source) {
  const m = source.match(/^slug:[ \t]*["']?([a-z0-9-]+)["']?[ \t]*$/m);
  return m ? m[1] : null;
}

function isDraft(source) {
  return /^draft:[ \t]*true[ \t]*$/m.test(source);
}

/** @returns {Array<{en: string, es: string}>} */
export function articlePagePairs() {
  let folders;
  try {
    folders = readdirSync(ARTICLES, { withFileTypes: true })
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
        source = readFileSync(join(ARTICLES, folder, `${locale}.md`), 'utf8');
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
    });
  }

  return pairs;
}
