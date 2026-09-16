// POST /api/order — the storefront records a placed order here.
const kv = require('./_lib/kv');
const { send, readJson, clientIp } = require('./_lib/http');
const { validate, toRecord, logActivity, overLimit } = require('./_lib/orders');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { ok: false, error: 'bad body' }); }

  const problem = validate(body);
  if (problem) return send(res, 400, { ok: false, error: problem });

  try {
    if (await overLimit(`order:ip:${clientIp(req)}`, 6, 60) || await overLimit('order:all', 60, 60)) {
      return send(res, 429, { ok: false, error: 'too many orders, retry shortly' });
    }

    const record = toRecord(body);
    // NX: a retry of the same reference must not create a second order
    const created = await kv.cmd('SET', `order:${record.ref}`, JSON.stringify(record), 'NX');
    if (created === null) return send(res, 200, { ok: true, ref: record.ref, duplicate: true });

    await kv.cmd('ZADD', 'orders', Date.parse(record.placedAt), record.ref);
    await logActivity('placed', record);
    return send(res, 200, { ok: true, ref: record.ref });
  } catch (err) {
    console.error('[order]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
