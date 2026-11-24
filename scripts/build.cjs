// One HTML source, one route registry. Generate crawlable pages on every deploy.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pages = JSON.parse(source.match(/<script id="seo-pages" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const origin = 'https://dryruncs.com';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
fs.mkdirSync(out, {recursive:true});
// Only generated output is cleared. Never touch source or browser storage.
for (const name of fs.readdirSync(out)) fs.rmSync(path.join(out, name), {recursive:true, force:true});
let template = source.replace(/<style>([\s\S]*?)<\/style>/, (_, css) => {
  fs.writeFileSync(path.join(out, 'app.css'), css);
  return '<link rel="stylesheet" href="/app.css">';
}).replace(/<script>([\s\S]*?)<\/script>/, (_, js) => {
  fs.writeFileSync(path.join(out, 'app.js'), js);
  return '<script src="/app.js"></script>';
});
for (const [view, page] of Object.entries(pages)) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  const meta = {description:page.description,robots:page.index ? 'index, follow' : 'noindex, follow',
    'og:title':page.title,'og:description':page.description,'og:url':origin+page.path,
    'twitter:title':page.title,'twitter:description':page.description};
  for (const [name,value] of Object.entries(meta)) {
    html = html.replace(new RegExp(`<meta (name|property)="${name}" content="[^"]*">`), (_, attr) => `<meta ${attr}="${name}" content="${esc(value)}">`);
  }
  html = html.replace(/<meta name="keywords"[^>]*>\n/, '')
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${origin+page.path}">`)
    .replace(/<script id="seo-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script id="seo-structured-data" type="application/ld+json">${JSON.stringify({
        '@context':'https://schema.org','@type':page.teaches ? 'LearningResource' : 'WebPage',
        name:page.title,description:page.description,url:origin+page.path,inLanguage:'en',
        ...(page.teaches ? {isAccessibleForFree:true,learningResourceType:'Interactive tool',teaches:page.teaches} : {})
      }).replaceAll('<','\\u003c')}</script>`)
    .replace(`class="view" id="view-${view}"`, `class="view is-active" id="view-${view}"`);
  html = html.replace('<div role="list" aria-labelledby="rail-nav-label" id="rail-nav"></div>',
    '<div role="list" aria-labelledby="rail-nav-label" id="rail-nav">'+
    ['ide','practice','lab-pseudocode','lab-logic','lab-sql','progress','settings'].map(v =>
      `<div role="listitem"><a class="rail-item" data-go="${v}" href="${pages[v].path}">${esc(pages[v].label)}</a></div>`).join('')+'</div>');
  fs.writeFileSync(path.join(out, page.path === '/' ? 'index.html' : page.path.slice(1)+'.html'), html);
}
fs.writeFileSync(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  Object.values(pages).filter(p=>p.index).map(p=>`  <url><loc>${origin+p.path}</loc></url>`).join('\n')+'\n</urlset>\n');
for (const name of ['robots.txt','og.png','og.svg']) fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.writeFileSync(path.join(out,'404.html'), `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | DryRun</title><meta name="robots" content="noindex, follow"><link rel="stylesheet" href="/app.css"></head><body><main style="padding:48px;max-width:70ch;margin:auto"><h1>Page not found</h1><p>This address does not match a DryRun page.</p><p><a href="/">Open the Cambridge pseudocode editor</a> or <a href="/pseudocode-tools">explore trace tables and flowcharts</a>.</p></main></body></html>`);
console.log(`Built ${Object.keys(pages).length} pages; sitemap contains ${Object.values(pages).filter(p=>p.index).length} public URLs.`);
