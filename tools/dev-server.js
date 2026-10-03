// Local preview that behaves like the live site:
//  - serves the pages (with the same rewrites as vercel.json)
//  - runs api/*.js the way Vercel does
//  - fakes the Upstash database in memory, saved to tools/.devdata.json
// Run:  node tools/dev-server.js   then open http://localhost:5611
// The local admin password is ADMIN_PASSWORD below (or set the env var). It only works here.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 5611;
const DATA = path.join(__dirname, '.devdata.json');

process.env.KV_REST_API_URL = `http://127.0.0.1:${PORT}/__kv`;
process.env.KV_REST_API_TOKEN = 'dev';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kingpin-local-preview';

/* ---------------- fake Upstash (only the commands the API uses) ---------------- */
let db = { str: {}, hash: {}, zset: {}, list: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { /* first run */ }
let timer = null;
const persist = () => { clearTimeout(timer); timer = setTimeout(() => fs.writeFile(DATA, JSON.stringify(db), () => {}), 150); };
const range = (arr, s, e) => arr.slice(Number(s), Number(e) < 0 ? arr.length + Number(e) + 1 : Number(e) + 1);

function exec(a) {
  const c = String(a[0]).toUpperCase(), k = a[1];
  switch (c) {
    case 'GET': return k in db.str ? db.str[k] : null;
    case 'SET':
      if (a.slice(3).some((x) => String(x).toUpperCase() === 'NX') && k in db.str) return null;
      db.str[k] = a[2]; persist(); return 'OK';
    case 'DEL': {
      let n = 0;
      for (const key of a.slice(1)) for (const t of ['str', 'hash', 'zset', 'list']) if (key in db[t]) { delete db[t][key]; n++; }
      persist(); return n;
    }
    case 'MGET': return a.slice(1).map((x) => (x in db.str ? db.str[x] : null));
    case 'INCR': db.str[k] = String(Number(db.str[k] || 0) + 1); return Number(db.str[k]);
    case 'EXPIRE': return 1;
    case 'HSET': {
      const h = db.hash[k] || (db.hash[k] = {}); let n = 0;
      for (let i = 2; i < a.length; i += 2) { if (!(a[i] in h)) n++; h[a[i]] = a[i + 1]; }
      persist(); return n;
    }
    case 'HSETNX': {
      const h = db.hash[k] || (db.hash[k] = {});
      if (a[2] in h) return 0;
      h[a[2]] = a[3]; persist(); return 1;
    }
    case 'HGET': return (db.hash[k] || {})[a[2]] ?? null;
    case 'HDEL': {
      const h = db.hash[k] || {}; let n = 0;
      for (const f of a.slice(2)) if (f in h) { delete h[f]; n++; }
      persist(); return n;
    }
    case 'HVALS': return Object.values(db.hash[k] || {});
    case 'HGETALL': return Object.entries(db.hash[k] || {}).flat();
    case 'ZADD': { const z = db.zset[k] || (db.zset[k] = {}); z[a[3]] = Number(a[2]); persist(); return 1; }
    case 'ZREVRANGE': return range(Object.entries(db.zset[k] || {}).sort((x, y) => y[1] - x[1]).map((x) => x[0]), a[2], a[3]);
    case 'LPUSH': { const l = db.list[k] || (db.list[k] = []); l.unshift(...a.slice(2).reverse()); persist(); return l.length; }
    case 'LTRIM': db.list[k] = range(db.list[k] || [], a[2], a[3]); persist(); return 'OK';
    case 'LRANGE': return range(db.list[k] || [], a[2], a[3]);
    default: throw new Error(`fake database: ${c} not supported`);
  }
}

/* ---------------- static files ---------------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};
const REWRITES = { '/': '/index.html', '/admin': '/admin.html', '/admin/store': '/manage.html', '/sitemap.xml': '/api/sitemap' };

function serveFile(res, file, status = 200) {
  fs.readFile(file, (err, buf) => {
    if (err) return notFound(res);
    res.writeHead(status, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}
function notFound(res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, buf) => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(err ? 'Not found' : buf);
  });
}

/* ---------------- server ---------------- */
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let p = decodeURIComponent(u.pathname);

  if (p === '/__kv') {                                   // the fake database
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.headers.authorization !== 'Bearer dev') { res.statusCode = 401; return res.end('{"error":"bad token"}'); }
      try { res.end(JSON.stringify({ result: exec(JSON.parse(body)) })); }
      catch (e) { res.statusCode = 400; res.end(JSON.stringify({ error: e.message })); }
    });
    return;
  }

  p = REWRITES[p] || p;
  if (p.startsWith('/api/')) {
    const name = p.slice(5).replace(/\.js$/, '');
    const file = path.join(ROOT, 'api', `${name}.js`);
    if (name.startsWith('_') || !file.startsWith(path.join(ROOT, 'api')) || !fs.existsSync(file)) return notFound(res);
    // fresh code on every request
    Object.keys(require.cache).filter((k) => k.startsWith(path.join(ROOT, 'api'))).forEach((k) => delete require.cache[k]);
    req.query = Object.fromEntries(u.searchParams);
    try { await require(file)(req, res); }
    catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end('server error'); } }
    return;
  }

  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || /[\\/](\.git|tools|api)[\\/]/.test(file.slice(ROOT.length) + '/')) return notFound(res);
  fs.stat(file, (err, st) => (err || !st.isFile() ? notFound(res) : serveFile(res, file)));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`KINGPIN LUX local preview: http://localhost:${PORT}`);
  console.log(`Store manager: http://localhost:${PORT}/admin/store  (local password is in tools/dev-server.js)`);
});
