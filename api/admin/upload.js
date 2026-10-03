// POST /api/admin/upload  { type, data (base64), w, h, name } → { id, url }
// The admin page shrinks and compresses photos in the browser before sending them.
const crypto = require('crypto');
const kv = require('../_lib/kv');
const { send, readJson } = require('../_lib/http');
const { isAdmin, adminPassword } = require('../_lib/auth');

const TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_B64 = 3500000;             // ~2.6 MB of image; Vercel caps request bodies at 4.5 MB

function looksLike(type, head) {
  if (type === 'image/png') return head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  if (type === 'image/jpeg') return head[0] === 0xff && head[1] === 0xd8;
  return head.slice(0, 4).toString('latin1') === 'RIFF' && head.slice(8, 12).toString('latin1') === 'WEBP';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!adminPassword()) return send(res, 503, { ok: false, error: 'admin password not set' });
  if (!isAdmin(req)) return send(res, 401, { ok: false, error: 'login required' });
  if (!String(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { ok: false, error: 'json required' });
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  let body;
  try { body = await readJson(req, MAX_B64 + 4000); } catch { return send(res, 413, { ok: false, error: 'image too large' }); }

  const type = String(body.type || '');
  const data = String(body.data || '');
  if (!TYPES.includes(type)) return send(res, 400, { ok: false, error: 'use a JPG, PNG or WebP photo' });
  if (data.length < 64 || data.length > MAX_B64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return send(res, 400, { ok: false, error: 'bad image data' });
  if (!looksLike(type, Buffer.from(data.slice(0, 32), 'base64'))) return send(res, 400, { ok: false, error: 'the file is not a real image' });

  try {
    const id = crypto.randomBytes(12).toString('hex');
    await kv.cmd('SET', `img:${id}`, `${type},${data}`);
    await kv.cmd('HSET', 'images', id, JSON.stringify({
      type, bytes: Math.round(data.length * 0.75),
      w: Math.round(Number(body.w)) || 0, h: Math.round(Number(body.h)) || 0,
      name: String(body.name || '').replace(/[^\w .\-()]/g, '').slice(0, 80), at: new Date().toISOString(),
    }));
    return send(res, 200, { ok: true, id, url: `/api/img?id=${id}` });
  } catch (err) {
    console.error('[upload]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
