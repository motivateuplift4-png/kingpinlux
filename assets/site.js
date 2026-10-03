/* =====================================================================
   KINGPIN LUX — shared storefront script
   Cart, header/footer, overlays, search, reveal, placeholder artwork.
   Needs assets/catalog.js loaded first.
   ===================================================================== */
(function () {
"use strict";

var CFG = window.KP_CONFIG || {};
// What was saved in the Store manager (/admin/store, loaded by /api/catalog) replaces the built-in catalogue.
var SAVED = window.KP_SAVED;
if (SAVED && SAVED.products) {
  window.KP_PRODUCTS = SAVED.products;
  var st = SAVED.settings || {};
  ["contact", "promo", "heroImages", "featuredId", "lookbook", "reviews"].forEach(function (k) { if (k in st) CFG[k] = st[k]; });
}
var ALL = window.KP_PRODUCTS || [];
var COLLS = window.KP_COLLECTIONS || [];

/* shared fields every product gets (price, specs, description) */
(function hydrate() {
  var FINISH = { white: "Iced White", yellow: "Yellow", rose: "Rose", twoy: "Two-Tone Yellow", twor: "Two-Tone Rose" };
  var DIAL = { pave: "Full pavé", black: "Midnight black", blue: "Deep blue", skeleton: "Open skeleton",
               roman: "Roman numerals", arabic: "Arabic numerals", chrono: "Chronograph, three sub-dials" };
  var CASE = { round: "41 mm round", cushion: "41 mm cushion", octagon: "41 mm octagonal", square: "40 mm square" };
  ALL.forEach(function (p) {
    p.price = Number(p.price) || CFG.price || 900;
    p.tags = p.tags || []; p.images = p.images || [];
    p.finishName = FINISH[p.finish] || "";
    p.specs = [
      ["Case", p.caseSize || CASE[p.shape]],
      ["Stones", "VVS moissanite, hand-set"],
      ["Dial", DIAL[p.dial]],
      ["Movement", p.movement || (p.dial === "skeleton" ? "Skeleton automatic" : (p.dial === "chrono" ? "Quartz chronograph" : "Automatic"))],
      ["Finish", p.finishName]
    ];
    if (!p.desc) p.desc = "Set stone by stone with VVS moissanite, from bezel to clasp, so it throws light from every angle. " +
      "Delivered in the signature KINGPIN LUX box with its certificate of authenticity and lifetime warranty card.";
  });
})();
// hidden products stay reachable for old links and orders but are never listed
var PRODUCTS = ALL.filter(function (p) { return p.status !== "hidden"; });
function orderable(p) { return !!p && p.status !== "hidden" && !p.soldOut; }
var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function money(n) { return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function prod(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].id == id) return ALL[i]; return null; }
function coll(key) { for (var i = 0; i < COLLS.length; i++) if (COLLS[i].key === key) return COLLS[i]; return null; }

/* ---------- icons ---------- */
var S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';
var I = {
  search: '<svg ' + S + '><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  bag: '<svg ' + S + '><path d="M5 8h14l-1 12.5H6L5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
  menu: '<svg ' + S + '><path d="M3 7h18M3 12h12M3 17h18"/></svg>',
  close: '<svg ' + S + '><path d="M6 6l12 12M18 6L6 18"/></svg>',
  arrow: '<svg ' + S + '><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
  back: '<svg ' + S + '><path d="M20 12H4M10 6l-6 6 6 6"/></svg>',
  plus: '<svg ' + S + '><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg ' + S + '><path d="M5 12h14"/></svg>',
  check: '<svg ' + S + '><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg ' + S + '><rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3"/></svg>',
  globe: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg>',
  shield: '<svg ' + S + '><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.4"/></svg>',
  returns: '<svg ' + S + '><path d="M4 9h11a5 5 0 010 10H8"/><path d="M8 5L4 9l4 4"/></svg>',
  cert: '<svg ' + S + '><circle cx="12" cy="9" r="5.5"/><path d="M9 13.8L7.5 21l4.5-2.5 4.5 2.5-1.5-7.2"/></svg>',
  box: '<svg ' + S + '><path d="M3.5 8L12 4l8.5 4v8L12 20l-8.5-4V8z"/><path d="M3.5 8L12 12l8.5-4M12 12v8"/></svg>',
  bank: '<svg ' + S + '><path d="M3 20h18M4.5 9.5h15M5 9.5V8l7-4 7 4v1.5M7 9.5V17M12 9.5V17M17 9.5V17M4 17h16"/></svg>',
  gem: '<svg ' + S + '><path d="M6.5 4h11L21 9l-9 11L3 9l3.5-5z"/><path d="M3 9h18M9.5 4L8 9l4 11 4-11-1.5-5"/></svg>',
  hand: '<svg ' + S + '><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.2"/></svg>',
  clock: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  whatsapp: '<svg ' + S + '><path d="M20.5 11.6a8.5 8.5 0 01-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1120.5 11.6z"/><path d="M9.2 8.3c.2 2.9 3.4 6.1 6.4 6.4l1-1.4-1.9-1-1 .7c-.9-.4-1.9-1.4-2.3-2.3l.7-1-1-1.9z" fill="currentColor" stroke="none"/></svg>',
  mail: '<svg ' + S + '><rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/></svg>',
  insta: '<svg ' + S + '><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg>',
  chev: '<svg ' + S + '><path d="M9 6l6 6-6 6"/></svg>',
  help: '<svg ' + S + '><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17.2v.1"/></svg>',
  truck: '<svg ' + S + '><path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/></svg>',
  watch: '<svg ' + S + '><rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9 7l1-4h4l1 4M9 17l1 4h4l1-4M12 10v2.2l1.4 1"/></svg>',
  crown: '<svg viewBox="0 0 64 44" aria-hidden="true"><path fill="currentColor" d="M4 40h56l-4-22-12 11L32 8 20 29 8 18 4 40z"/></svg>'
};

/* =====================================================================
   PLACEHOLDER ARTWORK
   An illustrated watch drawn from each product's shape/dial/finish.
   Replaced automatically once a product has `images`.
   ===================================================================== */
var FIN = {
  white:  { bz: "bz-w", pv: "pv-w", mt: "mt-w", solid: "#cfd4db", mk: "#24252a", halo: "#f3f5f8", dl: "pd-w" },
  yellow: { bz: "bz-y", pv: "pv-y", mt: "mt-y", solid: "#d9b66a", mk: "#5e4216", halo: "#fcf1cf", dl: "pd-y" },
  rose:   { bz: "bz-r", pv: "pv-r", mt: "mt-r", solid: "#d79e86", mk: "#5f3426", halo: "#fce6dc", dl: "pd-r" },
  twoy:   { bz: "bz-y", pv: "pv-w", mt: "mt-w", pv2: "pv-y", mt2: "mt-y", solid: "#d9b66a", mk: "#5e4216", halo: "#fcf1cf", dl: "pd-y" },
  twor:   { bz: "bz-r", pv: "pv-w", mt: "mt-w", pv2: "pv-r", mt2: "mt-r", solid: "#d79e86", mk: "#5f3426", halo: "#fce6dc", dl: "pd-r" }
};
// [outer rim, bezel, inner rim, dial] per case shape
var SIZE = { round: [108, 102, 80, 76], octagon: [118, 111, 82, 78], cushion: [108, 102, 78, 74], square: [112, 106, 82, 78] };
// half extents (x, y) used for the crown and bracelet join
var EXT = { round: [108, 108], octagon: [109, 109], cushion: [108, 108], square: [99, 112] };

function defsHTML() {
  // hex-packed stones: `pre` = pattern family (bz bezel, pv bracelet, pd dial), w = stone spacing
  function pave(pre, id, w, r, gap) {
    var h = +(w * 1.7320508).toFixed(3), g = "url(#g-" + id + ")", d = "";
    [[0, 0], [w, 0], [w / 2, h / 2], [0, h], [w, h]].forEach(function (c) {
      d += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + r + '" fill="' + g + '"/>';
    });
    return '<pattern id="' + pre + '-' + id + '" width="' + w + '" height="' + h + '" patternUnits="userSpaceOnUse"><rect width="' + w + '" height="' + h + '" fill="' + gap + '"/>' + d + '</pattern>';
  }
  function stones(id, hi, mid, lo, gap, gap2) {
    return '<radialGradient id="g-' + id + '" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="' + hi + '"/>' +
      '<stop offset=".45" stop-color="' + mid + '"/><stop offset="1" stop-color="' + lo + '"/></radialGradient>' +
      pave("bz", id, 7.6, 3.35, gap) + pave("pv", id, 4.8, 2.05, gap) + pave("pd", id, 3.3, 1.4, gap2);
  }
  function metal(id, a, b, c, d) {
    return '<linearGradient id="mt-' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset=".38" stop-color="' + b +
      '"/><stop offset=".58" stop-color="' + c + '"/><stop offset="1" stop-color="' + d + '"/></linearGradient>';
  }
  function dialG(id, a, b) {
    return '<radialGradient id="dl-' + id + '" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></radialGradient>';
  }
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    stones("w", "#ffffff", "#e3e9f1", "#8b939e", "#4a4e55", "#7d838c") +
    stones("y", "#fffbef", "#f1d690", "#9b7634", "#5a441d", "#8f7036") +
    stones("r", "#fff7f3", "#efc2ad", "#9c624e", "#5a362b", "#8d5c4a") +
    metal("w", "#f8f9fb", "#959ca6", "#eef1f4", "#6a717a") +
    metal("y", "#fff0c4", "#c0913c", "#f3da98", "#8c6726") +
    metal("r", "#ffe4d9", "#c4836b", "#f2c5b3", "#87533f") +
    dialG("black", "#2a2622", "#090807") + dialG("blue", "#36588c", "#0c1729") + dialG("skel", "#191613", "#060504") +
    '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity=".03"/><stop offset=".46" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="shade" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#2b2117" stop-opacity=".26"/><stop offset="1" stop-color="#2b2117" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="shade-d" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    '</defs></svg>';
}

function squircle(h, k) {
  var c = 200;
  return "M" + c + "," + (c - h) + " C" + (c + h * k) + "," + (c - h) + " " + (c + h) + "," + (c - h * k) + " " + (c + h) + "," + c +
    " C" + (c + h) + "," + (c + h * k) + " " + (c + h * k) + "," + (c + h) + " " + c + "," + (c + h) +
    " C" + (c - h * k) + "," + (c + h) + " " + (c - h) + "," + (c + h * k) + " " + (c - h) + "," + c +
    " C" + (c - h) + "," + (c - h * k) + " " + (c - h * k) + "," + (c - h) + " " + c + "," + (c - h) + "Z";
}
function shapeEl(shape, s, fill) {
  if (shape === "round") return '<circle cx="200" cy="200" r="' + s + '" fill="' + fill + '"/>';
  if (shape === "octagon") {
    var pts = [];
    for (var i = 0; i < 8; i++) {
      var a = Math.PI / 8 + i * Math.PI / 4;
      pts.push((200 + s * Math.cos(a)).toFixed(1) + "," + (200 + s * Math.sin(a)).toFixed(1));
    }
    return '<polygon points="' + pts.join(" ") + '" fill="' + fill + '"/>';
  }
  if (shape === "cushion") return '<path d="' + squircle(s, 0.9) + '" fill="' + fill + '"/>';
  var hw = s * 0.88;
  return '<rect x="' + (200 - hw).toFixed(1) + '" y="' + (200 - s) + '" width="' + (2 * hw).toFixed(1) + '" height="' + (2 * s) + '" rx="' + (s * 0.2).toFixed(1) + '" fill="' + fill + '"/>';
}
// distance from centre to the dial edge at angle th (radians, 0 = 12 o'clock)
function edge(shape, D, th) {
  var s = Math.abs(Math.sin(th)), c = Math.abs(Math.cos(th));
  if (shape === "square") return Math.min((D * 0.88) / (s || 1e-6), D / (c || 1e-6));
  if (shape === "cushion") return D * (1 + 0.15 * Math.abs(Math.sin(2 * th)));
  return D;
}
function rng(seed) { var s = (seed * 7919) % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

function art(p, o) {
  o = o || {};
  var F = FIN[p.finish] || FIN.white, shape = p.shape || "round", dialT = p.dial || "pave";
  var sz = SIZE[shape] || SIZE.round, ex = EXT[shape] || EXT.round;
  var dshape = shape === "octagon" ? "round" : shape, D = sz[3];
  var pv = F.pv, pv2 = F.pv2 || F.pv, mt = F.mt, mt2 = F.mt2 || F.mt, bz = F.bz;
  var darkDial = dialT === "black" || dialT === "blue" || dialT === "skeleton";
  var ink = darkDial ? "#dcc085" : F.mk;
  var haloAttr = darkDial ? "" : ' stroke="' + F.halo + '" stroke-width="3.4" stroke-linejoin="round" paint-order="stroke"';
  var vb = o.vb || "0 -50 400 500";
  var out = [];

  /* bracelet: three columns of links, the middle one offset like a brick bond */
  var V = ex[1], reach = o.reach || 330;
  function strap(dir) {
    var g = "", cols = [[130, 46, pv, 0], [178, 44, pv2, 17], [224, 46, pv, 0]];
    cols.forEach(function (c) {
      var y0 = dir < 0 ? 200 - V + 12 + c[3] : 200 + V - 12 - c[3];
      for (var k = 0; k < 14; k++) {
        var y = dir < 0 ? y0 - 34 * (k + 1) + 4 : y0 + 34 * k;
        if (dir < 0 && y + 30 < 200 - reach) break;
        if (dir > 0 && y > 200 + reach) break;
        g += '<rect x="' + c[0] + '" y="' + y + '" width="' + c[1] + '" height="30" rx="4" fill="url(#' + c[2] + ')"/>';
      }
    });
    // end link that meets the case
    var yE = dir < 0 ? 200 - V - 14 : 200 + V - 10;
    g += '<rect x="126" y="' + yE + '" width="148" height="24" rx="7" fill="url(#' + pv + ')"/>';
    return g;
  }
  out.push(strap(-1), strap(1));
  out.push('<circle cx="200" cy="200" r="168" fill="url(#' + (o.dark ? "shade-d" : "shade") + ')"/>');

  /* case */
  out.push(shapeEl(shape, sz[0], "url(#" + mt + ")"));
  out.push(shapeEl(shape, sz[1], "url(#" + bz + ")"));
  out.push(shapeEl(dshape, sz[2], "url(#" + mt2 + ")"));
  var dialFill = dialT === "black" ? "url(#dl-black)" : dialT === "blue" ? "url(#dl-blue)" : dialT === "skeleton" ? "url(#dl-skel)" : "url(#" + F.dl + ")";
  out.push(shapeEl(dshape, D, dialFill));

  /* crown */
  out.push('<rect x="' + (200 + ex[0] - 3) + '" y="190" width="14" height="20" rx="3.5" fill="url(#' + mt + ')"/>');

  /* dial furniture */
  var skip = dialT === "chrono" ? { 3: 1, 6: 1, 9: 1 } : {};
  if (dshape === "round" && dialT !== "skeleton") {
    var rr = D - 3.5, circ = 2 * Math.PI * rr;
    out.push('<circle cx="200" cy="200" r="' + rr + '" fill="none" stroke="' + ink + '" stroke-width="3" stroke-dasharray="0.7 ' + (circ / 60 - 0.7).toFixed(2) + '" opacity=".75"/>');
  }
  if (dialT === "roman" || dialT === "arabic") {
    var R = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    var A = ["١٢", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠", "١١"];
    var labels = dialT === "roman" ? R : A, fs = dialT === "roman" ? 14 : 19;
    for (var h = 0; h < 12; h++) {
      var th = h * Math.PI / 6, d = edge(dshape, D, th) - (dialT === "roman" ? 15 : 14);
      out.push('<text x="' + (200 + d * Math.sin(th)).toFixed(1) + '" y="' + (200 - d * Math.cos(th)).toFixed(1) +
        '" fill="' + ink + '"' + haloAttr + ' font-family="Cormorant Garamond,Times New Roman,serif" font-weight="700" font-size="' + fs +
        '" text-anchor="middle" dominant-baseline="central">' + labels[h] + '</text>');
    }
  } else {
    for (var hh = 0; hh < 12; hh++) {
      if (skip[hh]) continue;
      var t2 = hh * Math.PI / 6, dist = edge(dshape, D, t2) - 7, len = hh % 3 === 0 ? 17 : 13;
      var fill = dialT === "skeleton" ? "url(#" + mt2 + ")" : (darkDial ? "url(#" + mt2 + ")" : ink);
      var bars = hh === 0 ? [-4, 4] : [0];
      bars.forEach(function (off) {
        out.push('<rect x="' + (200 + off - 2.3) + '" y="' + (200 - dist) + '" width="4.6" height="' + len + '" rx="1.2" fill="' + fill + '"' + (darkDial ? "" : ' stroke="' + F.halo + '" stroke-width="1.6" paint-order="stroke"') +
          ' transform="rotate(' + hh * 30 + ' 200 200)"/>');
      });
    }
  }

  if (dialT === "skeleton") {
    var sol = F.solid;
    function gear(cx, cy, r, spokes) {
      var g = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + sol + '" stroke-width="6" stroke-dasharray="2.3 2.1"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 4.5) + '" fill="none" stroke="' + sol + '" stroke-width="1.4"/>';
      for (var i = 0; i < spokes; i++) {
        g += '<rect x="' + (cx - 1.1) + '" y="' + (cy - r + 5) + '" width="2.2" height="' + (r - 5) + '" fill="' + sol + '" transform="rotate(' + (i * 360 / spokes + 12) + ' ' + cx + ' ' + cy + ')"/>';
      }
      return g + '<circle cx="' + cx + '" cy="' + cy + '" r="4.6" fill="url(#' + mt2 + ')"/><circle cx="' + cx + '" cy="' + cy + '" r="2" fill="#a51f3b"/>';
    }
    out.push(gear(182, 214, 33, 5), gear(229, 177, 19, 4));
    out.push('<circle cx="225" cy="238" r="13" fill="none" stroke="' + sol + '" stroke-width="2"/><path d="M212,238h26M225,225v26" stroke="' + sol + '" stroke-width="1.3"/><circle cx="225" cy="238" r="2" fill="#a51f3b"/>');
    out.push('<path d="M' + (200 - D + 16) + ',190 Q200,150 ' + (200 + D - 18) + ',196" fill="none" stroke="url(#' + mt2 + ')" stroke-width="7" stroke-linecap="round" opacity=".95"/>');
    out.push('<path d="M168,' + (200 + D - 14) + ' Q206,232 ' + (200 + D - 20) + ',226" fill="none" stroke="url(#' + mt2 + ')" stroke-width="6" stroke-linecap="round" opacity=".9"/>');
    [[158, 178], [247, 200], [196, 255]].forEach(function (j) { out.push('<circle cx="' + j[0] + '" cy="' + j[1] + '" r="2.2" fill="#a51f3b"/>'); });
  }

  if (dialT === "chrono") {
    [[166, 200], [234, 200], [200, 236]].forEach(function (c, i) {
      out.push('<circle cx="' + c[0] + '" cy="' + c[1] + '" r="16.5" fill="#161518" stroke="' + F.solid + '" stroke-width="1.4"/>' +
        '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="12.8" fill="none" stroke="#9b978f" stroke-width="2.2" stroke-dasharray="0.6 1.4"/>' +
        '<rect x="' + (c[0] - 0.8) + '" y="' + (c[1] - 11) + '" width="1.6" height="12" fill="' + F.solid + '" transform="rotate(' + (40 + i * 95) + ' ' + c[0] + ' ' + c[1] + ')"/>' +
        '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="1.8" fill="' + F.solid + '"/>');
    });
  }

  /* KINGPIN mark */
  if (dialT !== "skeleton") {
    var ly = dialT === "chrono" ? 200 - D * 0.66 : 200 - D * 0.52;
    out.push('<g transform="translate(192.3 ' + ly.toFixed(1) + ') scale(.24)"><path fill="' + ink + '"' + (darkDial ? "" : ' stroke="' + F.halo + '" stroke-width="10" paint-order="stroke"') + ' d="M4 40h56l-4-22-12 11L32 8 20 29 8 18 4 40z"/></g>' +
      '<text x="200" y="' + (ly + 19).toFixed(1) + '" fill="' + ink + '"' + haloAttr.replace("3.4", "2.6") + ' font-family="Cormorant Garamond,Times New Roman,serif" font-weight="700" font-size="8" letter-spacing="1.9" text-anchor="middle">KINGPIN</text>');
  }

  /* crystal glint */
  out.push(shapeEl(dshape, D, "url(#glass)"));

  /* hands at ten past ten */
  var handFill = darkDial ? "url(#" + mt2 + ")" : ink;
  out.push('<g transform="translate(200 200) rotate(-58)"><path d="M-3.6,10 L-3.2,-30 L0,-40 L3.2,-30 L3.6,10Z" fill="' + handFill + '"/>' +
    (darkDial ? '<path d="M-1.3,-6 L-1.2,-29 L1.2,-29 L1.3,-6Z" fill="#f6f0e3" opacity=".85"/>' : '') + '</g>');
  out.push('<g transform="translate(200 200) rotate(60)"><path d="M-2.8,12 L-2.4,-52 L0,-62 L2.4,-52 L2.8,12Z" fill="' + handFill + '"/>' +
    (darkDial ? '<path d="M-1,-8 L-0.9,-50 L0.9,-50 L1,-8Z" fill="#f6f0e3" opacity=".85"/>' : '') + '</g>');
  out.push('<g transform="translate(200 200) rotate(152)"><rect x="-0.7" y="-64" width="1.4" height="80" fill="' + (darkDial ? "#dcc085" : F.mk) + '"/></g>');
  out.push('<circle cx="200" cy="200" r="5.2" fill="url(#' + mt2 + ')"/><circle cx="200" cy="200" r="1.8" fill="' + F.mk + '"/>');

  /* sparkles live in HTML, not in the SVG: animating them inside the SVG would
     force the whole drawing to repaint every frame. Positions follow the tilt/scale. */
  var vbn = vb.split(/[ ,]+/).map(Number), tilt = (o.tilt || 0) * Math.PI / 180, scl = o.scale || 1;
  var r = rng(p.id || 7), n = o.sparkles == null ? 5 : o.sparkles, spk = "";
  for (var s = 0; s < n; s++) {
    var a = r() * Math.PI * 2, onStrap = s % 4 === 3;
    var rad = onStrap ? 0 : (sz[1] + sz[2]) / 2 + (r() - 0.5) * 8;
    var x = onStrap ? 140 + r() * 120 : 200 + rad * Math.cos(a);
    var y = onStrap ? (r() > 0.5 ? 40 + r() * 40 : 320 + r() * 40) : 200 + rad * Math.sin(a);
    var dx = (x - 200) * scl, dy = (y - 200) * scl;
    var X = 200 + dx * Math.cos(tilt) - dy * Math.sin(tilt), Y = 200 + dx * Math.sin(tilt) + dy * Math.cos(tilt);
    var w = (14 + r() * 18) * scl / vbn[2] * 100;
    spk += '<i style="left:' + ((X - vbn[0]) / vbn[2] * 100).toFixed(2) + '%;top:' + ((Y - vbn[1]) / vbn[3] * 100).toFixed(2) +
      '%;width:' + w.toFixed(2) + '%;animation-delay:-' + (r() * 3.6).toFixed(2) + 's"></i>';
  }

  var tf = "translate(200 200) rotate(" + (o.tilt || 0) + ") scale(" + scl + ") translate(-200 -200)";
  return '<div class="kpa"><svg viewBox="' + vb + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g transform="' + tf + '">' +
    out.join("") + '</g></svg>' + spk + '</div>';
}

/* product image if there is one, otherwise the artwork */
function media(p, o) {
  o = o || {};
  var src = p.images && p.images[o.index || 0];
  if (src) return '<img src="' + esc(src) + '" alt="' + esc(p.name) + '"' + (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';
  return art(p, o);
}

/* =====================================================================
   CART (localStorage, shared across pages and tabs)
   ===================================================================== */
var KEY = "kp_cart_v1", mem = [];
function readCart() {
  try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return mem; }
}
function writeCart(v) { mem = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
var cart = readCart().filter(function (c) { return orderable(prod(c.id)) && c.qty > 0; });
if (cart.length !== readCart().length) writeCart(cart);
var subs = [];
function emit() { subs.forEach(function (f) { f(); }); syncCount(); }
var Cart = {
  items: function () { return cart.map(function (c) { var p = prod(c.id); return Object.assign({}, p, { qty: c.qty }); }); },
  count: function () { return cart.reduce(function (s, c) { return s + c.qty; }, 0); },
  subtotal: function () { return cart.reduce(function (s, c) { return s + prod(c.id).price * c.qty; }, 0); },
  add: function (id, q) {
    q = q || 1;
    if (!orderable(prod(id))) return;
    var e = cart.filter(function (c) { return c.id == id; })[0];
    if (e) e.qty = Math.min(20, e.qty + q); else cart.push({ id: +id, qty: Math.min(20, q) });
    writeCart(cart); emit(); bumpCount();
  },
  set: function (id, q) {
    if (q < 1) return Cart.remove(id);
    cart.forEach(function (c) { if (c.id == id) c.qty = Math.min(20, q); });
    writeCart(cart); emit();
  },
  remove: function (id) { cart = cart.filter(function (c) { return c.id != id; }); writeCart(cart); emit(); },
  clear: function () { cart = []; writeCart(cart); emit(); },
  onChange: function (f) { subs.push(f); }
};
window.addEventListener("storage", function (e) { if (e.key === KEY) { cart = readCart().filter(function (c) { return orderable(prod(c.id)); }); emit(); } });
function syncCount() {
  var n = Cart.count();
  $$("[data-count]").forEach(function (b) { b.textContent = n; b.classList.toggle("on", n > 0); });
}
function bumpCount() {
  $$("[data-count]").forEach(function (b) { b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump"); });
}

/* =====================================================================
   VARIANTS (one design, several finishes) + PROMO
   ===================================================================== */
var SWC = { white: ["#e4e7eb"], yellow: ["#d9b66a"], rose: ["#d99f87"], twoy: ["#e4e7eb", "#d9b66a"], twor: ["#e4e7eb", "#d99f87"] };
var FORDER = ["white", "yellow", "rose", "twoy", "twor"];
var FINISHES = [
  { key: "white", label: "Iced White", c: SWC.white, has: function (p) { return p.finish === "white"; } },
  { key: "yellow", label: "Yellow", c: SWC.yellow, has: function (p) { return p.finish === "yellow"; } },
  { key: "rose", label: "Rose", c: SWC.rose, has: function (p) { return p.finish === "rose"; } },
  { key: "two", label: "Two-Tone", c: SWC.twoy, has: function (p) { return p.finish === "twoy" || p.finish === "twor"; } }
];
function gkey(p) { return p.coll + "|" + p.shape + "|" + p.dial; }
var GROUPS = {};
PRODUCTS.forEach(function (p) { (GROUPS[gkey(p)] = GROUPS[gkey(p)] || []).push(p); });
Object.keys(GROUPS).forEach(function (k) {
  GROUPS[k].sort(function (a, b) { return FORDER.indexOf(a.finish) - FORDER.indexOf(b.finish); });
});
function siblings(p) { return GROUPS[gkey(p)] || [p]; }
function designs(list) {
  var seen = {}, out = [];
  list.forEach(function (p) { var k = gkey(p); if (!seen[k]) { seen[k] = 1; out.push(p); } });
  return out;
}
function rep(list) { return list.filter(function (p) { return (p.tags || []).indexOf("best") > -1; })[0] || list[0]; }

var PROMO = CFG.promo && CFG.promo.code ? CFG.promo : null;
function promoPrice(n) { return PROMO ? Math.round(n * (100 - PROMO.percent)) / 100 : n; }

function swatchStyle(c) { return "--c1:" + c[0] + (c[1] ? ";--c2:" + c[1] : ""); }
function swatches(p, asLinks) {
  var sib = siblings(p); if (sib.length < 2) return "";
  return '<div class="sws" role="group" aria-label="Finish">' + sib.map(function (s) {
    var c = SWC[s.finish] || ["#ccc"], cls = "sw" + (c[1] ? " two" : "") + (s.id === p.id ? " on" : "");
    var attrs = ' class="' + cls + '" style="' + swatchStyle(c) + '" aria-label="' + esc(s.finishName) + '" title="' + esc(s.finishName) + '"';
    return asLinks ? '<a href="product.html?id=' + s.id + '"' + attrs + (s.id === p.id ? ' aria-current="true"' : "") + "></a>"
                   : '<button type="button" data-sw="' + s.id + '"' + attrs + (s.id === p.id ? ' aria-pressed="true"' : ' aria-pressed="false"') + "></button>";
  }).join("") + "</div>";
}

/* =====================================================================
   CONTACT
   ===================================================================== */
function contacts() {
  var c = CFG.contact || {}, out = [];
  if (c.whatsapp) out.push({ label: "WhatsApp", href: "https://wa.me/" + String(c.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent("Hello KINGPIN LUX, I have a question about a watch."), icon: I.whatsapp, ext: true });
  if (c.email) out.push({ label: "Email", href: "mailto:" + c.email, icon: I.mail, text: c.email });
  if (c.instagram) out.push({ label: "Instagram", href: "https://instagram.com/" + String(c.instagram).replace(/^@/, ""), icon: I.insta, ext: true, text: "@" + String(c.instagram).replace(/^@/, "") });
  return out;
}
function contactButtons(cls) {
  return contacts().map(function (c, i) {
    return '<a class="btn ' + (i === 0 ? "btn-gold" : "btn-line") + (cls ? " " + cls : "") + '" href="' + esc(c.href) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : "") + ">" + c.icon + esc(c.label) + "</a>";
  }).join("");
}
function fillContacts() {
  var has = contacts().length > 0;
  $$("[data-if-contact]").forEach(function (el) { el.hidden = !has; });
  $$("[data-contacts]").forEach(function (el) { el.innerHTML = contactButtons(el.getAttribute("data-contacts")); });
}

/* =====================================================================
   HEADER / FOOTER / OVERLAYS
   ===================================================================== */
var LOGO = '<a class="logo" href="index.html" aria-label="KINGPIN LUX home">' + I.crown + '<span class="nm">KINGPIN</span><span class="sb">LUX</span></a>';

function topbarHTML() {
  var c = PROMO ? "<b>" + PROMO.percent + "% off</b> every piece &middot; code" +
    '<button class="code" type="button" data-code="' + esc(PROMO.code) + '" title="Copy code">' + esc(PROMO.code) + "</button>"
    : "Lifetime warranty &middot; 30-day returns";
  var msgs = [c, "Free insured shipping worldwide", "Lifetime warranty &middot; 30-day returns"];
  return '<div class="topbar dark"><div class="wrap">' +
    '<div class="l">' + I.gem + "Hand-set VVS moissanite</div>" +
    '<div class="c">' + c + "</div>" +
    '<div class="r">' + I.globe + "Free insured shipping worldwide</div>" +
    '<div class="rot" id="rot" aria-live="off">' + msgs.map(function (m, i) { return "<span" + (i ? "" : ' class="on"') + ">" + m + "</span>"; }).join("") + "</div>" +
    "</div></div>";
}

function header(active) {
  var s = document.currentScript, html;
  if (active === "checkout") {
    html = '<header class="hd hd-min dark" id="hd"><div class="wrap row">' +
      '<a class="back" href="shop.html">' + I.back + "<span>Continue shopping</span></a>" + LOGO +
      '<div class="secure">' + I.lock + "<span>Secure checkout</span></div></div></header>";
  } else {
    var nav = '<li class="has-mega"><a href="shop.html"' + (active === "shop" ? ' class="on" aria-current="page"' : "") + ">Shop all " + I.chev + "</a>" +
      '<div class="mega" id="mega"><div class="wrap" id="megaIn"></div></div></li>' +
      COLLS.map(function (c) {
        return '<li><a href="shop.html?c=' + c.key + '"' + (active === c.key ? ' class="on" aria-current="page"' : "") + ">" + esc(c.name) + "</a></li>";
      }).join("") +
      '<li><a href="index.html#ordering">How to order</a></li>' +
      '<li><a href="info.html"' + (active === "care" ? ' class="on" aria-current="page"' : "") + ">Client care</a></li>";
    html = '<a class="skip" href="#main">Skip to content</a>' + topbarHTML() +
      '<header class="hd dark" id="hd"><div class="wrap row">' +
      '<div class="lead"><button class="ib burger" type="button" data-open="menu" aria-label="Open menu">' + I.menu + "</button>" +
      '<button class="spill" type="button" data-open="search">' + I.search + "<span>Search watches</span><kbd>/</kbd></button></div>" + LOGO +
      '<div class="tools"><button class="ib msearch" type="button" data-open="search" aria-label="Search">' + I.search + "</button>" +
      '<a class="ib help" href="info.html">' + I.help + "<small>Help</small></a>" +
      '<button class="ib" type="button" data-open="cart" aria-label="Shopping bag">' + I.bag + '<small>Bag</small><span class="ct" data-count>0</span></button></div>' +
      '</div><nav class="navrow" aria-label="Main"><ul class="nav">' + nav + "</ul></nav></header>";
  }
  s.insertAdjacentHTML("beforebegin", defsHTML() + html);
}

function collTile(c, o) {
  var list = PRODUCTS.filter(function (p) { return p.coll === c.key; }), r = rep(list);
  return { list: list, art: r ? media(r, o) : "" };
}
function fillMega() {
  var box = $("#megaIn"); if (!box || box.childElementCount) return;
  box.innerHTML = COLLS.map(function (c) {
    var t = collTile(c, { sparkles: 0, scale: 1.25, dark: true, vb: "0 0 400 400" });
    return '<a class="mtile" href="shop.html?c=' + c.key + '"><div class="th">' + t.art + "</div><b>" + esc(c.name) + "</b><small>" + esc(c.label) + " &middot; " + t.list.length + "</small></a>";
  }).join("") +
    '<div class="mside"><h5>Shop by finish</h5>' + FINISHES.map(function (f) {
      return '<a href="shop.html?f=' + f.key + '"><span class="sw' + (f.c[1] ? " two" : "") + '" style="' + swatchStyle(f.c) + '"></span>' + f.label + "</a>";
    }).join("") + '<a class="btn btn-gold btn-sm" href="shop.html">Shop all ' + PRODUCTS.length + "</a></div>";
}
function fillMenu() {
  var box = $("#mmGrid"); if (!box || box.childElementCount > 1) return;
  box.insertAdjacentHTML("beforeend", COLLS.map(function (c) {
    var t = collTile(c, { sparkles: 0, scale: 1.3, dark: true, vb: "0 -10 400 420" });
    return '<a href="shop.html?c=' + c.key + '">' + t.art + "<b>" + esc(c.name) + "</b><span>" + esc(c.label) + "</span></a>";
  }).join(""));
}

function fh(t) { return '<h5><button class="fh" type="button" aria-expanded="false">' + t + "<i></i></button></h5>"; }
function footer(mode) {
  var s = document.currentScript, yr = new Date().getFullYear(), html;
  if (mode === "min") {
    html = '<footer class="ft-min"><div class="wrap"><span>&copy; ' + yr + " KINGPIN LUX</span><nav>" +
      '<a href="info.html#shipping">Shipping</a><a href="info.html#returns">Returns</a><a href="info.html#payment">Payment</a><a href="info.html#privacy">Privacy</a></nav></div></footer>';
  } else {
    var cs = contacts();
    var last = cs.length ? '<div class="fcol">' + fh("Contact") + "<ul>" + cs.map(function (c) {
        return '<li><a href="' + esc(c.href) + '"' + (c.ext ? ' target="_blank" rel="noopener"' : "") + ">" + esc(c.text || c.label) + "</a></li>";
      }).join("") + "</ul></div>"
      : '<div class="fcol">' + fh("Ordering") + '<ul><li><a href="index.html#ordering">How to order</a></li><li><a href="info.html#payment">Paying by bank transfer</a></li><li><a href="info.html#shipping">Delivery times</a></li></ul></div>';
    html = '<footer class="ft dark"><div class="wrap">' +
      '<div class="join"><div><span class="eyebrow">The KINGPIN list</span><h3>New pieces &amp; private offers, <em>first.</em></h3></div>' +
      '<div><form class="join-f" id="joinForm" novalidate><input type="email" name="email" placeholder="Your email address" autocomplete="email" aria-label="Email address">' +
      '<input class="hp" type="text" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn btn-gold" type="submit">Join</button></form>' +
      '<p class="join-fine" id="joinMsg" role="status">By joining you agree to receive emails from KINGPIN LUX. Unsubscribe any time.</p></div></div>' +
      '<div class="cols">' +
      "<div>" + LOGO + '<p class="about">Iced-out timepieces, set by hand with VVS moissanite and delivered insured to your door, anywhere in the world.</p>' +
      '<div class="pays"><span>BANK TRANSFER</span><span>SWIFT</span><span>IBAN</span></div></div>' +
      '<div class="fcol">' + fh("Collections") + '<ul><li><a href="shop.html">All watches</a></li>' + COLLS.map(function (c) {
        return '<li><a href="shop.html?c=' + c.key + '">' + esc(c.name) + " &middot; " + esc(c.label) + "</a></li>";
      }).join("") + "</ul></div>" +
      '<div class="fcol">' + fh("Shop by finish") + "<ul>" + FINISHES.map(function (f) { return '<li><a href="shop.html?f=' + f.key + '">' + f.label + "</a></li>"; }).join("") + "</ul></div>" +
      '<div class="fcol">' + fh("Client care") + '<ul><li><a href="info.html#shipping">Shipping &amp; delivery</a></li><li><a href="info.html#returns">Returns</a></li>' +
      '<li><a href="info.html#warranty">Lifetime warranty</a></li><li><a href="index.html#faq">FAQ</a></li><li><a href="info.html#privacy">Privacy</a></li></ul></div>' +
      last + '</div><div class="bot"><span>&copy; ' + yr + " KINGPIN LUX. All rights reserved.</span><span>" + I.lock + "Secure checkout &middot; Payment by bank transfer</span></div></div></footer>";
  }
  html += overlaysHTML(mode);
  s.insertAdjacentHTML("beforebegin", html);
  init();
}

function overlaysHTML(mode) {
  var h = '<div class="toast" id="toast" role="status" aria-live="polite">' + I.check + '<span id="toastMsg"></span></div>';
  if (mode === "min") return h;
  var wa = contacts().filter(function (c) { return c.label === "WhatsApp"; })[0];
  if (wa) h += '<a class="wa-float" href="' + esc(wa.href) + '" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">' + I.whatsapp + "</a>";
  return h + '<div class="scrim" id="scrim"></div>' +
    '<aside class="panel left dark" id="menu" aria-label="Menu" aria-hidden="true"><div class="panel-hd">' + LOGO +
    '<button class="x" type="button" data-close aria-label="Close menu">' + I.close + "</button></div>" +
    '<div class="mm"><div class="mm-grid" id="mmGrid"><a class="all" href="shop.html"><b>Shop all</b><span>' + PRODUCTS.length + " pieces &rarr;</span></a></div>" +
    '<nav class="mm-links"><a href="index.html#ordering">How to order' + I.arrow + '</a><a href="info.html">Client care' + I.arrow + "</a>" +
    '<a href="info.html#shipping">Shipping &amp; returns' + I.arrow + "</a></nav>" +
    (PROMO ? '<div class="cart-promo" style="margin:20px 0 0"><b>' + PROMO.percent + "% off</b> every piece with code <b>" + esc(PROMO.code) + "</b> at checkout.</div>" : "") +
    '<div class="mm-foot" data-if-contact hidden><p>Questions before you buy? Speak to us directly.</p><div class="contacts" data-contacts="btn-sm"></div></div></div></aside>' +
    '<aside class="panel right" id="cart" aria-label="Shopping bag" aria-hidden="true"><div class="panel-hd"><h3>Your bag <small id="cartN"></small></h3>' +
    '<button class="x" type="button" data-close aria-label="Close bag">' + I.close + "</button></div>" +
    '<div id="cartPromo"></div><div class="cart-items" id="cartItems"></div><div class="cart-ft" id="cartFt"></div></aside>' +
    '<div class="search dark" id="search" role="dialog" aria-modal="true" aria-label="Search watches" aria-hidden="true">' +
    '<button class="x" type="button" data-close aria-label="Close search">' + I.close + "</button>" +
    '<div class="in"><label for="sIn" class="eyebrow">Search the collection</label><input id="sIn" type="search" placeholder="Skeleton, rose, chrono…" autocomplete="off">' +
    '<div class="squick">' + COLLS.map(function (c) { return '<a class="chip" href="shop.html?c=' + c.key + '">' + esc(c.label) + "</a>"; }).join("") +
    FINISHES.map(function (f) { return '<a class="chip" href="shop.html?f=' + f.key + '">' + f.label + "</a>"; }).join("") + "</div>" +
    '<div class="sres" id="sRes"></div></div></div>';
}

/* ---------- cart panel ---------- */
function renderCart() {
  var box = $("#cartItems"), ft = $("#cartFt");
  if (!box) return;
  var it = Cart.items(), n = Cart.count(), sub = Cart.subtotal();
  $("#cartN").textContent = n ? "(" + n + ")" : "";
  $("#cartPromo").innerHTML = it.length && PROMO ? '<div class="cart-promo">Use code <b>' + esc(PROMO.code) + "</b> at checkout and pay <b>" +
    money(promoPrice(sub)) + "</b> instead of " + money(sub) + ".</div>" : "";
  if (!it.length) {
    box.innerHTML = '<div class="cart-empty"><h4>Your bag is empty</h4><p>Every piece ships insured, worldwide, at no cost.</p>' +
      '<a class="btn btn-dark" href="shop.html">Shop all watches</a></div>';
    ft.innerHTML = ""; ft.hidden = true;
    return;
  }
  ft.hidden = false;
  box.innerHTML = it.map(function (p) {
    return '<div class="ci"><a class="th" href="product.html?id=' + p.id + '">' + media(p, { sparkles: 0, scale: 1.15 }) + "</a>" +
      '<div><h4><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h4><div class="fn">' + esc(p.finishName) + "</div>" +
      '<div class="qty"><button type="button" data-dec="' + p.id + '" aria-label="One less">' + I.minus + "</button><span>" + p.qty +
      '</span><button type="button" data-inc="' + p.id + '" aria-label="One more">' + I.plus + "</button></div>" +
      '<button class="rm" type="button" data-rm="' + p.id + '">Remove</button></div>' +
      '<div class="pr">' + money(p.price * p.qty) + "</div></div>";
  }).join("");
  ft.innerHTML = '<div class="r"><span>Subtotal</span><b>' + money(sub) + "</b></div>" +
    '<div class="r"><span>Insured express shipping</span><b>Free</b></div>' +
    '<div class="tot"><span>Total</span><b>' + money(sub) + "</b></div>" +
    '<a class="btn btn-gold btn-block" href="checkout.html">' + I.lock + "Secure checkout</a>" +
    '<div class="note">' + I.bank + "<span>Pay by bank transfer. Nothing is charged now: you get our bank details and a reference, and your piece is held for 72 hours.</span></div>";
}

/* ---------- search ---------- */
function renderSearch(q) {
  var box = $("#sRes"); if (!box) return;
  q = (q || "").trim().toLowerCase();
  if (!q) { box.innerHTML = ""; return; }
  var words = q.split(/\s+/);
  var hits = PRODUCTS.filter(function (p) {
    var c = coll(p.coll) || {};
    var hay = (p.name + " " + c.label + " " + c.name + " " + p.finishName + " " + p.dial + " " + p.shape + (p.finish.indexOf("two") === 0 ? " two-tone two tone" : "")).toLowerCase();
    return words.every(function (w) { return hay.indexOf(w) > -1; });
  }).slice(0, 8);
  box.innerHTML = hits.length ? hits.map(function (p) {
    var c = coll(p.coll) || {};
    return '<a href="product.html?id=' + p.id + '"><span class="th">' + media(p, { sparkles: 0, scale: 1.15, dark: true }) + "</span>" +
      '<span><span class="cl">' + esc(c.label) + " &middot; " + esc(p.finishName) + '</span><br><span class="nm">' + esc(p.name) + "</span></span>" +
      '<span class="pr">' + money(p.price) + "</span></a>";
  }).join("") : '<p class="none">Nothing matches &ldquo;' + esc(q) + "&rdquo;. Try a collection above.</p>";
}

/* ---------- open / close overlays ---------- */
var openEl = null, lastFocus = null;
function open(id) {
  var el = document.getElementById(id); if (!el) return;
  if (openEl) close(true);
  lastFocus = document.activeElement;
  if (id === "cart") renderCart();
  if (id === "menu") fillMenu();
  el.classList.add("on"); el.setAttribute("aria-hidden", "false");
  if (id !== "search") $("#scrim").classList.add("on");
  document.body.classList.add("lock");
  openEl = el;
  setTimeout(function () {
    var f = id === "search" ? $("#sIn") : el.querySelector("a[href],button,input");
    if (f) f.focus({ preventScroll: true });
  }, 60);
}
function close(silent) {
  if (!openEl) return;
  openEl.classList.remove("on"); openEl.setAttribute("aria-hidden", "true");
  if ($("#scrim")) $("#scrim").classList.remove("on");
  document.body.classList.remove("lock");
  openEl = null;
  if (!silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

/* ---------- toast ---------- */
function toast(msg) {
  var t = $("#toast"); if (!t) return;
  $("#toastMsg").textContent = msg;
  t.classList.add("on"); clearTimeout(t._t);
  t._t = setTimeout(function () { t.classList.remove("on"); }, 2400);
}
function copy(text, done) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
}

/* ---------- reveal on scroll ---------- */
var io = null;
function reveal() {
  var els = $$(".rv:not(.in)");
  if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
  if (!io) io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach(function (e) { io.observe(e); });
}

/* ---------- delivery estimate from the store's own promises ----------
   transfer 1-3 business days + dispatch within 1 + transit 3-6 = 5 to 10 business days */
function addBiz(d, n) { d = new Date(d); while (n > 0) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n--; } return d; }
function fmtDay(d) { return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function eta() {
  var now = new Date();
  return { from: fmtDay(addBiz(now, 5)), to: fmtDay(addBiz(now, 10)), hold: fmtDay(new Date(now.getTime() + 72 * 36e5)) };
}

/* ---------- reviews (only real ones, added in the Store manager) ---------- */
function stars(n) {
  var s = "";
  for (var i = 1; i <= 5; i++) s += '<svg viewBox="0 0 24 24"' + (i <= Math.round(n) ? ' class="on"' : "") + '><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.5 6.6-.8z"/></svg>';
  return '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">' + s + "</span>";
}
function reviews() { return (CFG.reviews || []).slice(); }
function reviewSummary(list) {
  if (!list.length) return null;
  var avg = list.reduce(function (s, r) { return s + r.rating; }, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
}
function reviewCard(r, i) {
  var p = r.productId ? prod(r.productId) : null;
  var d = r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  return '<figure class="rev rv" data-d="' + ((i || 0) % 3 + 1) + '">' + (r.img ? '<div class="rimg"><img src="' + esc(r.img) + '" alt="" loading="lazy" decoding="async"></div>' : "") +
    '<div class="rbody">' + stars(r.rating) + "<blockquote>" + esc(r.text).replace(/\n/g, "<br>") + "</blockquote>" +
    "<figcaption><b>" + esc(r.name) + "</b>" + (r.place ? " &middot; " + esc(r.place) : "") + (d ? "<span>" + d + "</span>" : "") +
    (p && p.status !== "hidden" ? '<a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a>" : "") + "</figcaption></div></figure>";
}

/* ---------- product card ---------- */
function card(p, i) {
  var c = coll(p.coll) || {}, isNew = (p.tags || []).indexOf("new") > -1;
  var badges = p.soldOut ? '<span class="badge">Sold out</span>'
    : (isNew ? '<span class="badge">New</span>' : "") + (PROMO ? '<span class="badge g">&minus;' + PROMO.percent + "%</span>" : "");
  return '<article class="card rv" data-d="' + ((i || 0) % 4 + 1) + '"><div class="mwrap">' +
    '<a class="media" href="product.html?id=' + p.id + '" aria-label="' + esc(p.name) + '">' + (badges ? '<span class="badges">' + badges + "</span>" : "") +
    media(p, { scale: 1.06 }) + (p.images && p.images[1] ? '<img class="alt" src="' + esc(p.images[1]) + '" alt="" loading="lazy" decoding="async">' : "") + "</a>" +
    (p.soldOut ? "" : '<button class="qadd" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to bag">' + I.plus + "<span>Add to bag</span></button>") + "</div>" +
    '<div class="info"><div class="top"><span class="cl">' + esc(c.label) + "</span>" + swatches(p) + "</div>" +
    '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
    '<div class="pr"><b>' + money(p.price) + "</b>" + (p.soldOut ? '<span class="so">Sold out</span>' : PROMO ? "<span>" + money(promoPrice(p.price)) + " with " + esc(PROMO.code) + "</span>" : "") + "</div></div></article>";
}

/* ---------- wiring ---------- */
function init() {
  syncCount();
  fillContacts();
  Cart.onChange(function () { if (openEl && openEl.id === "cart") renderCart(); });

  var hd = $("#hd"), ticking = false, lastY = window.scrollY, hidden = false, small = matchMedia("(max-width:900px)");
  function setHidden(h) { if (h !== hidden) { hidden = h; document.body.classList.toggle("hd-hide", h); } }
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (hd) hd.classList.toggle("scrolled", y > 10);
    if (!small.matches || openEl || y < 140) { setHidden(false); lastY = y; return; }
    if (Math.abs(y - lastY) < 8) return;
    setHidden(y > lastY);
    lastY = y;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // build the mega menu the first time someone reaches for it
  var hm = $(".has-mega");
  if (hm) { hm.addEventListener("mouseenter", fillMega); hm.addEventListener("focusin", fillMega); }

  // rotating top-bar messages (phones)
  var rot = $$("#rot span"), ri = 0;
  if (rot.length > 1 && !reduce) setInterval(function () {
    rot[ri].classList.remove("on"); ri = (ri + 1) % rot.length; rot[ri].classList.add("on");
  }, 4000);

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-close],[data-add],[data-inc],[data-dec],[data-rm],[data-sw],[data-code],#scrim,.mm a,.sres a");
    if (!t) return;
    if (t.hasAttribute("data-open")) { e.preventDefault(); open(t.getAttribute("data-open")); return; }
    if (t.hasAttribute("data-close") || t.id === "scrim") { close(); return; }
    if (t.hasAttribute("data-code")) {
      var code = t.getAttribute("data-code");
      copy(code, function () { toast("Code " + code + " copied. Paste it at checkout."); });
      return;
    }
    if (t.matches(".mm a,.sres a")) { close(true); return; }
    if (t.hasAttribute("data-sw")) {
      var np = prod(t.getAttribute("data-sw")), el = t.closest(".card");
      if (!np || !el) return;
      var tmp = document.createElement("div"); tmp.innerHTML = card(np, 0);
      var fresh = tmp.firstChild; fresh.classList.add("in"); fresh.removeAttribute("data-d");
      el.replaceWith(fresh);
      var b = fresh.querySelector('[data-sw="' + np.id + '"]'); if (b) b.focus({ preventScroll: true });
      return;
    }
    if (t.hasAttribute("data-add")) {
      e.preventDefault();
      var p = prod(t.getAttribute("data-add")); if (!p) return;
      Cart.add(p.id, 1);
      if (t.classList.contains("qadd")) {
        t.classList.add("done"); var sp = t.querySelector("span"), old = sp ? sp.textContent : "";
        if (sp) sp.textContent = "Added";
        setTimeout(function () { t.classList.remove("done"); if (sp) sp.textContent = old; }, 1600);
      }
      setTimeout(function () { open("cart"); }, reduce ? 0 : 260);
      return;
    }
    var id = t.getAttribute("data-inc") || t.getAttribute("data-dec") || t.getAttribute("data-rm");
    var line = Cart.items().filter(function (x) { return x.id == id; })[0]; if (!line) return;
    if (t.hasAttribute("data-inc")) Cart.set(id, line.qty + 1);
    else if (t.hasAttribute("data-dec")) Cart.set(id, line.qty - 1);
    else Cart.remove(id);
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".fh"); if (!b) return;
    var col = b.closest(".fcol"), open = !col.classList.contains("open");
    col.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
    if (e.key === "/" && !openEl && $("#search") && !/input|textarea|select/i.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); open("search"); }
  });
  var sIn = $("#sIn");
  if (sIn) sIn.addEventListener("input", function () { renderSearch(this.value); });

  // email list sign-up (saved by api/subscribe.js, listed in /admin)
  var jf = $("#joinForm");
  if (jf) jf.addEventListener("submit", function (e) {
    e.preventDefault();
    var em = jf.email.value.trim(), msg = $("#joinMsg"), btn = jf.querySelector("button");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      msg.className = "join-fine no"; msg.textContent = "Please enter a valid email address."; jf.email.focus(); return;
    }
    btn.classList.add("busy");
    fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ email: em, hp: jf.hp.value, source: location.pathname.replace(/^\//, "") || "index" }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || r.status); return j; }); })
      .then(function (j) {
        msg.className = "join-fine ok";
        msg.textContent = j.already ? "You're already on the list." : "You're on the list. Welcome to KINGPIN.";
        jf.reset();
      })
      .catch(function () { msg.className = "join-fine no"; msg.textContent = "Couldn't join right now. Please try again in a moment."; })
      .then(function () { btn.classList.remove("busy"); });
  });

  reveal();
}

window.KP = {
  config: CFG, products: PRODUCTS, all: ALL, orderable: orderable, saved: !!SAVED, collections: COLLS,
  stars: stars, reviews: reviews, reviewSummary: reviewSummary, reviewCard: reviewCard, defsHTML: defsHTML, eta: eta, finishes: FINISHES, promo: PROMO, prod: prod, coll: coll, money: money, esc: esc, icon: I,
  art: art, media: media, card: card, swatches: swatches, siblings: siblings, designs: designs, rep: rep, promoPrice: promoPrice,
  cart: Cart, contacts: contacts, contactButtons: contactButtons, copy: copy,
  header: header, footer: footer, open: open, close: close, toast: toast, reveal: reveal, $: $, $$: $$, reduce: reduce
};
})();
