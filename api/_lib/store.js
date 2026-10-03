// Store content saved from /admin/store: products + site settings, one JSON key.
// When nothing has been saved yet the storefront uses assets/catalog.js and the
// order API uses the defaults below (products 1–29 at $900, code KINGPIN10).
const kv = require('./kv');

const KEY = 'store:catalog';
const COLLS = ['skeleton', 'cushion', 'octagon', 'chrono', 'square', 'classic'];
const SHAPES = ['round', 'cushion', 'octagon', 'square'];
const DIALS = ['pave', 'black', 'blue', 'skeleton', 'roman', 'arabic', 'chrono'];
const FINISHES = ['white', 'yellow', 'rose', 'twoy', 'twor'];
const IMG_RE = /^\/api\/img\?id=[a-f0-9]{16,40}$|^assets\/[\w\-./]+\.(jpe?g|png|webp|avif)$/i;
const DEFAULT_PRICE = 900;
const DEFAULT_IDS = 29;
const DEFAULT_PROMO = { code: 'KINGPIN10', percent: 10 };

async function load() {
  const raw = await kv.cmd('GET', KEY);
  return raw ? JSON.parse(raw) : null;
}

/** What can be ordered, at what price, with which discount codes. */
async function orderContext() {
  const saved = kv.configured() ? await load() : null;
  const products = {};
  if (!saved) {
    for (let id = 1; id <= DEFAULT_IDS; id++) products[id] = { price: DEFAULT_PRICE };
    return { products, discounts: { [DEFAULT_PROMO.code]: DEFAULT_PROMO.percent / 100 } };
  }
  saved.products.filter((p) => p.status !== 'hidden' && !p.soldOut).forEach((p) => { products[p.id] = { price: p.price }; });
  const promo = saved.settings && saved.settings.promo;
  return { products, discounts: promo ? { [promo.code]: promo.percent / 100 } : {} };
}

// single-line text: no control characters
const line = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
// multi-line text: keeps line breaks
const text = (v, max) => String(v == null ? '' : v).replace(/\r/g, '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
const image = (v) => (IMG_RE.test(String(v || '')) ? String(v) : null);
const images = (a, max) => (Array.isArray(a) ? a : []).map(image).filter(Boolean).slice(0, max);

/** Validate everything the admin page sends. Returns { value } or { error }. */
function sanitize(body) {
  if (!body || !Array.isArray(body.products)) return { error: 'products missing' };
  if (body.products.length > 300) return { error: 'too many products (max 300)' };

  const ids = new Set();
  const products = [];
  for (const p of body.products) {
    const id = Number(p && p.id);
    if (!Number.isInteger(id) || id < 1 || id > 99999 || ids.has(id)) return { error: `bad or duplicate product number ${p && p.id}` };
    ids.add(id);
    const name = line(p.name, 80);
    if (!name) return { error: `product #${id} needs a name` };
    const price = Math.round(Number(p.price) * 100) / 100;
    if (!(price >= 1 && price <= 1000000)) return { error: `"${name}" needs a price between $1 and $1,000,000` };
    products.push({
      id, name, price,
      coll: COLLS.includes(p.coll) ? p.coll : 'classic',
      shape: SHAPES.includes(p.shape) ? p.shape : 'round',
      dial: DIALS.includes(p.dial) ? p.dial : 'pave',
      finish: FINISHES.includes(p.finish) ? p.finish : 'white',
      tags: ['new', 'best'].filter((t) => Array.isArray(p.tags) && p.tags.includes(t)),
      images: images(p.images, 12),
      desc: text(p.desc, 1200),
      caseSize: line(p.caseSize, 40),
      movement: line(p.movement, 40),
      status: p.status === 'hidden' ? 'hidden' : 'live',
      soldOut: Boolean(p.soldOut),
    });
  }

  const s = body.settings || {};
  const c = s.contact || {};
  let promo = null;
  if (s.promo && s.promo.code) {
    const code = line(s.promo.code, 20).toUpperCase();
    const percent = Math.round(Number(s.promo.percent));
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return { error: 'promo code: use 3–20 letters or numbers' };
    if (!(percent >= 1 && percent <= 90)) return { error: 'promo discount: 1–90%' };
    promo = { code, percent };
  }
  const email = line(c.email, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'the contact email looks wrong' };

  const settings = {
    contact: {
      email,
      whatsapp: line(c.whatsapp, 24).replace(/\D/g, '').slice(0, 16),
      instagram: line(c.instagram, 31).replace(/^@/, '').replace(/[^\w.]/g, '').slice(0, 30),
    },
    promo,
    heroImages: images(s.heroImages, 3),
    featuredId: ids.has(Number(s.featuredId)) ? Number(s.featuredId) : null,
    lookbook: (Array.isArray(s.lookbook) ? s.lookbook : [])
      .map((x) => ({ src: image(x && x.src), caption: line(x && x.caption, 80) }))
      .filter((x) => x.src).slice(0, 24),
    reviews: (Array.isArray(s.reviews) ? s.reviews : []).map((r) => ({
      name: line(r && r.name, 60),
      place: line(r && r.place, 60),
      text: text(r && r.text, 800),
      rating: Math.min(5, Math.max(1, Math.round(Number(r && r.rating) || 5))),
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(r && r.date)) ? r.date : '',
      img: image(r && r.img),
      productId: ids.has(Number(r && r.productId)) ? Number(r.productId) : null,
    })).filter((r) => r.name && r.text).slice(0, 100),
  };
  return { value: { v: 1, updatedAt: new Date().toISOString(), products, settings } };
}

/** Uploaded photo ids still used anywhere in the catalogue. */
function usedImageIds(cat) {
  const urls = [];
  cat.products.forEach((p) => urls.push(...p.images));
  const s = cat.settings;
  urls.push(...s.heroImages, ...s.lookbook.map((x) => x.src), ...s.reviews.map((r) => r.img).filter(Boolean));
  return new Set(urls.map((u) => (u.match(/id=([a-f0-9]+)/) || [])[1]).filter(Boolean));
}

module.exports = { KEY, load, orderContext, sanitize, usedImageIds };
