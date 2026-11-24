const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = name => fs.readFileSync(path.join(root,'dist',name),'utf8');
const source = fs.readFileSync(path.join(root,'index.html'),'utf8');
const pages = JSON.parse(source.match(/<script id="seo-pages" type="application\/json">([\s\S]*?)<\/script>/)[1]);
test('all canonical pages ship unique metadata, active body and crawlable links without JavaScript',()=>{
  const titles = new Set(), descriptions = new Set();
  for (const [view,page] of Object.entries(pages)) {
    const html = read(page.path==='/' ? 'index.html' : page.path.slice(1)+'.html');
    assert(html.includes(`class="view is-active" id="view-${view}"`));
    assert.equal((html.match(/class="view is-active"/g)||[]).length,1);
    assert(html.includes(`rel="canonical" href="https://dryruncs.com${page.path}"`));
    assert(html.includes('href="/pseudocode-tools"'));
    assert(html.includes(`content="${page.index ? 'index' : 'noindex'}, follow"`));
    const schema=JSON.parse(html.match(/<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.url,'https://dryruncs.com'+page.path);
    assert(!schema.aggregateRating && !schema.offers);
    titles.add(page.title); descriptions.add(page.description);
  }
  assert.equal(titles.size,Object.keys(pages).length);assert.equal(descriptions.size,titles.size);
});
test('sitemap contains exactly the indexable canonical pages and excludes tests and device data',()=>{
  const urls=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.deepEqual(urls,Object.values(pages).filter(p=>p.index).map(p=>'https://dryruncs.com'+p.path));
  assert.equal(new Set(urls).size,urls.length);
  assert(urls.every(url=>!url.includes('?')));
  assert(read('robots.txt').includes('Sitemap: https://dryruncs.com/sitemap.xml'));
});
test('assets, verification token and a real error document are in the deployment output',()=>{
  for(const f of ['app.js','app.css','og.png']) assert(fs.statSync(path.join(root,'dist',f)).size>0);
  assert(read('index.html').includes('name="google-site-verification"'));
  assert(read('404.html').includes('noindex, follow'));
  assert(read('index.html').includes('Run Cambridge pseudocode online'));
});
