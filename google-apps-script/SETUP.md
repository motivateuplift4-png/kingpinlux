# Order inbox setup (about 5 minutes)

Every order placed on the store becomes a row in a Google Sheet you own:
reference, date, total, customer, email, phone, shipping address, items — plus
**Paid** and **Shipped** tick-boxes. Do this once, on a computer.

---

## 1. Make the sheet

1. Go to **sheets.new** (signed in to the Google account you want orders in).
2. Name it **KINGPIN Orders** (click "Untitled spreadsheet" top-left).

## 2. Add the script

1. In the sheet menu: **Extensions → Apps Script**. A code editor opens in a new tab.
2. Delete everything in the editor.
3. Open `orders.gs` (next to this file), copy **all** of it, paste it into the editor.
4. Click the **save** icon (💾).

## 3. Run setup once

1. In the toolbar, the function dropdown should say **setup** — if not, pick it.
2. Click **Run**.
3. Google asks for permission:
   - **Review permissions** → pick your account
   - You'll see *"Google hasn't verified this app"*. That's normal for your own script.
     Click **Advanced** → **Go to … (unsafe)** → **Allow**.
4. Switch back to the sheet tab. You should now have an **Orders** tab with dark headers.

## 4. Publish it as a web app

1. Back in the Apps Script tab: **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" → **Web app**.
3. Set:
   - **Description:** `orders`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← required, or the store can't send orders
4. **Deploy**, then copy the **Web app URL**. It ends in `/exec`.

## 5. Check it works

Paste that URL into a new browser tab. You should see:

```
{"ok":true,"service":"kingpin-orders"}
```

## 6. Connect the store

Send the URL to Claude, or put it in `checkout.html` yourself:

```js
window.KP_ORDERS_URL = "https://script.google.com/macros/s/…/exec";
```

Then push. From then on, new orders appear in the sheet within a few seconds.

---

## Using the sheet

- **Yellow row** = order placed, not yet marked paid.
- When the transfer lands in Revolut, find the row with the same `KPL-` reference
  and tick **Paid**. Tick **Shipped** when it goes out.
- **Amount check** says `OK` when the total matches your prices. If it says
  `MISMATCH`, the **Total** column already shows the correct figure — go by that,
  not by what the customer claims.
- Match transfers by **reference**, never by amount alone.
- The Google Sheets app on your phone shows everything and the tick-boxes work.

## If you change the script later

Editing the code does **not** update the live URL by itself. After saving:
**Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.**
The URL stays the same.

## If prices change

Update `UNIT_PRICE` (and `DISCOUNTS` if codes change) at the top of the script,
then redeploy as above. Otherwise every new order will show `MISMATCH`.

## Is this safe?

The URL is public — it has to be, the store sends to it from customers' browsers.
The script only ever **adds** rows: it can't read, edit or delete anything, and it
checks every order (valid reference, real products, sensible quantities, required
address fields), recomputes the total itself, blocks spreadsheet-formula tricks,
ignores duplicate references, and caps orders at 30 a minute. The worst someone
could do is add junk rows, which you'd simply delete.
