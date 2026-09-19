// POST /api/admin/update  { ref, paid?, shipped?, note? }
const kv = require('../_lib/kv');
const { send, readJson } = require('../_lib/http');
const { isAdmin, adminPassword } = require('../_lib/auth');
const { REF_RE, logActivity } = require('../_lib/orders');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!adminPassword()) return send(res, 503, { ok: false, error: 'admin password not set' });
  if (!isAdmin(req)) return send(res, 401, { ok: false, error: 'login required' });
  // A cross-site form can't send application/json without a CORS preflight we never allow.
  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return send(res, 415, { ok: false, error: 'json required' });
  }
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { ok: false, error: 'bad body' }); }
  if (!REF_RE.test(String(body.ref))) return send(res, 400, { ok: false, error: 'bad reference' });

  try {
    const key = `order:${body.ref}`;
    const raw = await kv.cmd('GET', key);
    if (!raw) return send(res, 404, { ok: false, error: 'order not found' });
    const order = JSON.parse(raw);
    const now = new Date().toISOString();
    const changes = [];

    if (typeof body.paid === 'boolean' && body.paid !== order.status.paid) {
      order.status.paid = body.paid;
      order.status.paidAt = body.paid ? now : null;
      changes.push(body.paid ? 'paid' : 'unpaid');
    }
    if (typeof body.shipped === 'boolean' && body.shipped !== order.status.shipped) {
      order.status.shipped = body.shipped;
      order.status.shippedAt = body.shipped ? now : null;
      changes.push(body.shipped ? 'shipped' : 'unshipped');
    }
    if (typeof body.note === 'string') {
      const note = String(body.note).replace(/\r/g, '').slice(0, 1000);
      if (note !== order.note) { order.note = note; changes.push('note'); }
    }
    if (!changes.length) return send(res, 200, { ok: true, order });

    await kv.cmd('SET', key, JSON.stringify(order));
    for (const c of changes) if (c !== 'note') await logActivity(c, order);
    return send(res, 200, { ok: true, order });
  } catch (err) {
    console.error('[update]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
