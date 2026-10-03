/* =====================================================================
   KINGPIN LUX — BUILT-IN store settings + catalogue.
   This is the starting point. Once you press Save in the Store manager
   (/admin/store), the saved version (served by /api/catalog) replaces the
   products and settings below on every page. Collections stay here.
   ===================================================================== */

window.KP_CONFIG = {
  currency: "USD",
  price: 900,              // default price for products without their own

  /* Contact details. Leave a value empty ("") and that button is hidden.
     If all three are empty, the "Speak to us" sections are hidden.      */
  contact: {
    email: "",             // e.g. "concierge@kingpinlux.com"
    whatsapp: "",          // digits only, with country code, e.g. "447700900123"
    instagram: ""          // handle without the @, e.g. "kingpinlux"
  },

  /* Promotion shown in the top bar, on product cards and at checkout.
     The order API accepts exactly this code (see api/_lib/store.js).
     Set  promo: null  to hide it everywhere.                             */
  promo: { code: "KINGPIN10", percent: 10 },

  /* Optional photos for the home-page hero: up to 3, shown side by side
     (one at a time on phones), e.g. ["assets/products/hero-1.jpg", ...].
     Empty = illustrated watches are shown.                               */
  heroImages: [],

  featuredId: 1,           // product shown in the home-page spotlight
  lookbook: [],            // [{ src, caption }] real customer / on-wrist photos
  reviews: []              // [{ name, place, text, rating, date, img, productId }] real reviews only
};

/* Collections (the "model lines"). `key` is used in links: shop.html?c=key */
window.KP_COLLECTIONS = [
  { key: "skeleton", name: "Phantom", label: "Skeleton",
    blurb: "Open-worked dials that put the movement on show." },
  { key: "cushion",  name: "Monarch", label: "Cushion",
    blurb: "A soft cushion case on a fully iced bracelet." },
  { key: "octagon",  name: "Regent",  label: "Octagon",
    blurb: "Eight-sided bezel, integrated iced bracelet." },
  { key: "chrono",   name: "Apex",    label: "Chronograph",
    blurb: "Three sub-dials, stone-set from lug to clasp." },
  { key: "square",   name: "Empire",  label: "Square",
    blurb: "An architectural square case with a Roman dial." },
  { key: "classic",  name: "Crown",   label: "Classic",
    blurb: "The round iced classic, in every finish." }
];

/* Products.
   id      never change or reuse (orders refer to it; the API accepts 1–29)
   coll    one of the collection keys above
   shape   round | cushion | octagon | square      (placeholder artwork only)
   dial    pave | black | blue | skeleton | roman | arabic | chrono
   finish  white | yellow | rose | twoy (two-tone yellow) | twor (two-tone rose)
   tags    "best" = Signature piece on the home page, "new" = New label
   images  photo paths, first one is the main photo, e.g.
           ["assets/products/1-1.jpg", "assets/products/1-2.jpg"]
           Empty [] = the illustrated placeholder is shown.                */
window.KP_PRODUCTS = [
  { id: 1,  name: "Phantom Skeleton Yellow",   coll: "skeleton", shape: "octagon", dial: "skeleton", finish: "yellow", tags: ["best"], images: [] },
  { id: 2,  name: "Crown Arabic Iced",         coll: "classic",  shape: "round",   dial: "arabic",   finish: "white",  tags: ["best"], images: [] },
  { id: 3,  name: "Crown Arabic Two-Tone",     coll: "classic",  shape: "round",   dial: "arabic",   finish: "twoy",   tags: ["new"],  images: [] },
  { id: 4,  name: "Empire Two-Tone",           coll: "square",   shape: "square",  dial: "roman",    finish: "twoy",   tags: ["best"], images: [] },
  { id: 5,  name: "Empire Yellow",             coll: "square",   shape: "square",  dial: "roman",    finish: "yellow", tags: ["new"],  images: [] },
  { id: 6,  name: "Crown Midnight Two-Tone",   coll: "classic",  shape: "round",   dial: "black",    finish: "twoy",   tags: ["new"],  images: [] },
  { id: 7,  name: "Empire Two-Tone Rose",      coll: "square",   shape: "square",  dial: "roman",    finish: "twor",   tags: [],       images: [] },
  { id: 8,  name: "Phantom Skeleton Iced",     coll: "skeleton", shape: "octagon", dial: "skeleton", finish: "white",  tags: ["best"], images: [] },
  { id: 9,  name: "Crown Roman Iced",          coll: "classic",  shape: "round",   dial: "roman",    finish: "white",  tags: [],       images: [] },
  { id: 10, name: "Phantom Square Iced",       coll: "skeleton", shape: "square",  dial: "skeleton", finish: "white",  tags: ["new"],  images: [] },
  { id: 11, name: "Monarch Iced",              coll: "cushion",  shape: "cushion", dial: "pave",     finish: "white",  tags: ["best"], images: [] },
  { id: 12, name: "Phantom Square Rose",       coll: "skeleton", shape: "square",  dial: "skeleton", finish: "rose",   tags: ["new"],  images: [] },
  { id: 13, name: "Regent Two-Tone",           coll: "octagon",  shape: "octagon", dial: "pave",     finish: "twoy",   tags: ["new"],  images: [] },
  { id: 14, name: "Monarch Yellow",            coll: "cushion",  shape: "cushion", dial: "pave",     finish: "yellow", tags: ["best"], images: [] },
  { id: 15, name: "Apex Chronograph Iced",     coll: "chrono",   shape: "round",   dial: "chrono",   finish: "white",  tags: ["best"], images: [] },
  { id: 16, name: "Monarch Two-Tone Rose",     coll: "cushion",  shape: "cushion", dial: "pave",     finish: "twor",   tags: ["new"],  images: [] },
  { id: 17, name: "Apex Chronograph Yellow",   coll: "chrono",   shape: "round",   dial: "chrono",   finish: "yellow", tags: [],       images: [] },
  { id: 18, name: "Regent Iced",               coll: "octagon",  shape: "octagon", dial: "pave",     finish: "white",  tags: ["best"], images: [] },
  { id: 19, name: "Empire Iced",               coll: "square",   shape: "square",  dial: "roman",    finish: "white",  tags: [],       images: [] },
  { id: 20, name: "Phantom Skeleton Two-Tone", coll: "skeleton", shape: "octagon", dial: "skeleton", finish: "twor",   tags: ["new"],  images: [] },
  { id: 21, name: "Monarch Rose",              coll: "cushion",  shape: "cushion", dial: "pave",     finish: "rose",   tags: [],       images: [] },
  { id: 22, name: "Apex Chronograph Rose",     coll: "chrono",   shape: "round",   dial: "chrono",   finish: "rose",   tags: ["new"],  images: [] },
  { id: 23, name: "Empire Pavé Two-Tone",      coll: "square",   shape: "square",  dial: "pave",     finish: "twoy",   tags: [],       images: [] },
  { id: 24, name: "Crown Classic Yellow",      coll: "classic",  shape: "round",   dial: "pave",     finish: "yellow", tags: [],       images: [] },
  { id: 25, name: "Monarch Blue",              coll: "cushion",  shape: "cushion", dial: "blue",     finish: "white",  tags: ["best"], images: [] },
  { id: 26, name: "Monarch Two-Tone Yellow",   coll: "cushion",  shape: "cushion", dial: "pave",     finish: "twoy",   tags: [],       images: [] },
  { id: 27, name: "Empire Blue",               coll: "square",   shape: "square",  dial: "blue",     finish: "white",  tags: ["new"],  images: [] },
  { id: 28, name: "Apex Chronograph Two-Tone", coll: "chrono",   shape: "round",   dial: "chrono",   finish: "twor",   tags: [],       images: [] },
  { id: 29, name: "Regent Yellow",             coll: "octagon",  shape: "octagon", dial: "pave",     finish: "yellow", tags: [],       images: [] }
];
