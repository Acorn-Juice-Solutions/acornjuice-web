/**
 * Lighthouse CI config for acornjuice-web.
 * Thresholds are enforced on the 4 indexable landing pages that carry the
 * bulk of the SEO/authority weight. Product detail pages are excluded on
 * purpose — LCP on those is dominated by third-party icon/screenshot assets
 * we don't fully control yet.
 */
export default {
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
