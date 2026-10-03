// GET /api/catalog — the catalogue saved from /admin/store, as a script the
// storefront loads right after assets/catalog.js. Empty when nothing is saved,
// so the built-in catalogue keeps working.
const kv = require('./_lib/kv');
const store = require('./_lib/store');

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  // Browsers always ask again; Vercel's CDN keeps a copy for 15 s, so a save shows up within seconds.
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=15, stale-while-revalidate=60');
  let saved = null;
  try { if (kv.configured()) saved = await store.load(); } catch (err) { console.error('[catalog]', err); }
  res.statusCode = 200;
  if (!saved) return res.end('/* nothing saved yet: assets/catalog.js is used */');
  const json = JSON.stringify({ products: saved.products, settings: saved.settings, updatedAt: saved.updatedAt })
    .split('<').join('\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029');
  return res.end('window.KP_SAVED=' + json + ';');
};
