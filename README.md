# KINGPIN LUX

Luxury iced-out moissanite watch store. Static site — no build step, no framework.

## Files

| File | Size | Purpose |
|---|---|---|
| `index.html` | ~90 KB | Storefront. **Deploy this.** Images load from `assets/img/`. |
| `product.html` | ~91 KB | Product detail page. Reads `?id=N` from the URL. |
| `checkout.html` | ~48 KB | Checkout. Shares the cart via `localStorage`, sends orders to `/api/order`. |
| `admin.html` | ~30 KB | Order dashboard at `/admin` (see below). |
| `api/` | — | Vercel serverless functions: order intake + admin API. |
| `assets/img/` | 7.7 MB | 128 product photos, lazy-loaded and browser-cached. |
| `kingpin-lux-standalone.html` | 10.4 MB | Single-file copy of the storefront with every image inlined as base64. Works with no internet at all — good for sharing or offline demos, **not** for the web (nothing renders until all 10 MB downloads). |

## Payment — bank transfer only

Wire transfer is the only method. After a customer places an order they see the
bank details, a generated reference (`KPL-XXXXXX`) and the exact amount.

The details live in `window.KP_BANK` in `checkout.html` (Revolut Bank UAB — the
same account details receive both USD and EUR).

**`currency` must match what the store prices in.** The store is in USD, so
`currency: "USD"`. If you ever reprice in euros, change it there too, or
customers will be told to send the wrong amount.

`payEmail` is empty — set it to a real address and a "Send proof to" row appears
in the panel automatically.

> **These details are public.** The repo and the site are public, so anyone can
> read the IBAN via view-source. That is unavoidable for a static store taking
> wire payments, and is the trade-off you accepted by publishing them. Prefer a
> business account over a personal one, and watch for transfers that arrive
> without a matching order reference.

## Orders & admin dashboard

Every placed order is saved by the site's own API and shown at
**`/admin`** (e.g. `kingpinlux.vercel.app/admin`): password login, stats, a
"What's new" feed, search, filters, Paid / Shipped toggles, private notes, and
Email / Call / WhatsApp / copy-address shortcuts. It refreshes every 30 seconds
and chimes when a new order arrives while it's open.

### Turn on the admin dashboard (one time, ~3 minutes, in Vercel)

1. **Connect order storage.** Vercel → the `kingpinlux` project → **Storage** →
   **Create Database** → **Upstash for Redis** (free plan) → connect it to this
   project for **all environments**. Vercel adds the connection settings itself.
2. **Set your admin password.** **Settings → Environment Variables** → add
   `ADMIN_PASSWORD` with a long password only you know → Save.
3. **Redeploy.** **Deployments** → newest → **⋯ → Redeploy**. Settings only
   apply to new deployments.
4. Open `/admin` and log in.

Until step 1 is done, orders **cannot be saved**: checkout still shows the bank
details, and the order waits in that customer's browser to be sent later.
Do steps 1 and 2 together — login brute-force protection uses the same storage.

To change the password, edit `ADMIN_PASSWORD` and redeploy; that also logs out
every device.

### How it's built

| File | What it does |
|---|---|
| `api/order.js` | `POST` from checkout. Validates, **recomputes the total server-side**, stores the order, ignores duplicate references, rate-limits. |
| `api/admin/login.js`, `logout.js` | Password check → signed, HttpOnly session cookie (7 days). 8 wrong guesses per IP locks out 15 min. |
| `api/admin/orders.js` | All orders (newest first) + activity feed. Login required. |
| `api/admin/update.js` | Paid / shipped / note. Login required. |
| `api/_lib/` | Storage client (Upstash REST, no packages), auth, validation, pricing. |
| `admin.html` | The dashboard. Customer text is always rendered as plain text. |

`UNIT_PRICE` / `DISCOUNTS` in `api/_lib/orders.js` must match the storefront.
If a customer's page showed a different total (a tampered page), the order is
stored at the real price and flagged **Check amount** in the dashboard.

Checkout requires name, email, phone, street, city, postcode and country (with
a free-text box for "Other…") so every order can actually ship.

## Catalog

29 products live in `window.KP_PRODUCTS` inside `index.html`. Shared values
(price, stone, warranty copy) are applied in the hydration block right below the
array, so changing the price once updates every product.

Pricing is uniform: `now: 900`, `was: 2200`.

Each page carries **its own copy** of the catalog. If you add or remove a
product, update `index.html`, `product.html` **and** `checkout.html`, or the
other pages cannot resolve the item.

## How the pages link together

- Product card image and title → `product.html?id=N` (a real page, indexable)
- The eye button on a card → quick-view modal, no navigation
- Quick view has a **View Full Details** link through to `product.html`
- `product.html` → *Reserve & Pay By Bank Transfer* → `checkout.html`

## Cart

`window.KP` handles cart + wishlist in `localStorage` under `kp_cart_v1` /
`kp_wish_v1`. The last order reference is kept in `kp_last_ref`.

## Before going live

- The countdown bar resets at local midnight. Keep it only if the offer really is daily.
- Review counts and stock numbers are static values baked into the hydration block.
  Wire them to real inventory before making scarcity claims to customers.
- The free-express-delivery threshold is $3,000. With every watch at $900 that
  takes four items to reach — consider lowering it in `renderCart()` (`FREE_EXPRESS`).
- `assets/img/` filenames (`pN.jpg`) are positional. Regenerating them renumbers everything.
