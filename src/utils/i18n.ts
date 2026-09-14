import en from '../i18n/en.json';
import es from '../i18n/es.json';

export type Locale = 'en' | 'es';
export const LOCALES: readonly Locale[] = ['en', 'es'] as const;
export const DEFAULT_LOCALE: Locale = 'en';

const DICTIONARIES = { en, es } as const satisfies Record<Locale, unknown>;

/**
 * Infer the active locale from a URL's pathname.
 * Anything under `/es/` (or exactly `/es`) is Spanish; the rest defaults to English.
 */
export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  if (pathname === '/es' || pathname.startsWith('/es/')) {
    return 'es';
  }
  return 'en';
}

/**
 * Resolve a nested i18n key like `nav.home` for the given locale.
 * Throws at build time if the key is missing — surfaces broken microcopy immediately
 * instead of silently rendering `undefined`.
 */
export function t(locale: Locale, key: string): string {
  const dict = DICTIONARIES[locale] as unknown;
  const parts = key.split('.');
  let current: unknown = dict;

  for (const part of parts) {
    if (
      current !== null &&
      typeof current === 'object' &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      throw new Error(`i18n key missing [${locale}]: ${key}`);
    }
  }

  if (typeof current !== 'string') {
    throw new Error(`i18n key resolved to non-string [${locale}]: ${key}`);
  }

  return current;
}

/**
 * Convenience wrapper that returns a locale-bound translator.
 * Typical usage inside an .astro component:
 *
 *   const t = useTranslator(getLocaleFromUrl(Astro.url));
 *   <h1>{t('home.hero_title')}</h1>
 */
export function useTranslator(locale: Locale): (key: string) => string {
  return (key: string) => t(locale, key);
}

/**
 * Substitute `{name}` placeholders in a translated string.
 * Missing placeholders throw so a typo in a key becomes visible at build time.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in values)) {
      throw new Error(`interpolate: missing value for {${name}}`);
    }
    return String(values[name]);
  });
}

export function htmlLangAttr(locale: Locale): string {
  return locale === 'es' ? 'es-ES' : 'en';
}

export function ogLocale(locale: Locale): string {
  return locale === 'es' ? 'es_ES' : 'en_US';
}
