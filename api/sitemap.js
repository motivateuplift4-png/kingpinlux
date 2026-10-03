// GET /sitemap.xml (rewritten here in vercel.json) — every live page for search engines,
// built from the saved catalogue so new products appear automatically.
const kv = require('./_lib/kv');
const store = require('./_lib/store');

const COLLS = ['skeleton', 'cushion', 'octagon', 'chrono', 'square', 'classic'];

module.exports = async (req, res) => {
  let ids = Array.from({ length: 29 }, (_, i) => i + 1);
  try {
    const saved = kv.configured() ? await store.load() : null;
    if (saved) ids = saved.products.filter((p) => p.status !== 'hidden').map((p) => p.id);
  } catch (err) { console.error('[sitemap]', err); }

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'kingpinlux.vercel.app').split(',')[0].trim();
  const site = (/^(localhost|127\.)/.test(host) ? 'http://' : 'https://') + host;
  const today = new Date().toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ['/shop.html', '0.9'], ['/info.html', '0.5'],
    ...COLLS.map((c) => [`/shop.html?c=${c}`, '0.8']),
    ...ids.map((id) => [`/product.html?id=${id}`, '0.7'])];

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
  res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([u, pr]) => `  <url><loc>${site}${u}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`).join('\n') +
    '\n</urlset>\n');
};
