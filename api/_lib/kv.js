// Minimal Upstash Redis REST client — plain fetch, no dependencies.
// Vercel's Upstash integration injects KV_REST_API_URL / KV_REST_API_TOKEN;
// a directly-created Upstash database uses the UPSTASH_REDIS_* names.

function creds() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

function configured() {
  const { url, token } = creds();
  return Boolean(url && token);
}

async function cmd(...args) {
  const { url, token } = creds();
  if (!url || !token) throw new Error('storage not configured');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args.map(String)),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`storage error: ${j.error || r.status}`);
  return j.result;
}

module.exports = { cmd, configured };
