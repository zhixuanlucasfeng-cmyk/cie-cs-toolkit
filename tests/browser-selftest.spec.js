const { test, expect } = require('@playwright/test');

test('the public self-test route passes every test in a real browser', async ({ page }) => {
  await page.goto('/?selftest=1');

  await expect(page.locator('#selftest h2')).toHaveText('Self-test: 235 / 235 passed');
  await expect(page.locator('#selftest .f')).toHaveCount(0);
});

test('the ordinary application boots without an uncaught browser error', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');

  await expect(page.locator('.appbar')).toBeVisible();
  await expect(page.locator('.brand-name')).toHaveText('DryRun');
  expect(pageErrors).toEqual([]);
});
