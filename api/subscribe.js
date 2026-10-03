// POST /api/subscribe — the storefront's "join the list" form.
const kv = require('./_lib/kv');
const { send, readJson, clientIp } = require('./_lib/http');
const { overLimit, clean } = require('./_lib/orders');

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  if (!kv.configured()) return send(res, 503, { ok: false, error: 'storage not configured' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { ok: false, error: 'bad body' }); }
  if (body && body.hp) return send(res, 200, { ok: true });          // a bot filled the hidden field

  const email = clean(body && body.email, 120).toLowerCase();
  if (!EMAIL_RE.test(email)) return send(res, 400, { ok: false, error: 'bad email' });

  try {
    if (await overLimit(`sub:ip:${clientIp(req)}`, 5, 60) || await overLimit('sub:all', 120, 60)) {
      return send(res, 429, { ok: false, error: 'too many requests, retry shortly' });
    }
    const record = JSON.stringify({ email, at: new Date().toISOString(), source: clean(body.source, 40) });
    // HSETNX keeps the first sign-up date if someone joins twice
    const added = await kv.cmd('HSETNX', 'subscribers', email, record);
    return send(res, 200, { ok: true, already: Number(added) === 0 });
  } catch (err) {
    console.error('[subscribe]', err);
    return send(res, 500, { ok: false, error: 'server error' });
  }
};
