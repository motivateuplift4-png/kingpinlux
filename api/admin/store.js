// GET  /api/admin/store → { catalog (null = never saved), images }
// POST /api/admin/store { products, settings } → validates, saves, tidies unused photos
const kv = require('../_lib/kv');
const { send, readJson } = require('../_lib/http');
const { isAdmin, adminPassword } = require('../_lib/auth');
const store = require('../_lib/store');

const DAY = 864e5;

async function imageIndex() {
  const flat = (await kv.cmd('HGETALL', 'images')) || [];
  const out = {};
  for (let i = 0; i < flat.length; i += 2) {
    try { out[flat[i]] = JSON.parse(flat[i + 1]); } catch { /* skip a damaged entry */ }
  }
  return out;
}

module.exports = async (req, res) => {
  if (!adminPassword()) return send(res, 503, { ok: false, error: 'admin password not set' });
  if (!isAdmin(req)) return send(res, 401, { ok: false, error: 'login required' });
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  try {
    if (req.method === 'GET') {
      return send(res, 200, { ok: true, catalog: await store.load(), images: await imageIndex() });
    }
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
    if (!String(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { ok: false, error: 'json required' });

    let body;
    try { body = await readJson(req, 600000); } catch { return send(res, 400, { ok: false, error: 'bad body' }); }
    const { value, error } = store.sanitize(body);
    if (error) return send(res, 400, { ok: false, error });

    await kv.cmd('SET', store.KEY, JSON.stringify(value));

    // Delete photos nothing uses any more. Recent uploads are kept for a day,
    // in case they belong to an edit that hasn't been saved yet.
    const used = store.usedImageIds(value);
    const index = await imageIndex();
    let removed = 0;
    for (const [id, meta] of Object.entries(index)) {
      if (used.has(id) || Date.now() - Date.parse(meta.at || 0) < DAY) continue;
      await kv.cmd('DEL', `img:${id}`);
      await kv.cmd('HDEL', 'images', id);
      removed++;
    }
    return send(res, 200, { ok: true, catalog: value, removedImages: removed });
  } catch (err) {
    console.error('[store]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
