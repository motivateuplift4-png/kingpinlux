const MAX_BODY = 20000;

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

// Vercel pre-parses JSON bodies into objects and leaves text/plain as a string;
// fall back to reading the stream when neither happened.
async function readJson(req) {
  let raw = req.body;
  if (raw === undefined) {
    raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (c) => {
        data += c;
        if (data.length > MAX_BODY) { reject(new Error('too large')); req.destroy(); }
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw === 'string') {
    if (raw.length > MAX_BODY) throw new Error('too large');
    return raw ? JSON.parse(raw) : {};
  }
  if (raw && typeof raw === 'object') {
    if (JSON.stringify(raw).length > MAX_BODY) throw new Error('too large');
    return raw;
  }
  return {};
}

function cookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || (req.socket && req.socket.remoteAddress) || 'unknown';
}

module.exports = { send, readJson, cookie, clientIp };
