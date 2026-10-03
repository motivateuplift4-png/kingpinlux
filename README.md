# KINGPIN LUX

Luxury iced-out moissanite watch store. Static pages + a few Vercel functions, no build step, no packages.
Light storefront with black-and-gold header, hero, bands and footer. Archivo (wide, bold headings + body)
with Cormorant Garamond italics as accents.

## Store manager: `/admin/store`

Log in with the same password as the orders dashboard (`ADMIN_PASSWORD`). From there you can:

- **Products:** add, edit, duplicate, delete and reorder watches; set the price, collection,
  finish, case shape, dial, description and specs; mark a watch **sold out** (still shown, can't be
  bought) or **hidden** (not shown, can't be bought); add the "New" label or make it a signature piece.
- **Photos:** drag photos in (JPG, PNG or WebP, any size). The browser shrinks them to at most
  1600 px and compresses them before uploading. The first photo is the main one, the second appears on
  hover, all of them form the product-page gallery.
- **Website:** up to 3 home-page hero photos, the spotlight watch, lookbook photos (shown once there
  are 3+), contact details (email, WhatsApp, Instagram), the promo code, and customer reviews
  (real ones only; the form asks you to confirm each review is genuine).

Nothing goes live until you press **Save**. The very first Save copies the built-in catalogue
(`assets/catalog.js`) into the database; from then on the site uses the saved version, and changes
appear within seconds (`/api/catalog` is cached for 15 s by Vercel's CDN).

How it fits together:

| Piece | What it does |
|---|---|
| `manage.html` | The Store manager page (rewritten from `/admin/store` in `vercel.json`). |
| `api/admin/store.js` | Loads / validates / saves products + settings (`store:catalog` key). Deletes photos nothing uses any more (after a day). |
| `api/admin/upload.js` | Receives one compressed photo, checks it really is an image, stores it (`img:<id>`). |
| `api/img.js` | Serves a photo: `/api/img?id=…`, cached for a year (ids are random, photos never change). |
| `api/catalog.js` | The saved catalogue as a script, loaded by every page right after `assets/catalog.js`. |
| `api/_lib/store.js` | Validation, and what the order API may sell at which price with which code. |
| `api/sitemap.js` | `/sitemap.xml`, built from the saved catalogue (hidden watches left out). |

Photos and the catalogue live in the same Upstash database as orders. The free plan holds 256 MB,
roughly 1,000 product photos at the sizes the manager produces.

The bank details are **not** editable from the Store manager on purpose: if the admin password ever
leaked, nobody could redirect customer payments without also changing the code.

## Files

| File | Purpose |
|---|---|
| `index.html` | Home: hero, signature pieces, recently viewed, spotlight, shop by finish, collections, lookbook, the KINGPIN standard, reviews, how to order, FAQ. |
| `shop.html` | All watches with collection + finish filters and sorting. Links like `shop.html?c=skeleton&f=two&s=new`. |
| `product.html` | Product page (`?id=N`): gallery, finish swatches, delivery estimate, in the box, WhatsApp order button, reviews, recently viewed. |
| `checkout.html` | Checkout + bank-transfer details. Sends orders to `/api/order`. |
| `info.html` | Client care: shipping, returns, warranty, payment, contact, privacy (`info.html#returns` etc.). |
| `404.html` | Branded "page not found" (Vercel shows it for any unknown address). |
| `admin.html` | Orders dashboard at `/admin`, plus the email list. |
| `manage.html` | Store manager at `/admin/store`. |
| `assets/catalog.js` | Built-in catalogue + defaults, used until the first Save in the Store manager. Collections are defined here. |
| `assets/site.js` | Shared code: applies the saved catalogue, cart, header/footer, search, bag, reviews, placeholder artwork. |
| `assets/site.css` | Shared design system. |
| `api/` | Vercel functions: orders, email list, catalogue, photos, admin. |
| `robots.txt` | Names `kingpinlux.vercel.app` for the sitemap; change it if you move to your own domain. |
| `tools/dev-server.js` | Local preview that runs the API with a fake database (not deployed). |

## Preview everything locally

```
node tools/dev-server.js
```

Then open http://localhost:5611 (store) or http://localhost:5611/admin/store (Store manager). It
behaves like the live site, but uses an in-memory test database saved to `tools/.devdata.json`
(git-ignored), and a local-only admin password set at the top of `tools/dev-server.js`.
Nothing you do there touches the live store.

## Email list

The "KINGPIN list" form in every page footer posts to `api/subscribe.js`, which stores the address
(`subscribers` hash; repeat sign-ups ignored; rate-limited). The **Email list** panel in `/admin`
shows everyone who joined plus customers who ticked "email me" at checkout, with **Copy emails** and
**Download CSV**. The site doesn't send emails itself.

## Finishes and swatches

Products that share a collection, case shape and dial are treated as one **design** in different
finishes: the shop shows one card per design with colour swatches, and the product page links between
finishes. In the Store manager, **Duplicate** a watch and change its finish to add a colour.

## Orders, prices and codes

The order API (`api/order.js`) never trusts the browser: it re-prices every order from the saved
catalogue, refuses hidden or sold-out watches, and only accepts the promo code set in the Store
manager. It sends back the real total, which is what the customer is told to transfer. If their page
showed an older price, they see a "prices were updated" note; if a watch sold out while they were on
the checkout page, they're asked to refresh instead of being shown bank details. A tampered page is
stored at the real price and flagged **Check amount** in `/admin`.

Before the first Save, the defaults apply: products 1–29 at $900 and code KINGPIN10 (10%).

## Payment: bank transfer only

After placing an order the customer sees the bank details, a reference (`KPL-XXXXXX`) and the exact
amount, with copy buttons and a "save or print" option. The details live in `window.KP_BANK` in
`checkout.html` (Revolut Bank UAB; the same account receives USD and EUR). `currency` must match what
the store prices in (USD). Set `payEmail` and a "Send proof to" row appears automatically.

> **These details are public**, as for any static store taking wire payments. Prefer a business
> account, and watch for transfers that arrive without a matching order reference.

## Orders dashboard

`/admin`: password login, stats, "What's new" feed, search, filters, Paid / Shipped toggles, private
notes, Email / Call / WhatsApp / copy-address shortcuts, and the email list. Refreshes every 30 s
and chimes when a new order arrives. To change the password, edit `ADMIN_PASSWORD` in Vercel →
Settings → Environment Variables and redeploy (that also logs out every device). Logins are limited
to 8 wrong guesses per 15 minutes per address.

## Cart

`KP.cart` keeps the bag in `localStorage` (`kp_cart_v1`, shared across tabs) and drops anything that
becomes hidden or sold out. `kp_recent` holds recently viewed watches; `kp_last_ref` the last order
reference; unsent orders wait in `kp_order_queue` and are re-sent on the next visit to checkout.

## Before going live

- In the Store manager: add your photos, contact details and (real) reviews, then press Save.
- Check case size and movement for each watch against the real pieces.
- The policies in `info.html` (shipping times, 30-day returns, lifetime warranty) are promises to customers. Make sure you honour them.
