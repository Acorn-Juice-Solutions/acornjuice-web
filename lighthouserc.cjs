/**
 * Lighthouse CI config for acornjuice-web.
 *
 * CommonJS on purpose: @lhci/cli only discovers lighthouserc.{js,cjs,json,yml,yaml}.
 * This file used to be lighthouserc.mjs, which lhci silently ignored — `lhci
 * autorun` then fell back to its defaults (every page in dist/, mobile
 * emulation, the lighthouse:recommended assertions) and none of the thresholds
 * below were ever enforced. Do not rename it back to .mjs.
 *
 * Thresholds are enforced on the 4 indexable landing pages that carry the
 * bulk of the SEO/authority weight, plus every published article in both
 * languages. Product detail pages are excluded on purpose — LCP on those is
 * dominated by third-party icon/screenshot assets we don't fully control yet.
 *
 * Adding an article means adding its two URLs here.
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'localhost:4321',
      startServerReadyTimeout: 60000,
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/es/',
        'http://localhost:4321/about/',
        'http://localhost:4321/products/',
        'http://localhost:4321/articles/cra-vulnerability-reporting/',
        'http://localhost:4321/es/articulos/cra-notificacion-vulnerabilidades/',
        'http://localhost:4321/articles/meeting-cost/',
        'http://localhost:4321/es/articulos/coste-reuniones/',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
