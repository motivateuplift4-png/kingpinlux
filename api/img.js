// GET /api/img?id=… — a photo uploaded from /admin/store.
// Ids are random and a photo never changes, so browsers and the CDN can keep it for a year.
const kv = require('./_lib/kv');

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!/^[a-f0-9]{16,40}$/.test(id) || !kv.configured()) { res.statusCode = 404; return res.end(); }
  try {
    const raw = await kv.cmd('GET', `img:${id}`);
    if (!raw) { res.statusCode = 404; res.setHeader('Cache-Control', 'no-store'); return res.end(); }
    const comma = raw.indexOf(',');
    res.statusCode = 200;
    res.setHeader('Content-Type', raw.slice(0, comma));
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(Buffer.from(raw.slice(comma + 1), 'base64'));
  } catch (err) {
    console.error('[img]', err);
    res.statusCode = 500;
    return res.end();
  }
};
