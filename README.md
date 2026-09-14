# KINGPIN LUX

Luxury iced-out moissanite watch store. Static site — no build step, no framework.

## Files

| File | Size | Purpose |
|---|---|---|
| `index.html` | ~90 KB | Storefront. **Deploy this.** Images load from `assets/img/`. |
| `checkout.html` | ~40 KB | Checkout. Shares the cart via `localStorage`. |
| `assets/img/` | 7.7 MB | 128 product photos, lazy-loaded and browser-cached. |
| `kingpin-lux-standalone.html` | 10.4 MB | Single-file copy with every image inlined as base64. Works with no internet at all — good for sharing or offline demos, **not** for the web (nothing renders until all 10 MB downloads). |

## Catalog

29 products live in `window.KP_PRODUCTS` inside `index.html`. Shared values
(price, stone, warranty copy) are applied in the hydration block right below the array,
so changing the price once updates every product.

Pricing is uniform: `now: 900`, `was: 2200`.

## Cart

`window.KP` handles cart + wishlist in `localStorage` under `kp_cart_v1` / `kp_wish_v1`.
`index.html` and `checkout.html` each carry their own copy of the catalog —
**if you add or remove a product, update both files** or checkout cannot resolve the item.

## Before going live

- The countdown bar resets at local midnight. Keep it only if the offer really is daily.
- Review counts and stock numbers are static values baked into the hydration block.
  Wire them to real inventory before making scarcity claims to customers.
- `assets/img/` filenames (`pN.jpg`) are positional. Regenerating them renumbers everything.
