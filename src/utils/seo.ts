import type { Locale } from './i18n';

const SITE_URL = 'https://acornjuice.com';

export const ORG_ID = `${SITE_URL}/#organization`;
export const LOGO_ID = `${SITE_URL}/#logo`;
export const IOSUNE_ID = `${SITE_URL}/#person-iosune`;
export const JAVIER_ID = `${SITE_URL}/#person-javier`;

/**
 * Consent gate for exposing Javier publicly. Kept as a single boolean so it can
 * be flipped in exactly one place once he confirms.
 *
 * TODO(consent-blocker): Enabled for local preview. REVERT to `false` before
 * pushing to `main` unless Javier has confirmed in writing that he consents to
 * being published on acornjuice.com with his name and LinkedIn URL.
 * Tracked in .my-notes/acornjuice-web-manual-actions.md §4.
 */
export const JAVIER_CONSENTED = true as boolean;

type GraphNode = Record<string, unknown>;

export type SchemaGraph = {
  '@context': 'https://schema.org';
  '@graph': GraphNode[];
};

/** Base Organization + Persons + Logo, present on every page. */
function baseNodes(): GraphNode[] {
  const nodes: GraphNode[] = [];

  // Javier is the senior partner — he appears first in both the visible maker
  // grid (via `order` in the content collection) and here in structured data.
  const founders: GraphNode[] = [];
  if (JAVIER_CONSENTED) {
    founders.push({ '@id': JAVIER_ID });
  }
  founders.push({ '@id': IOSUNE_ID });

  nodes.push({
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Acorn Juice Solutions',
    legalName: 'ACORN JUICE SOLUTIONS SL',
    url: `${SITE_URL}/`,
    logo: { '@id': LOGO_ID },
    email: 'info@acornjuice.com',
    vatID: 'ESB71336218',
    taxID: 'B71336218',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle Bosquecillo, 6',
      postalCode: '31191',
      addressLocality: 'Beriáin',
      addressRegion: 'Navarra',
      addressCountry: 'ES',
    },
    founder: founders,
    sameAs: [
      'https://github.com/Acorn-Juice-Solutions',
      'https://www.producthunt.com/products/accuvideo',
    ],
  });

  nodes.push({
    '@type': 'ImageObject',
    '@id': LOGO_ID,
    url: `${SITE_URL}/assets/logo.png`,
    contentUrl: `${SITE_URL}/assets/logo.png`,
    width: 223,
    height: 223,
    caption: 'Acorn Juice Solutions logo',
  });

  if (JAVIER_CONSENTED) {
    nodes.push({
      '@type': 'Person',
      '@id': JAVIER_ID,
      name: 'Javier Horrillo Barrantes',
      jobTitle: 'Co-founder & DevOps',
      worksFor: { '@id': ORG_ID },
      sameAs: [
        'https://es.linkedin.com/in/javier-horrillo-barrantes-208915326/',
      ],
    });
  }

  nodes.push({
    '@type': 'Person',
    '@id': IOSUNE_ID,
    name: 'Iosune Goñi',
    jobTitle: 'Co-founder & Developer',
    worksFor: { '@id': ORG_ID },
    sameAs: ['https://www.linkedin.com/in/iosunegoni'],
  });

  return nodes;
}

/** WebSite node (typically added on the home page). */
export function websiteNode(locale: Locale): GraphNode {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: 'Acorn Juice Solutions',
    inLanguage: locale === 'es' ? 'es-ES' : 'en',
    publisher: { '@id': ORG_ID },
  };
}

/** Generic WebPage node — used on legal / thanks / etc. */
export function webpageNode(opts: {
  url: string;
  name: string;
  description: string;
  locale: Locale;
}): GraphNode {
  return {
    '@type': 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: opts.locale === 'es' ? 'es-ES' : 'en',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': ORG_ID },
  };
}

/**
 * Build the final JSON-LD graph to inject in the page.
 * Callers pass any page-specific extra nodes (WebSite, WebPage, Software/MobileApplication,
 * CollectionPage + ItemList, …) and they are appended to the base.
 */
export function buildGraph(extraNodes: GraphNode[] = []): SchemaGraph {
  return {
    '@context': 'https://schema.org',
    '@graph': [...baseNodes(), ...extraNodes],
  };
}
