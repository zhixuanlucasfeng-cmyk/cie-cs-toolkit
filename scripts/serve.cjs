// Local preview of the generated static output. Vercel owns production routing.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../vercel.json');
const root = path.resolve(__dirname, '../dist');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  if (pathname === '/_vercel/insights/script.js') { res.writeHead(200,{'Content-Type':mime['.js']}); return res.end(''); }
  const alias = config.redirects.find(r=>!r.has && r.source===pathname);
  const dest = alias?.destination || (pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0,-1) : pathname.endsWith('.html') ? pathname.slice(0,-5) : null);
  if (dest) { res.writeHead(alias ? 301 : 308,{Location:dest+url.search}); return res.end(); }
  const file = path.join(root,pathname === '/' ? 'index.html' : pathname.slice(1));
  const chosen = file.startsWith(root+path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : file+'.html';
  const found = chosen.startsWith(root+path.sep) && fs.existsSync(chosen) && fs.statSync(chosen).isFile() && pathname!=='/404';
  const selected = found ? chosen : path.join(root,'404.html');
  const headers = {'Content-Type':mime[path.extname(selected)] || 'application/octet-stream'};
  // Apply the production site-wide headers (CSP included) so tests run under them.
  for (const h of config.headers.filter(h=>h.source==="/:path*"&&!h.has)) for (const {key,value} of h.headers) headers[key]=value;
  if (url.searchParams.has('selftest') || /^\/(settings|progress|practice|onboarding)$/.test(pathname)) headers['X-Robots-Tag']='noindex, follow';
  res.writeHead(found ? 200 : 404,headers); fs.createReadStream(selected).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('DryRun preview: http://127.0.0.1:4173'));
