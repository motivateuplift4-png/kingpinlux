// POST /api/admin/logout
const { send } = require('../_lib/http');
const { clearCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
  res.setHeader('Set-Cookie', clearCookie(req));
  return send(res, 200, { ok: true });
};
