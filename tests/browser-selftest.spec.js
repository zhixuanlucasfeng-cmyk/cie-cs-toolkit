const { test, expect } = require('@playwright/test');

test('the public self-test route passes every test in a real browser', async ({ page }) => {
  await page.goto('/?selftest=1');

  const heading = await page.locator('#selftest h2').textContent();
  const counts = heading && heading.match(/^Self-test: (\d+) \/ (\d+) passed$/);
  expect(counts).not.toBeNull();
  expect(Number(counts[1])).toBe(Number(counts[2]));
  expect(Number(counts[2])).toBeGreaterThanOrEqual(235);
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

test('the flowchart builder exposes guided editing controls', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');

  await page.getByRole('tab', { name:'Build a flowchart' }).click();
  await expect(page.getByRole('toolbar', { name:'Add a flowchart step' })).toBeVisible();
  await expect(page.getByRole('button', { name:'Input', exact:true })).toBeVisible();
  await expect(page.getByRole('button', { name:'IF / ELSE', exact:true })).toBeVisible();
  await expect(page.getByRole('region', { name:'Editable flowchart canvas' })).toBeVisible();
});
