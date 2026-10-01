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
  await expect(page.locator('#view-ide')).toHaveClass(/is-active/);
  await expect(page.getByLabel('Pseudocode editor. Click a line number to set a breakpoint.')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('the retired dashboard route opens the editor and course setup sits below the tools', async ({ page }) => {
  await page.goto('/#/dashboard');

  await expect(page.locator('#view-ide')).toHaveClass(/is-active/);
  await expect(page).toHaveURL(/#\/ide$/);
  await expect(page.getByRole('heading', { name:'Dashboard' })).toHaveCount(0);

  const order = await page.evaluate(() => ({
    tools:document.querySelector('#rail-nav').getBoundingClientRect().top,
    course:document.querySelector('#rail-course-group').getBoundingClientRect().top
  }));
  expect(order.course).toBeGreaterThan(order.tools);
  await expect(page.getByRole('button', { name:'Choose or change course' })).toBeVisible();
});

test('students can choose a readable editor colour theme', async ({ page }) => {
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/#/settings');

  const themes = page.getByRole('group', { name:'Colour theme' }).getByRole('button');
  await expect(themes).toHaveCount(6);
  await page.getByRole('button', { name:'Crimson theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'crimson');
  const crimson = await page.locator('#btn-start').evaluate(button =>
    getComputedStyle(button).backgroundColor.match(/\d+/g).slice(0, 3).map(Number));
  expect(crimson[0]).toBeGreaterThan(140);
  expect(crimson[1]).toBeLessThan(60);
  expect(crimson[2]).toBeLessThan(70);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'crimson');
});

test('Cyber Mode gives code words live colour without ignoring reduced motion', async ({ page }) => {
  await page.goto('/#/settings');
  await page.getByRole('button', { name:'Cyber Mode theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cyber');

  await page.goto('/#/ide');
  const keyword = page.locator('#ide-paint .t-kw').first();
  await expect(keyword).toBeVisible();
  expect(await keyword.evaluate(node => getComputedStyle(node).animationName)).toBe('cyber-word-shift');

  await page.emulateMedia({ reducedMotion:'reduce' });
  expect(await keyword.evaluate(node => getComputedStyle(node).animationName)).toBe('none');
});

test('anonymous traffic measurement is installed and honestly disclosed', async ({ page }) => {
  await page.goto('/#/about');

  await expect(page.locator('script[src="/_vercel/insights/script.js"]')).toHaveCount(1);
  await expect(page.getByText('Vercel Web Analytics', { exact:false })).toBeVisible();
  await expect(page.locator('#view-about .panel-body').first())
    .toContainText('It does not receive your code, answers, progress, feedback or keystrokes.');
  await expect(page.locator('script[data-cf-beacon]')).toHaveCount(0);
});

test('the flowchart builder exposes guided editing controls', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');

  await page.getByRole('tab', { name:'Build a flowchart' }).click();
  await expect(page.getByRole('toolbar', { name:'Add a flowchart step' })).toBeVisible();
  await expect(page.getByRole('button', { name:'Input', exact:true })).toBeVisible();
  await expect(page.getByRole('button', { name:'IF / ELSE', exact:true })).toBeVisible();
  await expect(page.getByRole('region', { name:'Editable flowchart canvas' })).toBeVisible();
});

test('a student adds and edits a subroutine call in the flowchart builder', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');
  await page.getByRole('tab', { name:'Build a flowchart' }).click();

  await page.getByRole('button', { name:'Add a step at position 1 in the main flow' }).click();
  await page.getByRole('button', { name:'Subroutine', exact:true }).click();
  await page.getByLabel('Procedure name').fill('CalculateTotal');
  await page.getByLabel('Arguments').fill('Values, Count');

  await expect(page.getByLabel('Generated Cambridge pseudocode'))
    .toContainText('CALL CalculateTotal(Values, Count)');
  await expect(page.getByLabel('Generated structured English'))
    .toContainText('Call CalculateTotal with Values and Count');
  await expect(page.getByRole('button', { name:'Subroutine: CALL CalculateTotal(Values, Count)' }))
    .toBeVisible();
  await page.getByRole('button', { name:'Run trace' }).click();
  await expect(page.locator('#flow-builder-status'))
    .toContainText('Open the generated code in the IDE and define the procedure');
});

test('a student can swap the visible Yes and No sides of a decision', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');
  await page.getByRole('tab', { name:'Build a flowchart' }).click();
  await page.getByRole('button', { name:'Add a step at position 1 in the main flow' }).click();
  await page.getByRole('button', { name:'IF / ELSE', exact:true }).click();

  const branchDirection = page.getByRole('group', { name:'Decision branch direction' });
  await expect(branchDirection).toBeVisible();
  await page.getByRole('button', { name:'Yes on right' }).click();

  const positions = await page.locator('#flow-builder-canvas svg text.lbl').evaluateAll(labels => {
    const byText = Object.fromEntries(labels.map(label => [label.textContent.trim(), Number(label.getAttribute('x'))]));
    return { yes:byText.Yes, no:byText.No };
  });
  expect(positions.yes).toBeGreaterThan(positions.no);
  await expect(page.getByLabel('Generated Cambridge pseudocode')).toContainText('IF value = 0 THEN');
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

test('a keyboard user can insert, select and edit a flowchart step', async ({ page }) => {
  await page.goto('/#/lab-pseudocode');
  await page.getByRole('tab', { name:'Build a flowchart' }).click();

  const firstSlot = page.getByRole('button', { name:'Add a step at position 1 in the main flow' });
  await firstSlot.focus();
  await page.keyboard.press('Enter');
  const inputButton = page.getByRole('button', { name:'Input', exact:true });
  await inputButton.focus();
  await page.keyboard.press('Enter');

  const node = page.getByRole('button', { name:'Input: value' });
  await node.focus();
  await page.keyboard.press('Enter');
  const variable = page.getByLabel('Variable name');
  await variable.focus();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  for (const key of ['c', 'o', 'u', 'n', 't']) await page.keyboard.press(key);

  await expect(page.getByLabel('Generated Cambridge pseudocode')).toContainText('INPUT count');
});

test('the flowchart builder fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('/#/lab-pseudocode');
  await page.getByRole('tab', { name:'Build a flowchart' }).click();
  await page.getByRole('button', { name:'Example' }).click();

  await expect(page.getByRole('toolbar', { name:'Add a flowchart step' })).toBeVisible();
  await expect(page.getByRole('region', { name:'Editable flowchart canvas' })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Selected step' })).toBeVisible();
  await expect(page.getByRole('heading', { name:'Cambridge pseudocode' })).toBeVisible();
  const sizes = await page.evaluate(() => ({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth
  }));
  expect(sizes.scrollWidth).toBe(sizes.clientWidth);
});
