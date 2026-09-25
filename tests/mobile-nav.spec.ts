import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The desktop section links are hidden below 640px; these tests cover the
// <details> menu that replaces them on phones.
const PHONE = { width: 375, height: 740 };

const CASES = [
  {
    name: 'EN',
    path: '/',
    menu: 'Menu',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products/' },
      { label: 'Articles', href: '/articles/' },
      { label: 'About', href: '/about/' },
    ],
  },
  {
    name: 'ES',
    path: '/es/',
    menu: 'Menú',
    links: [
      { label: 'Inicio', href: '/es/' },
      { label: 'Productos', href: '/es/productos/' },
      { label: 'Artículos', href: '/es/articulos/' },
      { label: 'Sobre nosotros', href: '/es/sobre/' },
    ],
  },
];

test.describe('mobile navigation', () => {
  test.use({ viewport: PHONE });

  for (const c of CASES) {
    test(`${c.name}: menu exposes every section and navigates`, async ({
      page,
    }) => {
      await page.goto(c.path);

      // Desktop bar is hidden, the toggle is visible.
      await expect(page.locator('.site-nav')).toBeHidden();
      const toggle = page.locator('summary.mobile-nav-toggle');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveText(c.menu);

      const panel = page.locator('.mobile-nav-panel');
      await expect(panel).toBeHidden();

      await toggle.click();
      await expect(panel).toBeVisible();

      for (const link of c.links) {
        await expect(
          panel.getByRole('link', { name: link.label, exact: true }),
        ).toHaveAttribute('href', link.href);
      }

      // The current page is marked in the menu.
      await expect(panel.locator('a[aria-current="page"]')).toHaveAttribute(
        'href',
        c.path,
      );

      const target = c.links[2];
      await panel.getByRole('link', { name: target.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${target.href}$`));
    });
  }

  test('Escape closes the menu and returns focus to the toggle', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.locator('summary.mobile-nav-toggle');
    const panel = page.locator('.mobile-nav-panel');

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('clicking outside closes the menu', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('.mobile-nav-panel');

    await page.locator('summary.mobile-nav-toggle').click();
    await expect(panel).toBeVisible();

    await page.locator('main').click({ position: { x: 10, y: 300 } });
    await expect(panel).toBeHidden();
  });

  test('header does not overflow the viewport', async ({ page }) => {
    await page.goto('/es/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('open menu has no axe violations', async ({ page }) => {
    await page.goto('/');
    await page.locator('summary.mobile-nav-toggle').click();
    const results = await new AxeBuilder({ page })
      .include('.site-header')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
});

test('desktop: section links visible, mobile menu hidden', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('.site-nav')).toBeVisible();
  await expect(page.locator('details.mobile-nav')).toBeHidden();
});
