import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export type ArticleEntry = CollectionEntry<'articles'>;

export type ArticlePair = {
  /** Folder that groups both languages, e.g. `cra-notificacion-vulnerabilidades`. */
  readonly key: string;
  readonly en: ArticleEntry;
  readonly es: ArticleEntry;
};

/** Entry ids are `<folder>/<locale>`; both facts come from there. */
export function keyOf(entry: ArticleEntry): string {
  const i = entry.id.lastIndexOf('/');
  if (i === -1) {
    throw new Error(
      `article id without a folder: "${entry.id}" — articles live in src/content/articles/<key>/{en,es}.md`,
    );
  }
  return entry.id.slice(0, i);
}

export function localeOf(entry: ArticleEntry): Locale {
  return entry.id.endsWith('/es') ? 'es' : 'en';
}

export function articlePath(slug: string, locale: Locale): string {
  return locale === 'es' ? `/es/articulos/${slug}/` : `/articles/${slug}/`;
}

/** Index paths for the section itself, kept next to the detail paths. */
export const ARTICLES_INDEX = { en: '/articles/', es: '/es/articulos/' } as const;

/**
 * Published articles, paired by language and sorted newest first.
 *
 * A folder missing one language throws: every downstream consumer (routes,
 * hreflang pairs, the language switcher) assumes both exist, and a half-built
 * pair would ship a page whose alternate 404s.
 */
export async function getArticlePairs(): Promise<ArticlePair[]> {
  const entries = await getCollection('articles', ({ data }) => !data.draft);

  const byKey = new Map<string, Partial<Record<Locale, ArticleEntry>>>();
  for (const entry of entries) {
    const key = keyOf(entry);
    const slot = byKey.get(key) ?? {};
    slot[localeOf(entry)] = entry;
    byKey.set(key, slot);
  }

  const pairs: ArticlePair[] = [];
  for (const [key, slot] of byKey) {
    if (!slot.en || !slot.es) {
      const missing = slot.en ? 'es' : 'en';
      throw new Error(
        `article "${key}" is missing ${missing}.md — every article ships in both languages`,
      );
    }
    pairs.push({ key, en: slot.en, es: slot.es });
  }

  return pairs.sort(
    (a, b) => b.en.data.date.getTime() - a.en.data.date.getTime(),
  );
}
