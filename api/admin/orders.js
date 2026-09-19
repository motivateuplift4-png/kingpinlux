// GET /api/admin/orders — every order (newest first) plus the activity feed.
const kv = require('../_lib/kv');
const { send } = require('../_lib/http');
const { isAdmin, adminPassword } = require('../_lib/auth');

const MAX_ORDERS = 500;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!adminPassword()) return send(res, 503, { ok: false, error: 'admin password not set' });
  if (!isAdmin(req)) return send(res, 401, { ok: false, error: 'login required' });
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  try {
    const refs = (await kv.cmd('ZREVRANGE', 'orders', 0, MAX_ORDERS - 1)) || [];
    const raw = refs.length ? await kv.cmd('MGET', ...refs.map((r) => `order:${r}`)) : [];
    const orders = raw.filter(Boolean).map((s) => JSON.parse(s));
    const activity = ((await kv.cmd('LRANGE', 'activity', 0, 49)) || []).map((s) => JSON.parse(s));
    return send(res, 200, { ok: true, serverTime: new Date().toISOString(), orders, activity });
  } catch (err) {
    console.error('[orders]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
