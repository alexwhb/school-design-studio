const R = { width: 1920, height: 1080 }, ht = { width: 1275, height: 1650 };
function E0(t) {
  return t === "poster" ? { ...ht } : { ...R };
}
const G = 150, je = {
  px: 1,
  in: G,
  mm: G / 25.4,
  cm: G / 2.54
}, Le = { px: 0, in: 2, mm: 1, cm: 2 };
function kt(t, e) {
  const o = 10 ** Le[e];
  return Math.round((Number(t) || 0) / je[e] * o) / o;
}
const ze = [
  { name: "A3", mm: [297, 420], unit: "mm" },
  { name: "A4", mm: [210, 297], unit: "mm" },
  { name: "A5", mm: [148, 210], unit: "mm" },
  { name: "Letter", mm: [215.9, 279.4], unit: "in" },
  { name: "Legal", mm: [215.9, 355.6], unit: "in" },
  { name: "Tabloid", mm: [279.4, 431.8], unit: "in" }
], At = 1.5;
function Be(t, e) {
  const i = kt(t, "mm"), o = kt(e, "mm"), r = Math.min(i, o), s = Math.max(i, o);
  return ze.find((n) => Math.abs(n.mm[0] - r) <= At && Math.abs(n.mm[1] - s) <= At) ?? null;
}
function Ze(t, e) {
  const i = Be(t, e);
  return i ? `${i.name} ${Number(e) >= Number(t) ? "portrait" : "landscape"}` : null;
}
const P = "#ffffffff", He = "#000000ff", We = 0.6, vt = 0.02, Te = 1.2, Yt = 96, Ge = 0.179;
function U(t) {
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
function ct({ r: t, g: e, b: i, a: o }) {
  const r = (s) => Math.max(0, Math.min(255, Math.round(s))).toString(16).padStart(2, "0");
  return `#${r(t)}${r(e)}${r(i)}${r(o * 255)}`;
}
function ot(t) {
  const e = t / 255;
  return e <= 0.03928 ? e / 12.92 : ((e + 0.055) / 1.055) ** 2.4;
}
function Y(t) {
  const e = U(t);
  return e ? 0.2126 * ot(e.r) + 0.7152 * ot(e.g) + 0.0722 * ot(e.b) : 0;
}
function S(t, e) {
  const i = Y(t), o = Y(e), r = Math.max(i, o), s = Math.min(i, o);
  return (r + 0.05) / (s + 0.05);
}
function N(t, e) {
  const i = U(t), o = U(e);
  return i ? !o || i.a >= 1 ? ct({ ...i, a: 1 }) : ct({
    r: i.r * i.a + o.r * (1 - i.a),
    g: i.g * i.a + o.g * (1 - i.a),
    b: i.b * i.a + o.b * (1 - i.a),
    a: 1
  }) : e;
}
function Ee(t) {
  return Ze(t.width, t.height) ? G : Yt;
}
function Re(t, e, i) {
  const o = (Number(t) || 0) * (Yt / Ee(i));
  return e ? o >= 18.66 : o >= 24;
}
function Pe(t, e, i) {
  return Re(t, e, i) ? 3 : 4.5;
}
const St = 3;
function gt(t, e) {
  let i = e[0], o = -1;
  for (const r of e) {
    const s = S(r, t);
    s > o && (i = r, o = s);
  }
  return i;
}
function Jt(t, e, i) {
  const o = S(t, e);
  if (o >= i)
    return { color: t, ratio: o, met: !0, changed: !1 };
  const r = U(t);
  if (!r)
    return { color: t, ratio: o, met: !1, changed: !1 };
  const s = i * Te, n = Ue(r), a = Y(e) > Ge ? -1 : 1;
  let l = t, d = o;
  for (let h = 1; h * vt <= We; h++) {
    const c = n.l + a * h * vt;
    if (c < 0 || c > 1)
      break;
    const g = ct({ ...Ye(n.h, n.s, c), a: r.a }), u = S(g, e);
    if (l = g, d = u, u >= s)
      return { color: g, ratio: u, met: !0, changed: !0 };
  }
  return { color: l, ratio: d, met: d >= i, changed: l !== t };
}
function Ue({ r: t, g: e, b: i }) {
  const o = t / 255, r = e / 255, s = i / 255, n = Math.max(o, r, s), a = Math.min(o, r, s), l = (n + a) / 2, d = n - a;
  if (d === 0)
    return { h: 0, s: 0, l };
  const h = d / (1 - Math.abs(2 * l - 1));
  let c = 0;
  return n === o ? c = (r - s) / d % 6 : n === r ? c = (s - o) / d + 2 : c = (o - r) / d + 4, { h: (c * 60 + 360) % 360, s: h, l };
}
function Ye(t, e, i) {
  const o = (1 - Math.abs(2 * i - 1)) * e, r = o * (1 - Math.abs(t / 60 % 2 - 1)), s = i - o / 2, n = Math.floor((t % 360 + 360) % 360 / 60), [a, l, d] = [
    [o, r, 0],
    [r, o, 0],
    [0, o, r],
    [0, r, o],
    [r, 0, o],
    [o, 0, r]
  ][n];
  return { r: (a + s) * 255, g: (l + s) * 255, b: (d + s) * 255, a: 1 };
}
const Je = "201", Fe = "Editorial slide — cover", Qe = 1920, Oe = 1080, Ve = "slide-themes", Xe = {
  colors: {
    "8c2f24": "primary"
  }
}, $e = '[{"global": {"name": "Editorial slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FAF7F0ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "067230bb22b7", "editable": false, "left": 100, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 12, "fontSize": 25, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3f194358eb67", "editable": false, "left": 1020, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 12, "fontSize": 25, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8C2F24ff", "textAlign": "right", "text": "NO. 24 — SEPTEMBER 2026", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 800, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "47b4e5a74705", "width": 1720, "height": 3, "colors": ["#191713ff"], "left": 100, "top": 140, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1720 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1720\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c8b69734e8b5", "editable": false, "left": 100, "top": 187, "transform": "", "lineHeight": 0.98, "letterSpacing": -2, "fontSize": 104, "fontClass": {"alias": "Libre Baskerville", "id": 0, "value": "Libre Baskerville", "url": "/fonts/libre-baskerville-400-700.woff2"}, "fontFamily": "Libre Baskerville", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 948, "height": 204, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "5e862c48bfdd", "editable": false, "left": 100, "top": 425, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 38, "fontClass": {"alias": "Libre Baskerville", "id": 0, "value": "Libre Baskerville", "url": "/fonts/libre-baskerville-400-700.woff2"}, "fontFamily": "Libre Baskerville", "brandRole": "body", "fontWeight": 400, "fontStyle": "italic", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#4A443Bff", "textAlign": "left", "text": "A review of the 2025–26 school year, and what our families can expect in the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 948, "height": 103, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "9f2a0450296d", "width": 330, "height": 2, "colors": ["#CFC7B6ff"], "left": 100, "top": 570, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 330 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"330\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "795854efae2d", "editable": false, "left": 100, "top": 584, "transform": "", "lineHeight": 1.6, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Dana Whitlock<br/>Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 330, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "ee8dfea969d2", "width": 430, "height": 2, "colors": ["#CFC7B6ff"], "left": 476, "top": 570, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 430 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"430\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a023fc184123", "editable": false, "left": 476, "top": 584, "transform": "", "lineHeight": 1.6, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#191713ff", "textAlign": "left", "text": "Tuesday, Sept. 15<br/>7:00 p.m., Auditorium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 430, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "317392077410", "width": 702, "height": 720, "colors": ["#19171312", "#CFC7B6ff"], "left": 1118, "top": 187, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 702 720\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-720\\" y1=\\"0\\" x2=\\"0\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-702\\" y1=\\"0\\" x2=\\"18\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-684\\" y1=\\"0\\" x2=\\"36\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-666\\" y1=\\"0\\" x2=\\"54\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-648\\" y1=\\"0\\" x2=\\"72\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-630\\" y1=\\"0\\" x2=\\"90\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-612\\" y1=\\"0\\" x2=\\"108\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-594\\" y1=\\"0\\" x2=\\"126\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-576\\" y1=\\"0\\" x2=\\"144\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-558\\" y1=\\"0\\" x2=\\"162\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-540\\" y1=\\"0\\" x2=\\"180\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-522\\" y1=\\"0\\" x2=\\"198\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-504\\" y1=\\"0\\" x2=\\"216\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-486\\" y1=\\"0\\" x2=\\"234\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"252\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"270\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"288\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"306\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"324\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"342\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"360\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"378\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"396\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"414\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"432\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"450\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"468\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"486\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"504\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"522\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"540\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"558\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"576\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"594\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"612\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"630\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"648\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"666\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"684\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"702\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"720\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"738\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"756\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"774\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"792\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"810\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"828\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"846\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"864\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"882\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"900\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"918\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"936\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"954\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"972\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"990\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"1008\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"1026\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"1044\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"1062\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"1080\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"1098\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"1116\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"1134\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"1152\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"1170\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"1188\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"1206\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"1224\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"1242\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1260\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1278\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1296\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1314\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1332\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1350\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1368\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1386\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1404\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1422\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1440\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1458\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1476\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1494\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1512\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1530\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1548\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1566\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1584\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1602\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1620\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1638\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1656\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1674\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1692\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1710\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1728\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1746\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1764\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1782\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1800\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1818\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1836\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1854\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1872\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1170\\" y1=\\"0\\" x2=\\"1890\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1188\\" y1=\\"0\\" x2=\\"1908\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1206\\" y1=\\"0\\" x2=\\"1926\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1224\\" y1=\\"0\\" x2=\\"1944\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1242\\" y1=\\"0\\" x2=\\"1962\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1260\\" y1=\\"0\\" x2=\\"1980\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1278\\" y1=\\"0\\" x2=\\"1998\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1296\\" y1=\\"0\\" x2=\\"2016\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1314\\" y1=\\"0\\" x2=\\"2034\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1332\\" y1=\\"0\\" x2=\\"2052\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1350\\" y1=\\"0\\" x2=\\"2070\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1368\\" y1=\\"0\\" x2=\\"2088\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1386\\" y1=\\"0\\" x2=\\"2106\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1404\\" y1=\\"0\\" x2=\\"2124\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1422\\" y1=\\"0\\" x2=\\"2142\\" y2=\\"720\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"700\\" height=\\"718\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "562108b2b0b9", "editable": false, "left": 1140, "top": 858, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 22, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6355ff", "textAlign": "left", "text": "image: front entrance, fall 2026", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 658, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "7d91b639754d", "width": 1720, "height": 2, "colors": ["#CFC7B6ff"], "left": 100, "top": 951, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1720 2\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1720\\" height=\\"2\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "ddfcf9deb99e", "editable": false, "left": 100, "top": 972, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 23, "fontClass": {"alias": "IBM Plex Mono", "id": 0, "value": "IBM Plex Mono", "url": "/fonts/ibm-plex-mono-400.woff2"}, "fontFamily": "IBM Plex Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6355ff", "textAlign": "left", "text": "Enrollment 842 · Grades 6–8 · {{school.address}} · {{school.website}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1720, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Ke = {
  id: Je,
  title: Fe,
  width: Qe,
  height: Oe,
  pack: Ve,
  brand: Xe,
  data: $e
}, _e = "206", qe = "Swiss slide — cover", ti = 1920, ei = 1080, ii = "slide-themes", oi = {
  colors: {
    e4322b: "primary"
  }
}, ri = '[{"global": {"name": "Swiss slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FFFFFFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "6322b794e0cb", "editable": false, "left": 90, "top": 43, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 26, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3b30e8d4e0e6", "editable": false, "left": 1230, "top": 43, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 26, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E4322Bff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 600, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "193d583ca2e5", "width": 1920, "height": 1, "colors": ["#101010ff"], "left": 0, "top": 120, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 1\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"1\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "cf4bf83a4442", "width": 1, "height": 760, "colors": ["#DCDCDCff"], "left": 1120, "top": 120, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 760\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"760\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "83f1c7ee09fc", "editable": false, "left": 90, "top": 200, "transform": "", "lineHeight": 0.92, "letterSpacing": -4, "fontSize": 118, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "Annual<br/>Report to<br/>Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 970, "height": 326, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "bbf497030648", "editable": false, "left": 90, "top": 726, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#444444ff", "textAlign": "left", "text": "The year in review, the results, and the calendar for 2026–27.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 780, "height": 94, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "8758def70cc2", "width": 650, "height": 441, "colors": ["#10101014", "#101010ff"], "left": 1180, "top": 200, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 650 441\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-448\\" y1=\\"0\\" x2=\\"-448\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"-432\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-416\\" y1=\\"0\\" x2=\\"-416\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-400\\" y1=\\"0\\" x2=\\"-400\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-384\\" y1=\\"0\\" x2=\\"-384\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-368\\" y1=\\"0\\" x2=\\"-368\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-352\\" y1=\\"0\\" x2=\\"-352\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-336\\" y1=\\"0\\" x2=\\"-336\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-320\\" y1=\\"0\\" x2=\\"-320\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-304\\" y1=\\"0\\" x2=\\"-304\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"-288\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-272\\" y1=\\"0\\" x2=\\"-272\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-256\\" y1=\\"0\\" x2=\\"-256\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-240\\" y1=\\"0\\" x2=\\"-240\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-224\\" y1=\\"0\\" x2=\\"-224\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-208\\" y1=\\"0\\" x2=\\"-208\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-192\\" y1=\\"0\\" x2=\\"-192\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-176\\" y1=\\"0\\" x2=\\"-176\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-160\\" y1=\\"0\\" x2=\\"-160\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"-144\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-128\\" y1=\\"0\\" x2=\\"-128\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-112\\" y1=\\"0\\" x2=\\"-112\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-96\\" y1=\\"0\\" x2=\\"-96\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-80\\" y1=\\"0\\" x2=\\"-80\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-64\\" y1=\\"0\\" x2=\\"-64\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-48\\" y1=\\"0\\" x2=\\"-48\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-32\\" y1=\\"0\\" x2=\\"-32\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"-16\\" y1=\\"0\\" x2=\\"-16\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"0\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"16\\" y1=\\"0\\" x2=\\"16\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"32\\" y1=\\"0\\" x2=\\"32\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"48\\" y1=\\"0\\" x2=\\"48\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"64\\" y1=\\"0\\" x2=\\"64\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"80\\" y1=\\"0\\" x2=\\"80\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"96\\" y1=\\"0\\" x2=\\"96\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"112\\" y1=\\"0\\" x2=\\"112\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"128\\" y1=\\"0\\" x2=\\"128\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"144\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"160\\" y1=\\"0\\" x2=\\"160\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"176\\" y1=\\"0\\" x2=\\"176\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"192\\" y1=\\"0\\" x2=\\"192\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"208\\" y1=\\"0\\" x2=\\"208\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"224\\" y1=\\"0\\" x2=\\"224\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"240\\" y1=\\"0\\" x2=\\"240\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"256\\" y1=\\"0\\" x2=\\"256\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"272\\" y1=\\"0\\" x2=\\"272\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"288\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"304\\" y1=\\"0\\" x2=\\"304\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"320\\" y1=\\"0\\" x2=\\"320\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"336\\" y1=\\"0\\" x2=\\"336\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"352\\" y1=\\"0\\" x2=\\"352\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"368\\" y1=\\"0\\" x2=\\"368\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"384\\" y1=\\"0\\" x2=\\"384\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"400\\" y1=\\"0\\" x2=\\"400\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"416\\" y1=\\"0\\" x2=\\"416\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"432\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"448\\" y1=\\"0\\" x2=\\"448\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"464\\" y1=\\"0\\" x2=\\"464\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"480\\" y1=\\"0\\" x2=\\"480\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"496\\" y1=\\"0\\" x2=\\"496\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"512\\" y1=\\"0\\" x2=\\"512\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"528\\" y1=\\"0\\" x2=\\"528\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"544\\" y1=\\"0\\" x2=\\"544\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"560\\" y1=\\"0\\" x2=\\"560\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"576\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"592\\" y1=\\"0\\" x2=\\"592\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"608\\" y1=\\"0\\" x2=\\"608\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"624\\" y1=\\"0\\" x2=\\"624\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"640\\" y1=\\"0\\" x2=\\"640\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"656\\" y1=\\"0\\" x2=\\"656\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"672\\" y1=\\"0\\" x2=\\"672\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"688\\" y1=\\"0\\" x2=\\"688\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"704\\" y1=\\"0\\" x2=\\"704\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"720\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"736\\" y1=\\"0\\" x2=\\"736\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"752\\" y1=\\"0\\" x2=\\"752\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"768\\" y1=\\"0\\" x2=\\"768\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"784\\" y1=\\"0\\" x2=\\"784\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"800\\" y1=\\"0\\" x2=\\"800\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"816\\" y1=\\"0\\" x2=\\"816\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"832\\" y1=\\"0\\" x2=\\"832\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"848\\" y1=\\"0\\" x2=\\"848\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"864\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"880\\" y1=\\"0\\" x2=\\"880\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"896\\" y1=\\"0\\" x2=\\"896\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"912\\" y1=\\"0\\" x2=\\"912\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"928\\" y1=\\"0\\" x2=\\"928\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"944\\" y1=\\"0\\" x2=\\"944\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"960\\" y1=\\"0\\" x2=\\"960\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"976\\" y1=\\"0\\" x2=\\"976\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"992\\" y1=\\"0\\" x2=\\"992\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1008\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1024\\" y1=\\"0\\" x2=\\"1024\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1040\\" y1=\\"0\\" x2=\\"1040\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1056\\" y1=\\"0\\" x2=\\"1056\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1072\\" y1=\\"0\\" x2=\\"1072\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><line x1=\\"1088\\" y1=\\"0\\" x2=\\"1088\\" y2=\\"441\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"8\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"648\\" height=\\"439\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7807bdc18083", "editable": false, "left": 1200, "top": 595, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 22, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "IMAGE: STUDENTS, MAIN CORRIDOR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 610, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "732f8d1c4c48", "width": 650, "height": 3, "colors": ["#E4322Bff"], "left": 1180, "top": 675, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 650 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"650\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "dd75a08a022b", "editable": false, "left": 1180, "top": 694, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 28, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "Dana Whitlock, Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 650, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "a9a8c629ceed", "editable": false, "left": 1180, "top": 736, "transform": "", "lineHeight": 1.5, "letterSpacing": 0, "fontSize": 28, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#555555ff", "textAlign": "left", "text": "Tuesday, September 15 · 7:00 p.m.<br/>Auditorium, doors open 6:30", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 650, "height": 84, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "d28685db8417", "width": 1920, "height": 1, "colors": ["#101010ff"], "left": 0, "top": 880, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 1\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"1\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a1a5febfbdc7", "editable": false, "left": 90, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "1055ec722c17", "editable": false, "left": 90, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3d61cf0e2e60", "editable": false, "left": 525, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "GRADES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "2a4f01511428", "editable": false, "left": 525, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "e6b4424bd842", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 495, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "76cca2989666", "editable": false, "left": 960, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c07d12a4ab30", "editable": false, "left": 960, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a4638b5d6dae", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 930, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7589fa94aa57", "editable": false, "left": 1395, "top": 920, "transform": "", "lineHeight": 1.3, "letterSpacing": 14, "fontSize": 24, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#666666ff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3755807634a4", "editable": false, "left": 1395, "top": 956, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 54, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#101010ff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 405, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "8c586f9a2b90", "width": 1, "height": 110, "colors": ["#DCDCDCff"], "left": 1365, "top": 920, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 110\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"110\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}]}]', ni = {
  id: _e,
  title: qe,
  width: ti,
  height: ei,
  pack: ii,
  brand: oi,
  data: ri
}, si = "211", li = "Academic slide — cover", ai = 1920, di = 1080, hi = "slide-themes", ci = {
  colors: {
    "0f2340": "primary",
    cfa93f: "secondary"
  }
}, gi = '[{"global": {"name": "Academic slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#F3F0E9ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "455da12c1730", "width": 1920, "height": 760, "colors": ["#0F2340ff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1920 760\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1920\\" height=\\"760\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3f4d4951ace3", "editable": false, "left": 100, "top": 163, "transform": "", "lineHeight": 1.3, "letterSpacing": 20, "fontSize": 26, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#CFA93Fff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "7bdd0b0b147e", "editable": false, "left": 100, "top": 223, "transform": "", "lineHeight": 1.0, "letterSpacing": -2, "fontSize": 100, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#F3F0E9ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 200, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "301455f5b9d7", "width": 160, "height": 4, "colors": ["#CFA93Fff"], "left": 100, "top": 457, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 160 4\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"160\\" height=\\"4\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "2c4a76f0d4e4", "editable": false, "left": 100, "top": 495, "transform": "", "lineHeight": 1.4, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#CBD5E2ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 933, "height": 101, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "fca63e250171", "width": 717, "height": 440, "colors": ["#F3F0E91F", "#CFA93Fff"], "left": 1103, "top": 160, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 717 440\\" preserveAspectRatio=\\"none\\"><g><line x1=\\"-450\\" y1=\\"0\\" x2=\\"-10\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"8\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"26\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"44\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"62\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"80\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"98\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"116\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"134\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"152\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"170\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"188\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"206\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"224\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"242\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"260\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"278\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"296\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"314\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"332\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"350\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"368\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"386\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"404\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"422\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"440\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"458\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"476\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"494\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"512\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"530\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"548\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"566\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"584\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"602\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"620\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"638\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"656\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"674\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"692\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"710\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"728\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"746\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"764\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"782\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"800\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"818\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"836\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"854\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"872\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"890\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"908\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"926\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"944\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"962\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"980\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"998\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1016\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1034\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1052\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1070\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1088\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1106\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1124\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1142\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1160\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1178\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1196\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1214\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1232\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1250\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1268\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1286\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1304\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1322\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1340\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1358\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1376\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1394\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1412\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1430\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1448\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1466\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1484\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1502\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1520\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1538\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1556\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1574\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1592\\" y2=\\"440\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"715\\" height=\\"438\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[1]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "8bd548576bd9", "editable": false, "left": 1125, "top": 548, "transform": "", "lineHeight": 1.3, "letterSpacing": 6, "fontSize": 22, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#A8B6C8ff", "textAlign": "left", "text": "IMAGE: SCHOOL CREST OR BUILDING", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 673, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6be90075d3b3", "editable": false, "left": 100, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "PRESENTED BY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 533, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "22ae401b9e12", "editable": false, "left": 100, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "Dana Whitlock<br/>Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 533, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "cb01a56fc7cc", "width": 1, "height": 164, "colors": ["#CDC7B8ff"], "left": 693, "top": 838, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 164\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"164\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a3e61ba9fd9d", "editable": false, "left": 753, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "MEETING", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "749df15d9f22", "editable": false, "left": 753, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "Tuesday, September 15<br/>7:00 p.m., Auditorium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "0ba8a0672950", "width": 1, "height": 164, "colors": ["#CDC7B8ff"], "left": 1286, "top": 838, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1 164\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1\\" height=\\"164\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "cabffc075b32", "editable": false, "left": 1346, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 16, "fontSize": 24, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7A89ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "17ea5e2556a1", "editable": false, "left": 1346, "top": 895, "transform": "", "lineHeight": 1.35, "letterSpacing": 0, "fontSize": 34, "fontClass": {"alias": "Spectral", "id": 0, "value": "Spectral", "url": "/fonts/spectral-400.woff2"}, "fontFamily": "Spectral", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#14263Fff", "textAlign": "left", "text": "842 students<br/>Grades 6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 473, "height": 92, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', ui = {
  id: si,
  title: li,
  width: ai,
  height: di,
  pack: hi,
  brand: ci,
  data: gi
}, wi = "216", fi = "Dark slide — cover", Ii = 1920, xi = 1080, yi = "slide-themes", pi = {
  colors: {
    "46cdb4": "primary"
  }
}, mi = '[{"global": {"name": "Dark slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#0D1012ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "1647660f8581", "width": 18, "height": 18, "colors": ["#46CDB4ff"], "left": 100, "top": 97, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 18 18\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"18\\" height=\\"18\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "896b6612a775", "editable": false, "left": 136, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 25, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6626b6c17fa6", "editable": false, "left": 1320, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 25, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#46CDB4ff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 500, "height": 32, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "e926af99782a", "editable": false, "left": 100, "top": 301, "transform": "", "lineHeight": 0.95, "letterSpacing": -4, "fontSize": 112, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 962, "height": 213, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c36874bf879a", "editable": false, "left": 100, "top": 548, "transform": "", "lineHeight": 1.4, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#9AA8A8ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 962, "height": 101, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "d0012775784d", "width": 688, "height": 460, "colors": ["#E9EEEE12", "#14191Bff", "#2A3234ff"], "left": 1132, "top": 244, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 688 460\\" preserveAspectRatio=\\"none\\"><g><rect x=\\"0\\" y=\\"0\\" width=\\"688\\" height=\\"460\\" rx=\\"0\\" fill=\\"{{colors[1]}}\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"-8\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"10\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"28\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"46\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"64\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"82\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"100\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"118\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"136\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"154\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"172\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"190\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"208\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"226\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"244\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"262\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"280\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"298\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"316\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"334\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"352\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"370\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"388\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"406\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"424\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"442\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"460\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"478\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"496\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"514\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"532\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"550\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"568\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"586\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"604\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"622\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"640\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"658\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"676\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"694\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"712\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"730\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"748\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"766\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"784\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"802\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"820\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"838\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"856\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"874\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"892\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"910\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"928\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"946\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"964\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"982\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1000\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1018\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1036\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1054\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1072\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1090\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1108\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1126\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1144\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1162\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1180\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1198\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1216\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1234\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1252\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1270\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1288\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1306\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1324\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1342\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1360\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1378\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1396\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1414\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1432\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1450\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1468\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1486\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1504\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1522\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1540\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1558\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1576\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1594\\" y2=\\"460\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><rect x=\\"1\\" y=\\"1\\" width=\\"686\\" height=\\"458\\" rx=\\"0\\" fill=\\"none\\" stroke=\\"{{colors[2]}}\\" stroke-width=\\"2\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "665b7e6ebce6", "editable": false, "left": 1154, "top": 652, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 22, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "image: students, main corridor", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 644, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "7386a946b0af", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 100, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "ad2523ac877d", "width": 409, "height": 3, "colors": ["#46CDB4ff"], "left": 100, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a225395e2d36", "editable": false, "left": 128, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c7db25bdb7b5", "editable": false, "left": 128, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "4ac3ab018c0f", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 537, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "926000521e99", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 537, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "35072603868a", "editable": false, "left": 565, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "0d6ef36438ce", "editable": false, "left": 565, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "b9e31829b373", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 974, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "760953e9ac37", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 974, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "05a999631c5f", "editable": false, "left": 1002, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "786c5e5b2bb5", "editable": false, "left": 1002, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": -2, "fontSize": 52, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "df52bed58c91", "width": 409, "height": 173, "colors": ["#14191Bff"], "left": 1411, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 173\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"173\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "4b767353b917", "width": 409, "height": 3, "colors": ["#2A3234ff"], "left": 1411, "top": 827, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 409 3\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"409\\" height=\\"3\\" rx=\\"0\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "b30125d35293", "editable": false, "left": 1439, "top": 853, "transform": "", "lineHeight": 1.3, "letterSpacing": 8, "fontSize": 23, "fontClass": {"alias": "JetBrains Mono", "id": 0, "value": "JetBrains Mono", "url": "/fonts/jetbrains-mono-400-700.woff2"}, "fontFamily": "JetBrains Mono", "brandRole": "keep", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "SPEAKER", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "20d36f0362f7", "editable": false, "left": 1439, "top": 891, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E9EEEEff", "textAlign": "left", "text": "Dana Whitlock", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "77a48f2a04c8", "editable": false, "left": 1439, "top": 933, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Space Grotesk", "id": 0, "value": "Space Grotesk", "url": "/fonts/space-grotesk-400-700.woff2"}, "fontFamily": "Space Grotesk", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6F7D7Dff", "textAlign": "left", "text": "Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 353, "height": 42, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Mi = {
  id: wi,
  title: fi,
  width: Ii,
  height: xi,
  pack: yi,
  brand: pi,
  data: mi
}, bi = "221", ki = "Pastel slide — cover", Ai = 1920, vi = 1080, Si = "slide-themes", Di = {
  colors: {
    b4735a: "primary"
  }
}, Ci = '[{"global": {"name": "Pastel slide — cover", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1920, "height": 1080, "backgroundColor": "#FBF7F1ff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Text", "type": "w-text", "uuid": "04e4a8433e31", "editable": false, "left": 100, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1000, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8d875f7bec3c", "editable": false, "left": 1320, "top": 90, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#B4735Aff", "textAlign": "right", "text": "2025 / 26", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 500, "height": 34, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8b94d1841d79", "editable": false, "left": 100, "top": 250, "transform": "", "lineHeight": 1.0, "letterSpacing": 0, "fontSize": 108, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#3C4A37ff", "textAlign": "left", "text": "Annual Report to Families", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 950, "height": 216, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ed039e4d3b90", "editable": false, "left": 100, "top": 498, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#6B6459ff", "textAlign": "left", "text": "A review of the 2025–26 school year, the results behind it, and the calendar for the year ahead.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 950, "height": 105, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "f0b3bb0619d5", "width": 380, "height": 66, "colors": ["#FFFFFFff"], "left": 100, "top": 643, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 380 66\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"380\\" height=\\"66\\" rx=\\"33\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "269502587b64", "editable": false, "left": 100, "top": 660, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "center", "text": "Dana Whitlock, Principal", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 380, "height": 36, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "98d4e7d1a913", "width": 300, "height": 66, "colors": ["#FFFFFFff"], "left": 498, "top": 643, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 300 66\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"300\\" height=\\"66\\" rx=\\"33\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "2b4cf9cec585", "editable": false, "left": 498, "top": 660, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 26, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "center", "text": "Sept 15, 7:00 p.m.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 300, "height": 36, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "ccf32572268b", "width": 704, "height": 470, "colors": ["#322E290F", "#F2EDE4ff"], "left": 1116, "top": 244, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 704 470\\" preserveAspectRatio=\\"none\\"><defs><clipPath id=\\"hatch-666823b1407a\\"><rect width=\\"704\\" height=\\"470\\" rx=\\"26\\"/></clipPath></defs><g clip-path=\\"url(#hatch-666823b1407a)\\"><rect x=\\"0\\" y=\\"0\\" width=\\"704\\" height=\\"470\\" rx=\\"26\\" fill=\\"{{colors[1]}}\\"/><line x1=\\"-486\\" y1=\\"0\\" x2=\\"-16\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-468\\" y1=\\"0\\" x2=\\"2\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-450\\" y1=\\"0\\" x2=\\"20\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-432\\" y1=\\"0\\" x2=\\"38\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-414\\" y1=\\"0\\" x2=\\"56\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-396\\" y1=\\"0\\" x2=\\"74\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-378\\" y1=\\"0\\" x2=\\"92\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-360\\" y1=\\"0\\" x2=\\"110\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-342\\" y1=\\"0\\" x2=\\"128\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-324\\" y1=\\"0\\" x2=\\"146\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-306\\" y1=\\"0\\" x2=\\"164\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-288\\" y1=\\"0\\" x2=\\"182\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-270\\" y1=\\"0\\" x2=\\"200\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-252\\" y1=\\"0\\" x2=\\"218\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-234\\" y1=\\"0\\" x2=\\"236\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-216\\" y1=\\"0\\" x2=\\"254\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-198\\" y1=\\"0\\" x2=\\"272\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-180\\" y1=\\"0\\" x2=\\"290\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-162\\" y1=\\"0\\" x2=\\"308\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-144\\" y1=\\"0\\" x2=\\"326\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-126\\" y1=\\"0\\" x2=\\"344\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-108\\" y1=\\"0\\" x2=\\"362\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-90\\" y1=\\"0\\" x2=\\"380\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-72\\" y1=\\"0\\" x2=\\"398\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-54\\" y1=\\"0\\" x2=\\"416\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-36\\" y1=\\"0\\" x2=\\"434\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"-18\\" y1=\\"0\\" x2=\\"452\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"0\\" y1=\\"0\\" x2=\\"470\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"18\\" y1=\\"0\\" x2=\\"488\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"36\\" y1=\\"0\\" x2=\\"506\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"54\\" y1=\\"0\\" x2=\\"524\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"72\\" y1=\\"0\\" x2=\\"542\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"90\\" y1=\\"0\\" x2=\\"560\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"108\\" y1=\\"0\\" x2=\\"578\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"126\\" y1=\\"0\\" x2=\\"596\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"144\\" y1=\\"0\\" x2=\\"614\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"162\\" y1=\\"0\\" x2=\\"632\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"180\\" y1=\\"0\\" x2=\\"650\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"198\\" y1=\\"0\\" x2=\\"668\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"216\\" y1=\\"0\\" x2=\\"686\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"234\\" y1=\\"0\\" x2=\\"704\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"252\\" y1=\\"0\\" x2=\\"722\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"270\\" y1=\\"0\\" x2=\\"740\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"288\\" y1=\\"0\\" x2=\\"758\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"306\\" y1=\\"0\\" x2=\\"776\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"324\\" y1=\\"0\\" x2=\\"794\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"342\\" y1=\\"0\\" x2=\\"812\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"360\\" y1=\\"0\\" x2=\\"830\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"378\\" y1=\\"0\\" x2=\\"848\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"396\\" y1=\\"0\\" x2=\\"866\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"414\\" y1=\\"0\\" x2=\\"884\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"432\\" y1=\\"0\\" x2=\\"902\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"450\\" y1=\\"0\\" x2=\\"920\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"468\\" y1=\\"0\\" x2=\\"938\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"486\\" y1=\\"0\\" x2=\\"956\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"504\\" y1=\\"0\\" x2=\\"974\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"522\\" y1=\\"0\\" x2=\\"992\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"540\\" y1=\\"0\\" x2=\\"1010\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"558\\" y1=\\"0\\" x2=\\"1028\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"576\\" y1=\\"0\\" x2=\\"1046\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"594\\" y1=\\"0\\" x2=\\"1064\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"612\\" y1=\\"0\\" x2=\\"1082\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"630\\" y1=\\"0\\" x2=\\"1100\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"648\\" y1=\\"0\\" x2=\\"1118\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"666\\" y1=\\"0\\" x2=\\"1136\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"684\\" y1=\\"0\\" x2=\\"1154\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"702\\" y1=\\"0\\" x2=\\"1172\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"720\\" y1=\\"0\\" x2=\\"1190\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"738\\" y1=\\"0\\" x2=\\"1208\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"756\\" y1=\\"0\\" x2=\\"1226\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"774\\" y1=\\"0\\" x2=\\"1244\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"792\\" y1=\\"0\\" x2=\\"1262\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"810\\" y1=\\"0\\" x2=\\"1280\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"828\\" y1=\\"0\\" x2=\\"1298\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"846\\" y1=\\"0\\" x2=\\"1316\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"864\\" y1=\\"0\\" x2=\\"1334\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"882\\" y1=\\"0\\" x2=\\"1352\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"900\\" y1=\\"0\\" x2=\\"1370\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"918\\" y1=\\"0\\" x2=\\"1388\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"936\\" y1=\\"0\\" x2=\\"1406\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"954\\" y1=\\"0\\" x2=\\"1424\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"972\\" y1=\\"0\\" x2=\\"1442\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"990\\" y1=\\"0\\" x2=\\"1460\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1008\\" y1=\\"0\\" x2=\\"1478\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1026\\" y1=\\"0\\" x2=\\"1496\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1044\\" y1=\\"0\\" x2=\\"1514\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1062\\" y1=\\"0\\" x2=\\"1532\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1080\\" y1=\\"0\\" x2=\\"1550\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1098\\" y1=\\"0\\" x2=\\"1568\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1116\\" y1=\\"0\\" x2=\\"1586\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1134\\" y1=\\"0\\" x2=\\"1604\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1152\\" y1=\\"0\\" x2=\\"1622\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/><line x1=\\"1170\\" y1=\\"0\\" x2=\\"1640\\" y2=\\"470\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"9\\"/></g></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "40c2eb28ce3b", "editable": false, "left": 1140, "top": 662, "transform": "", "lineHeight": 1.3, "letterSpacing": 4, "fontSize": 22, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "image: students in the courtyard", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 656, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c3ec92264e8c", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 100, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "e38394da55b8", "editable": false, "left": 132, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "ENROLLMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "05c85dee2209", "editable": false, "left": 132, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "842", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a863c4ca1fa8", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 536, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3a64da8f9f81", "editable": false, "left": 568, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "GRADES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "71f1a2f0d1d8", "editable": false, "left": 568, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "6–8", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "b3c8244e2439", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 972, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "4f68f6948bf8", "editable": false, "left": 1004, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "STAFF", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "c18c7d20485f", "editable": false, "left": 1004, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "61", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c217faca465b", "width": 412, "height": 165, "colors": ["#FFFFFFff"], "left": 1408, "top": 835, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 412 165\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"412\\" height=\\"165\\" rx=\\"22\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "a576c27bace5", "editable": false, "left": 1440, "top": 865, "transform": "", "lineHeight": 1.3, "letterSpacing": 10, "fontSize": 24, "fontClass": {"alias": "Karla", "id": 0, "value": "Karla", "url": "/fonts/karla-400-700.woff2"}, "fontFamily": "Karla", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#8A8175ff", "textAlign": "left", "text": "ATTENDANCE", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 30, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ec838ff08760", "editable": false, "left": 1440, "top": 903, "transform": "", "lineHeight": 1.3, "letterSpacing": 0, "fontSize": 54, "fontClass": {"alias": "DM Serif Display", "id": 0, "value": "DM Serif Display", "url": "/fonts/dm-serif-display-400.woff2"}, "fontFamily": "DM Serif Display", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#667A5Fff", "textAlign": "left", "text": "94.2&#37;", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 348, "height": 70, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Ni = {
  id: bi,
  title: ki,
  width: Ai,
  height: vi,
  pack: Si,
  brand: Di,
  data: Ci
}, ji = "101", Li = "Field Day poster", zi = 1275, Bi = 1650, Zi = "school-events", Hi = {
  colors: {
    "1e3a5f": "primary",
    e1a731: "secondary"
  }
}, Wi = '[{"global": {"name": "Field Day poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#FBF7EFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "d0a7c1b0af92", "width": 1275, "height": 430, "colors": ["#1E3A5Fff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "a58df2524a47", "width": 150, "height": 150, "colors": ["#FFFFFFff"], "left": 562, "top": 60, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-trophy\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2\\" /> <path d=\\"M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2\\" /> <path d=\\"M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3\\" /> <path d=\\"M4 22h16\\" /> <path d=\\"M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z\\" /> <path d=\\"M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "3ff1abbf862b", "editable": false, "left": 87, "top": 232, "transform": "", "lineHeight": 1.2, "letterSpacing": 2, "fontSize": 140, "fontClass": {"alias": "Anton", "id": 0, "value": "Anton", "url": "/fonts/anton-400.woff2"}, "fontFamily": "Anton", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "FIELD DAY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 170, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "44460bc86875", "editable": false, "left": 137, "top": 520, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 66, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#1E3A5Fff", "textAlign": "center", "text": "Friday, May 15", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 90, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "47dfcdca16a4", "width": 300, "height": 12, "colors": ["#E1A731ff"], "left": 487, "top": 650, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 240 12\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"240\\" height=\\"12\\" rx=\\"6\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "89bd8798e6ba", "editable": false, "left": 137, "top": 712, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 44, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "9:00 AM – 2:00 PM  ·  Lower Field", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 60, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "1bdcf8a4c40f", "width": 1001, "height": 460, "colors": ["#1E3A5F12"], "left": 137, "top": 870, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1001 460\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1001\\" height=\\"460\\" rx=\\"32\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Shape", "type": "w-svg", "uuid": "aaab751b7a2b", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 930, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-users\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\\" /> <path d=\\"M16 3.128a4 4 0 0 1 0 7.744\\" /> <path d=\\"M22 21v-2a4 4 0 0 0-3-3.87\\" /> <circle cx=\\"9\\" cy=\\"7\\" r=\\"4\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "697284ddd120", "editable": false, "left": 311, "top": 940.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Grades K–5, all four houses", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a826760bcbf7", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 1064, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-utensils\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\\" /> <path d=\\"M7 2v20\\" /> <path d=\\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "486d0871160e", "editable": false, "left": 311, "top": 1074.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Lunch served on the field", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "a3af6a4a757d", "width": 72, "height": 72, "colors": ["#1E3A5Fff"], "left": 207, "top": 1198, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-sun\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <circle cx=\\"12\\" cy=\\"12\\" r=\\"4\\" /> <path d=\\"M12 2v2\\" /> <path d=\\"M12 20v2\\" /> <path d=\\"m4.93 4.93 1.41 1.41\\" /> <path d=\\"m17.66 17.66 1.41 1.41\\" /> <path d=\\"M2 12h2\\" /> <path d=\\"M20 12h2\\" /> <path d=\\"m6.34 17.66-1.41 1.41\\" /> <path d=\\"m19.07 4.93-1.41 1.41\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "227f1f7245cd", "editable": false, "left": 311, "top": 1208.8, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Sunscreen and a water bottle", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 787, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "01ab66227355", "editable": false, "left": 137, "top": 1400, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Parent volunteers welcome — sign up at the front office.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 52, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "af254441f48f", "width": 1275, "height": 160, "colors": ["#1E3A5Fff"], "left": 0, "top": 1490, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "02d09f9804bb", "editable": false, "left": 87, "top": 1548, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 56, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 72, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Ti = {
  id: ji,
  title: Li,
  width: zi,
  height: Bi,
  pack: Zi,
  brand: Hi,
  data: Wi
}, Gi = "104", Ei = "Book Fair poster", Ri = 1275, Pi = 1650, Ui = "school-events", Yi = {
  colors: {
    c0392b: "primary",
    e1a731: "secondary",
    "1e3a5f": "accent"
  }
}, Ji = '[{"global": {"name": "Book Fair poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#C0392Bff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "60227a2cc3af", "width": 700, "height": 700, "colors": ["#FFFFFF1C"], "left": 287, "top": 600, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-book-open\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M12 5v16\\" /> <path d=\\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "28b3dd685d0e", "editable": false, "left": 87, "top": 250, "transform": "", "lineHeight": 1.05, "letterSpacing": 4, "fontSize": 210, "fontClass": {"alias": "Anton", "id": 0, "value": "Anton", "url": "/fonts/anton-400.woff2"}, "fontFamily": "Anton", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "BOOK<br/>FAIR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 520, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "cd75a67ea679", "width": 200, "height": 14, "colors": ["#E1A731ff"], "left": 537, "top": 850, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 240 12\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"240\\" height=\\"12\\" rx=\\"6\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "b1c1510c55bf", "editable": false, "left": 137, "top": 930, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 72, "fontClass": {"alias": "Archivo", "id": 0, "value": "Archivo", "url": "/fonts/archivo-400-700.woff2"}, "fontFamily": "Archivo", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#E1A731ff", "textAlign": "center", "text": "November 3–7", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4d5baac3ff9b", "editable": false, "left": 137, "top": 1070, "transform": "", "lineHeight": 1.5, "letterSpacing": 0, "fontSize": 42, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "Library  ·  Open 8:00 AM – 4:00 PM<br/>Family night Thursday until 7:00 PM", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 130, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "e3d8faa86180", "width": 801, "height": 120, "colors": ["#E1A731ff"], "left": 237, "top": 1290, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 801 120\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"801\\" height=\\"120\\" rx=\\"60\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "91410f9fe161", "editable": false, "left": 257, "top": 1324, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#1E3A5Fff", "textAlign": "center", "text": "EVERY BOOK BUILDS OUR LIBRARY", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 761, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4ad19534396f", "editable": false, "left": 87, "top": 1500, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 57, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', Fi = {
  id: Gi,
  title: Ei,
  width: Ri,
  height: Pi,
  pack: Ui,
  brand: Yi,
  data: Ji
}, Qi = "107", Oi = "Science Fair poster", Vi = 1275, Xi = 1650, $i = "school-events", Ki = {
  colors: {
    "2f6b3a": "primary"
  }
}, _i = '[{"global": {"name": "Science Fair poster", "type": "page", "uuid": "-1", "left": 0, "top": 0, "width": 1275, "height": 1650, "backgroundColor": "#FBF7EFff", "backgroundImage": "", "opacity": 1, "tag": 0, "setting": [], "record": {}}, "layers": [{"name": "Shape", "type": "w-svg", "uuid": "9b455bacce70", "width": 1275, "height": 340, "colors": ["#2F6B3Aff"], "left": 0, "top": 0, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c6c3487f7ae3", "editable": false, "left": 87, "top": 110, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 112, "fontClass": {"alias": "Oswald", "id": 0, "value": "Oswald", "url": "/fonts/oswald-400-700.woff2"}, "fontFamily": "Oswald", "brandRole": "heading", "fontWeight": 700, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "SCIENCE FAIR", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 140, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "4be4cf87efcb", "editable": false, "left": 137, "top": 420, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 46, "fontClass": {"alias": "Merriweather", "id": 0, "value": "Merriweather", "url": "/fonts/merriweather-400-700.woff2"}, "fontFamily": "Merriweather", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#2F6B3Aff", "textAlign": "center", "text": "Ask a question. Test it. Show us.", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 64, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "74e3f5132434", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 259, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-flask-conical\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\\" /> <path d=\\"M6.453 15h11.094\\" /> <path d=\\"M8.5 2h7\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "61aaa287ba0d", "editable": false, "left": 137, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "EXPERIMENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "8258436f5bc0", "editable": false, "left": 137, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Any question<br/>you can test", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "c4c69842664b", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 593, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-clipboard-list\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <rect width=\\"8\\" height=\\"4\\" x=\\"8\\" y=\\"2\\" rx=\\"1\\" ry=\\"1\\" /> <path d=\\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\\" /> <path d=\\"M12 11h4\\" /> <path d=\\"M12 16h4\\" /> <path d=\\"M8 11h.01\\" /> <path d=\\"M8 16h.01\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "f35799a4dc4d", "editable": false, "left": 471, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "RECORD", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "500e2a3f98df", "editable": false, "left": 471, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Notes, photos,<br/>the numbers", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "0c3ff6d712ea", "width": 90, "height": 90, "colors": ["#2F6B3Aff"], "left": 926, "top": 560, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<!-- @license lucide-static v1.38.0 - ISC --> <svg class=\\"lucide lucide-medal\\" xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"{{colors[0]}}\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" > <path d=\\"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15\\" /> <path d=\\"M11 12 5.12 2.2\\" /> <path d=\\"m13 12 5.88-9.8\\" /> <path d=\\"M8 7h8\\" /> <circle cx=\\"12\\" cy=\\"17\\" r=\\"5\\" /> <path d=\\"M12 18v-2h-.5\\" /> </svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "c8159d4f307b", "editable": false, "left": 804, "top": 690, "transform": "", "lineHeight": 1.2, "letterSpacing": 3, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "center", "text": "PRESENT", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ff194ddc691a", "editable": false, "left": 804, "top": 760, "transform": "", "lineHeight": 1.45, "letterSpacing": 0, "fontSize": 32, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Trifold board,<br/>three minutes", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 334, "height": 96, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "46a017ccba92", "width": 1001, "height": 360, "colors": ["#FFFFFFff"], "left": 137, "top": 900, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1001 360\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"1001\\" height=\\"360\\" rx=\\"32\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "9594305eeadf", "editable": false, "left": 197, "top": 945, "transform": "", "lineHeight": 1.2, "letterSpacing": 4, "fontSize": 44, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#2F6B3Aff", "textAlign": "left", "text": "KEY DATES", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 56, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "3c3a10d20a02", "editable": false, "left": 197, "top": 1025, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Sign up by Friday, February 6", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "6ec1511d59a0", "editable": false, "left": 197, "top": 1095, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Boards due Monday, March 2 · 8:00 AM", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "ed4823c7416f", "editable": false, "left": 197, "top": 1165, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 40, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#22252Aff", "textAlign": "left", "text": "Judging Tuesday, March 3 · gymnasium", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 881, "height": 54, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Text", "type": "w-text", "uuid": "d27a9e0ee47a", "editable": false, "left": 137, "top": 1390, "transform": "", "lineHeight": 1.2, "letterSpacing": 0, "fontSize": 36, "fontClass": {"alias": "Inter", "id": 0, "value": "Inter", "url": "/fonts/inter-400-700.woff2"}, "fontFamily": "Inter", "brandRole": "body", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#5A6472ff", "textAlign": "center", "text": "Rules and forms: {{school.website}}/sciencefair", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1001, "height": 52, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}, {"name": "Shape", "type": "w-svg", "uuid": "257d29ece8ac", "width": 1275, "height": 130, "colors": ["#2F6B3Aff"], "left": 0, "top": 1520, "transform": "", "radius": 0, "opacity": 1, "parent": "-1", "svgUrl": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 200 200\\" preserveAspectRatio=\\"none\\"><rect x=\\"0\\" y=\\"0\\" width=\\"200\\" height=\\"200\\" fill=\\"{{colors[0]}}\\"/></svg>", "setting": [], "record": {"width": 0, "height": 0, "minWidth": 10, "minHeight": 10}}, {"name": "Text", "type": "w-text", "uuid": "7ad974257e8e", "editable": false, "left": 87, "top": 1560, "transform": "", "lineHeight": 1.2, "letterSpacing": 6, "fontSize": 46, "fontClass": {"alias": "Bebas Neue", "id": 0, "value": "Bebas Neue", "url": "/fonts/bebas-neue-400.woff2"}, "fontFamily": "Bebas Neue", "brandRole": "heading", "fontWeight": 400, "fontStyle": "normal", "writingMode": "horizontal-tb", "textDecoration": "none", "color": "#FFFFFFff", "textAlign": "center", "text": "{{school.name|upper}}", "opacity": 1, "backgroundColor": "", "parent": "-1", "record": {"width": 0, "height": 0, "minWidth": 0, "minHeight": 0, "dir": "horizontal"}, "width": 1101, "height": 59, "rotate": 0, "imgUrl": "", "filter": {"contrast": 0, "sharpness": 0, "hueRotate": 0, "saturate": 0, "brightness": 0, "gaussianBlur": 0, "temperature": 0, "tint": 0}}]}]', qi = {
  id: Qi,
  title: Oi,
  width: Vi,
  height: Xi,
  pack: $i,
  brand: Ki,
  data: _i
}, to = ["editorial", "swiss", "academic", "dark", "pastel"], eo = ["navy", "crimson", "forest"];
function io(t) {
  const e = JSON.parse(t.data), i = Array.isArray(e) ? e[0] : { global: e.page, layers: e.widgets };
  return { background: String(i.global?.backgroundColor || "#ffffffff"), layers: i.layers || [] };
}
const E = (t) => {
  const e = String(t || "");
  return /^#[0-9a-f]{6}(ff)?$/i.test(e) ? `${e.slice(0, 7).toLowerCase()}ff` : null;
};
function rt(t, e) {
  const i = t?.fontClass;
  return i?.value ? { alias: i.alias || i.value, id: Number(i.id) || 0, url: i.url || "", value: i.value } : e;
}
const nt = { alias: "Inter", id: 1, url: "/fonts/inter-400-700.woff2", value: "Inter" };
function Dt(t, e) {
  for (const [i, o] of Object.entries(t.brand?.colors || {}))
    if (String(o).toLowerCase() === e)
      return E(`#${String(i).replace(/^#/, "")}`);
  return null;
}
function Ft(t, e) {
  const { background: i, layers: o } = io(e), r = E(i) || "#ffffffff", s = Dt(e, "primary") || "#1e3a5fff", n = Dt(e, "secondary") || s, a = o.filter((w) => w.type === "w-text"), l = (w) => S(w, r), d = [...new Set(a.map((w) => E(w.color)).filter((w) => !!w))].filter((w) => w !== s && w !== n).sort((w, y) => l(y) - l(w)), h = d[0] || "#111111ff", c = d.find((w) => w !== h && l(w) >= 3) || d[1] || h, g = o.filter((w) => w.type === "w-svg").flatMap((w) => w.colors || []).map(E).filter((w) => !!w && l(w) > 1.08).sort((w, y) => l(w) - l(y)), u = [...a].sort((w, y) => Number(y.fontSize) - Number(w.fontSize))[0], I = a.filter((w) => w.brandRole === "body").sort((w, y) => y.width - w.width)[0], x = a.find((w) => Number(w.fontSize) <= 28 && Number(w.letterSpacing) >= 6);
  return {
    key: t,
    paper: r,
    ink: h,
    muted: c,
    accent: s,
    accentSoft: n,
    rule: g[0] || c,
    display: rt(u, nt),
    body: rt(I, nt),
    eyebrow: rt(x, nt),
    displayWeight: Number(u?.fontWeight) || 400,
    displayLineHeight: Number(u?.lineHeight) || 1.05,
    displayTracking: Number(u?.letterSpacing) || 0,
    eyebrowTracking: Number(x?.letterSpacing) || 8
  };
}
const oo = {
  editorial: Ke,
  swiss: ni,
  academic: ui,
  dark: Mi,
  pastel: Ni
}, ro = {
  navy: Ti,
  crimson: Fi,
  forest: qi
}, st = /* @__PURE__ */ new Map(), lt = /* @__PURE__ */ new Map();
function Qt(t) {
  const e = to.includes(String(t)) ? t : "editorial";
  return st.has(e) || st.set(e, Ft(e, oo[e])), st.get(e);
}
function Ot(t) {
  const e = eo.includes(String(t)) ? t : "navy";
  return lt.has(e) || lt.set(e, Ft(e, ro[e])), lt.get(e);
}
const no = /* @__PURE__ */ new Set([..."iljItf.,;:'\"|!`()[]{}-/\\ "]), so = /* @__PURE__ */ new Set([..."mwMW@%"]), lo = /* @__PURE__ */ new Set([..."ABCDEFGHKNOPQRSUVXYZ0123456789$&#"]);
function ao(t) {
  return t === " " ? 0.28 : t === "i" || t === "l" || t === "j" || t === "." || t === "," ? 0.25 : no.has(t) ? 0.31 : so.has(t) ? 0.86 : lo.has(t) ? 0.65 : 0.53;
}
const ho = {
  Anton: 0.78,
  "Bebas Neue": 0.72,
  Oswald: 0.8,
  Archivo: 0.98,
  Inter: 1,
  Roboto: 0.98,
  "Open Sans": 1.01,
  Lato: 0.97,
  Montserrat: 1.08,
  Poppins: 1.06,
  Nunito: 1,
  Quicksand: 1.02,
  Fredoka: 1.03,
  Merriweather: 1.09,
  "Playfair Display": 1.02,
  Lora: 1.02,
  "Libre Baskerville": 1.12,
  "Source Serif 4": 1,
  Spectral: 1,
  "DM Serif Display": 1.02,
  "Space Grotesk": 1,
  Karla: 0.96,
  Caveat: 0.72,
  Pacifico: 1.05,
  "IBM Plex Mono": 1.15,
  "JetBrains Mono": 1.15
}, co = 1.03;
function Vt(t, e) {
  const i = e.fontFamily && ho[e.fontFamily] || 1;
  let o = 0;
  for (const s of t)
    o += ao(s);
  const r = e.bold ? 1.03 : 1;
  return (o * e.fontSize * i * r + (e.letterSpacing || 0) * t.length) * co;
}
function Ct(t, e, i) {
  const o = [];
  for (const r of String(t).split(`
`)) {
    const s = r.split(/\s+/).filter(Boolean);
    if (s.length === 0) {
      o.push("");
      continue;
    }
    let n = "";
    for (const a of s) {
      const l = n ? `${n} ${a}` : a;
      n && Vt(l, i) > e ? (o.push(n), n = a) : n = l;
    }
    o.push(n);
  }
  return o;
}
function Nt(t, e, i) {
  return Math.max(1, Math.floor(t / (e * i) + 0.08));
}
function Xt(t, e, i) {
  const o = String(t || "").trim();
  if (!o)
    return { text: "", fontSize: e.fontSize, lines: [], truncated: !1 };
  const r = Math.max(6, Math.min(i.minFontSize, e.fontSize));
  for (let l = e.fontSize; l >= r; l -= 1) {
    const d = { ...e, fontSize: l, letterSpacing: (e.letterSpacing || 0) * (l / e.fontSize) }, h = Ct(o, i.width, d), c = Math.min(Nt(i.height, l, e.lineHeight), i.maxLines || Number.MAX_SAFE_INTEGER);
    if (h.length <= c)
      return { text: o, fontSize: l, lines: h, truncated: !1 };
  }
  const s = { ...e, fontSize: r, letterSpacing: (e.letterSpacing || 0) * (r / e.fontSize) }, n = Math.min(Nt(i.height, r, e.lineHeight), i.maxLines || Number.MAX_SAFE_INTEGER), a = Ct(o, i.width, s).slice(0, n);
  for (; a.length && Vt(`${a[a.length - 1]}…`, s) > i.width; ) {
    const l = a[a.length - 1].split(" ");
    if (l.pop(), l.length === 0) {
      a.pop();
      continue;
    }
    a[a.length - 1] = l.join(" ");
  }
  return a.length === 0 ? { text: "…", fontSize: r, lines: ["…"], truncated: !0 } : (a[a.length - 1] = `${a[a.length - 1].replace(/[\s,;:.]+$/, "")}…`, { text: a.join(" "), fontSize: r, lines: a, truncated: !0 });
}
function $t(t, e) {
  return Math.ceil(t.lines.length * t.fontSize * e);
}
const Kt = /\{\{\s*([^{}\n]+?)\s*\}\}/g;
function j(t) {
  return t.trim().toLowerCase();
}
function go(t) {
  const e = /* @__PURE__ */ new Map();
  for (const [i, o] of Object.entries(t))
    o !== void 0 && e.set(j(i), o);
  return (i) => e.get(j(i));
}
const uo = /^(address|blockquote|div|dl|dd|dt|h[1-6]|li|ol|p|pre|table|td|th|tr|ul)$/, wo = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " "
};
function O(t) {
  return t.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (e, i) => {
    if (i[0] === "#") {
      const r = i[1] === "x" || i[1] === "X" ? parseInt(i.slice(2), 16) : parseInt(i.slice(1), 10);
      return Number.isFinite(r) && r > 0 ? String.fromCodePoint(r) : e;
    }
    return wo[i.toLowerCase()] ?? e;
  });
}
function yt(t) {
  if (!t)
    return "";
  const e = t.replace(/<br\s*\/?>/gi, `
`).replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (i, o) => uo.test(String(o).toLowerCase()) ? `
` : "");
  return O(e).replace(/\n{3,}/g, `

`).replace(/^\n+|\n+$/g, "");
}
function fo(t) {
  return !t || !t.includes("{{") ? !1 : yt(t).search(Kt) !== -1;
}
function _t(t) {
  if (!t || !t.includes("{{"))
    return [];
  const e = [], i = /* @__PURE__ */ new Set();
  for (const o of yt(t).matchAll(Kt)) {
    const r = o[1].trim(), s = j(r);
    i.has(s) || (i.add(s), e.push(r));
  }
  return e;
}
function qt(t, e) {
  return !t || !t.includes("{{") ? t ?? "" : t.replace(/\{\{([^{}]*?)\}\}/g, (i, o) => {
    const r = O(String(o).replace(/<[^>]*>/g, "")).trim();
    if (!r || /\n/.test(r))
      return i;
    const s = e(r);
    return s === void 0 ? i : te(s);
  });
}
function te(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Io(t) {
  return t.type === "w-text" && typeof t.text == "string";
}
function xo(t) {
  const e = [], i = /* @__PURE__ */ new Set();
  for (const o of t)
    if (Io(o))
      for (const r of _t(o.text)) {
        const s = j(r);
        i.has(s) || (i.add(s), e.push(r));
      }
  return e;
}
function V() {
  let t = "";
  for (; t.length < 12; )
    t += Math.floor(Math.random() * 4294967296).toString(16);
  return t.slice(0, 12);
}
function pt(t) {
  return {
    name: "Text",
    type: "w-text",
    uuid: V(),
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
function b(t, e, i, o, r, s = 0) {
  const n = Math.max(1, Math.round(i)), a = Math.max(1, Math.round(o));
  return {
    name: "Shape",
    type: "w-svg",
    uuid: V(),
    width: n,
    height: a,
    colors: [r],
    left: Math.round(t),
    top: Math.round(e),
    transform: "",
    radius: 0,
    opacity: 1,
    parent: "-1",
    svgUrl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${a}" preserveAspectRatio="none"><rect x="0" y="0" width="${n}" height="${a}" rx="${s}" fill="{{colors[0]}}"/></svg>`,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 }
  };
}
function yo(t, e, i, o, r) {
  const s = i / o, n = r.width && r.height ? r.width / r.height : s, a = n > s ? n / s : 1, l = n < s ? s / n : 1;
  return {
    name: "Image",
    type: "w-image",
    uuid: V(),
    width: Math.round(i),
    height: Math.round(o),
    left: Math.round(t),
    top: Math.round(e),
    zoom: a,
    zoomY: l,
    transform: ` scale(${a}, ${l}) translate(0px, 0px)`,
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
    sliceData: { ratio: 0, left: 0 }
  };
}
function ee(t, e, i, o, r) {
  const s = {
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
  return r && r.trim() && (s.notes = r.trim()), s;
}
function X(t) {
  return te(t).split(`
`).join("<br/>");
}
const po = [
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
  { id: 26, oid: 0, value: "JetBrains Mono", alias: "JetBrains Mono", kind: "mono", url: "/fonts/jetbrains-mono-400-700.woff2", preview: "" }
], mo = 8, ie = ["name", "shortName", "tagline", "address", "phone", "email", "website"], oe = [
  { field: "school.name", key: "name", label: "School name" },
  { field: "school.short_name", key: "shortName", label: "Short name" },
  { field: "school.tagline", key: "tagline", label: "Tagline" },
  { field: "school.address", key: "address", label: "Address" },
  { field: "school.phone", key: "phone", label: "Phone" },
  { field: "school.email", key: "email", label: "Email" },
  { field: "school.website", key: "website", label: "Website" }
], Mo = {
  name: "Springfield Elementary",
  shortName: "Springfield",
  tagline: "Learning together",
  address: "100 School Street, Springfield",
  phone: "(555) 010-2200",
  email: "office@springfield.k12.us",
  website: "springfield.k12.us"
};
function bo() {
  return { name: "", shortName: "", tagline: "", address: "", phone: "", email: "", website: "", colors: [], fonts: {} };
}
function ko(t) {
  return ie.some((e) => (t[e] || "").trim() !== "");
}
function Ao(t) {
  const e = String(t || "").trim().replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]+$/.test(e) ? e.length === 3 ? `#${e[0]}${e[0]}${e[1]}${e[1]}${e[2]}${e[2]}ff` : e.length === 6 ? `#${e}ff` : e.length === 8 ? `#${e}` : null : null;
}
function J(t) {
  return t ? po.find((e) => e.id === t) : void 0;
}
function vo(t, e) {
  switch (j(e)) {
    case "upper":
      return t.toUpperCase();
    case "lower":
      return t.toLowerCase();
    default:
      return t;
  }
}
function re(t) {
  const e = ko(t) ? t : Mo, i = {};
  for (const { field: r, key: s } of oe) {
    const n = (e[s] || "").trim();
    i[r] = n || void 0;
  }
  const o = go(i);
  return (r) => {
    const [s, ...n] = r.split("|"), a = o(s);
    if (a !== void 0)
      return n.reduce(vo, a);
  };
}
function ne(t) {
  const e = j(t.split("|")[0]);
  return oe.some((i) => i.field === e);
}
function se(t) {
  const e = bo();
  if (!t || typeof t != "object")
    return e;
  for (const s of ie) {
    const n = t[s];
    e[s] = typeof n == "string" ? n : "";
  }
  const i = Array.isArray(t.colors) ? t.colors : [];
  for (const s of i) {
    const n = Ao(String(s));
    n && !e.colors.includes(n) && e.colors.length < mo && e.colors.push(n);
  }
  const o = t.fonts && typeof t.fonts == "object" ? t.fonts : {};
  J(o.heading) && (e.fonts.heading = o.heading), J(o.body) && (e.fonts.body = o.body);
  const r = t.logo;
  return r && typeof r.url == "string" && r.url && (e.logo = { url: r.url, width: Number(r.width) || 0, height: Number(r.height) || 0 }), e;
}
const So = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i;
function Z(t) {
  const e = So.exec((t || "").trim());
  return e ? { rgb: e[1].toLowerCase(), alpha: (e[2] || "ff").toLowerCase() } : null;
}
function Do(t, e, i) {
  const o = (r) => {
    const s = Z(r);
    return !s || s.rgb !== e.rgb ? r : s.alpha === e.alpha ? `#${i.rgb}${i.alpha}` : `#${i.rgb}${s.alpha}`;
  };
  return t.map((r) => {
    const s = { ...r };
    if (s.filling) {
      const n = { ...s.filling }, a = n.gradient?.stops;
      a && (n.gradient = {
        ...n.gradient,
        stops: a.map((d) => ({ ...d, color: o(d.color) }))
      });
      const l = n.imageContent?.pattern;
      if (l?.colors) {
        const d = l.colors.map((h) => o(h));
        n.imageContent = { ...n.imageContent, pattern: { ...l, colors: d } }, n.color = d[0];
      } else
        n.color = o(n.color);
      s.filling = n;
    }
    return s.stroke && (s.stroke = { ...s.stroke, color: o(s.stroke.color) }), s.shadow && (s.shadow = { ...s.shadow, color: o(s.shadow.color) }), s;
  });
}
function le(t, e, i) {
  const o = Z(e), r = Z(i);
  return !o || !r || o.alpha === "00" || o.rgb === r.rgb && o.alpha === r.alpha ? t : Do(t, o, r);
}
function Co(t, e) {
  const i = Array.isArray(t) ? t : [], o = Z(e), r = o && o.alpha !== "00" ? o.rgb : null, s = /* @__PURE__ */ new Map(), n = (a) => {
    const l = Z(a);
    if (!l || l.alpha === "00" || l.rgb === r)
      return;
    const d = s.get(l.rgb);
    (!d || parseInt(l.alpha, 16) > parseInt(d, 16)) && s.set(l.rgb, l.alpha);
  };
  for (const a of [...i].reverse()) {
    const l = a.filling;
    if (l?.enable) {
      const d = Number(l.type);
      if (d === 2)
        for (const h of l.gradient?.stops || [])
          n(h.color);
      else if (d === 1)
        for (const h of l.imageContent?.pattern?.colors || [])
          n(h);
      else
        n(l.color);
    }
    a.stroke?.enable && n(a.stroke.color), a.shadow?.enable && n(a.shadow.color);
  }
  return [...s].map(([a, l]) => ({ rgb: a, alpha: l, value: `#${a}${l}` }));
}
const No = (t, e, i) => {
  let o = Math.round(t).toString(16), r = Math.round(e).toString(16), s = Math.round(i).toString(16);
  return o.length === 1 && (o = "0" + o), r.length === 1 && (r = "0" + r), s.length === 1 && (s = "0" + s), "#" + o + r + s;
}, jo = (t, e, i, o = 1) => {
  const r = No(t, e, i);
  let s = Math.round(o * 255).toString(16);
  return s.length === 1 && (s = "0" + s), r + s;
}, Lo = "circle at 50% 50%", zo = (t) => /^(linear|radial)-gradient\(/.test(t?.trim() || "");
function Bo(t, e, i) {
  const o = i.map((r) => `${r.color} ${r.offset * 100}%`).join(",");
  return t === "radial" ? `radial-gradient(${Lo}, ${o})` : `linear-gradient(${e}deg, ${o})`;
}
function Zo(t) {
  const e = [];
  let i = 0, o = 0;
  for (let r = 0; r < t.length; r += 1) {
    const s = t[r];
    s === "(" ? i += 1 : s === ")" ? i -= 1 : s === "," && i === 0 && (e.push(t.slice(o, r)), o = r + 1);
  }
  return e.push(t.slice(o)), e.map((r) => r.trim()).filter(Boolean);
}
function Ho(t) {
  if (t.startsWith("#"))
    return t.length === 7 ? t + "ff" : t;
  const [e = 0, i = 0, o = 0, r = 1] = (t.match(/[\d.]+/g) || []).map(Number);
  return jo(e, i, o, r);
}
function at(t) {
  const e = /^(linear|radial)-gradient\((.*)\)\s*$/s.exec(t?.trim() || "");
  if (!e)
    return null;
  const i = e[1], o = Zo(e[2]);
  let r = 180;
  const s = o[0] || "";
  if (/^(-?[\d.]+deg|to\s|circle|ellipse|at\s|closest|farthest)/.test(s)) {
    o.shift();
    const a = /(-?[\d.]+)deg/.exec(s);
    a && (r = Number(a[1]));
  }
  const n = [];
  return o.forEach((a, l) => {
    const d = /\s(-?[\d.]+)%\s*$/.exec(a), h = d ? a.slice(0, d.index) : a, c = d ? Number(d[1]) / 100 : l / Math.max(1, o.length - 1);
    n.push({ color: Ho(h.trim()), offset: c });
  }), n.length ? { type: i, angle: r, stops: n } : null;
}
const $ = /* @__PURE__ */ new Set(["w-rect", "w-ellipse", "w-polygon", "w-path"]);
function jt(t) {
  return t.type === "w-text" && typeof t.text == "string";
}
function Wo(t) {
  return Math.round(Math.min(t.width, t.height) * 0.045);
}
function ae(t) {
  const e = t.fontWeight;
  return e === "bold" || e === "bolder" || Number(e) >= 600;
}
function To(t) {
  const { id: e, oid: i, value: o, url: r, alias: s, preview: n } = t;
  return { id: e, oid: i, value: o, url: r, alias: s, preview: n };
}
function Go(t, e) {
  return t.fontClass?.value === e.value ? !1 : (t.fontClass = To(e), t.fontFamily = e.value, !0);
}
function m(t) {
  if (typeof t != "string")
    return null;
  const e = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(t.trim());
  return e ? { rgb: e[1].toLowerCase(), alpha: (e[2] || "ff").toLowerCase() } : null;
}
function K(t) {
  const e = parseInt(t.slice(0, 2), 16), i = parseInt(t.slice(2, 4), 16), o = parseInt(t.slice(4, 6), 16), r = Math.max(e, i, o), s = Math.min(e, i, o), n = (r + s) / 2 / 255;
  return r - s < 28 || n > 0.94 || n < 0.1;
}
function C(t, e, i) {
  const o = e();
  if (typeof o != "string" || !zo(o))
    return [{ kind: t, read: e, write: i }];
  const r = at(o);
  return r ? r.stops.map((s, n) => ({
    kind: t,
    read: () => at(String(e() ?? ""))?.stops[n]?.color,
    // Re-read rather than closed over, so two stops of the same gradient can
    // both be repainted in one pass without the second undoing the first.
    write: (a) => {
      const l = at(String(e() ?? ""));
      if (!l)
        return;
      const d = l.stops.map((h, c) => c === n ? { ...h, color: a } : h);
      i(Bo(l.type, l.angle, d));
    }
  })) : [];
}
function Eo(t) {
  return Co(t.textEffects, t.color).map((e) => ({
    kind: "layer",
    read: () => e.value,
    write: (i) => {
      t.textEffects = le(JSON.parse(JSON.stringify(t.textEffects)), e.value, i);
    }
  }));
}
function de(t) {
  const e = [];
  for (const i of t) {
    const o = i.global;
    o.backgroundImage || (o.backgroundGradient ? e.push(
      ...C(
        "page",
        () => o.backgroundGradient,
        (r) => o.backgroundGradient = r
      )
    ) : e.push(
      ...C(
        "page",
        () => o.backgroundColor,
        (r) => o.backgroundColor = r
      )
    ));
    for (const r of i.layers)
      r.type === "w-text" ? (e.push(
        ...C(
          "layer",
          () => r.color,
          (s) => L(r, s)
        )
      ), e.push(...Eo(r))) : $.has(r.type) ? e.push(
        ...C(
          "layer",
          () => r.color,
          (s) => r.color = s
        )
      ) : r.type === "w-svg" && Array.isArray(r.colors) && r.colors.forEach((s, n) => {
        e.push(
          ...C(
            "layer",
            () => r.colors[n],
            (a) => {
              const l = r.colors.slice();
              l[n] = a, r.colors = l;
            }
          )
        );
      }), Number(r.borderWidth) > 0 && r.borderColor && e.push(
        ...C(
          "layer",
          () => r.borderColor,
          (s) => r.borderColor = s
        )
      );
  }
  return e;
}
function L(t, e) {
  const i = t.textEffects;
  Array.isArray(i) && i.length && (t.textEffects = le(JSON.parse(JSON.stringify(i)), t.color, e)), t.color = e;
}
function Ro(t) {
  const e = /* @__PURE__ */ new Map();
  for (const i of de(t)) {
    const o = m(i.read());
    !o || K(o.rgb) || e.set(o.rgb, (e.get(o.rgb) || 0) + 1);
  }
  return [...e.entries()].sort((i, o) => o[1] - i[1]).map(([i]) => i);
}
const ut = /* @__PURE__ */ new Set([...$, "w-svg"]);
function z(t) {
  const e = Number(t.left) || 0, i = Number(t.top) || 0;
  return { left: e, top: i, right: e + (Number(t.width) || 0), bottom: i + (Number(t.height) || 0) };
}
function Po(t, e, i) {
  return e >= t.left && e <= t.right && i >= t.top && i <= t.bottom;
}
function Uo(t, e) {
  return t.left <= e.left && t.top <= e.top && t.right >= e.right && t.bottom >= e.bottom;
}
function Yo(t) {
  const e = /* @__PURE__ */ new Map();
  return t.forEach((i, o) => e.set(i.uuid, o)), t.map((i, o) => {
    const r = i.parent ? e.get(i.parent) : void 0;
    return [r === void 0 ? o : r, o];
  });
}
function F(t, e) {
  return t[0] !== e[0] ? t[0] > e[0] : t[1] > e[1];
}
function wt(t) {
  if ($.has(t.type))
    return t.color;
  if (t.type === "w-svg")
    return Array.isArray(t.colors) ? t.colors[0] : void 0;
}
function he(t, e, i, o) {
  const r = z(e[t]), s = (r.left + r.right) / 2, n = (r.top + r.bottom) / 2;
  let a = null, l = null;
  for (let h = 0; h < e.length; h++) {
    const c = e[h];
    h === t || c.hidden || c.isContainer || F(i[t], i[h]) && (l && !F(i[h], l) || Po(z(c), s, n) && (a = c, l = i[h]));
  }
  if (!a)
    return o;
  if (!ut.has(a.type))
    return null;
  const d = m(wt(a));
  return d ? d.alpha === "00" ? o : o ? { color: N(`#${d.rgb}${d.alpha}`, o.color), rgb: d.rgb, uuid: a.uuid, bounds: z(a) } : null : null;
}
function Jo(t) {
  if (t.backgroundImage || t.backgroundGradient)
    return null;
  const e = m(t.backgroundColor);
  if (!e)
    return null;
  const i = { left: 0, top: 0, right: Number(t.width) || 0, bottom: Number(t.height) || 0 };
  return { color: N(`#${e.rgb}${e.alpha}`, P), rgb: e.rgb, uuid: "", bounds: i };
}
const Fo = 0.5;
function Qo(t) {
  let e = null, i = Fo;
  for (const o of t) {
    if (o.type !== "w-text")
      continue;
    const r = m(o.color);
    if (!r || !K(r.rgb))
      continue;
    const s = Y(`#${r.rgb}`);
    s < i && (e = `#${r.rgb}ff`, i = s);
  }
  return e ?? He;
}
function ce() {
  return { adjusted: 0, swapped: 0, unreadable: 0, marks: 0, marksSwapped: 0 };
}
function Oo(t, e, i) {
  const o = ce(), r = /* @__PURE__ */ new Set();
  for (const c of i.colors) {
    const g = m(c);
    g && r.add(g.rgb);
  }
  if (!r.size)
    return o;
  const s = Qo(t), n = Yo(t), a = Jo(e), l = t.map((c, g) => c.type === "w-text" && !c.hidden ? he(g, t, n, a) : null), d = /* @__PURE__ */ new Set();
  for (const c of l)
    c?.uuid && d.add(c.uuid);
  for (let c = 0; c < t.length; c++) {
    const g = t[c];
    if (g.type !== "w-text" || g.hidden)
      continue;
    const u = m(g.color);
    if (!u)
      continue;
    const I = l[c];
    if (!I)
      continue;
    const x = r.has(I.rgb), w = r.has(u.rgb);
    if (!x && !w)
      continue;
    const y = Pe(Number(g.fontSize) || 0, ae(g), e), Ne = N(`#${u.rgb}${u.alpha}`, I.color);
    if (S(Ne, I.color) >= y)
      continue;
    const tt = `#${u.rgb}${u.alpha}`;
    if (K(u.rgb)) {
      const it = gt(I.color, [tt, P, s]);
      it !== tt && (L(g, `#${m(it).rgb}${u.alpha}`), o.swapped++), S(it, I.color) < y && o.unreadable++;
      continue;
    }
    const D = Jt(tt, I.color, y);
    if (D.met) {
      D.changed && (L(g, D.color), o.adjusted++);
      continue;
    }
    const et = gt(I.color, [D.color, P, s]);
    et === D.color ? D.changed && (L(g, D.color), o.adjusted++) : (L(g, `#${m(et).rgb}${u.alpha}`), o.swapped++), S(et, I.color) < y && o.unreadable++;
  }
  const h = Xo(t, n, a, r, s, d);
  return o.marks = h.nudged, o.marksSwapped = h.swapped, o;
}
function Lt(t) {
  return Math.max(0, t.right - t.left) * Math.max(0, t.bottom - t.top);
}
const Vo = 0.25;
function Xo(t, e, i, o, r, s) {
  const n = { nudged: 0, swapped: 0 };
  if (!i)
    return n;
  for (let a = 0; a < t.length; a++) {
    const l = t[a];
    if (l.hidden || l.isContainer || !ut.has(l.type) || l.type === "w-svg" && l.colors?.length !== 1)
      continue;
    const d = m(wt(l));
    if (!d || d.alpha === "00")
      continue;
    const h = `#${d.rgb}${d.alpha}`, c = z(l);
    if (K(d.rgb)) {
      const x = he(a, t, e, i);
      if (!x || !o.has(x.rgb) || s.has(l.uuid) || Lt(c) > Vo * Lt(x.bounds) || S(N(h, x.color), x.color) >= St)
        continue;
      const w = gt(x.color, [h, P, r]);
      if (w === h)
        continue;
      zt(l, `#${m(w).rgb}${d.alpha}`), n.swapped++;
      continue;
    }
    if (!o.has(d.rgb))
      continue;
    let g = "", u = null;
    for (let x = 0; x < t.length; x++) {
      const w = t[x];
      if (x === a || w.hidden || !ut.has(w.type) || !F(e[a], e[x]) || u && !F(e[x], u) || !Uo(z(w), c))
        continue;
      const y = m(wt(w));
      !y || !o.has(y.rgb) || y.alpha === "00" || (g = N(`#${y.rgb}${y.alpha}`, i.color), u = e[x]);
    }
    if (!g || S(N(h, g), g) >= 1.5)
      continue;
    const I = Jt(h, g, St);
    I.changed && (zt(l, I.color), n.nudged++);
  }
  return n;
}
function zt(t, e) {
  $.has(t.type) ? t.color = e : t.colors = [e];
}
function $o(t, e, i) {
  const o = { filled: 0, fieldPages: 0, unresolved: 0, fonts: 0, recoloured: 0, backgrounds: 0, readability: ce() };
  if (i.fields) {
    const n = re(e), a = /* @__PURE__ */ new Set();
    t.forEach((l, d) => {
      for (const h of l.layers) {
        if (!jt(h) || !fo(h.text))
          continue;
        const c = qt(h.text, n);
        c !== h.text && (h.text = c, o.filled++, a.add(d));
      }
    }), o.fieldPages = a.size, o.unresolved = xo(t.flatMap((l) => l.layers)).filter(ne).length;
  }
  const r = J(e.fonts.heading), s = J(e.fonts.body);
  if (i.fonts && (r || s))
    for (const n of t) {
      const a = Wo(n.global);
      for (const l of n.layers) {
        if (!jt(l))
          continue;
        const h = ae(l) || Number(l.fontSize) >= a ? r || s : s || r;
        h && Go(l, h) && o.fonts++;
      }
    }
  if (i.colors && e.colors.length) {
    const n = Ro(t).slice(0, e.colors.length), a = /* @__PURE__ */ new Map();
    if (n.forEach((l, d) => {
      const h = m(e.colors[d]);
      h && h.rgb !== l && a.set(l, h.rgb);
    }), a.size) {
      for (const l of de(t)) {
        const d = m(l.read()), h = d && a.get(d.rgb);
        !d || !h || (l.write(`#${h}${d.alpha}`), l.kind === "page" ? o.backgrounds++ : o.recoloured++);
      }
      for (const l of t) {
        const d = Oo(l.layers, l.global, e);
        o.readability.adjusted += d.adjusted, o.readability.swapped += d.swapped, o.readability.unreadable += d.unreadable, o.readability.marks += d.marks, o.readability.marksSwapped += d.marksSwapped;
      }
    }
  }
  return o;
}
function Q(t) {
  if (!t)
    return (i) => i;
  const e = re(se(t));
  return (i) => qt(i, e);
}
function _(t, e) {
  const i = JSON.parse(JSON.stringify(t));
  return $o(i.layouts, se(e), { fields: !0, fonts: !0, colors: !0 }), i;
}
const f = 110, { width: ge, height: ue } = R, p = ge - f * 2, v = ue - 96, we = ["title", "statement", "content", "two-column", "media"];
function ft(t) {
  return { layout: t, title: null, kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null };
}
function k(t, e, i) {
  const o = String(t || "").trim();
  if (!o)
    return null;
  const r = Xt(o, { fontFamily: i.font.value, fontSize: i.size, lineHeight: i.lineHeight, letterSpacing: i.tracking, bold: (i.weight || 400) >= 600 }, { width: e.width, height: e.height, minFontSize: i.minSize, maxLines: i.maxLines });
  if (!r.lines.length)
    return null;
  const s = $t(r, i.lineHeight);
  return {
    widget: pt({
      left: e.left,
      top: e.top,
      width: e.width,
      height: s,
      fontSize: r.fontSize,
      lineHeight: i.lineHeight,
      letterSpacing: i.tracking ? Math.round(i.tracking * (r.fontSize / i.size)) : 0,
      color: i.color,
      font: i.font,
      fontWeight: i.weight,
      textAlign: i.align,
      brandRole: i.brandRole,
      role: i.role,
      text: X(r.lines.join(`
`))
    }),
    bottom: e.top + s
  };
}
function q(t, e, i, o = f, r = p) {
  return k(
    e ? e.toUpperCase() : null,
    { left: o, top: i, width: r, height: 40 },
    {
      font: t.eyebrow,
      size: 25,
      minSize: 18,
      lineHeight: 1.3,
      tracking: t.eyebrowTracking,
      color: t.accent,
      brandRole: "keep",
      role: "eyebrow",
      maxLines: 1
    }
  );
}
function mt(t, e, i, o) {
  const r = [], s = Math.round(o * 0.75), n = Math.round(o * 0.35), a = Math.round(o * 1.3);
  let l = i.top;
  const d = i.top + i.height;
  for (const h of e) {
    const c = k(
      h.text,
      { left: i.left + a, top: l, width: i.width - a, height: d - l },
      {
        font: t.body,
        size: o,
        minSize: Math.round(o * 0.72),
        lineHeight: 1.4,
        color: t.ink,
        brandRole: "body",
        role: "bullet"
      }
    );
    if (!c || c.bottom > d)
      break;
    r.push(b(i.left + Math.round(o * 0.35), l + Math.round(o * 0.52), Math.round(o * 0.3), Math.round(o * 0.3), t.accent, 999)), r.push(c.widget), l = c.bottom + n;
    for (const g of h.sub || []) {
      const u = k(
        g,
        { left: i.left + a * 2, top: l, width: i.width - a * 2, height: d - l },
        {
          font: t.body,
          size: Math.round(o * 0.82),
          minSize: Math.round(o * 0.62),
          lineHeight: 1.4,
          color: t.muted,
          brandRole: "body",
          role: "sub-bullet"
        }
      );
      if (!u || u.bottom > d)
        break;
      r.push(b(i.left + a, l + Math.round(o * 0.5), Math.round(o * 0.5), 2, t.muted)), r.push(u.widget), l = u.bottom + n;
    }
    l += s - n;
  }
  return r;
}
function H(t, e) {
  const i = b(f, v, p, 2, t.rule), o = e("{{school.name|upper}}"), r = pt({
    left: f,
    top: v + 22,
    width: p,
    height: 32,
    fontSize: 22,
    lineHeight: 1.3,
    letterSpacing: Math.round(t.eyebrowTracking / 2),
    color: t.muted,
    font: t.eyebrow,
    brandRole: "keep",
    role: "school.name",
    text: X(o)
  });
  return [i, r];
}
function Ko(t, e, i) {
  const o = [], r = q(t, e.kicker, 110);
  r && o.push(r.widget), o.push(b(f, 190, 150, 8, t.accent));
  const s = k(
    e.title,
    { left: f, top: 260, width: Math.round(p * 0.84), height: 400 },
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
  let n = 660;
  s && (o.push(s.widget), n = s.bottom + 46);
  const a = k(
    e.sub,
    { left: f, top: n, width: Math.round(p * 0.68), height: v - 40 - n },
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
  return a && o.push(a.widget), [...o, ...H(t, i)];
}
function _o(t, e, i) {
  const o = [b(f, 250, 10, 420, t.accent)], r = f + 70, s = p - 70, n = q(t, e.kicker, 110);
  n && o.push(n.widget);
  const a = k(
    e.title || e.callout,
    { left: r, top: 270, width: s, height: 380 },
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
  a && (o.push(a.widget), l = a.bottom + 40);
  const d = k(
    e.sub,
    { left: r, top: l, width: Math.round(s * 0.7), height: v - 40 - l },
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
  return d && o.push(d.widget), [...o, ...H(t, i)];
}
function fe(t, e, i, o = p) {
  const r = q(t, e.kicker, 110, f, o);
  let s = r ? r.bottom + 14 : 110;
  r && i.push(r.widget);
  const n = k(
    e.title,
    { left: f, top: s, width: o, height: 200 },
    {
      font: t.display,
      size: 62,
      minSize: 34,
      lineHeight: 1.15,
      color: t.ink,
      weight: t.displayWeight,
      brandRole: "heading",
      role: "heading"
    }
  );
  return n && (i.push(n.widget), s = n.bottom + 26), i.push(b(f, s, o, 2, t.rule)), s + 40;
}
function Ie(t, e, i) {
  const o = [];
  let r = fe(t, e, o);
  const s = k(
    e.sub,
    { left: f, top: r, width: Math.round(p * 0.8), height: 130 },
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
  s && (o.push(s.widget), r = s.bottom + 34);
  const n = e.callout ? 130 : 0;
  if (o.push(...mt(t, e.bullets, { left: f, top: r, width: p, height: v - 40 - n - r }, 32)), e.callout) {
    const a = v - 40 - n;
    o.push(b(f, a, p, n - 16, t.accent, 8));
    const l = k(
      e.callout,
      { left: f + 34, top: a + 28, width: p - 68, height: n - 72 },
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
    l && o.push(l.widget);
  }
  return [...o, ...H(t, i)];
}
function qo(t, e, i) {
  const o = [], r = fe(t, e, o), s = 80, n = Math.round((p - s) / 2), a = [
    { left: f, head: e.columnHeads[0] || null, bullets: e.bullets },
    { left: f + n + s, head: e.columnHeads[1] || null, bullets: e.bulletsRight }
  ];
  o.push(b(f + n + Math.round(s / 2), r, 2, v - 40 - r, t.rule));
  for (const l of a) {
    let d = r;
    const h = k(
      l.head,
      { left: l.left, top: d, width: n, height: 90 },
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
    h && (o.push(h.widget), d = h.bottom + 24), o.push(...mt(t, l.bullets, { left: l.left, top: d, width: n, height: v - 40 - d }, 28));
  }
  return [...o, ...H(t, i)];
}
function t0(t, e, i) {
  const o = [], r = Math.round(p * 0.46), s = { left: f + r + 70, top: 110, width: p - r - 70, height: v - 150 };
  e.image?.url ? o.push(yo(s.left, s.top, s.width, s.height, e.image)) : o.push(b(s.left, s.top, s.width, s.height, t.rule, 6));
  const n = q(t, e.kicker, 130, f, r);
  let a = n ? n.bottom + 16 : 130;
  n && o.push(n.widget);
  const l = k(
    e.title,
    { left: f, top: a, width: r, height: 300 },
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
  l && (o.push(l.widget), a = l.bottom + 26);
  const d = k(
    e.sub,
    { left: f, top: a, width: r, height: 200 },
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
  return d && (a = d.bottom + 30), d && o.push(d.widget), o.push(...mt(t, e.bullets, { left: f, top: a, width: r, height: v - 40 - a }, 26)), [...o, ...H(t, i)];
}
const e0 = {
  title: Ko,
  statement: _o,
  content: Ie,
  "two-column": qo,
  media: t0
};
function xe(t, e, i = (o) => o) {
  const o = e0[t.layout] || Ie, r = t.title?.trim() || t.kicker?.trim() || "Slide";
  return { global: ee(r.slice(0, 60), ge, ue, e.paper, t.notes), layers: o(e, t, i) };
}
function R0(t, e = {}) {
  const i = Qt(e.theme), o = Q(e.brand), r = Array.isArray(t?.slides) ? t.slides : [], s = (r.length ? r : [ft("title")]).map((a) => xe({ ...ft(a?.layout || "content"), ...a }, i, o)), n = { format: "design-studio/v1", title: String(t?.title || "Untitled deck"), layouts: s };
  return e.brand ? _(n, e.brand) : n;
}
const ye = [
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
], B = /* @__PURE__ */ new Map();
for (const t of ye)
  t.type === "svg" && (B.set(t.title.toLowerCase(), t), B.set(t.title.toLowerCase().replace(/\s+/g, "-"), t), B.set(t.title.toLowerCase().replace(/\s+/g, ""), t));
const P0 = ye.filter((t) => t.type === "svg").map((t) => t.title);
function pe(t) {
  return !!t && B.has(String(t).trim().toLowerCase());
}
function Mt(t, e, i, o, r) {
  const s = B.get(String(t).trim().toLowerCase());
  return s ? {
    name: s.title,
    type: "w-svg",
    uuid: V(),
    width: Math.round(o),
    height: Math.round(o),
    colors: [r],
    left: Math.round(e),
    top: Math.round(i),
    transform: "",
    radius: 0,
    opacity: 1,
    parent: "-1",
    svgUrl: s.url,
    imgUrl: s.url,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 }
  } : null;
}
const Bt = {
  letter: { width: 1275, height: 1650 },
  tabloid: { width: 1650, height: 2550 },
  // A roll-up banner: 24 × 72 inches, the size a school already owns a stand for.
  banner: { width: 3600, height: 10800 }
}, i0 = {
  "letter-landscape": { size: "letter", landscape: !0 },
  "letter-portrait": { size: "letter", landscape: !1 }
}, me = ["direction", "icon", "statement", "number", "notice"];
function It(t) {
  return { layout: t, icon: null, eyebrow: null, badge: null, head: "", sub: null, foot: null };
}
function o0(t) {
  const e = i0[String(t?.size)], i = Bt[e ? e.size : t?.size] || Bt.letter;
  return (e ? e.landscape : t?.orientation === "LANDSCAPE") ? { width: i.height, height: i.width } : { ...i };
}
function r0(t, e) {
  const i = Math.round(Math.min(t, e) * 0.09);
  return { W: t, H: e, M: i, content: t - i * 2 };
}
function M(t, e, i) {
  const o = String(t || "").trim();
  if (!o)
    return null;
  const r = Xt(o, { fontFamily: i.font.value, fontSize: i.size, lineHeight: i.lineHeight, letterSpacing: i.tracking, bold: (i.weight || 400) >= 600 }, { width: e.width, height: e.height, minFontSize: i.minSize, maxLines: i.maxLines });
  if (!r.lines.length)
    return null;
  const s = $t(r, i.lineHeight);
  return {
    widget: pt({
      left: e.left,
      top: e.top,
      width: e.width,
      height: s,
      fontSize: r.fontSize,
      lineHeight: i.lineHeight,
      letterSpacing: i.tracking ? Math.round(i.tracking * (r.fontSize / i.size)) : 0,
      color: i.color,
      font: i.font,
      fontWeight: i.weight,
      textAlign: i.align ?? "center",
      brandRole: i.brandRole,
      role: i.role,
      text: X(r.lines.join(`
`))
    }),
    bottom: e.top + s
  };
}
function W(t, e, i, o, r) {
  const { W: s, H: n, M: a, content: l } = e, d = [], h = o ? t.paper : t.muted, c = Math.round(n * 0.07), g = M(
    i.eyebrow ? i.eyebrow.toUpperCase() : null,
    { left: a, top: c, width: l, height: Math.round(n * 0.05) },
    {
      font: t.eyebrow,
      size: Math.round(s * 0.028),
      minSize: Math.round(s * 0.016),
      lineHeight: 1.3,
      tracking: t.eyebrowTracking,
      color: o ? t.paper : t.accent,
      brandRole: "keep",
      role: "eyebrow",
      maxLines: 1
    }
  );
  g && d.push(g.widget);
  const u = Math.round(n * 0.9);
  d.push(b(a, u, l, 3, o ? t.paper : t.rule));
  const I = M(
    r(i.foot || "{{school.name}} · {{school.phone}}"),
    { left: a, top: u + Math.round(n * 0.018), width: l, height: Math.round(n * 0.05) },
    {
      font: t.eyebrow,
      size: Math.round(s * 0.024),
      minSize: Math.round(s * 0.015),
      lineHeight: 1.35,
      color: h,
      brandRole: "keep",
      role: "footer",
      maxLines: 2
    }
  );
  return I && d.push(I.widget), d;
}
function A(t, e, i) {
  return { left: t.M, top: Math.round(e), width: t.content, height: Math.round(i) };
}
function n0(t, e, i, o) {
  const { W: r, H: s, M: n, content: a } = e, l = [];
  l.push(b(0, 0, r, Math.round(s * 0.055), t.accent));
  const d = M(i.head, A(e, s * 0.2, s * 0.34), {
    font: t.display,
    size: Math.round(r * 0.19),
    minSize: Math.round(r * 0.07),
    lineHeight: 1.02,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  let h = Math.round(s * 0.56);
  d && (l.push(d.widget), h = d.bottom + Math.round(s * 0.035));
  const c = Mt("arrow right", n + Math.round((a - r * 0.22) / 2), h, Math.round(r * 0.22), t.accent);
  c && (l.push(c), h += Math.round(r * 0.22) + Math.round(s * 0.02));
  const g = M(i.sub, A(e, h, s * 0.86 - h), {
    font: t.body,
    size: Math.round(r * 0.05),
    minSize: Math.round(r * 0.028),
    lineHeight: 1.3,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...W(t, e, i, !1, o)], background: t.paper };
}
function s0(t, e, i, o) {
  const { W: r, H: s, M: n, content: a } = e, l = [], d = Math.round(r * 0.34);
  let h = Math.round(s * 0.17);
  const c = pe(i.icon) ? Mt(i.icon, n + Math.round((a - d) / 2), h, d, t.accent) : null;
  c && (l.push(c), h += d + Math.round(s * 0.04));
  const g = M(i.head, A(e, h, s * 0.28), {
    font: t.display,
    size: Math.round(r * 0.14),
    minSize: Math.round(r * 0.06),
    lineHeight: 1.04,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  g && (l.push(g.widget), h = g.bottom + Math.round(s * 0.03));
  const u = M(i.sub, A(e, h, s * 0.86 - h), {
    font: t.body,
    size: Math.round(r * 0.045),
    minSize: Math.round(r * 0.026),
    lineHeight: 1.35,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return u && l.push(u.widget), { layers: [...l, ...W(t, e, i, !1, o)], background: t.paper };
}
function l0(t, e, i, o) {
  const { W: r, H: s } = e, n = [], a = M(i.head, A(e, s * 0.24, s * 0.4), {
    font: t.display,
    size: Math.round(r * 0.13),
    minSize: Math.round(r * 0.05),
    lineHeight: 1.08,
    color: t.paper,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  let l = Math.round(s * 0.66);
  a && (n.push(a.widget), l = a.bottom + Math.round(s * 0.035));
  const d = M(i.sub, A(e, l, s * 0.86 - l), {
    font: t.body,
    size: Math.round(r * 0.042),
    minSize: Math.round(r * 0.026),
    lineHeight: 1.4,
    color: t.paper,
    brandRole: "body",
    role: "body"
  });
  return d && n.push(d.widget), { layers: [...n, ...W(t, e, i, !0, o)], background: t.accent };
}
function a0(t, e, i, o) {
  const { W: r, H: s, M: n, content: a } = e, l = [], d = M(i.badge || i.head, A(e, s * 0.19, s * 0.3), {
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
  let h = Math.round(s * 0.5);
  d && (l.push(d.widget), h = d.bottom + Math.round(s * 0.03)), l.push(b(n + Math.round(a * 0.35), h, Math.round(a * 0.3), 6, t.rule)), h += Math.round(s * 0.035);
  const c = M(i.badge ? i.head : i.sub, A(e, h, s * 0.2), {
    font: t.display,
    size: Math.round(r * 0.09),
    minSize: Math.round(r * 0.04),
    lineHeight: 1.1,
    color: t.ink,
    weight: t.displayWeight,
    brandRole: "heading",
    role: "heading"
  });
  c && (l.push(c.widget), h = c.bottom + Math.round(s * 0.025));
  const g = M(i.badge ? i.sub : null, A(e, h, s * 0.86 - h), {
    font: t.body,
    size: Math.round(r * 0.04),
    minSize: Math.round(r * 0.025),
    lineHeight: 1.35,
    color: t.muted,
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...W(t, e, i, !1, o)], background: t.paper };
}
function Me(t, e, i, o) {
  const { W: r, H: s, M: n, content: a } = e, l = [];
  l.push(b(n, Math.round(s * 0.135), Math.round(a * 0.18), 10, t.accent));
  const d = M(i.head, A(e, s * 0.18, s * 0.26), {
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
  let h = Math.round(s * 0.46);
  d && (l.push(d.widget), h = d.bottom + Math.round(s * 0.03));
  const c = pe(i.icon) ? Mt(i.icon, e.W - n - Math.round(r * 0.14), Math.round(s * 0.17), Math.round(r * 0.14), t.accentSoft) : null;
  c && l.push(c);
  const g = M(i.sub, A(e, h, s * 0.86 - h), {
    font: t.body,
    size: Math.round(r * 0.04),
    minSize: Math.round(r * 0.024),
    lineHeight: 1.5,
    color: t.ink,
    align: "left",
    brandRole: "body",
    role: "body"
  });
  return g && l.push(g.widget), { layers: [...l, ...W(t, e, i, !1, o)], background: t.paper };
}
const d0 = {
  direction: n0,
  icon: s0,
  statement: l0,
  number: a0,
  notice: Me
};
function be(t, e, i, o = (r) => r) {
  const r = r0(i.width, i.height), s = d0[t.layout] || Me, { layers: n, background: a } = s(e, r, t, o), l = t.head?.trim() || t.eyebrow?.trim() || "Sign";
  return { global: ee(l.slice(0, 60), i.width, i.height, a), layers: n };
}
function U0(t, e = {}) {
  const i = Ot(e.theme), o = Q(e.brand), r = o0(t || { orientation: "PORTRAIT", size: "letter" }), s = Array.isArray(t?.signs) ? t.signs : [], n = (s.length ? s : [It("notice")]).map((l) => be({ ...It(l?.layout || "notice"), ...l }, i, r, o)), a = { format: "design-studio/v1", title: s[0]?.head?.trim() || "Untitled sign", layouts: n };
  return e.brand ? _(a, e.brand) : a;
}
function h0(t) {
  const e = _t(t.text), i = e.find((o) => ne(o));
  return i ? i.split("|")[0].trim().toLowerCase() : e.length ? e[0].trim().toLowerCase() : t.role ? String(t.role) : t.brandRole && t.brandRole !== "keep" ? t.brandRole : null;
}
function c0(t) {
  const e = t.label || t.role || t.alt;
  return e ? String(e) : null;
}
function bt(t) {
  const e = t?.layouts?.[0]?.global;
  if (!e)
    return "unknown";
  const i = Number(e.width) >= Number(e.height);
  return i && Math.abs(Number(e.width) / Number(e.height) - R.width / R.height) < 0.06 ? "slides" : !i && Math.abs(Number(e.width) / Number(e.height) - ht.width / ht.height) < 0.25 ? "poster" : i ? "slides" : "poster";
}
function Y0(t) {
  const e = Array.isArray(t?.layouts) ? t.layouts : [];
  return {
    title: String(t?.title || ""),
    kind: bt(t),
    pages: e.map((i, o) => {
      const r = Array.isArray(i?.layers) ? i.layers : [], s = typeof i?.global?.notes == "string" ? i.global.notes.trim() : "";
      return {
        index: o,
        width: Number(i?.global?.width) || 0,
        height: Number(i?.global?.height) || 0,
        texts: r.filter((n) => n.type === "w-text" && !n.hidden).map((n) => ({ id: String(n.uuid), role: h0(n), text: yt(n.text) })).filter((n) => n.text.length > 0),
        images: r.filter((n) => n.type === "w-image" && !n.hidden).map((n) => ({ id: String(n.uuid), alt: c0(n) })),
        notes: s || null
      };
    })
  };
}
const ke = ["href", "color", "bold", "italic", "underline", "strike"], Zt = /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|DL|DD|DT|FOOTER|H[1-6]|HEADER|LI|OL|P|PRE|SECTION|TABLE|TD|TH|TR|UL)$/, Ht = /^(HEAD|LINK|META|NOSCRIPT|SCRIPT|STYLE|TEMPLATE|TITLE)$/, Wt = 3, Tt = 1, Ae = 64;
typeof DOMParser > "u" || new DOMParser();
const g0 = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  // A non-breaking space, spelled out because it is invisible in a file.
  // Written the way the browser serialises it, so the stored string matches
  // what innerHTML reads back and the editor is not rewritten for nothing.
  " ": "&nbsp;"
};
function xt(t) {
  return t.replace(/[&<>"\u00a0]/g, (e) => g0[e]);
}
const u0 = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, w0 = /^rgba?\(\s*([^)]+)\)$/i, T = (t) => Math.max(0, Math.min(255, Math.round(t))).toString(16).padStart(2, "0");
function Gt(t) {
  if (!t)
    return;
  const e = t.trim(), i = e.match(u0);
  if (i) {
    let r = i[1].toLowerCase();
    return r.length <= 4 && (r = r.split("").map((s) => s + s).join("")), "#" + (r.length === 8 && r.endsWith("ff") ? r.slice(0, 6) : r);
  }
  const o = e.match(w0);
  if (o) {
    const r = o[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (r.length < 3 || r.slice(0, 3).some(Number.isNaN))
      return;
    const s = r.length > 3 && !Number.isNaN(r[3]) ? r[3] : 1, n = "#" + T(r[0]) + T(r[1]) + T(r[2]);
    return s >= 1 ? n : n + T(s * 255);
  }
}
const f0 = /^([a-z][a-z0-9+.-]*):/i, I0 = /* @__PURE__ */ new Set(["http", "https", "mailto", "tel"]);
function x0(t) {
  const e = (t ?? "").trim();
  if (!e)
    return;
  const i = e.match(f0)?.[1].toLowerCase();
  if (i)
    return I0.has(i) ? e : void 0;
  if (e.startsWith("//"))
    return "https:" + e;
  if (!/\s/.test(e))
    return "https://" + e;
}
function y0(t, e) {
  return ke.every((i) => (t[i] || void 0) === (e[i] || void 0));
}
function p0(t, e) {
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
      const r = x0(t.getAttribute?.("href"));
      r && (i.href = r);
      break;
    }
    case "FONT": {
      const r = Gt(t.getAttribute?.("color"));
      r && (i.color = r);
      break;
    }
  }
  const o = t.style;
  if (o && o.length) {
    const r = Gt(o.color);
    r && (i.color = r);
    const s = o.fontWeight;
    (s === "bold" || s === "bolder" || Number(s) >= 600) && (i.bold = !0), (o.fontStyle === "italic" || o.fontStyle === "oblique") && (i.italic = !0);
    const n = o.textDecorationLine || o.textDecoration || "";
    /underline/.test(n) && (i.underline = !0), /line-through/.test(n) && (i.strike = !0);
  }
  return i;
}
function ve(t) {
  const e = [];
  let i = [], o = !1;
  const r = () => {
    e.push(i), i = [], o = !1;
  }, s = (l) => {
    let d = l;
    for (; ; ) {
      for (let c = d.nextSibling; c; c = c.nextSibling)
        if (c.nodeType === Wt && c.data || c.nodeType === Tt && !Ht.test(c.tagName ?? ""))
          return !1;
      const h = d.parentNode;
      if (!h || h === t || Zt.test(h.tagName ?? ""))
        return !0;
      d = h;
    }
  }, n = (l, d) => {
    if (!l)
      return;
    const h = i[i.length - 1];
    h && y0(h, d) ? h.text += l : i.push({ text: l, ...d }), o = !0;
  }, a = (l, d, h = 0) => {
    if (!(h > Ae))
      for (const c of Array.from(l.childNodes)) {
        if (c.nodeType === Wt) {
          const u = c.data;
          if (!u || /^(UL|OL)$/.test(l.tagName ?? "") && !u.trim())
            continue;
          u.split(`
`).forEach((x, w) => {
            w > 0 && r(), n(x, d), w > 0 && !x && (o = !0);
          });
          continue;
        }
        if (c.nodeType !== Tt)
          continue;
        const g = c;
        if (!Ht.test(g.tagName ?? "")) {
          if (g.tagName === "BR") {
            if (s(g)) {
              o = !0;
              continue;
            }
            r();
            continue;
          }
          if (Zt.test(g.tagName ?? "")) {
            o && r(), a(g, d, h + 1), o && r();
            continue;
          }
          a(g, p0(g, d), h + 1);
        }
      }
  };
  return a(t, {}), (o || e.length === 0) && e.push(i), e;
}
function Et(t) {
  return t.map((e) => e.text).join("");
}
function m0(t, e, i) {
  switch (t) {
    case "href":
      return `<a href="${xt(String(e))}">${i}</a>`;
    case "color":
      return `<span style="color:${xt(String(e))}">${i}</span>`;
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
function Se(t, e) {
  if (e.length === 0)
    return t.map((n) => xt(n.text)).join("");
  const [i, ...o] = e;
  let r = "", s = 0;
  for (; s < t.length; ) {
    const n = t[s][i] || void 0;
    let a = s;
    for (; a < t.length && (t[a][i] || void 0) === n; )
      a++;
    const l = Se(t.slice(s, a), o);
    r += n ? m0(i, n, l) : l, s = a;
  }
  return r;
}
function Rt(t) {
  return Se(
    t.filter((e) => e.text),
    ke
  );
}
function M0(t, e = "none") {
  if (e === "bullet" || e === "number") {
    const o = e === "number" ? "ol" : "ul", r = t.map((s) => `<li>${Et(s).trim() ? Rt(s) : "<br>"}</li>`);
    return `<${o}>${r.join("")}</${o}>`;
  }
  const i = t.map(Rt).join("<br>");
  return t.length > 1 && !Et(t[t.length - 1]) ? i + "<br>" : i;
}
const b0 = 3, De = 1, k0 = Ae, A0 = /* @__PURE__ */ new Set(["AREA", "BASE", "BR", "COL", "EMBED", "HR", "IMG", "INPUT", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"]), v0 = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "TEXTAREA", "TITLE", "XMP", "IFRAME", "NOEMBED", "NOFRAMES"]), S0 = {
  LI: /^LI$/,
  P: /^P$/,
  DD: /^(DD|DT)$/,
  DT: /^(DD|DT)$/,
  TD: /^(TD|TH)$/,
  TH: /^(TD|TH)$/,
  TR: /^(TD|TH|TR)$/
};
function D0(t) {
  return { nodeType: b0, data: t, childNodes: [], nextSibling: null, parentNode: null };
}
function C0(t) {
  if (!t)
    return null;
  const e = {};
  let i = 0;
  for (const o of t.split(";")) {
    const r = o.indexOf(":");
    if (r < 0)
      continue;
    const s = o.slice(0, r).trim().toLowerCase(), n = o.slice(r + 1).trim();
    n && (i++, s === "color" ? e.color = n : s === "font-weight" ? e.fontWeight = n : s === "font-style" ? e.fontStyle = n : s === "text-decoration-line" ? e.textDecorationLine = n : s === "text-decoration" && (e.textDecoration = n));
  }
  return e.length = i, e;
}
const N0 = /([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;
function j0(t) {
  const e = {};
  for (const i of t.matchAll(N0)) {
    const o = i[1].toLowerCase();
    o !== "href" && o !== "color" && o !== "style" || (e[o] = O(i[2] ?? i[3] ?? i[4] ?? ""));
  }
  return e;
}
function L0(t, e) {
  return {
    nodeType: De,
    tagName: t,
    childNodes: [],
    nextSibling: null,
    parentNode: null,
    getAttribute: (i) => e[i.toLowerCase()] ?? null,
    style: C0(e.style)
  };
}
const z0 = /[a-zA-Z]/, B0 = /[a-zA-Z0-9:-]/;
function Z0(t, e) {
  let i = e + 1;
  const o = t[i] === "/";
  if (o && i++, !z0.test(t[i] ?? ""))
    return { kind: "text" };
  const r = i;
  for (; i < t.length && B0.test(t[i]); )
    i++;
  const s = t.slice(r, i).toUpperCase(), n = i;
  let a = "";
  for (; i < t.length; i++) {
    const d = t[i];
    if (a) {
      d === a && (a = "");
      continue;
    }
    if (d === '"' || d === "'")
      a = d;
    else if (d === ">")
      break;
  }
  if (i >= t.length)
    return { kind: "eof" };
  const l = t.slice(n, i);
  return { kind: "tag", close: o, name: s, attrs: l, selfClosing: l.trimEnd().endsWith("/"), end: i + 1 };
}
function Ce(t) {
  const e = { nodeType: De, tagName: "BODY", childNodes: [], nextSibling: null, parentNode: null }, i = [e], o = () => i[i.length - 1], r = (l) => {
    const d = o(), h = d.childNodes[d.childNodes.length - 1];
    h && (h.nextSibling = l), l.parentNode = d, d.childNodes.push(l);
  }, s = (l) => {
    l && r(D0(O(l)));
  }, n = String(t ?? "");
  let a = 0;
  for (; a < n.length; ) {
    const l = n.indexOf("<", a);
    if (l < 0) {
      s(n.slice(a));
      break;
    }
    if (s(n.slice(a, l)), n.startsWith("<!--", l)) {
      const u = n.startsWith(">", l + 4) ? l + 5 : n.startsWith("->", l + 4) ? l + 6 : 0;
      if (u) {
        a = u;
        continue;
      }
      const I = n.indexOf("-->", l + 4);
      a = I < 0 ? n.length : I + 3;
      continue;
    }
    if (n.startsWith("<!", l) || n.startsWith("<?", l)) {
      const u = n.indexOf(">", l);
      a = u < 0 ? n.length : u + 1;
      continue;
    }
    const d = Z0(n, l);
    if (d.kind === "text") {
      s("<"), a = l + 1;
      continue;
    }
    if (d.kind === "eof") {
      s(n.slice(l));
      break;
    }
    a = d.end;
    const h = d.name;
    if (d.close) {
      const u = i.findIndex((I) => I.tagName === h);
      u > 0 && (i.length = u);
      continue;
    }
    const c = S0[h];
    c && i.length > 1 && c.test(o().tagName ?? "") && i.pop();
    const g = L0(h, j0(d.attrs));
    if (r(g), v0.has(h)) {
      const u = n.toUpperCase().indexOf(`</${h}`, a);
      a = u < 0 ? n.length : n.indexOf(">", u) + 1 || n.length;
      continue;
    }
    !A0.has(h) && !d.selfClosing && i.length < k0 && i.push(g);
  }
  return e;
}
function H0(t, e = "none") {
  return M0(ve(Ce(String(t ?? ""))), e);
}
function J0(t) {
  return ve(Ce(String(t ?? ""))).map((e) => e.map((i) => i.text).join("")).join(`
`);
}
function W0(t) {
  return t === "poster" ? [...me] : [...we];
}
const Pt = 50;
function T0(t) {
  return JSON.parse(JSON.stringify(t));
}
function dt(t, e) {
  for (const i of t.layouts)
    for (const o of i.layers)
      if (String(o.uuid) === String(e))
        return o;
  return null;
}
function Ut(t, e) {
  return e ? _({ format: "design-studio/v1", title: "", layouts: [t] }, e).layouts[0] : t;
}
function G0(t, e, i, o) {
  const r = String(i.bullets || "").split(`
`).map((n) => n.trim()).filter(Boolean).map((n) => ({ text: n, sub: [] }));
  if (bt(t) === "poster") {
    if (!me.includes(e))
      return null;
    const n = t.layouts[0]?.global, a = { width: Number(n?.width) || 1275, height: Number(n?.height) || 1650 }, l = {
      ...It(e),
      icon: i.icon || null,
      eyebrow: i.eyebrow || null,
      badge: i.badge || null,
      head: i.head || i.title || "",
      sub: i.sub || null,
      foot: i.foot || null
    };
    return Ut(be(l, Ot(i.theme), a, Q(o)), o);
  }
  if (!we.includes(e))
    return null;
  const s = {
    ...ft(e),
    title: i.title || i.head || null,
    kicker: i.kicker || i.eyebrow || null,
    sub: i.sub || null,
    callout: i.callout || null,
    notes: i.notes || null,
    bullets: r,
    columnHeads: [i.columnHeadLeft || "", i.columnHeadRight || ""].filter(Boolean),
    bulletsRight: String(i.bulletsRight || "").split(`
`).map((n) => n.trim()).filter(Boolean).map((n) => ({ text: n, sub: [] }))
  };
  return Ut(xe(s, Qt(i.theme), Q(o)), o);
}
function F0(t, e, i = {}) {
  let o = T0(t);
  const r = [], s = Array.isArray(e) ? e : [];
  for (const n of s) {
    if (!n || typeof n != "object") {
      r.push({ op: n, reason: "That is not an operation." });
      continue;
    }
    switch (n.op) {
      case "setText": {
        const a = dt(o, n.id);
        if (!a) {
          r.push({ op: n, reason: `No widget with id ${n.id}.` });
          break;
        }
        if (a.type !== "w-text") {
          r.push({ op: n, reason: `Widget ${n.id} is a ${a.type}, which holds no text.` });
          break;
        }
        a.text = X(n.text);
        break;
      }
      case "setMarkup": {
        const a = dt(o, n.id);
        if (!a) {
          r.push({ op: n, reason: `No widget with id ${n.id}.` });
          break;
        }
        if (a.type !== "w-text") {
          r.push({ op: n, reason: `Widget ${n.id} is a ${a.type}, which holds no text.` });
          break;
        }
        a.text = H0(String(n.html ?? ""), a.listStyle);
        break;
      }
      case "setImage": {
        const a = dt(o, n.id);
        if (!a) {
          r.push({ op: n, reason: `No widget with id ${n.id}.` });
          break;
        }
        if (a.type !== "w-image") {
          r.push({ op: n, reason: `Widget ${n.id} is a ${a.type}, which holds no picture.` });
          break;
        }
        if (!n.url) {
          r.push({ op: n, reason: "A picture needs a url." });
          break;
        }
        const l = a.width / a.height, d = n.width && n.height ? n.width / n.height : l;
        a.imgUrl = n.url;
        const h = d > l ? d / l : 1, c = d < l ? l / d : 1;
        a.zoom = h, a.zoomY = c, a.transform = ` scale(${h}, ${c}) translate(0px, 0px)`;
        break;
      }
      case "addPage": {
        if (o.layouts.length >= Pt) {
          r.push({ op: n, reason: `A design holds at most ${Pt} pages.` });
          break;
        }
        const a = Number(n.after);
        if (!Number.isInteger(a) || a < -1 || a > o.layouts.length - 1) {
          r.push({ op: n, reason: `There is no page ${n.after} to add after.` });
          break;
        }
        const l = G0(o, String(n.kind), n.fields || {}, i.brand);
        if (!l) {
          r.push({ op: n, reason: `“${n.kind}” is not a page this design can hold. Try one of: ${W0(bt(o) === "poster" ? "poster" : "slides").join(", ")}.` });
          break;
        }
        o.layouts.splice(a + 1, 0, l);
        break;
      }
      case "removePage": {
        const a = Number(n.index);
        if (!Number.isInteger(a) || a < 0 || a >= o.layouts.length) {
          r.push({ op: n, reason: `There is no page ${n.index}.` });
          break;
        }
        if (o.layouts.length === 1) {
          r.push({ op: n, reason: "A design has to keep one page." });
          break;
        }
        o.layouts.splice(a, 1);
        break;
      }
      case "movePage": {
        const a = Number(n.from), l = Number(n.to);
        if (!Number.isInteger(a) || a < 0 || a >= o.layouts.length) {
          r.push({ op: n, reason: `There is no page ${n.from}.` });
          break;
        }
        if (!Number.isInteger(l) || l < 0 || l >= o.layouts.length) {
          r.push({ op: n, reason: `Page ${n.from} cannot go to ${n.to}; there are ${o.layouts.length} pages.` });
          break;
        }
        const [d] = o.layouts.splice(a, 1);
        o.layouts.splice(l, 0, d);
        break;
      }
      case "applyBrand": {
        if (!i.brand) {
          r.push({ op: n, reason: "No brand kit was given to apply." });
          break;
        }
        o = _(o, i.brand);
        break;
      }
      default:
        r.push({ op: n, reason: `“${n.op}” is not an operation.` });
    }
  }
  return { doc: o, rejected: r };
}
const Q0 = ["w-text", "w-image", "w-svg", "w-rect", "w-ellipse", "w-polygon", "w-path", "w-group", "w-qrcode", "w-table"], O0 = "page", V0 = {
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
}, X0 = {
  "w-text": ["fontClass.url", "textEffects[].filling.imageContent.image"],
  "w-table": ["fontClass.url"]
};
export {
  we as DECK_PAGE_KINDS,
  P0 as ICON_KEYS,
  X0 as NESTED_URL_PATHS,
  O0 as PAGE_TYPE,
  eo as POSTER_PACK_KEYS,
  ht as POSTER_PAGE,
  me as SIGN_PAGE_KINDS,
  R as SLIDE_PAGE,
  to as SLIDE_THEME_KEYS,
  V0 as URL_FIELDS,
  Q0 as WIDGET_TYPES,
  _ as applyBrand,
  F0 as applyOps,
  It as blankSign,
  ft as blankSlide,
  R0 as composeDeck,
  U0 as composePoster,
  be as composeSign,
  xe as composeSlide,
  Y0 as describeDocument,
  bt as kindOf,
  J0 as markupToText,
  W0 as pageKinds,
  o0 as pageSize,
  E0 as pageSizeFor,
  Ce as parseMarkup,
  Ot as posterPack,
  H0 as sanitizeMarkup,
  Qt as slideTheme
};
