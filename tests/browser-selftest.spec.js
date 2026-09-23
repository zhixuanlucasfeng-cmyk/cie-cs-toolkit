const { test, expect } = require('@playwright/test');

test('the public self-test route passes every test in a real browser', async ({ page }) => {
  await page.goto('/?selftest=1');

  await expect(page.locator('#selftest h2')).toHaveText('Self-test: 235 / 235 passed');
  await expect(page.locator('#selftest .f')).toHaveCount(0);
});
