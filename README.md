# KINGPIN LUX

Luxury iced-out moissanite watch store. Static site — no build step, no framework.

## Files

| File | Size | Purpose |
|---|---|---|
| `index.html` | ~90 KB | Storefront. **Deploy this.** Images load from `assets/img/`. |
| `product.html` | ~91 KB | Product detail page. Reads `?id=N` from the URL. |
| `checkout.html` | ~48 KB | Checkout. Shares the cart via `localStorage`. |
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

## Orders

Placed orders are sent to a Google Sheet via a small Apps Script web app.
Setup is in [`google-apps-script/SETUP.md`](google-apps-script/SETUP.md); the
script is `google-apps-script/orders.gs`.

The store posts to `window.KP_ORDERS_URL` in `checkout.html`. **Until that is
set, orders are not recorded anywhere** — they wait in the customer's browser
and are sent the next time that customer opens checkout with the URL configured.

Checkout now requires name, email, phone, street, city, postcode and country
(with a free-text box for "Other…") so every recorded order can actually ship.

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
