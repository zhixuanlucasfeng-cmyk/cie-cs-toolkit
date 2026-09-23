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

test('a student builds, runs and restores a flowchart', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');
  await page.getByRole('tab', { name:'Build a flowchart' }).click();

  await page.getByRole('button', { name:'Add a step at position 1 in the main flow' }).click();
  await page.getByRole('button', { name:'Input', exact:true }).click();
  await page.getByLabel('Variable name').fill('n');

  await page.getByRole('button', { name:'Add a step at position 2 in the main flow' }).click();
  await page.getByRole('button', { name:'Process', exact:true }).click();
  await page.getByLabel('Variable', { exact:true }).fill('total');
  await page.getByLabel('Value or expression').fill('0');

  await page.getByRole('button', { name:'Add a step at position 3 in the main flow' }).click();
  await page.getByRole('button', { name:'WHILE', exact:true }).click();
  await page.getByLabel('Condition', { exact:true }).fill('n > 0');

  await page.getByRole('button', { name:'Add a step at position 1 in the loop' }).click();
  await page.getByRole('button', { name:'Process', exact:true }).click();
  await page.getByLabel('Variable', { exact:true }).fill('total');
  await page.getByLabel('Value or expression').fill('total + n');
  await page.getByRole('button', { name:'Process', exact:true }).click();
  await page.getByLabel('Variable', { exact:true }).fill('n');
  await page.getByLabel('Value or expression').fill('n - 1');

  await page.getByRole('button', { name:'Add a step at position 4 in the main flow' }).click();
  await page.getByRole('button', { name:'Output', exact:true }).click();
  await page.getByLabel('Value or expression').fill('total');

  await expect(page.getByLabel('Generated Cambridge pseudocode')).toContainText('WHILE n > 0 DO');
  await expect(page.getByLabel('Generated Cambridge pseudocode')).toContainText('OUTPUT total');
  await page.getByLabel('Values for INPUT', { exact:true }).fill('4');
  await page.getByRole('button', { name:'Run trace' }).click();
  await expect(page.getByRole('region', { name:'Trace table of your flowchart' })).toContainText('10');
  await expect(page.locator('#flow-builder-status')).toHaveClass(/ok/);

  await page.reload();
  await page.getByRole('tab', { name:'Build a flowchart' }).click();
  await expect(page.getByLabel('Generated Cambridge pseudocode')).toContainText('WHILE n > 0 DO');
});
