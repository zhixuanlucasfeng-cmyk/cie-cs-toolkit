const {test,expect} = require('@playwright/test');
test('clean URLs preserve editing state, history and per-page metadata',async ({page})=>{
  await page.goto('/');
  await page.locator('#ide-src').fill('OUTPUT "Saved SEO test"');
  await page.locator('#rail-nav a[data-go="lab-sql"]').click();
  await expect(page).toHaveURL(/\/sql$/);
  await expect(page).toHaveTitle('SQL Practice Online: DDL & DML Editor | DryRun');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://dryruncs.com/sql');
  await page.goBack();
  await expect(page.locator('#view-ide')).toHaveClass(/is-active/);
  await expect(page.locator('#ide-src')).toHaveValue('OUTPUT "Saved SEO test"');
  await expect(page.locator('#ide-saved')).toHaveText('saved');
  await page.reload();
  await expect(page.locator('#ide-src')).toHaveValue('OUTPUT "Saved SEO test"');
});
test('direct links and legacy hashes open the same tool; device pages stay noindex',async ({page})=>{
  await page.goto('/sql');await expect(page.locator('#view-lab-sql')).toHaveClass(/is-active/);
  await page.goto('/#/lab-pseudocode');await expect(page).toHaveURL(/\/pseudocode-tools$/);
  await page.goto('/settings');await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex, follow');
  await page.reload();await expect(page.locator('#view-settings')).toHaveClass(/is-active/);
  const missing=await page.goto('/this-page-does-not-exist');expect(missing.status()).toBe(404);
});
test('a crawler without JavaScript can read content and follow public links',async ({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto(baseURL+'/');
  await expect(page.getByRole('heading',{name:'Run Cambridge pseudocode online'})).toBeVisible();
  await page.getByRole('navigation',{name:'Explore DryRun'}).getByRole('link',{name:'SQL practice'}).click();
  await expect(page.getByRole('heading',{name:'SQL Lab',exact:true})).toBeVisible();
  await context.close();
});
