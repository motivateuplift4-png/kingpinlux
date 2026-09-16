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

## ⚠️ Set your bank details before taking orders

Payment is **bank transfer / wire only**. After a customer places an order they
are shown your bank details and a unique payment reference.

Those details ship as placeholders. Open `checkout.html`, find `window.KP_BANK`
(search for `REPLACE_ME`) and fill in all six fields:

```js
window.KP_BANK = {
  beneficiary : "...",   // account holder name
  bankName    : "...",
  iban        : "...",   // IBAN or account number
  bic         : "...",   // BIC / SWIFT
  bankAddress : "...",
  currency    : "USD",
  payEmail    : "..."    // where customers send proof of payment
};
```

**This is a public repo on a public site.** Whatever you put here is readable by
anyone who views the page source — unavoidable for a static store, and the
trade-off of publishing bank details for wire payment. Use a business account,
not a personal one.

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
