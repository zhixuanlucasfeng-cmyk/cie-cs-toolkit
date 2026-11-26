const {test, expect} = require('@playwright/test');
const samples = require('./classroom-programs.cjs');
test('classroom procedures and functions run through the actual Run button', async ({page}) => {
  await page.goto('/');
  for (const sample of samples) {
    await page.locator('#ide-src').fill(sample.code);
    await page.locator('#ide-inputs').fill(sample.inputs || '');
    await page.getByRole('button',{name:'Run',exact:true}).click();
    await expect(page.locator('#ide-status'), sample.name).toContainText('Finished');
    await expect(page.locator('#ide-output'), sample.name).toHaveText(sample.output);
  }
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.locator('#ide-status')).toContainText('Finished');
  await expect(page.locator('#ide-output')).toHaveText('X');
});
test('function INPUT accepts correction and resumes; function trace is visible', async ({page}) => {
  await page.goto('/');
  await page.locator('#ide-src').fill(samples.find(s=>s.name==='function reads input').code);
  await page.locator('#ide-inputs').fill('');
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.locator('#ide-ask')).toBeVisible();
  await page.locator('#ide-ask-value').fill('wrong');
  await page.locator('#ide-ask-send').click();
  await expect(page.locator('#ide-ask-err')).toContainText('whole number');
  await page.locator('#ide-ask-value').fill('8');
  await page.locator('#ide-ask-send').click();
  await expect(page.locator('#ide-output')).toHaveText('16');
  await page.getByRole('tab',{name:'Trace',exact:true}).click();
  await expect(page.locator('#ide-trace')).toContainText('Value');
});
for (const [label, width, height] of [['MacBook',1440,900],['Windows',1366,768],['iPad landscape',1180,820],['iPad portrait',820,1180],['phone',390,844]]) {
  test(`logic workspace fits ${label} and works with keyboard or touch`, async ({page}, testInfo) => {
    await page.setViewportSize({width,height});
    await page.goto('/logic');
    await expect(page.locator('#circ-out svg')).toBeVisible();
    const bounds = await page.locator('#circ-out').boundingBox();
    expect(bounds.width).toBeGreaterThan(width * (width>=1000 ? .55 : .8));
    expect(bounds.height).toBeGreaterThan(250);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const toggle = page.getByRole('button',{name:'Toggle input A',exact:true});
    if (testInfo.project.use.hasTouch) await toggle.tap();
    else await toggle.click();
    await expect(page.locator('#logic-inputs')).toContainText('A = 1');
    await expect(page.locator('#logic-output')).toHaveText('Q = 1');
    await page.locator('#tt-out tbody tr').first().press('Enter');
    await expect(page.locator('#logic-output')).toHaveText('Q = 0');
    const before = await page.locator('#circ-out svg').boundingBox();
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();
    const after = await page.locator('#circ-out svg').boundingBox();
    expect(after.width).toBeGreaterThan(before.width);
    await page.getByRole('button',{name:'Fit circuit',exact:true}).click();
    await page.getByRole('button',{name:'Open navigation',exact:true}).click();
    await page.getByRole('link',{name:'Editor',exact:true}).click();
    await expect(page.locator('#view-ide')).toBeVisible();
  });
}
test('editing an expression never leaves a stale circuit or stale table active', async ({page})=>{
  await page.goto('/logic');
  await page.getByLabel('Expression',{exact:true}).fill('A AND');
  await page.getByRole('button',{name:'Generate',exact:true}).click();
  await expect(page.locator('#logic-status')).toHaveClass(/err/);
  await expect(page.locator('#circ-out svg')).toHaveCount(0);
  await page.getByLabel('Expression',{exact:true}).fill('A NAND B');
  await page.getByLabel('Expression',{exact:true}).press('Enter');
  await expect(page.locator('#logic-output')).toHaveText('Q = 1');
});
