const crypto = require('crypto');
const { cookie } = require('./http');

const COOKIE = 'kp_admin';
const SESSION_DAYS = 7;

// The signing key is derived from the password, so changing ADMIN_PASSWORD
// in Vercel logs every existing session out.
function key() {
  const pw = process.env.ADMIN_PASSWORD || '';
  return crypto.createHash('sha256')
    .update(`kp-admin-session:${pw}:${process.env.ADMIN_SESSION_SECRET || ''}`)
    .digest();
}

function sign(exp) {
  return crypto.createHmac('sha256', key()).update(String(exp)).digest('base64url');
}

function equal(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function passwordMatches(candidate) {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(pw) && equal(candidate, pw);
}

function sessionCookie(req) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return cookieHeader(req, `${exp}.${sign(exp)}`, SESSION_DAYS * 86400);
}

function clearCookie(req) {
  return cookieHeader(req, '', 0);
}

function cookieHeader(req, value, maxAge) {
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(String(req.headers.host || ''));
  return [
    `${COOKIE}=${value}`, 'Path=/api/admin', 'HttpOnly', 'SameSite=Strict',
    `Max-Age=${maxAge}`, local ? '' : 'Secure',
  ].filter(Boolean).join('; ');
}

function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const [exp, sig] = cookie(req, COOKIE).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return equal(sig, sign(exp));
}

module.exports = { passwordMatches, sessionCookie, clearCookie, isAdmin };
