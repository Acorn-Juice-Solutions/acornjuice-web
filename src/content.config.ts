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

const productStatus = z.enum(['available', 'beta', 'archived', 'draft']);

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
        if (data.status === 'draft') return true;
        return Boolean(
          data.urls.appStore ||
            data.urls.playStore ||
            data.urls.website ||
            data.urls.github,
        );
      },
      {
        message:
          'non-draft products require at least one destination URL (appStore, playStore, website or github)',
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

export const collections = { products, makers };
