import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const bilingualString = z.object({
  en: z.string().min(1),
  es: z.string().min(1),
});

const bilingualArray = z.object({
  en: z.array(z.string().min(1)).min(1),
  es: z.array(z.string().min(1)).min(1),
});

const platform = z.enum([
  'ios',
  'android',
  'windows',
  'macos',
  'linux',
  'web',
  'github',
]);

const productStatus = z.enum([
  'available',
  'beta',
  'pilot',
  'archived',
  'draft',
]);

const productSchemaType = z.enum([
  'SoftwareApplication',
  'MobileApplication',
  'WebApplication',
  'SoftwareSourceCode',
]);

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z
    .object({
      name: z.string().min(1),
      slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
      slugEs: z
        .string()
        .regex(/^[a-z0-9-]+$/, 'slugEs must be lowercase kebab-case'),
      tagline: bilingualString,
      description: bilingualString,
      features: bilingualArray,
      platforms: z.array(platform).min(1),
      urls: z
        .object({
          appStore: z.url().optional(),
          playStore: z.url().optional(),
          website: z.url().optional(),
          github: z.url().optional(),
        })
        .default({}),
      icon: z.string().min(1),
      screenshots: z.array(z.string()).default([]),
      status: productStatus,
      schemaType: productSchemaType,
      order: z.number().int().min(0).default(100),
    })
    .refine(
      (data) => {
        if (data.status === 'draft' || data.status === 'pilot') return true;
        return Boolean(
          data.urls.appStore ||
            data.urls.playStore ||
            data.urls.website ||
            data.urls.github,
        );
      },
      {
        message:
          'products require at least one destination URL (appStore, playStore, website or github) unless status is draft or pilot',
        path: ['urls'],
      },
    ),
});

const makers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/makers' }),
  schema: z.object({
    name: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
    role: bilingualString,
    bio: bilingualString,
    skills: bilingualArray,
    linkedin: z.url(),
    github: z.url().optional(),
    artstation: z.url().optional(),
    vimeo: z.url().optional(),
    avatar: z.string().optional(),
    /**
     * Consent gate: makers are NEVER rendered publicly until this is true.
     * Iosune has explicitly consented via her own founder role; every other
     * maker must confirm in writing before this flag is flipped.
     */
    consentedToPublish: z.boolean(),
    order: z.number().int().min(0).default(100),
  }),
});

const articleSource = z.object({
  title: z.string().min(1),
  url: z.url(),
});

/**
 * One folder per piece, one file per language (`<key>/en.md`, `<key>/es.md`),
 * so the entry id is `<key>/<locale>`. Products keep both languages in the
 * frontmatter because their copy is four lines; an article's body *is* the
 * content and does not fit in a YAML key.
 *
 * A folder missing one of the two languages throws at build time — see
 * `getArticlePairs()` in src/utils/articles.ts. That is deliberate: hreflang
 * reciprocity breaks silently otherwise.
 */
const articles = defineCollection({
  loader: glob({
    pattern: '**/{en,es}.md',
    base: './src/content/articles',
    // Without this, the glob loader takes the frontmatter `slug` as the entry
    // id, and the folder — the thing that pairs both languages — disappears.
    // Forcing the id to `<folder>/<locale>` is what makes keyOf()/localeOf()
    // in src/utils/articles.ts work.
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
    summary: z
      .string()
      .min(120, 'summary doubles as the meta description: at least 120 chars')
      .max(160, 'summary doubles as the meta description: at most 160 chars'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    sources: z.array(articleSource).default([]),
    related: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'related must be a product slug')
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, makers, articles };
