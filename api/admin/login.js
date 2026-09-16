// POST /api/admin/login  { password }
const kv = require('../_lib/kv');
const { send, readJson, clientIp } = require('../_lib/http');
const { passwordMatches, sessionCookie } = require('../_lib/auth');
const { overLimit } = require('../_lib/orders');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!process.env.ADMIN_PASSWORD) return send(res, 503, { ok: false, error: 'admin password not set' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { ok: false, error: 'bad body' }); }

  // Slow down password guessing: 8 attempts per IP per 15 minutes.
  if (kv.configured()) {
    try {
      if (await overLimit(`login:${clientIp(req)}`, 8, 900)) {
        return send(res, 429, { ok: false, error: 'too many attempts — wait 15 minutes' });
      }
    } catch (err) { console.error('[login] rate limit', err); }
  }

  if (!passwordMatches(String(body.password || ''))) {
    return send(res, 401, { ok: false, error: 'wrong password' });
  }
  res.setHeader('Set-Cookie', sessionCookie(req));
  return send(res, 200, { ok: true });
};
