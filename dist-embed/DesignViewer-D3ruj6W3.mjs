import { jsx as E, jsxs as wt } from "react/jsx-runtime";
import { memo as It, useState as St, useEffect as bt, useId as tr, useRef as it, forwardRef as Ae, useMemo as qt, useCallback as Tt, useImperativeHandle as xn } from "react";
import { createPortal as $e } from "react-dom";
let Bt = null;
function Hs(t) {
  Bt = t;
}
function Us() {
  return Bt && Bt.isConnected ? Bt : document.getElementById("app") || document.querySelector(".ds-root");
}
function js() {
  return !!(Bt && Bt.isConnected);
}
function Ne() {
  if (Bt && Bt.isConnected)
    return Bt;
}
const er = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT"]);
function Ce(t) {
  return !t || typeof Node > "u" || !(t instanceof Node) ? null : t instanceof Element ? t : t.parentElement;
}
function Gs(t) {
  if (typeof document > "u")
    return !1;
  if (t === document || t === document.body || t === document.documentElement || t === window)
    return !0;
  const e = Ce(t);
  if (!e)
    return !1;
  const n = Ne();
  return n ? n.contains(e) : !0;
}
function Xs(t) {
  const e = Ce(t);
  if (!e)
    return !1;
  const n = Ne();
  return n ? n.contains(e) : !0;
}
function Ys(t) {
  const e = Ce(t);
  return e ? er.has(e.nodeName) || !!e.isContentEditable : !1;
}
const _n = ["href", "color", "bold", "italic", "underline", "strike"], Pe = /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|DL|DD|DT|FOOTER|H[1-6]|HEADER|LI|OL|P|PRE|SECTION|TABLE|TD|TH|TR|UL)$/, De = /^(HEAD|LINK|META|NOSCRIPT|SCRIPT|STYLE|TEMPLATE|TITLE)$/, Re = 3, Le = 1, Sn = 64, Be = typeof DOMParser > "u" ? null : new DOMParser();
function nr(t) {
  return Be ? Be.parseFromString(`<body>${t}`, "text/html").body : Object.assign(document.createElement("div"), { innerHTML: t });
}
const rr = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  // A non-breaking space, spelled out because it is invisible in a file.
  // Written the way the browser serialises it, so the stored string matches
  // what innerHTML reads back and the editor is not rewritten for nothing.
  " ": "&nbsp;"
};
function we(t) {
  return t.replace(/[&<>"\u00a0]/g, (e) => rr[e]);
}
const or = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, ir = /^rgba?\(\s*([^)]+)\)$/i, te = (t) => Math.max(0, Math.min(255, Math.round(t))).toString(16).padStart(2, "0");
function Fe(t) {
  if (!t)
    return;
  const e = t.trim(), n = e.match(or);
  if (n) {
    let r = n[1].toLowerCase();
    return r.length <= 4 && (r = r.split("").map((i) => i + i).join("")), "#" + (r.length === 8 && r.endsWith("ff") ? r.slice(0, 6) : r);
  }
  const o = e.match(ir);
  if (o) {
    const r = o[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (r.length < 3 || r.slice(0, 3).some(Number.isNaN))
      return;
    const i = r.length > 3 && !Number.isNaN(r[3]) ? r[3] : 1, a = "#" + te(r[0]) + te(r[1]) + te(r[2]);
    return i >= 1 ? a : a + te(i * 255);
  }
}
const sr = /^([a-z][a-z0-9+.-]*):/i, ar = /* @__PURE__ */ new Set(["http", "https", "mailto", "tel"]);
function kn(t) {
  var o;
  const e = (t ?? "").trim();
  if (!e)
    return;
  const n = (o = e.match(sr)) == null ? void 0 : o[1].toLowerCase();
  if (n)
    return ar.has(n) ? e : void 0;
  if (e.startsWith("//"))
    return "https:" + e;
  if (!/\s/.test(e))
    return "https://" + e;
}
function Mn(t, e) {
  return _n.every((n) => (t[n] || void 0) === (e[n] || void 0));
}
function cr(t, e) {
  var r, i;
  const n = { ...e };
  switch (t.tagName) {
    case "B":
    case "STRONG":
      n.bold = !0;
      break;
    case "I":
    case "EM":
      n.italic = !0;
      break;
    case "U":
      n.underline = !0;
      break;
    case "S":
    case "STRIKE":
    case "DEL":
      n.strike = !0;
      break;
    case "A": {
      const a = kn((r = t.getAttribute) == null ? void 0 : r.call(t, "href"));
      a && (n.href = a);
      break;
    }
    case "FONT": {
      const a = Fe((i = t.getAttribute) == null ? void 0 : i.call(t, "color"));
      a && (n.color = a);
      break;
    }
  }
  const o = t.style;
  if (o && o.length) {
    const a = Fe(o.color);
    a && (n.color = a);
    const c = o.fontWeight;
    (c === "bold" || c === "bolder" || Number(c) >= 600) && (n.bold = !0), (o.fontStyle === "italic" || o.fontStyle === "oblique") && (n.italic = !0);
    const g = o.textDecorationLine || o.textDecoration || "";
    /underline/.test(g) && (n.underline = !0), /line-through/.test(g) && (n.strike = !0);
  }
  return n;
}
function Ee(t) {
  return Te(nr(t ?? ""));
}
function Te(t) {
  const e = [];
  let n = [], o = !1;
  const r = () => {
    e.push(n), n = [], o = !1;
  }, i = (g) => {
    let m = g;
    for (; ; ) {
      for (let M = m.nextSibling; M; M = M.nextSibling)
        if (M.nodeType === Re && M.data || M.nodeType === Le && !De.test(M.tagName ?? ""))
          return !1;
      const x = m.parentNode;
      if (!x || x === t || Pe.test(x.tagName ?? ""))
        return !0;
      m = x;
    }
  }, a = (g, m) => {
    if (!g)
      return;
    const x = n[n.length - 1];
    x && Mn(x, m) ? x.text += g : n.push({ text: g, ...m }), o = !0;
  }, c = (g, m, x = 0) => {
    if (!(x > Sn))
      for (const M of Array.from(g.childNodes)) {
        if (M.nodeType === Re) {
          const W = M.data;
          if (!W || /^(UL|OL)$/.test(g.tagName ?? "") && !W.trim())
            continue;
          W.split(`
`).forEach((F, U) => {
            U > 0 && r(), a(F, m), U > 0 && !F && (o = !0);
          });
          continue;
        }
        if (M.nodeType !== Le)
          continue;
        const $ = M;
        if (!De.test($.tagName ?? "")) {
          if ($.tagName === "BR") {
            if (i($)) {
              o = !0;
              continue;
            }
            r();
            continue;
          }
          if (Pe.test($.tagName ?? "")) {
            o && r(), c($, m, x + 1), o && r();
            continue;
          }
          c($, cr($, m), x + 1);
        }
      }
  };
  return c(t, {}), (o || e.length === 0) && e.push(n), e;
}
function Gt(t) {
  return t.map((e) => e.text).join("");
}
function lr(t, e, n) {
  switch (t) {
    case "href":
      return `<a href="${we(String(e))}">${n}</a>`;
    case "color":
      return `<span style="color:${we(String(e))}">${n}</span>`;
    case "bold":
      return `<b>${n}</b>`;
    case "italic":
      return `<i>${n}</i>`;
    case "underline":
      return `<u>${n}</u>`;
    case "strike":
      return `<s>${n}</s>`;
  }
}
function An(t, e) {
  if (e.length === 0)
    return t.map((a) => we(a.text)).join("");
  const [n, ...o] = e;
  let r = "", i = 0;
  for (; i < t.length; ) {
    const a = t[i][n] || void 0;
    let c = i;
    for (; c < t.length && (t[c][n] || void 0) === a; )
      c++;
    const g = An(t.slice(i, c), o);
    r += a ? lr(n, a, g) : g, i = c;
  }
  return r;
}
function ze(t) {
  return An(
    t.filter((e) => e.text),
    _n
  );
}
function ce(t, e = "none") {
  if (e === "bullet" || e === "number") {
    const o = e === "number" ? "ol" : "ul", r = t.map((i) => `<li>${Gt(i).trim() ? ze(i) : "<br>"}</li>`);
    return `<${o}>${r.join("")}</${o}>`;
  }
  const n = t.map(ze).join("<br>");
  return t.length > 1 && !Gt(t[t.length - 1]) ? n + "<br>" : n;
}
function Vs(t, e = "none") {
  return ce(Ee(t), e);
}
function Ks(t, e = "none") {
  return ce(
    String(t ?? "").split(`
`).map((n) => n ? [{ text: n }] : []),
    e
  );
}
function ur(t) {
  const e = [];
  for (const n of t) {
    const { text: o, ...r } = n;
    for (const i of Array.from(o))
      e.push({ char: i, format: r });
  }
  return e;
}
function fr(t) {
  const e = [];
  for (const { char: n, format: o } of t) {
    const r = e[e.length - 1];
    r && Mn(r, o) ? r.text += n : e.push({ text: n, ...o });
  }
  return e;
}
function dr(t, e) {
  var c, g;
  const n = ur(t), o = Array.from(e);
  let r = 0;
  for (; r < n.length && r < o.length && n[r].char === o[r]; )
    r++;
  let i = 0;
  for (; i < n.length - r && i < o.length - r && n[n.length - 1 - i].char === o[o.length - 1 - i]; )
    i++;
  const a = ((c = n[r]) == null ? void 0 : c.format) ?? ((g = n[r - 1]) == null ? void 0 : g.format) ?? {};
  return fr([...n.slice(0, r), ...o.slice(r, o.length - i).map((m) => ({ char: m, format: a })), ...n.slice(n.length - i)]);
}
function Qs(t, e, n = "none") {
  const o = Ee(t), r = String(e ?? "").split(`
`), i = [];
  if (o.length === r.length)
    o.forEach((a, c) => i.push(dr(a, r[c])));
  else {
    let a = 0;
    for (; a < o.length && a < r.length && Gt(o[a]) === r[a]; )
      a++;
    let c = 0;
    for (; c < o.length - a && c < r.length - a && Gt(o[o.length - 1 - c]) === r[r.length - 1 - c]; )
      c++;
    i.push(...o.slice(0, a));
    for (const g of r.slice(a, r.length - c))
      i.push(g ? [{ text: g }] : []);
    i.push(...o.slice(o.length - c));
  }
  return ce(i, n);
}
const Nn = /\{\{\s*([^{}\n]+?)\s*\}\}/g;
function oe(t) {
  return t.trim().toLowerCase();
}
function Zs(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [n, o] of Object.entries(t))
    o !== void 0 && e.set(oe(n), o);
  return (n) => e.get(oe(n));
}
const hr = /^(address|blockquote|div|dl|dd|dt|h[1-6]|li|ol|p|pre|table|td|th|tr|ul)$/, qe = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};
function pr(t) {
  return Number.isInteger(t) && t > 0 && t <= 1114111 && !(t >= 55296 && t <= 57343);
}
function Kt(t) {
  return t.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (e, n) => {
    if (n[0] === "#") {
      const r = n[1] === "x" || n[1] === "X", i = r ? n.slice(2) : n.slice(1);
      if (!i || !(r ? /^[0-9a-f]+$/i : /^[0-9]+$/).test(i))
        return e;
      const a = parseInt(i, r ? 16 : 10);
      return pr(a) ? String.fromCodePoint(a) : e;
    }
    const o = n.toLowerCase();
    return Object.hasOwn(qe, o) ? qe[o] : e;
  });
}
function Cn(t) {
  if (!t)
    return "";
  const e = t.replace(/<br\s*\/?>/gi, `
`).replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (n, o) => hr.test(String(o).toLowerCase()) ? `
` : "");
  return Kt(e).replace(/\n{3,}/g, `

`).replace(/^\n+|\n+$/g, "");
}
function Js(t) {
  return !t || !t.includes("{{") ? !1 : Cn(t).search(Nn) !== -1;
}
function gr(t) {
  if (!t || !t.includes("{{"))
    return [];
  const e = [], n = /* @__PURE__ */ new Set();
  for (const o of Cn(t).matchAll(Nn)) {
    const r = o[1].trim(), i = oe(r);
    n.has(i) || (n.add(i), e.push(r));
  }
  return e;
}
function ta(t, e) {
  if (!t || !t.includes("{{"))
    return t ?? "";
  let n = !1;
  const o = t.replace(/\{\{([^{}]*?)\}\}/g, (r, i, a) => {
    const c = Kt(String(i).replace(/<[^>]*>/g, "")).trim();
    if (!c || /\n/.test(c))
      return r;
    const g = e(c);
    if (g === void 0)
      return r;
    const m = mr(t, a);
    return m === "attribute" ? r : (m === "href" && (n = !0), En(g));
  });
  return n ? wr(o) : o;
}
function mr(t, e) {
  const n = t.lastIndexOf("<", e);
  if (n < 0 || n < t.lastIndexOf(">", e))
    return "text";
  const o = t.slice(n, e);
  return /\shref\s*=\s*("[^"]*|'[^']*|[^\s"'>]*)$/i.test(o) ? "href" : "attribute";
}
const yr = /(\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
function wr(t) {
  return t.replace(
    /<a\b[^>]*>/gi,
    (e) => e.replace(yr, (n, o, r, i, a) => {
      const c = kn(Kt(r ?? i ?? a ?? ""));
      return c ? `${o}href="${En(c)}"` : "";
    })
  );
}
function En(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ea(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function br(t) {
  return t.type === "w-text" && typeof t.text == "string";
}
function vr(t) {
  const e = [], n = /* @__PURE__ */ new Set();
  for (const o of t)
    if (br(o))
      for (const r of gr(o.text)) {
        const i = oe(r);
        n.has(i) || (n.add(i), e.push(r));
      }
  return e;
}
function na(t) {
  return vr(t.flatMap((e) => e.layers));
}
function Dt(...t) {
  const e = [];
  for (const n of t)
    if (n)
      if (typeof n == "string")
        e.push(n);
      else
        for (const o in n)
          n[o] && e.push(o);
  return e.join(" ");
}
function ra(t, e, n) {
  const o = t.style.transform, r = o.indexOf(e);
  if (r !== -1) {
    const i = r + e.length, a = o.slice(0, i + 1), c = o.substring(i + 1), g = c.substring(c.indexOf(")"));
    t.style.transform = a + n + g;
  } else
    t.style.transform = o + ` ${e}(${n})`;
}
function xr(t) {
  return new DOMParser().parseFromString(`<body>${t}`, "text/html").body;
}
var oa = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function _r(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
function ia(t) {
  if (t.__esModule)
    return t;
  var e = t.default;
  if (typeof e == "function") {
    var n = function o() {
      return this instanceof o ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    n.prototype = e.prototype;
  } else
    n = {};
  return Object.defineProperty(n, "__esModule", { value: !0 }), Object.keys(t).forEach(function(o) {
    var r = Object.getOwnPropertyDescriptor(t, o);
    Object.defineProperty(n, o, r.get ? r : {
      enumerable: !0,
      get: function() {
        return t[o];
      }
    });
  }), n;
}
function Xt(t) {
  if (typeof t != "string")
    return null;
  const e = t.replace(/[\t\n\r\f]/g, "").trim();
  return e ? `url("${e.replace(/["\\]/g, (o) => `\\${o}`).replace(/[\u0000-\u001f\u007f]/g, (o) => `\\${o.charCodeAt(0).toString(16)} `)}")` : null;
}
const Sr = "Inter", sa = {
  name: "Text",
  type: "w-text",
  uuid: -1,
  editable: !1,
  left: 0,
  top: 0,
  transform: "",
  lineHeight: 1.5,
  letterSpacing: 0,
  fontSize: 24,
  zoom: 1,
  fontClass: {
    alias: "Inter",
    id: 1,
    value: "Inter",
    url: "/fonts/inter-400-700.woff2"
  },
  fontFamily: "Inter",
  fontWeight: "normal",
  fontStyle: "normal",
  writingMode: "horizontal-tb",
  textDecoration: "none",
  color: "#000000ff",
  textAlign: "left",
  listStyle: "none",
  text: "",
  curve: 0,
  opacity: 1,
  backgroundColor: "",
  parent: "-1",
  record: {
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    dir: "horizontal"
  }
}, Tn = (t, e, n) => {
  let o = Math.round(t).toString(16), r = Math.round(e).toString(16), i = Math.round(n).toString(16);
  return o.length === 1 && (o = "0" + o), r.length === 1 && (r = "0" + r), i.length === 1 && (i = "0" + i), "#" + o + r + i;
}, kr = (t, e, n, o = 1) => {
  const r = Tn(t, e, n);
  let i = Math.round(o * 255).toString(16);
  return i.length === 1 && (i = "0" + i), r + i;
}, Mr = (t, e, n) => {
  t /= 255, e /= 255, n /= 255;
  const o = Math.min(t, e, n), r = Math.max(t, e, n), i = r - o;
  let a = 0, c = 0;
  const g = r;
  if (i === 0)
    a = c = 0;
  else {
    c = i / r;
    const m = ((r - t) / 6 + i / 2) / i, x = ((r - e) / 6 + i / 2) / i, M = ((r - n) / 6 + i / 2) / i;
    t === r ? a = M - x : e === r ? a = 1 / 3 + m - M : n === r && (a = 2 / 3 + x - m), a < 0 ? a += 1 : a > 1 && (a -= 1);
  }
  return [a * 360, c * 100, g * 100];
}, Ar = (t, e, n, o = 1) => [...Mr(t, e, n), o];
function Nr(t, e, n) {
  t = t / 360 * 6, e /= 100, n /= 100;
  const o = Math.floor(t), r = t - o, i = n * (1 - e), a = n * (1 - r * e), c = n * (1 - (1 - r) * e), g = o % 6, m = [n, a, i, i, c, n][g], x = [c, n, n, a, i, i][g], M = [i, i, c, n, n, a][g];
  return [Math.round(m * 255), Math.round(x * 255), Math.round(M * 255)];
}
const Cr = (t, e, n) => {
  const [o, r, i] = Nr(t, e, n);
  return Tn(o, r, i);
}, aa = (t, e, n, o = 1) => `${Cr(t, e, n)}${o === 0 ? "00" : Math.round(o * 255).toString(16)}`, Er = (t) => {
  t = t.slice(0, 7);
  let e = 0, n = 0, o = 0;
  return t.length == 4 ? (e = +("0x" + t[1] + t[1]), n = +("0x" + t[2] + t[2]), o = +("0x" + t[3] + t[3])) : t.length == 7 && (e = +("0x" + t[1] + t[2]), n = +("0x" + t[3] + t[4]), o = +("0x" + t[5] + t[6])), [e, n, o];
}, On = (t) => {
  const e = Er(t), n = +("0x" + t[7] + t[8]);
  return [...e, Number((n / 255).toFixed(2))];
}, ca = (t) => {
  const [e, n, o, r] = On(t);
  return Ar(e, n, o, r);
}, Tr = "circle at 50% 50%", Oe = (t) => /^(linear|radial)-gradient\(/.test((t == null ? void 0 : t.trim()) || "");
function Or(t, e, n) {
  const o = n.map((i) => `${i.color} ${i.offset * 100}%`).join(",");
  if (t === "radial")
    return `radial-gradient(${Tr}, ${o})`;
  const r = Number(e);
  return `linear-gradient(${Number.isFinite(r) ? r : 180}deg, ${o})`;
}
function Ir(t) {
  const e = [];
  let n = 0, o = 0;
  for (let r = 0; r < t.length; r += 1) {
    const i = t[r];
    i === "(" ? n += 1 : i === ")" ? n -= 1 : i === "," && n === 0 && (e.push(t.slice(o, r)), o = r + 1);
  }
  return e.push(t.slice(o)), e.map((r) => r.trim()).filter(Boolean);
}
function $r(t) {
  if (t.startsWith("#"))
    return t.length === 7 ? t + "ff" : t;
  const [e = 0, n = 0, o = 0, r = 1] = (t.match(/[\d.]+/g) || []).map(Number);
  return kr(e, n, o, r);
}
function Pr(t) {
  const e = /^(linear|radial)-gradient\((.*)\)\s*$/s.exec((t == null ? void 0 : t.trim()) || "");
  if (!e)
    return null;
  const n = e[1], o = Ir(e[2]);
  let r = 180;
  const i = o[0] || "";
  if (/^(-?[\d.]+deg|to\s|circle|ellipse|at\s|closest|farthest)/.test(i)) {
    o.shift();
    const c = /(-?[\d.]+)deg/.exec(i);
    c && (r = Number(c[1]));
  }
  const a = [];
  return o.forEach((c, g) => {
    const m = /\s(-?[\d.]+)%\s*$/.exec(c), x = m ? c.slice(0, m.index) : c, M = m ? Number(m[1]) / 100 : g / Math.max(1, o.length - 1);
    a.push({ color: $r(x.trim()), offset: M });
  }), a.length ? { type: n, angle: r, stops: a } : null;
}
const In = ["editable", "cropEdit"], Dr = new Set(In);
function Rr(t, e) {
  return Dr.has(t) && e ? void 0 : e;
}
function la(t) {
  return JSON.parse(JSON.stringify(t, Rr));
}
function Lr(t) {
  if (Array.isArray(t))
    for (const e of t) {
      const n = e == null ? void 0 : e.layers;
      if (Array.isArray(n)) {
        for (const o of n)
          if (!(!o || typeof o != "object"))
            for (const r of In)
              o[r] && delete o[r];
      }
    }
}
const Br = 50, be = 1, Fr = 3, We = (t) => typeof t == "number" && isFinite(t) ? Math.min(100, Math.max(0, t)) : Br, zr = (t) => typeof t == "number" && isFinite(t) ? Math.min(Fr, Math.max(be, t)) : be;
function qr(t) {
  const e = t.backgroundTransform || {};
  return {
    x: We(e.x),
    y: We(e.y),
    scale: zr(e.scale),
    ratio: e.ratio
  };
}
function Wr(t) {
  const { x: e, y: n, scale: o, ratio: r } = qr(t), i = o > be && !!r && !!t.backgroundImage, a = `${(o * 100).toFixed(3)}%`;
  return {
    backgroundColor: t.backgroundGradient ? void 0 : t.backgroundColor,
    backgroundImage: t.backgroundImage && Xt(t.backgroundImage) || t.backgroundGradient || void 0,
    // Landscape picture on a portrait page: its height is what fills, so the
    // height carries the zoom and the width follows the picture's shape.
    backgroundSize: i ? r > t.width / t.height ? `auto ${a}` : `${a} auto` : "cover",
    backgroundPosition: `${e}% ${n}%`,
    backgroundRepeat: "no-repeat"
  };
}
function Hr(t, e) {
  const n = [t.underline ? "underline" : "", t.strike ? "line-through" : ""].filter(Boolean).join(" ");
  return {
    fontWeight: t.bold ? "bold" : void 0,
    fontStyle: t.italic ? "italic" : void 0,
    // An underline is drawn under each character's own box, so along an arc it
    // is a run of short strokes rather than one curved line.
    textDecoration: n || void 0,
    color: e ? void 0 : t.color
  };
}
function Ur({ layout: t, className: e, style: n, plain: o }) {
  return /* @__PURE__ */ E(
    "div",
    {
      className: Dt("curved-text", e),
      style: {
        ...n,
        width: `${t.width}px`,
        height: `${t.height}px`,
        // The layout has already put the spacing into where each character
        // goes, so the widget's own letter spacing must not be applied again
        // inside each character's box, where it would push the glyph off centre.
        letterSpacing: "normal",
        // The arc is worked out in horizontal lines; a vertical writing mode
        // would turn every character a second time, on top of its own turn.
        writingMode: "horizontal-tb"
      },
      children: t.glyphs.map((r, i) => /* @__PURE__ */ E(
        "span",
        {
          className: "curved-text__glyph",
          style: {
            ...Hr(r, o),
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: `${r.width}px`,
            height: `${t.boxHeight}px`,
            lineHeight: `${t.boxHeight}px`,
            transform: `translate(-50%, -50%) rotate(${r.angle}deg)`
          },
          children: r.char
        },
        i
      ))
    }
  );
}
const He = It(Ur), jr = 0.5;
let Wt = null;
const ve = /* @__PURE__ */ new Map();
function Gr() {
  ve.clear();
}
var vn;
typeof document < "u" && ((vn = document.fonts) != null && vn.addEventListener) && document.fonts.addEventListener("loadingdone", Gr);
function Xr(t, e) {
  const n = `${e}\0${t}`, o = ve.get(n);
  if (o !== void 0)
    return o;
  if (Wt || (Wt = document.createElement("canvas").getContext("2d")), !Wt)
    return 0;
  Wt.font = e;
  const r = Wt.measureText(t).width;
  return ve.set(n, r), r;
}
function Yr(t) {
  const e = Number(t.curve) || 0;
  if (Math.abs(e) < jr)
    return null;
  const n = Ee(t.text);
  if (!n.some((U) => Gt(U).trim()))
    return null;
  const o = Number(t.fontSize) || 0;
  if (!o)
    return null;
  const r = o * (Number(t.lineHeight) || 1), i = o * (Number(t.letterSpacing) || 0) / 100, a = (U) => `${U.italic ? "italic" : t.fontStyle || "normal"} ${U.bold ? "bold" : t.fontWeight || "normal"} ${o}px ${t.fontFamily}`, c = e * Math.PI / 180, g = n.map((U) => {
    const Z = U.flatMap((lt) => {
      const ht = a(lt), { text: rt, href: tt, ...dt } = lt;
      return Array.from(rt).map((ot) => ({ char: ot, width: Xr(ot, ht), format: dt }));
    }), J = Z.reduce((lt, ht) => lt + ht.width + i, 0) - (Z.length ? i : 0);
    return { chars: Z, width: Math.max(J, 0) };
  }), m = g.find((U) => U.width > 0);
  if (!m)
    return null;
  const x = m.width / c, M = [];
  let $ = 1 / 0, W = 1 / 0, P = -1 / 0, F = -1 / 0;
  if (g.forEach((U, Z) => {
    if (!U.width)
      return;
    let J = x - Z * r;
    const lt = Math.max(r * 0.6, U.width / (2 * Math.PI));
    Math.abs(J) < lt && (J = Math.sign(x) * lt);
    const ht = U.width / J;
    let rt = 0;
    for (const { char: tt, width: dt, format: ot } of U.chars) {
      const ct = ((rt + dt / 2) / U.width - 0.5) * ht;
      if (rt += dt + i, !tt.trim())
        continue;
      const pt = Math.cos(ct), Nt = Math.sin(ct), Ot = J * Nt, O = -J * pt;
      M.push({ char: tt, x: Ot, y: O, angle: ct * 180 / Math.PI, width: dt, ...ot });
      for (const T of [-dt / 2, dt / 2])
        for (const N of [-r / 2, r / 2]) {
          const A = Ot + T * pt - N * Nt, _ = O + T * Nt + N * pt;
          $ = Math.min($, A), P = Math.max(P, A), W = Math.min(W, _), F = Math.max(F, _);
        }
    }
  }), !M.length)
    return null;
  for (const U of M)
    U.x -= $, U.y -= W;
  return { width: P - $, height: F - W, flatWidth: Math.max(...g.map((U) => U.width)), boxHeight: r, glyphs: M };
}
function Vr(t) {
  const [e, n] = St(0);
  return bt(() => {
    var i, a;
    if (!document.fonts)
      return;
    let o = !0;
    const r = () => o && n((c) => c + 1);
    return document.fonts.ready.then(r), (a = (i = document.fonts).addEventListener) == null || a.call(i, "loadingdone", r), () => {
      var c, g;
      o = !1, (g = (c = document.fonts).removeEventListener) == null || g.call(c, "loadingdone", r);
    };
  }, [t]), e;
}
const Kr = /\{(\d+)\}/g;
function Qr({ size: t, markup: e, colors: n }) {
  const o = e.replace(Kr, (i, a) => n[Number(a)] ?? i), r = `<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${t}" viewBox="0 0 ${t} ${t}">${o}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(r)}`;
}
const Zr = (t) => {
  let e = "";
  switch (Number(t.filling.type)) {
    case 2:
      {
        const { angle: n, stops: o, type: r } = t.filling.gradient;
        e = Or(r === "radial" ? "radial" : "linear", n, o);
      }
      break;
    case 1:
      {
        const { pattern: n, image: o } = t.filling.imageContent || {};
        e = Xt(n ? Qr(n) : o) ?? "none";
      }
      break;
    default:
      e = t.filling.color;
      break;
  }
  return e;
};
function Ue(t, e = 1) {
  const { filling: n, stroke: o, shadow: r, offset: i, skew: a } = t, c = !!(n != null && n.enable) && Number(n == null ? void 0 : n.type) === 0, g = !!(n != null && n.enable) && !c, m = [i != null && i.enable ? `translate(${i.x * e}px, ${i.y * e}px)` : "", a != null && a.enable ? `skew(${a.x}deg, ${a.y}deg)` : ""].filter(Boolean).join(" ");
  return {
    color: c ? n == null ? void 0 : n.color : "transparent",
    WebkitTextStroke: o != null && o.enable ? `${o.width * e}px ${o.color}` : void 0,
    textShadow: r != null && r.enable ? `${r.offsetX * e}px ${r.offsetY * e}px ${r.blur * e}px ${r.color}` : void 0,
    backgroundImage: g ? Zr(t) : void 0,
    WebkitBackgroundClip: g ? "text" : void 0,
    transform: m || void 0,
    // Leaning a layer about its own middle slides it sideways as well as
    // tilting it; a cast shadow has to stay joined to the text it falls from,
    // so the skew pivots on the bottom of the box instead.
    transformOrigin: a != null && a.enable ? "center bottom" : void 0
  };
}
function je(t, e, n, o) {
  var r, i = !1, a = 0;
  function c() {
    r && clearTimeout(r);
  }
  function g() {
    c(), i = !0;
  }
  typeof e != "boolean" && (o = n, n = e, e = void 0);
  function m() {
    for (var x = arguments.length, M = new Array(x), $ = 0; $ < x; $++)
      M[$] = arguments[$];
    var W = this, P = Date.now() - a;
    if (i)
      return;
    function F() {
      a = Date.now(), n.apply(W, M);
    }
    function U() {
      r = void 0;
    }
    o && !r && F(), c(), o === void 0 && P > t ? F() : e !== !0 && (r = setTimeout(o ? U : F, o === void 0 ? t - P : t));
  }
  return m.cancel = g, m;
}
function Jr(t, e, n) {
  return n === void 0 ? je(t, e, !1) : je(t, n, e !== !1);
}
const jt = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0
}, ua = [
  { key: "brightness", label: "Brightness", min: 0, max: 200 },
  { key: "contrast", label: "Contrast", min: 0, max: 200 },
  { key: "saturation", label: "Saturation", min: 0, max: 200 },
  { key: "warmth", label: "Warmth", min: -100, max: 100 },
  { key: "blur", label: "Blur", min: 0, max: 20 },
  { key: "grayscale", label: "Black and white", min: 0, max: 100 },
  { key: "sepia", label: "Sepia", min: 0, max: 100 }
], to = [
  { name: "Original", filters: null },
  { name: "Warm", filters: { warmth: 45, saturation: 110 } },
  { name: "Cool", filters: { warmth: -45, saturation: 105 } },
  { name: "Black and white", filters: { grayscale: 100, contrast: 110 } },
  { name: "Vivid", filters: { saturation: 145, contrast: 112 } },
  { name: "Faded", filters: { contrast: 78, brightness: 108, saturation: 80 } }
];
function eo(t, e) {
  const n = Number(t);
  return Number.isFinite(n) ? n : e;
}
function $n(t) {
  const e = { ...jt };
  if (!t || typeof t != "object")
    return e;
  for (const n of Object.keys(jt))
    e[n] = eo(t[n], jt[n]);
  return e;
}
function xe(t) {
  const e = $n(t), n = {};
  for (const o of Object.keys(jt))
    e[o] !== jt[o] && (n[o] = e[o]);
  return Object.keys(n).length ? n : null;
}
function fa(t) {
  return xe(t) === null;
}
function da(t) {
  const e = xe(t);
  for (const n of to) {
    const o = xe(n.filters);
    if (JSON.stringify(o) === JSON.stringify(e))
      return n;
  }
  return null;
}
const Ft = (t) => Math.round(t * 1e3) / 1e3;
function Ge(t) {
  const e = $n(t), n = [];
  return e.brightness !== 100 && n.push(`brightness(${Ft(Math.max(0, e.brightness) / 100)})`), e.contrast !== 100 && n.push(`contrast(${Ft(Math.max(0, e.contrast) / 100)})`), e.saturation !== 100 && n.push(`saturate(${Ft(Math.max(0, e.saturation) / 100)})`), e.warmth > 0 && n.push(`sepia(${Ft(Math.min(e.warmth, 100) / 200)})`), e.warmth < 0 && n.push(`hue-rotate(180deg) sepia(${Ft(Math.min(-e.warmth, 100) / 200)}) hue-rotate(180deg)`), e.grayscale > 0 && n.push(`grayscale(${Ft(Math.min(e.grayscale, 100) / 100)})`), e.sepia > 0 && n.push(`sepia(${Ft(Math.min(e.sepia, 100) / 100)})`), e.blur > 0 && n.push(`blur(${Ft(e.blur)}px)`), n.length ? n.join(" ") : void 0;
}
const ha = () => ({
  enable: !0,
  color: "#00000059",
  offsetX: 0,
  offsetY: 8,
  blur: 16
});
function Qt(t) {
  if (!(t != null && t.enable))
    return;
  const e = Number(t.offsetX) || 0, n = Number(t.offsetY) || 0, o = Math.max(0, Number(t.blur) || 0);
  return `drop-shadow(${e}px ${n}px ${o}px ${t.color || "#00000059"})`;
}
const no = ["solid", "dashed", "dotted"];
function Zt(t) {
  const e = Number(t == null ? void 0 : t.borderWidth) || 0;
  if (e <= 0)
    return null;
  const n = String((t == null ? void 0 : t.borderStyle) || "solid");
  return {
    width: e,
    // The panel writes a colour alongside every thickness, so a width with no
    // colour can only have come from hand-edited or imported data.
    color: (t == null ? void 0 : t.borderColor) || "#000000ff",
    style: no.includes(n) ? n : "solid"
  };
}
function Pn(t) {
  return t.style === "dashed" ? `${t.width * 3} ${t.width * 2}` : t.style === "dotted" ? `0 ${t.width * 2}` : null;
}
let de = null;
function _e() {
  return de === null && (de = typeof CSS < "u" && typeof CSS.supports == "function" && (CSS.supports("mask-composite", "exclude") || CSS.supports("-webkit-mask-composite", "xor"))), de;
}
function Dn(t, e, n) {
  const o = "linear-gradient(#000 0 0), linear-gradient(#000 0 0)";
  return {
    background: e,
    borderRadius: n,
    padding: `${t}px`,
    boxSizing: "border-box",
    WebkitMaskImage: o,
    WebkitMaskClip: "content-box, border-box",
    WebkitMaskComposite: "xor",
    maskImage: o,
    maskClip: "content-box, border-box",
    maskComposite: "exclude"
  };
}
function ro(t, e, n) {
  const o = `calc(100% - ${e * 2}px)`, r = Xt(t) ?? "none", i = `${r}, ${r}`;
  return {
    background: n,
    WebkitMaskImage: i,
    WebkitMaskSize: `100% 100%, ${o} ${o}`,
    WebkitMaskPosition: "center, center",
    WebkitMaskRepeat: "no-repeat, no-repeat",
    WebkitMaskComposite: "xor",
    maskImage: i,
    maskSize: `100% 100%, ${o} ${o}`,
    maskPosition: "center, center",
    maskRepeat: "no-repeat, no-repeat",
    maskComposite: "exclude"
  };
}
function oo({ params: t }) {
  const e = Zt(t);
  if (!e)
    return null;
  const n = t.mask;
  if (n)
    return _e() ? /* @__PURE__ */ E("div", { className: "img__keyline", style: ro(n, e.width, e.color) }) : null;
  const o = (Number(t.radius) || 0) + "px";
  return Oe(e.color) ? _e() ? /* @__PURE__ */ E("div", { className: "img__keyline", style: Dn(e.width, e.color, o) }) : null : /* @__PURE__ */ E(
    "div",
    {
      className: "img__keyline",
      style: {
        border: `${e.width}px ${e.style} ${e.color}`,
        borderRadius: o
      }
    }
  );
}
const Se = "http://www.w3.org/2000/svg";
function Rn(t) {
  var n;
  const e = (n = t.viewBox) == null ? void 0 : n.baseVal;
  return e && (e.width || e.height) ? { x: e.x, y: e.y, width: e.width, height: e.height } : { x: 0, y: 0, width: Number(t.getAttribute("width")) || 100, height: Number(t.getAttribute("height")) || 100 };
}
function io(t) {
  const e = t.querySelector(":scope > defs");
  if (e)
    return e;
  const n = document.createElementNS(Se, "defs");
  return t.insertBefore(n, t.firstChild), n;
}
function Ln(t, e) {
  if (!t || !Oe(t))
    return null;
  const n = Pr(t);
  if (!n)
    return null;
  const { x: o, y: r, width: i, height: a } = e, c = o + i / 2, g = r + a / 2;
  let m, x;
  if (n.type === "radial")
    m = "radialGradient", x = { cx: c, cy: g, r: Math.hypot(i, a) / 2 };
  else {
    const $ = n.angle * Math.PI / 180, W = Math.sin($), P = -Math.cos($), F = Math.abs(i * W) + Math.abs(a * P);
    m = "linearGradient", x = {
      x1: c - W * F / 2,
      y1: g - P * F / 2,
      x2: c + W * F / 2,
      y2: g + P * F / 2
    };
  }
  const M = n.stops.map(($) => {
    const [W, P, F, U] = On($.color);
    return { offset: `${$.offset * 100}%`, color: `rgb(${W},${P},${F})`, opacity: Number.isFinite(U) ? U : 1 };
  });
  return { element: m, coords: x, stops: M };
}
function so(t, e, n, o) {
  var i;
  (i = t.querySelector(`#${CSS.escape(e)}`)) == null || i.remove();
  const r = Bn(e, n, o);
  return r ? (io(t).appendChild(r), `url(#${e})`) : n;
}
function Bn(t, e, n) {
  const o = Ln(e, n);
  if (!o)
    return null;
  const r = document.createElementNS(Se, o.element);
  for (const [i, a] of Object.entries(o.coords))
    r.setAttribute(i, String(a));
  r.setAttribute("id", t), r.setAttribute("gradientUnits", "userSpaceOnUse");
  for (const i of o.stops) {
    const a = document.createElementNS(Se, "stop");
    a.setAttribute("offset", i.offset), a.setAttribute("stop-color", i.color), a.setAttribute("stop-opacity", String(i.opacity)), r.appendChild(a);
  }
  return r;
}
const ao = /^\{\{colors\[(\d+)\]\}\}$/;
function co(t) {
  const e = [], n = (o) => {
    for (const r of Array.from(o.attributes)) {
      const i = ao.exec(r.value);
      i && e.push({ element: o, attribute: r.name, index: Number(i[1]) });
    }
    Array.from(o.children).forEach(n);
  };
  return n(t), { svg: t, viewBox: Rn(t), colorAttributes: e };
}
function lo(t, e, n) {
  t.colorAttributes.forEach(({ element: o, attribute: r, index: i }) => {
    const a = n[i];
    a != null && o.setAttribute(r, so(t.svg, `g-${e}-fill-${i}`, a, t.viewBox));
  });
}
const Xe = "http://www.w3.org/2000/svg", uo = "path, rect, circle, ellipse, polygon, polyline, line", fo = ["stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "vector-effect", "clip-path"];
let Ye = 0;
function ho(t) {
  for (let e = t; e; e = e.parentElement) {
    const n = e.getAttribute("stroke");
    if (n && n !== "none")
      return !0;
    if (e.tagName.toLowerCase() === "svg")
      break;
  }
  return !1;
}
function po(t, e) {
  for (const c of Array.from(t.querySelectorAll("[data-border-clip]")))
    c.remove();
  for (const c of Array.from(t.querySelectorAll("[data-border]"))) {
    c.removeAttribute("data-border");
    for (const g of fo)
      c.removeAttribute(g);
  }
  if (!e)
    return;
  const n = document.createElementNS(Xe, "defs");
  n.setAttribute("data-border-clip", "");
  const o = Pn(e), r = `shape-outline-paint-${++Ye}`, i = Bn(r, e.color, Rn(t)), a = i ? `url(#${r})` : e.color;
  for (const c of Array.from(t.querySelectorAll(uo))) {
    if (ho(c))
      continue;
    const g = `shape-outline-${++Ye}`, m = document.createElementNS(Xe, "clipPath");
    m.setAttribute("id", g);
    const x = c.cloneNode(!1);
    x.removeAttribute("id");
    const M = c.getAttribute("fill-rule");
    M && x.setAttribute("clip-rule", M), m.appendChild(x), n.appendChild(m), c.setAttribute("stroke", a), c.setAttribute("stroke-width", String(e.width * 2)), c.setAttribute("vector-effect", "non-scaling-stroke"), o && c.setAttribute("stroke-dasharray", o), e.style === "dotted" && c.setAttribute("stroke-linecap", "round"), c.setAttribute("clip-path", `url(#${g})`), c.setAttribute("data-border", "");
  }
  n.childNodes.length && (i && n.appendChild(i), t.insertBefore(n, t.firstChild));
}
function go({ params: t, radius: e }) {
  const n = Zt(t), o = !!n && Oe(n.color), r = o && _e(), i = {
    background: t.color || "transparent",
    borderRadius: e,
    filter: Qt(t.shadow)
  };
  return n && (i.borderWidth = `${n.width}px`, i.borderStyle = o ? "solid" : n.style, i.borderColor = o ? "transparent" : n.color, i.backgroundClip = "padding-box"), /* @__PURE__ */ E("div", { className: "shape__paint", style: i, children: r ? /* @__PURE__ */ E("div", { className: "shape__outline", style: { ...Dn(n.width, n.color, e), inset: `-${n.width}px` } }) : null });
}
const pa = [
  { key: "tl", label: "Top left", short: "TL", right: !1, bottom: !1 },
  { key: "tr", label: "Top right", short: "TR", right: !0, bottom: !1 },
  { key: "br", label: "Bottom right", short: "BR", right: !0, bottom: !0 },
  { key: "bl", label: "Bottom left", short: "BL", right: !1, bottom: !0 }
];
function mo(t, e) {
  return Math.max(0, Math.min(Number(t) || 0, Number(e) || 0) / 2);
}
function Ht(t, e) {
  return Math.min(Math.max(Number(t) || 0, 0), e);
}
function yo(t) {
  const e = mo(t == null ? void 0 : t.width, t == null ? void 0 : t.height), n = t == null ? void 0 : t.radii;
  if (Array.isArray(n) && n.length === 4)
    return [Ht(n[0], e), Ht(n[1], e), Ht(n[2], e), Ht(n[3], e)];
  const o = Ht(t == null ? void 0 : t.radius, e);
  return [o, o, o, o];
}
function ga(t) {
  const e = t == null ? void 0 : t.radii;
  return Array.isArray(e) && e.length === 4;
}
function wo(t) {
  return t.map((e) => `${e}px`).join(" ");
}
const bo = "50%";
function vo(t, e) {
  const n = e.stops.map((o, r) => /* @__PURE__ */ E("stop", { offset: o.offset, stopColor: o.color, stopOpacity: o.opacity }, r));
  return e.element === "radialGradient" ? /* @__PURE__ */ E("radialGradient", { id: t, gradientUnits: "userSpaceOnUse", ...e.coords, children: n }) : /* @__PURE__ */ E("linearGradient", { id: t, gradientUnits: "userSpaceOnUse", ...e.coords, children: n });
}
function Fn(t) {
  return `${tr().replace(/:/g, "")}-${t}`;
}
function ie(t, e, n) {
  const o = Fn(n), r = Ln(t, e);
  return r ? { paint: `url(#${o})`, defs: vo(o, r) } : { paint: t, defs: null };
}
const Ve = 3, xo = 100;
function _o(t) {
  const e = Math.round(Number(t == null ? void 0 : t.sides));
  return Number.isFinite(e) ? Math.min(Math.max(e, Ve), xo) : Ve;
}
function So(t) {
  const e = [];
  for (let n = 0; n < t; n += 1) {
    const o = -Math.PI / 2 + n * 2 * Math.PI / t;
    e.push({ x: Math.cos(o), y: Math.sin(o) });
  }
  return e;
}
function ko(t, e, n) {
  const o = So(n), r = o.map((x) => x.x), i = o.map((x) => x.y), a = Math.min(...r), c = Math.min(...i), g = Math.max(...r) - a, m = Math.max(...i) - c;
  return o.map((x) => ({
    x: (x.x - a) / g * t,
    y: (x.y - c) / m * e
  }));
}
function Ke(t) {
  return Math.round(t * 100) / 100;
}
function Mo(t, e, n) {
  return ko(t, e, n).map((r, i) => `${i ? "L" : "M"}${Ke(r.x)},${Ke(r.y)}`).join(" ") + " Z";
}
function Ao(t) {
  if (t.style === "dashed")
    return `${t.width * 3} ${t.width * 2}`;
  if (t.style === "dotted")
    return `0 ${t.width * 2}`;
}
function No({ params: t }) {
  const e = Math.max(1, Number(t.width) || 0), n = Math.max(1, Number(t.height) || 0), o = _o(t), r = Zt(t), i = Mo(e, n, o), a = { x: 0, y: 0, width: e, height: n }, c = ie(t.color || "transparent", a, "fill"), g = ie((r == null ? void 0 : r.color) || "transparent", a, "stroke"), m = Fn("clip");
  return /* @__PURE__ */ wt("svg", { className: "polygon__paint", width: "100%", height: "100%", viewBox: `0 0 ${e} ${n}`, preserveAspectRatio: "none", style: { filter: Qt(t.shadow) }, xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ wt("defs", { children: [
      c.defs,
      r ? g.defs : null,
      r ? /* @__PURE__ */ E("clipPath", { id: m, children: /* @__PURE__ */ E("path", { d: i }) }) : null
    ] }),
    /* @__PURE__ */ E("path", { d: i, fill: c.paint }),
    r ? /* @__PURE__ */ E("path", { d: i, fill: "none", stroke: g.paint, strokeWidth: r.width * 2, strokeDasharray: Ao(r), strokeLinecap: r.style === "dotted" ? "round" : void 0, clipPath: `url(#${m})` }) : null
  ] });
}
const Co = "#d8d8d8ff", Qe = 200, ke = 4;
function ma(t, e) {
  return {
    name: t,
    type: e,
    uuid: "-1",
    left: 0,
    top: 0,
    width: Qe,
    height: Qe,
    color: Co,
    opacity: 1,
    borderWidth: 0,
    borderColor: "#000000ff",
    borderStyle: "solid",
    transform: "",
    parent: "-1",
    record: {
      width: 0,
      height: 0,
      minWidth: ke,
      minHeight: ke,
      dir: "all"
    }
  };
}
const he = ke;
function Ze(t) {
  if (!t || typeof t != "object")
    return;
  const e = Number(t.x), n = Number(t.y);
  if (!(!Number.isFinite(e) || !Number.isFinite(n)) && !(e === 0 && n === 0))
    return { x: e, y: n };
}
function Eo(t) {
  const e = t == null ? void 0 : t.points;
  if (!Array.isArray(e))
    return [];
  const n = [];
  for (const o of e) {
    const r = Number(o == null ? void 0 : o.x), i = Number(o == null ? void 0 : o.y);
    if (!Number.isFinite(r) || !Number.isFinite(i))
      continue;
    const a = { x: r, y: i }, c = Ze(o.in), g = Ze(o.out);
    c && (a.in = c), g && (a.out = g), n.push(a);
  }
  return n;
}
function To(t) {
  return !!(t != null && t.closed);
}
function ya(t) {
  return t.map((e) => {
    const n = { x: e.x, y: e.y };
    return e.in && (n.in = { ...e.in }), e.out && (n.out = { ...e.out }), n;
  });
}
function zn(t, e, n = 0, o = 0) {
  const r = Math.min(n / 2 + o, t / 2, e / 2);
  return { x: r, y: r, width: Math.max(t - r * 2, 0), height: Math.max(e - r * 2, 0) };
}
function Oo(t, e = 0, n = 0) {
  const o = zn(t.width, t.height, e, n);
  return { left: t.left + o.x, top: t.top + o.y, width: o.width, height: o.height };
}
function pe(t, e) {
  return { x: e.x + t.x * e.width, y: e.y + t.y * e.height };
}
function Je(t, e) {
  return t ? { x: t.x * e.width, y: t.y * e.height } : null;
}
function qn(t, e) {
  const n = [];
  for (let o = 0; o < t.length - 1; o++)
    n.push([t[o], t[o + 1]]);
  return e && t.length > 2 && n.push([t[t.length - 1], t[0]]), n;
}
function tn(t, e, n) {
  if (t.length < 2)
    return "";
  const o = pe(t[0], n);
  let r = `M ${Pt(o.x)} ${Pt(o.y)}`;
  for (const [i, a] of qn(t, e)) {
    const c = pe(i, n), g = pe(a, n), m = Je(i.out, n), x = Je(a.in, n);
    if (!m && !x) {
      r += ` L ${Pt(g.x)} ${Pt(g.y)}`;
      continue;
    }
    const M = { x: c.x + ((m == null ? void 0 : m.x) ?? 0), y: c.y + ((m == null ? void 0 : m.y) ?? 0) }, $ = { x: g.x + ((x == null ? void 0 : x.x) ?? 0), y: g.y + ((x == null ? void 0 : x.y) ?? 0) };
    r += ` C ${Pt(M.x)} ${Pt(M.y)}, ${Pt($.x)} ${Pt($.y)}, ${Pt(g.x)} ${Pt(g.y)}`;
  }
  return e && t.length > 2 && (r += " Z"), r;
}
function Pt(t) {
  return Math.round(t * 100) / 100;
}
function en(t, e, n, o) {
  const r = -t + 3 * e - 3 * n + o, i = 2 * (t - 2 * e + n), a = e - t, c = [];
  if (Math.abs(r) < 1e-9)
    Math.abs(i) > 1e-9 && c.push(-a / i);
  else {
    const g = i * i - 4 * r * a;
    if (g >= 0) {
      const m = Math.sqrt(g);
      c.push((-i + m) / (2 * r), (-i - m) / (2 * r));
    }
  }
  return c.filter((g) => g > 0 && g < 1);
}
function nn(t, e, n, o, r) {
  const i = 1 - r;
  return i * i * i * t + 3 * i * i * r * e + 3 * i * r * r * n + r * r * r * o;
}
function Io(t, e) {
  var r, i, a, c;
  const n = [], o = [];
  for (const g of t)
    n.push(g.x), o.push(g.y);
  for (const [g, m] of qn(t, e)) {
    if (!g.out && !m.in)
      continue;
    const x = { x: g.x + (((r = g.out) == null ? void 0 : r.x) ?? 0), y: g.y + (((i = g.out) == null ? void 0 : i.y) ?? 0) }, M = { x: m.x + (((a = m.in) == null ? void 0 : a.x) ?? 0), y: m.y + (((c = m.in) == null ? void 0 : c.y) ?? 0) };
    for (const $ of en(g.x, x.x, M.x, m.x))
      n.push(nn(g.x, x.x, M.x, m.x, $));
    for (const $ of en(g.y, x.y, M.y, m.y))
      o.push(nn(g.y, x.y, M.y, m.y, $));
  }
  return { minX: Math.min(...n), minY: Math.min(...o), maxX: Math.max(...n), maxY: Math.max(...o) };
}
function Wn(t, e) {
  return t.map((n) => {
    const o = { x: e.left + n.x * e.width, y: e.top + n.y * e.height };
    return n.in && (o.in = { x: n.in.x * e.width, y: n.in.y * e.height }), n.out && (o.out = { x: n.out.x * e.width, y: n.out.y * e.height }), o;
  });
}
function $o(t, e, n = 0) {
  const o = Io(t, e), [r, i] = rn(o.minX, o.maxX), [a, c] = rn(o.minY, o.maxY), g = t.map((m) => {
    const x = { x: (m.x - r) / i, y: (m.y - a) / c };
    return m.in && (x.in = { x: m.in.x / i, y: m.in.y / c }), m.out && (x.out = { x: m.out.x / i, y: m.out.y / c }), x;
  });
  return { box: { left: r - n, top: a - n, width: i + n * 2, height: c + n * 2 }, points: g };
}
function rn(t, e) {
  const n = Math.round(t), o = Math.round(e) - n;
  return o >= he ? [n, o] : [Math.round((t + e) / 2 - he / 2), he];
}
function wa(t, e, n, o = 0, r = 0) {
  const i = $o(Wn(t, Oo(n, o, r)), e, o / 2 + r);
  return i.box.left === n.left && i.box.top === n.top && i.box.width === n.width && i.box.height === n.height ? null : i;
}
function ba(t, e, n) {
  const o = t.length, r = e > 0 ? t[e - 1] : n ? t[o - 1] : null, i = e < o - 1 ? t[e + 1] : n ? t[0] : null, a = r ?? t[e], c = i ?? t[e], g = (c.x - a.x) / 3, m = (c.y - a.y) / 3;
  return g === 0 && m === 0 ? {} : { in: { x: -g, y: -m }, out: { x: g, y: m } };
}
const Po = [
  { value: "arrow", label: "Arrow" },
  { value: "triangle", label: "Triangle" },
  { value: "circle", label: "Circle" },
  { value: "bar", label: "Bar" }
], Do = new Set(Po.map((t) => t.value));
function on(t) {
  return typeof t == "string" && Do.has(t) ? t : null;
}
function Hn(t) {
  return !t || t.closed ? { start: null, end: null } : { start: on(t.lineStart), end: on(t.lineEnd) };
}
function Ro(t) {
  const e = Hn(t);
  return !!(e.start || e.end);
}
function Jt(t) {
  const e = Math.max(t * 4, 6);
  return { length: e, halfWidth: e / 2 };
}
function Lo(t) {
  if (!Ro(t))
    return 0;
  const e = Number(t == null ? void 0 : t.borderWidth) || 0;
  return Jt(e).halfWidth + e / 2;
}
function sn(t, e) {
  if (t.length < 2)
    return null;
  const n = e === "start" ? 0 : t.length - 1, o = e === "start" ? t[1] : t[t.length - 2], r = t[n], i = e === "start" ? r.out : r.in, a = i ? { x: r.x + i.x, y: r.y + i.y } : e === "start" ? o.in ? { x: o.x + o.in.x, y: o.y + o.in.y } : o : o.out ? { x: o.x + o.out.x, y: o.y + o.out.y } : o, c = r.x - a.x, g = r.y - a.y, m = Math.hypot(c, g);
  return m ? { x: c / m, y: g / m } : null;
}
function an(t, e) {
  const { length: n, halfWidth: o } = Jt(e);
  return t === "triangle" ? n : t === "circle" ? o : t === "bar" ? e / 2 : 0;
}
function Bo(t, e, n, o, r) {
  const i = Wn(t, { left: n.x, top: n.y, width: n.width, height: n.height }), a = { x: 0, y: 0, width: 1, height: 1 };
  if (e || i.length < 2 || !r.start && !r.end)
    return { d: tn(i, e, a), heads: [] };
  const c = [], g = i.map((U) => ({ ...U })), m = g[0], x = g[g.length - 1], M = r.start ? sn(i, "start") : null, $ = r.end ? sn(i, "end") : null, W = Math.hypot(x.x - m.x, x.y - m.y);
  let P = r.start && M ? an(r.start, o) : 0, F = r.end && $ ? an(r.end, o) : 0;
  if (i.length === 2 && P + F > W * 0.8) {
    const U = W * 0.8 / (P + F || 1);
    P *= U, F *= U;
  }
  return r.start && M && (c.push({ kind: r.start, x: m.x, y: m.y, angle: Math.atan2(M.y, M.x) }), m.x -= M.x * P, m.y -= M.y * P), r.end && $ && (c.push({ kind: r.end, x: x.x, y: x.y, angle: Math.atan2($.y, $.x) }), x.x -= $.x * F, x.y -= $.y * F), { d: tn(g, !1, a), heads: c };
}
function Rt(t) {
  return Math.round(t * 100) / 100;
}
function Fo(t, e) {
  const { length: n, halfWidth: o } = Jt(e), r = Math.cos(t.angle), i = Math.sin(t.angle), a = { x: t.x - r * n, y: t.y - i * n }, c = { x: a.x - i * o, y: a.y + r * o }, g = { x: a.x + i * o, y: a.y - r * o }, m = `M ${Rt(c.x)} ${Rt(c.y)} L ${Rt(t.x)} ${Rt(t.y)} L ${Rt(g.x)} ${Rt(g.y)}`;
  return t.kind === "triangle" ? `${m} Z` : m;
}
function zo(t, e) {
  const { halfWidth: n } = Jt(e), o = Math.cos(t.angle), r = Math.sin(t.angle);
  return {
    x1: Rt(t.x - r * n),
    y1: Rt(t.y + o * n),
    x2: Rt(t.x + r * n),
    y2: Rt(t.y - o * n)
  };
}
function qo({ params: t }) {
  const e = Math.max(Number(t.width) || 0, 0), n = Math.max(Number(t.height) || 0, 0), o = Zt(t), r = (o == null ? void 0 : o.width) || 0, i = zn(e, n, r, Lo(t)), { d: a, heads: c } = Bo(Eo(t), To(t), i, r, Hn(t)), g = { x: 0, y: 0, width: e, height: n }, m = ie(t.color || "transparent", g, "path-fill"), x = ie((o == null ? void 0 : o.color) || "transparent", g, "path-stroke");
  if (!a)
    return null;
  const M = o ? x.paint : "none";
  return /* @__PURE__ */ wt("svg", { className: "shape__paint path__paint", width: e, height: n, viewBox: `0 0 ${e} ${n}`, xmlns: "http://www.w3.org/2000/svg", style: { filter: Qt(t.shadow) }, "aria-hidden": "true", children: [
    m.defs || x.defs ? /* @__PURE__ */ wt("defs", { children: [
      m.defs,
      x.defs
    ] }) : null,
    /* @__PURE__ */ E("path", { d: a, fill: m.paint, stroke: M, strokeWidth: r, strokeDasharray: o && Pn(o) || void 0, strokeLinejoin: "round", strokeLinecap: "round" }),
    o ? c.map(($, W) => {
      const P = `${$.kind}-${W}`;
      return $.kind === "circle" ? /* @__PURE__ */ E("circle", { className: "path__end", "data-end": $.kind, cx: $.x, cy: $.y, r: Jt(r).halfWidth, fill: M }, P) : $.kind === "bar" ? /* @__PURE__ */ E("line", { className: "path__end", "data-end": $.kind, ...zo($, r), stroke: M, strokeWidth: r, strokeLinecap: "round" }, P) : /* @__PURE__ */ E(
        "path",
        {
          className: "path__end",
          "data-end": $.kind,
          d: Fo($, r),
          fill: $.kind === "triangle" ? M : "none",
          stroke: M,
          strokeWidth: r,
          strokeLinejoin: "round",
          strokeLinecap: "round"
        },
        P
      );
    }) : null
  ] });
}
var Un = { exports: {} };
(function(t, e) {
  (function(n, o) {
    t.exports = o();
  })(self, function() {
    return (() => {
      var n = { 192: (i, a) => {
        var c, g, m = function() {
          var x = function(O, T) {
            var N = O, A = U[T], _ = null, I = 0, z = null, L = [], H = {}, vt = function(d, p) {
              _ = function(f) {
                for (var b = new Array(f), v = 0; v < f; v += 1) {
                  b[v] = new Array(f);
                  for (var D = 0; D < f; D += 1)
                    b[v][D] = null;
                }
                return b;
              }(I = 4 * N + 17), S(0, 0), S(I - 7, 0), S(0, I - 7), u(), s(), h(d, p), N >= 7 && l(d), z == null && (z = y(N, A, L)), w(z, p);
            }, S = function(d, p) {
              for (var f = -1; f <= 7; f += 1)
                if (!(d + f <= -1 || I <= d + f))
                  for (var b = -1; b <= 7; b += 1)
                    p + b <= -1 || I <= p + b || (_[d + f][p + b] = 0 <= f && f <= 6 && (b == 0 || b == 6) || 0 <= b && b <= 6 && (f == 0 || f == 6) || 2 <= f && f <= 4 && 2 <= b && b <= 4);
            }, s = function() {
              for (var d = 8; d < I - 8; d += 1)
                _[d][6] == null && (_[d][6] = d % 2 == 0);
              for (var p = 8; p < I - 8; p += 1)
                _[6][p] == null && (_[6][p] = p % 2 == 0);
            }, u = function() {
              for (var d = Z.getPatternPosition(N), p = 0; p < d.length; p += 1)
                for (var f = 0; f < d.length; f += 1) {
                  var b = d[p], v = d[f];
                  if (_[b][v] == null)
                    for (var D = -2; D <= 2; D += 1)
                      for (var B = -2; B <= 2; B += 1)
                        _[b + D][v + B] = D == -2 || D == 2 || B == -2 || B == 2 || D == 0 && B == 0;
                }
            }, l = function(d) {
              for (var p = Z.getBCHTypeNumber(N), f = 0; f < 18; f += 1) {
                var b = !d && (p >> f & 1) == 1;
                _[Math.floor(f / 3)][f % 3 + I - 8 - 3] = b;
              }
              for (f = 0; f < 18; f += 1)
                b = !d && (p >> f & 1) == 1, _[f % 3 + I - 8 - 3][Math.floor(f / 3)] = b;
            }, h = function(d, p) {
              for (var f = A << 3 | p, b = Z.getBCHTypeInfo(f), v = 0; v < 15; v += 1) {
                var D = !d && (b >> v & 1) == 1;
                v < 6 ? _[v][8] = D : v < 8 ? _[v + 1][8] = D : _[I - 15 + v][8] = D;
              }
              for (v = 0; v < 15; v += 1)
                D = !d && (b >> v & 1) == 1, v < 8 ? _[8][I - v - 1] = D : v < 9 ? _[8][15 - v - 1 + 1] = D : _[8][15 - v - 1] = D;
              _[I - 8][8] = !d;
            }, w = function(d, p) {
              for (var f = -1, b = I - 1, v = 7, D = 0, B = Z.getMaskFunction(p), C = I - 1; C > 0; C -= 2)
                for (C == 6 && (C -= 1); ; ) {
                  for (var q = 0; q < 2; q += 1)
                    if (_[b][C - q] == null) {
                      var j = !1;
                      D < d.length && (j = (d[D] >>> v & 1) == 1), B(b, C - q) && (j = !j), _[b][C - q] = j, (v -= 1) == -1 && (D += 1, v = 7);
                    }
                  if ((b += f) < 0 || I <= b) {
                    b -= f, f = -f;
                    break;
                  }
                }
            }, y = function(d, p, f) {
              for (var b = ht.getRSBlocks(d, p), v = rt(), D = 0; D < f.length; D += 1) {
                var B = f[D];
                v.put(B.getMode(), 4), v.put(B.getLength(), Z.getLengthInBits(B.getMode(), d)), B.write(v);
              }
              var C = 0;
              for (D = 0; D < b.length; D += 1)
                C += b[D].dataCount;
              if (v.getLengthInBits() > 8 * C)
                throw "code length overflow. (" + v.getLengthInBits() + ">" + 8 * C + ")";
              for (v.getLengthInBits() + 4 <= 8 * C && v.put(0, 4); v.getLengthInBits() % 8 != 0; )
                v.putBit(!1);
              for (; !(v.getLengthInBits() >= 8 * C || (v.put(236, 8), v.getLengthInBits() >= 8 * C)); )
                v.put(17, 8);
              return function(q, j) {
                for (var Y = 0, st = 0, X = 0, K = new Array(j.length), V = new Array(j.length), Q = 0; Q < j.length; Q += 1) {
                  var Mt = j[Q].dataCount, ft = j[Q].totalCount - Mt;
                  st = Math.max(st, Mt), X = Math.max(X, ft), K[Q] = new Array(Mt);
                  for (var nt = 0; nt < K[Q].length; nt += 1)
                    K[Q][nt] = 255 & q.getBuffer()[nt + Y];
                  Y += Mt;
                  var mt = Z.getErrorCorrectPolynomial(ft), at = lt(K[Q], mt.getLength() - 1).mod(mt);
                  for (V[Q] = new Array(mt.getLength() - 1), nt = 0; nt < V[Q].length; nt += 1) {
                    var yt = nt + at.getLength() - V[Q].length;
                    V[Q][nt] = yt >= 0 ? at.getAt(yt) : 0;
                  }
                }
                var _t = 0;
                for (nt = 0; nt < j.length; nt += 1)
                  _t += j[nt].totalCount;
                var kt = new Array(_t), At = 0;
                for (nt = 0; nt < st; nt += 1)
                  for (Q = 0; Q < j.length; Q += 1)
                    nt < K[Q].length && (kt[At] = K[Q][nt], At += 1);
                for (nt = 0; nt < X; nt += 1)
                  for (Q = 0; Q < j.length; Q += 1)
                    nt < V[Q].length && (kt[At] = V[Q][nt], At += 1);
                return kt;
              }(v, b);
            };
            H.addData = function(d, p) {
              var f = null;
              switch (p = p || "Byte") {
                case "Numeric":
                  f = tt(d);
                  break;
                case "Alphanumeric":
                  f = dt(d);
                  break;
                case "Byte":
                  f = ot(d);
                  break;
                case "Kanji":
                  f = ct(d);
                  break;
                default:
                  throw "mode:" + p;
              }
              L.push(f), z = null;
            }, H.isDark = function(d, p) {
              if (d < 0 || I <= d || p < 0 || I <= p)
                throw d + "," + p;
              return _[d][p];
            }, H.getModuleCount = function() {
              return I;
            }, H.make = function() {
              if (N < 1) {
                for (var d = 1; d < 40; d++) {
                  for (var p = ht.getRSBlocks(d, A), f = rt(), b = 0; b < L.length; b++) {
                    var v = L[b];
                    f.put(v.getMode(), 4), f.put(v.getLength(), Z.getLengthInBits(v.getMode(), d)), v.write(f);
                  }
                  var D = 0;
                  for (b = 0; b < p.length; b++)
                    D += p[b].dataCount;
                  if (f.getLengthInBits() <= 8 * D)
                    break;
                }
                N = d;
              }
              vt(!1, function() {
                for (var B = 0, C = 0, q = 0; q < 8; q += 1) {
                  vt(!0, q);
                  var j = Z.getLostPoint(H);
                  (q == 0 || B > j) && (B = j, C = q);
                }
                return C;
              }());
            }, H.createTableTag = function(d, p) {
              d = d || 2;
              var f = "";
              f += '<table style="', f += " border-width: 0px; border-style: none;", f += " border-collapse: collapse;", f += " padding: 0px; margin: " + (p = p === void 0 ? 4 * d : p) + "px;", f += '">', f += "<tbody>";
              for (var b = 0; b < H.getModuleCount(); b += 1) {
                f += "<tr>";
                for (var v = 0; v < H.getModuleCount(); v += 1)
                  f += '<td style="', f += " border-width: 0px; border-style: none;", f += " border-collapse: collapse;", f += " padding: 0px; margin: 0px;", f += " width: " + d + "px;", f += " height: " + d + "px;", f += " background-color: ", f += H.isDark(b, v) ? "#000000" : "#ffffff", f += ";", f += '"/>';
                f += "</tr>";
              }
              return (f += "</tbody>") + "</table>";
            }, H.createSvgTag = function(d, p, f, b) {
              var v = {};
              typeof arguments[0] == "object" && (d = (v = arguments[0]).cellSize, p = v.margin, f = v.alt, b = v.title), d = d || 2, p = p === void 0 ? 4 * d : p, (f = typeof f == "string" ? { text: f } : f || {}).text = f.text || null, f.id = f.text ? f.id || "qrcode-description" : null, (b = typeof b == "string" ? { text: b } : b || {}).text = b.text || null, b.id = b.text ? b.id || "qrcode-title" : null;
              var D, B, C, q, j = H.getModuleCount() * d + 2 * p, Y = "";
              for (q = "l" + d + ",0 0," + d + " -" + d + ",0 0,-" + d + "z ", Y += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"', Y += v.scalable ? "" : ' width="' + j + 'px" height="' + j + 'px"', Y += ' viewBox="0 0 ' + j + " " + j + '" ', Y += ' preserveAspectRatio="xMinYMin meet"', Y += b.text || f.text ? ' role="img" aria-labelledby="' + k([b.id, f.id].join(" ").trim()) + '"' : "", Y += ">", Y += b.text ? '<title id="' + k(b.id) + '">' + k(b.text) + "</title>" : "", Y += f.text ? '<description id="' + k(f.id) + '">' + k(f.text) + "</description>" : "", Y += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>', Y += '<path d="', B = 0; B < H.getModuleCount(); B += 1)
                for (C = B * d + p, D = 0; D < H.getModuleCount(); D += 1)
                  H.isDark(B, D) && (Y += "M" + (D * d + p) + "," + C + q);
              return (Y += '" stroke="transparent" fill="black"/>') + "</svg>";
            }, H.createDataURL = function(d, p) {
              d = d || 2, p = p === void 0 ? 4 * d : p;
              var f = H.getModuleCount() * d + 2 * p, b = p, v = f - p;
              return Ot(f, f, function(D, B) {
                if (b <= D && D < v && b <= B && B < v) {
                  var C = Math.floor((D - b) / d), q = Math.floor((B - b) / d);
                  return H.isDark(q, C) ? 0 : 1;
                }
                return 1;
              });
            }, H.createImgTag = function(d, p, f) {
              d = d || 2, p = p === void 0 ? 4 * d : p;
              var b = H.getModuleCount() * d + 2 * p, v = "";
              return v += "<img", v += ' src="', v += H.createDataURL(d, p), v += '"', v += ' width="', v += b, v += '"', v += ' height="', v += b, v += '"', f && (v += ' alt="', v += k(f), v += '"'), v + "/>";
            };
            var k = function(d) {
              for (var p = "", f = 0; f < d.length; f += 1) {
                var b = d.charAt(f);
                switch (b) {
                  case "<":
                    p += "&lt;";
                    break;
                  case ">":
                    p += "&gt;";
                    break;
                  case "&":
                    p += "&amp;";
                    break;
                  case '"':
                    p += "&quot;";
                    break;
                  default:
                    p += b;
                }
              }
              return p;
            };
            return H.createASCII = function(d, p) {
              if ((d = d || 1) < 2)
                return function(K) {
                  K = K === void 0 ? 2 : K;
                  var V, Q, Mt, ft, nt, mt = 1 * H.getModuleCount() + 2 * K, at = K, yt = mt - K, _t = { "██": "█", "█ ": "▀", " █": "▄", "  ": " " }, kt = { "██": "▀", "█ ": "▀", " █": " ", "  ": " " }, At = "";
                  for (V = 0; V < mt; V += 2) {
                    for (Mt = Math.floor((V - at) / 1), ft = Math.floor((V + 1 - at) / 1), Q = 0; Q < mt; Q += 1)
                      nt = "█", at <= Q && Q < yt && at <= V && V < yt && H.isDark(Mt, Math.floor((Q - at) / 1)) && (nt = " "), at <= Q && Q < yt && at <= V + 1 && V + 1 < yt && H.isDark(ft, Math.floor((Q - at) / 1)) ? nt += " " : nt += "█", At += K < 1 && V + 1 >= yt ? kt[nt] : _t[nt];
                    At += `
`;
                  }
                  return mt % 2 && K > 0 ? At.substring(0, At.length - mt - 1) + Array(mt + 1).join("▀") : At.substring(0, At.length - 1);
                }(p);
              d -= 1, p = p === void 0 ? 2 * d : p;
              var f, b, v, D, B = H.getModuleCount() * d + 2 * p, C = p, q = B - p, j = Array(d + 1).join("██"), Y = Array(d + 1).join("  "), st = "", X = "";
              for (f = 0; f < B; f += 1) {
                for (v = Math.floor((f - C) / d), X = "", b = 0; b < B; b += 1)
                  D = 1, C <= b && b < q && C <= f && f < q && H.isDark(v, Math.floor((b - C) / d)) && (D = 0), X += D ? j : Y;
                for (v = 0; v < d; v += 1)
                  st += X + `
`;
              }
              return st.substring(0, st.length - 1);
            }, H.renderTo2dContext = function(d, p) {
              p = p || 2;
              for (var f = H.getModuleCount(), b = 0; b < f; b++)
                for (var v = 0; v < f; v++)
                  d.fillStyle = H.isDark(b, v) ? "black" : "white", d.fillRect(b * p, v * p, p, p);
            }, H;
          };
          x.stringToBytes = (x.stringToBytesFuncs = { default: function(O) {
            for (var T = [], N = 0; N < O.length; N += 1) {
              var A = O.charCodeAt(N);
              T.push(255 & A);
            }
            return T;
          } }).default, x.createStringToBytes = function(O, T) {
            var N = function() {
              for (var _ = Nt(O), I = function() {
                var s = _.read();
                if (s == -1)
                  throw "eof";
                return s;
              }, z = 0, L = {}; ; ) {
                var H = _.read();
                if (H == -1)
                  break;
                var vt = I(), S = I() << 8 | I();
                L[String.fromCharCode(H << 8 | vt)] = S, z += 1;
              }
              if (z != T)
                throw z + " != " + T;
              return L;
            }(), A = 63;
            return function(_) {
              for (var I = [], z = 0; z < _.length; z += 1) {
                var L = _.charCodeAt(z);
                if (L < 128)
                  I.push(L);
                else {
                  var H = N[_.charAt(z)];
                  typeof H == "number" ? (255 & H) == H ? I.push(H) : (I.push(H >>> 8), I.push(255 & H)) : I.push(A);
                }
              }
              return I;
            };
          };
          var M, $, W, P, F, U = { L: 1, M: 0, Q: 3, H: 2 }, Z = (M = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]], $ = 1335, W = 7973, F = function(O) {
            for (var T = 0; O != 0; )
              T += 1, O >>>= 1;
            return T;
          }, (P = {}).getBCHTypeInfo = function(O) {
            for (var T = O << 10; F(T) - F($) >= 0; )
              T ^= $ << F(T) - F($);
            return 21522 ^ (O << 10 | T);
          }, P.getBCHTypeNumber = function(O) {
            for (var T = O << 12; F(T) - F(W) >= 0; )
              T ^= W << F(T) - F(W);
            return O << 12 | T;
          }, P.getPatternPosition = function(O) {
            return M[O - 1];
          }, P.getMaskFunction = function(O) {
            switch (O) {
              case 0:
                return function(T, N) {
                  return (T + N) % 2 == 0;
                };
              case 1:
                return function(T, N) {
                  return T % 2 == 0;
                };
              case 2:
                return function(T, N) {
                  return N % 3 == 0;
                };
              case 3:
                return function(T, N) {
                  return (T + N) % 3 == 0;
                };
              case 4:
                return function(T, N) {
                  return (Math.floor(T / 2) + Math.floor(N / 3)) % 2 == 0;
                };
              case 5:
                return function(T, N) {
                  return T * N % 2 + T * N % 3 == 0;
                };
              case 6:
                return function(T, N) {
                  return (T * N % 2 + T * N % 3) % 2 == 0;
                };
              case 7:
                return function(T, N) {
                  return (T * N % 3 + (T + N) % 2) % 2 == 0;
                };
              default:
                throw "bad maskPattern:" + O;
            }
          }, P.getErrorCorrectPolynomial = function(O) {
            for (var T = lt([1], 0), N = 0; N < O; N += 1)
              T = T.multiply(lt([1, J.gexp(N)], 0));
            return T;
          }, P.getLengthInBits = function(O, T) {
            if (1 <= T && T < 10)
              switch (O) {
                case 1:
                  return 10;
                case 2:
                  return 9;
                case 4:
                case 8:
                  return 8;
                default:
                  throw "mode:" + O;
              }
            else if (T < 27)
              switch (O) {
                case 1:
                  return 12;
                case 2:
                  return 11;
                case 4:
                  return 16;
                case 8:
                  return 10;
                default:
                  throw "mode:" + O;
              }
            else {
              if (!(T < 41))
                throw "type:" + T;
              switch (O) {
                case 1:
                  return 14;
                case 2:
                  return 13;
                case 4:
                  return 16;
                case 8:
                  return 12;
                default:
                  throw "mode:" + O;
              }
            }
          }, P.getLostPoint = function(O) {
            for (var T = O.getModuleCount(), N = 0, A = 0; A < T; A += 1)
              for (var _ = 0; _ < T; _ += 1) {
                for (var I = 0, z = O.isDark(A, _), L = -1; L <= 1; L += 1)
                  if (!(A + L < 0 || T <= A + L))
                    for (var H = -1; H <= 1; H += 1)
                      _ + H < 0 || T <= _ + H || L == 0 && H == 0 || z == O.isDark(A + L, _ + H) && (I += 1);
                I > 5 && (N += 3 + I - 5);
              }
            for (A = 0; A < T - 1; A += 1)
              for (_ = 0; _ < T - 1; _ += 1) {
                var vt = 0;
                O.isDark(A, _) && (vt += 1), O.isDark(A + 1, _) && (vt += 1), O.isDark(A, _ + 1) && (vt += 1), O.isDark(A + 1, _ + 1) && (vt += 1), vt != 0 && vt != 4 || (N += 3);
              }
            for (A = 0; A < T; A += 1)
              for (_ = 0; _ < T - 6; _ += 1)
                O.isDark(A, _) && !O.isDark(A, _ + 1) && O.isDark(A, _ + 2) && O.isDark(A, _ + 3) && O.isDark(A, _ + 4) && !O.isDark(A, _ + 5) && O.isDark(A, _ + 6) && (N += 40);
            for (_ = 0; _ < T; _ += 1)
              for (A = 0; A < T - 6; A += 1)
                O.isDark(A, _) && !O.isDark(A + 1, _) && O.isDark(A + 2, _) && O.isDark(A + 3, _) && O.isDark(A + 4, _) && !O.isDark(A + 5, _) && O.isDark(A + 6, _) && (N += 40);
            var S = 0;
            for (_ = 0; _ < T; _ += 1)
              for (A = 0; A < T; A += 1)
                O.isDark(A, _) && (S += 1);
            return N + Math.abs(100 * S / T / T - 50) / 5 * 10;
          }, P), J = function() {
            for (var O = new Array(256), T = new Array(256), N = 0; N < 8; N += 1)
              O[N] = 1 << N;
            for (N = 8; N < 256; N += 1)
              O[N] = O[N - 4] ^ O[N - 5] ^ O[N - 6] ^ O[N - 8];
            for (N = 0; N < 255; N += 1)
              T[O[N]] = N;
            return { glog: function(A) {
              if (A < 1)
                throw "glog(" + A + ")";
              return T[A];
            }, gexp: function(A) {
              for (; A < 0; )
                A += 255;
              for (; A >= 256; )
                A -= 255;
              return O[A];
            } };
          }();
          function lt(O, T) {
            if (O.length === void 0)
              throw O.length + "/" + T;
            var N = function() {
              for (var _ = 0; _ < O.length && O[_] == 0; )
                _ += 1;
              for (var I = new Array(O.length - _ + T), z = 0; z < O.length - _; z += 1)
                I[z] = O[z + _];
              return I;
            }(), A = { getAt: function(_) {
              return N[_];
            }, getLength: function() {
              return N.length;
            }, multiply: function(_) {
              for (var I = new Array(A.getLength() + _.getLength() - 1), z = 0; z < A.getLength(); z += 1)
                for (var L = 0; L < _.getLength(); L += 1)
                  I[z + L] ^= J.gexp(J.glog(A.getAt(z)) + J.glog(_.getAt(L)));
              return lt(I, 0);
            }, mod: function(_) {
              if (A.getLength() - _.getLength() < 0)
                return A;
              for (var I = J.glog(A.getAt(0)) - J.glog(_.getAt(0)), z = new Array(A.getLength()), L = 0; L < A.getLength(); L += 1)
                z[L] = A.getAt(L);
              for (L = 0; L < _.getLength(); L += 1)
                z[L] ^= J.gexp(J.glog(_.getAt(L)) + I);
              return lt(z, 0).mod(_);
            } };
            return A;
          }
          var ht = /* @__PURE__ */ function() {
            var O = [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]], T = function(A, _) {
              var I = {};
              return I.totalCount = A, I.dataCount = _, I;
            }, N = { getRSBlocks: function(A, _) {
              var I = function(l, h) {
                switch (h) {
                  case U.L:
                    return O[4 * (l - 1) + 0];
                  case U.M:
                    return O[4 * (l - 1) + 1];
                  case U.Q:
                    return O[4 * (l - 1) + 2];
                  case U.H:
                    return O[4 * (l - 1) + 3];
                  default:
                    return;
                }
              }(A, _);
              if (I === void 0)
                throw "bad rs block @ typeNumber:" + A + "/errorCorrectionLevel:" + _;
              for (var z = I.length / 3, L = [], H = 0; H < z; H += 1)
                for (var vt = I[3 * H + 0], S = I[3 * H + 1], s = I[3 * H + 2], u = 0; u < vt; u += 1)
                  L.push(T(S, s));
              return L;
            } };
            return N;
          }(), rt = function() {
            var O = [], T = 0, N = { getBuffer: function() {
              return O;
            }, getAt: function(A) {
              var _ = Math.floor(A / 8);
              return (O[_] >>> 7 - A % 8 & 1) == 1;
            }, put: function(A, _) {
              for (var I = 0; I < _; I += 1)
                N.putBit((A >>> _ - I - 1 & 1) == 1);
            }, getLengthInBits: function() {
              return T;
            }, putBit: function(A) {
              var _ = Math.floor(T / 8);
              O.length <= _ && O.push(0), A && (O[_] |= 128 >>> T % 8), T += 1;
            } };
            return N;
          }, tt = function(O) {
            var T = O, N = { getMode: function() {
              return 1;
            }, getLength: function(I) {
              return T.length;
            }, write: function(I) {
              for (var z = T, L = 0; L + 2 < z.length; )
                I.put(A(z.substring(L, L + 3)), 10), L += 3;
              L < z.length && (z.length - L == 1 ? I.put(A(z.substring(L, L + 1)), 4) : z.length - L == 2 && I.put(A(z.substring(L, L + 2)), 7));
            } }, A = function(I) {
              for (var z = 0, L = 0; L < I.length; L += 1)
                z = 10 * z + _(I.charAt(L));
              return z;
            }, _ = function(I) {
              if ("0" <= I && I <= "9")
                return I.charCodeAt(0) - 48;
              throw "illegal char :" + I;
            };
            return N;
          }, dt = function(O) {
            var T = O, N = { getMode: function() {
              return 2;
            }, getLength: function(_) {
              return T.length;
            }, write: function(_) {
              for (var I = T, z = 0; z + 1 < I.length; )
                _.put(45 * A(I.charAt(z)) + A(I.charAt(z + 1)), 11), z += 2;
              z < I.length && _.put(A(I.charAt(z)), 6);
            } }, A = function(_) {
              if ("0" <= _ && _ <= "9")
                return _.charCodeAt(0) - 48;
              if ("A" <= _ && _ <= "Z")
                return _.charCodeAt(0) - 65 + 10;
              switch (_) {
                case " ":
                  return 36;
                case "$":
                  return 37;
                case "%":
                  return 38;
                case "*":
                  return 39;
                case "+":
                  return 40;
                case "-":
                  return 41;
                case ".":
                  return 42;
                case "/":
                  return 43;
                case ":":
                  return 44;
                default:
                  throw "illegal char :" + _;
              }
            };
            return N;
          }, ot = function(O) {
            var T = x.stringToBytes(O);
            return { getMode: function() {
              return 4;
            }, getLength: function(N) {
              return T.length;
            }, write: function(N) {
              for (var A = 0; A < T.length; A += 1)
                N.put(T[A], 8);
            } };
          }, ct = function(O) {
            var T = x.stringToBytesFuncs.SJIS;
            if (!T)
              throw "sjis not supported.";
            (function(A, _) {
              var I = T("友");
              if (I.length != 2 || (I[0] << 8 | I[1]) != 38726)
                throw "sjis not supported.";
            })();
            var N = T(O);
            return { getMode: function() {
              return 8;
            }, getLength: function(A) {
              return ~~(N.length / 2);
            }, write: function(A) {
              for (var _ = N, I = 0; I + 1 < _.length; ) {
                var z = (255 & _[I]) << 8 | 255 & _[I + 1];
                if (33088 <= z && z <= 40956)
                  z -= 33088;
                else {
                  if (!(57408 <= z && z <= 60351))
                    throw "illegal char at " + (I + 1) + "/" + z;
                  z -= 49472;
                }
                z = 192 * (z >>> 8 & 255) + (255 & z), A.put(z, 13), I += 2;
              }
              if (I < _.length)
                throw "illegal char at " + (I + 1);
            } };
          }, pt = function() {
            var O = [], T = { writeByte: function(N) {
              O.push(255 & N);
            }, writeShort: function(N) {
              T.writeByte(N), T.writeByte(N >>> 8);
            }, writeBytes: function(N, A, _) {
              A = A || 0, _ = _ || N.length;
              for (var I = 0; I < _; I += 1)
                T.writeByte(N[I + A]);
            }, writeString: function(N) {
              for (var A = 0; A < N.length; A += 1)
                T.writeByte(N.charCodeAt(A));
            }, toByteArray: function() {
              return O;
            }, toString: function() {
              var N = "";
              N += "[";
              for (var A = 0; A < O.length; A += 1)
                A > 0 && (N += ","), N += O[A];
              return N + "]";
            } };
            return T;
          }, Nt = function(O) {
            var T = O, N = 0, A = 0, _ = 0, I = { read: function() {
              for (; _ < 8; ) {
                if (N >= T.length) {
                  if (_ == 0)
                    return -1;
                  throw "unexpected end of file./" + _;
                }
                var L = T.charAt(N);
                if (N += 1, L == "=")
                  return _ = 0, -1;
                L.match(/^\s$/) || (A = A << 6 | z(L.charCodeAt(0)), _ += 6);
              }
              var H = A >>> _ - 8 & 255;
              return _ -= 8, H;
            } }, z = function(L) {
              if (65 <= L && L <= 90)
                return L - 65;
              if (97 <= L && L <= 122)
                return L - 97 + 26;
              if (48 <= L && L <= 57)
                return L - 48 + 52;
              if (L == 43)
                return 62;
              if (L == 47)
                return 63;
              throw "c:" + L;
            };
            return I;
          }, Ot = function(O, T, N) {
            for (var A = function(S, s) {
              var u = S, l = s, h = new Array(S * s), w = { setPixel: function(d, p, f) {
                h[p * u + d] = f;
              }, write: function(d) {
                d.writeString("GIF87a"), d.writeShort(u), d.writeShort(l), d.writeByte(128), d.writeByte(0), d.writeByte(0), d.writeByte(0), d.writeByte(0), d.writeByte(0), d.writeByte(255), d.writeByte(255), d.writeByte(255), d.writeString(","), d.writeShort(0), d.writeShort(0), d.writeShort(u), d.writeShort(l), d.writeByte(0);
                var p = y(2);
                d.writeByte(2);
                for (var f = 0; p.length - f > 255; )
                  d.writeByte(255), d.writeBytes(p, f, 255), f += 255;
                d.writeByte(p.length - f), d.writeBytes(p, f, p.length - f), d.writeByte(0), d.writeString(";");
              } }, y = function(d) {
                for (var p = 1 << d, f = 1 + (1 << d), b = d + 1, v = k(), D = 0; D < p; D += 1)
                  v.add(String.fromCharCode(D));
                v.add(String.fromCharCode(p)), v.add(String.fromCharCode(f));
                var B, C, q, j = pt(), Y = (B = j, C = 0, q = 0, { write: function(V, Q) {
                  if (V >>> Q)
                    throw "length over";
                  for (; C + Q >= 8; )
                    B.writeByte(255 & (V << C | q)), Q -= 8 - C, V >>>= 8 - C, q = 0, C = 0;
                  q |= V << C, C += Q;
                }, flush: function() {
                  C > 0 && B.writeByte(q);
                } });
                Y.write(p, b);
                var st = 0, X = String.fromCharCode(h[st]);
                for (st += 1; st < h.length; ) {
                  var K = String.fromCharCode(h[st]);
                  st += 1, v.contains(X + K) ? X += K : (Y.write(v.indexOf(X), b), v.size() < 4095 && (v.size() == 1 << b && (b += 1), v.add(X + K)), X = K);
                }
                return Y.write(v.indexOf(X), b), Y.write(f, b), Y.flush(), j.toByteArray();
              }, k = function() {
                var d = {}, p = 0, f = { add: function(b) {
                  if (f.contains(b))
                    throw "dup key:" + b;
                  d[b] = p, p += 1;
                }, size: function() {
                  return p;
                }, indexOf: function(b) {
                  return d[b];
                }, contains: function(b) {
                  return d[b] !== void 0;
                } };
                return f;
              };
              return w;
            }(O, T), _ = 0; _ < T; _ += 1)
              for (var I = 0; I < O; I += 1)
                A.setPixel(I, _, N(I, _));
            var z = pt();
            A.write(z);
            for (var L = function() {
              var S = 0, s = 0, u = 0, l = "", h = {}, w = function(k) {
                l += String.fromCharCode(y(63 & k));
              }, y = function(k) {
                if (!(k < 0)) {
                  if (k < 26)
                    return 65 + k;
                  if (k < 52)
                    return k - 26 + 97;
                  if (k < 62)
                    return k - 52 + 48;
                  if (k == 62)
                    return 43;
                  if (k == 63)
                    return 47;
                }
                throw "n:" + k;
              };
              return h.writeByte = function(k) {
                for (S = S << 8 | 255 & k, s += 8, u += 1; s >= 6; )
                  w(S >>> s - 6), s -= 6;
              }, h.flush = function() {
                if (s > 0 && (w(S << 6 - s), S = 0, s = 0), u % 3 != 0)
                  for (var k = 3 - u % 3, d = 0; d < k; d += 1)
                    l += "=";
              }, h.toString = function() {
                return l;
              }, h;
            }(), H = z.toByteArray(), vt = 0; vt < H.length; vt += 1)
              L.writeByte(H[vt]);
            return L.flush(), "data:image/gif;base64," + L;
          };
          return x;
        }();
        m.stringToBytesFuncs["UTF-8"] = function(x) {
          return function(M) {
            for (var $ = [], W = 0; W < M.length; W++) {
              var P = M.charCodeAt(W);
              P < 128 ? $.push(P) : P < 2048 ? $.push(192 | P >> 6, 128 | 63 & P) : P < 55296 || P >= 57344 ? $.push(224 | P >> 12, 128 | P >> 6 & 63, 128 | 63 & P) : (W++, P = 65536 + ((1023 & P) << 10 | 1023 & M.charCodeAt(W)), $.push(240 | P >> 18, 128 | P >> 12 & 63, 128 | P >> 6 & 63, 128 | 63 & P));
            }
            return $;
          }(x);
        }, (g = typeof (c = function() {
          return m;
        }) == "function" ? c.apply(a, []) : c) === void 0 || (i.exports = g);
      }, 676: (i, a, c) => {
        c.d(a, { default: () => vt });
        var g = function() {
          return (g = Object.assign || function(S) {
            for (var s, u = 1, l = arguments.length; u < l; u++)
              for (var h in s = arguments[u])
                Object.prototype.hasOwnProperty.call(s, h) && (S[h] = s[h]);
            return S;
          }).apply(this, arguments);
        }, m = function() {
          for (var S = 0, s = 0, u = arguments.length; s < u; s++)
            S += arguments[s].length;
          var l = Array(S), h = 0;
          for (s = 0; s < u; s++)
            for (var w = arguments[s], y = 0, k = w.length; y < k; y++, h++)
              l[h] = w[y];
          return l;
        }, x = function(S) {
          return !!S && typeof S == "object" && !Array.isArray(S);
        };
        function M(S) {
          for (var s = [], u = 1; u < arguments.length; u++)
            s[u - 1] = arguments[u];
          if (!s.length)
            return S;
          var l = s.shift();
          return l !== void 0 && x(S) && x(l) ? (S = g({}, S), Object.keys(l).forEach(function(h) {
            var w = S[h], y = l[h];
            Array.isArray(w) && Array.isArray(y) ? S[h] = y : x(w) && x(y) ? S[h] = M(Object.assign({}, w), y) : S[h] = y;
          }), M.apply(void 0, m([S], s))) : S;
        }
        function $(S, s) {
          var u = document.createElement("a");
          u.download = s, u.href = S, document.body.appendChild(u), u.click(), document.body.removeChild(u);
        }
        function W(S) {
          return s = this, u = void 0, h = function() {
            return function(w, y) {
              var k, d, p, f, b = { label: 0, sent: function() {
                if (1 & p[0])
                  throw p[1];
                return p[1];
              }, trys: [], ops: [] };
              return f = { next: v(0), throw: v(1), return: v(2) }, typeof Symbol == "function" && (f[Symbol.iterator] = function() {
                return this;
              }), f;
              function v(D) {
                return function(B) {
                  return function(C) {
                    if (k)
                      throw new TypeError("Generator is already executing.");
                    for (; b; )
                      try {
                        if (k = 1, d && (p = 2 & C[0] ? d.return : C[0] ? d.throw || ((p = d.return) && p.call(d), 0) : d.next) && !(p = p.call(d, C[1])).done)
                          return p;
                        switch (d = 0, p && (C = [2 & C[0], p.value]), C[0]) {
                          case 0:
                          case 1:
                            p = C;
                            break;
                          case 4:
                            return b.label++, { value: C[1], done: !1 };
                          case 5:
                            b.label++, d = C[1], C = [0];
                            continue;
                          case 7:
                            C = b.ops.pop(), b.trys.pop();
                            continue;
                          default:
                            if (!((p = (p = b.trys).length > 0 && p[p.length - 1]) || C[0] !== 6 && C[0] !== 2)) {
                              b = 0;
                              continue;
                            }
                            if (C[0] === 3 && (!p || C[1] > p[0] && C[1] < p[3])) {
                              b.label = C[1];
                              break;
                            }
                            if (C[0] === 6 && b.label < p[1]) {
                              b.label = p[1], p = C;
                              break;
                            }
                            if (p && b.label < p[2]) {
                              b.label = p[2], b.ops.push(C);
                              break;
                            }
                            p[2] && b.ops.pop(), b.trys.pop();
                            continue;
                        }
                        C = y.call(w, b);
                      } catch (q) {
                        C = [6, q], d = 0;
                      } finally {
                        k = p = 0;
                      }
                    if (5 & C[0])
                      throw C[1];
                    return { value: C[0] ? C[1] : void 0, done: !0 };
                  }([D, B]);
                };
              }
            }(this, function(w) {
              return [2, new Promise(function(y) {
                var k = new XMLHttpRequest();
                k.onload = function() {
                  var d = new FileReader();
                  d.onloadend = function() {
                    y(d.result);
                  }, d.readAsDataURL(k.response);
                }, k.open("GET", S), k.responseType = "blob", k.send();
              })];
            });
          }, new ((l = void 0) || (l = Promise))(function(w, y) {
            function k(f) {
              try {
                p(h.next(f));
              } catch (b) {
                y(b);
              }
            }
            function d(f) {
              try {
                p(h.throw(f));
              } catch (b) {
                y(b);
              }
            }
            function p(f) {
              var b;
              f.done ? w(f.value) : (b = f.value, b instanceof l ? b : new l(function(v) {
                v(b);
              })).then(k, d);
            }
            p((h = h.apply(s, u || [])).next());
          });
          var s, u, l, h;
        }
        const P = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };
        var F = function() {
          return (F = Object.assign || function(S) {
            for (var s, u = 1, l = arguments.length; u < l; u++)
              for (var h in s = arguments[u])
                Object.prototype.hasOwnProperty.call(s, h) && (S[h] = s[h]);
            return S;
          }).apply(this, arguments);
        };
        const U = function() {
          function S(s) {
            var u = s.svg, l = s.type;
            this._svg = u, this._type = l;
          }
          return S.prototype.draw = function(s, u, l, h) {
            var w;
            switch (this._type) {
              case "dots":
                w = this._drawDot;
                break;
              case "classy":
                w = this._drawClassy;
                break;
              case "classy-rounded":
                w = this._drawClassyRounded;
                break;
              case "rounded":
                w = this._drawRounded;
                break;
              case "extra-rounded":
                w = this._drawExtraRounded;
                break;
              case "square":
              default:
                w = this._drawSquare;
            }
            w.call(this, { x: s, y: u, size: l, getNeighbor: h });
          }, S.prototype._rotateFigure = function(s) {
            var u, l = s.x, h = s.y, w = s.size, y = s.rotation, k = y === void 0 ? 0 : y, d = l + w / 2, p = h + w / 2;
            (0, s.draw)(), (u = this._element) === null || u === void 0 || u.setAttribute("transform", "rotate(" + 180 * k / Math.PI + "," + d + "," + p + ")");
          }, S.prototype._basicDot = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "circle"), u._element.setAttribute("cx", String(h + l / 2)), u._element.setAttribute("cy", String(w + l / 2)), u._element.setAttribute("r", String(l / 2));
            } }));
          }, S.prototype._basicSquare = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "rect"), u._element.setAttribute("x", String(h)), u._element.setAttribute("y", String(w)), u._element.setAttribute("width", String(l)), u._element.setAttribute("height", String(l));
            } }));
          }, S.prototype._basicSideRounded = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("d", "M " + h + " " + w + "v " + l + "h " + l / 2 + "a " + l / 2 + " " + l / 2 + ", 0, 0, 0, 0 " + -l);
            } }));
          }, S.prototype._basicCornerRounded = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("d", "M " + h + " " + w + "v " + l + "h " + l + "v " + -l / 2 + "a " + l / 2 + " " + l / 2 + ", 0, 0, 0, " + -l / 2 + " " + -l / 2);
            } }));
          }, S.prototype._basicCornerExtraRounded = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("d", "M " + h + " " + w + "v " + l + "h " + l + "a " + l + " " + l + ", 0, 0, 0, " + -l + " " + -l);
            } }));
          }, S.prototype._basicCornersRounded = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(F(F({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("d", "M " + h + " " + w + "v " + l / 2 + "a " + l / 2 + " " + l / 2 + ", 0, 0, 0, " + l / 2 + " " + l / 2 + "h " + l / 2 + "v " + -l / 2 + "a " + l / 2 + " " + l / 2 + ", 0, 0, 0, " + -l / 2 + " " + -l / 2);
            } }));
          }, S.prototype._drawDot = function(s) {
            var u = s.x, l = s.y, h = s.size;
            this._basicDot({ x: u, y: l, size: h, rotation: 0 });
          }, S.prototype._drawSquare = function(s) {
            var u = s.x, l = s.y, h = s.size;
            this._basicSquare({ x: u, y: l, size: h, rotation: 0 });
          }, S.prototype._drawRounded = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.getNeighbor, y = w ? +w(-1, 0) : 0, k = w ? +w(1, 0) : 0, d = w ? +w(0, -1) : 0, p = w ? +w(0, 1) : 0, f = y + k + d + p;
            if (f !== 0)
              if (f > 2 || y && k || d && p)
                this._basicSquare({ x: u, y: l, size: h, rotation: 0 });
              else {
                if (f === 2) {
                  var b = 0;
                  return y && d ? b = Math.PI / 2 : d && k ? b = Math.PI : k && p && (b = -Math.PI / 2), void this._basicCornerRounded({ x: u, y: l, size: h, rotation: b });
                }
                if (f === 1)
                  return b = 0, d ? b = Math.PI / 2 : k ? b = Math.PI : p && (b = -Math.PI / 2), void this._basicSideRounded({ x: u, y: l, size: h, rotation: b });
              }
            else
              this._basicDot({ x: u, y: l, size: h, rotation: 0 });
          }, S.prototype._drawExtraRounded = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.getNeighbor, y = w ? +w(-1, 0) : 0, k = w ? +w(1, 0) : 0, d = w ? +w(0, -1) : 0, p = w ? +w(0, 1) : 0, f = y + k + d + p;
            if (f !== 0)
              if (f > 2 || y && k || d && p)
                this._basicSquare({ x: u, y: l, size: h, rotation: 0 });
              else {
                if (f === 2) {
                  var b = 0;
                  return y && d ? b = Math.PI / 2 : d && k ? b = Math.PI : k && p && (b = -Math.PI / 2), void this._basicCornerExtraRounded({ x: u, y: l, size: h, rotation: b });
                }
                if (f === 1)
                  return b = 0, d ? b = Math.PI / 2 : k ? b = Math.PI : p && (b = -Math.PI / 2), void this._basicSideRounded({ x: u, y: l, size: h, rotation: b });
              }
            else
              this._basicDot({ x: u, y: l, size: h, rotation: 0 });
          }, S.prototype._drawClassy = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.getNeighbor, y = w ? +w(-1, 0) : 0, k = w ? +w(1, 0) : 0, d = w ? +w(0, -1) : 0, p = w ? +w(0, 1) : 0;
            y + k + d + p !== 0 ? y || d ? k || p ? this._basicSquare({ x: u, y: l, size: h, rotation: 0 }) : this._basicCornerRounded({ x: u, y: l, size: h, rotation: Math.PI / 2 }) : this._basicCornerRounded({ x: u, y: l, size: h, rotation: -Math.PI / 2 }) : this._basicCornersRounded({ x: u, y: l, size: h, rotation: Math.PI / 2 });
          }, S.prototype._drawClassyRounded = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.getNeighbor, y = w ? +w(-1, 0) : 0, k = w ? +w(1, 0) : 0, d = w ? +w(0, -1) : 0, p = w ? +w(0, 1) : 0;
            y + k + d + p !== 0 ? y || d ? k || p ? this._basicSquare({ x: u, y: l, size: h, rotation: 0 }) : this._basicCornerExtraRounded({ x: u, y: l, size: h, rotation: Math.PI / 2 }) : this._basicCornerExtraRounded({ x: u, y: l, size: h, rotation: -Math.PI / 2 }) : this._basicCornersRounded({ x: u, y: l, size: h, rotation: Math.PI / 2 });
          }, S;
        }();
        var Z = function() {
          return (Z = Object.assign || function(S) {
            for (var s, u = 1, l = arguments.length; u < l; u++)
              for (var h in s = arguments[u])
                Object.prototype.hasOwnProperty.call(s, h) && (S[h] = s[h]);
            return S;
          }).apply(this, arguments);
        };
        const J = function() {
          function S(s) {
            var u = s.svg, l = s.type;
            this._svg = u, this._type = l;
          }
          return S.prototype.draw = function(s, u, l, h) {
            var w;
            switch (this._type) {
              case "square":
                w = this._drawSquare;
                break;
              case "extra-rounded":
                w = this._drawExtraRounded;
                break;
              case "dot":
              default:
                w = this._drawDot;
            }
            w.call(this, { x: s, y: u, size: l, rotation: h });
          }, S.prototype._rotateFigure = function(s) {
            var u, l = s.x, h = s.y, w = s.size, y = s.rotation, k = y === void 0 ? 0 : y, d = l + w / 2, p = h + w / 2;
            (0, s.draw)(), (u = this._element) === null || u === void 0 || u.setAttribute("transform", "rotate(" + 180 * k / Math.PI + "," + d + "," + p + ")");
          }, S.prototype._basicDot = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y, y = l / 7;
            this._rotateFigure(Z(Z({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("clip-rule", "evenodd"), u._element.setAttribute("d", "M " + (h + l / 2) + " " + w + "a " + l / 2 + " " + l / 2 + " 0 1 0 0.1 0zm 0 " + y + "a " + (l / 2 - y) + " " + (l / 2 - y) + " 0 1 1 -0.1 0Z");
            } }));
          }, S.prototype._basicSquare = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y, y = l / 7;
            this._rotateFigure(Z(Z({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("clip-rule", "evenodd"), u._element.setAttribute("d", "M " + h + " " + w + "v " + l + "h " + l + "v " + -l + "zM " + (h + y) + " " + (w + y) + "h " + (l - 2 * y) + "v " + (l - 2 * y) + "h " + (2 * y - l) + "z");
            } }));
          }, S.prototype._basicExtraRounded = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y, y = l / 7;
            this._rotateFigure(Z(Z({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "path"), u._element.setAttribute("clip-rule", "evenodd"), u._element.setAttribute("d", "M " + h + " " + (w + 2.5 * y) + "v " + 2 * y + "a " + 2.5 * y + " " + 2.5 * y + ", 0, 0, 0, " + 2.5 * y + " " + 2.5 * y + "h " + 2 * y + "a " + 2.5 * y + " " + 2.5 * y + ", 0, 0, 0, " + 2.5 * y + " " + 2.5 * -y + "v " + -2 * y + "a " + 2.5 * y + " " + 2.5 * y + ", 0, 0, 0, " + 2.5 * -y + " " + 2.5 * -y + "h " + -2 * y + "a " + 2.5 * y + " " + 2.5 * y + ", 0, 0, 0, " + 2.5 * -y + " " + 2.5 * y + "M " + (h + 2.5 * y) + " " + (w + y) + "h " + 2 * y + "a " + 1.5 * y + " " + 1.5 * y + ", 0, 0, 1, " + 1.5 * y + " " + 1.5 * y + "v " + 2 * y + "a " + 1.5 * y + " " + 1.5 * y + ", 0, 0, 1, " + 1.5 * -y + " " + 1.5 * y + "h " + -2 * y + "a " + 1.5 * y + " " + 1.5 * y + ", 0, 0, 1, " + 1.5 * -y + " " + 1.5 * -y + "v " + -2 * y + "a " + 1.5 * y + " " + 1.5 * y + ", 0, 0, 1, " + 1.5 * y + " " + 1.5 * -y);
            } }));
          }, S.prototype._drawDot = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.rotation;
            this._basicDot({ x: u, y: l, size: h, rotation: w });
          }, S.prototype._drawSquare = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.rotation;
            this._basicSquare({ x: u, y: l, size: h, rotation: w });
          }, S.prototype._drawExtraRounded = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.rotation;
            this._basicExtraRounded({ x: u, y: l, size: h, rotation: w });
          }, S;
        }();
        var lt = function() {
          return (lt = Object.assign || function(S) {
            for (var s, u = 1, l = arguments.length; u < l; u++)
              for (var h in s = arguments[u])
                Object.prototype.hasOwnProperty.call(s, h) && (S[h] = s[h]);
            return S;
          }).apply(this, arguments);
        };
        const ht = function() {
          function S(s) {
            var u = s.svg, l = s.type;
            this._svg = u, this._type = l;
          }
          return S.prototype.draw = function(s, u, l, h) {
            var w;
            switch (this._type) {
              case "square":
                w = this._drawSquare;
                break;
              case "dot":
              default:
                w = this._drawDot;
            }
            w.call(this, { x: s, y: u, size: l, rotation: h });
          }, S.prototype._rotateFigure = function(s) {
            var u, l = s.x, h = s.y, w = s.size, y = s.rotation, k = y === void 0 ? 0 : y, d = l + w / 2, p = h + w / 2;
            (0, s.draw)(), (u = this._element) === null || u === void 0 || u.setAttribute("transform", "rotate(" + 180 * k / Math.PI + "," + d + "," + p + ")");
          }, S.prototype._basicDot = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(lt(lt({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "circle"), u._element.setAttribute("cx", String(h + l / 2)), u._element.setAttribute("cy", String(w + l / 2)), u._element.setAttribute("r", String(l / 2));
            } }));
          }, S.prototype._basicSquare = function(s) {
            var u = this, l = s.size, h = s.x, w = s.y;
            this._rotateFigure(lt(lt({}, s), { draw: function() {
              u._element = document.createElementNS("http://www.w3.org/2000/svg", "rect"), u._element.setAttribute("x", String(h)), u._element.setAttribute("y", String(w)), u._element.setAttribute("width", String(l)), u._element.setAttribute("height", String(l));
            } }));
          }, S.prototype._drawDot = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.rotation;
            this._basicDot({ x: u, y: l, size: h, rotation: w });
          }, S.prototype._drawSquare = function(s) {
            var u = s.x, l = s.y, h = s.size, w = s.rotation;
            this._basicSquare({ x: u, y: l, size: h, rotation: w });
          }, S;
        }(), rt = "circle";
        var tt = function(S, s, u, l) {
          return new (u || (u = Promise))(function(h, w) {
            function y(p) {
              try {
                d(l.next(p));
              } catch (f) {
                w(f);
              }
            }
            function k(p) {
              try {
                d(l.throw(p));
              } catch (f) {
                w(f);
              }
            }
            function d(p) {
              var f;
              p.done ? h(p.value) : (f = p.value, f instanceof u ? f : new u(function(b) {
                b(f);
              })).then(y, k);
            }
            d((l = l.apply(S, s || [])).next());
          });
        }, dt = function(S, s) {
          var u, l, h, w, y = { label: 0, sent: function() {
            if (1 & h[0])
              throw h[1];
            return h[1];
          }, trys: [], ops: [] };
          return w = { next: k(0), throw: k(1), return: k(2) }, typeof Symbol == "function" && (w[Symbol.iterator] = function() {
            return this;
          }), w;
          function k(d) {
            return function(p) {
              return function(f) {
                if (u)
                  throw new TypeError("Generator is already executing.");
                for (; y; )
                  try {
                    if (u = 1, l && (h = 2 & f[0] ? l.return : f[0] ? l.throw || ((h = l.return) && h.call(l), 0) : l.next) && !(h = h.call(l, f[1])).done)
                      return h;
                    switch (l = 0, h && (f = [2 & f[0], h.value]), f[0]) {
                      case 0:
                      case 1:
                        h = f;
                        break;
                      case 4:
                        return y.label++, { value: f[1], done: !1 };
                      case 5:
                        y.label++, l = f[1], f = [0];
                        continue;
                      case 7:
                        f = y.ops.pop(), y.trys.pop();
                        continue;
                      default:
                        if (!((h = (h = y.trys).length > 0 && h[h.length - 1]) || f[0] !== 6 && f[0] !== 2)) {
                          y = 0;
                          continue;
                        }
                        if (f[0] === 3 && (!h || f[1] > h[0] && f[1] < h[3])) {
                          y.label = f[1];
                          break;
                        }
                        if (f[0] === 6 && y.label < h[1]) {
                          y.label = h[1], h = f;
                          break;
                        }
                        if (h && y.label < h[2]) {
                          y.label = h[2], y.ops.push(f);
                          break;
                        }
                        h[2] && y.ops.pop(), y.trys.pop();
                        continue;
                    }
                    f = s.call(S, y);
                  } catch (b) {
                    f = [6, b], l = 0;
                  } finally {
                    u = h = 0;
                  }
                if (5 & f[0])
                  throw f[1];
                return { value: f[0] ? f[1] : void 0, done: !0 };
              }([d, p]);
            };
          }
        }, ot = [[1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1]], ct = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 0, 0], [0, 0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
        const pt = function() {
          function S(s) {
            this._element = document.createElementNS("http://www.w3.org/2000/svg", "svg"), this._element.setAttribute("width", String(s.width)), this._element.setAttribute("height", String(s.height)), this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"), this._element.appendChild(this._defs), this._options = s;
          }
          return Object.defineProperty(S.prototype, "width", { get: function() {
            return this._options.width;
          }, enumerable: !1, configurable: !0 }), Object.defineProperty(S.prototype, "height", { get: function() {
            return this._options.height;
          }, enumerable: !1, configurable: !0 }), S.prototype.getElement = function() {
            return this._element;
          }, S.prototype.drawQR = function(s) {
            return tt(this, void 0, void 0, function() {
              var u, l, h, w, y, k, d, p, f, b, v = this;
              return dt(this, function(D) {
                switch (D.label) {
                  case 0:
                    return u = s.getModuleCount(), l = Math.min(this._options.width, this._options.height) - 2 * this._options.margin, h = this._options.shape === rt ? l / Math.sqrt(2) : l, w = Math.floor(h / u), y = { hideXDots: 0, hideYDots: 0, width: 0, height: 0 }, this._qr = s, this._options.image ? [4, this.loadImage()] : [3, 2];
                  case 1:
                    if (D.sent(), !this._image)
                      return [2];
                    k = this._options, d = k.imageOptions, p = k.qrOptions, f = d.imageSize * P[p.errorCorrectionLevel], b = Math.floor(f * u * u), y = function(B) {
                      var C = B.originalHeight, q = B.originalWidth, j = B.maxHiddenDots, Y = B.maxHiddenAxisDots, st = B.dotSize, X = { x: 0, y: 0 }, K = { x: 0, y: 0 };
                      if (C <= 0 || q <= 0 || j <= 0 || st <= 0)
                        return { height: 0, width: 0, hideYDots: 0, hideXDots: 0 };
                      var V = C / q;
                      return X.x = Math.floor(Math.sqrt(j / V)), X.x <= 0 && (X.x = 1), Y && Y < X.x && (X.x = Y), X.x % 2 == 0 && X.x--, K.x = X.x * st, X.y = 1 + 2 * Math.ceil((X.x * V - 1) / 2), K.y = Math.round(K.x * V), (X.y * X.x > j || Y && Y < X.y) && (Y && Y < X.y ? (X.y = Y, X.y % 2 == 0 && X.x--) : X.y -= 2, K.y = X.y * st, X.x = 1 + 2 * Math.ceil((X.y / V - 1) / 2), K.x = Math.round(K.y / V)), { height: K.y, width: K.x, hideYDots: X.y, hideXDots: X.x };
                    }({ originalWidth: this._image.width, originalHeight: this._image.height, maxHiddenDots: b, maxHiddenAxisDots: u - 14, dotSize: w }), D.label = 2;
                  case 2:
                    return this.drawBackground(), this.drawDots(function(B, C) {
                      var q, j, Y, st, X, K;
                      return !(v._options.imageOptions.hideBackgroundDots && B >= (u - y.hideXDots) / 2 && B < (u + y.hideXDots) / 2 && C >= (u - y.hideYDots) / 2 && C < (u + y.hideYDots) / 2 || !((q = ot[B]) === null || q === void 0) && q[C] || !((j = ot[B - u + 7]) === null || j === void 0) && j[C] || !((Y = ot[B]) === null || Y === void 0) && Y[C - u + 7] || !((st = ct[B]) === null || st === void 0) && st[C] || !((X = ct[B - u + 7]) === null || X === void 0) && X[C] || !((K = ct[B]) === null || K === void 0) && K[C - u + 7]);
                    }), this.drawCorners(), this._options.image ? [4, this.drawImage({ width: y.width, height: y.height, count: u, dotSize: w })] : [3, 4];
                  case 3:
                    D.sent(), D.label = 4;
                  case 4:
                    return [2];
                }
              });
            });
          }, S.prototype.drawBackground = function() {
            var s, u, l, h = this._element, w = this._options;
            if (h) {
              var y = (s = w.backgroundOptions) === null || s === void 0 ? void 0 : s.gradient, k = (u = w.backgroundOptions) === null || u === void 0 ? void 0 : u.color;
              if ((y || k) && this._createColor({ options: y, color: k, additionalRotation: 0, x: 0, y: 0, height: w.height, width: w.width, name: "background-color" }), (l = w.backgroundOptions) === null || l === void 0 ? void 0 : l.round) {
                var d = Math.min(w.width, w.height), p = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                this._backgroundClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath"), this._backgroundClipPath.setAttribute("id", "clip-path-background-color"), this._defs.appendChild(this._backgroundClipPath), p.setAttribute("x", String((w.width - d) / 2)), p.setAttribute("y", String((w.height - d) / 2)), p.setAttribute("width", String(d)), p.setAttribute("height", String(d)), p.setAttribute("rx", String(d / 2 * w.backgroundOptions.round)), this._backgroundClipPath.appendChild(p);
              }
            }
          }, S.prototype.drawDots = function(s) {
            var u, l, h = this;
            if (!this._qr)
              throw "QR code is not defined";
            var w = this._options, y = this._qr.getModuleCount();
            if (y > w.width || y > w.height)
              throw "The canvas is too small.";
            var k = Math.min(w.width, w.height) - 2 * w.margin, d = w.shape === rt ? k / Math.sqrt(2) : k, p = Math.floor(d / y), f = Math.floor((w.width - y * p) / 2), b = Math.floor((w.height - y * p) / 2), v = new U({ svg: this._element, type: w.dotsOptions.type });
            this._dotsClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath"), this._dotsClipPath.setAttribute("id", "clip-path-dot-color"), this._defs.appendChild(this._dotsClipPath), this._createColor({ options: (u = w.dotsOptions) === null || u === void 0 ? void 0 : u.gradient, color: w.dotsOptions.color, additionalRotation: 0, x: 0, y: 0, height: w.height, width: w.width, name: "dot-color" });
            for (var D = function(ft) {
              for (var nt = function(at) {
                return s && !s(ft, at) ? "continue" : !((l = B._qr) === null || l === void 0) && l.isDark(ft, at) ? (v.draw(f + ft * p, b + at * p, p, function(yt, _t) {
                  return !(ft + yt < 0 || at + _t < 0 || ft + yt >= y || at + _t >= y) && !(s && !s(ft + yt, at + _t)) && !!h._qr && h._qr.isDark(ft + yt, at + _t);
                }), void (v._element && B._dotsClipPath && B._dotsClipPath.appendChild(v._element))) : "continue";
              }, mt = 0; mt < y; mt++)
                nt(mt);
            }, B = this, C = 0; C < y; C++)
              D(C);
            if (w.shape === rt) {
              var q = Math.floor((k / p - y) / 2), j = y + 2 * q, Y = f - q * p, st = b - q * p, X = [], K = Math.floor(j / 2);
              for (C = 0; C < j; C++) {
                X[C] = [];
                for (var V = 0; V < j; V++)
                  C >= q - 1 && C <= j - q && V >= q - 1 && V <= j - q || Math.sqrt((C - K) * (C - K) + (V - K) * (V - K)) > K ? X[C][V] = 0 : X[C][V] = this._qr.isDark(V - 2 * q < 0 ? V : V >= y ? V - 2 * q : V - q, C - 2 * q < 0 ? C : C >= y ? C - 2 * q : C - q) ? 1 : 0;
              }
              var Q = function(ft) {
                for (var nt = function(at) {
                  if (!X[ft][at])
                    return "continue";
                  v.draw(Y + ft * p, st + at * p, p, function(yt, _t) {
                    var kt;
                    return !!(!((kt = X[ft + yt]) === null || kt === void 0) && kt[at + _t]);
                  }), v._element && Mt._dotsClipPath && Mt._dotsClipPath.appendChild(v._element);
                }, mt = 0; mt < j; mt++)
                  nt(mt);
              }, Mt = this;
              for (C = 0; C < j; C++)
                Q(C);
            }
          }, S.prototype.drawCorners = function() {
            var s = this;
            if (!this._qr)
              throw "QR code is not defined";
            var u = this._element, l = this._options;
            if (!u)
              throw "Element code is not defined";
            var h = this._qr.getModuleCount(), w = Math.min(l.width, l.height) - 2 * l.margin, y = l.shape === rt ? w / Math.sqrt(2) : w, k = Math.floor(y / h), d = 7 * k, p = 3 * k, f = Math.floor((l.width - h * k) / 2), b = Math.floor((l.height - h * k) / 2);
            [[0, 0, 0], [1, 0, Math.PI / 2], [0, 1, -Math.PI / 2]].forEach(function(v) {
              var D, B, C, q, j, Y, st, X, K, V, Q, Mt, ft = v[0], nt = v[1], mt = v[2], at = f + ft * k * (h - 7), yt = b + nt * k * (h - 7), _t = s._dotsClipPath, kt = s._dotsClipPath;
              if ((!((D = l.cornersSquareOptions) === null || D === void 0) && D.gradient || !((B = l.cornersSquareOptions) === null || B === void 0) && B.color) && ((_t = document.createElementNS("http://www.w3.org/2000/svg", "clipPath")).setAttribute("id", "clip-path-corners-square-color-" + ft + "-" + nt), s._defs.appendChild(_t), s._cornersSquareClipPath = s._cornersDotClipPath = kt = _t, s._createColor({ options: (C = l.cornersSquareOptions) === null || C === void 0 ? void 0 : C.gradient, color: (q = l.cornersSquareOptions) === null || q === void 0 ? void 0 : q.color, additionalRotation: mt, x: at, y: yt, height: d, width: d, name: "corners-square-color-" + ft + "-" + nt })), (j = l.cornersSquareOptions) === null || j === void 0 ? void 0 : j.type) {
                var At = new J({ svg: s._element, type: l.cornersSquareOptions.type });
                At.draw(at, yt, d, mt), At._element && _t && _t.appendChild(At._element);
              } else
                for (var $t = new U({ svg: s._element, type: l.dotsOptions.type }), R = function(ut) {
                  for (var xt = function(Ct) {
                    if (!(!((Y = ot[ut]) === null || Y === void 0) && Y[Ct]))
                      return "continue";
                    $t.draw(at + ut * k, yt + Ct * k, k, function(ue, fe) {
                      var zt;
                      return !!(!((zt = ot[ut + ue]) === null || zt === void 0) && zt[Ct + fe]);
                    }), $t._element && _t && _t.appendChild($t._element);
                  }, Et = 0; Et < ot[ut].length; Et++)
                    xt(Et);
                }, G = 0; G < ot.length; G++)
                  R(G);
              if ((!((st = l.cornersDotOptions) === null || st === void 0) && st.gradient || !((X = l.cornersDotOptions) === null || X === void 0) && X.color) && ((kt = document.createElementNS("http://www.w3.org/2000/svg", "clipPath")).setAttribute("id", "clip-path-corners-dot-color-" + ft + "-" + nt), s._defs.appendChild(kt), s._cornersDotClipPath = kt, s._createColor({ options: (K = l.cornersDotOptions) === null || K === void 0 ? void 0 : K.gradient, color: (V = l.cornersDotOptions) === null || V === void 0 ? void 0 : V.color, additionalRotation: mt, x: at + 2 * k, y: yt + 2 * k, height: p, width: p, name: "corners-dot-color-" + ft + "-" + nt })), (Q = l.cornersDotOptions) === null || Q === void 0 ? void 0 : Q.type) {
                var et = new ht({ svg: s._element, type: l.cornersDotOptions.type });
                et.draw(at + 2 * k, yt + 2 * k, p, mt), et._element && kt && kt.appendChild(et._element);
              } else {
                $t = new U({ svg: s._element, type: l.dotsOptions.type });
                var gt = function(ut) {
                  for (var xt = function(Ct) {
                    if (!(!((Mt = ct[ut]) === null || Mt === void 0) && Mt[Ct]))
                      return "continue";
                    $t.draw(at + ut * k, yt + Ct * k, k, function(ue, fe) {
                      var zt;
                      return !!(!((zt = ct[ut + ue]) === null || zt === void 0) && zt[Ct + fe]);
                    }), $t._element && kt && kt.appendChild($t._element);
                  }, Et = 0; Et < ct[ut].length; Et++)
                    xt(Et);
                };
                for (G = 0; G < ct.length; G++)
                  gt(G);
              }
            });
          }, S.prototype.loadImage = function() {
            var s = this;
            return new Promise(function(u, l) {
              var h = s._options, w = new Image();
              if (!h.image)
                return l("Image is not defined");
              typeof h.imageOptions.crossOrigin == "string" && (w.crossOrigin = h.imageOptions.crossOrigin), s._image = w, w.onload = function() {
                u();
              }, w.src = h.image;
            });
          }, S.prototype.drawImage = function(s) {
            var u = s.width, l = s.height, h = s.count, w = s.dotSize;
            return tt(this, void 0, void 0, function() {
              var y, k, d, p, f, b, v, D, B;
              return dt(this, function(C) {
                switch (C.label) {
                  case 0:
                    return y = this._options, k = Math.floor((y.width - h * w) / 2), d = Math.floor((y.height - h * w) / 2), p = k + y.imageOptions.margin + (h * w - u) / 2, f = d + y.imageOptions.margin + (h * w - l) / 2, b = u - 2 * y.imageOptions.margin, v = l - 2 * y.imageOptions.margin, (D = document.createElementNS("http://www.w3.org/2000/svg", "image")).setAttribute("x", String(p)), D.setAttribute("y", String(f)), D.setAttribute("width", b + "px"), D.setAttribute("height", v + "px"), [4, W(y.image || "")];
                  case 1:
                    return B = C.sent(), D.setAttribute("href", B || ""), this._element.appendChild(D), [2];
                }
              });
            });
          }, S.prototype._createColor = function(s) {
            var u = s.options, l = s.color, h = s.additionalRotation, w = s.x, y = s.y, k = s.height, d = s.width, p = s.name, f = d > k ? d : k, b = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            if (b.setAttribute("x", String(w)), b.setAttribute("y", String(y)), b.setAttribute("height", String(k)), b.setAttribute("width", String(d)), b.setAttribute("clip-path", "url('#clip-path-" + p + "')"), u) {
              var v;
              if (u.type === "radial")
                (v = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient")).setAttribute("id", p), v.setAttribute("gradientUnits", "userSpaceOnUse"), v.setAttribute("fx", String(w + d / 2)), v.setAttribute("fy", String(y + k / 2)), v.setAttribute("cx", String(w + d / 2)), v.setAttribute("cy", String(y + k / 2)), v.setAttribute("r", String(f / 2));
              else {
                var D = ((u.rotation || 0) + h) % (2 * Math.PI), B = (D + 2 * Math.PI) % (2 * Math.PI), C = w + d / 2, q = y + k / 2, j = w + d / 2, Y = y + k / 2;
                B >= 0 && B <= 0.25 * Math.PI || B > 1.75 * Math.PI && B <= 2 * Math.PI ? (C -= d / 2, q -= k / 2 * Math.tan(D), j += d / 2, Y += k / 2 * Math.tan(D)) : B > 0.25 * Math.PI && B <= 0.75 * Math.PI ? (q -= k / 2, C -= d / 2 / Math.tan(D), Y += k / 2, j += d / 2 / Math.tan(D)) : B > 0.75 * Math.PI && B <= 1.25 * Math.PI ? (C += d / 2, q += k / 2 * Math.tan(D), j -= d / 2, Y -= k / 2 * Math.tan(D)) : B > 1.25 * Math.PI && B <= 1.75 * Math.PI && (q += k / 2, C += d / 2 / Math.tan(D), Y -= k / 2, j -= d / 2 / Math.tan(D)), (v = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")).setAttribute("id", p), v.setAttribute("gradientUnits", "userSpaceOnUse"), v.setAttribute("x1", String(Math.round(C))), v.setAttribute("y1", String(Math.round(q))), v.setAttribute("x2", String(Math.round(j))), v.setAttribute("y2", String(Math.round(Y)));
              }
              u.colorStops.forEach(function(st) {
                var X = st.offset, K = st.color, V = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                V.setAttribute("offset", 100 * X + "%"), V.setAttribute("stop-color", K), v.appendChild(V);
              }), b.setAttribute("fill", "url('#" + p + "')"), this._defs.appendChild(v);
            } else
              l && b.setAttribute("fill", l);
            this._element.appendChild(b);
          }, S;
        }(), Nt = "canvas";
        for (var Ot = {}, O = 0; O <= 40; O++)
          Ot[O] = O;
        const T = { type: Nt, shape: "square", width: 300, height: 300, data: "", margin: 0, qrOptions: { typeNumber: Ot[0], mode: void 0, errorCorrectionLevel: "Q" }, imageOptions: { hideBackgroundDots: !0, imageSize: 0.4, crossOrigin: void 0, margin: 0 }, dotsOptions: { type: "square", color: "#000" }, backgroundOptions: { round: 0, color: "#fff" } };
        var N = function() {
          return (N = Object.assign || function(S) {
            for (var s, u = 1, l = arguments.length; u < l; u++)
              for (var h in s = arguments[u])
                Object.prototype.hasOwnProperty.call(s, h) && (S[h] = s[h]);
            return S;
          }).apply(this, arguments);
        };
        function A(S) {
          var s = N({}, S);
          if (!s.colorStops || !s.colorStops.length)
            throw "Field 'colorStops' is required in gradient";
          return s.rotation ? s.rotation = Number(s.rotation) : s.rotation = 0, s.colorStops = s.colorStops.map(function(u) {
            return N(N({}, u), { offset: Number(u.offset) });
          }), s;
        }
        function _(S) {
          var s = N({}, S);
          return s.width = Number(s.width), s.height = Number(s.height), s.margin = Number(s.margin), s.imageOptions = N(N({}, s.imageOptions), { hideBackgroundDots: !!s.imageOptions.hideBackgroundDots, imageSize: Number(s.imageOptions.imageSize), margin: Number(s.imageOptions.margin) }), s.margin > Math.min(s.width, s.height) && (s.margin = Math.min(s.width, s.height)), s.dotsOptions = N({}, s.dotsOptions), s.dotsOptions.gradient && (s.dotsOptions.gradient = A(s.dotsOptions.gradient)), s.cornersSquareOptions && (s.cornersSquareOptions = N({}, s.cornersSquareOptions), s.cornersSquareOptions.gradient && (s.cornersSquareOptions.gradient = A(s.cornersSquareOptions.gradient))), s.cornersDotOptions && (s.cornersDotOptions = N({}, s.cornersDotOptions), s.cornersDotOptions.gradient && (s.cornersDotOptions.gradient = A(s.cornersDotOptions.gradient))), s.backgroundOptions && (s.backgroundOptions = N({}, s.backgroundOptions), s.backgroundOptions.gradient && (s.backgroundOptions.gradient = A(s.backgroundOptions.gradient))), s;
        }
        var I = c(192), z = c.n(I), L = function(S, s, u, l) {
          return new (u || (u = Promise))(function(h, w) {
            function y(p) {
              try {
                d(l.next(p));
              } catch (f) {
                w(f);
              }
            }
            function k(p) {
              try {
                d(l.throw(p));
              } catch (f) {
                w(f);
              }
            }
            function d(p) {
              var f;
              p.done ? h(p.value) : (f = p.value, f instanceof u ? f : new u(function(b) {
                b(f);
              })).then(y, k);
            }
            d((l = l.apply(S, s || [])).next());
          });
        }, H = function(S, s) {
          var u, l, h, w, y = { label: 0, sent: function() {
            if (1 & h[0])
              throw h[1];
            return h[1];
          }, trys: [], ops: [] };
          return w = { next: k(0), throw: k(1), return: k(2) }, typeof Symbol == "function" && (w[Symbol.iterator] = function() {
            return this;
          }), w;
          function k(d) {
            return function(p) {
              return function(f) {
                if (u)
                  throw new TypeError("Generator is already executing.");
                for (; y; )
                  try {
                    if (u = 1, l && (h = 2 & f[0] ? l.return : f[0] ? l.throw || ((h = l.return) && h.call(l), 0) : l.next) && !(h = h.call(l, f[1])).done)
                      return h;
                    switch (l = 0, h && (f = [2 & f[0], h.value]), f[0]) {
                      case 0:
                      case 1:
                        h = f;
                        break;
                      case 4:
                        return y.label++, { value: f[1], done: !1 };
                      case 5:
                        y.label++, l = f[1], f = [0];
                        continue;
                      case 7:
                        f = y.ops.pop(), y.trys.pop();
                        continue;
                      default:
                        if (!((h = (h = y.trys).length > 0 && h[h.length - 1]) || f[0] !== 6 && f[0] !== 2)) {
                          y = 0;
                          continue;
                        }
                        if (f[0] === 3 && (!h || f[1] > h[0] && f[1] < h[3])) {
                          y.label = f[1];
                          break;
                        }
                        if (f[0] === 6 && y.label < h[1]) {
                          y.label = h[1], h = f;
                          break;
                        }
                        if (h && y.label < h[2]) {
                          y.label = h[2], y.ops.push(f);
                          break;
                        }
                        h[2] && y.ops.pop(), y.trys.pop();
                        continue;
                    }
                    f = s.call(S, y);
                  } catch (b) {
                    f = [6, b], l = 0;
                  } finally {
                    u = h = 0;
                  }
                if (5 & f[0])
                  throw f[1];
                return { value: f[0] ? f[1] : void 0, done: !0 };
              }([d, p]);
            };
          }
        };
        const vt = function() {
          function S(s) {
            this._options = s ? _(M(T, s)) : T, this.update();
          }
          return S._clearContainer = function(s) {
            s && (s.innerHTML = "");
          }, S.prototype._setupSvg = function() {
            var s = this;
            if (this._qr) {
              var u = new pt(this._options);
              this._svg = u.getElement(), this._svgDrawingPromise = u.drawQR(this._qr).then(function() {
                var l;
                s._svg && ((l = s._extension) === null || l === void 0 || l.call(s, u.getElement(), s._options));
              });
            }
          }, S.prototype._setupCanvas = function() {
            var s, u = this;
            this._qr && (this._canvas = document.createElement("canvas"), this._canvas.width = this._options.width, this._canvas.height = this._options.height, this._setupSvg(), this._canvasDrawingPromise = (s = this._svgDrawingPromise) === null || s === void 0 ? void 0 : s.then(function() {
              if (u._svg) {
                var l = u._svg, h = new XMLSerializer().serializeToString(l), w = "data:image/svg+xml;base64," + btoa(h), y = new Image();
                return new Promise(function(k) {
                  y.onload = function() {
                    var d, p;
                    (p = (d = u._canvas) === null || d === void 0 ? void 0 : d.getContext("2d")) === null || p === void 0 || p.drawImage(y, 0, 0), k();
                  }, y.src = w;
                });
              }
            }));
          }, S.prototype._getElement = function(s) {
            return s === void 0 && (s = "png"), L(this, void 0, void 0, function() {
              return H(this, function(u) {
                switch (u.label) {
                  case 0:
                    if (!this._qr)
                      throw "QR code is empty";
                    return s.toLowerCase() !== "svg" ? [3, 2] : (this._svg && this._svgDrawingPromise || this._setupSvg(), [4, this._svgDrawingPromise]);
                  case 1:
                    return u.sent(), [2, this._svg];
                  case 2:
                    return this._canvas && this._canvasDrawingPromise || this._setupCanvas(), [4, this._canvasDrawingPromise];
                  case 3:
                    return u.sent(), [2, this._canvas];
                }
              });
            });
          }, S.prototype.update = function(s) {
            S._clearContainer(this._container), this._options = s ? _(M(this._options, s)) : this._options, this._options.data && (this._qr = z()(this._options.qrOptions.typeNumber, this._options.qrOptions.errorCorrectionLevel), this._qr.addData(this._options.data, this._options.qrOptions.mode || function(u) {
              switch (!0) {
                case /^[0-9]*$/.test(u):
                  return "Numeric";
                case /^[0-9A-Z $%*+\-./:]*$/.test(u):
                  return "Alphanumeric";
                default:
                  return "Byte";
              }
            }(this._options.data)), this._qr.make(), this._options.type === Nt ? this._setupCanvas() : this._setupSvg(), this.append(this._container));
          }, S.prototype.append = function(s) {
            if (s) {
              if (typeof s.appendChild != "function")
                throw "Container should be a single DOM node";
              this._options.type === Nt ? this._canvas && s.appendChild(this._canvas) : this._svg && s.appendChild(this._svg), this._container = s;
            }
          }, S.prototype.applyExtension = function(s) {
            if (!s)
              throw "Extension function should be defined.";
            this._extension = s, this.update();
          }, S.prototype.deleteExtension = function() {
            this._extension = void 0, this.update();
          }, S.prototype.getRawData = function(s) {
            return s === void 0 && (s = "png"), L(this, void 0, void 0, function() {
              var u, l, h;
              return H(this, function(w) {
                switch (w.label) {
                  case 0:
                    if (!this._qr)
                      throw "QR code is empty";
                    return [4, this._getElement(s)];
                  case 1:
                    return (u = w.sent()) ? s.toLowerCase() === "svg" ? (l = new XMLSerializer(), h = l.serializeToString(u), [2, new Blob([`<?xml version="1.0" standalone="no"?>\r
` + h], { type: "image/svg+xml" })]) : [2, new Promise(function(y) {
                      return u.toBlob(y, "image/" + s, 1);
                    })] : [2, null];
                }
              });
            });
          }, S.prototype.download = function(s) {
            return L(this, void 0, void 0, function() {
              var u, l, h, w, y;
              return H(this, function(k) {
                switch (k.label) {
                  case 0:
                    if (!this._qr)
                      throw "QR code is empty";
                    return u = "png", l = "qr", typeof s == "string" ? (u = s, console.warn("Extension is deprecated as argument for 'download' method, please pass object { name: '...', extension: '...' } as argument")) : typeof s == "object" && s !== null && (s.name && (l = s.name), s.extension && (u = s.extension)), [4, this._getElement(u)];
                  case 1:
                    return (h = k.sent()) ? (u.toLowerCase() === "svg" ? (w = new XMLSerializer(), y = `<?xml version="1.0" standalone="no"?>\r
` + (y = w.serializeToString(h)), $("data:image/svg+xml;charset=utf-8," + encodeURIComponent(y), l + ".svg")) : $(h.toDataURL("image/" + u), l + "." + u), [2]) : [2];
                }
              });
            });
          }, S;
        }();
      } }, o = {};
      function r(i) {
        if (o[i])
          return o[i].exports;
        var a = o[i] = { exports: {} };
        return n[i](a, a.exports, r), a.exports;
      }
      return r.n = (i) => {
        var a = i && i.__esModule ? () => i.default : () => i;
        return r.d(a, { a }), a;
      }, r.d = (i, a) => {
        for (var c in a)
          r.o(a, c) && !r.o(i, c) && Object.defineProperty(i, c, { enumerable: !0, get: a[c] });
      }, r.o = (i, a) => Object.prototype.hasOwnProperty.call(i, a), r(676);
    })().default;
  });
})(Un);
var Wo = Un.exports;
const Ho = /* @__PURE__ */ _r(Wo);
function Uo(t) {
  var e, n;
  return {
    width: t.width,
    height: t.height,
    type: "canvas",
    data: t.value,
    image: t.image,
    margin: 0,
    qrOptions: {
      typeNumber: 3,
      mode: "Byte",
      errorCorrectionLevel: "M"
    },
    imageOptions: {
      hideBackgroundDots: !0,
      imageSize: 0.4,
      margin: 6,
      crossOrigin: "anonymous"
    },
    backgroundOptions: {
      color: "#ffffff"
    },
    dotsOptions: {
      ...t.dotsOptions
    },
    cornersSquareOptions: {
      color: (e = t.dotsOptions) == null ? void 0 : e.color
    },
    cornersDotOptions: {
      color: (n = t.dotsOptions) == null ? void 0 : n.color,
      type: "square"
    }
  };
}
const jo = { color: "#41b583", type: "rounded" };
function Go({ width: t = 300, height: e = 300, image: n, value: o, dotsOptions: r = jo, className: i }) {
  const a = it(null), c = it(null), g = it({ width: t, height: e, image: n, value: o, dotsOptions: r });
  g.current = { width: t, height: e, image: n, value: o, dotsOptions: r };
  const m = it(
    Jr(300, !1, () => {
      const x = c.current;
      if (!x)
        return;
      const M = Uo(g.current);
      g.current.value && (M && x.update(M), requestAnimationFrame(() => {
        var W;
        const $ = (W = a.current) == null ? void 0 : W.firstChild;
        $ && $.setAttribute("style", "width: 100%;");
      }));
    })
  );
  return bt(() => {
    const x = new Ho({});
    c.current = x, m.current();
    const M = a.current;
    return M && x.append(M), () => {
      for (c.current = null; M != null && M.firstChild; )
        M.removeChild(M.firstChild);
    };
  }, []), bt(() => {
    m.current();
  }, [t, e, n, o, r]), /* @__PURE__ */ E("div", { ref: a, className: i ? `qrcode__wrap ${i}` : "qrcode__wrap" });
}
const va = 40, Xo = 50, Yo = 20;
function cn(t) {
  return Array.from({ length: t }, () => 1 / t);
}
function Yt(t, e) {
  if (!Array.isArray(t) || t.length !== e)
    return cn(e);
  const n = t.map((r) => Number.isFinite(Number(r)) && Number(r) > 0 ? Number(r) : 0), o = n.reduce((r, i) => r + i, 0);
  return o ? n.map((r) => r / o) : cn(e);
}
function Vo(t) {
  var a;
  const n = (Array.isArray(t == null ? void 0 : t.cells) ? t.cells : []).filter(Array.isArray), o = Math.max(1, n.length || Number(t == null ? void 0 : t.rows) || 1), r = Math.max(1, n.reduce((c, g) => Math.max(c, g.length), 0) || Number(t == null ? void 0 : t.cols) || 1), i = [];
  for (let c = 0; c < o; c++) {
    const g = [];
    for (let m = 0; m < r; m++) {
      const x = (a = n[c]) == null ? void 0 : a[m];
      g.push(typeof x == "string" ? x : "");
    }
    i.push(g);
  }
  return {
    rows: o,
    cols: r,
    cells: i,
    colWidths: Yt(t == null ? void 0 : t.colWidths, r),
    headerRow: (t == null ? void 0 : t.headerRow) !== !1
  };
}
function xa(t, e) {
  return Array.from({ length: t }, () => Array.from({ length: e }, () => ""));
}
function _a(t, e, n, o) {
  return t.map((r, i) => i === e ? r.map((a, c) => c === n ? o : a) : [...r]);
}
function Sa(t, e) {
  var r;
  if (t.length >= Xo)
    return t;
  const n = ((r = t[0]) == null ? void 0 : r.length) ?? 1, o = t.map((i) => [...i]);
  return o.splice(
    Math.max(0, Math.min(e, t.length)),
    0,
    Array.from({ length: n }, () => "")
  ), o;
}
function ka(t, e) {
  return t.length <= 1 || e < 0 || e >= t.length ? t : t.filter((n, o) => o !== e).map((n) => [...n]);
}
function Ma(t, e, n) {
  var g;
  const o = ((g = t[0]) == null ? void 0 : g.length) ?? 1;
  if (o >= Yo)
    return { cells: t, colWidths: e };
  const r = Math.max(0, Math.min(n, o)), i = t.map((m) => {
    const x = [...m];
    return x.splice(r, 0, ""), x;
  }), a = 1 / (o + 1), c = Yt(e, o).map((m) => m * (1 - a));
  return c.splice(r, 0, a), { cells: i, colWidths: Yt(c, o + 1) };
}
function Aa(t, e, n) {
  var a;
  const o = ((a = t[0]) == null ? void 0 : a.length) ?? 1;
  if (o <= 1 || n < 0 || n >= o)
    return { cells: t, colWidths: e };
  const r = t.map((c) => c.filter((g, m) => m !== n)), i = Yt(e, o).filter((c, g) => g !== n);
  return { cells: r, colWidths: Yt(i, o - 1) };
}
function Na(t, e, n, o) {
  const r = t.length;
  if (e < 0 || e >= r - 1)
    return t;
  const i = t[e] + t[e + 1], a = Math.min(o, i / 2), c = Math.min(Math.max(t[e] + n, a), i - a), g = [...t];
  return g[e] = c, g[e + 1] = i - c, g;
}
function Ca(t) {
  const e = [];
  let n = 0;
  for (let o = 0; o < t.length - 1; o++)
    n += t[o], e.push(n);
  return e;
}
function Ea(t, e, n, o, r) {
  switch (r) {
    case "next":
      return e + 1 < o ? [t, e + 1] : t + 1 < n ? [t + 1, 0] : null;
    case "prev":
      return e > 0 ? [t, e - 1] : t > 0 ? [t - 1, o - 1] : null;
    case "down":
      return t + 1 < n ? [t + 1, e] : null;
  }
}
function ee(t, e, n) {
  let o;
  const r = new Promise((i, a) => {
    o = setTimeout(() => a(new Error(`${n} timed out after ${e}ms`)), e);
  });
  return Promise.race([t, r]).finally(() => clearTimeout(o));
}
const jn = 96, Ko = 72 / jn, Ta = (t) => (Number(t) || 0) / jn, Oa = (t) => (Number(t) || 0) * Ko;
function Qo(t, e = "000000") {
  if (!t || typeof t != "string")
    return { color: e };
  const n = t.trim(), o = n.match(/^rgba?\(([^)]+)\)$/i);
  if (o) {
    const i = o[1].split(",").map((M) => parseFloat(M.trim())), [a, c, g, m = 1] = i;
    return [a, c, g].some((M) => Number.isNaN(M)) ? { color: e } : { color: [a, c, g].map(
      (M) => Math.max(0, Math.min(255, Math.round(M))).toString(16).padStart(2, "0")
    ).join("").toUpperCase(), transparency: ln(m) };
  }
  let r = n.replace(/^#/, "");
  if (r.length === 3 && (r = r.split("").map((i) => i + i).join("")), r.length === 8) {
    const i = parseInt(r.slice(6, 8), 16) / 255;
    return { color: r.slice(0, 6).toUpperCase(), transparency: ln(i) };
  }
  return r.length === 6 ? { color: r.toUpperCase() } : { color: e };
}
function ln(t) {
  if (!(Number.isNaN(t) || t >= 1))
    return Math.round((1 - Math.max(0, Math.min(1, t))) * 100);
}
function Zo(t) {
  const { transparency: e } = Qo(t);
  return e === 100;
}
function Ia(t) {
  if (!t)
    return "";
  const e = String(t).replace(/<br\s*\/?>/gi, `
`).replace(/<\/(p|div|h[1-6]|li)>/gi, `
`);
  return (xr(e).textContent || "").replace(/ /g, " ").replace(/\n{3,}/g, `

`).replace(/\n+$/, "");
}
function $a(t) {
  if (typeof t.rotate == "number" && t.rotate)
    return t.rotate;
  if (typeof t.rotate == "string" && t.rotate.trim()) {
    const o = parseFloat(t.rotate);
    if (!Number.isNaN(o) && o)
      return o;
  }
  const e = t.transform;
  if (typeof e != "string")
    return 0;
  const n = e.match(/rotate\((-?[\d.]+)deg\)/i);
  return n ? parseFloat(n[1]) : 0;
}
const Ut = 15e3, Jo = 2, ti = 4e3;
function un(t) {
  return /^image\/svg\+xml/i.test(t);
}
async function Pa(t, e) {
  if (!t)
    return null;
  if (t.startsWith("data:")) {
    if (!un(t.slice(5)))
      return t;
    try {
      return await ee(ge(t, e), Ut, `drawing ${t.slice(0, 40)}`);
    } catch {
      return null;
    }
  }
  try {
    const n = await ee(fetch(t, { mode: "cors", signal: AbortSignal.timeout(Ut) }), Ut, `fetching ${t}`);
    if (n.ok) {
      const o = await n.blob(), r = await ni(o);
      return un(o.type) ? await ee(ge(r, e), Ut, `drawing ${t}`) : r;
    }
  } catch {
  }
  try {
    return await ee(ge(t, e), Ut, `loading ${t}`);
  } catch {
    return null;
  }
}
function Da(t) {
  var a;
  const [e, n] = String(t).split(","), o = ((a = e.match(/^data:([^;,]+)/)) == null ? void 0 : a[1]) || "application/octet-stream", r = e.includes(";base64") ? atob(n) : decodeURIComponent(n), i = new Uint8Array(r.length);
  for (let c = 0; c < r.length; c++)
    i[c] = r.charCodeAt(c);
  return new Blob([i], { type: o });
}
function ei({ width: t, height: e }) {
  const n = Math.min(Jo, ti / Math.max(t, e));
  return { width: Math.max(1, Math.round(t * n)), height: Math.max(1, Math.round(e * n)) };
}
function ni(t) {
  return new Promise((e, n) => {
    const o = new FileReader();
    o.onload = () => e(String(o.result)), o.onerror = n, o.readAsDataURL(t);
  });
}
function ge(t, e) {
  return new Promise((n, o) => {
    const r = new Image();
    r.crossOrigin = "anonymous", r.onload = () => {
      const i = document.createElement("canvas"), a = e != null && e.width && (e != null && e.height) ? ei(e) : null;
      i.width = (a == null ? void 0 : a.width) || r.naturalWidth || 1, i.height = (a == null ? void 0 : a.height) || r.naturalHeight || 1;
      const c = i.getContext("2d");
      if (!c)
        return o(new Error("no 2d context"));
      c.drawImage(r, 0, 0, i.width, i.height), n(i.toDataURL("image/png"));
    }, r.onerror = () => o(new Error(`could not load ${t}`)), r.src = t;
  });
}
function Ra(t, e) {
  return `${(t || "Untitled design").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled design"}.${e}`;
}
function ne(t) {
  return typeof t == "string" && t && !Zo(t) ? t : void 0;
}
const ri = Ae(function({ params: e, editing: n, cellRef: o, onCellDoubleClick: r, onCellContextMenu: i, onCellKeyDown: a, onCellBlur: c, spellCheck: g = !1 }, m) {
  var lt;
  const x = Vo(e), M = Math.max(0, Number(e.borderWidth) || 0), $ = M > 0 ? `${M}px ${e.borderStyle || "solid"} ${e.borderColor || "#000000ff"}` : "none", W = Math.max(0, Number(e.cellPadding) || 0), P = Number(e.fontSize) || 16, F = Number(e.lineHeight) || 1.4, Z = {
    fontFamily: (lt = e.fontClass) != null && lt.value ? `'${e.fontClass.value}'` : void 0,
    fontSize: P + "px",
    lineHeight: F,
    fontWeight: e.fontWeight || "normal",
    color: e.color,
    textAlign: e.textAlign || "left"
  };
  function J(ht) {
    return x.headerRow && ht === 0 ? ne(e.headerFill) : (x.headerRow ? ht - 1 : ht) % 2 === 1 ? ne(e.altFill) ?? ne(e.bodyFill) : ne(e.bodyFill);
  }
  return /* @__PURE__ */ wt("table", { ref: m, className: "w-table__grid", style: Z, children: [
    /* @__PURE__ */ E("colgroup", { children: x.colWidths.map((ht, rt) => /* @__PURE__ */ E("col", { style: { width: `${ht * 100}%` } }, rt)) }),
    /* @__PURE__ */ E("tbody", { children: x.cells.map((ht, rt) => {
      const tt = x.headerRow && rt === 0;
      return /* @__PURE__ */ E("tr", { children: ht.map((dt, ot) => {
        const ct = !!n && n.row === rt && n.col === ot;
        return /* @__PURE__ */ E(
          "td",
          {
            "data-row": rt,
            "data-col": ot,
            style: {
              border: $,
              padding: W + "px",
              background: J(rt),
              color: tt ? e.headerColor || e.color : void 0,
              fontWeight: tt ? "bold" : void 0,
              verticalAlign: "top",
              // The width comes from the <col>; without this a long
              // word would still push the column wider.
              overflowWrap: "anywhere"
            },
            onDoubleClick: r ? (pt) => r({ row: rt, col: ot }, pt) : void 0,
            onContextMenu: i ? (pt) => i({ row: rt, col: ot }, pt) : void 0,
            children: /* @__PURE__ */ E("div", { ref: o ? (pt) => o(rt, ot, pt) : void 0, className: "w-table__cell", style: { minHeight: P * F + "px" }, contentEditable: ct ? "plaintext-only" : void 0, spellCheck: ct ? g : !1, suppressContentEditableWarning: !0, onKeyDown: ct && a ? (pt) => a({ row: rt, col: ot }, pt) : void 0, onBlur: ct && c ? (pt) => c({ row: rt, col: ot }, pt.currentTarget) : void 0, dangerouslySetInnerHTML: { __html: dt || "" } })
          },
          ot
        );
      }) }, rt);
    }) })
  ] });
});
function oi({ params: t, parent: e, className: n, ...o }) {
  var x;
  const r = t, i = it(null);
  bt(() => {
    const M = i.current;
    M && (r.transform && (M.style.transform = r.transform), r.rotate && (M.style.transform += `translate(0px, 0px) rotate(${r.rotate}) scale(1, 1)`));
  }, [r.transform, r.rotate]);
  const a = `'${((x = r.fontClass) == null ? void 0 : x.value) || Sr}'`, c = Vr(a);
  function g(M) {
    const $ = M.target.closest("a[href]");
    $ && (M.preventDefault(), M.currentTarget.closest(".present") && (M.stopPropagation(), window.open($.href, "_blank", "noopener")));
  }
  const m = qt(
    () => Yr({
      text: r.text,
      curve: r.curve,
      fontSize: r.fontSize,
      lineHeight: r.lineHeight,
      letterSpacing: r.letterSpacing,
      fontFamily: a,
      fontWeight: r.fontWeight,
      fontStyle: r.fontStyle
    }),
    [r.text, r.curve, r.fontSize, r.lineHeight, r.letterSpacing, a, r.fontWeight, r.fontStyle, c]
  );
  return /* @__PURE__ */ wt(
    "div",
    {
      ...o,
      ref: i,
      className: n,
      onClick: g,
      style: {
        position: "absolute",
        left: r.left - e.left + "px",
        top: r.top - e.top + "px",
        width: r.width + "px",
        minWidth: r.fontSize + "px",
        minHeight: r.fontSize * r.lineHeight + "px",
        height: r.height + "px",
        lineHeight: r.fontSize * r.lineHeight + "px",
        letterSpacing: r.fontSize * r.letterSpacing / 100 + "px",
        fontSize: r.fontSize + "px",
        color: r.color,
        textAlign: r.textAlign,
        fontWeight: r.fontWeight,
        fontStyle: r.fontStyle,
        textDecoration: r.textDecoration,
        opacity: r.opacity,
        backgroundColor: r.backgroundColor,
        writingMode: r.writingMode,
        fontFamily: a
      },
      children: [
        r.textEffects ? r.textEffects.map((M, $) => m ? /* @__PURE__ */ E(He, { layout: m, className: "effect-text", style: { fontFamily: a, ...Ue(M) }, plain: !0 }, $ + "effect") : /* @__PURE__ */ E("div", { style: { fontFamily: a, ...Ue(M) }, className: "edit-text effect-text", spellCheck: !1, dangerouslySetInnerHTML: { __html: r.text ?? "" } }, $ + "effect")) : null,
        m ? /* @__PURE__ */ E(He, { layout: m, style: { fontFamily: a } }) : /* @__PURE__ */ E("div", { style: { fontFamily: a }, className: "edit-text", spellCheck: !1, dangerouslySetInnerHTML: { __html: r.text ?? "" } })
      ]
    }
  );
}
const ii = It(oi);
function si({ params: t, parent: e, className: n, ...o }) {
  const r = t, i = it(null), a = it(null);
  return bt(() => {
    r.rotate && i.current && (i.current.style.transform = `rotate(${r.rotate})`), r.transform && a.current && (a.current.style.transform = r.transform);
  }, [r.rotate, r.transform]), /* @__PURE__ */ wt(
    "div",
    {
      ...o,
      ref: i,
      className: n,
      style: {
        position: "absolute",
        left: r.left - e.left + "px",
        top: r.top - e.top + "px",
        width: r.width + "px",
        height: r.height + "px",
        opacity: r.opacity,
        filter: Qt(r.shadow)
      },
      children: [
        /* @__PURE__ */ E(
          "div",
          {
            style: {
              transform: r.flip ? `rotate${r.flip}(180deg)` : void 0,
              borderRadius: r.radius + "px",
              WebkitMaskImage: r.mask && Xt(r.mask) || "initial"
            },
            className: Dt("img__box", { mask: !!r.mask }),
            children: r.isNinePatch ? /* @__PURE__ */ E(
              "div",
              {
                ref: a,
                className: "target",
                style: {
                  border: `${r.height * r.sliceData.ratio / 2}px solid transparent`,
                  borderImage: `${Xt(r.imgUrl) ?? "none"} ${Number(r.sliceData.left) || 0} round`,
                  filter: Ge(r.filters)
                }
              }
            ) : /* @__PURE__ */ E(
              "img",
              {
                ref: a,
                className: "target",
                style: { transformOrigin: "center", filter: Ge(r.filters) },
                src: r.imgUrl,
                alt: r.decorative ? "" : String(r.alt || "")
              }
            )
          }
        ),
        /* @__PURE__ */ E(oo, { params: r })
      ]
    }
  );
}
const ai = It(si);
function ci({ params: t, parent: e, className: n, ...o }) {
  const r = t, i = it(null), a = it(!1), c = it(null);
  return bt(() => {
    if (i.current && (r.transform && (i.current.style.transform = r.transform), r.rotate && (i.current.style.transform += `rotate(${r.rotate})`)), a.current)
      return;
    a.current = !0;
    const g = window.Snap;
    if (!g || !r.svgUrl || !i.current)
      return;
    const m = g.parse(r.svgUrl), x = m.node.nodeType === Node.ELEMENT_NODE ? m.node : m.node.querySelector("svg");
    x && (x.removeAttribute("width"), x.removeAttribute("height"), x.setAttribute("style", "height: inherit;width: inherit;"), lo(co(x), r.uuid, r.colors || []), c.current = x, i.current.appendChild(x));
  }, [r.svgUrl, r.colors, r.rotate, r.transform]), bt(() => {
    c.current && po(c.current, Zt(r));
  }, [r.svgUrl, r.borderWidth, r.borderColor, r.borderStyle]), /* @__PURE__ */ E(
    "div",
    {
      ...o,
      ref: i,
      className: n,
      style: {
        position: "absolute",
        left: r.left - e.left + "px",
        top: r.top - e.top + "px",
        width: r.width + "px",
        height: r.height + "px",
        opacity: r.opacity,
        filter: Qt(r.shadow)
      }
    }
  );
}
const li = It(ci);
function le({ params: t, parent: e, className: n, radius: o, paint: r, child: i, children: a, ...c }) {
  const g = t, m = it(null);
  return bt(() => {
    g.rotate && m.current && (m.current.style.transform = `rotate(${g.rotate})`);
  }, [g.rotate]), /* @__PURE__ */ E(
    "div",
    {
      ...c,
      ref: m,
      className: n,
      style: {
        position: "absolute",
        left: g.left - e.left + "px",
        top: g.top - e.top + "px",
        width: g.width + "px",
        height: g.height + "px",
        opacity: g.opacity
      },
      children: r ?? /* @__PURE__ */ E(go, { params: g, radius: o })
    }
  );
}
function ui(t) {
  return /* @__PURE__ */ E(le, { ...t, radius: wo(yo(t.params)) });
}
const fi = It(ui);
function di(t) {
  return /* @__PURE__ */ E(le, { ...t, radius: bo });
}
const hi = It(di);
function pi(t) {
  return /* @__PURE__ */ E(le, { ...t, paint: /* @__PURE__ */ E(No, { params: t.params }) });
}
const gi = It(pi);
function mi(t) {
  return /* @__PURE__ */ E(le, { ...t, paint: /* @__PURE__ */ E(qo, { params: t.params }) });
}
const yi = It(mi);
function wi({ params: t, parent: e, children: n, className: o, ...r }) {
  const i = t;
  return /* @__PURE__ */ E(
    "div",
    {
      ...r,
      className: o,
      style: {
        position: "absolute",
        left: (i.left || 0) - ((e == null ? void 0 : e.left) || 0) + "px",
        top: (i.top || 0) - ((e == null ? void 0 : e.top) || 0) + "px",
        width: i.width + "px",
        height: i.height + "px",
        opacity: i.opacity
      },
      children: n
    }
  );
}
const bi = It(wi);
function vi({ params: t, parent: e, className: n, ...o }) {
  const r = t, i = it(null), a = Number(r.width), c = qt(
    () => ({
      type: r.dotType,
      color: r.dotColor,
      gradient: {
        type: "linear",
        rotation: r.dotRotation,
        colorStops: [
          { offset: 0, color: r.dotColor },
          { offset: 1, color: r.dotColorType === "single" ? r.dotColor : r.dotColor2 }
        ]
      }
    }),
    [r.dotType, r.dotColor, r.dotColor2, r.dotColorType, r.dotRotation]
  );
  return bt(() => {
    r.rotate && i.current && (i.current.style.transform = `rotate(${r.rotate})`);
  }, [r.rotate]), /* @__PURE__ */ E(
    "div",
    {
      ...o,
      ref: i,
      className: n,
      style: {
        position: "absolute",
        left: r.left - e.left + "px",
        top: r.top - e.top + "px",
        width: r.width + "px",
        height: r.height + "px",
        opacity: r.opacity
      },
      children: /* @__PURE__ */ E(Go, { className: "target", width: a, height: a, image: r.url, value: r.value, dotsOptions: c })
    }
  );
}
const xi = It(vi);
function _i({ params: t, parent: e, className: n, child: o, children: r, ...i }) {
  const a = t, c = it(null);
  return bt(() => {
    a.rotate && c.current && (c.current.style.transform = `rotate(${a.rotate})`);
  }, [a.rotate]), /* @__PURE__ */ E(
    "div",
    {
      ...i,
      ref: c,
      className: n,
      style: {
        position: "absolute",
        left: a.left - e.left + "px",
        top: a.top - e.top + "px",
        width: a.width + "px",
        height: a.height + "px",
        opacity: a.opacity
      },
      children: /* @__PURE__ */ E(ri, { params: a })
    }
  );
}
const Si = It(_i), ki = {
  "w-text": ii,
  "w-image": ai,
  "w-svg": li,
  "w-rect": fi,
  "w-ellipse": hi,
  "w-polygon": gi,
  "w-path": yi,
  "w-group": bi,
  "w-qrcode": xi,
  "w-table": Si
}, fn = ki, Mi = [
  { id: "none", name: "None", hint: "The next slide simply appears" },
  { id: "fade", name: "Fade", hint: "One slide dissolves into the next" },
  { id: "slide", name: "Slide", hint: "The next slide glides in over this one" },
  { id: "push", name: "Push", hint: "The next slide pushes this one off the screen" },
  { id: "zoom", name: "Zoom", hint: "The next slide grows into place" },
  { id: "wipe", name: "Wipe", hint: "The next slide is revealed from one edge" }
], Ai = 500, Ni = 150, Ci = 2500, se = "page-transition";
function Ei(t) {
  return Mi.find((e) => e.id === t);
}
function Ti(t) {
  const e = t == null ? void 0 : t.transition, n = Ei(e == null ? void 0 : e.type);
  if (!n || n.id === "none")
    return null;
  const o = Number(e == null ? void 0 : e.duration);
  return {
    type: n.id,
    duration: Number.isFinite(o) && o > 0 ? Math.min(Math.max(o, Ni), Ci) : Ai
  };
}
function Oi() {
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
const dn = "cubic-bezier(0.16, 1, 0.3, 1)", re = "cubic-bezier(0.65, 0, 0.35, 1)";
function Gn(t, e) {
  const n = e ? "100%" : "-100%", o = e ? "-100%" : "100%";
  switch (t) {
    case "fade":
      return { in: [{ opacity: 0 }, { opacity: 1 }], out: [{ opacity: 1 }, { opacity: 0 }], easing: re };
    case "slide":
      return {
        in: [
          { transform: `translateX(${n})`, opacity: 1 },
          { transform: "translateX(0)", opacity: 1 }
        ],
        out: [{ opacity: 1 }, { opacity: 1 }],
        easing: dn
      };
    case "push":
      return {
        in: [
          { transform: `translateX(${n})`, opacity: 1 },
          { transform: "translateX(0)", opacity: 1 }
        ],
        out: [
          { transform: "translateX(0)", opacity: 1 },
          { transform: `translateX(${o})`, opacity: 1 }
        ],
        easing: re
      };
    case "zoom":
      return {
        in: [
          { transform: "scale(0.86)", opacity: 0 },
          { transform: "scale(1)", opacity: 1 }
        ],
        out: [
          { transform: "scale(1)", opacity: 1 },
          { transform: "scale(1.06)", opacity: 0 }
        ],
        easing: dn
      };
    case "wipe":
      return {
        in: [
          { clipPath: e ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)", opacity: 1 },
          { clipPath: "inset(0 0 0 0)", opacity: 1 }
        ],
        out: [{ opacity: 1 }, { opacity: 1 }],
        easing: re
      };
    default:
      return { in: [], out: [], easing: re };
  }
}
function Ii(t, e, n, o) {
  const r = Gn(n.type, o);
  if (r.in.length === 0)
    return [];
  const i = { duration: n.duration, easing: r.easing, fill: "none" }, a = [], c = t.animate(r.in, i);
  if (c.id = se, a.push(c), e && r.out.length > 1) {
    const g = e.animate(r.out, i);
    g.id = se, a.push(g);
  }
  return a;
}
function hn(t) {
  for (const e of t)
    try {
      e.cancel();
    } catch {
    }
}
function La(t, e) {
  const n = Gn(e.type, !0);
  if (n.in.length === 0)
    return [];
  const o = { duration: e.duration, easing: n.easing, fill: "none" }, r = n.in.filter((c) => c.transform !== void 0).map((c) => ({ offset: c.offset, transform: c.transform })), i = n.in.map((c) => {
    const { transform: g, ...m } = c;
    return m;
  }), a = [];
  if (r.length > 1) {
    const c = t.animate(r, { ...o, composite: "add" });
    c.id = se, a.push(c);
  }
  if (i.some((c) => Object.keys(c).some((g) => g !== "offset"))) {
    const c = t.animate(i, { ...o, composite: "replace" });
    c.id = se, a.push(c);
  }
  return a;
}
const $i = "cubic-bezier(0.34, 1.56, 0.64, 1)", Lt = "cubic-bezier(0.16, 1, 0.3, 1)", me = "cubic-bezier(0.22, 0.61, 0.36, 1)", Xn = [
  // ---- Fade ---------------------------------------------------------------
  {
    id: "fade",
    name: "Fade",
    hint: "Simply fades into view",
    group: "Fade",
    duration: 500,
    easing: me,
    stops: [{ opacity: 0 }, { opacity: 1 }]
  },
  {
    id: "soft-focus",
    name: "Soft focus",
    hint: "Blurred at first, then sharpens",
    group: "Fade",
    duration: 750,
    easing: Lt,
    stops: [
      { opacity: 0, filter: "blur(12px)", transform: "scale(1.04)" },
      { opacity: 1, filter: "blur(0px)", transform: "none" }
    ]
  },
  // ---- Move ---------------------------------------------------------------
  {
    id: "rise",
    name: "Rise",
    hint: "Lifts up from below as it fades in",
    group: "Move",
    duration: 620,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "translateY(48px)" },
      { opacity: 1, transform: "none" }
    ]
  },
  {
    id: "drop",
    name: "Drop",
    hint: "Falls in from above and settles",
    group: "Move",
    duration: 620,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "translateY(-48px)" },
      { opacity: 1, transform: "none" }
    ]
  },
  {
    id: "slide-left",
    name: "In from left",
    hint: "Slides in from off the left edge",
    group: "Move",
    duration: 680,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "translateX(-80px)" },
      { opacity: 1, transform: "none" }
    ]
  },
  {
    id: "slide-right",
    name: "In from right",
    hint: "Slides in from off the right edge",
    group: "Move",
    duration: 680,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "translateX(80px)" },
      { opacity: 1, transform: "none" }
    ]
  },
  {
    id: "drift",
    name: "Drift",
    hint: "A slow cinematic push, good behind a title",
    group: "Move",
    duration: 1800,
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    stops: [
      { opacity: 0, transform: "translateY(18px) scale(1.08)" },
      { opacity: 1, offset: 0.35 },
      { opacity: 1, transform: "none" }
    ]
  },
  // ---- Scale --------------------------------------------------------------
  {
    id: "pop",
    name: "Pop",
    hint: "Springs up to size with a little overshoot",
    group: "Scale",
    duration: 480,
    easing: $i,
    stops: [
      { opacity: 0, transform: "scale(0.6)" },
      { opacity: 1, transform: "none" }
    ]
  },
  {
    id: "bounce",
    name: "Bounce",
    hint: "Lands, rebounds, then settles",
    group: "Scale",
    duration: 900,
    easing: "ease-out",
    stops: [
      { opacity: 0, transform: "scale(0.3)", offset: 0 },
      { opacity: 1, transform: "scale(1.12)", offset: 0.45 },
      { transform: "scale(0.94)", offset: 0.7 },
      { transform: "scale(1.02)", offset: 0.86 },
      { transform: "none", offset: 1 }
    ]
  },
  {
    id: "zoom-back",
    name: "Zoom back",
    hint: "Rushes in oversized and pulls back into place",
    group: "Scale",
    duration: 720,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "scale(1.8)" },
      { opacity: 1, transform: "none" }
    ]
  },
  // ---- Reveal -------------------------------------------------------------
  // These use clip-path in percentages, which resolves against the element's
  // own box, so a wipe covers exactly the element and nothing around it.
  {
    id: "wipe-right",
    name: "Wipe across",
    hint: "Uncovers left to right, like a highlighter",
    group: "Reveal",
    duration: 700,
    easing: me,
    stops: [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
  },
  {
    id: "wipe-up",
    name: "Wipe up",
    hint: "Uncovers from the bottom edge upwards",
    group: "Reveal",
    duration: 700,
    easing: me,
    stops: [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
  },
  {
    id: "unfold",
    name: "Unfold",
    hint: "Opens outwards from the middle",
    group: "Reveal",
    duration: 760,
    easing: Lt,
    stops: [
      { clipPath: "inset(0 50% 0 50%)", opacity: 0.2 },
      { clipPath: "inset(0 0 0 0)", opacity: 1 }
    ]
  },
  // ---- Flourish -----------------------------------------------------------
  {
    id: "flip",
    name: "Flip",
    hint: "Tips forward on its own horizontal axis",
    group: "Flourish",
    duration: 800,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "perspective(900px) rotateX(-80deg)" },
      { opacity: 1, transform: "perspective(900px) rotateX(0deg)" }
    ]
  },
  {
    id: "spin",
    name: "Spin",
    hint: "Whirls in from small, best kept for one thing",
    group: "Flourish",
    duration: 820,
    easing: Lt,
    stops: [
      { opacity: 0, transform: "rotate(-200deg) scale(0.2)" },
      { opacity: 1, transform: "none" }
    ]
  }
], Ba = ["Fade", "Move", "Scale", "Reveal", "Flourish"], Pi = new Map(Xn.map((t) => [t.id, t]));
function Yn(t) {
  return t && Pi.get(t) || null;
}
function Fa(t) {
  return Xn.filter((e) => e.group === t);
}
function za(t) {
  return { preset: t.id, duration: t.duration, delay: 0, start: "after" };
}
const ye = "ds-anim-pending";
function Di(t) {
  const e = t.map((o) => ({ ...o }));
  if (e.length === 0)
    return e;
  e[0].offset === void 0 && (e[0].offset = 0), e[e.length - 1].offset === void 0 && (e[e.length - 1].offset = 1);
  let n = 0;
  for (let o = 1; o < e.length; o++) {
    if (e[o].offset === void 0)
      continue;
    const r = o - n, i = e[n].offset, a = (e[o].offset - i) / r;
    for (let c = n + 1; c < o; c++)
      e[c].offset = i + a * (c - n);
    n = o;
  }
  return e;
}
const pn = ["opacity", "filter", "clipPath"];
function Ri(t) {
  const e = Di(t.stops), n = e.filter((r) => r.transform !== void 0).map((r) => ({ offset: r.offset, transform: r.transform })), o = e.filter((r) => pn.some((i) => r[i] !== void 0)).map((r) => {
    const i = { offset: r.offset };
    for (const a of pn)
      r[a] !== void 0 && (i[a] = r[a]);
    return i;
  });
  return { transform: n, style: o };
}
function Li(t, e, n = {}) {
  const o = {
    duration: n.duration ?? e.duration,
    delay: n.delay ?? 0,
    easing: e.easing,
    iterations: n.iterations ?? 1,
    fill: "backwards"
  }, { transform: r, style: i } = Ri(e), a = [];
  return r.length > 1 && a.push(t.animate(r, { ...o, composite: "add" })), i.length > 1 && a.push(t.animate(i, { ...o, composite: "replace" })), n.onFinish && a.length ? Promise.all(a.map((c) => c.finished.catch(() => {
  }))).then(() => {
    var c;
    return (c = n.onFinish) == null ? void 0 : c.call(n);
  }) : n.onFinish && n.onFinish(), a;
}
function Bi(t, e, n = 0) {
  const o = Yn(e == null ? void 0 : e.preset);
  return !o || !e ? [] : Li(t, o, {
    duration: e.duration,
    delay: e.delay + n
  });
}
function Fi(t) {
  for (const e of t)
    try {
      e.cancel();
    } catch {
    }
}
function zi(t) {
  const e = [[]], n = [];
  let o = 0, r = 0, i = 0, a = !0;
  for (const c of t) {
    const g = c.animation;
    if (!g || !Yn(g.preset)) {
      n.push(c);
      continue;
    }
    const m = Math.max(0, g.delay) + Math.max(0, g.duration);
    let x;
    a ? (x = 0, a = !1) : g.start === "click" ? (o += 1, e[o] = [], x = 0, i = 0) : g.start === "with" ? x = r : x = i, r = x, i = Math.max(i, x + m), e[o].push({ widget: c, step: o, at: x });
  }
  return { steps: e, immediate: n };
}
const qi = 3, Vn = 1, Wi = Sn, Hi = /* @__PURE__ */ new Set(["AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"]), Ui = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "TEXTAREA", "TITLE", "XMP", "IFRAME", "NOEMBED", "NOFRAMES"]), ji = {
  LI: /^LI$/,
  P: /^P$/,
  DD: /^(DD|DT)$/,
  DT: /^(DD|DT)$/,
  TD: /^(TD|TH)$/,
  TH: /^(TD|TH)$/,
  TR: /^(TD|TH|TR)$/
};
function Gi(t) {
  return { nodeType: qi, data: t, childNodes: [], nextSibling: null, parentNode: null };
}
function Xi(t) {
  if (!t)
    return null;
  const e = {};
  let n = 0;
  for (const o of t.split(";")) {
    const r = o.indexOf(":");
    if (r < 0)
      continue;
    const i = o.slice(0, r).trim().toLowerCase(), a = o.slice(r + 1).trim();
    a && (n++, i === "color" ? e.color = a : i === "font-weight" ? e.fontWeight = a : i === "font-style" ? e.fontStyle = a : i === "text-decoration-line" ? e.textDecorationLine = a : i === "text-decoration" && (e.textDecoration = a));
  }
  return e.length = n, e;
}
const Yi = /([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
function Vi(t) {
  const e = {};
  for (const n of t.matchAll(Yi)) {
    const o = n[1].toLowerCase();
    o !== "href" && o !== "color" && o !== "style" || (e[o] = Kt(n[2] ?? n[3] ?? n[4] ?? ""));
  }
  return e;
}
function Ki(t, e) {
  return {
    nodeType: Vn,
    tagName: t,
    childNodes: [],
    nextSibling: null,
    parentNode: null,
    getAttribute: (n) => e[n.toLowerCase()] ?? null,
    style: Xi(e.style)
  };
}
const Qi = /[a-zA-Z]/, Zi = /[a-zA-Z0-9:-]/;
function Ji(t, e) {
  let n = e + 1;
  const o = t[n] === "/";
  if (o && n++, !Qi.test(t[n] ?? ""))
    return { kind: "text" };
  const r = n;
  for (; n < t.length && Zi.test(t[n]); )
    n++;
  const i = t.slice(r, n).toUpperCase(), a = n;
  let c = "";
  for (; n < t.length; n++) {
    const m = t[n];
    if (c) {
      m === c && (c = "");
      continue;
    }
    if (m === '"' || m === "'")
      c = m;
    else if (m === ">")
      break;
  }
  if (n >= t.length)
    return { kind: "eof" };
  const g = t.slice(a, n);
  return { kind: "tag", close: o, name: i, attrs: g, selfClosing: g.trimEnd().endsWith("/"), end: n + 1 };
}
function Kn(t) {
  const e = { nodeType: Vn, tagName: "BODY", childNodes: [], nextSibling: null, parentNode: null }, n = [e], o = () => n[n.length - 1], r = (g) => {
    const m = o(), x = m.childNodes[m.childNodes.length - 1];
    x && (x.nextSibling = g), g.parentNode = m, m.childNodes.push(g);
  }, i = (g) => {
    g && r(Gi(Kt(g)));
  }, a = String(t ?? "");
  let c = 0;
  for (; c < a.length; ) {
    const g = a.indexOf("<", c);
    if (g < 0) {
      i(a.slice(c));
      break;
    }
    if (i(a.slice(c, g)), a.startsWith("<!--", g)) {
      const W = a.startsWith(">", g + 4) ? g + 5 : a.startsWith("->", g + 4) ? g + 6 : 0;
      if (W) {
        c = W;
        continue;
      }
      const P = a.indexOf("-->", g + 4);
      c = P < 0 ? a.length : P + 3;
      continue;
    }
    if (a.startsWith("<!", g) || a.startsWith("<?", g)) {
      const W = a.indexOf(">", g);
      c = W < 0 ? a.length : W + 1;
      continue;
    }
    const m = Ji(a, g);
    if (m.kind === "text") {
      i("<"), c = g + 1;
      continue;
    }
    if (m.kind === "eof") {
      i(a.slice(g));
      break;
    }
    c = m.end;
    const x = m.name;
    if (m.close) {
      const W = n.findIndex((P) => P.tagName === x);
      W > 0 && (n.length = W);
      continue;
    }
    const M = ji[x];
    M && n.length > 1 && M.test(o().tagName ?? "") && n.pop();
    const $ = Ki(x, Vi(m.attrs));
    if (r($), Ui.has(x)) {
      const W = a.toUpperCase().indexOf(`</${x}`, c);
      c = W < 0 ? a.length : a.indexOf(">", W) + 1 || a.length;
      continue;
    }
    !Hi.has(x) && !m.selfClosing && n.length < Wi && n.push($);
  }
  return e;
}
function gn(t, e = "none") {
  return ce(Te(Kn(String(t ?? ""))), e);
}
function qa(t) {
  return Te(Kn(String(t ?? ""))).map((e) => e.map((n) => n.text).join("")).join(`
`);
}
const ts = Ae(function({ page: e, maxWidth: n, maxHeight: o, animated: r = !1 }, i) {
  const a = it(null), [c, g] = St(() => /* @__PURE__ */ new Set()), m = it([]), x = it([]), M = e.global, $ = e.layers || [], W = qt(() => {
    const { width: tt, height: dt } = M;
    return !tt || !dt || !n || !o ? 0 : Math.min(n / tt, o / dt);
  }, [M.width, M.height, n, o]), P = qt(() => r ? zi($) : null, [r, $]), F = Math.max(1, (P == null ? void 0 : P.steps.length) ?? 1), U = qt(() => new Set(((P == null ? void 0 : P.steps.flat()) ?? []).map((tt) => tt.widget.uuid)), [P]), Z = Tt(() => {
    m.current.forEach((tt) => window.clearTimeout(tt)), m.current = [], Fi(x.current), x.current = [];
  }, []);
  bt(() => Z, [Z]);
  const J = Tt(
    (tt, dt) => {
      if (!r)
        return;
      Z();
      const ot = /* @__PURE__ */ new Set();
      for (let ct = 0; ct <= tt; ct++)
        for (const pt of (P == null ? void 0 : P.steps[ct]) || [])
          dt && ct === tt || ot.add(pt.widget.uuid);
      if (g(ot), !!dt)
        for (const ct of (P == null ? void 0 : P.steps[tt]) || []) {
          const pt = ct.widget.uuid;
          m.current.push(
            window.setTimeout(() => {
              var Ot;
              const Nt = (Ot = a.current) == null ? void 0 : Ot.querySelector(`[data-anim="${pt}"]`);
              Nt && (Nt.classList.remove(ye), ot.add(pt), x.current.push(...Bi(Nt, ct.widget.animation)));
            }, ct.at)
          );
        }
    },
    [r, P, Z]
  );
  xn(i, () => ({ stepCount: F, showUpTo: J }), [F, J]);
  const lt = (tt) => r && U.has(tt) && !c.has(tt), ht = $.filter((tt) => tt.parent === M.uuid && !tt.hidden), rt = (tt) => $.filter((dt) => dt.parent === tt && !dt.hidden);
  return /* @__PURE__ */ E("div", { ref: a, className: "slide", style: { width: M.width * W + "px", height: M.height * W + "px" }, children: /* @__PURE__ */ E(
    "div",
    {
      className: "slide__page",
      style: {
        width: M.width + "px",
        height: M.height + "px",
        transform: `scale(${W})`,
        opacity: M.opacity,
        ...Wr(M)
      },
      children: ht.map((tt) => {
        const dt = fn[tt.type];
        return dt ? /* @__PURE__ */ E(dt, { params: tt, parent: M, "data-anim": r ? tt.uuid : void 0, className: lt(tt.uuid) ? ye : void 0, children: tt.isContainer ? rt(tt.uuid).map((ot) => {
          const ct = fn[ot.type];
          return ct ? /* @__PURE__ */ E(ct, { params: ot, parent: tt, "data-anim": r ? ot.uuid : void 0, className: lt(ot.uuid) ? ye : void 0 }, ot.uuid) : null;
        }) : null }, tt.uuid) : null;
      })
    }
  ) });
}), Vt = It(ts), es = "design-presenter";
function Qn() {
  if (typeof BroadcastChannel > "u")
    return null;
  try {
    return new BroadcastChannel(es);
  } catch {
    return null;
  }
}
const ns = "designPresenterView";
function rs() {
  const t = window.open("", ns, "width=1200,height=780,menubar=no,toolbar=no,location=no");
  if (!t)
    return null;
  const e = t.document;
  e.head.replaceChildren(), e.body.replaceChildren(), e.title = "Presenter view";
  const n = e.createElement("meta");
  n.setAttribute("charset", "utf-8"), e.head.appendChild(n);
  const o = e.createElement("base");
  o.href = window.location.href, e.head.appendChild(o);
  for (const i of document.querySelectorAll('style, link[rel="stylesheet"]'))
    e.head.appendChild(e.importNode(i, !0));
  e.documentElement.className = document.documentElement.className, e.body.style.margin = "0";
  const r = e.createElement("div");
  return r.className = "presenter-mount", e.body.appendChild(r), { window: t, mount: r };
}
function Zn({ startedAt: t, onReset: e, className: n = "present__timer", title: o = "Time on this presentation — click to reset" }) {
  const [r, i] = St(0);
  bt(() => {
    i(Math.max(0, Math.floor((Date.now() - t) / 1e3)));
    const x = setInterval(() => i(Math.max(0, Math.floor((Date.now() - t) / 1e3))), 1e3);
    return () => clearInterval(x);
  }, [t]);
  const a = Math.floor(r / 3600), c = Math.floor(r % 3600 / 60), g = r % 60, m = (x) => String(x).padStart(2, "0");
  return /* @__PURE__ */ E("button", { type: "button", className: n, title: o, onClick: e, children: a > 0 ? `${a}:${m(c)}:${m(g)}` : `${m(c)}:${m(g)}` });
}
function mn(t) {
  const [e, n] = St({ width: 0, height: 0 });
  return bt(() => {
    const o = t.current, r = o == null ? void 0 : o.ownerDocument.defaultView;
    if (!o || !r)
      return;
    const i = () => n({ width: o.clientWidth, height: o.clientHeight });
    i();
    const a = r.ResizeObserver;
    if (a) {
      const c = new a(i);
      return c.observe(o), () => c.disconnect();
    }
    return r.addEventListener("resize", i), () => r.removeEventListener("resize", i);
  }, [t]), e;
}
const os = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter"], is = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"];
function ss({ pages: t }) {
  var P;
  const [e, n] = St({ index: 0, startedAt: Date.now(), live: !0 }), o = it(null), r = it(null), i = it(null), a = mn(r), c = mn(i), g = it(null);
  bt(() => {
    const F = Qn();
    if (g.current = F, !!F)
      return F.onmessage = (U) => {
        const Z = U.data;
        (Z == null ? void 0 : Z.kind) === "state" && n(Z);
      }, F.postMessage({ kind: "hello" }), () => {
        F.close(), g.current = null;
      };
  }, []);
  const m = (F) => {
    var U;
    return (U = g.current) == null ? void 0 : U.postMessage(F);
  };
  bt(() => {
    var Z;
    const F = (Z = o.current) == null ? void 0 : Z.ownerDocument.defaultView;
    if (!F)
      return;
    const U = (J) => {
      os.includes(J.key) ? (J.preventDefault(), m({ kind: "step", by: 1 })) : is.includes(J.key) ? (J.preventDefault(), m({ kind: "step", by: -1 })) : J.key === "Escape" && (J.preventDefault(), F.close());
    };
    return F.addEventListener("keydown", U), () => F.removeEventListener("keydown", U);
  }, []);
  const x = Math.max(0, Math.min(e.index, t.length - 1)), M = t[x], $ = t[x + 1], W = String(((P = M == null ? void 0 : M.global) == null ? void 0 : P.notes) ?? "").trim();
  return (
    // A React portal's events bubble through the React tree rather than the DOM,
    // so without this a click in this window would also be a click on the stage
    // in the window behind, and turn the page.
    /* @__PURE__ */ wt("div", { className: "presenter", ref: o, onClick: (F) => F.stopPropagation(), children: [
      /* @__PURE__ */ wt("div", { className: "presenter__bar", children: [
        /* @__PURE__ */ wt("span", { className: "presenter__count", children: [
          "Slide ",
          /* @__PURE__ */ E("b", { children: x + 1 }),
          " of ",
          t.length
        ] }),
        /* @__PURE__ */ E(Zn, { startedAt: e.startedAt, onReset: () => m({ kind: "restartClock" }), className: "presenter__timer", title: "Time on this presentation — click to start it again" }),
        /* @__PURE__ */ E("span", { className: "presenter__spacer" }),
        /* @__PURE__ */ E("button", { type: "button", className: "presenter__btn", onClick: () => m({ kind: "step", by: -1 }), disabled: !e.live, children: "Back" }),
        /* @__PURE__ */ E("button", { type: "button", className: "presenter__btn presenter__btn--go", onClick: () => m({ kind: "step", by: 1 }), disabled: !e.live, children: "Next" })
      ] }),
      e.live ? null : /* @__PURE__ */ E("div", { className: "presenter__ended", children: "The presentation has ended. You can close this window." }),
      /* @__PURE__ */ wt("div", { className: "presenter__body", children: [
        /* @__PURE__ */ E("div", { className: "presenter__now", ref: r, children: M ? /* @__PURE__ */ E(Vt, { page: M, maxWidth: a.width, maxHeight: a.height }) : null }),
        /* @__PURE__ */ wt("div", { className: "presenter__side", children: [
          /* @__PURE__ */ E("div", { className: "presenter__label", children: "Coming next" }),
          /* @__PURE__ */ E("div", { className: "presenter__next", ref: i, children: $ ? /* @__PURE__ */ E(Vt, { page: $, maxWidth: c.width, maxHeight: c.height }) : /* @__PURE__ */ E("span", { className: "presenter__last", children: "Last slide" }) }),
          /* @__PURE__ */ E("div", { className: "presenter__label", children: "Your notes" }),
          /* @__PURE__ */ E("div", { className: W ? "presenter__notes" : "presenter__notes is-empty", children: W || "Nothing written for this page. Notes are typed in the drawer under the canvas." })
        ] })
      ] })
    ] })
  );
}
const as = 2600, cs = 40, ls = 420, us = 50, yn = 2, fs = ["ArrowRight", "ArrowDown", "PageDown", " ", "Spacebar", "Enter"], ds = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p", "P"];
function hs(t, e) {
  var o;
  const n = (o = t == null ? void 0 : t.global) == null ? void 0 : o.name;
  return n && n !== "New page" ? n : `Page ${e + 1}`;
}
const ps = Ae(function({ pages: e, currentPage: n, onExit: o, container: r }, i) {
  var At, $t;
  const a = it({ currentPage: n, onExit: o });
  a.current = { currentPage: n, onExit: o };
  const [c, g] = St(!1), [m, x] = St(0), [M, $] = St(!1), [W, P] = St(!1), [F, U] = St(!1), [Z, J] = St(""), [lt, ht] = St({ width: 0, height: 0 }), [rt, tt] = St(0), [dt, ot] = St(!1), [ct, pt] = St(!1), [Nt, Ot] = St(null), [O, T] = St(() => /* @__PURE__ */ new Set()), [N, A] = St(0), [_, I] = St(1), z = Math.max(0, _ - 1), L = N < z, H = it(null), vt = it(null), S = it(/* @__PURE__ */ new Map()), s = it(/* @__PURE__ */ new Map()), u = it([]), l = it(null), h = it(null), w = it(null), y = it({ index: 0, startedAt: 0, live: !1 }), k = it(void 0), d = it(0), p = it(0), f = it(!1), b = it(void 0), v = it({ isOpen: c, index: m, isOverview: M, curtain: Z, buildStep: N, lastBuildStep: z, hasBuildsLeft: L, pages: e });
  v.current = { isOpen: c, index: m, isOverview: M, curtain: Z, buildStep: N, lastBuildStep: z, hasBuildsLeft: L, pages: e };
  const D = Tt((R) => Math.max(0, Math.min(R, v.current.pages.length - 1)), []), B = Tt(() => {
    P(!1), clearTimeout(k.current), k.current = setTimeout(() => {
      v.current.isOverview || P(!0);
    }, as);
  }, []), C = Tt((R) => {
    T((G) => {
      let et = null;
      for (let gt = R - yn; gt <= R + yn; gt++)
        gt < 0 || gt >= v.current.pages.length || G.has(gt) || (et = et ?? new Set(G), et.add(gt));
      return et ?? G;
    });
  }, []), q = Tt(
    (R, { closeOverview: G = !1 } = {}) => {
      J(""), x(D(R)), G && $(!1);
    },
    [D]
  ), j = Tt(() => {
    var R;
    if (v.current.hasBuildsLeft) {
      J("");
      const G = v.current.buildStep + 1;
      A(G), (R = S.current.get(v.current.index)) == null || R.showUpTo(G, !0);
      return;
    }
    v.current.index < v.current.pages.length - 1 && q(v.current.index + 1);
  }, [q]), Y = Tt(() => {
    var R;
    if (v.current.buildStep > 0) {
      J("");
      const G = v.current.buildStep - 1;
      A(G), (R = S.current.get(v.current.index)) == null || R.showUpTo(G, !1);
      return;
    }
    v.current.index > 0 && q(v.current.index - 1);
  }, [q]), st = Tt(() => {
    const R = vt.current;
    R && ht({ width: R.clientWidth, height: R.clientHeight });
  }, []), X = Tt(async () => {
    const R = H.current;
    if (!(!R || document.fullscreenElement)) {
      try {
        await R.requestFullscreen();
      } catch {
      }
      U(!!document.fullscreenElement);
    }
  }, []), K = Tt(() => {
    document.fullscreenElement && (f.current = !0, document.exitFullscreen().catch(() => {
    }));
  }, []), V = Tt(() => {
    document.fullscreenElement ? K() : X();
  }, [X, K]), Q = Tt(() => {
    const R = h.current;
    h.current = null, Ot(null), pt(!1), R && !R.window.closed && R.window.close();
  }, []), Mt = Tt(() => {
    const R = h.current;
    if (R && !R.window.closed) {
      R.window.focus();
      return;
    }
    f.current = !0, setTimeout(() => {
      f.current = !1;
    }, 600);
    const G = rs();
    if (!G) {
      h.current = null, Ot(null), pt(!0), ot(!0);
      return;
    }
    pt(!1), h.current = G, Ot(G.mount), G.window.addEventListener("pagehide", () => {
      var et;
      ((et = h.current) == null ? void 0 : et.window) === G.window && (h.current = null, Ot(null));
    });
  }, []), ft = Tt(() => {
    var R, G;
    v.current.isOpen && (g(!1), $(!1), J(""), ot(!1), Q(), clearTimeout(k.current), K(), (G = (R = a.current).onExit) == null || G.call(R, v.current.index));
  }, [K, Q]), nt = Tt(
    (R) => {
      var et, gt;
      if (v.current.isOpen || v.current.pages.length === 0)
        return;
      const G = D(R ?? ((gt = (et = a.current).currentPage) == null ? void 0 : gt.call(et)) ?? 0);
      b.current = void 0, x(G), $(!1), J(""), ot(!1), P(!1), tt(Date.now()), T(/* @__PURE__ */ new Set()), C(G), g(!0), B();
    },
    [D, C, B]
  );
  xn(i, () => ({ open: nt, close: ft }), [nt, ft]), bt(() => {
    const R = Qn();
    if (w.current = R, !!R)
      return R.onmessage = (G) => {
        const et = G.data;
        if (et) {
          if (et.kind === "hello") {
            R.postMessage({ kind: "state", ...y.current });
            return;
          }
          v.current.isOpen && (et.kind === "step" ? et.by > 0 ? j() : Y() : et.kind === "restartClock" && tt(Date.now()));
        }
      }, () => {
        R.close(), w.current = null;
      };
  }, [j, Y]), bt(() => {
    var R;
    y.current = { index: m, startedAt: rt, live: c }, (R = w.current) == null || R.postMessage({ kind: "state", ...y.current });
  }, [m, rt, c]), bt(() => {
    const R = () => Q();
    return window.addEventListener("pagehide", R), () => {
      window.removeEventListener("pagehide", R), Q();
    };
  }, [Q]), bt(() => {
    var R;
    c && ((R = H.current) == null || R.focus(), st(), X());
  }, [c, st, X]), bt(() => {
    if (!c)
      return;
    const R = (ut) => {
      const xt = () => {
        ut.preventDefault(), ut.stopPropagation(), B();
      };
      if (ut.key === "Escape") {
        xt(), v.current.isOverview ? $(!1) : v.current.curtain ? J("") : ft();
        return;
      }
      const Et = () => v.current.curtain ? (J(""), !0) : !1;
      if (fs.includes(ut.key)) {
        xt(), Et() || j();
        return;
      }
      if (ds.includes(ut.key)) {
        xt(), Et() || Y();
        return;
      }
      switch (ut.key) {
        case "Home":
          xt(), q(0);
          break;
        case "End":
          xt(), q(v.current.pages.length - 1);
          break;
        case "f":
        case "F":
          xt(), V();
          break;
        case "b":
        case "B":
          xt(), J((Ct) => Ct === "black" ? "" : "black");
          break;
        case "w":
        case "W":
          xt(), J((Ct) => Ct === "white" ? "" : "white");
          break;
        case "g":
        case "G":
        case "o":
        case "O":
          xt(), $((Ct) => !Ct);
          break;
        case "n":
        case "N":
          xt(), ot((Ct) => !Ct);
          break;
        case "s":
        case "S":
          xt(), Mt();
          break;
        default:
          /^[1-9]$/.test(ut.key) && (xt(), q(Number(ut.key) - 1));
      }
    }, G = () => {
      if (U(!!document.fullscreenElement), requestAnimationFrame(st), !document.fullscreenElement) {
        if (f.current) {
          f.current = !1;
          return;
        }
        ft();
      }
    }, et = (ut) => {
      if (ut.preventDefault(), v.current.isOverview)
        return;
      const xt = Date.now();
      if (xt - d.current < ls)
        return;
      const Et = Math.abs(ut.deltaY) > Math.abs(ut.deltaX) ? ut.deltaY : ut.deltaX;
      Math.abs(Et) < cs || (d.current = xt, Et > 0 ? j() : Y());
    }, gt = H.current;
    return window.addEventListener("keydown", R, !0), window.addEventListener("resize", st), document.addEventListener("fullscreenchange", G), gt == null || gt.addEventListener("wheel", et, { passive: !1 }), () => {
      window.removeEventListener("keydown", R, !0), window.removeEventListener("resize", st), document.removeEventListener("fullscreenchange", G), gt == null || gt.removeEventListener("wheel", et);
    };
  }, [c, ft, q, j, Y, V, st, B, Mt]), bt(() => {
    var Et;
    if (!c) {
      l.current = null;
      return;
    }
    const R = l.current;
    if (l.current = m, hn(u.current), u.current = [], R === null || R === m)
      return;
    const G = Ti((Et = v.current.pages[m]) == null ? void 0 : Et.global), et = s.current.get(m), gt = s.current.get(R) ?? null;
    if (!G || !et || Oi())
      return;
    et.style.zIndex = "2", gt && (gt.style.zIndex = "1");
    const ut = Ii(et, gt, G, m > R);
    u.current = ut;
    const xt = () => {
      et.style.zIndex = "", gt && (gt.style.zIndex = "");
    };
    return Promise.all(ut.map((Ct) => Ct.finished.catch(() => {
    }))).then(xt), () => {
      hn(ut), xt();
    };
  }, [m, c]), bt(() => {
    if (!c)
      return;
    C(m);
    const R = b.current === void 0 || m > b.current;
    b.current = m;
    const G = requestAnimationFrame(() => {
      const et = S.current.get(m), gt = (et == null ? void 0 : et.stepCount) ?? 1, ut = R ? 0 : Math.max(0, gt - 1);
      I(gt), A(ut), et == null || et.showUpTo(ut, R);
    });
    return () => cancelAnimationFrame(G);
  }, [m, c, C, O]);
  const mt = e.length < 2 ? 100 : m / (e.length - 1) * 100, at = String((($t = (At = e[m]) == null ? void 0 : At.global) == null ? void 0 : $t.notes) ?? "").trim();
  function yt() {
    if (!v.current.isOverview) {
      if (v.current.curtain) {
        J("");
        return;
      }
      j();
    }
  }
  function _t(R) {
    var G;
    p.current = ((G = R.changedTouches[0]) == null ? void 0 : G.clientX) ?? 0, B();
  }
  function kt(R) {
    var et;
    const G = (((et = R.changedTouches[0]) == null ? void 0 : et.clientX) ?? 0) - p.current;
    Math.abs(G) < us || (G < 0 ? j() : Y());
  }
  return c ? $e(
    /* @__PURE__ */ wt("div", { ref: H, className: Dt("present", { "present--idle": W && !M }), tabIndex: -1, onMouseMove: B, onClick: yt, onTouchStart: _t, onTouchEnd: kt, children: [
      /* @__PURE__ */ E("div", { ref: vt, className: "present__stage", children: e.map((R, G) => /* @__PURE__ */ E(
        "div",
        {
          ref: (et) => {
            et ? s.current.set(G, et) : s.current.delete(G);
          },
          className: Dt("present__slot", { "is-current": G === m }),
          "aria-hidden": G !== m,
          children: O.has(G) ? /* @__PURE__ */ E(
            Vt,
            {
              ref: (et) => {
                et ? S.current.set(G, et) : S.current.delete(G);
              },
              page: R,
              maxWidth: lt.width,
              maxHeight: lt.height,
              animated: !0
            }
          ) : null
        },
        "slide" + G
      )) }),
      Z ? /* @__PURE__ */ E("div", { className: `present__curtain present__curtain--${Z}` }) : null,
      dt ? /* @__PURE__ */ wt("div", { className: "present__notes", onClick: (R) => R.stopPropagation(), children: [
        /* @__PURE__ */ wt("div", { className: "present__notes-head", children: [
          /* @__PURE__ */ wt("span", { children: [
            "Speaker notes · ",
            m + 1,
            " / ",
            e.length
          ] }),
          /* @__PURE__ */ E("button", { type: "button", className: "present__notes-close", onClick: () => ot(!1), children: "Hide (N)" })
        ] }),
        ct ? /* @__PURE__ */ E("p", { className: "present__notes-blocked", children: "Your browser blocked the presenter window. Allow pop-ups for this site to put your notes on a second screen." }) : null,
        /* @__PURE__ */ E("div", { className: Dt("present__notes-body", { "present__notes-empty": !at }), children: at || "No notes for this page." })
      ] }) : null,
      M ? /* @__PURE__ */ E(
        "div",
        {
          className: "present__overview",
          onClick: (R) => {
            R.target === R.currentTarget && (R.stopPropagation(), $(!1));
          },
          children: /* @__PURE__ */ E("div", { className: "present__overview-grid", children: e.map((R, G) => /* @__PURE__ */ wt(
            "button",
            {
              type: "button",
              className: Dt("present__thumb", { "is-current": G === m }),
              onClick: (et) => {
                et.stopPropagation(), q(G, { closeOverview: !0 });
              },
              children: [
                /* @__PURE__ */ E(Vt, { page: R, maxWidth: 248, maxHeight: 140 }),
                /* @__PURE__ */ E("span", { className: "present__thumb-num", children: G + 1 }),
                /* @__PURE__ */ E("span", { className: "present__thumb-name", children: hs(R, G) })
              ]
            },
            "thumb" + G
          )) })
        }
      ) : null,
      /* @__PURE__ */ wt(
        "div",
        {
          className: "present__chrome",
          onClick: (R) => R.stopPropagation(),
          onMouseMove: (R) => {
            R.stopPropagation(), B();
          },
          children: [
            /* @__PURE__ */ wt("div", { className: "present__bar", children: [
              /* @__PURE__ */ E("button", { type: "button", className: "present__btn", title: "Previous (←)", disabled: m === 0 && N === 0, onClick: Y, children: /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "M15 5 8 12l7 7" }) }) }),
              /* @__PURE__ */ wt("button", { type: "button", className: "present__counter", title: "All slides (G)", onClick: () => $((R) => !R), children: [
                /* @__PURE__ */ E("b", { children: m + 1 }),
                " / ",
                e.length
              ] }),
              /* @__PURE__ */ E("button", { type: "button", className: "present__btn", title: L ? "Next build (→)" : "Next slide (→)", disabled: m >= e.length - 1 && !L, onClick: j, children: /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "m9 5 7 7-7 7" }) }) }),
              /* @__PURE__ */ E("span", { className: "present__divider" }),
              /* @__PURE__ */ E(Zn, { startedAt: rt, onReset: () => tt(Date.now()) }),
              /* @__PURE__ */ E("button", { type: "button", className: Dt("present__btn", { "is-on": dt }), title: "Speaker notes (N)", onClick: () => ot((R) => !R), children: /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4.5" }) }) }),
              /* @__PURE__ */ E("button", { type: "button", className: Dt("present__btn", "present__btn--window", { "is-on": !!Nt }), title: "Presenter view (S)", onClick: Mt, children: /* @__PURE__ */ wt("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
                /* @__PURE__ */ E("rect", { x: "2", y: "4.5", width: "12", height: "9", rx: "1" }),
                /* @__PURE__ */ E("path", { d: "M17 8.5h5v11h-9v-6" })
              ] }) }),
              /* @__PURE__ */ E("button", { type: "button", className: Dt("present__btn", { "is-on": M }), title: "All slides (G)", onClick: () => $((R) => !R), children: /* @__PURE__ */ wt("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: [
                /* @__PURE__ */ E("rect", { x: "3", y: "4", width: "7", height: "7", rx: "1" }),
                /* @__PURE__ */ E("rect", { x: "14", y: "4", width: "7", height: "7", rx: "1" }),
                /* @__PURE__ */ E("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
                /* @__PURE__ */ E("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
              ] }) }),
              /* @__PURE__ */ E("button", { type: "button", className: "present__btn", title: F ? "Leave full screen (F)" : "Full screen (F)", onClick: V, children: F ? /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" }) }) : /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" }) }) }),
              /* @__PURE__ */ E("button", { type: "button", className: "present__btn present__btn--exit", title: "End the presentation (Esc)", onClick: ft, children: /* @__PURE__ */ E("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ E("path", { d: "M6 6l12 12M18 6 6 18" }) }) })
            ] }),
            /* @__PURE__ */ E("div", { className: "present__progress", children: /* @__PURE__ */ E("span", { style: { width: mt + "%" } }) })
          ]
        }
      ),
      Nt ? $e(/* @__PURE__ */ E(ss, { pages: e }), Nt) : null
    ] }),
    (r == null ? void 0 : r()) ?? Ne() ?? document.body
  ) : null;
}), Me = "page", gs = /^[A-Za-z0-9 _-]{1,64}$/, ms = {
  "w-text": ["fontClass.value"],
  "w-table": ["fontClass.value"]
}, ys = {
  "w-image": ["alt"],
  "w-svg": ["alt"],
  "w-qrcode": ["alt"]
}, ws = 500, bs = {
  // `backgroundColor` is the page's colour; `backgroundGradient` is written
  // whole into `background-image`, and is a full CSS gradient string.
  page: ["backgroundColor", "backgroundGradient"],
  "w-text": [
    "color",
    "backgroundColor",
    // A text effect is a stack of layers, each with a fill, an outline and a
    // shadow. A fill is a colour, a gradient held as stops, or a tile whose
    // palette is written into the tile's SVG.
    "textEffects[].filling.color",
    "textEffects[].filling.gradient.stops[].color",
    "textEffects[].filling.imageContent.pattern.colors[]",
    "textEffects[].stroke.color",
    "textEffects[].shadow.color"
  ],
  "w-image": ["borderColor", "shadow.color"],
  // `colors` fills the `{{colors[n]}}` slots in the shape's own markup.
  "w-svg": ["colors[]", "borderColor", "shadow.color"],
  "w-rect": ["color", "borderColor", "shadow.color"],
  "w-ellipse": ["color", "borderColor", "shadow.color"],
  "w-polygon": ["color", "borderColor", "shadow.color"],
  "w-path": ["color", "borderColor", "shadow.color"],
  "w-group": [],
  "w-qrcode": ["dotColor", "dotColor2"],
  "w-table": ["color", "headerColor", "borderColor", "headerFill", "bodyFill", "altFill"]
  // Every type named, even with nothing to list, so that a widget added to
  // WIDGET_TYPES and not here fails the build rather than going unchecked.
}, vs = {
  "w-text": ["textEffects[].filling.gradient.angle", "textEffects[].filling.gradient.stops[].offset"]
}, xs = new Set(
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent currentcolor none".split(
    " "
  )
), _s = 2e3, ae = "[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?", Ss = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, ks = new RegExp(`^(?:rgba?|hsla?)\\(\\s*${ae}(?:%|deg|turn|rad|grad)?(?:\\s*[,/]?\\s*${ae}%?){2,3}\\s*\\)$`, "i"), Ms = new RegExp(`^${ae}(?:deg|turn|rad|grad)$`, "i"), As = new RegExp(`^${ae}(?:%|px|em|rem)?$`, "i"), Ns = /^(repeating-)?(linear|radial)-gradient\((.*)\)$/is, Cs = /* @__PURE__ */ new Set(["to", "at", "left", "right", "top", "bottom", "center", "circle", "ellipse", "closest-side", "closest-corner", "farthest-side", "farthest-corner"]);
function Jn(t) {
  const e = t.trim();
  return !e || e.length > 200 ? !1 : Ss.test(e) || ks.test(e) ? !0 : xs.has(e.toLowerCase());
}
function Ie(t, e) {
  const n = [];
  let o = 0, r = 0;
  for (let a = 0; a < t.length; a++) {
    const c = t[a];
    if (c === "(")
      o++;
    else if (c === ")") {
      if (o--, o < 0)
        return null;
    } else
      o === 0 && (e === "," ? c === "," : /\s/.test(c)) && (n.push(t.slice(r, a)), r = a + 1);
  }
  if (o !== 0)
    return null;
  n.push(t.slice(r));
  const i = n.map((a) => a.trim());
  return e === " " ? i.filter(Boolean) : i;
}
function Es(t) {
  const e = Ie(t, " ");
  return !e || e.length === 0 ? !1 : e.every((n) => Jn(n) || Ms.test(n) || As.test(n) || Cs.has(n.toLowerCase()));
}
function Ts(t) {
  const e = Ns.exec(t.trim());
  if (!e)
    return !1;
  const n = Ie(e[3], ",");
  return !n || n.length < 2 || n.some((o) => !o) ? !1 : n.every(Es);
}
function Os(t) {
  if (typeof t != "string")
    return !1;
  const e = t.trim();
  if (!e || e.length > _s || /url\(|image-set|image\(|element\(|var\(|env\(|attr\(|expression|[;{}\\"'<>@!]|\/\*/i.test(e))
    return !1;
  if (Jn(e))
    return !0;
  const n = Ie(e, ",");
  return !!n && n.every(Ts);
}
function Is(t, e) {
  return typeof e != "string" ? !1 : t === "fontClass.value" ? gs.test(e) : !0;
}
function $s(t, e) {
  const n = e.split(".");
  let o = t;
  for (const r of n.slice(0, -1)) {
    if (!o || typeof o != "object")
      return null;
    o = o[r];
  }
  return !o || typeof o != "object" ? null : { holder: o, key: n[n.length - 1] };
}
function wn(t, e) {
  let n = [{ holder: { root: t }, key: "root" }];
  for (const o of e.split(".")) {
    const r = o.endsWith("[]"), i = r ? o.slice(0, -2) : o, a = [];
    for (const { holder: c, key: g } of n) {
      const m = c[g];
      if (!m || typeof m != "object")
        continue;
      if (!r) {
        a.push({ holder: m, key: i });
        continue;
      }
      const x = m[i];
      Array.isArray(x) && x.forEach((M, $) => a.push({ holder: x, key: $ }));
    }
    n = a;
  }
  return n;
}
function Ps(t, e) {
  return t === Me && e === "backgroundGradient" ? "" : t === Me && e === "backgroundColor" ? "#ffffffff" : "transparent";
}
function bn(t, e, n) {
  for (const o of bs[e] || [])
    for (const { holder: r, key: i } of wn(t, o)) {
      const a = r[i];
      a == null || a === "" || typeof a == "string" && Os(a) || (n.dropped.push({ type: e, path: o, value: String(a).slice(0, 80) }), r[i] = Ps(e, o));
    }
  for (const o of vs[e] || [])
    for (const { holder: r, key: i } of wn(t, o)) {
      const a = r[i];
      a != null && (typeof a == "number" && Number.isFinite(a) || (n.dropped.push({ type: e, path: o, value: String(a).slice(0, 80) }), r[i] = o.endsWith(".angle") ? 180 : 0));
    }
}
function Ds(t, e, n) {
  for (const o of ys[e] || []) {
    if (!(o in t) || t[o] === void 0)
      continue;
    const r = t[o];
    if (typeof r != "string") {
      n.dropped.push({ type: e, path: o, value: String(r).slice(0, 80) }), delete t[o];
      continue;
    }
    const i = r.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, ws);
    i !== r && (t[o] = i);
  }
  "decorative" in t && t.decorative !== void 0 && typeof t.decorative != "boolean" && (n.dropped.push({ type: e, path: "decorative", value: String(t.decorative).slice(0, 80) }), delete t.decorative);
}
function Rs(t) {
  const e = JSON.parse(JSON.stringify(t));
  return { doc: e, report: Ls(e) };
}
function Ls(t) {
  const e = { dropped: [] };
  Lr(t.layouts);
  for (const n of t.layouts || []) {
    n != null && n.global && typeof n.global == "object" && bn(n.global, Me, e);
    for (const o of n.layers || [])
      if (!(!o || typeof o != "object")) {
        bn(o, String(o.type), e), Ds(o, String(o.type), e);
        for (const r of ms[String(o.type)] || []) {
          const i = $s(o, r);
          if (!i)
            continue;
          const a = i.holder[i.key];
          a === void 0 || Is(r, a) || (e.dropped.push({ type: String(o.type), path: r, value: String(a).slice(0, 80) }), r === "fontClass.value" ? (delete o.fontClass, delete o.fontFamily) : delete i.holder[i.key]);
        }
      }
  }
  return e;
}
function Bs(t) {
  if (!t || !Array.isArray(t.layouts))
    return [];
  const { doc: e } = Rs(t);
  for (const n of e.layouts)
    for (const o of (n == null ? void 0 : n.layers) || []) {
      o.type === "w-text" && typeof o.text == "string" && (o.text = gn(o.text, o.listStyle));
      const r = o.cells;
      o.type === "w-table" && Array.isArray(r) && (o.cells = r.map((i) => Array.isArray(i) ? i.map((a) => gn(String(a ?? ""))) : i));
    }
  return e.layouts.filter((n) => n && n.global);
}
function Fs(t) {
  const [e, n] = St(0);
  return bt(() => {
    const o = t.current;
    if (!o)
      return;
    const r = () => n(o.clientWidth);
    if (r(), typeof ResizeObserver > "u")
      return window.addEventListener("resize", r), () => window.removeEventListener("resize", r);
    const i = new ResizeObserver(r);
    return i.observe(o), () => i.disconnect();
  }, [t]), e;
}
function Wa({ document: t, className: e, onPageChange: n }) {
  const o = qt(() => Bs(t), [t]), r = it(null), i = it(null), a = it(null), c = Fs(i), [g, m] = St(0), x = it(n);
  x.current = n, bt(() => {
    const W = i.current;
    if (!W)
      return;
    let P = 0;
    const F = () => {
      P = 0;
      const Z = window.innerHeight / 2;
      let J = -1, lt = Number.POSITIVE_INFINITY;
      W.querySelectorAll("[data-page]").forEach((ht) => {
        const rt = ht.getBoundingClientRect();
        if (rt.bottom < 0 || rt.top > window.innerHeight)
          return;
        const tt = rt.top <= Z && rt.bottom >= Z ? 0 : Math.min(Math.abs(rt.top - Z), Math.abs(rt.bottom - Z));
        tt < lt && (lt = tt, J = Number(ht.dataset.page));
      }), !(J < 0) && m((ht) => {
        var rt;
        return ht !== J && ((rt = x.current) == null || rt.call(x, J)), J;
      });
    }, U = () => {
      P || (P = requestAnimationFrame(F));
    };
    return U(), document.addEventListener("scroll", U, { capture: !0, passive: !0 }), window.addEventListener("resize", U), () => {
      cancelAnimationFrame(P), document.removeEventListener("scroll", U, { capture: !0 }), window.removeEventListener("resize", U);
    };
  }, [o.length, c]);
  const M = o.length, $ = String((t == null ? void 0 : t.title) || "").trim();
  return /* @__PURE__ */ wt("div", { ref: r, className: Dt("ds-root", "ds-viewer", e || ""), children: [
    /* @__PURE__ */ wt("div", { className: "ds-viewer__bar", children: [
      /* @__PURE__ */ E("span", { className: "ds-viewer__count", children: M === 1 ? "1 page" : `${M} pages` }),
      M ? /* @__PURE__ */ E("button", { type: "button", className: "ds-viewer__present", onClick: () => {
        var W;
        return (W = a.current) == null ? void 0 : W.open(g);
      }, children: "Present" }) : null
    ] }),
    /* @__PURE__ */ E("div", { ref: i, className: "ds-viewer__pages", "aria-label": $ || void 0, children: o.map((W, P) => /* @__PURE__ */ E("section", { "data-page": P, className: "ds-viewer__page", "aria-label": `Page ${P + 1} of ${M}`, children: c ? /* @__PURE__ */ E(Vt, { page: W, maxWidth: c, maxHeight: Number.POSITIVE_INFINITY }) : null }, P)) }),
    /* @__PURE__ */ E(ps, { ref: a, pages: o, currentPage: () => g, container: () => r.current })
  ] });
}
export {
  oo as $,
  sa as A,
  Xs as B,
  Gs as C,
  Wa as D,
  ea as E,
  Nn as F,
  Fe as G,
  kn as H,
  Er as I,
  ca as J,
  aa as K,
  Jr as L,
  On as M,
  Sr as N,
  Vr as O,
  Yr as P,
  Gr as Q,
  kr as R,
  Co as S,
  In as T,
  He as U,
  Ue as V,
  Vs as W,
  ce as X,
  Ee as Y,
  Qt as Z,
  Ge as _,
  _r as a,
  ha as a$,
  lo as a0,
  po as a1,
  co as a2,
  go as a3,
  mo as a4,
  pa as a5,
  ga as a6,
  wo as a7,
  bo as a8,
  Ve as a9,
  Qe as aA,
  $o as aB,
  xa as aC,
  Ti as aD,
  Ei as aE,
  fn as aF,
  Gt as aG,
  Fi as aH,
  Li as aI,
  Yn as aJ,
  Bi as aK,
  Ba as aL,
  Fa as aM,
  za as aN,
  Ra as aO,
  qr as aP,
  be as aQ,
  Fr as aR,
  Br as aS,
  Mi as aT,
  hn as aU,
  Ni as aV,
  Ci as aW,
  Ai as aX,
  La as aY,
  Zr as aZ,
  Qs as a_,
  xo as aa,
  No as ab,
  ya as ac,
  ba as ad,
  wa as ae,
  qo as af,
  ra as ag,
  Go as ah,
  Xo as ai,
  Yo as aj,
  Ca as ak,
  Vo as al,
  Na as am,
  va as an,
  ri as ao,
  _a as ap,
  Ea as aq,
  Sa as ar,
  Aa as as,
  ka as at,
  Ma as au,
  Wr as av,
  Us as aw,
  Ys as ax,
  ma as ay,
  ke as az,
  yo as b,
  $n as b0,
  fa as b1,
  da as b2,
  to as b3,
  ua as b4,
  xe as b5,
  Pa as b6,
  Da as b7,
  Po as b8,
  Hn as b9,
  Wn as ba,
  Oo as bb,
  ee as bc,
  qa as bd,
  $a as be,
  na as bf,
  ps as bg,
  Lr as bh,
  Rr as bi,
  la as bj,
  Rs as bk,
  Qo as bl,
  zi as bm,
  Ta as bn,
  Ia as bo,
  Oa as bp,
  Zo as bq,
  Ls as br,
  ws as bs,
  gn as bt,
  Ks as bu,
  Hs as bv,
  oa as c,
  zn as d,
  Lo as e,
  tn as f,
  ia as g,
  Eo as h,
  To as i,
  Zs as j,
  oe as k,
  Ne as l,
  Dt as m,
  Xt as n,
  js as o,
  Mo as p,
  xr as q,
  _o as r,
  Js as s,
  ta as t,
  vr as u,
  Rn as v,
  Zt as w,
  Oe as x,
  Pr as y,
  Or as z
};
