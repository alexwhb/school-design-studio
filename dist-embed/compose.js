const q = { width: 1920, height: 1080 }, kt = { width: 1275, height: 1650 };
function pn(t) {
  return t === "poster" ? { ...kt } : { ...q };
}
const P = 50, Z = 150, yi = {
  px: 1,
  in: Z,
  mm: Z / 25.4,
  cm: Z / 2.54
}, pi = { px: 0, in: 2, mm: 1, cm: 2 };
function Vt(t, e) {
  const o = 10 ** pi[e];
  return Math.round((Number(t) || 0) / yi[e] * o) / o;
}
const Ii = [
  { name: "A3", mm: [297, 420], unit: "mm" },
  { name: "A4", mm: [210, 297], unit: "mm" },
  { name: "A5", mm: [148, 210], unit: "mm" },
  { name: "Letter", mm: [215.9, 279.4], unit: "in" },
  { name: "Legal", mm: [215.9, 355.6], unit: "in" },
  { name: "Tabloid", mm: [279.4, 431.8], unit: "in" }
], $t = 1.5;
function xi(t, e) {
  const i = Vt(t, "mm"), o = Vt(e, "mm"), r = Math.min(i, o), n = Math.max(i, o);
  return Ii.find((s) => Math.abs(s.mm[0] - r) <= $t && Math.abs(s.mm[1] - n) <= $t) ?? null;
}
function mi(t, e) {
  const i = xi(t, e);
  return i ? `${i.name} ${Number(e) >= Number(t) ? "portrait" : "landscape"}` : null;
}
const tt = "#ffffffff", Mi = "#000000ff", bi = 0.6, Xt = 0.02, ki = 1.2, Ie = 96, Ai = 0.179;
function et(t) {
  if (typeof t != "string")
    return null;
  const e = t.trim().replace(/^#/, "").toLowerCase();
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(e))
    return null;
  const i = e.length === 3 ? e[0] + e[0] + e[1] + e[1] + e[2] + e[2] + "ff" : e.length === 6 ? e + "ff" : e;
  return {
    r: parseInt(i.slice(0, 2), 16),
    g: parseInt(i.slice(2, 4), 16),
    b: parseInt(i.slice(4, 6), 16),
    a: parseInt(i.slice(6, 8), 16) / 255
  };
}
function At({ r: t, g: e, b: i, a: o }) {
  const r = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${r(t)}${r(e)}${r(i)}${r(o * 255)}`;
}
function yt(t) {
  const e = t / 255;
  return e <= 0.03928 ? e / 12.92 : ((e + 0.055) / 1.055) ** 2.4;
}
function it(t) {
  const e = et(t);
  return e ? 0.2126 * yt(e.r) + 0.7152 * yt(e.g) + 0.0722 * yt(e.b) : 0;
}
function N(t, e) {
  const i = it(t), o = it(e), r = Math.max(i, o), n = Math.min(i, o);
  return (r + 0.05) / (n + 0.05);
}
function H(t, e) {
  const i = et(t), o = et(e);
  return i ? !o || i.a >= 1 ? At({ ...i, a: 1 }) : At({
    r: i.r * i.a + o.r * (1 - i.a),
    g: i.g * i.a + o.g * (1 - i.a),
    b: i.b * i.a + o.b * (1 - i.a),
    a: 1
  }) : e;
}
function Bt(t) {
  return mi(t.width, t.height) ? Z : Ie;
}
function vi(t, e, i) {
  const o = (Number(t) || 0) * (Ie / Bt(i));
  return e ? o >= 18.66 : o >= 24;
}
function xe(t, e, i) {
  return vi(t, e, i) ? 3 : 4.5;
}
const _t = 3;
function vt(t, e) {
  let i = e[0], o = -1;
  for (const r of e) {
    const n = N(r, t);
    n > o && (i = r, o = n);
  }
  return i;
}
function ot(t, e, i) {
  const o = N(t, e);
  if (o >= i)
    return { color: t, ratio: o, met: !0, changed: !1 };
  const r = et(t);
  if (!r)
    return { color: t, ratio: o, met: !1, changed: !1 };
  const n = i * ki, s = Si(r), d = it(e) > Ai ? -1 : 1;
  let l = t, a = o;
  for (let c = 1; c * Xt <= bi; c++) {
    const h = s.l + d * c * Xt;
    if (h < 0 || h > 1)
      break;
    const g = At({ ...Di(s.h, s.s, h), a: r.a }), u = N(g, e);
    if (l = g, a = u, u >= n)
      return { color: g, ratio: u, met: !0, changed: !0 };
  }
  return { color: l, ratio: a, met: a >= i, changed: l !== t };
}
function Si({ r: t, g: e, b: i }) {
  const o = t / 255, r = e / 255, n = i / 255, s = Math.max(o, r, n), d = Math.min(o, r, n), l = (s + d) / 2, a = s - d;
  if (a === 0)
    return { h: 0, s: 0, l };
  const c = a / (1 - Math.abs(2 * l - 1));
  let h = 0;
  return s === o ? h = (r - n) / a % 6 : s === r ? h = (n - o) / a + 2 : h = (o - r) / a + 4, { h: (h * 60 + 360) % 360, s: c, l };
}
function Di(t, e, i) {
  const o = (1 - Math.abs(2 * i - 1)) * e, r = o * (1 - Math.abs(t / 60 % 2 - 1)), n = i - o / 2, s = Math.floor((t % 360 + 360) % 360 / 60), [d, l, a] = [
    [o, r, 0],
    [r, o, 0],
    [0, o, r],
    [0, r, o],
    [r, 0, o],
    [o, 0, r]
  ][s];
  return { r: (d + n) * 255, g: (l + n) * 255, b: (a + n) * 255, a: 1 };
}
const Ci = "201", Ni = "Editorial slide — cover", Li = 1920, ji = 1080, zi = "slide-themes", Bi = {
  colors: {
    "8c2f24": "primary"
  }
}, Zi = '[{"global": {"name": "Editorial slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FAF7F0ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "067230bb22b7", "editable": false, "left": 100, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 12, "fontSize": 25, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3f194358eb67", "editable": false, "left": 1020, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 12, "fontSize": 25, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8C2F24ff", "textAlign": "right", "text": "NO. 24 — SEPTEMBER 2026", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 800, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "47b4e5a74705", "width": 1720, "height": 3, "colors": ["#191713ff"], "left": 100, "top": 140, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1720 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1720\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c8b69734e8b5", "editable": false, "left": 100, "top": 187, "transform": "", "lineHeight": 0.98, "letterSpacing": -2, "fontSize": 104, "fontClass": {"alias": "Libre Baskerville", "id": 0, "value": "Libre Baskerville", "url": "/fonts/libre-baskerville-400-700.woff2"}, "fontFamily": "Libre Baskerville", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 948, "height": 204, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "5e862c48bfdd", "editable": false, "left": 100, "top": 425, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 38, "fontClass": {"alias": "Libre Baskerville", "id": 0, "value": "Libre Baskerville", "url": "/fonts/libre-baskerville-400-700.woff2"}, "fontFamily": "Libre Baskerville", "brandRole": "body", "fontWeight": 400, "fontStyle": "italic", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#4A443Bff", "textAlign": "left", "text": "A review of the 2025–26 school year, and what our families can expect in the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 948, "height": 103, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "9f2a0450296d", "width": 330, "height": 2, "colors": ["#CFC7B6ff"], "left": 100, "top": 570, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 330 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"330\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "795854efae2d", "editable": false, "left": 100, "top": 584, "transform": "", "lineHeight": 1.6, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Dana Whitlock<br/>Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 330, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "ee8dfea969d2", "width": 430, "height": 2, "colors": ["#CFC7B6ff"], "left": 476, "top": 570, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 430 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"430\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a023fc184123", "editable": false, "left": 476, "top": 584, "transform": "", "lineHeight": 1.6, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Tuesday, Sept. 15<br/>7:00 p.m., Auditorium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 430, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "317392077410", "width": 702, "height": 720, "colors": ["#19171312", "#CFC7B6ff"], "left": 1118, "top": 187, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 702 720\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-720\\" y1=\\"0\\" x2=\\"0\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-702\\" y1=\\"0\\" x2=\\"18\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-684\\" y1=\\"0\\" x2=\\"36\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-666\\" y1=\\"0\\" x2=\\"54\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-648\\" y1=\\"0\\" x2=\\"72\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-630\\" y1=\\"0\\" x2=\\"90\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-612\\" y1=\\"0\\" x2=\\"108\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-594\\" y1=\\"0\\" x2=\\"126\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-576\\" y1=\\"0\\" x2=\\"144\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-558\\" y1=\\"0\\" x2=\\"162\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-540\\" y1=\\"0\\" x2=\\"180\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-522\\" y1=\\"0\\" x2=\\"198\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-504\\" y1=\\"0\\" x2=\\"216\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-486\\" y1=\\"0\\" x2=\\"234\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"252\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"270\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"288\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"306\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"324\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"342\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"360\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"378\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"396\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"414\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"432\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"450\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"468\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"486\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"504\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"522\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"540\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"558\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"576\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"594\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"612\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"630\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"648\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"666\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"684\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"702\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"720\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"738\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"756\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"774\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"792\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"810\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"828\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"846\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"864\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"882\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"900\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"918\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"936\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"954\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"972\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"990\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"1008\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"1026\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"1044\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"1062\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"1080\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"1098\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"1116\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"1134\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"1152\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"1170\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"1188\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"1206\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"1224\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"1242\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1260\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1278\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1296\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1314\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1332\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1350\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1368\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1386\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1404\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1422\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1440\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1458\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1476\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1494\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1512\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1530\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1548\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1566\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1584\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1602\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1620\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1638\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1656\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1674\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1692\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1710\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1728\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1746\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1764\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1782\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1800\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1818\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1836\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1854\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1872\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1170\\" y1=\\"0\\" x2=\\"1890\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1188\\" y1=\\"0\\" x2=\\"1908\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1206\\" y1=\\"0\\" x2=\\"1926\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1224\\" y1=\\"0\\" x2=\\"1944\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1242\\" y1=\\"0\\" x2=\\"1962\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1260\\" y1=\\"0\\" x2=\\"1980\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1278\\" y1=\\"0\\" x2=\\"1998\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1296\\" y1=\\"0\\" x2=\\"2016\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1314\\" y1=\\"0\\" x2=\\"2034\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1332\\" y1=\\"0\\" x2=\\"2052\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1350\\" y1=\\"0\\" x2=\\"2070\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1368\\" y1=\\"0\\" x2=\\"2088\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1386\\" y1=\\"0\\" x2=\\"2106\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1404\\" y1=\\"0\\" x2=\\"2124\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1422\\" y1=\\"0\\" x2=\\"2142\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"700\\" height=\\"718\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "562108b2b0b9", "editable": false, "left": 1140, "top": 858, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 22, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6355ff", "textAlign": "left", "text": "image: front entrance, fall 2026", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 658, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "7d91b639754d", "width": 1720, "height": 2, "colors": ["#CFC7B6ff"], "left": 100, "top": 951, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1720 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1720\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "ddfcf9deb99e", "editable": false, "left": 100, "top": 972, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 23, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6355ff", "textAlign": "left", "text": "Enrollment 842 · Grades 6–8 · {{school.address}} · {{school.website}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1720, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Hi = {
  id: Ci,
  title: Ni,
  width: Li,
  height: ji,
  pack: zi,
  brand: Bi,
  data: Zi
}, Ti = "206", Wi = "Swiss slide — cover", Ei = 1920, Gi = 1080, Ri = "slide-themes", Pi = {
  colors: {
    e4322b: "primary"
  }
}, Ui = '[{"global": {"name": "Swiss slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FFFFFFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "6322b794e0cb", "editable": false, "left": 90, "top": 43, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 26, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3b30e8d4e0e6", "editable": false, "left": 1230, "top": 43, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 26, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E4322Bff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 600, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "193d583ca2e5", "width": 1920, "height": 1, "colors": ["#101010ff"], "left": 0, "top": 120, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 1\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"1\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "cf4bf83a4442", "width": 1, "height": 760, "colors": ["#DCDCDCff"], "left": 1120, "top": 120, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 760\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"760\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "83f1c7ee09fc", "editable": false, "left": 90, "top": 200, "transform": "", "lineHeight": 0.92, "letterSpacing": -4, "fontSize": 118, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "Annual<br/>Report to<br/>Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 970, "height": 326, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "bbf497030648", "editable": false, "left": 90, "top": 726, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#444444ff", "textAlign": "left", "text": "The year in review, the results, and the calendar for 2026–27.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 780, "height": 94, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "8758def70cc2", "width": 650, "height": 441, "colors": ["#10101014", "#101010ff"], "left": 1180, "top": 200, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 650 441\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-448\\" y1=\\"0\\" x2=\\"-448\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"-432\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-416\\" y1=\\"0\\" x2=\\"-416\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-400\\" y1=\\"0\\" x2=\\"-400\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-384\\" y1=\\"0\\" x2=\\"-384\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-368\\" y1=\\"0\\" x2=\\"-368\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-352\\" y1=\\"0\\" x2=\\"-352\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-336\\" y1=\\"0\\" x2=\\"-336\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-320\\" y1=\\"0\\" x2=\\"-320\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-304\\" y1=\\"0\\" x2=\\"-304\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"-288\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-272\\" y1=\\"0\\" x2=\\"-272\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-256\\" y1=\\"0\\" x2=\\"-256\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-240\\" y1=\\"0\\" x2=\\"-240\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-224\\" y1=\\"0\\" x2=\\"-224\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-208\\" y1=\\"0\\" x2=\\"-208\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-192\\" y1=\\"0\\" x2=\\"-192\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-176\\" y1=\\"0\\" x2=\\"-176\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-160\\" y1=\\"0\\" x2=\\"-160\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"-144\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-128\\" y1=\\"0\\" x2=\\"-128\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-112\\" y1=\\"0\\" x2=\\"-112\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-96\\" y1=\\"0\\" x2=\\"-96\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-80\\" y1=\\"0\\" x2=\\"-80\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-64\\" y1=\\"0\\" x2=\\"-64\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-48\\" y1=\\"0\\" x2=\\"-48\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-32\\" y1=\\"0\\" x2=\\"-32\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-16\\" y1=\\"0\\" x2=\\"-16\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"0\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"16\\" y1=\\"0\\" x2=\\"16\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"32\\" y1=\\"0\\" x2=\\"32\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"48\\" y1=\\"0\\" x2=\\"48\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"64\\" y1=\\"0\\" x2=\\"64\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"80\\" y1=\\"0\\" x2=\\"80\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"96\\" y1=\\"0\\" x2=\\"96\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"112\\" y1=\\"0\\" x2=\\"112\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"128\\" y1=\\"0\\" x2=\\"128\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"144\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"160\\" y1=\\"0\\" x2=\\"160\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"176\\" y1=\\"0\\" x2=\\"176\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"192\\" y1=\\"0\\" x2=\\"192\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"208\\" y1=\\"0\\" x2=\\"208\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"224\\" y1=\\"0\\" x2=\\"224\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"240\\" y1=\\"0\\" x2=\\"240\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"256\\" y1=\\"0\\" x2=\\"256\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"272\\" y1=\\"0\\" x2=\\"272\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"288\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"304\\" y1=\\"0\\" x2=\\"304\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"320\\" y1=\\"0\\" x2=\\"320\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"336\\" y1=\\"0\\" x2=\\"336\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"352\\" y1=\\"0\\" x2=\\"352\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"368\\" y1=\\"0\\" x2=\\"368\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"384\\" y1=\\"0\\" x2=\\"384\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"400\\" y1=\\"0\\" x2=\\"400\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"416\\" y1=\\"0\\" x2=\\"416\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"432\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"448\\" y1=\\"0\\" x2=\\"448\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"464\\" y1=\\"0\\" x2=\\"464\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"480\\" y1=\\"0\\" x2=\\"480\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"496\\" y1=\\"0\\" x2=\\"496\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"512\\" y1=\\"0\\" x2=\\"512\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"528\\" y1=\\"0\\" x2=\\"528\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"544\\" y1=\\"0\\" x2=\\"544\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"560\\" y1=\\"0\\" x2=\\"560\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"576\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"592\\" y1=\\"0\\" x2=\\"592\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"608\\" y1=\\"0\\" x2=\\"608\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"624\\" y1=\\"0\\" x2=\\"624\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"640\\" y1=\\"0\\" x2=\\"640\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"656\\" y1=\\"0\\" x2=\\"656\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"672\\" y1=\\"0\\" x2=\\"672\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"688\\" y1=\\"0\\" x2=\\"688\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"704\\" y1=\\"0\\" x2=\\"704\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"720\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"736\\" y1=\\"0\\" x2=\\"736\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"752\\" y1=\\"0\\" x2=\\"752\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"768\\" y1=\\"0\\" x2=\\"768\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"784\\" y1=\\"0\\" x2=\\"784\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"800\\" y1=\\"0\\" x2=\\"800\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"816\\" y1=\\"0\\" x2=\\"816\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"832\\" y1=\\"0\\" x2=\\"832\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"848\\" y1=\\"0\\" x2=\\"848\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"864\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"880\\" y1=\\"0\\" x2=\\"880\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"896\\" y1=\\"0\\" x2=\\"896\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"912\\" y1=\\"0\\" x2=\\"912\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"928\\" y1=\\"0\\" x2=\\"928\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"944\\" y1=\\"0\\" x2=\\"944\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"960\\" y1=\\"0\\" x2=\\"960\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"976\\" y1=\\"0\\" x2=\\"976\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"992\\" y1=\\"0\\" x2=\\"992\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1008\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1024\\" y1=\\"0\\" x2=\\"1024\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1040\\" y1=\\"0\\" x2=\\"1040\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1056\\" y1=\\"0\\" x2=\\"1056\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1072\\" y1=\\"0\\" x2=\\"1072\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1088\\" y1=\\"0\\" x2=\\"1088\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"648\\" height=\\"439\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7807bdc18083", "editable": false, "left": 1200, "top": 595, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 22, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "IMAGE: STUDENTS, MAIN CORRIDOR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 610, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "732f8d1c4c48", "width": 650, "height": 3, "colors": ["#E4322Bff"], "left": 1180, "top": 675, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 650 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"650\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "dd75a08a022b", "editable": false, "left": 1180, "top": 694, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 28, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "Dana Whitlock, Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 650, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "a9a8c629ceed", "editable": false, "left": 1180, "top": 736, "transform": "", "lineHeight": 1.5, "letterSpacing": 0, "fontSize": 28, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#555555ff", "textAlign": "left", "text": "Tuesday, September 15 · 7:00 p.m.<br/>Auditorium, doors open 6:30", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 650, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "d28685db8417", "width": 1920, "height": 1, "colors": ["#101010ff"], "left": 0, "top": 880, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 1\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"1\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a1a5febfbdc7", "editable": false, "left": 90, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "1055ec722c17", "editable": false, "left": 90, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3d61cf0e2e60", "editable": false, "left": 525, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "GRADES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "2a4f01511428", "editable": false, "left": 525, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "e6b4424bd842", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 495, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "76cca2989666", "editable": false, "left": 960, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c07d12a4ab30", "editable": false, "left": 960, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a4638b5d6dae", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 930, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7589fa94aa57", "editable": false, "left": 1395, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3755807634a4", "editable": false, "left": 1395, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "8c586f9a2b90", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 1365, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}]}]', Fi = {
  id: Ti,
  title: Wi,
  width: Ei,
  height: Gi,
  pack: Ri,
  brand: Pi,
  data: Ui
}, Yi = "211", Ji = "Academic slide — cover", Qi = 1920, Oi = 1080, Vi = "slide-themes", $i = {
  colors: {
    "0f2340": "primary",
    cfa93f: "secondary"
  }
}, Xi = '[{"global": {"name": "Academic slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#F3F0E9ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "455da12c1730", "width": 1920, "height": 760, "colors": ["#0F2340ff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 760\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"760\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3f4d4951ace3", "editable": false, "left": 100, "top": 163, "transform": "", "lineHeight": 1.3, "letterSpacing": 20, "fontSize": 26, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#CFA93Fff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "7bdd0b0b147e", "editable": false, "left": 100, "top": 223, "transform": "", "lineHeight": 1.0, "letterSpacing": -2, "fontSize": 100, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#F3F0E9ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 200, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "301455f5b9d7", "width": 160, "height": 4, "colors": ["#CFA93Fff"], "left": 100, "top": 457, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 160 4\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"160\\" height=\\"4\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "2c4a76f0d4e4", "editable": false, "left": 100, "top": 495, "transform": "", "lineHeight": 1.4, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#CBD5E2ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 101, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "fca63e250171", "width": 717, "height": 440, "colors": ["#F3F0E91F", "#CFA93Fff"], "left": 1103, "top": 160, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 717 440\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-450\\" y1=\\"0\\" x2=\\"-10\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"8\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"26\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"44\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"62\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"80\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"98\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"116\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"134\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"152\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"170\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"188\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"206\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"224\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"242\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"260\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"278\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"296\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"314\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"332\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"350\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"368\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"386\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"404\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"422\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"440\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"458\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"476\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"494\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"512\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"530\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"548\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"566\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"584\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"602\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"620\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"638\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"656\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"674\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"692\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"710\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"728\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"746\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"764\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"782\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"800\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"818\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"836\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"854\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"872\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"890\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"908\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"926\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"944\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"962\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"980\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"998\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1016\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1034\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1052\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1070\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1088\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1106\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1124\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1142\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1160\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1178\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1196\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1214\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1232\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1250\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1268\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1286\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1304\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1322\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1340\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1358\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1376\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1394\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1412\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1430\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1448\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1466\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1484\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1502\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1520\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1538\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1556\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1574\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1592\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"715\\" height=\\"438\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "8bd548576bd9", "editable": false, "left": 1125, "top": 548, "transform": "", "lineHeight": 1.3, "letterSpacing": 6, "fontSize": 22, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#A8B6C8ff", "textAlign": "left", "text": "IMAGE: SCHOOL CREST OR BUILDING", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 673, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6be90075d3b3", "editable": false, "left": 100, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "PRESENTED BY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 533, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "22ae401b9e12", "editable": false, "left": 100, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "Dana Whitlock<br/>Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 533, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "cb01a56fc7cc", "width": 1, "height": 164, "colors": ["#CDC7B8ff"], "left": 693, "top": 838, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 164\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"164\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a3e61ba9fd9d", "editable": false, "left": 753, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "MEETING", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "749df15d9f22", "editable": false, "left": 753, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "Tuesday, September 15<br/>7:00 p.m., Auditorium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "0ba8a0672950", "width": 1, "height": 164, "colors": ["#CDC7B8ff"], "left": 1286, "top": 838, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 164\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"164\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "cabffc075b32", "editable": false, "left": 1346, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "17ea5e2556a1", "editable": false, "left": 1346, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "842 students<br/>Grades 6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', _i = {
  id: Yi,
  title: Ji,
  width: Qi,
  height: Oi,
  pack: Vi,
  brand: $i,
  data: Xi
}, Ki = "216", qi = "Dark slide — cover", to = 1920, eo = 1080, io = "slide-themes", oo = {
  colors: {
    "46cdb4": "primary"
  }
}, ro = '[{"global": {"name": "Dark slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#0D1012ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "1647660f8581", "width": 18, "height": 18, "colors": ["#46CDB4ff"], "left": 100, "top": 97, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 18 18\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"18\\" height=\\"18\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "896b6612a775", "editable": false, "left": 136, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 25, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6626b6c17fa6", "editable": false, "left": 1320, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 25, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#46CDB4ff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 500, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "e926af99782a", "editable": false, "left": 100, "top": 301, "transform": "", "lineHeight": 0.95, "letterSpacing": -4, "fontSize": 112, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 962, "height": 213, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c36874bf879a", "editable": false, "left": 100, "top": 548, "transform": "", "lineHeight": 1.4, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#9AA8A8ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 962, "height": 101, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "d0012775784d", "width": 688, "height": 460, "colors": ["#E9EEEE12", "#14191Bff", "#2A3234ff"], "left": 1132, "top": 244, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 688 460\\" preserveAspectRatio=\\"none\\"><g><rect x=\\"0\\" y=\\"0\\" width=\\"688\\" height=\\"460\\" rx=\\"0\\" fill=\\"{{colors[1]}}\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"-8\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"10\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"28\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"46\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"64\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"82\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"100\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"118\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"136\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"154\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"172\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"190\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"208\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"226\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"244\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"262\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"280\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"298\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"316\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"334\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"352\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"370\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"388\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"406\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"424\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"442\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"460\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"478\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"496\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"514\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"532\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"550\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"568\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"586\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"604\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"622\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"640\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"658\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"676\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"694\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"712\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"730\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"748\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"766\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"784\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"802\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"820\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"838\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"856\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"874\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"892\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"910\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"928\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"946\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"964\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"982\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1000\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1018\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1036\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1054\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1072\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1090\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1108\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1126\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1144\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1162\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1180\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1198\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1216\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1234\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1252\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1270\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1288\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1306\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1324\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1342\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1360\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1378\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1396\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1414\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1432\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1450\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1468\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1486\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1504\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1522\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1540\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1558\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1576\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1594\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"686\\" height=\\"458\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[2]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "665b7e6ebce6", "editable": false, "left": 1154, "top": 652, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 22, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "image: students, main corridor", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 644, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "7386a946b0af", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 100, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "ad2523ac877d", "width": 409, "height": 3, "colors": ["#46CDB4ff"], "left": 100, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a225395e2d36", "editable": false, "left": 128, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c7db25bdb7b5", "editable": false, "left": 128, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "4ac3ab018c0f", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 537, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "926000521e99", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 537, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "35072603868a", "editable": false, "left": 565, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "0d6ef36438ce", "editable": false, "left": 565, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "b9e31829b373", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 974, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "760953e9ac37", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 974, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "05a999631c5f", "editable": false, "left": 1002, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "786c5e5b2bb5", "editable": false, "left": 1002, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "df52bed58c91", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 1411, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "4b767353b917", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 1411, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "b30125d35293", "editable": false, "left": 1439, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "SPEAKER", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "20d36f0362f7", "editable": false, "left": 1439, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "Dana Whitlock", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "77a48f2a04c8", "editable": false, "left": 1439, "top": 933, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', no = {
  id: Ki,
  title: qi,
  width: to,
  height: eo,
  pack: io,
  brand: oo,
  data: ro
}, so = "221", lo = "Pastel slide — cover", ao = 1920, co = 1080, ho = "slide-themes", go = {
  colors: {
    b4735a: "primary"
  }
}, uo = '[{"global": {"name": "Pastel slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FBF7F1ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "04e4a8433e31", "editable": false, "left": 100, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8d875f7bec3c", "editable": false, "left": 1320, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#B4735Aff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 500, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8b94d1841d79", "editable": false, "left": 100, "top": 250, "transform": "", "lineHeight": 1.0, "letterSpacing": 0, "fontSize": 108, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#3C4A37ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 950, "height": 216, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ed039e4d3b90", "editable": false, "left": 100, "top": 498, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6459ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 950, "height": 105, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "f0b3bb0619d5", "width": 380, "height": 66, "colors": ["#FFFFFFff"], "left": 100, "top": 643, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 380 66\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"380\\" height=\\"66\\" rx=\\"33\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "269502587b64", "editable": false, "left": 100, "top": 660, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "center", "text": "Dana Whitlock, Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 380, "height": 36, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "98d4e7d1a913", "width": 300, "height": 66, "colors": ["#FFFFFFff"], "left": 498, "top": 643, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 300 66\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"300\\" height=\\"66\\" rx=\\"33\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "2b4cf9cec585", "editable": false, "left": 498, "top": 660, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "center", "text": "Sept 15, 7:00 p.m.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 300, "height": 36, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "ccf32572268b", "width": 704, "height": 470, "colors": ["#322E290F", "#F2EDE4ff"], "left": 1116, "top": 244, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 704 470\\" preserveAspectRatio=\\"none\\"><defs><clipPath id=\\"hatch-666823b1407a\\"><rect width=\\"704\\" height=\\"470\\" rx=\\"26\\"/></clipPath></defs><g clip-path=\\"url(#hatch-666823b1407a)\\"><rect x=\\"0\\" y=\\"0\\" width=\\"704\\" height=\\"470\\" rx=\\"26\\" fill=\\"{{colors[1]}}\\"/><line x1=\\"-486\\" y1=\\"0\\" x2=\\"-16\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"2\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"20\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"38\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"56\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"74\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"92\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"110\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"128\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"146\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"164\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"182\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"200\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"218\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"236\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"254\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"272\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"290\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"308\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"326\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"344\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"362\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"380\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"398\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"416\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"434\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"452\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"470\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"488\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"506\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"524\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"542\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"560\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"578\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"596\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"614\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"632\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"650\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"668\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"686\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"704\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"722\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"740\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"758\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"776\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"794\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"812\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"830\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"848\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"866\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"884\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"902\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"920\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"938\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"956\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"974\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"992\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1010\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1028\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1046\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1064\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1082\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1100\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1118\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1136\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1154\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1172\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1190\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1208\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1226\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1244\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1262\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1280\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1298\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1316\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1334\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1352\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1370\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1388\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1406\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1424\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1442\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1460\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1478\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1496\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1514\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1532\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1550\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1568\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1586\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1604\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1622\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1170\\" y1=\\"0\\" x2=\\"1640\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "40c2eb28ce3b", "editable": false, "left": 1140, "top": 662, "transform": "", "lineHeight": 1.3, "letterSpacing": 4, "fontSize": 22, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "image: students in the courtyard", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 656, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c3ec92264e8c", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 100, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "e38394da55b8", "editable": false, "left": 132, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "05c85dee2209", "editable": false, "left": 132, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a863c4ca1fa8", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 536, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3a64da8f9f81", "editable": false, "left": 568, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "GRADES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "71f1a2f0d1d8", "editable": false, "left": 568, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "b3c8244e2439", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 972, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "4f68f6948bf8", "editable": false, "left": 1004, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c18c7d20485f", "editable": false, "left": 1004, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c217faca465b", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 1408, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a576c27bace5", "editable": false, "left": 1440, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ec838ff08760", "editable": false, "left": 1440, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', fo = {
  id: so,
  title: lo,
  width: ao,
  height: co,
  pack: ho,
  brand: go,
  data: uo
}, wo = "101", yo = "Field Day poster", po = 1275, Io = 1650, xo = "school-events", mo = {
  colors: {
    "1e3a5f": "primary",
    e1a731: "secondary"
  }
}, Mo = '[{"global": {"name": "Field Day poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#FBF7EFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "d0a7c1b0af92", "width": 1275, "height": 430, "colors": ["#1E3A5Fff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "a58df2524a47", "width": 150, "height": 150, "colors": ["#FFFFFFff"], "left": 562, "top": 60, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-trophy\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\\" /> <path d=\\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\\" /> <path d=\\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\\" /> <path d=\\"M4 22h16\\" /> <path d=\\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\\" /> <path d=\\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3ff1abbf862b", "editable": false, "left": 87, "top": 232, "transform": "", "lineHeight": 1.2, "letterSpacing": 2, "fontSize": 140, "fontClass": {"alias": "Anton", "id": 0, "value": "Anton", "url": "/fonts/anton-400.woff2"}, "fontFamily": "Anton", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "FIELD DAY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 170, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "44460bc86875", "editable": false, "left": 137, "top": 520, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 66, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#1E3A5Fff", "textAlign": "center", "text": "Friday, May 15", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 90, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "47dfcdca16a4", "width": 300, "height": 12, "colors": ["#E1A731ff"], "left": 487, "top": 650, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 240 12\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"240\\" height=\\"12\\" rx=\\"6\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "89bd8798e6ba", "editable": false, "left": 137, "top": 712, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 44, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "9:00 AM – 2:00 PM  ·  Lower Field", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 60, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "1bdcf8a4c40f", "width": 1001, "height": 460, "colors": ["#1E3A5F12"], "left": 137, "top": 870, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1001 460\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1001\\" height=\\"460\\" rx=\\"32\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "aaab751b7a2b", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 930, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-users\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\\" /> <path d=\\"M16 3.128a4 4 0 0 1 0 7.744\\" /> <path d=\\"M22 21v-2a4 4 0 0 0-3-3.87\\" /> <circle cx=\\"9\\" cy=\\"7\\" r=\\"4\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "697284ddd120", "editable": false, "left": 311, "top": 940.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Grades K–5, all four houses", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a826760bcbf7", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 1064, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-utensils\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\\" /> <path d=\\"M7 2v20\\" /> <path d=\\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "486d0871160e", "editable": false, "left": 311, "top": 1074.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Lunch served on the field", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a3af6a4a757d", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 1198, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-sun\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <circle cx=\\"12\\" cy=\\"12\\" r=\\"4\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M12 20v2\\" /> <path d=\\"m4.93 4.93 1.41 1.41\\" /> <path d=\\"m17.66 17.66 1.41 1.41\\" /> <path d=\\"M2 12h2\\" /> <path d=\\"M20 12h2\\" /> <path d=\\"m6.34 17.66-1.41 1.41\\" /> <path d=\\"m19.07 4.93-1.41 1.41\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "227f1f7245cd", "editable": false, "left": 311, "top": 1208.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Sunscreen and a water bottle", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "01ab66227355", "editable": false, "left": 137, "top": 1400, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Parent volunteers welcome — sign up at the front office.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 52, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "af254441f48f", "width": 1275, "height": 160, "colors": ["#1E3A5Fff"], "left": 0, "top": 1490, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "02d09f9804bb", "editable": false, "left": 87, "top": 1548, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 56, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 72, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', bo = {
  id: wo,
  title: yo,
  width: po,
  height: Io,
  pack: xo,
  brand: mo,
  data: Mo
}, ko = "104", Ao = "Book Fair poster", vo = 1275, So = 1650, Do = "school-events", Co = {
  colors: {
    c0392b: "primary",
    e1a731: "secondary",
    "1e3a5f": "accent"
  }
}, No = '[{"global": {"name": "Book Fair poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#C0392Bff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "60227a2cc3af", "width": 700, "height": 700, "colors": ["#FFFFFF1C"], "left": 287, "top": 600, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-book-open\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M12 5v16\\" /> <path d=\\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "28b3dd685d0e", "editable": false, "left": 87, "top": 250, "transform": "", "lineHeight": 1.05, "letterSpacing": 4, "fontSize": 210, "fontClass": {"alias": "Anton", "id": 0, "value": "Anton", "url": "/fonts/anton-400.woff2"}, "fontFamily": "Anton", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "BOOK<br/>FAIR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 520, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "cd75a67ea679", "width": 200, "height": 14, "colors": ["#E1A731ff"], "left": 537, "top": 850, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 240 12\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"240\\" height=\\"12\\" rx=\\"6\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "b1c1510c55bf", "editable": false, "left": 137, "top": 930, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 72, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E1A731ff", "textAlign": "center", "text": "November 3–7", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4d5baac3ff9b", "editable": false, "left": 137, "top": 1070, "transform": "", "lineHeight": 1.5, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "Library  ·  Open 8:00 AM – 4:00 PM<br/>Family night Thursday until 7:00 PM", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 130, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "e3d8faa86180", "width": 801, "height": 120, "colors": ["#E1A731ff"], "left": 237, "top": 1290, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 801 120\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"801\\" height=\\"120\\" rx=\\"60\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "91410f9fe161", "editable": false, "left": 257, "top": 1324, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#1E3A5Fff", "textAlign": "center", "text": "EVERY BOOK BUILDS OUR LIBRARY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 761, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4ad19534396f", "editable": false, "left": 87, "top": 1500, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 57, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Lo = {
  id: ko,
  title: Ao,
  width: vo,
  height: So,
  pack: Do,
  brand: Co,
  data: No
}, jo = "107", zo = "Science Fair poster", Bo = 1275, Zo = 1650, Ho = "school-events", To = {
  colors: {
    "2f6b3a": "primary"
  }
}, Wo = '[{"global": {"name": "Science Fair poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#FBF7EFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "9b455bacce70", "width": 1275, "height": 340, "colors": ["#2F6B3Aff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c6c3487f7ae3", "editable": false, "left": 87, "top": 110, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 112, "fontClass": {"alias": "Oswald", "id": 0, "value": "Oswald", "url": "/fonts/oswald-400-700.woff2"}, "fontFamily": "Oswald", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "SCIENCE FAIR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 140, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4be4cf87efcb", "editable": false, "left": 137, "top": 420, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 46, "fontClass": {"alias": "Merriweather", "id": 0, "value": "Merriweather", "url": "/fonts/merriweather-400-700.woff2"}, "fontFamily": "Merriweather", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#2F6B3Aff", "textAlign": "center", "text": "Ask a question. Test it. Show us.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 64, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "74e3f5132434", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 259, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-flask-conical\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\\" /> <path d=\\"M6.453 15h11.094\\" /> <path d=\\"M8.5 2h7\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "61aaa287ba0d", "editable": false, "left": 137, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "EXPERIMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8258436f5bc0", "editable": false, "left": 137, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Any question<br/>you can test", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c4c69842664b", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 593, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-clipboard-list\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <rect width=\\"8\\" height=\\"4\\" x=\\"8\\" y=\\"2\\" rx=\\"1\\" ry=\\"1\\" /> <path d=\\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\\" /> <path d=\\"M12 11h4\\" /> <path d=\\"M12 16h4\\" /> <path d=\\"M8 11h.01\\" /> <path d=\\"M8 16h.01\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "f35799a4dc4d", "editable": false, "left": 471, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "RECORD", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "500e2a3f98df", "editable": false, "left": 471, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Notes, photos,<br/>the numbers", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "0c3ff6d712ea", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 926, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-medal\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15\\" /> <path d=\\"M11 12 5.12 2.2\\" /> <path d=\\"m13 12 5.88-9.8\\" /> <path d=\\"M8 7h8\\" /> <circle cx=\\"12\\" cy=\\"17\\" r=\\"5\\" /> <path d=\\"M12 18v-2h-.5\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c8159d4f307b", "editable": false, "left": 804, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "PRESENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ff194ddc691a", "editable": false, "left": 804, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Trifold board,<br/>three minutes", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "46a017ccba92", "width": 1001, "height": 360, "colors": ["#FFFFFFff"], "left": 137, "top": 900, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1001 360\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1001\\" height=\\"360\\" rx=\\"32\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "9594305eeadf", "editable": false, "left": 197, "top": 945, "transform": "", "lineHeight": 1.2, "letterSpacing": 4, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#2F6B3Aff", "textAlign": "left", "text": "KEY DATES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3c3a10d20a02", "editable": false, "left": 197, "top": 1025, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Sign up by Friday, February 6", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6ec1511d59a0", "editable": false, "left": 197, "top": 1095, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Boards due Monday, March 2 · 8:00 AM", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ed4823c7416f", "editable": false, "left": 197, "top": 1165, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Judging Tuesday, March 3 · gymnasium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "d27a9e0ee47a", "editable": false, "left": 137, "top": 1390, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Rules and forms: {{school.website}}/sciencefair", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 52, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "257d29ece8ac", "width": 1275, "height": 130, "colors": ["#2F6B3Aff"], "left": 0, "top": 1520, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7ad974257e8e", "editable": false, "left": 87, "top": 1560, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 46, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 59, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Eo = {
  id: jo,
  title: zo,
  width: Bo,
  height: Zo,
  pack: Ho,
  brand: To,
  data: Wo
}, Go = ["editorial", "swiss", "academic", "dark", "pastel"], Ro = ["navy", "crimson", "forest"];
function Po(t) {
  const e = JSON.parse(t.data), i = Array.isArray(e) ? e[0] : { global: e.page, layers: e.widgets };
  return { background: String(i.global?.backgroundColor || "#ffffffff"), layers: i.layers || [] };
}
const K = (t) => {
  const e = String(t || "");
  return /^#[0-9a-f]{6}(ff)?$/i.test(e) ? `${e.slice(0, 7).toLowerCase()}ff` : null;
};
function pt(t, e) {
  const i = t?.fontClass;
  return i?.value ? { alias: i.alias || i.value, id: Number(i.id) || 0, url: i.url || "", value: i.value } : e;
}
const It = { alias: "Inter", id: 1, url: "/fonts/inter-400-700.woff2", value: "Inter" };
function Kt(t, e) {
  for (const [i, o] of Object.entries(t.brand?.colors || {}))
    if (String(o).toLowerCase() === e)
      return K(`#${String(i).replace(/^#/, "")}`);
  return null;
}
function me(t, e) {
  const { background: i, layers: o } = Po(e), r = Kt(e, "primary") || "#1e3a5fff", n = Kt(e, "secondary") || r, s = K(i) || "#ffffffff", d = N(s, r) < 1.5 ? "#ffffffff" : s, l = o.filter((f) => f.type === "w-text"), a = (f) => N(f, d), c = [...new Set(l.map((f) => K(f.color)).filter((f) => !!f))].filter((f) => f !== r && f !== n).sort((f, m) => a(m) - a(f)), h = a(c[0] || "") >= 4.5 ? c[0] : "#111111ff", g = c.find((f) => f !== h && a(f) >= 3) || c.find((f) => f !== h) || h, u = ot(g, d, 4.5).met ? ot(g, d, 4.5).color : h, y = o.filter((f) => f.type === "w-svg").flatMap((f) => f.colors || []).map(K).filter((f) => !!f && a(f) > 1.08).sort((f, m) => a(f) - a(m)), w = [...l].sort((f, m) => Number(m.fontSize) - Number(f.fontSize))[0], I = l.filter((f) => f.brandRole === "body").sort((f, m) => m.width - f.width)[0], p = l.find((f) => Number(f.fontSize) <= 28 && Number(f.letterSpacing) >= 6);
  return {
    key: t,
    paper: d,
    ink: h,
    muted: u,
    accent: r,
    accentSoft: n,
    rule: y[0] || u,
    display: pt(w, It),
    body: pt(I, It),
    eyebrow: pt(p, It),
    displayWeight: Number(w?.fontWeight) || 400,
    displayLineHeight: Number(w?.lineHeight) || 1.05,
    displayTracking: Number(w?.letterSpacing) || 0,
    eyebrowTracking: Number(p?.letterSpacing) || 8
  };
}
const Uo = {
  editorial: Hi,
  swiss: Fi,
  academic: _i,
  dark: no,
  pastel: fo
}, Fo = {
  navy: bo,
  crimson: Lo,
  forest: Eo
}, xt = /* @__PURE__ */ new Map(), mt = /* @__PURE__ */ new Map();
function Me(t) {
  const e = Go.includes(String(t)) ? t : "editorial";
  return xt.has(e) || xt.set(e, me(e, Uo[e])), xt.get(e);
}
function be(t) {
  const e = Ro.includes(String(t)) ? t : "navy";
  return mt.has(e) || mt.set(e, me(e, Fo[e])), mt.get(e);
}
const Yo = /* @__PURE__ */ new Set([..."iljItf.,;:'\"|!`()[]{}-/\\ "]), Jo = /* @__PURE__ */ new Set([..."mwMW@%"]), Qo = /* @__PURE__ */ new Set([..."ABCDEFGHKNOPQRSUVXYZ0123456789$&#"]);
function Oo(t) {
  return t === " " ? 0.28 : t === "i" || t === "l" || t === "j" || t === "." || t === "," ? 0.25 : Yo.has(t) ? 0.31 : Jo.has(t) ? 0.86 : Qo.has(t) ? 0.65 : 0.53;
}
const Vo = {
  "IBM Plex Mono": 0.6,
  "JetBrains Mono": 0.6
}, $o = {
  Anton: 0.888,
  "Bebas Neue": 0.746,
  Oswald: 0.878,
  Archivo: 1.05,
  Inter: 1.079,
  Roboto: 1.003,
  "Open Sans": 1.081,
  Lato: 1,
  Montserrat: 1.15,
  Poppins: 1.144,
  Nunito: 1.028,
  Quicksand: 1.049,
  Fredoka: 0.999,
  Merriweather: 1.087,
  "Playfair Display": 1.009,
  Lora: 1.055,
  "Libre Baskerville": 1.179,
  "Source Serif 4": 1.073,
  Spectral: 1.019,
  "DM Serif Display": 0.974,
  "Space Grotesk": 1.076,
  Karla: 1.032,
  Caveat: 0.768,
  Pacifico: 1.139
}, Xo = 1.06;
function Y(t, e) {
  const i = e.fontFamily ? Vo[e.fontFamily] : void 0, o = e.fontFamily && $o[e.fontFamily] || 1;
  let r = 0;
  if (i !== void 0) {
    for (const s of t)
      r += i;
    return r * e.fontSize + (e.letterSpacing || 0) * t.length;
  }
  for (const s of t)
    r += Oo(s);
  const n = e.bold ? 1.03 : 1;
  return (r * e.fontSize * o * n + (e.letterSpacing || 0) * t.length) * Xo;
}
function St(t, e, i) {
  const o = [];
  for (const r of String(t).split(`
`)) {
    const n = r.split(/\s+/).filter(Boolean);
    if (n.length === 0) {
      o.push("");
      continue;
    }
    let s = "";
    for (const d of n) {
      const l = s ? `${s} ${d}` : d;
      s && Y(l, i) > e ? (o.push(s), s = d) : s = l;
    }
    o.push(s);
  }
  return o;
}
function qt(t, e, i) {
  return Math.max(1, Math.floor(t / (e * i) + 0.08));
}
function ke(t, e, i) {
  const o = String(t || "").trim();
  if (!o)
    return { text: "", fontSize: e.fontSize, lines: [], truncated: !1 };
  const r = (c) => ({ ...e, fontSize: c, letterSpacing: (e.letterSpacing || 0) * (c / e.fontSize) }), n = (c, h) => c.reduce((g, u) => Math.max(g, Y(u, h)), 0), s = Math.max(6, Math.min(i.minFontSize, e.fontSize));
  for (let c = e.fontSize; c >= s; c -= 1) {
    const h = r(c), g = St(o, i.width, h), u = Math.min(qt(i.height, c, e.lineHeight), i.maxLines || Number.MAX_SAFE_INTEGER);
    if (g.length <= u && n(g, h) <= i.width)
      return { text: o, fontSize: c, lines: g, truncated: !1 };
  }
  const d = r(s), l = Math.min(qt(i.height, s, e.lineHeight), i.maxLines || Number.MAX_SAFE_INTEGER), a = St(o, i.width, d).slice(0, l);
  for (; a.length && Y(`${a[a.length - 1]}…`, d) > i.width; ) {
    const c = a[a.length - 1], h = c.split(" ");
    if (h.length > 1) {
      h.pop(), a[a.length - 1] = h.join(" ");
      continue;
    }
    if (c.length <= 1) {
      a.pop();
      continue;
    }
    a[a.length - 1] = c.slice(0, -1);
  }
  return a.length === 0 ? { text: "…", fontSize: s, lines: ["…"], truncated: !0 } : (a[a.length - 1] = `${a[a.length - 1].replace(/[\s,;:.]+$/, "")}…`, { text: a.join(" "), fontSize: s, lines: a, truncated: !0 });
}
function Ae(t, e) {
  return Math.ceil(t.lines.length * t.fontSize * e);
}
const ve = ["href", "color", "bold", "italic", "underline", "strike"], te = /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|DL|DD|DT|FOOTER|H[1-6]|HEADER|LI|OL|P|PRE|SECTION|TABLE|TD|TH|TR|UL)$/, ee = /^(HEAD|LINK|META|NOSCRIPT|SCRIPT|STYLE|TEMPLATE|TITLE)$/, ie = 3, oe = 1, Se = 64;
typeof DOMParser > "u" || new DOMParser();
const _o = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  // A non-breaking space, spelled out because it is invisible in a file.
  // Written the way the browser serialises it, so the stored string matches
  // what innerHTML reads back and the editor is not rewritten for nothing.
  " ": "&nbsp;"
};
function Dt(t) {
  return t.replace(/[&<>"\u00a0]/g, (e) => _o[e]);
}
const Ko = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, qo = /^rgba?\(\s*([^)]+)\)$/i, _ = (t) => Math.max(0, Math.min(255, Math.round(t))).toString(16).padStart(2, "0");
function re(t) {
  if (!t)
    return;
  const e = t.trim(), i = e.match(Ko);
  if (i) {
    let r = i[1].toLowerCase();
    return r.length <= 4 && (r = r.split("").map((n) => n + n).join("")), "#" + (r.length === 8 && r.endsWith("ff") ? r.slice(0, 6) : r);
  }
  const o = e.match(qo);
  if (o) {
    const r = o[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (r.length < 3 || r.slice(0, 3).some(Number.isNaN))
      return;
    const n = r.length > 3 && !Number.isNaN(r[3]) ? r[3] : 1, s = "#" + _(r[0]) + _(r[1]) + _(r[2]);
    return n >= 1 ? s : s + _(n * 255);
  }
}
const tr = /^([a-z][a-z0-9+.-]*):/i, er = /* @__PURE__ */ new Set(["http", "https", "mailto", "tel"]);
function De(t) {
  const e = (t ?? "").trim();
  if (!e)
    return;
  const i = e.match(tr)?.[1].toLowerCase();
  if (i)
    return er.has(i) ? e : void 0;
  if (e.startsWith("//"))
    return "https:" + e;
  if (!/\s/.test(e))
    return "https://" + e;
}
function ir(t, e) {
  return ve.every((i) => (t[i] || void 0) === (e[i] || void 0));
}
function or(t, e) {
  const i = { ...e };
  switch (t.tagName) {
    case "B":
    case "STRONG":
      i.bold = !0;
      break;
    case "I":
    case "EM":
      i.italic = !0;
      break;
    case "U":
      i.underline = !0;
      break;
    case "S":
    case "STRIKE":
    case "DEL":
      i.strike = !0;
      break;
    case "A": {
      const r = De(t.getAttribute?.("href"));
      r && (i.href = r);
      break;
    }
    case "FONT": {
      const r = re(t.getAttribute?.("color"));
      r && (i.color = r);
      break;
    }
  }
  const o = t.style;
  if (o && o.length) {
    const r = re(o.color);
    r && (i.color = r);
    const n = o.fontWeight;
    (n === "bold" || n === "bolder" || Number(n) >= 600) && (i.bold = !0), (o.fontStyle === "italic" || o.fontStyle === "oblique") && (i.italic = !0);
    const s = o.textDecorationLine || o.textDecoration || "";
    /underline/.test(s) && (i.underline = !0), /line-through/.test(s) && (i.strike = !0);
  }
  return i;
}
function Ce(t) {
  const e = [];
  let i = [], o = !1;
  const r = () => {
    e.push(i), i = [], o = !1;
  }, n = (l) => {
    let a = l;
    for (; ; ) {
      for (let h = a.nextSibling; h; h = h.nextSibling)
        if (h.nodeType === ie && h.data || h.nodeType === oe && !ee.test(h.tagName ?? ""))
          return !1;
      const c = a.parentNode;
      if (!c || c === t || te.test(c.tagName ?? ""))
        return !0;
      a = c;
    }
  }, s = (l, a) => {
    if (!l)
      return;
    const c = i[i.length - 1];
    c && ir(c, a) ? c.text += l : i.push({ text: l, ...a }), o = !0;
  }, d = (l, a, c = 0) => {
    if (!(c > Se))
      for (const h of Array.from(l.childNodes)) {
        if (h.nodeType === ie) {
          const u = h.data;
          if (!u || /^(UL|OL)$/.test(l.tagName ?? "") && !u.trim())
            continue;
          u.split(`
`).forEach((w, I) => {
            I > 0 && r(), s(w, a), I > 0 && !w && (o = !0);
          });
          continue;
        }
        if (h.nodeType !== oe)
          continue;
        const g = h;
        if (!ee.test(g.tagName ?? "")) {
          if (g.tagName === "BR") {
            if (n(g)) {
              o = !0;
              continue;
            }
            r();
            continue;
          }
          if (te.test(g.tagName ?? "")) {
            o && r(), d(g, a, c + 1), o && r();
            continue;
          }
          d(g, or(g, a), c + 1);
        }
      }
  };
  return d(t, {}), (o || e.length === 0) && e.push(i), e;
}
function ne(t) {
  return t.map((e) => e.text).join("");
}
function rr(t, e, i) {
  switch (t) {
    case "href":
      return `<a href="${Dt(String(e))}">${i}</a>`;
    case "color":
      return `<span style="color:${Dt(String(e))}">${i}</span>`;
    case "bold":
      return `<b>${i}</b>`;
    case "italic":
      return `<i>${i}</i>`;
    case "underline":
      return `<u>${i}</u>`;
    case "strike":
      return `<s>${i}</s>`;
  }
}
function Ne(t, e) {
  if (e.length === 0)
    return t.map((s) => Dt(s.text)).join("");
  const [i, ...o] = e;
  let r = "", n = 0;
  for (; n < t.length; ) {
    const s = t[n][i] || void 0;
    let d = n;
    for (; d < t.length && (t[d][i] || void 0) === s; )
      d++;
    const l = Ne(t.slice(n, d), o);
    r += s ? rr(i, s, l) : l, n = d;
  }
  return r;
}
function se(t) {
  return Ne(
    t.filter((e) => e.text),
    ve
  );
}
function nr(t, e = "none") {
  if (e === "bullet" || e === "number") {
    const o = e === "number" ? "ol" : "ul", r = t.map((n) => `<li>${ne(n).trim() ? se(n) : "<br>"}</li>`);
    return `<${o}>${r.join("")}</${o}>`;
  }
  const i = t.map(se).join("<br>");
  return t.length > 1 && !ne(t[t.length - 1]) ? i + "<br>" : i;
}
const Le = /\{\{\s*([^{}\n]+?)\s*\}\}/g;
function E(t) {
  return t.trim().toLowerCase();
}
function sr(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, o] of Object.entries(t))
    o !== void 0 && e.set(E(i), o);
  return (i) => e.get(E(i));
}
const lr = /^(address|blockquote|div|dl|dd|dt|h[1-6]|li|ol|p|pre|table|td|th|tr|ul)$/, le = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};
function ar(t) {
  return Number.isInteger(t) && t > 0 && t <= 1114111 && !(t >= 55296 && t <= 57343);
}
function Q(t) {
  return t.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (e, i) => {
    if (i[0] === "#") {
      const r = i[1] === "x" || i[1] === "X", n = r ? i.slice(2) : i.slice(1);
      if (!n || !(r ? /^[0-9a-f]+$/i : /^[0-9]+$/).test(n))
        return e;
      const s = parseInt(n, r ? 16 : 10);
      return ar(s) ? String.fromCodePoint(s) : e;
    }
    const o = i.toLowerCase();
    return Object.hasOwn(le, o) ? le[o] : e;
  });
}
function Zt(t) {
  if (!t)
    return "";
  const e = t.replace(/<br\s*\/?>/gi, `
`).replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (i, o) => lr.test(String(o).toLowerCase()) ? `
` : "");
  return Q(e).replace(/\n{3,}/g, `

`).replace(/^\n+|\n+$/g, "");
}
function dr(t) {
  return !t || !t.includes("{{") ? !1 : Zt(t).search(Le) !== -1;
}
function je(t) {
  if (!t || !t.includes("{{"))
    return [];
  const e = [], i = /* @__PURE__ */ new Set();
  for (const o of Zt(t).matchAll(Le)) {
    const r = o[1].trim(), n = E(r);
    i.has(n) || (i.add(n), e.push(r));
  }
  return e;
}
function ze(t, e) {
  if (!t || !t.includes("{{"))
    return t ?? "";
  let i = !1;
  const o = t.replace(/\{\{([^{}]*?)\}\}/g, (r, n, s) => {
    const d = Q(String(n).replace(/<[^>]*>/g, "")).trim();
    if (!d || /\n/.test(d))
      return r;
    const l = e(d);
    if (l === void 0)
      return r;
    const a = cr(t, s);
    return a === "attribute" ? r : (a === "href" && (i = !0), Be(l));
  });
  return i ? gr(o) : o;
}
function cr(t, e) {
  const i = t.lastIndexOf("<", e);
  if (i < 0 || i < t.lastIndexOf(">", e))
    return "text";
  const o = t.slice(i, e);
  return /\shref\s*=\s*("[^"]*|'[^']*|[^\s"'>]*)$/i.test(o) ? "href" : "attribute";
}
const hr = /(\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
function gr(t) {
  return t.replace(
    /<a\b[^>]*>/gi,
    (e) => e.replace(hr, (i, o, r, n, s) => {
      const d = De(Q(r ?? n ?? s ?? ""));
      return d ? `${o}href="${Be(d)}"` : "";
    })
  );
}
function Be(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ur(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fr(t) {
  return t.type === "w-text" && typeof t.text == "string";
}
function wr(t) {
  const e = [], i = /* @__PURE__ */ new Set();
  for (const o of t)
    if (fr(o))
      for (const r of je(o.text)) {
        const n = E(r);
        i.has(n) || (i.add(n), e.push(r));
      }
  return e;
}
function dt() {
  let t = "";
  for (; t.length < 12; )
    t += Math.floor(Math.random() * 4294967296).toString(16);
  return t.slice(0, 12);
}
function Ze(t) {
  return {
    name: "Text",
    type: "w-text",
    uuid: dt(),
    editable: !1,
    left: Math.round(t.left),
    top: Math.round(t.top),
    width: Math.round(t.width),
    height: Math.round(t.height),
    transform: "",
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing ?? 0,
    fontSize: t.fontSize,
    fontClass: { ...t.font },
    fontFamily: t.font.value,
    brandRole: t.brandRole,
    fontWeight: t.fontWeight ?? 400,
    fontStyle: "normal",
    writingMode: "horizontal-tb",
    textDecoration: "none",
    color: t.color,
    textAlign: t.textAlign ?? "left",
    text: t.text,
    opacity: 1,
    backgroundColor: "",
    parent: "-1",
    role: t.role,
    record: { width: 0, height: 0, minWidth: 0, minHeight: 0, dir: "horizontal" },
    rotate: "0",
    imgUrl: ""
  };
}
function D(t, e, i, o, r, n = 0) {
  const s = Math.max(1, Math.round(i)), d = Math.max(1, Math.round(o));
  return {
    name: "Shape",
    type: "w-svg",
    uuid: dt(),
    width: s,
    height: d,
    colors: [r],
    left: Math.round(t),
    top: Math.round(e),
    transform: "",
    radius: 0,
    opacity: 1,
    parent: "-1",
    svgUrl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${d}" preserveAspectRatio="none"><rect x="0" y="0" width="${s}" height="${d}" rx="${n}" fill="{{colors[0]}}"/></svg>`,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 }
  };
}
function He(t, e) {
  const i = Number(t.width) / Number(t.height) || 1, o = e.width && e.height ? e.width / e.height : i, r = o > i ? o / i : 1, n = o < i ? i / o : 1;
  return { zoom: r, zoomY: n, transform: ` scale(${r}, ${n}) translate(0px, 0px)` };
}
const yr = "image slot";
function pr(t, e, i, o, r) {
  const { zoom: n, zoomY: s, transform: d } = He({ width: i, height: o }, r);
  return {
    name: "Image",
    type: "w-image",
    uuid: dt(),
    width: Math.round(i),
    height: Math.round(o),
    left: Math.round(t),
    top: Math.round(e),
    zoom: n,
    zoomY: s,
    transform: d,
    radius: 0,
    opacity: 1,
    borderWidth: 0,
    borderColor: "#000000ff",
    borderStyle: "solid",
    parent: "-1",
    imgUrl: r.url,
    mask: "",
    setting: [],
    rotate: 0,
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10, dir: "all" },
    lock: !1,
    isNinePatch: !1,
    flip: "",
    sliceData: { ratio: 0, left: 0 },
    ...typeof r.alt == "string" && r.alt.trim() ? { alt: r.alt.trim() } : null
  };
}
function Te(t, e, i, o, r) {
  const n = {
    name: t,
    type: "page",
    uuid: "-1",
    left: 0,
    top: 0,
    width: e,
    height: i,
    backgroundColor: o,
    backgroundGradient: "",
    backgroundImage: "",
    backgroundTransform: {},
    opacity: 1,
    tag: 0,
    record: {}
  };
  return r && r.trim() && (n.notes = r.trim()), n;
}
function Ht(t) {
  return ur(t).split(`
`).join("<br/>");
}
const Ir = [
  { id: 1, oid: 0, value: "Inter", alias: "Inter", kind: "sans", url: "/fonts/inter-400-700.woff2", preview: "" },
  { id: 2, oid: 0, value: "Roboto", alias: "Roboto", kind: "sans", url: "/fonts/roboto-400-700.woff2", preview: "" },
  { id: 3, oid: 0, value: "Open Sans", alias: "Open Sans", kind: "sans", url: "/fonts/open-sans-400-700.woff2", preview: "" },
  { id: 4, oid: 0, value: "Lato", alias: "Lato", kind: "sans", url: "/fonts/lato-400.woff2", preview: "" },
  { id: 5, oid: 0, value: "Montserrat", alias: "Montserrat", kind: "sans", url: "/fonts/montserrat-400-700.woff2", preview: "" },
  { id: 6, oid: 0, value: "Poppins", alias: "Poppins", kind: "sans", url: "/fonts/poppins-400.woff2", preview: "" },
  { id: 7, oid: 0, value: "Nunito", alias: "Nunito", kind: "sans", url: "/fonts/nunito-400-700.woff2", preview: "" },
  { id: 8, oid: 0, value: "Quicksand", alias: "Quicksand", kind: "sans", url: "/fonts/quicksand-400-700.woff2", preview: "" },
  { id: 9, oid: 0, value: "Archivo", alias: "Archivo", kind: "sans", url: "/fonts/archivo-400-700.woff2", preview: "" },
  { id: 10, oid: 0, value: "Oswald", alias: "Oswald", kind: "display", url: "/fonts/oswald-400-700.woff2", preview: "" },
  { id: 11, oid: 0, value: "Anton", alias: "Anton", kind: "display", url: "/fonts/anton-400.woff2", preview: "" },
  { id: 12, oid: 0, value: "Bebas Neue", alias: "Bebas Neue", kind: "display", url: "/fonts/bebas-neue-400.woff2", preview: "" },
  { id: 13, oid: 0, value: "Fredoka", alias: "Fredoka", kind: "display", url: "/fonts/fredoka-400-700.woff2", preview: "" },
  { id: 14, oid: 0, value: "Merriweather", alias: "Merriweather", kind: "serif", url: "/fonts/merriweather-400-700.woff2", preview: "" },
  { id: 15, oid: 0, value: "Playfair Display", alias: "Playfair Display", kind: "serif", url: "/fonts/playfair-display-400-700.woff2", preview: "" },
  { id: 16, oid: 0, value: "Lora", alias: "Lora", kind: "serif", url: "/fonts/lora-400-700.woff2", preview: "" },
  { id: 17, oid: 0, value: "Libre Baskerville", alias: "Libre Baskerville", kind: "serif", url: "/fonts/libre-baskerville-400-700.woff2", preview: "" },
  { id: 18, oid: 0, value: "Source Serif 4", alias: "Source Serif", kind: "serif", url: "/fonts/source-serif-4-400-700.woff2", preview: "" },
  { id: 19, oid: 0, value: "Caveat", alias: "Caveat", kind: "handwriting", url: "/fonts/caveat-400-700.woff2", preview: "" },
  { id: 20, oid: 0, value: "Pacifico", alias: "Pacifico", kind: "handwriting", url: "/fonts/pacifico-400.woff2", preview: "" },
  { id: 21, oid: 0, value: "Space Grotesk", alias: "Space Grotesk", kind: "sans", url: "/fonts/space-grotesk-400-700.woff2", preview: "" },
  { id: 22, oid: 0, value: "Karla", alias: "Karla", kind: "sans", url: "/fonts/karla-400-700.woff2", preview: "" },
  { id: 23, oid: 0, value: "Spectral", alias: "Spectral", kind: "serif", url: "/fonts/spectral-400.woff2", preview: "" },
  { id: 24, oid: 0, value: "DM Serif Display", alias: "DM Serif Display", kind: "serif", url: "/fonts/dm-serif-display-400.woff2", preview: "" },
  { id: 25, oid: 0, value: "IBM Plex Mono", alias: "IBM Plex Mono", kind: "mono", url: "/fonts/ibm-plex-mono-400.woff2", preview: "" },
  { id: 26, oid: 0, value: "JetBrains Mono", alias: "JetBrains Mono", kind: "mono", url: "/fonts/jetbrains-mono-400-700.woff2", preview: "" },
  { id: 27, oid: 0, value: "Raleway", alias: "Raleway", kind: "sans", url: "/fonts/raleway-400-700.woff2", preview: "" },
  { id: 28, oid: 0, value: "Lexend", alias: "Lexend", kind: "sans", url: "/fonts/lexend-400-700.woff2", preview: "" },
  { id: 29, oid: 0, value: "Atkinson Hyperlegible", alias: "Atkinson Hyperlegible", kind: "sans", url: "/fonts/atkinson-hyperlegible-400.woff2", preview: "" },
  { id: 30, oid: 0, value: "Archivo Narrow", alias: "Archivo Narrow", kind: "sans", url: "/fonts/archivo-narrow-400-700.woff2", preview: "" },
  { id: 31, oid: 0, value: "Barlow Condensed", alias: "Barlow Condensed", kind: "sans", url: "/fonts/barlow-condensed-400.woff2", preview: "" },
  { id: 32, oid: 0, value: "Roboto Slab", alias: "Roboto Slab", kind: "serif", url: "/fonts/roboto-slab-400-700.woff2", preview: "" },
  { id: 33, oid: 0, value: "EB Garamond", alias: "EB Garamond", kind: "serif", url: "/fonts/eb-garamond-400-700.woff2", preview: "" },
  { id: 34, oid: 0, value: "Alfa Slab One", alias: "Alfa Slab One", kind: "display", url: "/fonts/alfa-slab-one-400.woff2", preview: "" },
  { id: 35, oid: 0, value: "Lilita One", alias: "Lilita One", kind: "display", url: "/fonts/lilita-one-400.woff2", preview: "" },
  { id: 36, oid: 0, value: "Abril Fatface", alias: "Abril Fatface", kind: "display", url: "/fonts/abril-fatface-400.woff2", preview: "" },
  { id: 37, oid: 0, value: "Patrick Hand", alias: "Patrick Hand", kind: "handwriting", url: "/fonts/patrick-hand-400.woff2", preview: "" },
  { id: 38, oid: 0, value: "Permanent Marker", alias: "Permanent Marker", kind: "handwriting", url: "/fonts/permanent-marker-400.woff2", preview: "" }
], xr = 8, We = ["name", "shortName", "tagline", "address", "phone", "email", "website"], Ee = [
  { field: "school.name", key: "name", label: "School name" },
  { field: "school.short_name", key: "shortName", label: "Short name" },
  { field: "school.tagline", key: "tagline", label: "Tagline" },
  { field: "school.address", key: "address", label: "Address" },
  { field: "school.phone", key: "phone", label: "Phone" },
  { field: "school.email", key: "email", label: "Email" },
  { field: "school.website", key: "website", label: "Website" }
], mr = {
  name: "Springfield Elementary",
  shortName: "Springfield",
  tagline: "Learning together",
  address: "100 School Street, Springfield",
  phone: "(555) 010-2200",
  email: "office@springfield.k12.us",
  website: "springfield.k12.us"
};
function Mr() {
  return { name: "", shortName: "", tagline: "", address: "", phone: "", email: "", website: "", colors: [], fonts: {} };
}
function br(t) {
  return We.some((e) => (t[e] || "").trim() !== "");
}
function kr(t) {
  const e = String(t || "").trim().replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]+$/.test(e) ? e.length === 3 ? `#${e[0]}${e[0]}${e[1]}${e[1]}${e[2]}${e[2]}ff` : e.length === 6 ? `#${e}ff` : e.length === 8 ? `#${e}` : null : null;
}
function rt(t) {
  return t ? Ir.find((e) => e.id === t) : void 0;
}
function Ar(t, e) {
  switch (E(e)) {
    case "upper":
      return t.toUpperCase();
    case "lower":
      return t.toLowerCase();
    default:
      return t;
  }
}
function Ge(t) {
  const e = br(t) ? t : mr, i = {};
  for (const { field: r, key: n } of Ee) {
    const s = (e[n] || "").trim();
    i[r] = s || void 0;
  }
  const o = sr(i);
  return (r) => {
    const [n, ...s] = r.split("|"), d = o(n);
    if (d !== void 0)
      return s.reduce(Ar, d);
  };
}
function Re(t) {
  const e = E(t.split("|")[0]);
  return Ee.some((i) => i.field === e);
}
function Tt(t) {
  const e = Mr();
  if (!t || typeof t != "object")
    return e;
  for (const n of We) {
    const s = t[n];
    e[n] = typeof s == "string" ? s : "";
  }
  const i = Array.isArray(t.colors) ? t.colors : [];
  for (const n of i) {
    const s = kr(String(n));
    s && !e.colors.includes(s) && e.colors.length < xr && e.colors.push(s);
  }
  const o = t.fonts && typeof t.fonts == "object" ? t.fonts : {};
  rt(o.heading) && (e.fonts.heading = o.heading), rt(o.body) && (e.fonts.body = o.body);
  const r = t.logo;
  return r && typeof r.url == "string" && r.url && (e.logo = { url: r.url, width: Number(r.width) || 0, height: Number(r.height) || 0 }), e;
}
const vr = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i;
function J(t) {
  const e = vr.exec((t || "").trim());
  return e ? { rgb: e[1].toLowerCase(), alpha: (e[2] || "ff").toLowerCase() } : null;
}
function Sr(t, e, i) {
  const o = (r) => {
    const n = J(r);
    return !n || n.rgb !== e.rgb ? r : n.alpha === e.alpha ? `#${i.rgb}${i.alpha}` : `#${i.rgb}${n.alpha}`;
  };
  return t.map((r) => {
    const n = { ...r };
    if (n.filling) {
      const s = { ...n.filling }, d = s.gradient?.stops;
      d && (s.gradient = {
        ...s.gradient,
        stops: d.map((a) => ({ ...a, color: o(a.color) }))
      });
      const l = s.imageContent?.pattern;
      if (l?.colors) {
        const a = l.colors.map((c) => o(c));
        s.imageContent = { ...s.imageContent, pattern: { ...l, colors: a } }, s.color = a[0];
      } else
        s.color = o(s.color);
      n.filling = s;
    }
    return n.stroke && (n.stroke = { ...n.stroke, color: o(n.stroke.color) }), n.shadow && (n.shadow = { ...n.shadow, color: o(n.shadow.color) }), n;
  });
}
function Pe(t, e, i) {
  const o = J(e), r = J(i);
  return !o || !r || o.alpha === "00" || o.rgb === r.rgb && o.alpha === r.alpha ? t : Sr(t, o, r);
}
function Dr(t, e) {
  const i = Array.isArray(t) ? t : [], o = J(e), r = o && o.alpha !== "00" ? o.rgb : null, n = /* @__PURE__ */ new Map(), s = (d) => {
    const l = J(d);
    if (!l || l.alpha === "00" || l.rgb === r)
      return;
    const a = n.get(l.rgb);
    (!a || parseInt(l.alpha, 16) > parseInt(a, 16)) && n.set(l.rgb, l.alpha);
  };
  for (const d of [...i].reverse()) {
    const l = d.filling;
    if (l?.enable) {
      const a = Number(l.type);
      if (a === 2)
        for (const c of l.gradient?.stops || [])
          s(c.color);
      else if (a === 1)
        for (const c of l.imageContent?.pattern?.colors || [])
          s(c);
      else
        s(l.color);
    }
    d.stroke?.enable && s(d.stroke.color), d.shadow?.enable && s(d.shadow.color);
  }
  return [...n].map(([d, l]) => ({ rgb: d, alpha: l, value: `#${d}${l}` }));
}
const Cr = (t, e, i) => {
  let o = Math.round(t).toString(16), r = Math.round(e).toString(16), n = Math.round(i).toString(16);
  return o.length === 1 && (o = "0" + o), r.length === 1 && (r = "0" + r), n.length === 1 && (n = "0" + n), "#" + o + r + n;
}, Nr = (t, e, i, o = 1) => {
  const r = Cr(t, e, i);
  let n = Math.round(o * 255).toString(16);
  return n.length === 1 && (n = "0" + n), r + n;
}, Lr = "circle at 50% 50%", jr = (t) => /^(linear|radial)-gradient\(/.test(t?.trim() || "");
function zr(t, e, i) {
  const o = i.map((n) => `${n.color} ${n.offset * 100}%`).join(",");
  if (t === "radial")
    return `radial-gradient(${Lr}, ${o})`;
  const r = Number(e);
  return `linear-gradient(${Number.isFinite(r) ? r : 180}deg, ${o})`;
}
function Br(t) {
  const e = [];
  let i = 0, o = 0;
  for (let r = 0; r < t.length; r += 1) {
    const n = t[r];
    n === "(" ? i += 1 : n === ")" ? i -= 1 : n === "," && i === 0 && (e.push(t.slice(o, r)), o = r + 1);
  }
  return e.push(t.slice(o)), e.map((r) => r.trim()).filter(Boolean);
}
function Zr(t) {
  if (t.startsWith("#"))
    return t.length === 7 ? t + "ff" : t;
  const [e = 0, i = 0, o = 0, r = 1] = (t.match(/[\d.]+/g) || []).map(Number);
  return Nr(e, i, o, r);
}
function Mt(t) {
  const e = /^(linear|radial)-gradient\((.*)\)\s*$/s.exec(t?.trim() || "");
  if (!e)
    return null;
  const i = e[1], o = Br(e[2]);
  let r = 180;
  const n = o[0] || "";
  if (/^(-?[\d.]+deg|to\s|circle|ellipse|at\s|closest|farthest)/.test(n)) {
    o.shift();
    const d = /(-?[\d.]+)deg/.exec(n);
    d && (r = Number(d[1]));
  }
  const s = [];
  return o.forEach((d, l) => {
    const a = /\s(-?[\d.]+)%\s*$/.exec(d), c = a ? d.slice(0, a.index) : d, h = a ? Number(a[1]) / 100 : l / Math.max(1, o.length - 1);
    s.push({ color: Zr(c.trim()), offset: h });
  }), s.length ? { type: i, angle: r, stops: s } : null;
}
const ct = /* @__PURE__ */ new Set(["w-rect", "w-ellipse", "w-polygon", "w-path"]);
function ae(t) {
  return t.type === "w-text" && typeof t.text == "string";
}
function Hr(t) {
  return Math.round(Math.min(t.width, t.height) * 0.045);
}
function Ue(t) {
  const e = t.fontWeight;
  return e === "bold" || e === "bolder" || Number(e) >= 600;
}
function Tr(t) {
  const { id: e, oid: i, value: o, url: r, alias: n, preview: s } = t;
  return { id: e, oid: i, value: o, url: r, alias: n, preview: s };
}
function Fe(t, e) {
  const i = rt(e.fonts.heading), o = rt(e.fonts.body);
  return t === "heading" ? i || o : o || i;
}
function Wr(t, e) {
  return t.fontClass?.value === e.value ? !1 : (t.fontClass = Tr(e), t.fontFamily = e.value, !0);
}
function v(t) {
  if (typeof t != "string")
    return null;
  const e = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(t.trim());
  return e ? { rgb: e[1].toLowerCase(), alpha: (e[2] || "ff").toLowerCase() } : null;
}
function ht(t) {
  const e = parseInt(t.slice(0, 2), 16), i = parseInt(t.slice(2, 4), 16), o = parseInt(t.slice(4, 6), 16), r = Math.max(e, i, o), n = Math.min(e, i, o), s = (r + n) / 2 / 255;
  return r - n < 28 || s > 0.94 || s < 0.1;
}
function W(t, e, i) {
  const o = e();
  if (typeof o != "string" || !jr(o))
    return [{ kind: t, read: e, write: i }];
  const r = Mt(o);
  return r ? r.stops.map((n, s) => ({
    kind: t,
    read: () => Mt(String(e() ?? ""))?.stops[s]?.color,
    // Re-read rather than closed over, so two stops of the same gradient can
    // both be repainted in one pass without the second undoing the first.
    write: (d) => {
      const l = Mt(String(e() ?? ""));
      if (!l)
        return;
      const a = l.stops.map((c, h) => h === s ? { ...c, color: d } : c);
      i(zr(l.type, l.angle, a));
    }
  })) : [];
}
function Er(t) {
  return Dr(t.textEffects, t.color).map((e) => ({
    kind: "layer",
    read: () => e.value,
    write: (i) => {
      t.textEffects = Pe(JSON.parse(JSON.stringify(t.textEffects)), e.value, i);
    }
  }));
}
function Ye(t) {
  const e = [];
  for (const i of t) {
    const o = i.global;
    o.backgroundImage || (o.backgroundGradient ? e.push(
      ...W(
        "page",
        () => o.backgroundGradient,
        (r) => o.backgroundGradient = r
      )
    ) : e.push(
      ...W(
        "page",
        () => o.backgroundColor,
        (r) => o.backgroundColor = r
      )
    ));
    for (const r of i.layers)
      r.type === "w-text" ? (e.push(
        ...W(
          "layer",
          () => r.color,
          (n) => R(r, n)
        )
      ), e.push(...Er(r))) : ct.has(r.type) ? e.push(
        ...W(
          "layer",
          () => r.color,
          (n) => r.color = n
        )
      ) : r.type === "w-svg" && Array.isArray(r.colors) && r.colors.forEach((n, s) => {
        e.push(
          ...W(
            "layer",
            () => r.colors[s],
            (d) => {
              const l = r.colors.slice();
              l[s] = d, r.colors = l;
            }
          )
        );
      }), Number(r.borderWidth) > 0 && r.borderColor && e.push(
        ...W(
          "layer",
          () => r.borderColor,
          (n) => r.borderColor = n
        )
      );
  }
  return e;
}
function R(t, e) {
  const i = t.textEffects;
  Array.isArray(i) && i.length && (t.textEffects = Pe(JSON.parse(JSON.stringify(i)), t.color, e)), t.color = e;
}
function Gr(t) {
  const e = /* @__PURE__ */ new Map();
  for (const i of Ye(t)) {
    const o = v(i.read());
    !o || ht(o.rgb) || e.set(o.rgb, (e.get(o.rgb) || 0) + 1);
  }
  return [...e.entries()].sort((i, o) => o[1] - i[1]).map(([i]) => i);
}
const Ct = /* @__PURE__ */ new Set([...ct, "w-svg"]);
function U(t) {
  const e = Number(t.left) || 0, i = Number(t.top) || 0;
  return { left: e, top: i, right: e + (Number(t.width) || 0), bottom: i + (Number(t.height) || 0) };
}
function Rr(t, e, i) {
  return e >= t.left && e <= t.right && i >= t.top && i <= t.bottom;
}
function Pr(t, e) {
  return t.left <= e.left && t.top <= e.top && t.right >= e.right && t.bottom >= e.bottom;
}
function Je(t) {
  const e = /* @__PURE__ */ new Map();
  return t.forEach((i, o) => e.set(i.uuid, o)), t.map((i, o) => {
    const r = i.parent ? e.get(i.parent) : void 0;
    return [r === void 0 ? o : r, o];
  });
}
function nt(t, e) {
  return t[0] !== e[0] ? t[0] > e[0] : t[1] > e[1];
}
function Nt(t) {
  if (ct.has(t.type))
    return t.color;
  if (t.type === "w-svg")
    return Array.isArray(t.colors) ? t.colors[0] : void 0;
}
function Wt(t, e, i, o) {
  const r = U(e[t]), n = (r.left + r.right) / 2, s = (r.top + r.bottom) / 2;
  let d = null, l = null;
  for (let c = 0; c < e.length; c++) {
    const h = e[c];
    c === t || h.hidden || h.isContainer || nt(i[t], i[c]) && (l && !nt(i[c], l) || Rr(U(h), n, s) && (d = h, l = i[c]));
  }
  if (!d)
    return o;
  if (!Ct.has(d.type))
    return null;
  const a = v(Nt(d));
  return a ? a.alpha === "00" ? o : o ? { color: H(`#${a.rgb}${a.alpha}`, o.color), rgb: a.rgb, uuid: d.uuid, bounds: U(d) } : null : null;
}
function Qe(t) {
  if (t.backgroundImage || t.backgroundGradient)
    return null;
  const e = v(t.backgroundColor);
  if (!e)
    return null;
  const i = { left: 0, top: 0, right: Number(t.width) || 0, bottom: Number(t.height) || 0 };
  return { color: H(`#${e.rgb}${e.alpha}`, tt), rgb: e.rgb, uuid: "", bounds: i };
}
function Ur(t, e) {
  const i = Je(t), o = Qe(e);
  return (r) => Wt(r, t, i, o)?.color ?? null;
}
const Fr = 0.5;
function Yr(t) {
  let e = null, i = Fr;
  for (const o of t) {
    if (o.type !== "w-text")
      continue;
    const r = v(o.color);
    if (!r || !ht(r.rgb))
      continue;
    const n = it(`#${r.rgb}`);
    n < i && (e = `#${r.rgb}ff`, i = n);
  }
  return e ?? Mi;
}
function Oe() {
  return { adjusted: 0, swapped: 0, unreadable: 0, marks: 0, marksSwapped: 0 };
}
function Jr(t, e, i) {
  const o = Oe(), r = /* @__PURE__ */ new Set();
  for (const h of i.colors) {
    const g = v(h);
    g && r.add(g.rgb);
  }
  if (!r.size)
    return o;
  const n = Yr(t), s = Je(t), d = Qe(e), l = t.map((h, g) => h.type === "w-text" && !h.hidden ? Wt(g, t, s, d) : null), a = /* @__PURE__ */ new Set();
  for (const h of l)
    h?.uuid && a.add(h.uuid);
  for (let h = 0; h < t.length; h++) {
    const g = t[h];
    if (g.type !== "w-text" || g.hidden)
      continue;
    const u = v(g.color);
    if (!u)
      continue;
    const y = l[h];
    if (!y)
      continue;
    const w = r.has(y.rgb), I = r.has(u.rgb);
    if (!w && !I)
      continue;
    const p = xe(Number(g.fontSize) || 0, Ue(g), e), f = H(`#${u.rgb}${u.alpha}`, y.color);
    if (N(f, y.color) >= p)
      continue;
    const m = `#${u.rgb}${u.alpha}`;
    if (ht(u.rgb)) {
      const B = vt(y.color, [m, tt, n]);
      B !== m && (R(g, `#${v(B).rgb}${u.alpha}`), o.swapped++), N(B, y.color) < p && o.unreadable++;
      continue;
    }
    const b = ot(m, y.color, p);
    if (b.met) {
      b.changed && (R(g, b.color), o.adjusted++);
      continue;
    }
    const A = vt(y.color, [b.color, tt, n]);
    A === b.color ? b.changed && (R(g, b.color), o.adjusted++) : (R(g, `#${v(A).rgb}${u.alpha}`), o.swapped++), N(A, y.color) < p && o.unreadable++;
  }
  const c = Or(t, s, d, r, n, a);
  return o.marks = c.nudged, o.marksSwapped = c.swapped, o;
}
function de(t) {
  return Math.max(0, t.right - t.left) * Math.max(0, t.bottom - t.top);
}
const Qr = 0.25;
function Or(t, e, i, o, r, n) {
  const s = { nudged: 0, swapped: 0 };
  if (!i)
    return s;
  for (let d = 0; d < t.length; d++) {
    const l = t[d];
    if (l.hidden || l.isContainer || !Ct.has(l.type) || l.type === "w-svg" && l.colors?.length !== 1)
      continue;
    const a = v(Nt(l));
    if (!a || a.alpha === "00")
      continue;
    const c = `#${a.rgb}${a.alpha}`, h = U(l);
    if (ht(a.rgb)) {
      const w = Wt(d, t, e, i);
      if (!w || !o.has(w.rgb) || n.has(l.uuid) || de(h) > Qr * de(w.bounds) || N(H(c, w.color), w.color) >= _t)
        continue;
      const I = vt(w.color, [c, tt, r]);
      if (I === c)
        continue;
      ce(l, `#${v(I).rgb}${a.alpha}`), s.swapped++;
      continue;
    }
    if (!o.has(a.rgb))
      continue;
    let g = "", u = null;
    for (let w = 0; w < t.length; w++) {
      const I = t[w];
      if (w === d || I.hidden || !Ct.has(I.type) || !nt(e[d], e[w]) || u && !nt(e[w], u) || !Pr(U(I), h))
        continue;
      const p = v(Nt(I));
      !p || !o.has(p.rgb) || p.alpha === "00" || (g = H(`#${p.rgb}${p.alpha}`, i.color), u = e[w]);
    }
    if (!g || N(H(c, g), g) >= 1.5)
      continue;
    const y = ot(c, g, _t);
    y.changed && (ce(l, y.color), s.nudged++);
  }
  return s;
}
function ce(t, e) {
  ct.has(t.type) ? t.color = e : t.colors = [e];
}
function Vr(t, e, i) {
  const o = { filled: 0, fieldPages: 0, unresolved: 0, fonts: 0, recoloured: 0, backgrounds: 0, readability: Oe() };
  if (i.fields) {
    const r = Ge(e), n = /* @__PURE__ */ new Set();
    t.forEach((s, d) => {
      for (const l of s.layers) {
        if (!ae(l) || !dr(l.text))
          continue;
        const a = ze(l.text, r);
        a !== l.text && (l.text = a, o.filled++, n.add(d));
      }
    }), o.fieldPages = n.size, o.unresolved = wr(t.flatMap((s) => s.layers)).filter(Re).length;
  }
  if (i.fonts && (e.fonts.heading || e.fonts.body))
    for (const r of t) {
      const n = Hr(r.global);
      for (const s of r.layers) {
        if (!ae(s))
          continue;
        const d = s.brandRole;
        if (d === "keep")
          continue;
        const l = d ? d === "heading" : Ue(s) || Number(s.fontSize) >= n, a = Fe(l ? "heading" : "body", e);
        a && Wr(s, a) && o.fonts++;
      }
    }
  if (i.colors && e.colors.length) {
    const r = Gr(t).slice(0, e.colors.length), n = /* @__PURE__ */ new Map();
    if (r.forEach((s, d) => {
      const l = v(e.colors[d]);
      l && l.rgb !== s && n.set(s, l.rgb);
    }), n.size) {
      for (const s of Ye(t)) {
        const d = v(s.read()), l = d && n.get(d.rgb);
        !d || !l || (s.write(`#${l}${d.alpha}`), s.kind === "page" ? o.backgrounds++ : o.recoloured++);
      }
      for (const s of t) {
        const d = Jr(s.layers, s.global, e);
        o.readability.adjusted += d.adjusted, o.readability.swapped += d.swapped, o.readability.unreadable += d.unreadable, o.readability.marks += d.marks, o.readability.marksSwapped += d.marksSwapped;
      }
    }
  }
  return o;
}
function st(t, e) {
  if (!e)
    return t;
  const i = Tt(e), o = (r) => {
    const n = Fe(r, i);
    return n ? { id: n.id, value: n.value, url: n.url, alias: n.alias } : null;
  };
  return { ...t, display: o("heading") ?? t.display, body: o("body") ?? t.body };
}
function lt(t) {
  if (!t)
    return (i) => i;
  const e = Ge(Tt(t));
  return (i) => ze(i, e);
}
function gt(t, e) {
  const i = JSON.parse(JSON.stringify(t));
  return Vr(i.layouts, Tt(e), { fields: !0, fonts: !0, colors: !0 }), i;
}
function ut() {
  const t = /* @__PURE__ */ new Set(), e = {
    report: { continuedPages: 0, dropped: [] },
    page: 0,
    source: 0,
    note(i, o, r, n) {
      const s = String(o ?? "").trim();
      if (!s)
        return;
      const d = i === "footer" ? `footer|${r}` : `${e.source}|${i}|${r}`;
      t.has(d) || (t.add(d), e.report.dropped.push({ page: n ?? e.page, source: e.source, field: i, text: s, reason: r }));
    }
  };
  return e;
}
function Ve() {
  return ut();
}
function $e(t, e) {
  const i = Math.floor(Number(t));
  return Number.isFinite(i) && i >= 1 ? Math.min(i, e) : e;
}
const x = 110, { width: Xe, height: _e } = q, k = Xe - x * 2, j = _e - 96, Ke = ["title", "statement", "content", "two-column", "media"];
function Et(t) {
  return { layout: t, title: null, kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null };
}
function Lt(t, e, i) {
  const o = String(t || "").trim();
  if (!o)
    return null;
  const r = ke(o, { fontFamily: i.font.value, fontSize: i.size, lineHeight: i.lineHeight, letterSpacing: i.tracking, bold: (i.weight || 400) >= 600 }, { width: e.width, height: e.height, minFontSize: i.minSize, maxLines: i.maxLines });
  if (!r.lines.length)
    return null;
  const n = Ae(r, i.lineHeight);
  return {
    widget: Ze({
      left: e.left,
      top: e.top,
      width: e.width,
      height: n,
      fontSize: r.fontSize,
      lineHeight: i.lineHeight,
      letterSpacing: i.tracking ? Math.round(i.tracking * (r.fontSize / i.size)) : 0,
      color: i.color,
      font: i.font,
      fontWeight: i.weight,
      textAlign: i.align,
      brandRole: i.brandRole,
      role: i.role,
      text: Ht(r.lines.join(`
`))
    }),
    bottom: e.top + n,
    truncated: r.truncated
  };
}
function C(t, e, i, o, r) {
  const n = Lt(i, o, r);
  return n?.truncated && t.rec.note(e, String(i), "shortened"), n;
}
function ft(t, e, i, o, r = x, n = k) {
  return C(
    t,
    "kicker",
    i ? i.toUpperCase() : null,
    { left: r, top: o, width: n, height: 40 },
    {
      font: e.eyebrow,
      size: 25,
      minSize: 18,
      lineHeight: 1.3,
      tracking: e.eyebrowTracking,
      color: e.accent,
      brandRole: "keep",
      role: "eyebrow",
      maxLines: 1
    }
  );
}
function he(t) {
  return Array.isArray(t) ? t.map((e, i) => ({
    text: String(e?.text ?? ""),
    sub: Array.isArray(e?.sub) ? e.sub.map((o) => String(o ?? "")) : [],
    at: i,
    subAt: 0,
    repeat: !1
  })) : [];
}
function Gt(t, e, i, o, r, n, s) {
  const d = [], l = Math.round(n * 0.75), a = Math.round(n * 0.35), c = Math.round(n * 1.3);
  let h = r.top;
  const g = r.top + r.height, u = { font: i.body, size: n, minSize: Math.round(n * 0.72), lineHeight: 1.4, color: i.ink, brandRole: "body", role: "bullet" }, y = { font: i.body, size: Math.round(n * 0.82), minSize: Math.round(n * 0.62), lineHeight: 1.4, color: i.muted, brandRole: "body", role: "sub-bullet" }, w = (I, p) => !!I && I.bottom <= g && (!I.truncated || p);
  for (let I = 0; I < o.length; I++) {
    const p = o[I], f = d.length === 0, m = f && s, b = [];
    let A = h;
    const B = `${e}[${p.at}]`, G = Lt(p.text, { left: r.left + c, top: A, width: r.width - c, height: g - A }, u);
    if (p.text.trim() && !w(G, m)) {
      if (!m)
        return { widgets: d, rest: o.slice(I) };
      t.rec.note(B, p.text, "no-room"), p.sub.forEach((z, T) => t.rec.note(`${B}.sub[${p.subAt + T}]`, z, "no-room"));
      continue;
    }
    G && (G.truncated && !p.repeat && t.rec.note(B, p.text, "shortened"), b.push(D(r.left + Math.round(n * 0.35), A + Math.round(n * 0.52), Math.round(n * 0.3), Math.round(n * 0.3), i.accent, 999)), b.push(G.widget), A = G.bottom + a);
    let $ = -1, Jt = 0;
    for (let z = 0; z < p.sub.length; z++) {
      const T = p.sub[z];
      if (!T.trim())
        continue;
      const Qt = `${B}.sub[${p.subAt + z}]`, Ot = m && Jt === 0, X = Lt(T, { left: r.left + c * 2, top: A, width: r.width - c * 2, height: g - A }, y);
      if (!w(X, Ot)) {
        if (Ot) {
          t.rec.note(Qt, T, "no-room");
          continue;
        }
        $ = z;
        break;
      }
      X.truncated && t.rec.note(Qt, T, "shortened"), b.push(D(r.left + c, A + Math.round(n * 0.5), Math.round(n * 0.5), 2, i.muted)), b.push(X.widget), A = X.bottom + a, Jt++;
    }
    if ($ >= 0) {
      if (!f)
        return { widgets: d, rest: o.slice(I) };
      d.push(...b);
      const z = { text: p.text, sub: p.sub.slice($), at: p.at, subAt: p.subAt + $, repeat: !0 };
      return { widgets: d, rest: [z, ...o.slice(I + 1)] };
    }
    d.push(...b), h = A + l - a;
  }
  return { widgets: d, rest: [] };
}
function O(t, e) {
  const i = D(x, j, k, 2, e.rule), o = t.fill("{{school.name|upper}}"), r = C(
    t,
    "footer",
    o,
    { left: x, top: j + 22, width: k, height: 32 },
    {
      font: e.eyebrow,
      size: 22,
      minSize: 16,
      lineHeight: 1.3,
      tracking: Math.round(e.eyebrowTracking / 2),
      color: e.muted,
      brandRole: "keep",
      role: "school.name",
      maxLines: 1
    }
  );
  return r ? [i, r.widget] : [i];
}
function Rt(t, e = []) {
  return t.length || e.length ? { bullets: t, bulletsRight: e } : null;
}
function $r(t, e, i) {
  const o = [], r = ft(i, t, e.kicker, 110);
  r && o.push(r.widget), o.push(D(x, 190, 150, 8, t.accent));
  const n = C(
    i,
    "title",
    e.title,
    { left: x, top: 260, width: Math.round(k * 0.84), height: 400 },
    {
      font: t.display,
      size: 112,
      minSize: 52,
      lineHeight: t.displayLineHeight,
      tracking: t.displayTracking,
      color: t.ink,
      weight: t.displayWeight,
      brandRole: "heading",
      role: "heading"
    }
  );
  let s = 660;
  n && (o.push(n.widget), s = n.bottom + 46);
  const d = C(
    i,
    "sub",
    e.sub,
    { left: x, top: s, width: Math.round(k * 0.68), height: j - 40 - s },
    {
      font: t.body,
      size: 38,
      minSize: 26,
      lineHeight: 1.4,
      color: t.muted,
      brandRole: "body",
      role: "body"
    }
  );
  return d && o.push(d.widget), { layers: [...o, ...O(i, t)], overflow: null };
}
function Xr(t, e, i) {
  const o = [D(x, 250, 10, 420, t.accent)], r = x + 70, n = k - 70, s = ft(i, t, e.kicker, 110);
  s && o.push(s.widget);
  const d = C(
    i,
    e.title ? "title" : "callout",
    e.title || e.callout,
    { left: r, top: 270, width: n, height: 380 },
    {
      font: t.display,
      size: 84,
      minSize: 40,
      lineHeight: 1.18,
      color: t.ink,
      weight: t.displayWeight,
      brandRole: "heading",
      role: "heading"
    }
  );
  let l = 680;
  d && (o.push(d.widget), l = d.bottom + 40);
  const a = C(
    i,
    "sub",
    e.sub,
    { left: r, top: l, width: Math.round(n * 0.7), height: j - 40 - l },
    {
      font: t.body,
      size: 32,
      minSize: 22,
      lineHeight: 1.4,
      color: t.muted,
      brandRole: "body",
      role: "body"
    }
  );
  return a && o.push(a.widget), { layers: [...o, ...O(i, t)], overflow: null };
}
function qe(t, e, i, o, r = k) {
  const n = ft(t, e, i.kicker, 110, x, r);
  let s = n ? n.bottom + 14 : 110;
  n && o.push(n.widget);
  const d = C(
    t,
    "title",
    i.title,
    { left: x, top: s, width: r, height: 200 },
    {
      font: e.display,
      size: 62,
      minSize: 34,
      lineHeight: 1.15,
      color: e.ink,
      weight: e.displayWeight,
      brandRole: "heading",
      role: "heading"
    }
  );
  return d && (o.push(d.widget), s = d.bottom + 26), o.push(D(x, s, r, 2, e.rule)), s + 40;
}
function ti(t, e, i) {
  const o = [];
  let r = qe(i, t, e, o);
  const n = C(
    i,
    "sub",
    e.sub,
    { left: x, top: r, width: Math.round(k * 0.8), height: 130 },
    {
      font: t.body,
      size: 30,
      minSize: 22,
      lineHeight: 1.4,
      color: t.muted,
      brandRole: "body",
      role: "body"
    }
  );
  n && (o.push(n.widget), r = n.bottom + 34);
  const s = e.callout ? 130 : 0, d = Gt(i, "bullets", t, e.bullets, { left: x, top: r, width: k, height: j - 40 - s - r }, 32, e.continued);
  if (o.push(...d.widgets), e.callout) {
    const l = j - 40 - s;
    o.push(D(x, l, k, s - 16, t.accent, 8));
    const a = C(
      i,
      "callout",
      e.callout,
      { left: x + 34, top: l + 28, width: k - 68, height: s - 72 },
      {
        font: t.body,
        size: 30,
        minSize: 20,
        lineHeight: 1.35,
        color: t.paper,
        brandRole: "body",
        role: "callout"
      }
    );
    a && o.push(a.widget);
  }
  return { layers: [...o, ...O(i, t)], overflow: Rt(d.rest) };
}
function _r(t, e, i) {
  const o = [], r = qe(i, t, e, o), n = 80, s = Math.round((k - n) / 2), d = [
    { key: "bullets", left: x, head: e.columnHeads[0] || null, items: e.bullets },
    { key: "bulletsRight", left: x + s + n, head: e.columnHeads[1] || null, items: e.bulletsRight }
  ];
  o.push(D(x + s + Math.round(n / 2), r, 2, j - 40 - r, t.rule));
  const l = { bullets: [], bulletsRight: [] };
  return d.forEach((a, c) => {
    let h = r;
    const g = C(
      i,
      `columnHeads[${c}]`,
      a.head,
      { left: a.left, top: h, width: s, height: 90 },
      {
        font: t.display,
        size: 34,
        minSize: 24,
        lineHeight: 1.25,
        color: t.accent,
        weight: t.displayWeight,
        brandRole: "heading",
        role: "column heading"
      }
    );
    g && (o.push(g.widget), h = g.bottom + 24);
    const u = Gt(i, a.key, t, a.items, { left: a.left, top: h, width: s, height: j - 40 - h }, 28, e.continued);
    o.push(...u.widgets), l[a.key] = u.rest;
  }), { layers: [...o, ...O(i, t)], overflow: Rt(l.bullets, l.bulletsRight) };
}
function Kr(t, e, i) {
  const o = [], r = Math.round(k * 0.46), n = { left: x + r + 70, top: 110, width: k - r - 70, height: j - 150 };
  e.image?.url ? o.push(pr(n.left, n.top, n.width, n.height, e.image)) : o.push({ ...D(n.left, n.top, n.width, n.height, t.rule, 6), role: yr });
  const s = ft(i, t, e.kicker, 130, x, r);
  let d = s ? s.bottom + 16 : 130;
  s && o.push(s.widget);
  const l = C(
    i,
    "title",
    e.title,
    { left: x, top: d, width: r, height: 300 },
    {
      font: t.display,
      size: 62,
      minSize: 32,
      lineHeight: 1.14,
      color: t.ink,
      weight: t.displayWeight,
      brandRole: "heading",
      role: "heading"
    }
  );
  l && (o.push(l.widget), d = l.bottom + 26);
  const a = C(
    i,
    "sub",
    e.sub,
    { left: x, top: d, width: r, height: 200 },
    {
      font: t.body,
      size: 30,
      minSize: 22,
      lineHeight: 1.4,
      color: t.muted,
      brandRole: "body",
      role: "body"
    }
  );
  a && (d = a.bottom + 30), a && o.push(a.widget);
  const c = Gt(i, "bullets", t, e.bullets, { left: x, top: d, width: r, height: j - 40 - d }, 26, e.continued);
  return o.push(...c.widgets), { layers: [...o, ...O(i, t)], overflow: Rt(c.rest) };
}
const qr = {
  title: $r,
  statement: Xr,
  content: ti,
  "two-column": _r,
  media: Kr
};
function ei(t) {
  const e = { ...Et(t?.layout || "content"), ...t };
  return {
    ...e,
    columnHeads: Array.isArray(e.columnHeads) ? e.columnHeads : [],
    bullets: he(e.bullets),
    bulletsRight: he(e.bulletsRight),
    continued: !1
  };
}
function t0(t, e) {
  const i = t.title?.replace(/\s*\(continued\)$/i, "").trim();
  return {
    ...t,
    layout: t.layout === "media" ? "content" : t.layout,
    title: i ? `${i} (continued)` : "Continued",
    sub: null,
    callout: null,
    notes: null,
    image: null,
    bullets: e.bullets,
    bulletsRight: e.bulletsRight,
    continued: !0
  };
}
function e0(t, e, i) {
  const o = qr[t.layout] || ti, { layers: r, overflow: n } = o(e, t, i), s = t.title?.trim() || t.kicker?.trim() || "Slide";
  return { layout: { global: Te(s.slice(0, 60), Xe, _e, e.paper, t.notes), layers: r }, overflow: n };
}
function ii(t, e, i, o) {
  e.continued || (t.note("kicker", e.kicker ?? "", i, o), t.note("title", e.title ?? "", i, o), t.note("sub", e.sub ?? "", i, o), t.note("callout", e.callout ?? "", i, o), t.note("notes", e.notes ?? "", i, o), e.columnHeads.forEach((r, n) => t.note(`columnHeads[${n}]`, r, i, o))), ge(t, "bullets", e.bullets, i, o), ge(t, "bulletsRight", e.bulletsRight, i, o);
}
function ge(t, e, i, o, r) {
  for (const n of i)
    n.repeat || t.note(`${e}[${n.at}]`, n.text, o, r), n.sub.forEach((s, d) => t.note(`${e}[${n.at}].sub[${n.subAt + d}]`, s, o, r));
}
function Pt(t, e, i, o, r, n) {
  const s = { fill: i, rec: o }, d = [];
  let l = ei(t);
  for (; ; ) {
    o.page = r + d.length;
    const { layout: a, overflow: c } = e0(l, e, s);
    if (d.push(a), !c)
      break;
    const h = t0(l, c);
    if (d.length >= n) {
      ii(o, h, "page-limit", r + d.length);
      break;
    }
    o.report.continuedPages++, l = h;
  }
  return d;
}
function In(t, e, i = (o) => o) {
  return Pt(t, e, i, Ve(), 0, 1)[0];
}
function i0(t, e = {}) {
  const i = st(Me(e.theme), e.brand), o = lt(e.brand), r = $e(e.maxPages, P), n = ut(), s = Array.isArray(t?.slides) ? t.slides : [], d = s.length ? s : [Et("title")], l = [];
  d.forEach((c, h) => {
    if (n.source = h, n.page = l.length, l.length >= r) {
      ii(n, ei(c), "page-limit", l.length);
      return;
    }
    const g = Math.max(0, d.length - h - 1), u = Math.max(1, r - l.length - g);
    l.push(...Pt(c, i, o, n, l.length, u));
  });
  const a = { format: "design-studio/v1", title: String(t?.title || "Untitled deck"), layouts: l };
  return { document: e.brand ? gt(a, e.brand) : a, report: n.report };
}
function xn(t, e = {}) {
  return i0(t, e).document;
}
const oi = [
  {
    id: 19,
    title: "apple",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYXBwbGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTIgNi41MjhWM2ExIDEgMCAwIDEgMS0xaDAiIC8+IDxwYXRoIGQ9Ik0xOC4yMzcgMjFBMTUgMTUgMCAwIDAgMjIgMTFhNiA2IDAgMCAwLTEwLTQuNDcyQTYgNiAwIDAgMCAyIDExYTE1LjEgMTUuMSAwIDAgMCAzLjc2MyAxMCAzIDMgMCAwIDAgMy42NDguNjQ4IDUuNSA1LjUgMCAwIDEgNS4xNzggMEEzIDMgMCAwIDAgMTguMjM3IDIxIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-apple" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 6.528V3a1 1 0 0 1 1-1h0" /> <path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" /> </svg>',
    state: 1
  },
  {
    id: 20,
    title: "arrow right",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYXJyb3ctcmlnaHQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNNSAxMmgxNCIgLz4gPHBhdGggZD0ibTEyIDUgNyA3LTcgNyIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-arrow-right" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="m12 5 7 7-7 7" /> </svg>',
    state: 1
  },
  {
    id: 21,
    title: "award",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYXdhcmQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJtMTUuNDc3IDEyLjg5IDEuNTE1IDguNTI2YS41LjUgMCAwIDEtLjgxLjQ3bC0zLjU4LTIuNjg3YTEgMSAwIDAgMC0xLjE5NyAwbC0zLjU4NiAyLjY4NmEuNS41IDAgMCAxLS44MS0uNDY5bDEuNTE0LTguNTI2IiAvPiA8Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjYiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-award" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /> <circle cx="12" cy="8" r="6" /> </svg>',
    state: 1
  },
  {
    id: 22,
    title: "backpack",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYmFja3BhY2siIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNNCAxMGE0IDQgMCAwIDEgNC00aDhhNCA0IDAgMCAxIDQgNHYxMGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMnoiIC8+IDxwYXRoIGQ9Ik04IDEwaDgiIC8+IDxwYXRoIGQ9Ik04IDE4aDgiIC8+IDxwYXRoIGQ9Ik04IDIydi02YTIgMiAwIDAgMSAyLTJoNGEyIDIgMCAwIDEgMiAydjYiIC8+IDxwYXRoIGQ9Ik05IDZWNGEyIDIgMCAwIDEgMi0yaDJhMiAyIDAgMCAxIDIgMnYyIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-backpack" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /> <path d="M8 10h8" /> <path d="M8 18h8" /> <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" /> <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /> </svg>',
    state: 1
  },
  {
    id: 23,
    title: "bell",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYmVsbCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xMC4yNjggMjFhMiAyIDAgMCAwIDMuNDY0IDAiIC8+IDxwYXRoIGQ9Ik0zLjI2MiAxNS4zMjZBMSAxIDAgMCAwIDQgMTdoMTZhMSAxIDAgMCAwIC43NC0xLjY3M0MxOS40MSAxMy45NTYgMTggMTIuNDk5IDE4IDhBNiA2IDAgMCAwIDYgOGMwIDQuNDk5LTEuNDExIDUuOTU2LTIuNzM4IDcuMzI2IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-bell" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /> </svg>',
    state: 1
  },
  {
    id: 24,
    title: "book open",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYm9vay1vcGVuIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEyIDV2MTYiIC8+IDxwYXRoIGQ9Ik0yMC4wMDEgMTlBMiAyIDAgMDAyMiAxN1Y1YTIgMiAwIDAwLTEuOTk5LTJMMTYgMy4wMDJBNSA1IDAgMDAxMiA1YTUgNSAwIDAwLTQtMkg0YTIgMiAwIDAwLTIgMnYxMmEyIDIgMCAwMDEuOTk5IDJIOGE1IDUgMCAwMTQgMiA1IDUgMCAwMTQtMnoiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-book-open" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 5v16" /> <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" /> </svg>',
    state: 1
  },
  {
    id: 25,
    title: "book",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYm9vayIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik00IDE5LjV2LTE1QTIuNSAyLjUgMCAwIDEgNi41IDJIMTlhMSAxIDAgMCAxIDEgMXYxOGExIDEgMCAwIDEtMSAxSDYuNWExIDEgMCAwIDEgMC01SDIwIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-book" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /> </svg>',
    state: 1
  },
  {
    id: 26,
    title: "bus",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtYnVzIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTggNnY2IiAvPiA8cGF0aCBkPSJNMTUgNnY2IiAvPiA8cGF0aCBkPSJNMiAxMmgxOS42IiAvPiA8cGF0aCBkPSJNMTggMThoM3MuNS0xLjcuOC0yLjhjLjEtLjQuMi0uOC4yLTEuMiAwLS40LS4xLS44LS4yLTEuMmwtMS40LTVDMjAuMSA2LjggMTkuMSA2IDE4IDZINGEyIDIgMCAwIDAtMiAydjEwaDMiIC8+IDxjaXJjbGUgY3g9IjciIGN5PSIxOCIgcj0iMiIgLz4gPHBhdGggZD0iTTkgMThoNSIgLz4gPGNpcmNsZSBjeD0iMTYiIGN5PSIxOCIgcj0iMiIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-bus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M8 6v6" /> <path d="M15 6v6" /> <path d="M2 12h19.6" /> <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /> <circle cx="7" cy="18" r="2" /> <path d="M9 18h5" /> <circle cx="16" cy="18" r="2" /> </svg>',
    state: 1
  },
  {
    id: 27,
    title: "calculator",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2FsY3VsYXRvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIyMCIgeD0iNCIgeT0iMiIgcng9IjIiIC8+IDxsaW5lIHgxPSI4IiB4Mj0iMTYiIHkxPSI2IiB5Mj0iNiIgLz4gPGxpbmUgeDE9IjE2IiB4Mj0iMTYiIHkxPSIxNCIgeTI9IjE4IiAvPiA8cGF0aCBkPSJNMTYgMTBoLjAxIiAvPiA8cGF0aCBkPSJNMTIgMTBoLjAxIiAvPiA8cGF0aCBkPSJNOCAxMGguMDEiIC8+IDxwYXRoIGQ9Ik0xMiAxNGguMDEiIC8+IDxwYXRoIGQ9Ik04IDE0aC4wMSIgLz4gPHBhdGggZD0iTTEyIDE4aC4wMSIgLz4gPHBhdGggZD0iTTggMThoLjAxIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-calculator" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="16" height="20" x="4" y="2" rx="2" /> <line x1="8" x2="16" y1="6" y2="6" /> <line x1="16" x2="16" y1="14" y2="18" /> <path d="M16 10h.01" /> <path d="M12 10h.01" /> <path d="M8 10h.01" /> <path d="M12 14h.01" /> <path d="M8 14h.01" /> <path d="M12 18h.01" /> <path d="M8 18h.01" /> </svg>',
    state: 1
  },
  {
    id: 28,
    title: "calendar days",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2FsZW5kYXItZGF5cyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik04IDJ2MyIgLz4gPHBhdGggZD0iTTE2IDJ2MyIgLz4gPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgLz4gPHBhdGggZD0iTTMgOWgxOCIgLz4gPHBhdGggZD0iTTggMTNoLjAxIiAvPiA8cGF0aCBkPSJNMTIgMTNoLjAxIiAvPiA8cGF0aCBkPSJNMTYgMTNoLjAxIiAvPiA8cGF0aCBkPSJNOCAxN2guMDEiIC8+IDxwYXRoIGQ9Ik0xMiAxN2guMDEiIC8+IDxwYXRoIGQ9Ik0xNiAxN2guMDEiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-calendar-days" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" /> <path d="M8 13h.01" /> <path d="M12 13h.01" /> <path d="M16 13h.01" /> <path d="M8 17h.01" /> <path d="M12 17h.01" /> <path d="M16 17h.01" /> </svg>',
    state: 1
  },
  {
    id: 29,
    title: "calendar",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2FsZW5kYXIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNOCAydjMiIC8+IDxwYXRoIGQ9Ik0xNiAydjMiIC8+IDxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIC8+IDxwYXRoIGQ9Ik0zIDloMTgiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-calendar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" /> </svg>',
    state: 1
  },
  {
    id: 30,
    title: "camera",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2FtZXJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEzLjk5NyA0YTIgMiAwIDAgMSAxLjc2IDEuMDVsLjQ4Ni45QTIgMiAwIDAgMCAxOC4wMDMgN0gyMGEyIDIgMCAwIDEgMiAydjlhMiAyIDAgMCAxLTIgMkg0YTIgMiAwIDAgMS0yLTJWOWEyIDIgMCAwIDEgMi0yaDEuOTk3YTIgMiAwIDAgMCAxLjc1OS0xLjA0OGwuNDg5LS45MDRBMiAyIDAgMCAxIDEwLjAwNCA0eiIgLz4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-camera" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /> <circle cx="12" cy="13" r="3" /> </svg>',
    state: 1
  },
  {
    id: 31,
    title: "check circle",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2hlY2stY2lyY2xlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIxLjgwMSAxMEExMCAxMCAwIDEgMSAxNyAzLjMzNSIgLz4gPHBhdGggZD0ibTkgMTEgMyAzTDIyIDQiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-check-circle" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M21.801 10A10 10 0 1 1 17 3.335" /> <path d="m9 11 3 3L22 4" /> </svg>',
    state: 1
  },
  {
    id: 32,
    title: "clipboard list",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2xpcGJvYXJkLWxpc3QiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI0IiB4PSI4IiB5PSIyIiByeD0iMSIgcnk9IjEiIC8+IDxwYXRoIGQ9Ik0xNiA0aDJhMiAyIDAgMCAxIDIgMnYxNGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMlY2YTIgMiAwIDAgMSAyLTJoMiIgLz4gPHBhdGggZD0iTTEyIDExaDQiIC8+IDxwYXRoIGQ9Ik0xMiAxNmg0IiAvPiA8cGF0aCBkPSJNOCAxMWguMDEiIC8+IDxwYXRoIGQ9Ik04IDE2aC4wMSIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-clipboard-list" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="M12 11h4" /> <path d="M12 16h4" /> <path d="M8 11h.01" /> <path d="M8 16h.01" /> </svg>',
    state: 1
  },
  {
    id: 33,
    title: "clock",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2xvY2siIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4gPHBhdGggZD0iTTEyIDZ2Nmw0IDIiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-clock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" /> </svg>',
    state: 1
  },
  {
    id: 34,
    title: "cloud",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2xvdWQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTcuNSAxOUg5YTcgNyAwIDEgMSA2LjcxLTloMS43OWE0LjUgNC41IDAgMSAxIDAgOVoiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-cloud" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /> </svg>',
    state: 1
  },
  {
    id: 35,
    title: "drama",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZHJhbWEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTAgMTFoLjAxIiAvPiA8cGF0aCBkPSJNMTQgNmguMDEiIC8+IDxwYXRoIGQ9Ik0xOCA2aC4wMSIgLz4gPHBhdGggZD0iTTYuNSAxMy4xaC4wMSIgLz4gPHBhdGggZD0iTTIyIDVjMCA5LTQgMTItNiAxMnMtNi0zLTYtMTJjMC0yIDItMyA2LTNzNiAxIDYgMyIgLz4gPHBhdGggZD0iTTE3LjQgOS45Yy0uOC44LTIgLjgtMi44IDAiIC8+IDxwYXRoIGQ9Ik0xMC4xIDcuMUM5IDcuMiA3LjcgNy43IDYgOC42Yy0zLjUgMi00LjcgMy45LTMuNyA1LjYgNC41IDcuOCA5LjUgOC40IDExLjIgNy40LjktLjUgMS45LTIuMSAxLjktNC43IiAvPiA8cGF0aCBkPSJNOS4xIDE2LjVjLjMtMS4xIDEuNC0xLjcgMi40LTEuNCIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-drama" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 11h.01" /> <path d="M14 6h.01" /> <path d="M18 6h.01" /> <path d="M6.5 13.1h.01" /> <path d="M22 5c0 9-4 12-6 12s-6-3-6-12c0-2 2-3 6-3s6 1 6 3" /> <path d="M17.4 9.9c-.8.8-2 .8-2.8 0" /> <path d="M10.1 7.1C9 7.2 7.7 7.7 6 8.6c-3.5 2-4.7 3.9-3.7 5.6 4.5 7.8 9.5 8.4 11.2 7.4.9-.5 1.9-2.1 1.9-4.7" /> <path d="M9.1 16.5c.3-1.1 1.4-1.7 2.4-1.4" /> </svg>',
    state: 1
  },
  {
    id: 36,
    title: "dumbbell",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZHVtYmJlbGwiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTcuNTk2IDEyLjc2OGEyIDIgMCAxIDAgMi44MjktMi44MjlsLTEuNzY4LTEuNzY3YTIgMiAwIDAgMCAyLjgyOC0yLjgyOWwtMi44MjgtMi44MjhhMiAyIDAgMCAwLTIuODI5IDIuODI4bC0xLjc2Ny0xLjc2OGEyIDIgMCAxIDAtMi44MjkgMi44Mjl6IiAvPiA8cGF0aCBkPSJtMi41IDIxLjUgMS40LTEuNCIgLz4gPHBhdGggZD0ibTIwLjEgMy45IDEuNC0xLjQiIC8+IDxwYXRoIGQ9Ik01LjM0MyAyMS40ODVhMiAyIDAgMSAwIDIuODI5LTIuODI4bDEuNzY3IDEuNzY4YTIgMiAwIDEgMCAyLjgyOS0yLjgyOWwtNi4zNjQtNi4zNjRhMiAyIDAgMSAwLTIuODI5IDIuODI5bDEuNzY4IDEuNzY3YTIgMiAwIDAgMC0yLjgyOCAyLjgyOXoiIC8+IDxwYXRoIGQ9Im05LjYgMTQuNCA0LjgtNC44IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-dumbbell" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" /> <path d="m2.5 21.5 1.4-1.4" /> <path d="m20.1 3.9 1.4-1.4" /> <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" /> <path d="m9.6 14.4 4.8-4.8" /> </svg>',
    state: 1
  },
  {
    id: 37,
    title: "flask conical",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZmxhc2stY29uaWNhbCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xNCAydjZhMiAyIDAgMCAwIC4yNDUuOTZsNS41MSAxMC4wOEEyIDIgMCAwIDEgMTggMjJINmEyIDIgMCAwIDEtMS43NTUtMi45Nmw1LjUxLTEwLjA4QTIgMiAwIDAgMCAxMCA4VjIiIC8+IDxwYXRoIGQ9Ik02LjQ1MyAxNWgxMS4wOTQiIC8+IDxwYXRoIGQ9Ik04LjUgMmg3IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-flask-conical" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" /> <path d="M6.453 15h11.094" /> <path d="M8.5 2h7" /> </svg>',
    state: 1
  },
  {
    id: 38,
    title: "flower",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZmxvd2VyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIgLz4gPHBhdGggZD0iTTEyIDE2LjVBNC41IDQuNSAwIDEgMSA3LjUgMTIgNC41IDQuNSAwIDEgMSAxMiA3LjVhNC41IDQuNSAwIDEgMSA0LjUgNC41IDQuNSA0LjUgMCAxIDEtNC41IDQuNSIgLz4gPHBhdGggZD0iTTEyIDcuNVY5IiAvPiA8cGF0aCBkPSJNNy41IDEySDkiIC8+IDxwYXRoIGQ9Ik0xNi41IDEySDE1IiAvPiA8cGF0aCBkPSJNMTIgMTYuNVYxNSIgLz4gPHBhdGggZD0ibTggOCAxLjg4IDEuODgiIC8+IDxwYXRoIGQ9Ik0xNC4xMiA5Ljg4IDE2IDgiIC8+IDxwYXRoIGQ9Im04IDE2IDEuODgtMS44OCIgLz4gPHBhdGggZD0iTTE0LjEyIDE0LjEyIDE2IDE2IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-flower" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="3" /> <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" /> <path d="M12 7.5V9" /> <path d="M7.5 12H9" /> <path d="M16.5 12H15" /> <path d="M12 16.5V15" /> <path d="m8 8 1.88 1.88" /> <path d="M14.12 9.88 16 8" /> <path d="m8 16 1.88-1.88" /> <path d="M14.12 14.12 16 16" /> </svg>',
    state: 1
  },
  {
    id: 39,
    title: "gift",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZ2lmdCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xMiA3djE0IiAvPiA8cGF0aCBkPSJNMjAgMTF2OGEyIDIgMCAwIDEtMiAySDZhMiAyIDAgMCAxLTItMnYtOCIgLz4gPHBhdGggZD0iTTcuNSA3YTEgMSAwIDAgMSAwLTVBNC44IDggMCAwIDEgMTIgN2E0LjggOCAwIDAgMSA0LjUtNSAxIDEgMCAwIDEgMCA1IiAvPiA8cmVjdCB4PSIzIiB5PSI3IiB3aWR0aD0iMTgiIGhlaWdodD0iNCIgcng9IjEiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-gift" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 7v14" /> <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /> <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" /> <rect x="3" y="7" width="18" height="4" rx="1" /> </svg>',
    state: 1
  },
  {
    id: 40,
    title: "globe",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZ2xvYmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgLz4gPHBhdGggZD0iTTEyIDJhMTQuNSAxNC41IDAgMCAwIDAgMjAgMTQuNSAxNC41IDAgMCAwIDAtMjAiIC8+IDxwYXRoIGQ9Ik0yIDEyaDIwIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-globe" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" /> </svg>',
    state: 1
  },
  {
    id: 41,
    title: "graduation cap",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZ3JhZHVhdGlvbi1jYXAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMjEuNDIgMTAuOTIyYTEgMSAwIDAgMC0uMDE5LTEuODM4TDEyLjgzIDUuMThhMiAyIDAgMCAwLTEuNjYgMEwyLjYgOS4wOGExIDEgMCAwIDAgMCAxLjgzMmw4LjU3IDMuOTA4YTIgMiAwIDAgMCAxLjY2IDB6IiAvPiA8cGF0aCBkPSJNMjIgMTB2NiIgLz4gPHBhdGggZD0iTTYgMTIuNVYxNmE2IDMgMCAwIDAgMTIgMHYtMy41IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-graduation-cap" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /> </svg>',
    state: 1
  },
  {
    id: 42,
    title: "heart",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtaGVhcnQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMiA5LjVhNS41IDUuNSAwIDAgMSA5LjU5MS0zLjY3Ni41Ni41NiAwIDAgMCAuODE4IDBBNS40OSA1LjQ5IDAgMCAxIDIyIDkuNWMwIDIuMjktMS41IDQtMyA1LjVsLTUuNDkyIDUuMzEzYTIgMiAwIDAgMS0zIC4wMTlMNSAxNWMtMS41LTEuNS0zLTMuMi0zLTUuNSIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-heart" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /> </svg>',
    state: 1
  },
  {
    id: 43,
    title: "info",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtaW5mbyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIiAvPiA8cGF0aCBkPSJNMTIgMTZ2LTQiIC8+IDxwYXRoIGQ9Ik0xMiA4aC4wMSIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-info" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" /> </svg>',
    state: 1
  },
  {
    id: 44,
    title: "leaf",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbGVhZiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xMSAyMEE3IDcgMCAwIDEgOS44IDYuMUMxNS41IDUgMTcgNC40OCAxOSAyYzEgMiAyIDQuMTggMiA4IDAgNS41LTQuNzggMTAtMTAgMTBaIiAvPiA8cGF0aCBkPSJNMiAyMWMwLTMgMS44NS01LjM2IDUuMDgtNkM5LjUgMTQuNTIgMTIgMTMgMTMgMTIiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-leaf" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /> <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /> </svg>',
    state: 1
  },
  {
    id: 45,
    title: "library",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbGlicmFyeSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Im0xNiA2IDQgMTQiIC8+IDxwYXRoIGQ9Ik0xMiA2djE0IiAvPiA8cGF0aCBkPSJNOCA4djEyIiAvPiA8cGF0aCBkPSJNNCA0djE2IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-library" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m16 6 4 14" /> <path d="M12 6v14" /> <path d="M8 8v12" /> <path d="M4 4v16" /> </svg>',
    state: 1
  },
  {
    id: 46,
    title: "mail",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbWFpbCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Im0yMiA3LTguOTkxIDUuNzI3YTIgMiAwIDAgMS0yLjAwOSAwTDIgNyIgLz4gPHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE2IiByeD0iMiIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-mail" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" /> </svg>',
    state: 1
  },
  {
    id: 47,
    title: "map pin",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbWFwLXBpbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0yMCAxMGMwIDQuOTkzLTUuNTM5IDEwLjE5My03LjM5OSAxMS43OTlhMSAxIDAgMCAxLTEuMjAyIDBDOS41MzkgMjAuMTkzIDQgMTQuOTkzIDQgMTBhOCA4IDAgMCAxIDE2IDAiIC8+IDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-map-pin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /> <circle cx="12" cy="10" r="3" /> </svg>',
    state: 1
  },
  {
    id: 48,
    title: "medal",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbWVkYWwiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNNy4yMSAxNSAyLjY2IDcuMTRhMiAyIDAgMCAxIC4xMy0yLjJMNC40IDIuOEEyIDIgMCAwIDEgNiAyaDEyYTIgMiAwIDAgMSAxLjYuOGwxLjYgMi4xNGEyIDIgMCAwIDEgLjE0IDIuMkwxNi43OSAxNSIgLz4gPHBhdGggZD0iTTExIDEyIDUuMTIgMi4yIiAvPiA8cGF0aCBkPSJtMTMgMTIgNS44OC05LjgiIC8+IDxwYXRoIGQ9Ik04IDdoOCIgLz4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxNyIgcj0iNSIgLz4gPHBhdGggZD0iTTEyIDE4di0yaC0uNSIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-medal" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" /> <path d="M11 12 5.12 2.2" /> <path d="m13 12 5.88-9.8" /> <path d="M8 7h8" /> <circle cx="12" cy="17" r="5" /> <path d="M12 18v-2h-.5" /> </svg>',
    state: 1
  },
  {
    id: 49,
    title: "megaphone",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbWVnYXBob25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTExIDZhMTMgMTMgMCAwIDAgOC40LTIuOEExIDEgMCAwIDEgMjEgNHYxMmExIDEgMCAwIDEtMS42LjhBMTMgMTMgMCAwIDAgMTEgMTRINWEyIDIgMCAwIDEtMi0yVjhhMiAyIDAgMCAxIDItMnoiIC8+IDxwYXRoIGQ9Ik02IDE0YTEyIDEyIDAgMCAwIDIuNCA3LjIgMiAyIDAgMCAwIDMuMi0yLjRBOCA4IDAgMCAxIDEwIDE0IiAvPiA8cGF0aCBkPSJNOCA2djgiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-megaphone" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /> <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" /> <path d="M8 6v8" /> </svg>',
    state: 1
  },
  {
    id: 50,
    title: "microscope",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbWljcm9zY29wZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik02IDE4aDgiIC8+IDxwYXRoIGQ9Ik0zIDIyaDE4IiAvPiA8cGF0aCBkPSJNMTQgMjJhNyA3IDAgMSAwIDAtMTRoLTEiIC8+IDxwYXRoIGQ9Ik05IDE0aDIiIC8+IDxwYXRoIGQ9Ik05IDEyYTIgMiAwIDAgMS0yLTJWNmg2djRhMiAyIDAgMCAxLTIgMloiIC8+IDxwYXRoIGQ9Ik0xMiA2VjNhMSAxIDAgMCAwLTEtMUg5YTEgMSAwIDAgMC0xIDF2MyIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-microscope" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M6 18h8" /> <path d="M3 22h18" /> <path d="M14 22a7 7 0 1 0 0-14h-1" /> <path d="M9 14h2" /> <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /> <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /> </svg>',
    state: 1
  },
  {
    id: 51,
    title: "music",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtbXVzaWMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNOSAxOFY1bDEyLTJ2MTMiIC8+IDxjaXJjbGUgY3g9IjYiIGN5PSIxOCIgcj0iMyIgLz4gPGNpcmNsZSBjeD0iMTgiIGN5PSIxNiIgcj0iMyIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-music" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M9 18V5l12-2v13" /> <circle cx="6" cy="18" r="3" /> <circle cx="18" cy="16" r="3" /> </svg>',
    state: 1
  },
  {
    id: 52,
    title: "paintbrush",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGFpbnRicnVzaCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Im0xNC42MjIgMTcuODk3LTEwLjY4LTIuOTEzIiAvPiA8cGF0aCBkPSJNMTguMzc2IDIuNjIyYTEgMSAwIDEgMSAzLjAwMiAzLjAwMkwxNy4zNiA5LjY0M2EuNS41IDAgMCAwIDAgLjcwN2wuOTQ0Ljk0NGEyLjQxIDIuNDEgMCAwIDEgMCAzLjQwOGwtLjk0NC45NDRhLjUuNSAwIDAgMS0uNzA3IDBMOC4zNTQgNy4zNDhhLjUuNSAwIDAgMSAwLS43MDdsLjk0NC0uOTQ0YTIuNDEgMi40MSAwIDAgMSAzLjQwOCAwbC45NDQuOTQ0YS41LjUgMCAwIDAgLjcwNyAweiIgLz4gPHBhdGggZD0iTTkgOGMtMS44MDQgMi43MS0zLjk3IDMuNDYtNi41ODMgMy45NDhhLjUwNy41MDcgMCAwIDAtLjMwMi44MTlsNy4zMiA4Ljg4M2ExIDEgMCAwIDAgMS4xODUuMjA0QzEyLjczNSAyMC40MDUgMTYgMTYuNzkyIDE2IDE1IiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-paintbrush" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m14.622 17.897-10.68-2.913" /> <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" /> <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" /> </svg>',
    state: 1
  },
  {
    id: 53,
    title: "palette",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGFsZXR0ZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xMiAyMmExIDEgMCAwIDEgMC0yMCAxMCA5IDAgMCAxIDEwIDkgNSA1IDAgMCAxLTUgNWgtMi4yNWExLjc1IDEuNzUgMCAwIDAtMS40IDIuOGwuMy40YTEuNzUgMS43NSAwIDAgMS0xLjQgMi44eiIgLz4gPGNpcmNsZSBjeD0iMTMuNSIgY3k9IjYuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4gPGNpcmNsZSBjeD0iMTcuNSIgY3k9IjEwLjUiIHI9Ii41IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+IDxjaXJjbGUgY3g9IjYuNSIgY3k9IjEyLjUiIHI9Ii41IiBmaWxsPSJjdXJyZW50Q29sb3IiIC8+IDxjaXJjbGUgY3g9IjguNSIgY3k9IjcuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-palette" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /> <circle cx="13.5" cy="6.5" r=".5" fill="{{colors[0]}}" /> <circle cx="17.5" cy="10.5" r=".5" fill="{{colors[0]}}" /> <circle cx="6.5" cy="12.5" r=".5" fill="{{colors[0]}}" /> <circle cx="8.5" cy="7.5" r=".5" fill="{{colors[0]}}" /> </svg>',
    state: 1
  },
  {
    id: 54,
    title: "party popper",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGFydHktcG9wcGVyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTUuOCAxMS4zIDIgMjJsMTAuNy0zLjc5IiAvPiA8cGF0aCBkPSJNNCAzaC4wMSIgLz4gPHBhdGggZD0iTTIyIDhoLjAxIiAvPiA8cGF0aCBkPSJNMTUgMmguMDEiIC8+IDxwYXRoIGQ9Ik0yMiAyMGguMDEiIC8+IDxwYXRoIGQ9Im0yMiAyLTIuMjQuNzVhMi45IDIuOSAwIDAgMC0xLjk2IDMuMTJjLjEuODYtLjU3IDEuNjMtMS40NSAxLjYzaC0uMzhjLS44NiAwLTEuNi42LTEuNzYgMS40NEwxNCAxMCIgLz4gPHBhdGggZD0ibTIyIDEzLS44Mi0uMzNjLS44Ni0uMzQtMS44Mi4yLTEuOTggMS4xMWMtLjExLjctLjcyIDEuMjItMS40MyAxLjIySDE3IiAvPiA8cGF0aCBkPSJtMTEgMiAuMzMuODJjLjM0Ljg2LS4yIDEuODItMS4xMSAxLjk4QzkuNTIgNC45IDkgNS41MiA5IDYuMjNWNyIgLz4gPHBhdGggZD0iTTExIDEzYzEuOTMgMS45MyAyLjgzIDQuMTcgMiA1LS44My44My0zLjA3LS4wNy01LTItMS45My0xLjkzLTIuODMtNC4xNy0yLTUgLjgzLS44MyAzLjA3LjA3IDUgMloiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-party-popper" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" /> </svg>',
    state: 1
  },
  {
    id: 55,
    title: "pencil",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGVuY2lsIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIxLjE3NCA2LjgxMmExIDEgMCAwIDAtMy45ODYtMy45ODdMMy44NDIgMTYuMTc0YTIgMiAwIDAgMC0uNS44M2wtMS4zMjEgNC4zNTJhLjUuNSAwIDAgMCAuNjIzLjYyMmw0LjM1My0xLjMyYTIgMiAwIDAgMCAuODMtLjQ5N3oiIC8+IDxwYXRoIGQ9Im0xNSA1IDQgNCIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-pencil" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" /> </svg>',
    state: 1
  },
  {
    id: 56,
    title: "phone",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGhvbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTMuODMyIDE2LjU2OGExIDEgMCAwIDAgMS4yMTMtLjMwM2wuMzU1LS40NjVBMiAyIDAgMCAxIDE3IDE1aDNhMiAyIDAgMCAxIDIgMnYzYTIgMiAwIDAgMS0yIDJBMTggMTggMCAwIDEgMiA0YTIgMiAwIDAgMSAyLTJoM2EyIDIgMCAwIDEgMiAydjNhMiAyIDAgMCAxLS44IDEuNmwtLjQ2OC4zNTFhMSAxIDAgMCAwLS4yOTIgMS4yMzMgMTQgMTQgMCAwIDAgNi4zOTIgNi4zODQiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-phone" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /> </svg>',
    state: 1
  },
  {
    id: 57,
    title: "plus",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGx1cyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik01IDEyaDE0IiAvPiA8cGF0aCBkPSJNMTIgNXYxNCIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M5 12h14" /> <path d="M12 5v14" /> </svg>',
    state: 1
  },
  {
    id: 58,
    title: "school",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc2Nob29sIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTE0IDIxdi0zYTIgMiAwIDAgMC00IDB2MyIgLz4gPHBhdGggZD0iTTE4IDQuOTMzVjIxIiAvPiA8cGF0aCBkPSJtNCA2IDcuMTA2LTMuNzlhMiAyIDAgMCAxIDEuNzg4IDBMMjAgNiIgLz4gPHBhdGggZD0ibTYgMTEtMy41MiAyLjE0N2ExIDEgMCAwIDAtLjQ4Ljg1NFYxOWEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJ2LTVhMSAxIDAgMCAwLS40OC0uODUzTDE4IDExIiAvPiA8cGF0aCBkPSJNNiA0LjkzM1YyMSIgLz4gPGNpcmNsZSBjeD0iMTIiIGN5PSI5IiByPSIyIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-school" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M14 21v-3a2 2 0 0 0-4 0v3" /> <path d="M18 4.933V21" /> <path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" /> <path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" /> <path d="M6 4.933V21" /> <circle cx="12" cy="9" r="2" /> </svg>',
    state: 1
  },
  {
    id: 59,
    title: "snowflake",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc25vd2ZsYWtlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTEwIDIwLTEuMjUtMi41TDYgMTgiIC8+IDxwYXRoIGQ9Ik0xMCA0IDguNzUgNi41IDYgNiIgLz4gPHBhdGggZD0ibTE0IDIwIDEuMjUtMi41TDE4IDE4IiAvPiA8cGF0aCBkPSJtMTQgNCAxLjI1IDIuNUwxOCA2IiAvPiA8cGF0aCBkPSJtMTcgMjEtMy02aC00IiAvPiA8cGF0aCBkPSJtMTcgMy0zIDYgMS41IDMiIC8+IDxwYXRoIGQ9Ik0yIDEyaDYuNUwxMCA5IiAvPiA8cGF0aCBkPSJtMjAgMTAtMS41IDIgMS41IDIiIC8+IDxwYXRoIGQ9Ik0yMiAxMmgtNi41TDE0IDE1IiAvPiA8cGF0aCBkPSJtNCAxMCAxLjUgMkw0IDE0IiAvPiA8cGF0aCBkPSJtNyAyMSAzLTYtMS41LTMiIC8+IDxwYXRoIGQ9Im03IDMgMyA2aDQiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-snowflake" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m10 20-1.25-2.5L6 18" /> <path d="M10 4 8.75 6.5 6 6" /> <path d="m14 20 1.25-2.5L18 18" /> <path d="m14 4 1.25 2.5L18 6" /> <path d="m17 21-3-6h-4" /> <path d="m17 3-3 6 1.5 3" /> <path d="M2 12h6.5L10 9" /> <path d="m20 10-1.5 2 1.5 2" /> <path d="M22 12h-6.5L14 15" /> <path d="m4 10 1.5 2L4 14" /> <path d="m7 21 3-6-1.5-3" /> <path d="m7 3 3 6h4" /> </svg>',
    state: 1
  },
  {
    id: 60,
    title: "sparkles",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3BhcmtsZXMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTEuMDE3IDIuODE0YTEgMSAwIDAgMSAxLjk2NiAwbDEuMDUxIDUuNTU4YTIgMiAwIDAgMCAxLjU5NCAxLjU5NGw1LjU1OCAxLjA1MWExIDEgMCAwIDEgMCAxLjk2NmwtNS41NTggMS4wNTFhMiAyIDAgMCAwLTEuNTk0IDEuNTk0bC0xLjA1MSA1LjU1OGExIDEgMCAwIDEtMS45NjYgMGwtMS4wNTEtNS41NThhMiAyIDAgMCAwLTEuNTk0LTEuNTk0bC01LjU1OC0xLjA1MWExIDEgMCAwIDEgMC0xLjk2Nmw1LjU1OC0xLjA1MWEyIDIgMCAwIDAgMS41OTQtMS41OTR6IiAvPiA8cGF0aCBkPSJNMjAgMnY0IiAvPiA8cGF0aCBkPSJNMjIgNGgtNCIgLz4gPGNpcmNsZSBjeD0iNCIgY3k9IjIwIiByPSIyIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-sparkles" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" /> </svg>',
    state: 1
  },
  {
    id: 61,
    title: "star",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3RhciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiA+IDxwYXRoIGQ9Ik0xMS41MjUgMi4yOTVhLjUzLjUzIDAgMCAxIC45NSAwbDIuMzEgNC42NzlhMi4xMjMgMi4xMjMgMCAwIDAgMS41OTUgMS4xNmw1LjE2Ni43NTZhLjUzLjUzIDAgMCAxIC4yOTQuOTA0bC0zLjczNiAzLjYzOGEyLjEyMyAyLjEyMyAwIDAgMC0uNjExIDEuODc4bC44ODIgNS4xNGEuNTMuNTMgMCAwIDEtLjc3MS41NmwtNC42MTgtMi40MjhhMi4xMjIgMi4xMjIgMCAwIDAtMS45NzMgMEw2LjM5NiAyMS4wMWEuNTMuNTMgMCAwIDEtLjc3LS41NmwuODgxLTUuMTM5YTIuMTIyIDIuMTIyIDAgMCAwLS42MTEtMS44NzlMMi4xNiA5Ljc5NWEuNTMuNTMgMCAwIDEgLjI5NC0uOTA2bDUuMTY1LS43NTVhMi4xMjIgMi4xMjIgMCAwIDAgMS41OTctMS4xNnoiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /> </svg>',
    state: 1
  },
  {
    id: 62,
    title: "sun",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3VuIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgLz4gPHBhdGggZD0iTTEyIDJ2MiIgLz4gPHBhdGggZD0iTTEyIDIwdjIiIC8+IDxwYXRoIGQ9Im00LjkzIDQuOTMgMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJtMTcuNjYgMTcuNjYgMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJNMiAxMmgyIiAvPiA8cGF0aCBkPSJNMjAgMTJoMiIgLz4gPHBhdGggZD0ibTYuMzQgMTcuNjYtMS40MSAxLjQxIiAvPiA8cGF0aCBkPSJtMTkuMDcgNC45My0xLjQxIDEuNDEiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" /> </svg>',
    state: 1
  },
  {
    id: 63,
    title: "thumbs up",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdGh1bWJzLXVwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTE1IDUuODggMTQgMTBoNS44M2EyIDIgMCAwIDEgMS45MiAyLjU2bC0yLjMzIDhBMiAyIDAgMCAxIDE3LjUgMjJINGEyIDIgMCAwIDEtMi0ydi04YTIgMiAwIDAgMSAyLTJoMi43NmEyIDIgMCAwIDAgMS43OS0xLjExTDEyIDJhMy4xMyAzLjEzIDAgMCAxIDMgMy44OFoiIC8+IDxwYXRoIGQ9Ik03IDEwdjEyIiAvPiA8L3N2Zz4=",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-thumbs-up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /> <path d="M7 10v12" /> </svg>',
    state: 1
  },
  {
    id: 64,
    title: "ticket",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdGlja2V0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTIgOWEzIDMgMCAwIDEgMCA2djJhMiAyIDAgMCAwIDIgMmgxNmEyIDIgMCAwIDAgMi0ydi0yYTMgMyAwIDAgMSAwLTZWN2EyIDIgMCAwIDAtMi0ySDRhMiAyIDAgMCAwLTIgMloiIC8+IDxwYXRoIGQ9Ik0xMyA1djIiIC8+IDxwYXRoIGQ9Ik0xMyAxN3YyIiAvPiA8cGF0aCBkPSJNMTMgMTF2MiIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-ticket" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /> <path d="M13 5v2" /> <path d="M13 17v2" /> <path d="M13 11v2" /> </svg>',
    state: 1
  },
  {
    id: 65,
    title: "tree pine",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdHJlZS1waW5lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0ibTE3IDE0IDMgMy4zYTEgMSAwIDAgMS0uNyAxLjdINC43YTEgMSAwIDAgMS0uNy0xLjdMNyAxNGgtLjNhMSAxIDAgMCAxLS43LTEuN0w5IDloLS4yQTEgMSAwIDAgMSA4IDcuM0wxMiAzbDQgNC4zYTEgMSAwIDAgMS0uOCAxLjdIMTVsMyAzLjNhMSAxIDAgMCAxLS43IDEuN0gxN1oiIC8+IDxwYXRoIGQ9Ik0xMiAyMnYtMyIgLz4gPC9zdmc+",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-tree-pine" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" /> <path d="M12 22v-3" /> </svg>',
    state: 1
  },
  {
    id: 66,
    title: "trophy",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdHJvcGh5IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiID4gPHBhdGggZD0iTTEwIDE0LjY2VjE3YTEgMSAwIDAgMS0xIDEgMiAyIDAgMCAwLTIgMnYyIiAvPiA8cGF0aCBkPSJNMTQgMTQuNjZWMTdhMSAxIDAgMCAwIDEgMSAyIDIgMCAwIDEgMiAydjIiIC8+IDxwYXRoIGQ9Ik0xNy45MTYgMTBIMTkuNUEyLjUgMi41IDAgMCAwIDIyIDcuNVY1YTEgMSAwIDAgMC0xLTFoLTMiIC8+IDxwYXRoIGQ9Ik00IDIyaDE2IiAvPiA8cGF0aCBkPSJNNiA5YTYgNiAwIDAgMCAxMiAwVjNhMSAxIDAgMCAwLTEtMUg3YTEgMSAwIDAgMC0xIDF6IiAvPiA8cGF0aCBkPSJNNi4wODQgMTBINC41QTIuNSAyLjUgMCAwIDEgMiA3LjVWNWExIDEgMCAwIDEgMS0xaDMiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-trophy" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" /> <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" /> <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" /> <path d="M4 22h16" /> <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /> <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" /> </svg>',
    state: 1
  },
  {
    id: 67,
    title: "umbrella",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdW1icmVsbGEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTIgMTN2N2EyIDIgMCAwIDAgNCAwIiAvPiA8cGF0aCBkPSJNMTIgMnYyIiAvPiA8cGF0aCBkPSJNMjAuOTkyIDEzYTEgMSAwIDAgMCAuOTctMS4yNzQgMTAuMjg0IDEwLjI4NCAwIDAgMC0xOS45MjMgMEExIDEgMCAwIDAgMyAxM3oiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-umbrella" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M12 13v7a2 2 0 0 0 4 0" /> <path d="M12 2v2" /> <path d="M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z" /> </svg>',
    state: 1
  },
  {
    id: 68,
    title: "users",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdXNlcnMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiIgLz4gPHBhdGggZD0iTTE2IDMuMTI4YTQgNCAwIDAgMSAwIDcuNzQ0IiAvPiA8cGF0aCBkPSJNMjIgMjF2LTJhNCA0IDAgMCAwLTMtMy44NyIgLz4gPGNpcmNsZSBjeD0iOSIgY3k9IjciIHI9IjQiIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-users" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" /> </svg>',
    state: 1
  },
  {
    id: 69,
    title: "utensils",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#333333"]}',
    thumb: "data:image/svg+xml;base64,PCEtLSBAbGljZW5zZSBsdWNpZGUtc3RhdGljIHYxLjM4LjAgLSBJU0MgLS0+IDxzdmcgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdXRlbnNpbHMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgPiA8cGF0aCBkPSJNMyAydjdjMCAxLjEuOSAyIDIgMmg0YTIgMiAwIDAgMCAyLTJWMiIgLz4gPHBhdGggZD0iTTcgMnYyMCIgLz4gPHBhdGggZD0iTTIxIDE1VjJhNSA1IDAgMCAwLTUgNXY2YzAgMS4xLjkgMiAyIDJoM1ptMCAwdjciIC8+IDwvc3ZnPg==",
    url: '<!-- @license lucide-static v1.38.0 - ISC --> <svg class="lucide lucide-utensils" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{{colors[0]}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" > <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /> <path d="M7 2v20" /> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /> </svg>',
    state: 1
  },
  {
    id: 1,
    title: "Arrow",
    width: 240,
    height: 120,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMTIwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjAsMzggMTUwLDM4IDE1MCwwIDI0MCw2MCAxNTAsMTIwIDE1MCw4MiAwLDgyIiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120" preserveAspectRatio="none"><polygon points="0,38 150,38 150,0 240,60 150,120 150,82 0,82" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 2,
    title: "Badge",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjEwMCwwIDEyNCwyMCAxNTUsMTQgMTY4LDQzIDE5OSw1MiAxOTQsODQgMjE4LDEwNSAxOTQsMTI2IDE5OSwxNTggMTY4LDE2NyAxNTUsMTk2IDEyNCwxOTAgMTAwLDIxMCA3NiwxOTAgNDUsMTk2IDMyLDE2NyAxLDE1OCA2LDEyNiAtMTgsMTA1IDYsODQgMSw1MiAzMiw0MyA0NSwxNCA3NiwyMCIgZmlsbD0iIzRGNDZFNSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOSwtNSkgc2NhbGUoMC45MikiLz48L3N2Zz4=",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="100,0 124,20 155,14 168,43 199,52 194,84 218,105 194,126 199,158 168,167 155,196 124,190 100,210 76,190 45,196 32,167 1,158 6,126 -18,105 6,84 1,52 32,43 45,14 76,20" fill="{{colors[0]}}" transform="translate(9,-5) scale(0.92)"/></svg>',
    state: 1
  },
  {
    id: 3,
    title: "Banner",
    width: 260,
    height: 100,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjAsMCAyNjAsMCAyNjAsMTAwIDAsMTAwIDI2LDUwIiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 100" preserveAspectRatio="none"><polygon points="0,0 260,0 260,100 0,100 26,50" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 4,
    title: "Check",
    width: 220,
    height: 180,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMjAgMTgwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMTggOTZsMjQtMjQgNTIgNTJMMTc4IDZsMjQgMjRMOTQgMTcyeiIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 180" preserveAspectRatio="none"><path d="M18 96l24-24 52 52L178 6l24 24L94 172z" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 5,
    title: "Chevron",
    width: 120,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjAsMCA0MCwwIDEyMCwxMDAgNDAsMjAwIDAsMjAwIDgwLDEwMCIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" preserveAspectRatio="none"><polygon points="0,0 40,0 120,100 40,200 0,200 80,100" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 6,
    title: "Circle",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><circle cx="100" cy="100" r="100" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 7,
    title: "Diamond",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjEwMCwwIDIwMCwxMDAgMTAwLDIwMCAwLDEwMCIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="100,0 200,100 100,200 0,100" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 8,
    title: "Frame",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCAwaDIwMHYyMDBIMHogTTIwIDIwdjE2MGgxNjBWMjB6IiBmaWxsPSIjNEY0NkU1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><path d="M0 0h200v200H0z M20 20v160h160V20z" fill="{{colors[0]}}" fill-rule="evenodd"/></svg>',
    state: 1
  },
  {
    id: 9,
    title: "Heart",
    width: 200,
    height: 184,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTg0IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMTAwIDE4NFMwIDExNiAwIDU2QzAgMjIgMjYgMCA1NCAwYzE5IDAgMzcgMTAgNDYgMjZDMTA5IDEwIDEyNyAwIDE0NiAwYzI4IDAgNTQgMjIgNTQgNTYgMCA2MC0xMDAgMTI4LTEwMCAxMjh6IiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 184" preserveAspectRatio="none"><path d="M100 184S0 116 0 56C0 22 26 0 54 0c19 0 37 10 46 26C109 10 127 0 146 0c28 0 54 22 54 56 0 60-100 128-100 128z" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 10,
    title: "Hexagon",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjUwLDcgMTUwLDcgMjAwLDEwMCAxNTAsMTkzIDUwLDE5MyAwLDEwMCIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="50,7 150,7 200,100 150,193 50,193 0,100" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 11,
    title: "Line",
    width: 240,
    height: 12,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNDAgMTIiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyNDAiIGhlaWdodD0iMTIiIHJ4PSI2IiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 12" preserveAspectRatio="none"><rect x="0" y="0" width="240" height="12" rx="6" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 12,
    title: "Pentagon",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjEwMCwwIDIwMCw3MiAxNjIsMTkwIDM4LDE5MCAwLDcyIiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="100,0 200,72 162,190 38,190 0,72" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 13,
    title: "Plus",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9Ijc2LDAgMTI0LDAgMTI0LDc2IDIwMCw3NiAyMDAsMTI0IDEyNCwxMjQgMTI0LDIwMCA3NiwyMDAgNzYsMTI0IDAsMTI0IDAsNzYgNzYsNzYiIGZpbGw9IiM0RjQ2RTUiLz48L3N2Zz4=",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="76,0 124,0 124,76 200,76 200,124 124,124 124,200 76,200 76,124 0,124 0,76 76,76" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 14,
    title: "Rectangle",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzRGNDZFNSIvPjwvc3ZnPg==",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><rect x="0" y="0" width="200" height="200" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 15,
    title: "Rounded rectangle",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjI4IiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><rect x="0" y="0" width="200" height="200" rx="28" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 16,
    title: "Speech bubble",
    width: 220,
    height: 180,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMjAgMTgwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMjAgMGgxODBhMjAgMjAgMCAwIDEgMjAgMjB2MTAwYTIwIDIwIDAgMCAxLTIwIDIwSDkybC00NiA0MCA4LTQwSDIwQTIwIDIwIDAgMCAxIDAgMTIwVjIwQTIwIDIwIDAgMCAxIDIwIDB6IiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 180" preserveAspectRatio="none"><path d="M20 0h180a20 20 0 0 1 20 20v100a20 20 0 0 1-20 20H92l-46 40 8-40H20A20 20 0 0 1 0 120V20A20 20 0 0 1 20 0z" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 17,
    title: "Star",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjEwMCw0IDEyNiw3MiAyMDAsNzYgMTQzLDEyMyAxNjEsMTk1IDEwMCwxNTUgMzksMTk1IDU3LDEyMyAwLDc2IDc0LDcyIiBmaWxsPSIjNEY0NkU1Ii8+PC9zdmc+",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="100,4 126,72 200,76 143,123 161,195 100,155 39,195 57,123 0,76 74,72" fill="{{colors[0]}}"/></svg>',
    state: 1
  },
  {
    id: 18,
    title: "Triangle",
    width: 200,
    height: 200,
    type: "svg",
    model: '{"colors":["#4F46E5"]}',
    thumb: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cG9seWdvbiBwb2ludHM9IjEwMCwwIDIwMCwyMDAgMCwyMDAiIGZpbGw9IiM0RjQ2RTUiLz48L3N2Zz4=",
    url: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><polygon points="100,0 200,200 0,200" fill="{{colors[0]}}"/></svg>',
    state: 1
  }
], F = /* @__PURE__ */ new Map();
for (const t of oi)
  t.type === "svg" && (F.set(t.title.toLowerCase(), t), F.set(t.title.toLowerCase().replace(/\s+/g, "-"), t), F.set(t.title.toLowerCase().replace(/\s+/g, ""), t));
const mn = oi.filter((t) => t.type === "svg").map((t) => t.title);
function ri(t) {
  return !!t && F.has(String(t).trim().toLowerCase());
}
function Ut(t, e, i, o, r) {
  const n = F.get(String(t).trim().toLowerCase());
  return n ? {
    name: n.title,
    type: "w-svg",
    uuid: dt(),
    width: Math.round(o),
    height: Math.round(o),
    colors: [r],
    left: Math.round(e),
    top: Math.round(i),
    transform: "",
    radius: 0,
    opacity: 1,
    parent: "-1",
    svgUrl: n.url,
    imgUrl: n.url,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 }
  } : null;
}
const ue = {
  letter: { width: 1275, height: 1650 },
  tabloid: { width: 1650, height: 2550 },
  // A roll-up banner: 24 × 72 inches, the size a school already owns a stand for.
  banner: { width: 3600, height: 10800 }
}, o0 = {
  "letter-landscape": { size: "letter", landscape: !0 },
  "letter-portrait": { size: "letter", landscape: !1 }
}, ni = ["direction", "icon", "statement", "number", "notice"];
function jt(t) {
  return { layout: t, icon: null, eyebrow: null, badge: null, head: "", sub: null, foot: null };
}
function r0(t) {
  const e = o0[String(t?.size)], i = ue[e ? e.size : t?.size] || ue.letter;
  return (e ? e.landscape : t?.orientation === "LANDSCAPE") ? { width: i.height, height: i.width } : { ...i };
}
function n0(t, e) {
  const i = Math.round(Math.min(t, e) * 0.09);
  return { W: t, H: e, M: i, content: t - i * 2 };
}
function S(t, e, i, o, r) {
  const n = String(i || "").trim();
  if (!n)
    return null;
  const s = ke(n, { fontFamily: r.font.value, fontSize: r.size, lineHeight: r.lineHeight, letterSpacing: r.tracking, bold: (r.weight || 400) >= 600 }, { width: o.width, height: o.height, minFontSize: r.minSize, maxLines: r.maxLines });
  if (!s.lines.length)
    return null;
  s.truncated && t.rec.note(e, n, "shortened");
  const d = Ae(s, r.lineHeight);
  return {
    widget: Ze({
      left: o.left,
      top: o.top,
      width: o.width,
      height: d,
      fontSize: s.fontSize,
      lineHeight: r.lineHeight,
      letterSpacing: r.tracking ? Math.round(r.tracking * (s.fontSize / r.size)) : 0,
      color: r.color,
      font: r.font,
      fontWeight: r.weight,
      textAlign: r.align ?? "center",
      brandRole: r.brandRole,
      role: r.role,
      text: Ht(s.lines.join(`
`))
    }),
    bottom: o.top + d
  };
}
function V(t, e, i, o, r) {
  const { W: n, H: s, M: d, content: l } = i, a = [], c = r ? e.paper : e.muted, h = Math.round(s * 0.07), g = S(
    t,
    "eyebrow",
    o.eyebrow ? o.eyebrow.toUpperCase() : null,
    { left: d, top: h, width: l, height: Math.round(s * 0.05) },
    {
      font: e.eyebrow,
      size: Math.round(n * 0.028),
      minSize: Math.round(n * 0.016),
      lineHeight: 1.3,
      tracking: e.eyebrowTracking,
      color: r ? e.paper : e.accent,
      brandRole: "keep",
      role: "eyebrow",
      maxLines: 1
    }
  );
  g && a.push(g.widget);
  const u = Math.round(s * 0.9);
  a.push(D(d, u, l, 3, r ? e.paper : e.rule));
  const y = S(
    t,
    "foot",
    t.fill(o.foot || "{{school.name}} · {{school.phone}}"),
    { left: d, top: u + Math.round(s * 0.018), width: l, height: Math.round(s * 0.05) },
    {
      font: e.eyebrow,
      size: Math.round(n * 0.024),
      minSize: Math.round(n * 0.015),
      lineHeight: 1.35,
      color: c,
      brandRole: "keep",
      role: "footer",
      maxLines: 2
    }
  );
  return y && a.push(y.widget), a;
}
function L(t, e, i) {
  return { left: t.M, top: Math.round(e), width: t.content, height: Math.round(i) };
}
function s0(t, e, i, o) {
  const { W: r, H: n, M: s, content: d } = e, l = [];
  l.push(D(0, 0, r, Math.round(n * 0.055), t.accent));
  const a = S(o, "head", i.head, L(e, n * 0.2, n * 0.34), {
    font: t.display,
    size: Math.round(r * 0.19),
    minSize: Math.round(r * 0.07),
    lineHeight: 1.02,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  let c = Math.round(n * 0.56);
  a && (l.push(a.widget), c = a.bottom + Math.round(n * 0.035));
  const h = Ut("arrow right", s + Math.round((d - r * 0.22) / 2), c, Math.round(r * 0.22), t.accent);
  h && (l.push(h), c += Math.round(r * 0.22) + Math.round(n * 0.02));
  const g = S(o, "sub", i.sub, L(e, c, n * 0.86 - c), {
    font: t.body,
    size: Math.round(r * 0.05),
    minSize: Math.round(r * 0.028),
    lineHeight: 1.3,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...V(o, t, e, i, !1)], background: t.paper };
}
function l0(t, e, i, o) {
  const { W: r, H: n, M: s, content: d } = e, l = [], a = Math.round(r * 0.34);
  let c = Math.round(n * 0.17);
  const h = ri(i.icon) ? Ut(i.icon, s + Math.round((d - a) / 2), c, a, t.accent) : null;
  h && (l.push(h), c += a + Math.round(n * 0.04));
  const g = S(o, "head", i.head, L(e, c, n * 0.28), {
    font: t.display,
    size: Math.round(r * 0.14),
    minSize: Math.round(r * 0.06),
    lineHeight: 1.04,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  g && (l.push(g.widget), c = g.bottom + Math.round(n * 0.03));
  const u = S(o, "sub", i.sub, L(e, c, n * 0.86 - c), {
    font: t.body,
    size: Math.round(r * 0.045),
    minSize: Math.round(r * 0.026),
    lineHeight: 1.35,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return u && l.push(u.widget), { layers: [...l, ...V(o, t, e, i, !1)], background: t.paper };
}
function a0(t, e, i, o) {
  const { W: r, H: n } = e, s = [], d = S(o, "head", i.head, L(e, n * 0.24, n * 0.4), {
    font: t.display,
    size: Math.round(r * 0.13),
    minSize: Math.round(r * 0.05),
    lineHeight: 1.08,
    color: t.paper,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  let l = Math.round(n * 0.66);
  d && (s.push(d.widget), l = d.bottom + Math.round(n * 0.035));
  const a = S(o, "sub", i.sub, L(e, l, n * 0.86 - l), {
    font: t.body,
    size: Math.round(r * 0.042),
    minSize: Math.round(r * 0.026),
    lineHeight: 1.4,
    color: t.paper,
    brandRole: "body",
    role: "body"
  });
  return a && s.push(a.widget), { layers: [...s, ...V(o, t, e, i, !0)], background: t.accent };
}
function d0(t, e, i, o) {
  const { W: r, H: n, M: s, content: d } = e, l = [], a = S(o, i.badge ? "badge" : "head", i.badge || i.head, L(e, n * 0.19, n * 0.3), {
    font: t.display,
    size: Math.round(r * 0.4),
    minSize: Math.round(r * 0.1),
    lineHeight: 1,
    color: t.accent,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "number",
    maxLines: 1
  });
  let c = Math.round(n * 0.5);
  a && (l.push(a.widget), c = a.bottom + Math.round(n * 0.03)), l.push(D(s + Math.round(d * 0.35), c, Math.round(d * 0.3), 6, t.rule)), c += Math.round(n * 0.035);
  const h = S(o, i.badge ? "head" : "sub", i.badge ? i.head : i.sub, L(e, c, n * 0.2), {
    font: t.display,
    size: Math.round(r * 0.09),
    minSize: Math.round(r * 0.04),
    lineHeight: 1.1,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  h && (l.push(h.widget), c = h.bottom + Math.round(n * 0.025));
  const g = S(o, "sub", i.badge ? i.sub : null, L(e, c, n * 0.86 - c), {
    font: t.body,
    size: Math.round(r * 0.04),
    minSize: Math.round(r * 0.025),
    lineHeight: 1.35,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...V(o, t, e, i, !1)], background: t.paper };
}
function si(t, e, i, o) {
  const { W: r, H: n, M: s, content: d } = e, l = [];
  l.push(D(s, Math.round(n * 0.135), Math.round(d * 0.18), 10, t.accent));
  const a = S(o, "head", i.head, L(e, n * 0.18, n * 0.26), {
    font: t.display,
    size: Math.round(r * 0.11),
    minSize: Math.round(r * 0.05),
    lineHeight: 1.06,
    color: t.ink,
    weight: t.displayWeight,
    align: "left",
    brandRole: "heading",
    role: "heading"
  });
  let c = Math.round(n * 0.46);
  a && (l.push(a.widget), c = a.bottom + Math.round(n * 0.03));
  const h = ri(i.icon) ? Ut(i.icon, e.W - s - Math.round(r * 0.14), Math.round(n * 0.17), Math.round(r * 0.14), t.accentSoft) : null;
  h && l.push(h);
  const g = S(o, "sub", i.sub, L(e, c, n * 0.86 - c), {
    font: t.body,
    size: Math.round(r * 0.04),
    minSize: Math.round(r * 0.024),
    lineHeight: 1.5,
    color: t.ink,
    align: "left",
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...V(o, t, e, i, !1)], background: t.paper };
}
const c0 = {
  direction: s0,
  icon: l0,
  statement: a0,
  number: d0,
  notice: si
};
function Ft(t, e, i, o, r) {
  const n = n0(i.width, i.height), s = c0[t.layout] || si, { layers: d, background: l } = s(e, n, t, { fill: o, rec: r }), a = t.head?.trim() || t.eyebrow?.trim() || "Sign";
  return { global: Te(a.slice(0, 60), i.width, i.height, l), layers: d };
}
function Mn(t, e, i, o = (r) => r) {
  return Ft(t, e, i, o, Ve());
}
function h0(t, e = {}) {
  const i = st(be(e.theme), e.brand), o = lt(e.brand), r = r0(t || { orientation: "PORTRAIT", size: "letter" }), n = $e(e.maxPages, P), s = ut(), d = Array.isArray(t?.signs) ? t.signs : [], l = d.length ? d : [jt("notice")], a = [];
  l.forEach((h, g) => {
    const u = { ...jt(h?.layout || "notice"), ...h };
    if (s.source = g, s.page = a.length, a.length >= n) {
      for (const y of ["eyebrow", "badge", "head", "sub", "foot"])
        s.note(y, u[y] ?? "", "page-limit");
      return;
    }
    a.push(Ft(u, i, r, o, s));
  });
  const c = { format: "design-studio/v1", title: d[0]?.head?.trim() || "Untitled sign", layouts: a };
  return { document: e.brand ? gt(c, e.brand) : c, report: s.report };
}
function bn(t, e = {}) {
  return h0(t, e).document;
}
function g0(t) {
  const e = je(t.text), i = e.find((o) => Re(o));
  return i ? i.split("|")[0].trim().toLowerCase() : e.length ? e[0].trim().toLowerCase() : t.role ? String(t.role) : t.brandRole && t.brandRole !== "keep" ? t.brandRole : null;
}
function u0(t) {
  const e = typeof t.alt == "string" && t.alt.trim() || t.label || t.role;
  return e ? String(e) : null;
}
function wt(t) {
  const e = t?.layouts?.[0]?.global;
  if (!e)
    return "unknown";
  const i = Number(e.width) >= Number(e.height);
  return i && Math.abs(Number(e.width) / Number(e.height) - q.width / q.height) < 0.06 ? "slides" : !i && Math.abs(Number(e.width) / Number(e.height) - kt.width / kt.height) < 0.25 ? "poster" : i ? "slides" : "poster";
}
function kn(t) {
  const e = Array.isArray(t?.layouts) ? t.layouts : [];
  return {
    title: String(t?.title || ""),
    kind: wt(t),
    pages: e.map((i, o) => {
      const r = Array.isArray(i?.layers) ? i.layers : [], n = typeof i?.global?.notes == "string" ? i.global.notes.trim() : "";
      return {
        index: o,
        width: Number(i?.global?.width) || 0,
        height: Number(i?.global?.height) || 0,
        texts: r.filter((s) => s.type === "w-text" && !s.hidden).map((s) => ({ id: String(s.uuid), role: g0(s), text: Zt(s.text) })).filter((s) => s.text.length > 0),
        images: r.filter((s) => s.type === "w-image" && !s.hidden).map((s) => ({ id: String(s.uuid), alt: u0(s) })),
        notes: n || null
      };
    })
  };
}
const An = ["w-text", "w-image", "w-svg", "w-rect", "w-ellipse", "w-polygon", "w-path", "w-group", "w-qrcode", "w-table"], zt = "page", vn = {
  page: ["backgroundImage"],
  "w-text": ["text"],
  // `originalImgUrl` is the photograph as it was before its background was cut
  // out, kept so it can be put back — a second full-size picture on the widget.
  "w-image": ["imgUrl", "originalImgUrl", "mask"],
  "w-svg": ["svgUrl", "imgUrl"],
  "w-rect": [],
  "w-ellipse": [],
  "w-polygon": [],
  "w-path": [],
  "w-group": [],
  // The address the code points at, which is drawn rather than fetched.
  "w-qrcode": ["url"],
  // One string of markup per cell, the same shape a text widget's `text` is.
  "w-table": ["cells"]
}, Sn = {
  "w-text": ["fontClass.url", "textEffects[].filling.imageContent.image"],
  "w-table": ["fontClass.url"]
}, f0 = /^[A-Za-z0-9 _-]{1,64}$/, w0 = {
  "w-text": ["fontClass.value"],
  "w-table": ["fontClass.value"]
}, y0 = {
  "w-image": ["alt"],
  "w-svg": ["alt"],
  "w-qrcode": ["alt"]
}, li = 500, p0 = {
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
}, I0 = {
  "w-text": ["textEffects[].filling.gradient.angle", "textEffects[].filling.gradient.stops[].offset"]
}, x0 = 400, m0 = 420, M0 = "rise", ai = /* @__PURE__ */ new Set(["bullet", "sub-bullet"]);
function di(t) {
  return String(t.role ?? "");
}
function fe(t, e) {
  const i = t[e], o = t[e + 1];
  return !i || !o ? !1 : String(i.type) === "w-svg" && ai.has(di(o));
}
function b0(t) {
  return t.map((e, i) => {
    const o = { ...e }, r = fe(t, i), n = ai.has(di(e));
    if (!n && !r)
      return delete o.animation, o;
    const s = n && fe(t, i - 1);
    return o.animation = {
      preset: M0,
      duration: m0,
      delay: 0,
      start: s ? "with" : "after"
    }, o;
  });
}
function k0(t) {
  return t.map((e) => {
    const i = { ...e };
    return delete i.animation, i;
  });
}
function A0(t, e) {
  const i = Array.isArray(t?.layouts) ? t.layouts : [];
  return i.length === 0 || wt(t) !== "slides" ? t : {
    ...t,
    layouts: i.map((o) => ({
      ...o,
      global: e ? { ...o.global, transition: { type: "fade", duration: x0 } } : v0(o.global),
      layers: e ? b0(o.layers || []) : k0(o.layers || [])
    }))
  };
}
function v0(t) {
  const e = { ...t };
  return delete e.transition, e;
}
function Dn(t) {
  return (Array.isArray(t?.layouts) ? t.layouts : []).some((i) => {
    const o = i.global?.transition;
    return o && o.type && o.type !== "none" ? !0 : (i.layers || []).some((r) => !!r.animation);
  });
}
const S0 = 3, ci = 1, D0 = Se, C0 = /* @__PURE__ */ new Set(["AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"]), N0 = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "TEXTAREA", "TITLE", "XMP", "IFRAME", "NOEMBED", "NOFRAMES"]), L0 = {
  LI: /^LI$/,
  P: /^P$/,
  DD: /^(DD|DT)$/,
  DT: /^(DD|DT)$/,
  TD: /^(TD|TH)$/,
  TH: /^(TD|TH)$/,
  TR: /^(TD|TH|TR)$/
};
function j0(t) {
  return { nodeType: S0, data: t, childNodes: [], nextSibling: null, parentNode: null };
}
function z0(t) {
  if (!t)
    return null;
  const e = {};
  let i = 0;
  for (const o of t.split(";")) {
    const r = o.indexOf(":");
    if (r < 0)
      continue;
    const n = o.slice(0, r).trim().toLowerCase(), s = o.slice(r + 1).trim();
    s && (i++, n === "color" ? e.color = s : n === "font-weight" ? e.fontWeight = s : n === "font-style" ? e.fontStyle = s : n === "text-decoration-line" ? e.textDecorationLine = s : n === "text-decoration" && (e.textDecoration = s));
  }
  return e.length = i, e;
}
const B0 = /([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
function Z0(t) {
  const e = {};
  for (const i of t.matchAll(B0)) {
    const o = i[1].toLowerCase();
    o !== "href" && o !== "color" && o !== "style" || (e[o] = Q(i[2] ?? i[3] ?? i[4] ?? ""));
  }
  return e;
}
function H0(t, e) {
  return {
    nodeType: ci,
    tagName: t,
    childNodes: [],
    nextSibling: null,
    parentNode: null,
    getAttribute: (i) => e[i.toLowerCase()] ?? null,
    style: z0(e.style)
  };
}
const T0 = /[a-zA-Z]/, W0 = /[a-zA-Z0-9:-]/;
function E0(t, e) {
  let i = e + 1;
  const o = t[i] === "/";
  if (o && i++, !T0.test(t[i] ?? ""))
    return { kind: "text" };
  const r = i;
  for (; i < t.length && W0.test(t[i]); )
    i++;
  const n = t.slice(r, i).toUpperCase(), s = i;
  let d = "";
  for (; i < t.length; i++) {
    const a = t[i];
    if (d) {
      a === d && (d = "");
      continue;
    }
    if (a === '"' || a === "'")
      d = a;
    else if (a === ">")
      break;
  }
  if (i >= t.length)
    return { kind: "eof" };
  const l = t.slice(s, i);
  return { kind: "tag", close: o, name: n, attrs: l, selfClosing: l.trimEnd().endsWith("/"), end: i + 1 };
}
function hi(t) {
  const e = { nodeType: ci, tagName: "BODY", childNodes: [], nextSibling: null, parentNode: null }, i = [e], o = () => i[i.length - 1], r = (l) => {
    const a = o(), c = a.childNodes[a.childNodes.length - 1];
    c && (c.nextSibling = l), l.parentNode = a, a.childNodes.push(l);
  }, n = (l) => {
    l && r(j0(Q(l)));
  }, s = String(t ?? "");
  let d = 0;
  for (; d < s.length; ) {
    const l = s.indexOf("<", d);
    if (l < 0) {
      n(s.slice(d));
      break;
    }
    if (n(s.slice(d, l)), s.startsWith("<!--", l)) {
      const u = s.startsWith(">", l + 4) ? l + 5 : s.startsWith("->", l + 4) ? l + 6 : 0;
      if (u) {
        d = u;
        continue;
      }
      const y = s.indexOf("-->", l + 4);
      d = y < 0 ? s.length : y + 3;
      continue;
    }
    if (s.startsWith("<!", l) || s.startsWith("<?", l)) {
      const u = s.indexOf(">", l);
      d = u < 0 ? s.length : u + 1;
      continue;
    }
    const a = E0(s, l);
    if (a.kind === "text") {
      n("<"), d = l + 1;
      continue;
    }
    if (a.kind === "eof") {
      n(s.slice(l));
      break;
    }
    d = a.end;
    const c = a.name;
    if (a.close) {
      const u = i.findIndex((y) => y.tagName === c);
      u > 0 && (i.length = u);
      continue;
    }
    const h = L0[c];
    h && i.length > 1 && h.test(o().tagName ?? "") && i.pop();
    const g = H0(c, Z0(a.attrs));
    if (r(g), N0.has(c)) {
      const u = s.toUpperCase().indexOf(`</${c}`, d);
      d = u < 0 ? s.length : s.indexOf(">", u) + 1 || s.length;
      continue;
    }
    !C0.has(c) && !a.selfClosing && i.length < D0 && i.push(g);
  }
  return e;
}
function G0(t, e = "none") {
  return nr(Ce(hi(String(t ?? ""))), e);
}
function gi(t) {
  return Ce(hi(String(t ?? ""))).map((e) => e.map((i) => i.text).join("")).join(`
`);
}
const R0 = new Set(
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent currentcolor none".split(
    " "
  )
), P0 = 2e3, at = "[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?", U0 = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, F0 = new RegExp(`^(?:rgba?|hsla?)\\(\\s*${at}(?:%|deg|turn|rad|grad)?(?:\\s*[,/]?\\s*${at}%?){2,3}\\s*\\)$`, "i"), Y0 = new RegExp(`^${at}(?:deg|turn|rad|grad)$`, "i"), J0 = new RegExp(`^${at}(?:%|px|em|rem)?$`, "i"), Q0 = /^(repeating-)?(linear|radial)-gradient\((.*)\)$/is, O0 = /* @__PURE__ */ new Set(["to", "at", "left", "right", "top", "bottom", "center", "circle", "ellipse", "closest-side", "closest-corner", "farthest-side", "farthest-corner"]);
function ui(t) {
  const e = t.trim();
  return !e || e.length > 200 ? !1 : U0.test(e) || F0.test(e) ? !0 : R0.has(e.toLowerCase());
}
function Yt(t, e) {
  const i = [];
  let o = 0, r = 0;
  for (let s = 0; s < t.length; s++) {
    const d = t[s];
    if (d === "(")
      o++;
    else if (d === ")") {
      if (o--, o < 0)
        return null;
    } else
      o === 0 && (e === "," ? d === "," : /\s/.test(d)) && (i.push(t.slice(r, s)), r = s + 1);
  }
  if (o !== 0)
    return null;
  i.push(t.slice(r));
  const n = i.map((s) => s.trim());
  return e === " " ? n.filter(Boolean) : n;
}
function V0(t) {
  const e = Yt(t, " ");
  return !e || e.length === 0 ? !1 : e.every((i) => ui(i) || Y0.test(i) || J0.test(i) || O0.has(i.toLowerCase()));
}
function $0(t) {
  const e = Q0.exec(t.trim());
  if (!e)
    return !1;
  const i = Yt(e[3], ",");
  return !i || i.length < 2 || i.some((o) => !o) ? !1 : i.every(V0);
}
function X0(t) {
  if (typeof t != "string")
    return !1;
  const e = t.trim();
  if (!e || e.length > P0 || /url\(|image-set|image\(|element\(|var\(|env\(|attr\(|expression|[;{}\\"'<>@!]|\/\*/i.test(e))
    return !1;
  if (ui(e))
    return !0;
  const i = Yt(e, ",");
  return !!i && i.every($0);
}
const fi = ["editable", "cropEdit"];
new Set(fi);
function _0(t) {
  if (Array.isArray(t))
    for (const e of t) {
      const i = e?.layers;
      if (Array.isArray(i)) {
        for (const o of i)
          if (!(!o || typeof o != "object"))
            for (const r of fi)
              o[r] && delete o[r];
      }
    }
}
function K0(t, e) {
  return typeof e != "string" ? !1 : t === "fontClass.value" ? f0.test(e) : !0;
}
function q0(t, e) {
  const i = e.split(".");
  let o = t;
  for (const r of i.slice(0, -1)) {
    if (!o || typeof o != "object")
      return null;
    o = o[r];
  }
  return !o || typeof o != "object" ? null : { holder: o, key: i[i.length - 1] };
}
function we(t, e) {
  let i = [{ holder: { root: t }, key: "root" }];
  for (const o of e.split(".")) {
    const r = o.endsWith("[]"), n = r ? o.slice(0, -2) : o, s = [];
    for (const { holder: d, key: l } of i) {
      const a = d[l];
      if (!a || typeof a != "object")
        continue;
      if (!r) {
        s.push({ holder: a, key: n });
        continue;
      }
      const c = a[n];
      Array.isArray(c) && c.forEach((h, g) => s.push({ holder: c, key: g }));
    }
    i = s;
  }
  return i;
}
function tn(t, e) {
  return t === zt && e === "backgroundGradient" ? "" : t === zt && e === "backgroundColor" ? "#ffffffff" : "transparent";
}
function ye(t, e, i) {
  for (const o of p0[e] || [])
    for (const { holder: r, key: n } of we(t, o)) {
      const s = r[n];
      s == null || s === "" || typeof s == "string" && X0(s) || (i.dropped.push({ type: e, path: o, value: String(s).slice(0, 80) }), r[n] = tn(e, o));
    }
  for (const o of I0[e] || [])
    for (const { holder: r, key: n } of we(t, o)) {
      const s = r[n];
      s != null && (typeof s == "number" && Number.isFinite(s) || (i.dropped.push({ type: e, path: o, value: String(s).slice(0, 80) }), r[n] = o.endsWith(".angle") ? 180 : 0));
    }
}
function en(t, e, i) {
  for (const o of y0[e] || []) {
    if (!(o in t) || t[o] === void 0)
      continue;
    const r = t[o];
    if (typeof r != "string") {
      i.dropped.push({ type: e, path: o, value: String(r).slice(0, 80) }), delete t[o];
      continue;
    }
    const n = r.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, li);
    n !== r && (t[o] = n);
  }
  "decorative" in t && t.decorative !== void 0 && typeof t.decorative != "boolean" && (i.dropped.push({ type: e, path: "decorative", value: String(t.decorative).slice(0, 80) }), delete t.decorative);
}
function on(t) {
  const e = JSON.parse(JSON.stringify(t));
  return { doc: e, report: rn(e) };
}
function rn(t) {
  const e = { dropped: [] };
  _0(t.layouts);
  for (const i of t.layouts || []) {
    i?.global && typeof i.global == "object" && ye(i.global, zt, e);
    for (const o of i.layers || [])
      if (!(!o || typeof o != "object")) {
        ye(o, String(o.type), e), en(o, String(o.type), e);
        for (const r of w0[String(o.type)] || []) {
          const n = q0(o, r);
          if (!n)
            continue;
          const s = n.holder[n.key];
          s === void 0 || K0(r, s) || (e.dropped.push({ type: String(o.type), path: r, value: String(s).slice(0, 80) }), r === "fontClass.value" ? (delete o.fontClass, delete o.fontFamily) : delete n.holder[n.key]);
        }
      }
  }
  return e;
}
function nn(t) {
  return t === "poster" ? [...ni] : [...Ke];
}
function sn(t) {
  const { doc: e, report: i } = on(t);
  return i.dropped.length && console.warn("[design] dropped fields a design may not carry", i.dropped), e;
}
function bt(t, e) {
  for (const i of t.layouts)
    for (const o of i.layers)
      if (String(o.uuid) === String(e))
        return o;
  return null;
}
function pe(t, e) {
  return e ? gt({ format: "design-studio/v1", title: "", layouts: [t] }, e).layouts[0] : t;
}
function ln(t, e, i, o, r, n, s) {
  const d = String(i.bullets || "").split(`
`).map((a) => a.trim()).filter(Boolean).map((a) => ({ text: a, sub: [] }));
  if (wt(t) === "poster") {
    if (!ni.includes(e))
      return null;
    const a = t.layouts[0]?.global, c = { width: Number(a?.width) || 1275, height: Number(a?.height) || 1650 }, h = {
      ...jt(e),
      icon: i.icon || null,
      eyebrow: i.eyebrow || null,
      badge: i.badge || null,
      head: i.head || i.title || "",
      sub: i.sub || null,
      foot: i.foot || null
    };
    return o.page = r, [pe(Ft(h, st(be(i.theme), s), c, lt(s), o), s)];
  }
  if (!Ke.includes(e))
    return null;
  const l = {
    ...Et(e),
    title: i.title || i.head || null,
    kicker: i.kicker || i.eyebrow || null,
    sub: i.sub || null,
    callout: i.callout || null,
    notes: i.notes || null,
    bullets: d,
    columnHeads: [i.columnHeadLeft || "", i.columnHeadRight || ""].filter(Boolean),
    bulletsRight: String(i.bulletsRight || "").split(`
`).map((a) => a.trim()).filter(Boolean).map((a) => ({ text: a, sub: [] }))
  };
  return Pt(l, st(Me(i.theme), s), lt(s), o, r, n).map((a) => pe(a, s));
}
function Cn(t, e, i = {}) {
  let o = sn(t);
  const r = [], n = Array.isArray(e) ? e : [], s = ut();
  for (const [d, l] of n.entries()) {
    if (s.source = d, !l || typeof l != "object") {
      r.push({ op: l, reason: "That is not an operation." });
      continue;
    }
    switch (l.op) {
      case "setText": {
        const a = bt(o, l.id);
        if (!a) {
          r.push({ op: l, reason: `No widget with id ${l.id}.` });
          break;
        }
        if (a.type !== "w-text") {
          r.push({ op: l, reason: `Widget ${l.id} is a ${a.type}, which holds no text.` });
          break;
        }
        a.text = Ht(l.text);
        break;
      }
      case "setMarkup": {
        const a = bt(o, l.id);
        if (!a) {
          r.push({ op: l, reason: `No widget with id ${l.id}.` });
          break;
        }
        if (a.type !== "w-text") {
          r.push({ op: l, reason: `Widget ${l.id} is a ${a.type}, which holds no text.` });
          break;
        }
        a.text = G0(String(l.html ?? ""), a.listStyle);
        break;
      }
      case "setImage": {
        const a = bt(o, l.id);
        if (!a) {
          r.push({ op: l, reason: `No widget with id ${l.id}.` });
          break;
        }
        if (a.type !== "w-image") {
          r.push({ op: l, reason: `Widget ${l.id} is a ${a.type}, which holds no picture.` });
          break;
        }
        if (!l.url) {
          r.push({ op: l, reason: "A picture needs a url." });
          break;
        }
        const c = He(a, { width: Number(l.width) || 0, height: Number(l.height) || 0 });
        a.imgUrl = l.url, a.zoom = c.zoom, a.zoomY = c.zoomY, a.transform = c.transform, typeof l.alt == "string" && l.alt.trim() ? a.alt = l.alt.trim().slice(0, li) : delete a.alt;
        break;
      }
      case "addPage": {
        if (o.layouts.length >= P) {
          r.push({ op: l, reason: `A design holds at most ${P} pages.` });
          break;
        }
        const a = Number(l.after);
        if (!Number.isInteger(a) || a < -1 || a > o.layouts.length - 1) {
          r.push({ op: l, reason: `There is no page ${l.after} to add after.` });
          break;
        }
        const c = ln(o, String(l.kind), l.fields || {}, s, a + 1, P - o.layouts.length, i.brand);
        if (!c) {
          r.push({ op: l, reason: `“${l.kind}” is not a page this design can hold. Try one of: ${nn(wt(o) === "poster" ? "poster" : "slides").join(", ")}.` });
          break;
        }
        o.layouts.splice(a + 1, 0, ...c);
        break;
      }
      case "removePage": {
        const a = Number(l.index);
        if (!Number.isInteger(a) || a < 0 || a >= o.layouts.length) {
          r.push({ op: l, reason: `There is no page ${l.index}.` });
          break;
        }
        if (o.layouts.length === 1) {
          r.push({ op: l, reason: "A design has to keep one page." });
          break;
        }
        o.layouts.splice(a, 1);
        break;
      }
      case "movePage": {
        const a = Number(l.from), c = Number(l.to);
        if (!Number.isInteger(a) || a < 0 || a >= o.layouts.length) {
          r.push({ op: l, reason: `There is no page ${l.from}.` });
          break;
        }
        if (!Number.isInteger(c) || c < 0 || c >= o.layouts.length) {
          r.push({ op: l, reason: `Page ${l.from} cannot go to ${l.to}; there are ${o.layouts.length} pages.` });
          break;
        }
        const [h] = o.layouts.splice(a, 1);
        o.layouts.splice(c, 0, h);
        break;
      }
      case "setMotion": {
        o = A0(o, l.on !== !1);
        break;
      }
      case "applyBrand": {
        if (!i.brand) {
          r.push({ op: l, reason: "No brand kit was given to apply." });
          break;
        }
        o = gt(o, i.brand);
        break;
      }
      default:
        r.push({ op: l, reason: `“${l.op}” is not an operation.` });
    }
  }
  return { doc: o, rejected: r, report: s.report };
}
function an(t) {
  const e = t, i = typeof e.alt == "string" ? e.alt.trim() : "";
  if (i)
    return { state: "described", text: i };
  if (e.decorative)
    return { state: "decorative" };
  switch (String(t.type)) {
    case "w-image":
      return { state: "missing" };
    case "w-qrcode": {
      const o = String(e.value || e.url || "").trim();
      return { state: "described", text: o ? `QR code linking to ${o}` : "QR code" };
    }
    default:
      return { state: "decorative" };
  }
}
function dn(t) {
  if (t.hidden)
    return !0;
  const e = t.opacity;
  return e !== void 0 && Number(e) === 0;
}
function cn(t) {
  if (Bt(t) === Z)
    return Math.round(12 / 72 * Z);
  const e = Math.min(Number(t.width) || 1080, Number(t.height) || 1080);
  return Math.max(10, Math.round(20 * e / 1080));
}
const M = (t) => Number(t) || 0;
function wi(t) {
  const e = t.fontWeight;
  return e === "bold" || e === "bolder" || Number(e) >= 600;
}
function hn(t) {
  return {
    fontFamily: String(t.fontFamily || t.fontClass?.value || ""),
    fontSize: M(t.fontSize) || 24,
    lineHeight: M(t.lineHeight) || 1.5,
    letterSpacing: M(t.letterSpacing),
    bold: wi(t)
  };
}
function gn(t) {
  const e = new Set(t.filter((i) => i.isContainer && i.hidden).map((i) => i.uuid));
  return t.map((i, o) => ({ widget: i, index: o })).filter(({ widget: i }) => !i.isContainer && !dn(i) && !(i.parent && e.has(i.parent)));
}
function un(t, e) {
  const i = gi(String(t.text ?? ""));
  if (!i.trim() || M(t.rotate) || /rotate\(\s*-?[1-9]/.test(String(t.transform || "")) || String(t.writingMode || "").startsWith("vertical"))
    return null;
  const r = hn(t), n = M(t.width), s = r.fontSize * r.lineHeight;
  for (const w of i.split(/\s+/))
    if (w && Y(w, r) > n * 1.08 + 2)
      return `“${w.length > 24 ? `${w.slice(0, 24)}…` : w}” is too long for its box and will spill out of it.`;
  const d = St(i, n, r), l = d.reduce((w, I) => Math.max(w, Y(I, r) / 1.06), 0), a = d.length * s;
  if (a > M(t.height) + s * 1.5)
    return "There is more text than this box holds. Make the box bigger or cut some words.";
  const c = String(t.textAlign || "left"), h = c === "center" ? M(t.left) + (n - l) / 2 : c === "right" ? M(t.left) + n - l : M(t.left), g = M(t.top), u = g + Math.min(a, Math.max(M(t.height), s)), y = 2;
  return h < -y || h + l > M(e.width) + y || g < -y || u > M(e.height) + y ? "Part of this text is off the edge of the page." : null;
}
function fn(t, e) {
  const i = M(t.fontSize), o = cn(e);
  return !i || i >= o ? null : Bt(e) === Z ? `This text prints at about ${Math.round(i / Z * 72)}pt, which is hard to read. Make it at least 12pt (${o}px).` : `This text is too small to read on a screen. Make it at least ${o}px.`;
}
function wn(t, e, i) {
  const o = t.textEffects;
  if (!i || Array.isArray(o) && o.length)
    return null;
  const r = String(t.color || "");
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(r))
    return null;
  const n = N(H(r, i), i), s = xe(M(t.fontSize), wi(t), e);
  return n >= s ? null : `This text is hard to read against what is behind it. The contrast is ${Math.floor(n * 10) / 10}:1 and needs to be ${s}:1.`;
}
function yn(t, e = {}) {
  const i = [];
  return t.forEach((o, r) => {
    const n = o.global, s = o.layers || [], d = Ur(s, n);
    for (const { widget: l, index: a } of gn(s)) {
      const c = (h, g) => {
        g && i.push({ page: r, widgetId: String(l.uuid), kind: h, message: g });
      };
      if (l.type === "w-text") {
        if (!gi(String(l.text ?? "")).trim())
          continue;
        c("overflow", un(l, n)), c("tiny-text", fn(l, n)), c("low-contrast", wn(l, n, d(a)));
      } else
        l.type === "w-image" && !e.skipAlt && an(l).state === "missing" && c("missing-alt", "This picture has no alt text. Describe it, or mark it decorative.");
    }
  }), i;
}
function Nn(t) {
  return yn(Array.isArray(t?.layouts) ? t.layouts : []);
}
export {
  Ke as DECK_PAGE_KINDS,
  mn as ICON_KEYS,
  yr as IMAGE_SLOT_ROLE,
  li as MAX_ALT_LENGTH,
  P as MAX_PAGES,
  Sn as NESTED_URL_PATHS,
  zt as PAGE_TYPE,
  p0 as PAINT_FIELDS,
  I0 as PAINT_NUMBER_FIELDS,
  Ro as POSTER_PACK_KEYS,
  kt as POSTER_PAGE,
  f0 as SAFE_FONT_FAMILY,
  w0 as SANITISED_FIELDS,
  ni as SIGN_PAGE_KINDS,
  q as SLIDE_PAGE,
  Go as SLIDE_THEME_KEYS,
  y0 as TEXT_FIELDS,
  vn as URL_FIELDS,
  An as WIDGET_TYPES,
  gt as applyBrand,
  A0 as applyMotion,
  Cn as applyOps,
  jt as blankSign,
  Et as blankSlide,
  Nn as checkDocument,
  xn as composeDeck,
  i0 as composeDeckWithReport,
  bn as composePoster,
  h0 as composePosterWithReport,
  Mn as composeSign,
  In as composeSlide,
  kn as describeDocument,
  Dn as hasMotion,
  X0 as isSafePaint,
  wt as kindOf,
  gi as markupToText,
  nn as pageKinds,
  r0 as pageSize,
  pn as pageSizeFor,
  hi as parseMarkup,
  be as posterPack,
  on as sanitizeFields,
  G0 as sanitizeMarkup,
  Me as slideTheme
};
