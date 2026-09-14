import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KEY_PAGES = [
  { name: 'home EN', path: '/' },
  { name: 'home ES', path: '/es/' },
  { name: 'about EN', path: '/about/' },
  { name: 'about ES', path: '/es/sobre/' },
  { name: 'products EN', path: '/products/' },
  { name: 'products ES', path: '/es/productos/' },
];

for (const page of KEY_PAGES) {
  test(`${page.name} has no axe violations`, async ({ page: browser }) => {
    await browser.goto(page.path);
    const results = await new AxeBuilder({ page: browser })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Fail with the actual violation list to make triage cheap.
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });
}

test('contact form is keyboard navigable', async ({ page }) => {
  await page.goto('/#contact');
  const email = page.locator('#contact-email');
  await email.scrollIntoViewIfNeeded();

  // Tab from just before the email field through the form and land on submit.
  await email.focus();
  await expect(email).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#contact-subject')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#contact-message')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="data_consent"]')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('.contact-submit')).toBeFocused();
});
