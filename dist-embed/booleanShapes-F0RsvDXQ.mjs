import { g as Te, a as Me, b as Oe, d as ze, w as Ae, S as fe, p as Le, r as ke, e as Ne, f as Ee, h as Be, i as Fe, j as De, k as Re, l as Ve, v as qe } from "./index-BjCZt6mO.mjs";
import { _ as He } from "./__vite-browser-external-YbutIfMq.mjs";
var de = { exports: {} };
const ce = /* @__PURE__ */ Te(He);
/*!
 * Paper.js v0.12.18 - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2020, Jürg Lehni & Jonathan Puckey
 * http://juerglehni.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Wed Jul 17 14:57:24 2024 +0200
 *
 ***
 *
 * Straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2020 Jürg Lehni
 * http://juerglehni.com/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Acorn.js
 * https://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */
(function(q) {
  (function(H, B) {
    H = H || ce;
    var Y = H.window, tt = H.document, I = new function() {
      var t = /^(statics|enumerable|beans|preserve)$/, e = [], i = e.slice, n = Object.create, r = Object.getOwnPropertyDescriptor, s = Object.defineProperty, o = e.forEach || function(c, l) {
        for (var v = 0, y = this.length; v < y; v++)
          c.call(l, this[v], v, this);
      }, a = function(c, l) {
        for (var v in this)
          this.hasOwnProperty(v) && c.call(l, this[v], v, this);
      }, h = Object.assign || function(c) {
        for (var l = 1, v = arguments.length; l < v; l++) {
          var y = arguments[l];
          for (var C in y)
            y.hasOwnProperty(C) && (c[C] = y[C]);
        }
        return c;
      }, u = function(c, l, v) {
        if (c) {
          var y = r(c, "length");
          (y && typeof y.value == "number" ? o : a).call(c, l, v = v || c);
        }
        return v;
      };
      function _(c, l, v, y, C) {
        var p = {};
        function m(x, b) {
          b = b || (b = r(l, x)) && (b.get ? b : b.value), typeof b == "string" && b[0] === "#" && (b = c[b.substring(1)] || b);
          var P = typeof b == "function", T = b, z = C || P && !b.base ? b && b.get ? x in c : c[x] : null, M;
          (!C || !z) && (P && z && (b.base = z), P && y !== !1 && (M = x.match(/^([gs]et|is)(([A-Z])(.*))$/)) && (p[M[3].toLowerCase() + M[4]] = M[2]), (!T || P || !T.get || typeof T.get != "function" || !d.isPlainObject(T)) && (T = { value: T, writable: !0 }), (r(c, x) || { configurable: !0 }).configurable && (T.configurable = !0, T.enumerable = v ?? !M), s(c, x, T));
        }
        if (l) {
          for (var f in l)
            l.hasOwnProperty(f) && !t.test(f) && m(f);
          for (var f in p) {
            var g = p[f], w = c["set" + g], S = c["get" + g] || w && c["is" + g];
            S && (y === !0 || S.length === 0) && m(f, { get: S, set: w });
          }
        }
        return c;
      }
      function d() {
        for (var c = 0, l = arguments.length; c < l; c++) {
          var v = arguments[c];
          v && h(this, v);
        }
        return this;
      }
      return _(d, {
        inject: function(c) {
          if (c) {
            var l = c.statics === !0 ? c : c.statics, v = c.beans, y = c.preserve;
            l !== c && _(this.prototype, c, c.enumerable, v, y), _(this, l, null, v, y);
          }
          for (var C = 1, p = arguments.length; C < p; C++)
            this.inject(arguments[C]);
          return this;
        },
        extend: function() {
          for (var c = this, l, v, y = 0, C, p = arguments.length; y < p && !(l && v); y++)
            C = arguments[y], l = l || C.initialize, v = v || C.prototype;
          return l = l || function() {
            c.apply(this, arguments);
          }, v = l.prototype = v || n(this.prototype), s(
            v,
            "constructor",
            { value: l, writable: !0, configurable: !0 }
          ), _(l, this), arguments.length && this.inject.apply(l, arguments), l.base = c, l;
        }
      }).inject({
        enumerable: !1,
        initialize: d,
        set: d,
        inject: function() {
          for (var c = 0, l = arguments.length; c < l; c++) {
            var v = arguments[c];
            v && _(this, v, v.enumerable, v.beans, v.preserve);
          }
          return this;
        },
        extend: function() {
          var c = n(this);
          return c.inject.apply(c, arguments);
        },
        each: function(c, l) {
          return u(this, c, l);
        },
        clone: function() {
          return new this.constructor(this);
        },
        statics: {
          set: h,
          each: u,
          create: n,
          define: s,
          describe: r,
          clone: function(c) {
            return h(new c.constructor(), c);
          },
          isPlainObject: function(c) {
            var l = c != null && c.constructor;
            return l && (l === Object || l === d || l.name === "Object");
          },
          pick: function(c, l) {
            return c !== B ? c : l;
          },
          slice: function(c, l, v) {
            return i.call(c, l, v);
          }
        }
      });
    }();
    q.exports = I, I.inject({
      enumerable: !1,
      toString: function() {
        return this._id != null ? (this._class || "Object") + (this._name ? " '" + this._name + "'" : " @" + this._id) : "{ " + I.each(this, function(t, e) {
          if (!/^_/.test(e)) {
            var i = typeof t;
            this.push(e + ": " + (i === "number" ? ht.instance.number(t) : i === "string" ? "'" + t + "'" : t));
          }
        }, []).join(", ") + " }";
      },
      getClassName: function() {
        return this._class || "";
      },
      importJSON: function(t) {
        return I.importJSON(t, this);
      },
      exportJSON: function(t) {
        return I.exportJSON(this, t);
      },
      toJSON: function() {
        return I.serialize(this);
      },
      set: function(t, e) {
        return t && I.filter(this, t, e, this._prioritize), this;
      }
    }, {
      beans: !1,
      statics: {
        exports: {},
        extend: function t() {
          var e = t.base.apply(this, arguments), i = e.prototype._class;
          return i && !I.exports[i] && (I.exports[i] = e), e;
        },
        equals: function(t, e) {
          if (t === e)
            return !0;
          if (t && t.equals)
            return t.equals(e);
          if (e && e.equals)
            return e.equals(t);
          if (t && e && typeof t == "object" && typeof e == "object") {
            if (Array.isArray(t) && Array.isArray(e)) {
              var i = t.length;
              if (i !== e.length)
                return !1;
              for (; i--; )
                if (!I.equals(t[i], e[i]))
                  return !1;
            } else {
              var n = Object.keys(t), i = n.length;
              if (i !== Object.keys(e).length)
                return !1;
              for (; i--; ) {
                var r = n[i];
                if (!(e.hasOwnProperty(r) && I.equals(t[r], e[r])))
                  return !1;
              }
            }
            return !0;
          }
          return !1;
        },
        read: function(t, e, i, n) {
          if (this === I) {
            var r = this.peek(t, e);
            return t.__index++, r;
          }
          var s = this.prototype, o = s._readIndex, a = e || o && t.__index || 0, h = t.length, u = t[a];
          if (n = n || h - a, u instanceof this || i && i.readNull && u == null && n <= 1)
            return o && (t.__index = a + 1), u && i && i.clone ? u.clone() : u;
          if (u = I.create(s), o && (u.__read = !0), u = u.initialize.apply(u, a > 0 || a + n < h ? I.slice(t, a, a + n) : t) || u, o) {
            t.__index = a + u.__read;
            var _ = u.__filtered;
            _ && (t.__filtered = _, u.__filtered = B), u.__read = B;
          }
          return u;
        },
        peek: function(t, e) {
          return t[t.__index = e || t.__index || 0];
        },
        remain: function(t) {
          return t.length - (t.__index || 0);
        },
        readList: function(t, e, i, n) {
          for (var r = [], s, o = e || 0, a = n ? o + n : t.length, h = o; h < a; h++)
            r.push(Array.isArray(s = t[h]) ? this.read(s, 0, i) : this.read(t, h, i, 1));
          return r;
        },
        readNamed: function(t, e, i, n, r) {
          var s = this.getNamed(t, e), o = s !== B;
          if (o) {
            var a = t.__filtered;
            if (!a) {
              var h = this.getSource(t);
              a = t.__filtered = I.create(h), a.__unfiltered = h;
            }
            a[e] = B;
          }
          return this.read(o ? [s] : t, i, n, r);
        },
        readSupported: function(t, e) {
          var i = this.getSource(t), n = this, r = !1;
          return i && Object.keys(i).forEach(function(s) {
            if (s in e) {
              var o = n.readNamed(t, s);
              o !== B && (e[s] = o), r = !0;
            }
          }), r;
        },
        getSource: function(t) {
          var e = t.__source;
          if (e === B) {
            var i = t.length === 1 && t[0];
            e = t.__source = i && I.isPlainObject(i) ? i : null;
          }
          return e;
        },
        getNamed: function(t, e) {
          var i = this.getSource(t);
          if (i)
            return e ? i[e] : t.__filtered || i;
        },
        hasNamed: function(t, e) {
          return !!this.getNamed(t, e);
        },
        filter: function(t, e, i, n) {
          var r;
          function s(_) {
            if (!(i && _ in i) && !(r && _ in r)) {
              var d = e[_];
              d !== B && (t[_] = d);
            }
          }
          if (n) {
            for (var o = {}, a = 0, h, u = n.length; a < u; a++)
              (h = n[a]) in e && (s(h), o[h] = !0);
            r = o;
          }
          return Object.keys(e.__unfiltered || e).forEach(s), t;
        },
        isPlainValue: function(t, e) {
          return I.isPlainObject(t) || Array.isArray(t) || e && typeof t == "string";
        },
        serialize: function(t, e, i, n) {
          e = e || {};
          var r = !n, s;
          if (r && (e.formatter = new ht(e.precision), n = {
            length: 0,
            definitions: {},
            references: {},
            add: function(d, c) {
              var l = "#" + d._id, v = this.references[l];
              if (!v) {
                this.length++;
                var y = c.call(d), C = d._class;
                C && y[0] !== C && y.unshift(C), this.definitions[l] = y, v = this.references[l] = [l];
              }
              return v;
            }
          }), t && t._serialize) {
            s = t._serialize(e, n);
            var o = t._class;
            o && !t._compactSerialize && (r || !i) && s[0] !== o && s.unshift(o);
          } else if (Array.isArray(t)) {
            s = [];
            for (var a = 0, h = t.length; a < h; a++)
              s[a] = I.serialize(t[a], e, i, n);
          } else if (I.isPlainObject(t)) {
            s = {};
            for (var u = Object.keys(t), a = 0, h = u.length; a < h; a++) {
              var _ = u[a];
              s[_] = I.serialize(
                t[_],
                e,
                i,
                n
              );
            }
          } else
            typeof t == "number" ? s = e.formatter.number(t, e.precision) : s = t;
          return r && n.length > 0 ? [["dictionary", n.definitions], s] : s;
        },
        deserialize: function(t, e, i, n, r) {
          var s = t, o = !i, a = o && t && t.length && t[0][0] === "dictionary";
          if (i = i || {}, Array.isArray(t)) {
            var h = t[0], u = h === "dictionary";
            if (t.length == 1 && /^#/.test(h))
              return i.dictionary[h];
            h = I.exports[h], s = [];
            for (var _ = h ? 1 : 0, d = t.length; _ < d; _++)
              s.push(I.deserialize(
                t[_],
                e,
                i,
                u,
                a
              ));
            if (h) {
              var c = s;
              e ? s = e(h, c, o || r) : s = new h(c);
            }
          } else if (I.isPlainObject(t)) {
            s = {}, n && (i.dictionary = s);
            for (var l in t)
              s[l] = I.deserialize(t[l], e, i);
          }
          return a ? s[1] : s;
        },
        exportJSON: function(t, e) {
          var i = I.serialize(t, e);
          return e && e.asString == !1 ? i : JSON.stringify(i);
        },
        importJSON: function(t, e) {
          return I.deserialize(
            typeof t == "string" ? JSON.parse(t) : t,
            function(i, n, r) {
              var s = r && e && e.constructor === i, o = s ? e : I.create(i.prototype);
              if (n.length === 1 && o instanceof $ && (s || !(o instanceof Jt))) {
                var a = n[0];
                I.isPlainObject(a) && (a.insert = !1, s && (n = n.concat([$.INSERT])));
              }
              return (s ? o.set : i).apply(o, n), s && (e = null), o;
            }
          );
        },
        push: function(t, e) {
          var i = e.length;
          if (i < 4096)
            t.push.apply(t, e);
          else {
            var n = t.length;
            t.length += i;
            for (var r = 0; r < i; r++)
              t[n + r] = e[r];
          }
          return t;
        },
        splice: function(t, e, i, n) {
          var r = e && e.length, s = i === B;
          i = s ? t.length : i, i > t.length && (i = t.length);
          for (var o = 0; o < r; o++)
            e[o]._index = i + o;
          if (s)
            return I.push(t, e), [];
          var a = [i, n];
          e && I.push(a, e);
          for (var h = t.splice.apply(t, a), o = 0, u = h.length; o < u; o++)
            h[o]._index = B;
          for (var o = i + r, u = t.length; o < u; o++)
            t[o]._index = o;
          return h;
        },
        capitalize: function(t) {
          return t.replace(/\b[a-z]/g, function(e) {
            return e.toUpperCase();
          });
        },
        camelize: function(t) {
          return t.replace(/-(.)/g, function(e, i) {
            return i.toUpperCase();
          });
        },
        hyphenate: function(t) {
          return t.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        }
      }
    });
    var gt = {
      on: function(t, e) {
        if (typeof t != "string")
          I.each(t, function(s, o) {
            this.on(o, s);
          }, this);
        else {
          var i = this._eventTypes, n = i && i[t], r = this._callbacks = this._callbacks || {};
          r = r[t] = r[t] || [], r.indexOf(e) === -1 && (r.push(e), n && n.install && r.length === 1 && n.install.call(this, t));
        }
        return this;
      },
      off: function(t, e) {
        if (typeof t != "string") {
          I.each(t, function(o, a) {
            this.off(a, o);
          }, this);
          return;
        }
        var i = this._eventTypes, n = i && i[t], r = this._callbacks && this._callbacks[t], s;
        return r && (!e || (s = r.indexOf(e)) !== -1 && r.length === 1 ? (n && n.uninstall && n.uninstall.call(this, t), delete this._callbacks[t]) : s !== -1 && r.splice(s, 1)), this;
      },
      once: function(t, e) {
        return this.on(t, function i() {
          e.apply(this, arguments), this.off(t, i);
        });
      },
      emit: function(t, e) {
        var i = this._callbacks && this._callbacks[t];
        if (!i)
          return !1;
        var n = I.slice(arguments, 1), r = e && e.target && !e.currentTarget;
        i = i.slice(), r && (e.currentTarget = this);
        for (var s = 0, o = i.length; s < o; s++)
          if (i[s].apply(this, n) == !1) {
            e && e.stop && e.stop();
            break;
          }
        return r && delete e.currentTarget, !0;
      },
      responds: function(t) {
        return !!(this._callbacks && this._callbacks[t]);
      },
      attach: "#on",
      detach: "#off",
      fire: "#emit",
      _installEvents: function(t) {
        var e = this._eventTypes, i = this._callbacks, n = t ? "install" : "uninstall";
        if (e) {
          for (var r in i)
            if (i[r].length > 0) {
              var s = e[r], o = s && s[n];
              o && o.call(this, r);
            }
        }
      },
      statics: {
        inject: function t(e) {
          var i = e._events;
          if (i) {
            var n = {};
            I.each(i, function(r, s) {
              var o = typeof r == "string", a = o ? r : s, h = I.capitalize(a), u = a.substring(2).toLowerCase();
              n[u] = o ? {} : r, a = "_" + a, e["get" + h] = function() {
                return this[a];
              }, e["set" + h] = function(_) {
                var d = this[a];
                d && this.off(u, d), _ && this.on(u, _), this[a] = _;
              };
            }), e._eventTypes = n;
          }
          return t.base.apply(this, arguments);
        }
      }
    }, lt = I.extend({
      _class: "PaperScope",
      initialize: function t() {
        rt = this, this.settings = new I({
          applyMatrix: !0,
          insertItems: !0,
          handleSize: 4,
          hitTolerance: 0
        }), this.project = null, this.projects = [], this.tools = [], this._id = t._id++, t._scopes[this._id] = this;
        var e = t.prototype;
        if (!this.support) {
          var i = wt.getContext(1, 1) || {};
          e.support = {
            nativeDash: "setLineDash" in i || "mozDash" in i,
            nativeBlendModes: oe.nativeModes
          }, wt.release(i);
        }
        if (!this.agent) {
          var n = H.navigator.userAgent.toLowerCase(), r = (/(darwin|win|mac|linux|freebsd|sunos)/.exec(n) || [])[0], s = r === "darwin" ? "mac" : r, o = e.agent = e.browser = { platform: s };
          s && (o[s] = !0), n.replace(
            /(opera|chrome|safari|webkit|firefox|msie|trident|atom|node|jsdom)\/?\s*([.\d]+)(?:.*version\/([.\d]+))?(?:.*rv\:v?([.\d]+))?/g,
            function(a, h, u, _, d) {
              if (!o.chrome) {
                var c = h === "opera" ? _ : /^(node|trident)$/.test(h) ? d : u;
                o.version = c, o.versionNumber = parseFloat(c), h = { trident: "msie", jsdom: "node" }[h] || h, o.name = h, o[h] = !0;
              }
            }
          ), o.chrome && delete o.webkit, o.atom && delete o.chrome;
        }
      },
      version: "0.12.18",
      getView: function() {
        var t = this.project;
        return t && t._view;
      },
      getPaper: function() {
        return this;
      },
      execute: function(t, e) {
      },
      install: function(t) {
        var e = this;
        I.each(["project", "view", "tool"], function(n) {
          I.define(t, n, {
            configurable: !0,
            get: function() {
              return e[n];
            }
          });
        });
        for (var i in this)
          !/^_/.test(i) && this[i] && (t[i] = this[i]);
      },
      setup: function(t) {
        return rt = this, this.project = new Yt(t), this;
      },
      createCanvas: function(t, e) {
        return wt.getCanvas(t, e);
      },
      activate: function() {
        rt = this;
      },
      clear: function() {
        for (var t = this.projects, e = this.tools, i = t.length - 1; i >= 0; i--)
          t[i].remove();
        for (var i = e.length - 1; i >= 0; i--)
          e[i].remove();
      },
      remove: function() {
        this.clear(), delete lt._scopes[this._id];
      },
      statics: new function() {
        function t(e) {
          return e += "Attribute", function(i, n) {
            return i[e](n) || i[e]("data-paper-" + n);
          };
        }
        return {
          _scopes: {},
          _id: 0,
          get: function(e) {
            return this._scopes[e] || null;
          },
          getAttribute: t("get"),
          hasAttribute: t("has")
        };
      }()
    }), _t = I.extend(gt, {
      initialize: function(t) {
        this._scope = rt, this._index = this._scope[this._list].push(this) - 1, (t || !this._scope[this._reference]) && this.activate();
      },
      activate: function() {
        if (!this._scope)
          return !1;
        var t = this._scope[this._reference];
        return t && t !== this && t.emit("deactivate"), this._scope[this._reference] = this, this.emit("activate", t), !0;
      },
      isActive: function() {
        return this._scope[this._reference] === this;
      },
      remove: function() {
        return this._index == null ? !1 : (I.splice(this._scope[this._list], null, this._index, 1), this._scope[this._reference] == this && (this._scope[this._reference] = null), this._scope = null, !0);
      },
      getView: function() {
        return this._scope.getView();
      }
    }), yt = {
      findItemBoundsCollisions: function(t, e, i) {
        function n(o) {
          for (var a = new Array(o.length), h = 0; h < o.length; h++) {
            var u = o[h].getBounds();
            a[h] = [u.left, u.top, u.right, u.bottom];
          }
          return a;
        }
        var r = n(t), s = !e || e === t ? r : n(e);
        return this.findBoundsCollisions(r, s, i || 0);
      },
      findCurveBoundsCollisions: function(t, e, i, n) {
        function r(c) {
          for (var l = Math.min, v = Math.max, y = new Array(c.length), C = 0; C < c.length; C++) {
            var p = c[C];
            y[C] = [
              l(p[0], p[2], p[4], p[6]),
              l(p[1], p[3], p[5], p[7]),
              v(p[0], p[2], p[4], p[6]),
              v(p[1], p[3], p[5], p[7])
            ];
          }
          return y;
        }
        var s = r(t), o = !e || e === t ? s : r(e);
        if (n) {
          for (var a = this.findBoundsCollisions(
            s,
            o,
            i || 0,
            !1,
            !0
          ), h = this.findBoundsCollisions(
            s,
            o,
            i || 0,
            !0,
            !0
          ), u = [], _ = 0, d = a.length; _ < d; _++)
            u[_] = { hor: a[_], ver: h[_] };
          return u;
        }
        return this.findBoundsCollisions(s, o, i || 0);
      },
      findBoundsCollisions: function(t, e, i, n, r) {
        var s = !e || t === e, o = s ? t : t.concat(e), a = t.length, h = o.length;
        function u(D, V, K) {
          for (var W = 0, U = D.length; W < U; ) {
            var Z = U + W >>> 1;
            o[D[Z]][V] < K ? W = Z + 1 : U = Z;
          }
          return W - 1;
        }
        for (var _ = n ? 1 : 0, d = _ + 2, c = n ? 0 : 1, l = c + 2, v = new Array(h), y = 0; y < h; y++)
          v[y] = y;
        v.sort(function(D, V) {
          return o[D][_] - o[V][_];
        });
        for (var C = [], p = new Array(a), y = 0; y < h; y++) {
          var m = v[y], f = o[m], g = s ? m : m - a, w = m < a, S = s || !w, x = w ? [] : null;
          if (C.length) {
            var b = u(
              C,
              d,
              f[_] - i
            ) + 1;
            if (C.splice(0, b), s && r) {
              x = x.concat(C);
              for (var P = 0; P < C.length; P++) {
                var T = C[P];
                p[T].push(g);
              }
            } else
              for (var z = f[l], M = f[c], P = 0; P < C.length; P++) {
                var T = C[P], O = o[T], A = T < a, k = s || T >= a;
                (r || (w && k || S && A) && z >= O[c] - i && M <= O[l] + i) && (w && k && x.push(
                  s ? T : T - a
                ), S && A && p[T].push(g));
              }
          }
          if (w && (t === e && x.push(m), p[m] = x), C.length) {
            var N = f[d], E = u(C, d, N);
            C.splice(E + 1, 0, m);
          } else
            C.push(m);
        }
        for (var y = 0; y < p.length; y++) {
          var F = p[y];
          F && F.sort(function(V, K) {
            return V - K;
          });
        }
        return p;
      }
    }, ht = I.extend({
      initialize: function(t) {
        this.precision = I.pick(t, 5), this.multiplier = Math.pow(10, this.precision);
      },
      number: function(t) {
        return this.precision < 16 ? Math.round(t * this.multiplier) / this.multiplier : t;
      },
      pair: function(t, e, i) {
        return this.number(t) + (i || ",") + this.number(e);
      },
      point: function(t, e) {
        return this.number(t.x) + (e || ",") + this.number(t.y);
      },
      size: function(t, e) {
        return this.number(t.width) + (e || ",") + this.number(t.height);
      },
      rectangle: function(t, e) {
        return this.point(t, e) + (e || ",") + this.size(t, e);
      }
    });
    ht.instance = new ht();
    var et = new function() {
      var t = [
        [0.5773502691896257],
        [0, 0.7745966692414834],
        [0.33998104358485626, 0.8611363115940526],
        [0, 0.5384693101056831, 0.906179845938664],
        [0.2386191860831969, 0.6612093864662645, 0.932469514203152],
        [0, 0.4058451513773972, 0.7415311855993945, 0.9491079123427585],
        [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363],
        [0, 0.3242534234038089, 0.6133714327005904, 0.8360311073266358, 0.9681602395076261],
        [0.14887433898163122, 0.4333953941292472, 0.6794095682990244, 0.8650633666889845, 0.9739065285171717],
        [0, 0.26954315595234496, 0.5190961292068118, 0.7301520055740494, 0.8870625997680953, 0.978228658146057],
        [0.1252334085114689, 0.3678314989981802, 0.5873179542866175, 0.7699026741943047, 0.9041172563704749, 0.9815606342467192],
        [0, 0.2304583159551348, 0.44849275103644687, 0.6423493394403402, 0.8015780907333099, 0.9175983992229779, 0.9841830547185881],
        [0.10805494870734367, 0.31911236892788974, 0.5152486363581541, 0.6872929048116855, 0.827201315069765, 0.9284348836635735, 0.9862838086968123],
        [0, 0.20119409399743451, 0.3941513470775634, 0.5709721726085388, 0.7244177313601701, 0.8482065834104272, 0.937273392400706, 0.9879925180204854],
        [0.09501250983763744, 0.2816035507792589, 0.45801677765722737, 0.6178762444026438, 0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499]
      ], e = [
        [1],
        [0.8888888888888888, 0.5555555555555556],
        [0.6521451548625461, 0.34785484513745385],
        [0.5688888888888889, 0.47862867049936647, 0.23692688505618908],
        [0.46791393457269104, 0.3607615730481386, 0.17132449237917036],
        [0.4179591836734694, 0.3818300505051189, 0.27970539148927664, 0.1294849661688697],
        [0.362683783378362, 0.31370664587788727, 0.22238103445337448, 0.10122853629037626],
        [0.3302393550012598, 0.31234707704000286, 0.26061069640293544, 0.1806481606948574, 0.08127438836157441],
        [0.29552422471475287, 0.26926671930999635, 0.21908636251598204, 0.1494513491505806, 0.06667134430868814],
        [0.2729250867779006, 0.26280454451024665, 0.23319376459199048, 0.18629021092773426, 0.1255803694649046, 0.05566856711617366],
        [0.24914704581340277, 0.2334925365383548, 0.20316742672306592, 0.16007832854334622, 0.10693932599531843, 0.04717533638651183],
        [0.2325515532308739, 0.22628318026289723, 0.2078160475368885, 0.17814598076194574, 0.13887351021978725, 0.09212149983772845, 0.04048400476531588],
        [0.2152638534631578, 0.2051984637212956, 0.18553839747793782, 0.15720316715819355, 0.12151857068790319, 0.08015808715976021, 0.03511946033175186],
        [0.2025782419255613, 0.19843148532711158, 0.1861610000155622, 0.16626920581699392, 0.13957067792615432, 0.10715922046717194, 0.07036604748810812, 0.03075324199611727],
        [0.1894506104550685, 0.18260341504492358, 0.16915651939500254, 0.14959598881657674, 0.12462897125553388, 0.09515851168249279, 0.062253523938647894, 0.027152459411754096]
      ], i = Math.abs, n = Math.sqrt, r = Math.pow, s = Math.log2 || function(d) {
        return Math.log(d) * Math.LOG2E;
      }, o = 1e-12, a = 112e-18;
      function h(d, c, l) {
        return d < c ? c : d > l ? l : d;
      }
      function u(d, c, l) {
        function v(b) {
          var P = b * 134217729, T = b - P, z = T + P, M = b - z;
          return [z, M];
        }
        var y = c * c - d * l, C = c * c + d * l;
        if (i(y) * 3 < C) {
          var p = v(d), m = v(c), f = v(l), g = c * c, w = m[0] * m[0] - g + 2 * m[0] * m[1] + m[1] * m[1], S = d * l, x = p[0] * f[0] - S + p[0] * f[1] + p[1] * f[0] + p[1] * f[1];
          y = g - S + (w - x);
        }
        return y;
      }
      function _() {
        var d = Math.max.apply(Math, arguments);
        return d && (d < 1e-8 || d > 1e8) ? r(2, -Math.round(s(d))) : 0;
      }
      return {
        EPSILON: o,
        MACHINE_EPSILON: a,
        CURVETIME_EPSILON: 1e-8,
        GEOMETRIC_EPSILON: 1e-7,
        TRIGONOMETRIC_EPSILON: 1e-8,
        ANGULAR_EPSILON: 1e-5,
        KAPPA: 4 * (n(2) - 1) / 3,
        isZero: function(d) {
          return d >= -o && d <= o;
        },
        isMachineZero: function(d) {
          return d >= -a && d <= a;
        },
        clamp: h,
        integrate: function(d, c, l, v) {
          for (var y = t[v - 2], C = e[v - 2], p = (l - c) * 0.5, m = p + c, f = 0, g = v + 1 >> 1, w = v & 1 ? C[f++] * d(m) : 0; f < g; ) {
            var S = p * y[f];
            w += C[f++] * (d(m + S) + d(m - S));
          }
          return p * w;
        },
        findRoot: function(d, c, l, v, y, C, p) {
          for (var m = 0; m < C; m++) {
            var f = d(l), g = f / c(l), w = l - g;
            if (i(g) < p) {
              l = w;
              break;
            }
            f > 0 ? (y = l, l = w <= v ? (v + y) * 0.5 : w) : (v = l, l = w >= y ? (v + y) * 0.5 : w);
          }
          return h(l, v, y);
        },
        solveQuadratic: function(d, c, l, v, y, C) {
          var p, m = 1 / 0;
          if (i(d) < o) {
            if (i(c) < o)
              return i(l) < o ? -1 : 0;
            p = -l / c;
          } else {
            c *= -0.5;
            var f = u(d, c, l);
            if (f && i(f) < a) {
              var g = _(i(d), i(c), i(l));
              g && (d *= g, c *= g, l *= g, f = u(d, c, l));
            }
            if (f >= -a) {
              var w = f < 0 ? 0 : n(f), S = c + (c < 0 ? -w : w);
              S === 0 ? (p = l / d, m = -p) : (p = S / d, m = l / S);
            }
          }
          var x = 0, b = y == null, P = y - o, T = C + o;
          return isFinite(p) && (b || p > P && p < T) && (v[x++] = b ? p : h(p, y, C)), m !== p && isFinite(m) && (b || m > P && m < T) && (v[x++] = b ? m : h(m, y, C)), x;
        },
        solveCubic: function(d, c, l, v, y, C, p) {
          var m = _(i(d), i(c), i(l), i(v)), f, g, w, S, x;
          m && (d *= m, c *= m, l *= m, v *= m);
          function b(E) {
            f = E;
            var F = d * f;
            g = F + c, w = g * f + l, S = (F + g) * f + w, x = w * f + v;
          }
          if (i(d) < o)
            d = c, g = l, w = v, f = 1 / 0;
          else if (i(v) < o)
            g = c, w = l, f = 0;
          else {
            b(-(c / d) / 3);
            var P = x / d, T = r(i(P), 1 / 3), z = P < 0 ? -1 : 1, M = -S / d, O = M > 0 ? 1.324717957244746 * Math.max(T, n(M)) : T, A = f - z * O;
            if (A !== f) {
              do
                b(A), A = S === 0 ? f : f - x / S / (1 + a);
              while (z * A > z * f);
              i(d) * f * f > i(v / f) && (w = -v / f, g = (w - l) / f);
            }
          }
          var k = et.solveQuadratic(d, g, w, y, C, p), N = C == null;
          return isFinite(f) && (k === 0 || k > 0 && f !== y[0] && f !== y[1]) && (N || f > C - o && f < p + o) && (y[k++] = N ? f : h(f, C, p)), k;
        }
      };
    }(), Ht = {
      _id: 1,
      _pools: {},
      get: function(t) {
        if (t) {
          var e = this._pools[t];
          return e || (e = this._pools[t] = { _id: 1 }), e._id++;
        } else
          return this._id++;
      }
    }, L = I.extend({
      _class: "Point",
      _readIndex: !0,
      initialize: function(e, i) {
        var n = typeof e, r = this.__read, s = 0;
        if (n === "number") {
          var o = typeof i == "number";
          this._set(e, o ? i : e), r && (s = o ? 2 : 1);
        } else if (n === "undefined" || e === null)
          this._set(0, 0), r && (s = e === null ? 1 : 0);
        else {
          var a = n === "string" ? e.split(/[\s,]+/) || [] : e;
          s = 1, Array.isArray(a) ? this._set(+a[0], +(a.length > 1 ? a[1] : a[0])) : "x" in a ? this._set(a.x || 0, a.y || 0) : "width" in a ? this._set(a.width || 0, a.height || 0) : "angle" in a ? (this._set(a.length || 0, 0), this.setAngle(a.angle || 0)) : (this._set(0, 0), s = 0);
        }
        return r && (this.__read = s), this;
      },
      set: "#initialize",
      _set: function(t, e) {
        return this.x = t, this.y = e, this;
      },
      equals: function(t) {
        return this === t || t && (this.x === t.x && this.y === t.y || Array.isArray(t) && this.x === t[0] && this.y === t[1]) || !1;
      },
      clone: function() {
        return new L(this.x, this.y);
      },
      toString: function() {
        var t = ht.instance;
        return "{ x: " + t.number(this.x) + ", y: " + t.number(this.y) + " }";
      },
      _serialize: function(t) {
        var e = t.formatter;
        return [e.number(this.x), e.number(this.y)];
      },
      getLength: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      },
      setLength: function(t) {
        if (this.isZero()) {
          var e = this._angle || 0;
          this._set(
            Math.cos(e) * t,
            Math.sin(e) * t
          );
        } else {
          var i = t / this.getLength();
          et.isZero(i) && this.getAngle(), this._set(
            this.x * i,
            this.y * i
          );
        }
      },
      getAngle: function() {
        return this.getAngleInRadians.apply(this, arguments) * 180 / Math.PI;
      },
      setAngle: function(t) {
        this.setAngleInRadians.call(this, t * Math.PI / 180);
      },
      getAngleInDegrees: "#getAngle",
      setAngleInDegrees: "#setAngle",
      getAngleInRadians: function() {
        if (arguments.length) {
          var t = L.read(arguments), e = this.getLength() * t.getLength();
          if (et.isZero(e))
            return NaN;
          var i = this.dot(t) / e;
          return Math.acos(i < -1 ? -1 : i > 1 ? 1 : i);
        } else
          return this.isZero() ? this._angle || 0 : this._angle = Math.atan2(this.y, this.x);
      },
      setAngleInRadians: function(t) {
        if (this._angle = t, !this.isZero()) {
          var e = this.getLength();
          this._set(
            Math.cos(t) * e,
            Math.sin(t) * e
          );
        }
      },
      getQuadrant: function() {
        return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
      }
    }, {
      beans: !1,
      getDirectedAngle: function() {
        var t = L.read(arguments);
        return Math.atan2(this.cross(t), this.dot(t)) * 180 / Math.PI;
      },
      getDistance: function() {
        var t = arguments, e = L.read(t), i = e.x - this.x, n = e.y - this.y, r = i * i + n * n, s = I.read(t);
        return s ? r : Math.sqrt(r);
      },
      normalize: function(t) {
        t === B && (t = 1);
        var e = this.getLength(), i = e !== 0 ? t / e : 0, n = new L(this.x * i, this.y * i);
        return i >= 0 && (n._angle = this._angle), n;
      },
      rotate: function(t, e) {
        if (t === 0)
          return this.clone();
        t = t * Math.PI / 180;
        var i = e ? this.subtract(e) : this, n = Math.sin(t), r = Math.cos(t);
        return i = new L(
          i.x * r - i.y * n,
          i.x * n + i.y * r
        ), e ? i.add(e) : i;
      },
      transform: function(t) {
        return t ? t._transformPoint(this) : this;
      },
      add: function() {
        var t = L.read(arguments);
        return new L(this.x + t.x, this.y + t.y);
      },
      subtract: function() {
        var t = L.read(arguments);
        return new L(this.x - t.x, this.y - t.y);
      },
      multiply: function() {
        var t = L.read(arguments);
        return new L(this.x * t.x, this.y * t.y);
      },
      divide: function() {
        var t = L.read(arguments);
        return new L(this.x / t.x, this.y / t.y);
      },
      modulo: function() {
        var t = L.read(arguments);
        return new L(this.x % t.x, this.y % t.y);
      },
      negate: function() {
        return new L(-this.x, -this.y);
      },
      isInside: function() {
        return j.read(arguments).contains(this);
      },
      isClose: function() {
        var t = arguments, e = L.read(t), i = I.read(t);
        return this.getDistance(e) <= i;
      },
      isCollinear: function() {
        var t = L.read(arguments);
        return L.isCollinear(this.x, this.y, t.x, t.y);
      },
      isColinear: "#isCollinear",
      isOrthogonal: function() {
        var t = L.read(arguments);
        return L.isOrthogonal(this.x, this.y, t.x, t.y);
      },
      isZero: function() {
        var t = et.isZero;
        return t(this.x) && t(this.y);
      },
      isNaN: function() {
        return isNaN(this.x) || isNaN(this.y);
      },
      isInQuadrant: function(t) {
        return this.x * (t > 1 && t < 4 ? -1 : 1) >= 0 && this.y * (t > 2 ? -1 : 1) >= 0;
      },
      dot: function() {
        var t = L.read(arguments);
        return this.x * t.x + this.y * t.y;
      },
      cross: function() {
        var t = L.read(arguments);
        return this.x * t.y - this.y * t.x;
      },
      project: function() {
        var t = L.read(arguments), e = t.isZero() ? 0 : this.dot(t) / t.dot(t);
        return new L(
          t.x * e,
          t.y * e
        );
      },
      statics: {
        min: function() {
          var t = arguments, e = L.read(t), i = L.read(t);
          return new L(
            Math.min(e.x, i.x),
            Math.min(e.y, i.y)
          );
        },
        max: function() {
          var t = arguments, e = L.read(t), i = L.read(t);
          return new L(
            Math.max(e.x, i.x),
            Math.max(e.y, i.y)
          );
        },
        random: function() {
          return new L(Math.random(), Math.random());
        },
        isCollinear: function(t, e, i, n) {
          return Math.abs(t * n - e * i) <= Math.sqrt((t * t + e * e) * (i * i + n * n)) * 1e-8;
        },
        isOrthogonal: function(t, e, i, n) {
          return Math.abs(t * i + e * n) <= Math.sqrt((t * t + e * e) * (i * i + n * n)) * 1e-8;
        }
      }
    }, I.each(["round", "ceil", "floor", "abs"], function(t) {
      var e = Math[t];
      this[t] = function() {
        return new L(e(this.x), e(this.y));
      };
    }, {})), Dt = L.extend({
      initialize: function(e, i, n, r) {
        this._x = e, this._y = i, this._owner = n, this._setter = r;
      },
      _set: function(t, e, i) {
        return this._x = t, this._y = e, i || this._owner[this._setter](this), this;
      },
      getX: function() {
        return this._x;
      },
      setX: function(t) {
        this._x = t, this._owner[this._setter](this);
      },
      getY: function() {
        return this._y;
      },
      setY: function(t) {
        this._y = t, this._owner[this._setter](this);
      },
      isSelected: function() {
        return !!(this._owner._selection & this._getSelection());
      },
      setSelected: function(t) {
        this._owner._changeSelection(this._getSelection(), t);
      },
      _getSelection: function() {
        return this._setter === "setPosition" ? 4 : 0;
      }
    }), G = I.extend({
      _class: "Size",
      _readIndex: !0,
      initialize: function(e, i) {
        var n = typeof e, r = this.__read, s = 0;
        if (n === "number") {
          var o = typeof i == "number";
          this._set(e, o ? i : e), r && (s = o ? 2 : 1);
        } else if (n === "undefined" || e === null)
          this._set(0, 0), r && (s = e === null ? 1 : 0);
        else {
          var a = n === "string" ? e.split(/[\s,]+/) || [] : e;
          s = 1, Array.isArray(a) ? this._set(+a[0], +(a.length > 1 ? a[1] : a[0])) : "width" in a ? this._set(a.width || 0, a.height || 0) : "x" in a ? this._set(a.x || 0, a.y || 0) : (this._set(0, 0), s = 0);
        }
        return r && (this.__read = s), this;
      },
      set: "#initialize",
      _set: function(t, e) {
        return this.width = t, this.height = e, this;
      },
      equals: function(t) {
        return t === this || t && (this.width === t.width && this.height === t.height || Array.isArray(t) && this.width === t[0] && this.height === t[1]) || !1;
      },
      clone: function() {
        return new G(this.width, this.height);
      },
      toString: function() {
        var t = ht.instance;
        return "{ width: " + t.number(this.width) + ", height: " + t.number(this.height) + " }";
      },
      _serialize: function(t) {
        var e = t.formatter;
        return [
          e.number(this.width),
          e.number(this.height)
        ];
      },
      add: function() {
        var t = G.read(arguments);
        return new G(this.width + t.width, this.height + t.height);
      },
      subtract: function() {
        var t = G.read(arguments);
        return new G(this.width - t.width, this.height - t.height);
      },
      multiply: function() {
        var t = G.read(arguments);
        return new G(this.width * t.width, this.height * t.height);
      },
      divide: function() {
        var t = G.read(arguments);
        return new G(this.width / t.width, this.height / t.height);
      },
      modulo: function() {
        var t = G.read(arguments);
        return new G(this.width % t.width, this.height % t.height);
      },
      negate: function() {
        return new G(-this.width, -this.height);
      },
      isZero: function() {
        var t = et.isZero;
        return t(this.width) && t(this.height);
      },
      isNaN: function() {
        return isNaN(this.width) || isNaN(this.height);
      },
      statics: {
        min: function(t, e) {
          return new G(
            Math.min(t.width, e.width),
            Math.min(t.height, e.height)
          );
        },
        max: function(t, e) {
          return new G(
            Math.max(t.width, e.width),
            Math.max(t.height, e.height)
          );
        },
        random: function() {
          return new G(Math.random(), Math.random());
        }
      }
    }, I.each(["round", "ceil", "floor", "abs"], function(t) {
      var e = Math[t];
      this[t] = function() {
        return new G(e(this.width), e(this.height));
      };
    }, {})), Wt = G.extend({
      initialize: function(e, i, n, r) {
        this._width = e, this._height = i, this._owner = n, this._setter = r;
      },
      _set: function(t, e, i) {
        return this._width = t, this._height = e, i || this._owner[this._setter](this), this;
      },
      getWidth: function() {
        return this._width;
      },
      setWidth: function(t) {
        this._width = t, this._owner[this._setter](this);
      },
      getHeight: function() {
        return this._height;
      },
      setHeight: function(t) {
        this._height = t, this._owner[this._setter](this);
      }
    }), j = I.extend({
      _class: "Rectangle",
      _readIndex: !0,
      beans: !0,
      initialize: function(e, i, n, r) {
        var s = arguments, o = typeof e, a;
        if (o === "number" ? (this._set(e, i, n, r), a = 4) : o === "undefined" || e === null ? (this._set(0, 0, 0, 0), a = e === null ? 1 : 0) : s.length === 1 && (Array.isArray(e) ? (this._set.apply(this, e), a = 1) : e.x !== B || e.width !== B ? (this._set(
          e.x || 0,
          e.y || 0,
          e.width || 0,
          e.height || 0
        ), a = 1) : e.from === B && e.to === B && (this._set(0, 0, 0, 0), I.readSupported(s, this) && (a = 1))), a === B) {
          var h = L.readNamed(s, "from"), u = I.peek(s), _ = h.x, d = h.y, c, l;
          if (u && u.x !== B || I.hasNamed(s, "to")) {
            var v = L.readNamed(s, "to");
            c = v.x - _, l = v.y - d, c < 0 && (_ = v.x, c = -c), l < 0 && (d = v.y, l = -l);
          } else {
            var y = G.read(s);
            c = y.width, l = y.height;
          }
          this._set(_, d, c, l), a = s.__index;
        }
        var C = s.__filtered;
        return C && (this.__filtered = C), this.__read && (this.__read = a), this;
      },
      set: "#initialize",
      _set: function(t, e, i, n) {
        return this.x = t, this.y = e, this.width = i, this.height = n, this;
      },
      clone: function() {
        return new j(this.x, this.y, this.width, this.height);
      },
      equals: function(t) {
        var e = I.isPlainValue(t) ? j.read(arguments) : t;
        return e === this || e && this.x === e.x && this.y === e.y && this.width === e.width && this.height === e.height || !1;
      },
      toString: function() {
        var t = ht.instance;
        return "{ x: " + t.number(this.x) + ", y: " + t.number(this.y) + ", width: " + t.number(this.width) + ", height: " + t.number(this.height) + " }";
      },
      _serialize: function(t) {
        var e = t.formatter;
        return [
          e.number(this.x),
          e.number(this.y),
          e.number(this.width),
          e.number(this.height)
        ];
      },
      getPoint: function(t) {
        var e = t ? L : Dt;
        return new e(this.x, this.y, this, "setPoint");
      },
      setPoint: function() {
        var t = L.read(arguments);
        this.x = t.x, this.y = t.y;
      },
      getSize: function(t) {
        var e = t ? G : Wt;
        return new e(this.width, this.height, this, "setSize");
      },
      _fw: 1,
      _fh: 1,
      setSize: function() {
        var t = G.read(arguments), e = this._sx, i = this._sy, n = t.width, r = t.height;
        e && (this.x += (this.width - n) * e), i && (this.y += (this.height - r) * i), this.width = n, this.height = r, this._fw = this._fh = 1;
      },
      getLeft: function() {
        return this.x;
      },
      setLeft: function(t) {
        if (!this._fw) {
          var e = t - this.x;
          this.width -= this._sx === 0.5 ? e * 2 : e;
        }
        this.x = t, this._sx = this._fw = 0;
      },
      getTop: function() {
        return this.y;
      },
      setTop: function(t) {
        if (!this._fh) {
          var e = t - this.y;
          this.height -= this._sy === 0.5 ? e * 2 : e;
        }
        this.y = t, this._sy = this._fh = 0;
      },
      getRight: function() {
        return this.x + this.width;
      },
      setRight: function(t) {
        if (!this._fw) {
          var e = t - this.x;
          this.width = this._sx === 0.5 ? e * 2 : e;
        }
        this.x = t - this.width, this._sx = 1, this._fw = 0;
      },
      getBottom: function() {
        return this.y + this.height;
      },
      setBottom: function(t) {
        if (!this._fh) {
          var e = t - this.y;
          this.height = this._sy === 0.5 ? e * 2 : e;
        }
        this.y = t - this.height, this._sy = 1, this._fh = 0;
      },
      getCenterX: function() {
        return this.x + this.width / 2;
      },
      setCenterX: function(t) {
        this._fw || this._sx === 0.5 ? this.x = t - this.width / 2 : (this._sx && (this.x += (t - this.x) * 2 * this._sx), this.width = (t - this.x) * 2), this._sx = 0.5, this._fw = 0;
      },
      getCenterY: function() {
        return this.y + this.height / 2;
      },
      setCenterY: function(t) {
        this._fh || this._sy === 0.5 ? this.y = t - this.height / 2 : (this._sy && (this.y += (t - this.y) * 2 * this._sy), this.height = (t - this.y) * 2), this._sy = 0.5, this._fh = 0;
      },
      getCenter: function(t) {
        var e = t ? L : Dt;
        return new e(this.getCenterX(), this.getCenterY(), this, "setCenter");
      },
      setCenter: function() {
        var t = L.read(arguments);
        return this.setCenterX(t.x), this.setCenterY(t.y), this;
      },
      getArea: function() {
        return this.width * this.height;
      },
      isEmpty: function() {
        return this.width === 0 || this.height === 0;
      },
      contains: function(t) {
        return t && t.width !== B || (Array.isArray(t) ? t : arguments).length === 4 ? this._containsRectangle(j.read(arguments)) : this._containsPoint(L.read(arguments));
      },
      _containsPoint: function(t) {
        var e = t.x, i = t.y;
        return e >= this.x && i >= this.y && e <= this.x + this.width && i <= this.y + this.height;
      },
      _containsRectangle: function(t) {
        var e = t.x, i = t.y;
        return e >= this.x && i >= this.y && e + t.width <= this.x + this.width && i + t.height <= this.y + this.height;
      },
      intersects: function() {
        var t = j.read(arguments), e = I.read(arguments) || 0;
        return t.x + t.width > this.x - e && t.y + t.height > this.y - e && t.x < this.x + this.width + e && t.y < this.y + this.height + e;
      },
      intersect: function() {
        var t = j.read(arguments), e = Math.max(this.x, t.x), i = Math.max(this.y, t.y), n = Math.min(this.x + this.width, t.x + t.width), r = Math.min(this.y + this.height, t.y + t.height);
        return new j(e, i, n - e, r - i);
      },
      unite: function() {
        var t = j.read(arguments), e = Math.min(this.x, t.x), i = Math.min(this.y, t.y), n = Math.max(this.x + this.width, t.x + t.width), r = Math.max(this.y + this.height, t.y + t.height);
        return new j(e, i, n - e, r - i);
      },
      include: function() {
        var t = L.read(arguments), e = Math.min(this.x, t.x), i = Math.min(this.y, t.y), n = Math.max(this.x + this.width, t.x), r = Math.max(this.y + this.height, t.y);
        return new j(e, i, n - e, r - i);
      },
      expand: function() {
        var t = G.read(arguments), e = t.width, i = t.height;
        return new j(
          this.x - e / 2,
          this.y - i / 2,
          this.width + e,
          this.height + i
        );
      },
      scale: function(t, e) {
        return this.expand(
          this.width * t - this.width,
          this.height * (e === B ? t : e) - this.height
        );
      }
    }, I.each(
      [
        ["Top", "Left"],
        ["Top", "Right"],
        ["Bottom", "Left"],
        ["Bottom", "Right"],
        ["Left", "Center"],
        ["Top", "Center"],
        ["Right", "Center"],
        ["Bottom", "Center"]
      ],
      function(t, e) {
        var i = t.join(""), n = /^[RL]/.test(i);
        e >= 4 && (t[1] += n ? "Y" : "X");
        var r = t[n ? 0 : 1], s = t[n ? 1 : 0], o = "get" + r, a = "get" + s, h = "set" + r, u = "set" + s, _ = "get" + i, d = "set" + i;
        this[_] = function(c) {
          var l = c ? L : Dt;
          return new l(this[o](), this[a](), this, d);
        }, this[d] = function() {
          var c = L.read(arguments);
          this[h](c.x), this[u](c.y);
        };
      },
      {
        beans: !0
      }
    )), pe = j.extend(
      {
        initialize: function(e, i, n, r, s, o) {
          this._set(e, i, n, r, !0), this._owner = s, this._setter = o;
        },
        _set: function(t, e, i, n, r) {
          return this._x = t, this._y = e, this._width = i, this._height = n, r || this._owner[this._setter](this), this;
        }
      },
      new function() {
        var t = j.prototype;
        return I.each(
          ["x", "y", "width", "height"],
          function(e) {
            var i = I.capitalize(e), n = "_" + e;
            this["get" + i] = function() {
              return this[n];
            }, this["set" + i] = function(r) {
              this[n] = r, this._dontNotify || this._owner[this._setter](this);
            };
          },
          I.each(
            [
              "Point",
              "Size",
              "Center",
              "Left",
              "Top",
              "Right",
              "Bottom",
              "CenterX",
              "CenterY",
              "TopLeft",
              "TopRight",
              "BottomLeft",
              "BottomRight",
              "LeftCenter",
              "TopCenter",
              "RightCenter",
              "BottomCenter"
            ],
            function(e) {
              var i = "set" + e;
              this[i] = function() {
                this._dontNotify = !0, t[i].apply(this, arguments), this._dontNotify = !1, this._owner[this._setter](this);
              };
            },
            {
              isSelected: function() {
                return !!(this._owner._selection & 2);
              },
              setSelected: function(e) {
                var i = this._owner;
                i._changeSelection && i._changeSelection(2, e);
              }
            }
          )
        );
      }()
    ), ft = I.extend({
      _class: "Matrix",
      initialize: function t(e, i) {
        var n = arguments, r = n.length, s = !0;
        if (r >= 6 ? this._set.apply(this, n) : r === 1 || r === 2 ? e instanceof t ? this._set(
          e._a,
          e._b,
          e._c,
          e._d,
          e._tx,
          e._ty,
          i
        ) : Array.isArray(e) ? this._set.apply(
          this,
          i ? e.concat([i]) : e
        ) : s = !1 : r ? s = !1 : this.reset(), !s)
          throw new Error("Unsupported matrix parameters");
        return this;
      },
      set: "#initialize",
      _set: function(t, e, i, n, r, s, o) {
        return this._a = t, this._b = e, this._c = i, this._d = n, this._tx = r, this._ty = s, o || this._changed(), this;
      },
      _serialize: function(t, e) {
        return I.serialize(this.getValues(), t, !0, e);
      },
      _changed: function() {
        var t = this._owner;
        t && (t._applyMatrix ? t.transform(null, !0) : t._changed(25));
      },
      clone: function() {
        return new ft(
          this._a,
          this._b,
          this._c,
          this._d,
          this._tx,
          this._ty
        );
      },
      equals: function(t) {
        return t === this || t && this._a === t._a && this._b === t._b && this._c === t._c && this._d === t._d && this._tx === t._tx && this._ty === t._ty;
      },
      toString: function() {
        var t = ht.instance;
        return "[[" + [
          t.number(this._a),
          t.number(this._c),
          t.number(this._tx)
        ].join(", ") + "], [" + [
          t.number(this._b),
          t.number(this._d),
          t.number(this._ty)
        ].join(", ") + "]]";
      },
      reset: function(t) {
        return this._a = this._d = 1, this._b = this._c = this._tx = this._ty = 0, t || this._changed(), this;
      },
      apply: function(t, e) {
        var i = this._owner;
        return i ? (i.transform(null, I.pick(t, !0), e), this.isIdentity()) : !1;
      },
      translate: function() {
        var t = L.read(arguments), e = t.x, i = t.y;
        return this._tx += e * this._a + i * this._c, this._ty += e * this._b + i * this._d, this._changed(), this;
      },
      scale: function() {
        var t = arguments, e = L.read(t), i = L.read(t, 0, { readNull: !0 });
        return i && this.translate(i), this._a *= e.x, this._b *= e.x, this._c *= e.y, this._d *= e.y, i && this.translate(i.negate()), this._changed(), this;
      },
      rotate: function(t) {
        t *= Math.PI / 180;
        var e = L.read(arguments, 1), i = e.x, n = e.y, r = Math.cos(t), s = Math.sin(t), o = i - i * r + n * s, a = n - i * s - n * r, h = this._a, u = this._b, _ = this._c, d = this._d;
        return this._a = r * h + s * _, this._b = r * u + s * d, this._c = -s * h + r * _, this._d = -s * u + r * d, this._tx += o * h + a * _, this._ty += o * u + a * d, this._changed(), this;
      },
      shear: function() {
        var t = arguments, e = L.read(t), i = L.read(t, 0, { readNull: !0 });
        i && this.translate(i);
        var n = this._a, r = this._b;
        return this._a += e.y * this._c, this._b += e.y * this._d, this._c += e.x * n, this._d += e.x * r, i && this.translate(i.negate()), this._changed(), this;
      },
      skew: function() {
        var t = arguments, e = L.read(t), i = L.read(t, 0, { readNull: !0 }), n = Math.PI / 180, r = new L(
          Math.tan(e.x * n),
          Math.tan(e.y * n)
        );
        return this.shear(r, i);
      },
      append: function(t, e) {
        if (t) {
          var i = this._a, n = this._b, r = this._c, s = this._d, o = t._a, a = t._c, h = t._b, u = t._d, _ = t._tx, d = t._ty;
          this._a = o * i + h * r, this._c = a * i + u * r, this._b = o * n + h * s, this._d = a * n + u * s, this._tx += _ * i + d * r, this._ty += _ * n + d * s, e || this._changed();
        }
        return this;
      },
      prepend: function(t, e) {
        if (t) {
          var i = this._a, n = this._b, r = this._c, s = this._d, o = this._tx, a = this._ty, h = t._a, u = t._c, _ = t._b, d = t._d, c = t._tx, l = t._ty;
          this._a = h * i + u * n, this._c = h * r + u * s, this._b = _ * i + d * n, this._d = _ * r + d * s, this._tx = h * o + u * a + c, this._ty = _ * o + d * a + l, e || this._changed();
        }
        return this;
      },
      appended: function(t) {
        return this.clone().append(t);
      },
      prepended: function(t) {
        return this.clone().prepend(t);
      },
      invert: function() {
        var t = this._a, e = this._b, i = this._c, n = this._d, r = this._tx, s = this._ty, o = t * n - e * i, a = null;
        return o && !isNaN(o) && isFinite(r) && isFinite(s) && (this._a = n / o, this._b = -e / o, this._c = -i / o, this._d = t / o, this._tx = (i * s - n * r) / o, this._ty = (e * r - t * s) / o, a = this), a;
      },
      inverted: function() {
        return this.clone().invert();
      },
      concatenate: "#append",
      preConcatenate: "#prepend",
      chain: "#appended",
      _shiftless: function() {
        return new ft(this._a, this._b, this._c, this._d, 0, 0);
      },
      _orNullIfIdentity: function() {
        return this.isIdentity() ? null : this;
      },
      isIdentity: function() {
        return this._a === 1 && this._b === 0 && this._c === 0 && this._d === 1 && this._tx === 0 && this._ty === 0;
      },
      isInvertible: function() {
        var t = this._a * this._d - this._c * this._b;
        return t && !isNaN(t) && isFinite(this._tx) && isFinite(this._ty);
      },
      isSingular: function() {
        return !this.isInvertible();
      },
      transform: function(t, e, i) {
        return arguments.length < 3 ? this._transformPoint(L.read(arguments)) : this._transformCoordinates(t, e, i);
      },
      _transformPoint: function(t, e, i) {
        var n = t.x, r = t.y;
        return e || (e = new L()), e._set(
          n * this._a + r * this._c + this._tx,
          n * this._b + r * this._d + this._ty,
          i
        );
      },
      _transformCoordinates: function(t, e, i) {
        for (var n = 0, r = 2 * i; n < r; n += 2) {
          var s = t[n], o = t[n + 1];
          e[n] = s * this._a + o * this._c + this._tx, e[n + 1] = s * this._b + o * this._d + this._ty;
        }
        return e;
      },
      _transformCorners: function(t) {
        var e = t.x, i = t.y, n = e + t.width, r = i + t.height, s = [e, i, n, i, n, r, e, r];
        return this._transformCoordinates(s, s, 4);
      },
      _transformBounds: function(t, e, i) {
        for (var n = this._transformCorners(t), r = n.slice(0, 2), s = r.slice(), o = 2; o < 8; o++) {
          var a = n[o], h = o & 1;
          a < r[h] ? r[h] = a : a > s[h] && (s[h] = a);
        }
        return e || (e = new j()), e._set(
          r[0],
          r[1],
          s[0] - r[0],
          s[1] - r[1],
          i
        );
      },
      inverseTransform: function() {
        return this._inverseTransform(L.read(arguments));
      },
      _inverseTransform: function(t, e, i) {
        var n = this._a, r = this._b, s = this._c, o = this._d, a = this._tx, h = this._ty, u = n * o - r * s, _ = null;
        if (u && !isNaN(u) && isFinite(a) && isFinite(h)) {
          var d = t.x - this._tx, c = t.y - this._ty;
          e || (e = new L()), _ = e._set(
            (d * o - c * s) / u,
            (c * n - d * r) / u,
            i
          );
        }
        return _;
      },
      decompose: function() {
        var t = this._a, e = this._b, i = this._c, n = this._d, r = t * n - e * i, s = Math.sqrt, o = Math.atan2, a = 180 / Math.PI, h, u, _;
        if (t !== 0 || e !== 0) {
          var d = s(t * t + e * e);
          h = Math.acos(t / d) * (e > 0 ? 1 : -1), u = [d, r / d], _ = [o(t * i + e * n, d * d), 0];
        } else if (i !== 0 || n !== 0) {
          var c = s(i * i + n * n);
          h = Math.asin(i / c) * (n > 0 ? 1 : -1), u = [r / c, c], _ = [0, o(t * i + e * n, c * c)];
        } else
          h = 0, _ = u = [0, 0];
        return {
          translation: this.getTranslation(),
          rotation: h * a,
          scaling: new L(u),
          skewing: new L(_[0] * a, _[1] * a)
        };
      },
      getValues: function() {
        return [this._a, this._b, this._c, this._d, this._tx, this._ty];
      },
      getTranslation: function() {
        return new L(this._tx, this._ty);
      },
      getScaling: function() {
        return this.decompose().scaling;
      },
      getRotation: function() {
        return this.decompose().rotation;
      },
      applyToContext: function(t) {
        this.isIdentity() || t.transform(
          this._a,
          this._b,
          this._c,
          this._d,
          this._tx,
          this._ty
        );
      }
    }, I.each(["a", "b", "c", "d", "tx", "ty"], function(t) {
      var e = I.capitalize(t), i = "_" + t;
      this["get" + e] = function() {
        return this[i];
      }, this["set" + e] = function(n) {
        this[i] = n, this._changed();
      };
    }, {})), Pt = I.extend({
      _class: "Line",
      initialize: function(e, i, n, r, s) {
        var o = !1;
        arguments.length >= 4 ? (this._px = e, this._py = i, this._vx = n, this._vy = r, o = s) : (this._px = e.x, this._py = e.y, this._vx = i.x, this._vy = i.y, o = n), o || (this._vx -= this._px, this._vy -= this._py);
      },
      getPoint: function() {
        return new L(this._px, this._py);
      },
      getVector: function() {
        return new L(this._vx, this._vy);
      },
      getLength: function() {
        return this.getVector().getLength();
      },
      intersect: function(t, e) {
        return Pt.intersect(
          this._px,
          this._py,
          this._vx,
          this._vy,
          t._px,
          t._py,
          t._vx,
          t._vy,
          !0,
          e
        );
      },
      getSide: function(t, e) {
        return Pt.getSide(
          this._px,
          this._py,
          this._vx,
          this._vy,
          t.x,
          t.y,
          !0,
          e
        );
      },
      getDistance: function(t) {
        return Math.abs(this.getSignedDistance(t));
      },
      getSignedDistance: function(t) {
        return Pt.getSignedDistance(
          this._px,
          this._py,
          this._vx,
          this._vy,
          t.x,
          t.y,
          !0
        );
      },
      isCollinear: function(t) {
        return L.isCollinear(this._vx, this._vy, t._vx, t._vy);
      },
      isOrthogonal: function(t) {
        return L.isOrthogonal(this._vx, this._vy, t._vx, t._vy);
      },
      statics: {
        intersect: function(t, e, i, n, r, s, o, a, h, u) {
          h || (i -= t, n -= e, o -= r, a -= s);
          var _ = i * a - n * o;
          if (!et.isMachineZero(_)) {
            var d = t - r, c = e - s, l = (o * c - a * d) / _, v = (i * c - n * d) / _, y = 1e-12, C = -y, p = 1 + y;
            if (u || C < l && l < p && C < v && v < p)
              return u || (l = l <= 0 ? 0 : l >= 1 ? 1 : l), new L(
                t + l * i,
                e + l * n
              );
          }
        },
        getSide: function(t, e, i, n, r, s, o, a) {
          o || (i -= t, n -= e);
          var h = r - t, u = s - e, _ = h * n - u * i;
          return !a && et.isMachineZero(_) && (_ = (h * i + h * i) / (i * i + n * n), _ >= 0 && _ <= 1 && (_ = 0)), _ < 0 ? -1 : _ > 0 ? 1 : 0;
        },
        getSignedDistance: function(t, e, i, n, r, s, o) {
          return o || (i -= t, n -= e), i === 0 ? n > 0 ? r - t : t - r : n === 0 ? i < 0 ? s - e : e - s : ((r - t) * n - (s - e) * i) / (n > i ? n * Math.sqrt(1 + i * i / (n * n)) : i * Math.sqrt(1 + n * n / (i * i)));
        },
        getDistance: function(t, e, i, n, r, s, o) {
          return Math.abs(
            Pt.getSignedDistance(t, e, i, n, r, s, o)
          );
        }
      }
    }), Yt = _t.extend({
      _class: "Project",
      _list: "projects",
      _reference: "project",
      _compactSerialize: !0,
      initialize: function(e) {
        _t.call(this, !0), this._children = [], this._namedChildren = {}, this._activeLayer = null, this._currentStyle = new ae(null, null, this), this._view = pt.create(
          this,
          e || wt.getCanvas(1, 1)
        ), this._selectionItems = {}, this._selectionCount = 0, this._updateVersion = 0;
      },
      _serialize: function(t, e) {
        return I.serialize(this._children, t, !0, e);
      },
      _changed: function(t, e) {
        if (t & 1) {
          var i = this._view;
          i && (i._needsUpdate = !0, !i._requested && i._autoUpdate && i.requestUpdate());
        }
        var n = this._changes;
        if (n && e) {
          var r = this._changesById, s = e._id, o = r[s];
          o ? o.flags |= t : n.push(r[s] = { item: e, flags: t });
        }
      },
      clear: function() {
        for (var t = this._children, e = t.length - 1; e >= 0; e--)
          t[e].remove();
      },
      isEmpty: function() {
        return !this._children.length;
      },
      remove: function t() {
        return t.base.call(this) ? (this._view && this._view.remove(), !0) : !1;
      },
      getView: function() {
        return this._view;
      },
      getCurrentStyle: function() {
        return this._currentStyle;
      },
      setCurrentStyle: function(t) {
        this._currentStyle.set(t);
      },
      getIndex: function() {
        return this._index;
      },
      getOptions: function() {
        return this._scope.settings;
      },
      getLayers: function() {
        return this._children;
      },
      getActiveLayer: function() {
        return this._activeLayer || new Jt({ project: this, insert: !0 });
      },
      getSymbolDefinitions: function() {
        var t = [], e = {};
        return this.getItems({
          class: ne,
          match: function(i) {
            var n = i._definition, r = n._id;
            return e[r] || (e[r] = !0, t.push(n)), !1;
          }
        }), t;
      },
      getSymbols: "getSymbolDefinitions",
      getSelectedItems: function() {
        var t = this._selectionItems, e = [];
        for (var i in t) {
          var n = t[i], r = n._selection;
          r & 1 && n.isInserted() ? e.push(n) : r || this._updateSelection(n);
        }
        return e;
      },
      _updateSelection: function(t) {
        var e = t._id, i = this._selectionItems;
        t._selection ? i[e] !== t && (this._selectionCount++, i[e] = t) : i[e] === t && (this._selectionCount--, delete i[e]);
      },
      selectAll: function() {
        for (var t = this._children, e = 0, i = t.length; e < i; e++)
          t[e].setFullySelected(!0);
      },
      deselectAll: function() {
        var t = this._selectionItems;
        for (var e in t)
          t[e].setFullySelected(!1);
      },
      addLayer: function(t) {
        return this.insertLayer(B, t);
      },
      insertLayer: function(t, e) {
        if (e instanceof Jt) {
          e._remove(!1, !0), I.splice(this._children, [e], t, 0), e._setProject(this, !0);
          var i = e._name;
          i && e.setName(i), this._changes && e._changed(5), this._activeLayer || (this._activeLayer = e);
        } else
          e = null;
        return e;
      },
      _insertItem: function(t, e, i) {
        return e = this.insertLayer(t, e) || (this._activeLayer || this._insertItem(
          B,
          new Jt($.NO_INSERT),
          !0
        )).insertChild(t, e), i && e.activate && e.activate(), e;
      },
      getItems: function(t) {
        return $._getItems(this, t);
      },
      getItem: function(t) {
        return $._getItems(this, t, null, null, !0)[0] || null;
      },
      importJSON: function(t) {
        this.activate();
        var e = this._activeLayer;
        return I.importJSON(t, e && e.isEmpty() && e);
      },
      removeOn: function(t) {
        var e = this._removeSets;
        if (e) {
          t === "mouseup" && (e.mousedrag = null);
          var i = e[t];
          if (i) {
            for (var n in i) {
              var r = i[n];
              for (var s in e) {
                var o = e[s];
                o && o != i && delete o[r._id];
              }
              r.remove();
            }
            e[t] = null;
          }
        }
      },
      draw: function(t, e, i) {
        this._updateVersion++, t.save(), e.applyToContext(t);
        for (var n = this._children, r = new I({
          offset: new L(0, 0),
          pixelRatio: i,
          viewMatrix: e.isIdentity() ? null : e,
          matrices: [new ft()],
          updateMatrix: !0
        }), s = 0, o = n.length; s < o; s++)
          n[s].draw(t, r);
        if (t.restore(), this._selectionCount > 0) {
          t.save(), t.strokeWidth = 1;
          var a = this._selectionItems, h = this._scope.settings.handleSize, u = this._updateVersion;
          for (var _ in a)
            a[_]._drawSelection(t, e, h, a, u);
          t.restore();
        }
      }
    }), $ = I.extend(
      gt,
      {
        statics: {
          extend: function t(e) {
            return e._serializeFields && (e._serializeFields = I.set(
              {},
              this.prototype._serializeFields,
              e._serializeFields
            )), t.base.apply(this, arguments);
          },
          INSERT: { insert: !0 },
          NO_INSERT: { insert: !1 }
        },
        _class: "Item",
        _name: null,
        _applyMatrix: !0,
        _canApplyMatrix: !0,
        _canScaleStroke: !1,
        _pivot: null,
        _visible: !0,
        _blendMode: "normal",
        _opacity: 1,
        _locked: !1,
        _guide: !1,
        _clipMask: !1,
        _selection: 0,
        _selectBounds: !0,
        _selectChildren: !1,
        _serializeFields: {
          name: null,
          applyMatrix: null,
          matrix: new ft(),
          pivot: null,
          visible: !0,
          blendMode: "normal",
          opacity: 1,
          locked: !1,
          guide: !1,
          clipMask: !1,
          selected: !1,
          data: {}
        },
        _prioritize: ["applyMatrix"]
      },
      new function() {
        var t = [
          "onMouseDown",
          "onMouseUp",
          "onMouseDrag",
          "onClick",
          "onDoubleClick",
          "onMouseMove",
          "onMouseEnter",
          "onMouseLeave"
        ];
        return I.each(
          t,
          function(e) {
            this._events[e] = {
              install: function(i) {
                this.getView()._countItemEvent(i, 1);
              },
              uninstall: function(i) {
                this.getView()._countItemEvent(i, -1);
              }
            };
          },
          {
            _events: {
              onFrame: {
                install: function() {
                  this.getView()._animateItem(this, !0);
                },
                uninstall: function() {
                  this.getView()._animateItem(this, !1);
                }
              },
              onLoad: {},
              onError: {}
            },
            statics: {
              _itemHandlers: t
            }
          }
        );
      }(),
      {
        initialize: function() {
        },
        _initialize: function(t, e) {
          var i = t && I.isPlainObject(t), n = i && t.internal === !0, r = this._matrix = new ft(), s = i && t.project || rt.project, o = rt.settings;
          return this._id = n ? null : Ht.get(), this._parent = this._index = null, this._applyMatrix = this._canApplyMatrix && o.applyMatrix, e && r.translate(e), r._owner = this, this._style = new ae(s._currentStyle, this, s), n || i && t.insert == !1 || !o.insertItems && !(i && t.insert == !0) ? this._setProject(s) : (i && t.parent || s)._insertItem(B, this, !0), i && t !== $.NO_INSERT && t !== $.INSERT && this.set(t, {
            internal: !0,
            insert: !0,
            project: !0,
            parent: !0
          }), i;
        },
        _serialize: function(t, e) {
          var i = {}, n = this;
          function r(s) {
            for (var o in s) {
              var a = n[o];
              I.equals(a, o === "leading" ? s.fontSize * 1.2 : s[o]) || (i[o] = I.serialize(
                a,
                t,
                o !== "data",
                e
              ));
            }
          }
          return r(this._serializeFields), this instanceof Bt || r(this._style._defaults), [this._class, i];
        },
        _changed: function(t) {
          var e = this._symbol, i = this._parent || e, n = this._project;
          t & 8 && (this._bounds = this._position = this._decomposed = B), t & 16 && (this._globalMatrix = B), i && t & 72 && $._clearBoundsCache(i), t & 2 && $._clearBoundsCache(this), n && n._changed(t, this), e && e._changed(t);
        },
        getId: function() {
          return this._id;
        },
        getName: function() {
          return this._name;
        },
        setName: function(t) {
          if (this._name && this._removeNamed(), t === +t + "")
            throw new Error(
              "Names consisting only of numbers are not supported."
            );
          var e = this._getOwner();
          if (t && e) {
            var i = e._children, n = e._namedChildren;
            (n[t] = n[t] || []).push(this), t in i || (i[t] = this);
          }
          this._name = t || B, this._changed(256);
        },
        getStyle: function() {
          return this._style;
        },
        setStyle: function(t) {
          this.getStyle().set(t);
        }
      },
      I.each(
        ["locked", "visible", "blendMode", "opacity", "guide"],
        function(t) {
          var e = I.capitalize(t), i = "_" + t, n = {
            locked: 256,
            visible: 265
          };
          this["get" + e] = function() {
            return this[i];
          }, this["set" + e] = function(r) {
            r != this[i] && (this[i] = r, this._changed(n[t] || 257));
          };
        },
        {}
      ),
      {
        beans: !0,
        getSelection: function() {
          return this._selection;
        },
        setSelection: function(t) {
          if (t !== this._selection) {
            this._selection = t;
            var e = this._project;
            e && (e._updateSelection(this), this._changed(257));
          }
        },
        _changeSelection: function(t, e) {
          var i = this._selection;
          this.setSelection(e ? i | t : i & ~t);
        },
        isSelected: function() {
          if (this._selectChildren) {
            for (var t = this._children, e = 0, i = t.length; e < i; e++)
              if (t[e].isSelected())
                return !0;
          }
          return !!(this._selection & 1);
        },
        setSelected: function(t) {
          if (this._selectChildren)
            for (var e = this._children, i = 0, n = e.length; i < n; i++)
              e[i].setSelected(t);
          this._changeSelection(1, t);
        },
        isFullySelected: function() {
          var t = this._children, e = !!(this._selection & 1);
          if (t && e) {
            for (var i = 0, n = t.length; i < n; i++)
              if (!t[i].isFullySelected())
                return !1;
            return !0;
          }
          return e;
        },
        setFullySelected: function(t) {
          var e = this._children;
          if (e)
            for (var i = 0, n = e.length; i < n; i++)
              e[i].setFullySelected(t);
          this._changeSelection(1, t);
        },
        isClipMask: function() {
          return this._clipMask;
        },
        setClipMask: function(t) {
          this._clipMask != (t = !!t) && (this._clipMask = t, t && (this.setFillColor(null), this.setStrokeColor(null)), this._changed(257), this._parent && this._parent._changed(2048));
        },
        getData: function() {
          return this._data || (this._data = {}), this._data;
        },
        setData: function(t) {
          this._data = t;
        },
        getPosition: function(t) {
          var e = t ? L : Dt, i = this._position || (this._position = this._getPositionFromBounds());
          return new e(i.x, i.y, this, "setPosition");
        },
        setPosition: function() {
          this.translate(L.read(arguments).subtract(this.getPosition(!0)));
        },
        _getPositionFromBounds: function(t) {
          return this._pivot ? this._matrix._transformPoint(this._pivot) : (t || this.getBounds()).getCenter(!0);
        },
        getPivot: function() {
          var t = this._pivot;
          return t ? new Dt(t.x, t.y, this, "setPivot") : null;
        },
        setPivot: function() {
          this._pivot = L.read(arguments, 0, { clone: !0, readNull: !0 }), this._position = B;
        }
      },
      I.each(
        {
          getStrokeBounds: { stroke: !0 },
          getHandleBounds: { handle: !0 },
          getInternalBounds: { internal: !0 }
        },
        function(t, e) {
          this[e] = function(i) {
            return this.getBounds(i, t);
          };
        },
        {
          beans: !0,
          getBounds: function(t, e) {
            var i = e || t instanceof ft, n = I.set(
              {},
              i ? e : t,
              this._boundsOptions
            );
            (!n.stroke || this.getStrokeScaling()) && (n.cacheItem = this);
            var r = this._getCachedBounds(i && t, n).rect;
            return arguments.length ? r : new pe(
              r.x,
              r.y,
              r.width,
              r.height,
              this,
              "setBounds"
            );
          },
          setBounds: function() {
            var t = j.read(arguments), e = this.getBounds(), i = this._matrix, n = new ft(), r = t.getCenter();
            n.translate(r), (t.width != e.width || t.height != e.height) && (i.isInvertible() || (i.set(i._backup || new ft().translate(i.getTranslation())), e = this.getBounds()), n.scale(
              e.width !== 0 ? t.width / e.width : 0,
              e.height !== 0 ? t.height / e.height : 0
            )), r = e.getCenter(), n.translate(-r.x, -r.y), this.transform(n);
          },
          _getBounds: function(t, e) {
            var i = this._children;
            return !i || !i.length ? new j() : ($._updateBoundsCache(this, e.cacheItem), $._getBounds(i, t, e));
          },
          _getBoundsCacheKey: function(t, e) {
            return [
              t.stroke ? 1 : 0,
              t.handle ? 1 : 0,
              e ? 1 : 0
            ].join("");
          },
          _getCachedBounds: function(t, e, i) {
            t = t && t._orNullIfIdentity();
            var n = e.internal && !i, r = e.cacheItem, s = n ? null : this._matrix._orNullIfIdentity(), o = r && (!t || t.equals(s)) && this._getBoundsCacheKey(e, n), a = this._bounds;
            if ($._updateBoundsCache(this._parent || this._symbol, r), o && a && o in a) {
              var h = a[o];
              return {
                rect: h.rect.clone(),
                nonscaling: h.nonscaling
              };
            }
            var u = this._getBounds(t || s, e), _ = u.rect || u, d = this._style, c = u.nonscaling || d.hasStroke() && !d.getStrokeScaling();
            if (o) {
              a || (this._bounds = a = {});
              var h = a[o] = {
                rect: _.clone(),
                nonscaling: c,
                internal: n
              };
            }
            return {
              rect: _,
              nonscaling: c
            };
          },
          _getStrokeMatrix: function(t, e) {
            var i = this.getStrokeScaling() ? null : e && e.internal ? this : this._parent || this._symbol && this._symbol._item, n = i ? i.getViewMatrix().invert() : t;
            return n && n._shiftless();
          },
          statics: {
            _updateBoundsCache: function(t, e) {
              if (t && e) {
                var i = e._id, n = t._boundsCache = t._boundsCache || {
                  ids: {},
                  list: []
                };
                n.ids[i] || (n.list.push(e), n.ids[i] = e);
              }
            },
            _clearBoundsCache: function(t) {
              var e = t._boundsCache;
              if (e) {
                t._bounds = t._position = t._boundsCache = B;
                for (var i = 0, n = e.list, r = n.length; i < r; i++) {
                  var s = n[i];
                  s !== t && (s._bounds = s._position = B, s._boundsCache && $._clearBoundsCache(s));
                }
              }
            },
            _getBounds: function(t, e, i) {
              var n = 1 / 0, r = -n, s = n, o = r, a = !1;
              i = i || {};
              for (var h = 0, u = t.length; h < u; h++) {
                var _ = t[h];
                if (_._visible && !_.isEmpty(!0)) {
                  var d = _._getCachedBounds(
                    e && e.appended(_._matrix),
                    i,
                    !0
                  ), c = d.rect;
                  n = Math.min(c.x, n), s = Math.min(c.y, s), r = Math.max(c.x + c.width, r), o = Math.max(c.y + c.height, o), d.nonscaling && (a = !0);
                }
              }
              return {
                rect: isFinite(n) ? new j(n, s, r - n, o - s) : new j(),
                nonscaling: a
              };
            }
          }
        }
      ),
      {
        beans: !0,
        _decompose: function() {
          return this._applyMatrix ? null : this._decomposed || (this._decomposed = this._matrix.decompose());
        },
        getRotation: function() {
          var t = this._decompose();
          return t ? t.rotation : 0;
        },
        setRotation: function(t) {
          var e = this.getRotation();
          if (e != null && t != null) {
            var i = this._decomposed;
            this.rotate(t - e), i && (i.rotation = t, this._decomposed = i);
          }
        },
        getScaling: function() {
          var t = this._decompose(), e = t && t.scaling;
          return new Dt(e ? e.x : 1, e ? e.y : 1, this, "setScaling");
        },
        setScaling: function() {
          var t = this.getScaling(), e = L.read(arguments, 0, { clone: !0, readNull: !0 });
          if (t && e && !t.equals(e)) {
            var i = this.getRotation(), n = this._decomposed, r = new ft(), s = et.isZero;
            if (s(t.x) || s(t.y))
              r.translate(n.translation), i && r.rotate(i), r.scale(e.x, e.y), this._matrix.set(r);
            else {
              var o = this.getPosition(!0);
              r.translate(o), i && r.rotate(i), r.scale(e.x / t.x, e.y / t.y), i && r.rotate(-i), r.translate(o.negate()), this.transform(r);
            }
            n && (n.scaling = e, this._decomposed = n);
          }
        },
        getMatrix: function() {
          return this._matrix;
        },
        setMatrix: function() {
          var t = this._matrix;
          t.set.apply(t, arguments);
        },
        getGlobalMatrix: function(t) {
          var e = this._globalMatrix;
          if (e)
            for (var i = this._parent, n = []; i; ) {
              if (!i._globalMatrix) {
                e = null;
                for (var r = 0, s = n.length; r < s; r++)
                  n[r]._globalMatrix = null;
                break;
              }
              n.push(i), i = i._parent;
            }
          if (!e) {
            e = this._globalMatrix = this._matrix.clone();
            var i = this._parent;
            i && e.prepend(i.getGlobalMatrix(!0));
          }
          return t ? e : e.clone();
        },
        getViewMatrix: function() {
          return this.getGlobalMatrix().prepend(this.getView()._matrix);
        },
        getApplyMatrix: function() {
          return this._applyMatrix;
        },
        setApplyMatrix: function(t) {
          (this._applyMatrix = this._canApplyMatrix && !!t) && this.transform(null, !0);
        },
        getTransformContent: "#getApplyMatrix",
        setTransformContent: "#setApplyMatrix"
      },
      {
        getProject: function() {
          return this._project;
        },
        _setProject: function(t, e) {
          if (this._project !== t) {
            this._project && this._installEvents(!1), this._project = t;
            for (var i = this._children, n = 0, r = i && i.length; n < r; n++)
              i[n]._setProject(t);
            e = !0;
          }
          e && this._installEvents(!0);
        },
        getView: function() {
          return this._project._view;
        },
        _installEvents: function t(e) {
          t.base.call(this, e);
          for (var i = this._children, n = 0, r = i && i.length; n < r; n++)
            i[n]._installEvents(e);
        },
        getLayer: function() {
          for (var t = this; t = t._parent; )
            if (t instanceof Jt)
              return t;
          return null;
        },
        getParent: function() {
          return this._parent;
        },
        setParent: function(t) {
          return t.addChild(this);
        },
        _getOwner: "#getParent",
        getChildren: function() {
          return this._children;
        },
        setChildren: function(t) {
          this.removeChildren(), this.addChildren(t);
        },
        getFirstChild: function() {
          return this._children && this._children[0] || null;
        },
        getLastChild: function() {
          return this._children && this._children[this._children.length - 1] || null;
        },
        getNextSibling: function() {
          var t = this._getOwner();
          return t && t._children[this._index + 1] || null;
        },
        getPreviousSibling: function() {
          var t = this._getOwner();
          return t && t._children[this._index - 1] || null;
        },
        getIndex: function() {
          return this._index;
        },
        setIndex: function(t) {
          var e = this._parent, i = e && e._children;
          i && e.insertChildren(
            t in i ? t : B,
            [this]
          );
        },
        equals: function(t) {
          return t === this || t && this._class === t._class && this._style.equals(t._style) && this._matrix.equals(t._matrix) && this._locked === t._locked && this._visible === t._visible && this._blendMode === t._blendMode && this._opacity === t._opacity && this._clipMask === t._clipMask && this._guide === t._guide && this._equals(t) || !1;
        },
        _equals: function(t) {
          return I.equals(this._children, t._children);
        },
        clone: function(t) {
          var e = new this.constructor($.NO_INSERT), i = this._children, n = I.pick(
            t ? t.insert : B,
            t === B || t === !0
          ), r = I.pick(t ? t.deep : B, !0);
          i && e.copyAttributes(this), (!i || r) && e.copyContent(this), i || e.copyAttributes(this), n && e.insertAbove(this);
          var s = this._name, o = this._parent;
          if (s && o) {
            for (var i = o._children, a = s, h = 1; i[s]; )
              s = a + " " + h++;
            s !== a && e.setName(s);
          }
          return e;
        },
        copyContent: function(t) {
          for (var e = t._children, i = 0, n = e && e.length; i < n; i++)
            this.addChild(e[i].clone(!1), !0);
        },
        copyAttributes: function(t, e) {
          this.setStyle(t._style);
          for (var i = [
            "_locked",
            "_visible",
            "_blendMode",
            "_opacity",
            "_clipMask",
            "_guide"
          ], n = 0, r = i.length; n < r; n++) {
            var s = i[n];
            t.hasOwnProperty(s) && (this[s] = t[s]);
          }
          e || this._matrix.set(t._matrix, !0), this.setApplyMatrix(t._applyMatrix), this.setPivot(t._pivot), this.setSelection(t._selection);
          var o = t._data, a = t._name;
          this._data = o ? I.clone(o) : null, a && this.setName(a);
        },
        rasterize: function(t, e) {
          var i, n, r;
          I.isPlainObject(t) ? (i = t.resolution, n = t.insert, r = t.raster) : (i = t, n = e), r || (r = new Xt($.NO_INSERT));
          var s = this.getStrokeBounds(), o = (i || this.getView().getResolution()) / 72, a = s.getTopLeft().floor(), h = s.getBottomRight().ceil(), u = new G(h.subtract(a)), _ = u.multiply(o);
          if (r.setSize(_, !0), !_.isZero()) {
            var d = r.getContext(!0), c = new ft().scale(o).translate(a.negate());
            d.save(), c.applyToContext(d), this.draw(d, new I({ matrices: [c] })), d.restore();
          }
          return r._matrix.set(
            new ft().translate(a.add(u.divide(2))).scale(1 / o)
          ), (n === B || n) && r.insertAbove(this), r;
        },
        contains: function() {
          var t = this._matrix;
          return t.isInvertible() && !!this._contains(t._inverseTransform(L.read(arguments)));
        },
        _contains: function(t) {
          var e = this._children;
          if (e) {
            for (var i = e.length - 1; i >= 0; i--)
              if (e[i].contains(t))
                return !0;
            return !1;
          }
          return t.isInside(this.getInternalBounds());
        },
        isInside: function() {
          return j.read(arguments).contains(this.getBounds());
        },
        _asPathItem: function() {
          return new ot.Rectangle({
            rectangle: this.getInternalBounds(),
            matrix: this._matrix,
            insert: !1
          });
        },
        intersects: function(t, e) {
          return t instanceof $ ? this._asPathItem().getIntersections(
            t._asPathItem(),
            null,
            e,
            !0
          ).length > 0 : !1;
        }
      },
      new function() {
        function t() {
          var n = arguments;
          return this._hitTest(
            L.read(n),
            Ft.getOptions(n)
          );
        }
        function e() {
          var n = arguments, r = L.read(n), s = Ft.getOptions(n), o = [];
          return this._hitTest(r, new I({ all: o }, s)), o;
        }
        function i(n, r, s, o) {
          var a = this._children;
          if (a)
            for (var h = a.length - 1; h >= 0; h--) {
              var u = a[h], _ = u !== o && u._hitTest(
                n,
                r,
                s
              );
              if (_ && !r.all)
                return _;
            }
          return null;
        }
        return Yt.inject({
          hitTest: t,
          hitTestAll: e,
          _hitTest: i
        }), {
          hitTest: t,
          hitTestAll: e,
          _hitTestChildren: i
        };
      }(),
      {
        _hitTest: function(t, e, i) {
          if (this._locked || !this._visible || this._guide && !e.guides || this.isEmpty())
            return null;
          var n = this._matrix, r = i ? i.appended(n) : this.getGlobalMatrix().prepend(this.getView()._matrix), s = Math.max(e.tolerance, 1e-12), o = e._tolerancePadding = new G(
            ot._getStrokePadding(
              s,
              n._shiftless().invert()
            )
          );
          if (t = n._inverseTransform(t), !t || !this._children && !this.getBounds({ internal: !0, stroke: !0, handle: !0 }).expand(o.multiply(2))._containsPoint(t))
            return null;
          var a = !(e.guides && !this._guide || e.selected && !this.isSelected() || e.type && e.type !== I.hyphenate(this._class) || e.class && !(this instanceof e.class)), h = e.match, u = this, _, d;
          function c(f) {
            return f && h && !h(f) && (f = null), f && e.all && e.all.push(f), f;
          }
          function l(f, g) {
            var w = g ? _["get" + g]() : u.getPosition();
            if (t.subtract(w).divide(o).length <= 1)
              return new Ft(f, u, {
                name: g ? I.hyphenate(g) : f,
                point: w
              });
          }
          var v = e.position, y = e.center, C = e.bounds;
          if (a && this._parent && (v || y || C)) {
            if ((y || C) && (_ = this.getInternalBounds()), d = v && l("position") || y && l("center", "Center"), !d && C)
              for (var p = [
                "TopLeft",
                "TopRight",
                "BottomLeft",
                "BottomRight",
                "LeftCenter",
                "TopCenter",
                "RightCenter",
                "BottomCenter"
              ], m = 0; m < 8 && !d; m++)
                d = l("bounds", p[m]);
            d = c(d);
          }
          return d || (d = this._hitTestChildren(t, e, r) || a && c(this._hitTestSelf(
            t,
            e,
            r,
            this.getStrokeScaling() ? null : r._shiftless().invert()
          )) || null), d && d.point && (d.point = n.transform(d.point)), d;
        },
        _hitTestSelf: function(t, e) {
          if (e.fill && this.hasFill() && this._contains(t))
            return new Ft("fill", this);
        },
        matches: function(t, e) {
          function i(o, a) {
            for (var h in o)
              if (o.hasOwnProperty(h)) {
                var u = o[h], _ = a[h];
                if (I.isPlainObject(u) && I.isPlainObject(_)) {
                  if (!i(u, _))
                    return !1;
                } else if (!I.equals(u, _))
                  return !1;
              }
            return !0;
          }
          var n = typeof t;
          if (n === "object") {
            for (var r in t)
              if (t.hasOwnProperty(r) && !this.matches(r, t[r]))
                return !1;
            return !0;
          } else {
            if (n === "function")
              return t(this);
            if (t === "match")
              return e(this);
            var s = /^(empty|editable)$/.test(t) ? this["is" + I.capitalize(t)]() : t === "type" ? I.hyphenate(this._class) : this[t];
            if (t === "class") {
              if (typeof e == "function")
                return this instanceof e;
              s = this._class;
            }
            if (typeof e == "function")
              return !!e(s);
            if (e) {
              if (e.test)
                return e.test(s);
              if (I.isPlainObject(e))
                return i(e, s);
            }
            return I.equals(s, e);
          }
        },
        getItems: function(t) {
          return $._getItems(this, t, this._matrix);
        },
        getItem: function(t) {
          return $._getItems(this, t, this._matrix, null, !0)[0] || null;
        },
        statics: {
          _getItems: function t(e, i, n, r, s) {
            if (!r) {
              var o = typeof i == "object" && i, a = o && o.overlapping, h = o && o.inside, u = a || h, c = u && j.read([u]);
              r = {
                items: [],
                recursive: o && o.recursive !== !1,
                inside: !!h,
                overlapping: !!a,
                rect: c,
                path: a && new ot.Rectangle({
                  rectangle: c,
                  insert: !1
                })
              }, o && (i = I.filter({}, i, {
                recursive: !0,
                inside: !0,
                overlapping: !0
              }));
            }
            var _ = e._children, d = r.items, c = r.rect;
            n = c && (n || new ft());
            for (var l = 0, v = _ && _.length; l < v; l++) {
              var y = _[l], C = n && n.appended(y._matrix), p = !0;
              if (c) {
                var u = y.getBounds(C);
                if (!c.intersects(u))
                  continue;
                c.contains(u) || r.overlapping && (u.contains(c) || r.path.intersects(y, C)) || (p = !1);
              }
              if (p && y.matches(i) && (d.push(y), s) || (r.recursive !== !1 && t(y, i, C, r, s), s && d.length > 0))
                break;
            }
            return d;
          }
        }
      },
      {
        importJSON: function(t) {
          var e = I.importJSON(t, this);
          return e !== this ? this.addChild(e) : e;
        },
        addChild: function(t) {
          return this.insertChild(B, t);
        },
        insertChild: function(t, e) {
          var i = e ? this.insertChildren(t, [e]) : null;
          return i && i[0];
        },
        addChildren: function(t) {
          return this.insertChildren(this._children.length, t);
        },
        insertChildren: function(t, e) {
          var i = this._children;
          if (i && e && e.length > 0) {
            e = I.slice(e);
            for (var n = {}, r = e.length - 1; r >= 0; r--) {
              var s = e[r], o = s && s._id;
              !s || n[o] ? e.splice(r, 1) : (s._remove(!1, !0), n[o] = !0);
            }
            I.splice(i, e, t, 0);
            for (var a = this._project, h = a._changes, r = 0, u = e.length; r < u; r++) {
              var s = e[r], _ = s._name;
              s._parent = this, s._setProject(a, !0), _ && s.setName(_), h && s._changed(5);
            }
            this._changed(11);
          } else
            e = null;
          return e;
        },
        _insertItem: "#insertChild",
        _insertAt: function(t, e) {
          var i = t && t._getOwner(), n = t !== this && i ? this : null;
          return n && (n._remove(!1, !0), i._insertItem(t._index + e, n)), n;
        },
        insertAbove: function(t) {
          return this._insertAt(t, 1);
        },
        insertBelow: function(t) {
          return this._insertAt(t, 0);
        },
        sendToBack: function() {
          var t = this._getOwner();
          return t ? t._insertItem(0, this) : null;
        },
        bringToFront: function() {
          var t = this._getOwner();
          return t ? t._insertItem(B, this) : null;
        },
        appendTop: "#addChild",
        appendBottom: function(t) {
          return this.insertChild(0, t);
        },
        moveAbove: "#insertAbove",
        moveBelow: "#insertBelow",
        addTo: function(t) {
          return t._insertItem(B, this);
        },
        copyTo: function(t) {
          return this.clone(!1).addTo(t);
        },
        reduce: function(t) {
          var e = this._children;
          if (e && e.length === 1) {
            var i = e[0].reduce(t);
            return this._parent ? (i.insertAbove(this), this.remove()) : i.remove(), i;
          }
          return this;
        },
        _removeNamed: function() {
          var t = this._getOwner();
          if (t) {
            var e = t._children, i = t._namedChildren, n = this._name, r = i[n], s = r ? r.indexOf(this) : -1;
            s !== -1 && (e[n] == this && delete e[n], r.splice(s, 1), r.length ? e[n] = r[0] : delete i[n]);
          }
        },
        _remove: function(t, e) {
          var i = this._getOwner(), n = this._project, r = this._index;
          return this._style && this._style._dispose(), i ? (this._name && this._removeNamed(), r != null && (n._activeLayer === this && (n._activeLayer = this.getNextSibling() || this.getPreviousSibling()), I.splice(i._children, null, r, 1)), this._installEvents(!1), t && n._changes && this._changed(5), e && i._changed(11, this), this._parent = null, !0) : !1;
        },
        remove: function() {
          return this._remove(!0, !0);
        },
        replaceWith: function(t) {
          var e = t && t.insertBelow(this);
          return e && this.remove(), e;
        },
        removeChildren: function(t, e) {
          if (!this._children)
            return null;
          t = t || 0, e = I.pick(e, this._children.length);
          for (var i = I.splice(this._children, null, t, e - t), n = i.length - 1; n >= 0; n--)
            i[n]._remove(!0, !1);
          return i.length > 0 && this._changed(11), i;
        },
        clear: "#removeChildren",
        reverseChildren: function() {
          if (this._children) {
            this._children.reverse();
            for (var t = 0, e = this._children.length; t < e; t++)
              this._children[t]._index = t;
            this._changed(11);
          }
        },
        isEmpty: function(t) {
          var e = this._children, i = e ? e.length : 0;
          if (t) {
            for (var n = 0; n < i; n++)
              if (!e[n].isEmpty(t))
                return !1;
            return !0;
          }
          return !i;
        },
        isEditable: function() {
          for (var t = this; t; ) {
            if (!t._visible || t._locked)
              return !1;
            t = t._parent;
          }
          return !0;
        },
        hasFill: function() {
          return this.getStyle().hasFill();
        },
        hasStroke: function() {
          return this.getStyle().hasStroke();
        },
        hasShadow: function() {
          return this.getStyle().hasShadow();
        },
        _getOrder: function(t) {
          function e(o) {
            var a = [];
            do
              a.unshift(o);
            while (o = o._parent);
            return a;
          }
          for (var i = e(this), n = e(t), r = 0, s = Math.min(i.length, n.length); r < s; r++)
            if (i[r] != n[r])
              return i[r]._index < n[r]._index ? 1 : -1;
          return 0;
        },
        hasChildren: function() {
          return this._children && this._children.length > 0;
        },
        isInserted: function() {
          return this._parent ? this._parent.isInserted() : !1;
        },
        isAbove: function(t) {
          return this._getOrder(t) === -1;
        },
        isBelow: function(t) {
          return this._getOrder(t) === 1;
        },
        isParent: function(t) {
          return this._parent === t;
        },
        isChild: function(t) {
          return t && t._parent === this;
        },
        isDescendant: function(t) {
          for (var e = this; e = e._parent; )
            if (e === t)
              return !0;
          return !1;
        },
        isAncestor: function(t) {
          return t ? t.isDescendant(this) : !1;
        },
        isSibling: function(t) {
          return this._parent === t._parent;
        },
        isGroupedWith: function(t) {
          for (var e = this._parent; e; ) {
            if (e._parent && /^(Group|Layer|CompoundPath)$/.test(e._class) && t.isDescendant(e))
              return !0;
            e = e._parent;
          }
          return !1;
        }
      },
      I.each(["rotate", "scale", "shear", "skew"], function(t) {
        var e = t === "rotate";
        this[t] = function() {
          var i = arguments, n = (e ? I : L).read(i), r = L.read(i, 0, { readNull: !0 });
          return this.transform(new ft()[t](
            n,
            r || this.getPosition(!0)
          ));
        };
      }, {
        translate: function() {
          var t = new ft();
          return this.transform(t.translate.apply(t, arguments));
        },
        transform: function(t, e, i) {
          var n = this._matrix, r = t && !t.isIdentity(), s = i && this._canApplyMatrix || this._applyMatrix && (r || !n.isIdentity() || e && this._children);
          if (!r && !s)
            return this;
          if (r) {
            !t.isInvertible() && n.isInvertible() && (n._backup = n.getValues()), n.prepend(t, !0);
            var o = this._style, a = o.getFillColor(!0), h = o.getStrokeColor(!0);
            a && a.transform(t), h && h.transform(t);
          }
          if (s && (s = this._transformContent(
            n,
            e,
            i
          ))) {
            var u = this._pivot;
            u && n._transformPoint(u, u, !0), n.reset(!0), i && this._canApplyMatrix && (this._applyMatrix = !0);
          }
          var _ = this._bounds, d = this._position;
          (r || s) && this._changed(25);
          var c = r && _ && t.decompose();
          if (c && c.skewing.isZero() && c.rotation % 90 === 0) {
            for (var l in _) {
              var v = _[l];
              if (v.nonscaling)
                delete _[l];
              else if (s || !v.internal) {
                var y = v.rect;
                t._transformBounds(y, y);
              }
            }
            this._bounds = _;
            var C = _[this._getBoundsCacheKey(
              this._boundsOptions || {}
            )];
            C && (this._position = this._getPositionFromBounds(C.rect));
          } else
            r && d && this._pivot && (this._position = t._transformPoint(d, d));
          return this;
        },
        _transformContent: function(t, e, i) {
          var n = this._children;
          if (n) {
            for (var r = 0, s = n.length; r < s; r++)
              n[r].transform(t, e, i);
            return !0;
          }
        },
        globalToLocal: function() {
          return this.getGlobalMatrix(!0)._inverseTransform(
            L.read(arguments)
          );
        },
        localToGlobal: function() {
          return this.getGlobalMatrix(!0)._transformPoint(
            L.read(arguments)
          );
        },
        parentToLocal: function() {
          return this._matrix._inverseTransform(L.read(arguments));
        },
        localToParent: function() {
          return this._matrix._transformPoint(L.read(arguments));
        },
        fitBounds: function(t, e) {
          t = j.read(arguments);
          var i = this.getBounds(), n = i.height / i.width, r = t.height / t.width, s = (e ? n > r : n < r) ? t.width / i.width : t.height / i.height, o = new j(
            new L(),
            new G(i.width * s, i.height * s)
          );
          o.setCenter(t.getCenter()), this.setBounds(o);
        }
      }),
      {
        _setStyles: function(t, e, i) {
          var n = this._style, r = this._matrix;
          if (n.hasFill() && (t.fillStyle = n.getFillColor().toCanvasStyle(t, r)), n.hasStroke()) {
            t.strokeStyle = n.getStrokeColor().toCanvasStyle(t, r), t.lineWidth = n.getStrokeWidth();
            var s = n.getStrokeJoin(), o = n.getStrokeCap(), a = n.getMiterLimit();
            if (s && (t.lineJoin = s), o && (t.lineCap = o), a && (t.miterLimit = a), rt.support.nativeDash) {
              var h = n.getDashArray(), u = n.getDashOffset();
              h && h.length && ("setLineDash" in t ? (t.setLineDash(h), t.lineDashOffset = u) : (t.mozDash = h, t.mozDashOffset = u));
            }
          }
          if (n.hasShadow()) {
            var _ = e.pixelRatio || 1, d = i._shiftless().prepend(
              new ft().scale(_, _)
            ), c = d.transform(new L(n.getShadowBlur(), 0)), l = d.transform(this.getShadowOffset());
            t.shadowColor = n.getShadowColor().toCanvasStyle(t), t.shadowBlur = c.getLength(), t.shadowOffsetX = l.x, t.shadowOffsetY = l.y;
          }
        },
        draw: function(t, e, i) {
          if (this._updateVersion = this._project._updateVersion, !(!this._visible || this._opacity === 0)) {
            var n = e.matrices, r = e.viewMatrix, s = this._matrix, o = n[n.length - 1].appended(s);
            if (o.isInvertible()) {
              r = r ? r.appended(o) : o, n.push(o), e.updateMatrix && (this._globalMatrix = o);
              var a = this._blendMode, h = et.clamp(this._opacity, 0, 1), u = a === "normal", _ = oe.nativeModes[a], d = u && h === 1 || e.dontStart || e.clip || (_ || u && h < 1) && this._canComposite(), c = e.pixelRatio || 1, l, v, y;
              if (!d) {
                var C = this.getStrokeBounds(r);
                if (!C.width || !C.height) {
                  n.pop();
                  return;
                }
                y = e.offset, v = e.offset = C.getTopLeft().floor(), l = t, t = wt.getContext(C.getSize().ceil().add(1).multiply(c)), c !== 1 && t.scale(c, c);
              }
              t.save();
              var p = i ? i.appended(s) : this._canScaleStroke && !this.getStrokeScaling(!0) && r, m = !d && e.clipItem, f = !p || m;
              if (d ? (t.globalAlpha = h, _ && (t.globalCompositeOperation = a)) : f && t.translate(-v.x, -v.y), f && (d ? s : r).applyToContext(t), m && e.clipItem.draw(t, e.extend({ clip: !0 })), p) {
                t.setTransform(c, 0, 0, c, 0, 0);
                var g = e.offset;
                g && t.translate(-g.x, -g.y);
              }
              this._draw(t, e, r, p), t.restore(), n.pop(), e.clip && !e.dontFinish && t.clip(this.getFillRule()), d || (oe.process(
                a,
                t,
                l,
                h,
                v.subtract(y).multiply(c)
              ), wt.release(t), e.offset = y);
            }
          }
        },
        _isUpdated: function(t) {
          var e = this._parent;
          if (e instanceof Nt)
            return e._isUpdated(t);
          var i = this._updateVersion === t;
          return !i && e && e._visible && e._isUpdated(t) && (this._updateVersion = t, i = !0), i;
        },
        _drawSelection: function(t, e, i, n, r) {
          var s = this._selection, o = s & 1, a = s & 2 || o && this._selectBounds, h = s & 4;
          if (this._drawSelected || (o = !1), (o || a || h) && this._isUpdated(r)) {
            var u, _ = this.getSelectedColor(!0) || (u = this.getLayer()) && u.getSelectedColor(!0), d = e.appended(this.getGlobalMatrix(!0)), c = i / 2;
            if (t.strokeStyle = t.fillStyle = _ ? _.toCanvasStyle(t) : "#009dec", o && this._drawSelected(t, d, n), h) {
              var l = this.getPosition(!0), v = this._parent, y = v ? v.localToGlobal(l) : l, C = y.x, p = y.y;
              t.beginPath(), t.arc(C, p, c, 0, Math.PI * 2, !0), t.stroke();
              for (var m = [[0, -1], [1, 0], [0, 1], [-1, 0]], f = c, g = i + 1, w = 0; w < 4; w++) {
                var S = m[w], x = S[0], b = S[1];
                t.moveTo(C + x * f, p + b * f), t.lineTo(C + x * g, p + b * g), t.stroke();
              }
            }
            if (a) {
              var P = d._transformCorners(this.getInternalBounds());
              t.beginPath();
              for (var w = 0; w < 8; w++)
                t[w ? "lineTo" : "moveTo"](P[w], P[++w]);
              t.closePath(), t.stroke();
              for (var w = 0; w < 8; w++)
                t.fillRect(
                  P[w] - c,
                  P[++w] - c,
                  i,
                  i
                );
            }
          }
        },
        _canComposite: function() {
          return !1;
        }
      },
      I.each(["down", "drag", "up", "move"], function(t) {
        this["removeOn" + I.capitalize(t)] = function() {
          var e = {};
          return e[t] = !0, this.removeOn(e);
        };
      }, {
        removeOn: function(t) {
          for (var e in t)
            if (t[e]) {
              var i = "mouse" + e, n = this._project, r = n._removeSets = n._removeSets || {};
              r[i] = r[i] || {}, r[i][this._id] = this;
            }
          return this;
        }
      }),
      {
        tween: function(t, e, i) {
          i || (i = e, e = t, t = null, i || (i = e, e = null));
          var n = i && i.easing, r = i && i.start, s = i != null && (typeof i == "number" ? i : i.duration), o = new be(this, t, e, s, n, r);
          function a(h) {
            o._handleFrame(h.time * 1e3), o.running || this.off("frame", a);
          }
          return s && this.on("frame", a), o;
        },
        tweenTo: function(t, e) {
          return this.tween(null, t, e);
        },
        tweenFrom: function(t, e) {
          return this.tween(t, null, e);
        }
      }
    ), Bt = $.extend({
      _class: "Group",
      _selectBounds: !1,
      _selectChildren: !0,
      _serializeFields: {
        children: []
      },
      initialize: function(e) {
        this._children = [], this._namedChildren = {}, this._initialize(e) || this.addChildren(Array.isArray(e) ? e : arguments);
      },
      _changed: function t(e) {
        t.base.call(this, e), e & 2050 && (this._clipItem = B);
      },
      _getClipItem: function() {
        var t = this._clipItem;
        if (t === B) {
          t = null;
          for (var e = this._children, i = 0, n = e.length; i < n; i++)
            if (e[i]._clipMask) {
              t = e[i];
              break;
            }
          this._clipItem = t;
        }
        return t;
      },
      isClipped: function() {
        return !!this._getClipItem();
      },
      setClipped: function(t) {
        var e = this.getFirstChild();
        e && e.setClipMask(t);
      },
      _getBounds: function t(e, i) {
        var n = this._getClipItem();
        return n ? n._getCachedBounds(
          n._matrix.prepended(e),
          I.set({}, i, { stroke: !1 })
        ) : t.base.call(this, e, i);
      },
      _hitTestChildren: function t(e, i, n) {
        var r = this._getClipItem();
        return (!r || r.contains(e)) && t.base.call(
          this,
          e,
          i,
          n,
          r
        );
      },
      _draw: function(t, e) {
        var i = e.clip, n = !i && this._getClipItem();
        e = e.extend({ clipItem: n, clip: !1 }), i ? (t.beginPath(), e.dontStart = e.dontFinish = !0) : n && n.draw(t, e.extend({ clip: !0 }));
        for (var r = this._children, s = 0, o = r.length; s < o; s++) {
          var a = r[s];
          a !== n && a.draw(t, e);
        }
      }
    }), Jt = Bt.extend({
      _class: "Layer",
      initialize: function() {
        Bt.apply(this, arguments);
      },
      _getOwner: function() {
        return this._parent || this._index != null && this._project;
      },
      isInserted: function t() {
        return this._parent ? t.base.call(this) : this._index != null;
      },
      activate: function() {
        this._project._activeLayer = this;
      },
      _hitTestSelf: function() {
      }
    }), zt = $.extend(
      {
        _class: "Shape",
        _applyMatrix: !1,
        _canApplyMatrix: !1,
        _canScaleStroke: !0,
        _serializeFields: {
          type: null,
          size: null,
          radius: null
        },
        initialize: function(e, i) {
          this._initialize(e, i);
        },
        _equals: function(t) {
          return this._type === t._type && this._size.equals(t._size) && I.equals(this._radius, t._radius);
        },
        copyContent: function(t) {
          this.setType(t._type), this.setSize(t._size), this.setRadius(t._radius);
        },
        getType: function() {
          return this._type;
        },
        setType: function(t) {
          this._type = t;
        },
        getShape: "#getType",
        setShape: "#setType",
        getSize: function() {
          var t = this._size;
          return new Wt(t.width, t.height, this, "setSize");
        },
        setSize: function() {
          var t = G.read(arguments);
          if (!this._size)
            this._size = t.clone();
          else if (!this._size.equals(t)) {
            var e = this._type, i = t.width, n = t.height;
            e === "rectangle" ? this._radius.set(G.min(this._radius, t.divide(2).abs())) : e === "circle" ? (i = n = (i + n) / 2, this._radius = i / 2) : e === "ellipse" && this._radius._set(i / 2, n / 2), this._size._set(i, n), this._changed(9);
          }
        },
        getRadius: function() {
          var t = this._radius;
          return this._type === "circle" ? t : new Wt(t.width, t.height, this, "setRadius");
        },
        setRadius: function(t) {
          var e = this._type;
          if (e === "circle") {
            if (t === this._radius)
              return;
            var i = t * 2;
            this._radius = t, this._size._set(i, i);
          } else if (t = G.read(arguments), !this._radius)
            this._radius = t.clone();
          else {
            if (this._radius.equals(t))
              return;
            if (this._radius.set(t), e === "rectangle") {
              var i = G.max(this._size, t.multiply(2));
              this._size.set(i);
            } else
              e === "ellipse" && this._size._set(t.width * 2, t.height * 2);
          }
          this._changed(9);
        },
        isEmpty: function() {
          return !1;
        },
        toPath: function(t) {
          var e = new ot[I.capitalize(this._type)]({
            center: new L(),
            size: this._size,
            radius: this._radius,
            insert: !1
          });
          return e.copyAttributes(this), rt.settings.applyMatrix && e.setApplyMatrix(!0), (t === B || t) && e.insertAbove(this), e;
        },
        toShape: "#clone",
        _asPathItem: function() {
          return this.toPath(!1);
        },
        _draw: function(t, e, i, n) {
          var r = this._style, s = r.hasFill(), o = r.hasStroke(), a = e.dontFinish || e.clip, h = !n;
          if (s || o || a) {
            var u = this._type, _ = this._radius, d = u === "circle";
            if (e.dontStart || t.beginPath(), h && d)
              t.arc(0, 0, _, 0, Math.PI * 2, !0);
            else {
              var c = d ? _ : _.width, l = d ? _ : _.height, v = this._size, y = v.width, C = v.height;
              if (h && u === "rectangle" && c === 0 && l === 0)
                t.rect(-y / 2, -C / 2, y, C);
              else {
                var p = y / 2, m = C / 2, f = 1 - 0.5522847498307936, g = c * f, w = l * f, S = [
                  -p,
                  -m + l,
                  -p,
                  -m + w,
                  -p + g,
                  -m,
                  -p + c,
                  -m,
                  p - c,
                  -m,
                  p - g,
                  -m,
                  p,
                  -m + w,
                  p,
                  -m + l,
                  p,
                  m - l,
                  p,
                  m - w,
                  p - g,
                  m,
                  p - c,
                  m,
                  -p + c,
                  m,
                  -p + g,
                  m,
                  -p,
                  m - w,
                  -p,
                  m - l
                ];
                n && n.transform(S, S, 32), t.moveTo(S[0], S[1]), t.bezierCurveTo(S[2], S[3], S[4], S[5], S[6], S[7]), p !== c && t.lineTo(S[8], S[9]), t.bezierCurveTo(S[10], S[11], S[12], S[13], S[14], S[15]), m !== l && t.lineTo(S[16], S[17]), t.bezierCurveTo(S[18], S[19], S[20], S[21], S[22], S[23]), p !== c && t.lineTo(S[24], S[25]), t.bezierCurveTo(S[26], S[27], S[28], S[29], S[30], S[31]);
              }
            }
            t.closePath();
          }
          !a && (s || o) && (this._setStyles(t, e, i), s && (t.fill(r.getFillRule()), t.shadowColor = "rgba(0,0,0,0)"), o && t.stroke());
        },
        _canComposite: function() {
          return !(this.hasFill() && this.hasStroke());
        },
        _getBounds: function(t, e) {
          var i = new j(this._size).setCenter(0, 0), n = this._style, r = e.stroke && n.hasStroke() && n.getStrokeWidth();
          return t && (i = t._transformBounds(i)), r ? i.expand(ot._getStrokePadding(
            r,
            this._getStrokeMatrix(t, e)
          )) : i;
        }
      },
      new function() {
        function t(i, n, r) {
          var s = i._radius;
          if (!s.isZero())
            for (var o = i._size.divide(2), a = 1; a <= 4; a++) {
              var h = new L(a > 1 && a < 4 ? -1 : 1, a > 2 ? -1 : 1), u = h.multiply(o), _ = u.subtract(h.multiply(s)), d = new j(
                r ? u.add(h.multiply(r)) : u,
                _
              );
              if (d.contains(n))
                return { point: _, quadrant: a };
            }
        }
        function e(i, n, r, s) {
          var o = i.divide(n);
          return (!s || o.isInQuadrant(s)) && o.subtract(o.normalize()).multiply(n).divide(r).length <= 1;
        }
        return {
          _contains: function i(n) {
            if (this._type === "rectangle") {
              var r = t(this, n);
              return r ? n.subtract(r.point).divide(this._radius).getLength() <= 1 : i.base.call(this, n);
            } else
              return n.divide(this.size).getLength() <= 0.5;
          },
          _hitTestSelf: function i(n, r, s, o) {
            var a = !1, h = this._style, u = r.stroke && h.hasStroke(), _ = r.fill && h.hasFill();
            if (u || _) {
              var d = this._type, c = this._radius, l = u ? h.getStrokeWidth() / 2 : 0, v = r._tolerancePadding.add(
                ot._getStrokePadding(
                  l,
                  !h.getStrokeScaling() && o
                )
              );
              if (d === "rectangle") {
                var y = v.multiply(2), C = t(this, n, y);
                if (C)
                  a = e(
                    n.subtract(C.point),
                    c,
                    v,
                    C.quadrant
                  );
                else {
                  var p = new j(this._size).setCenter(0, 0), m = p.expand(y), f = p.expand(y.negate());
                  a = m._containsPoint(n) && !f._containsPoint(n);
                }
              } else
                a = e(n, c, v);
            }
            return a ? new Ft(u ? "stroke" : "fill", this) : i.base.apply(this, arguments);
          }
        };
      }(),
      {
        statics: new function() {
          function t(e, i, n, r, s) {
            var o = I.create(zt.prototype);
            return o._type = e, o._size = n, o._radius = r, o._initialize(I.getNamed(s), i), o;
          }
          return {
            Circle: function() {
              var e = arguments, i = L.readNamed(e, "center"), n = I.readNamed(e, "radius");
              return t(
                "circle",
                i,
                new G(n * 2),
                n,
                e
              );
            },
            Rectangle: function() {
              var e = arguments, i = j.readNamed(e, "rectangle"), n = G.min(
                G.readNamed(e, "radius"),
                i.getSize(!0).divide(2)
              );
              return t(
                "rectangle",
                i.getCenter(!0),
                i.getSize(!0),
                n,
                e
              );
            },
            Ellipse: function() {
              var e = arguments, i = zt._readEllipse(e), n = i.radius;
              return t(
                "ellipse",
                i.center,
                n.multiply(2),
                n,
                e
              );
            },
            _readEllipse: function(e) {
              var i, n;
              if (I.hasNamed(e, "radius"))
                i = L.readNamed(e, "center"), n = G.readNamed(e, "radius");
              else {
                var r = j.readNamed(e, "rectangle");
                i = r.getCenter(!0), n = r.getSize(!0).divide(2);
              }
              return { center: i, radius: n };
            }
          };
        }()
      }
    ), Xt = $.extend({
      _class: "Raster",
      _applyMatrix: !1,
      _canApplyMatrix: !1,
      _boundsOptions: { stroke: !1, handle: !1 },
      _serializeFields: {
        crossOrigin: null,
        source: null
      },
      _prioritize: ["crossOrigin"],
      _smoothing: "low",
      beans: !0,
      initialize: function(e, i) {
        if (!this._initialize(
          e,
          i !== B && L.read(arguments)
        )) {
          var n, r = typeof e, s = r === "string" ? tt.getElementById(e) : r === "object" ? e : null;
          if (s && s !== $.NO_INSERT) {
            if (s.getContext || s.naturalHeight != null)
              n = s;
            else if (s) {
              var o = G.read(arguments);
              o.isZero() || (n = wt.getCanvas(o));
            }
          }
          n ? this.setImage(n) : this.setSource(e);
        }
        this._size || (this._size = new G(), this._loaded = !1);
      },
      _equals: function(t) {
        return this.getSource() === t.getSource();
      },
      copyContent: function(t) {
        var e = t._image, i = t._canvas;
        if (e)
          this._setImage(e);
        else if (i) {
          var n = wt.getCanvas(t._size);
          n.getContext("2d").drawImage(i, 0, 0), this._setImage(n);
        }
        this._crossOrigin = t._crossOrigin;
      },
      getSize: function() {
        var t = this._size;
        return new Wt(
          t ? t.width : 0,
          t ? t.height : 0,
          this,
          "setSize"
        );
      },
      setSize: function(t, e) {
        var i = G.read(arguments);
        if (i.equals(this._size))
          e && this.clear();
        else if (i.width > 0 && i.height > 0) {
          var n = !e && this.getElement();
          this._setImage(wt.getCanvas(i)), n && this.getContext(!0).drawImage(
            n,
            0,
            0,
            i.width,
            i.height
          );
        } else
          this._canvas && wt.release(this._canvas), this._size = i.clone();
      },
      getWidth: function() {
        return this._size ? this._size.width : 0;
      },
      setWidth: function(t) {
        this.setSize(t, this.getHeight());
      },
      getHeight: function() {
        return this._size ? this._size.height : 0;
      },
      setHeight: function(t) {
        this.setSize(this.getWidth(), t);
      },
      getLoaded: function() {
        return this._loaded;
      },
      isEmpty: function() {
        var t = this._size;
        return !t || t.width === 0 && t.height === 0;
      },
      getResolution: function() {
        var t = this._matrix, e = new L(0, 0).transform(t), i = new L(1, 0).transform(t).subtract(e), n = new L(0, 1).transform(t).subtract(e);
        return new G(
          72 / i.getLength(),
          72 / n.getLength()
        );
      },
      getPpi: "#getResolution",
      getImage: function() {
        return this._image;
      },
      setImage: function(t) {
        var e = this;
        function i(n) {
          var r = e.getView(), s = n && n.type || "load";
          r && e.responds(s) && (rt = r._scope, e.emit(s, new te(n)));
        }
        this._setImage(t), this._loaded ? setTimeout(i, 0) : t && Ct.add(t, {
          load: function(n) {
            e._setImage(t), i(n);
          },
          error: i
        });
      },
      _setImage: function(t) {
        this._canvas && wt.release(this._canvas), t && t.getContext ? (this._image = null, this._canvas = t, this._loaded = !0) : (this._image = t, this._canvas = null, this._loaded = !!(t && t.src && t.complete)), this._size = new G(
          t ? t.naturalWidth || t.width : 0,
          t ? t.naturalHeight || t.height : 0
        ), this._context = null, this._changed(1033);
      },
      getCanvas: function() {
        if (!this._canvas) {
          var t = wt.getContext(this._size);
          try {
            this._image && t.drawImage(this._image, 0, 0), this._canvas = t.canvas;
          } catch {
            wt.release(t);
          }
        }
        return this._canvas;
      },
      setCanvas: "#setImage",
      getContext: function(t) {
        return this._context || (this._context = this.getCanvas().getContext("2d")), t && (this._image = null, this._changed(1025)), this._context;
      },
      setContext: function(t) {
        this._context = t;
      },
      getSource: function() {
        var t = this._image;
        return t && t.src || this.toDataURL();
      },
      setSource: function(t) {
        var e = new H.Image(), i = this._crossOrigin;
        i && (e.crossOrigin = i), t && (e.src = t), this.setImage(e);
      },
      getCrossOrigin: function() {
        var t = this._image;
        return t && t.crossOrigin || this._crossOrigin || "";
      },
      setCrossOrigin: function(t) {
        this._crossOrigin = t;
        var e = this._image;
        e && (e.crossOrigin = t);
      },
      getSmoothing: function() {
        return this._smoothing;
      },
      setSmoothing: function(t) {
        this._smoothing = typeof t == "string" ? t : t ? "low" : "off", this._changed(257);
      },
      getElement: function() {
        return this._canvas || this._loaded && this._image;
      }
    }, {
      beans: !1,
      getSubCanvas: function() {
        var t = j.read(arguments), e = wt.getContext(t.getSize());
        return e.drawImage(
          this.getCanvas(),
          t.x,
          t.y,
          t.width,
          t.height,
          0,
          0,
          t.width,
          t.height
        ), e.canvas;
      },
      getSubRaster: function() {
        var t = j.read(arguments), e = new Xt($.NO_INSERT);
        return e._setImage(this.getSubCanvas(t)), e.translate(t.getCenter().subtract(this.getSize().divide(2))), e._matrix.prepend(this._matrix), e.insertAbove(this), e;
      },
      toDataURL: function() {
        var t = this._image, e = t && t.src;
        if (/^data:/.test(e))
          return e;
        var i = this.getCanvas();
        return i ? i.toDataURL.apply(i, arguments) : null;
      },
      drawImage: function(t) {
        var e = L.read(arguments, 1);
        this.getContext(!0).drawImage(t, e.x, e.y);
      },
      getAverageColor: function(t) {
        var e, i;
        if (t ? t instanceof Ut ? (i = t, e = t.getBounds()) : typeof t == "object" && ("width" in t ? e = new j(t) : "x" in t && (e = new j(t.x - 0.5, t.y - 0.5, 1, 1))) : e = this.getBounds(), !e)
          return null;
        var n = 32, r = Math.min(e.width, n), s = Math.min(e.height, n), o = Xt._sampleContext;
        o ? o.clearRect(0, 0, n + 1, n + 1) : o = Xt._sampleContext = wt.getContext(
          new G(n)
        ), o.save();
        var a = new ft().scale(r / e.width, s / e.height).translate(-e.x, -e.y);
        a.applyToContext(o), i && i.draw(o, new I({ clip: !0, matrices: [a] })), this._matrix.applyToContext(o);
        var h = this.getElement(), u = this._size;
        h && o.drawImage(h, -u.width / 2, -u.height / 2), o.restore();
        for (var _ = o.getImageData(
          0.5,
          0.5,
          Math.ceil(r),
          Math.ceil(s)
        ).data, d = [0, 0, 0], c = 0, l = 0, v = _.length; l < v; l += 4) {
          var y = _[l + 3];
          c += y, y /= 255, d[0] += _[l] * y, d[1] += _[l + 1] * y, d[2] += _[l + 2] * y;
        }
        for (var l = 0; l < 3; l++)
          d[l] /= c;
        return c ? St.read(d) : null;
      },
      getPixel: function() {
        var t = L.read(arguments), e = this.getContext().getImageData(t.x, t.y, 1, 1).data;
        return new St(
          "rgb",
          [e[0] / 255, e[1] / 255, e[2] / 255],
          e[3] / 255
        );
      },
      setPixel: function() {
        var t = arguments, e = L.read(t), i = St.read(t), n = i._convert("rgb"), r = i._alpha, s = this.getContext(!0), o = s.createImageData(1, 1), a = o.data;
        a[0] = n[0] * 255, a[1] = n[1] * 255, a[2] = n[2] * 255, a[3] = r != null ? r * 255 : 255, s.putImageData(o, e.x, e.y);
      },
      clear: function() {
        var t = this._size;
        this.getContext(!0).clearRect(0, 0, t.width + 1, t.height + 1);
      },
      createImageData: function() {
        var t = G.read(arguments);
        return this.getContext().createImageData(t.width, t.height);
      },
      getImageData: function() {
        var t = j.read(arguments);
        return t.isEmpty() && (t = new j(this._size)), this.getContext().getImageData(
          t.x,
          t.y,
          t.width,
          t.height
        );
      },
      putImageData: function(t) {
        var e = L.read(arguments, 1);
        this.getContext(!0).putImageData(t, e.x, e.y);
      },
      setImageData: function(t) {
        this.setSize(t), this.getContext(!0).putImageData(t, 0, 0);
      },
      _getBounds: function(t, e) {
        var i = new j(this._size).setCenter(0, 0);
        return t ? t._transformBounds(i) : i;
      },
      _hitTestSelf: function(t) {
        if (this._contains(t)) {
          var e = this;
          return new Ft("pixel", e, {
            offset: t.add(e._size.divide(2)).round(),
            color: {
              get: function() {
                return e.getPixel(this.offset);
              }
            }
          });
        }
      },
      _draw: function(t, e, i) {
        var n = this.getElement();
        if (n && n.width > 0 && n.height > 0) {
          t.globalAlpha = et.clamp(this._opacity, 0, 1), this._setStyles(t, e, i);
          var r = this._smoothing, s = r === "off";
          vt.setPrefixed(
            t,
            s ? "imageSmoothingEnabled" : "imageSmoothingQuality",
            s ? !1 : r
          ), t.drawImage(
            n,
            -this._size.width / 2,
            -this._size.height / 2
          );
        }
      },
      _canComposite: function() {
        return !0;
      }
    }), ne = $.extend({
      _class: "SymbolItem",
      _applyMatrix: !1,
      _canApplyMatrix: !1,
      _boundsOptions: { stroke: !0 },
      _serializeFields: {
        symbol: null
      },
      initialize: function(e, i) {
        this._initialize(
          e,
          i !== B && L.read(arguments, 1)
        ) || this.setDefinition(e instanceof Rt ? e : new Rt(e));
      },
      _equals: function(t) {
        return this._definition === t._definition;
      },
      copyContent: function(t) {
        this.setDefinition(t._definition);
      },
      getDefinition: function() {
        return this._definition;
      },
      setDefinition: function(t) {
        this._definition = t, this._changed(9);
      },
      getSymbol: "#getDefinition",
      setSymbol: "#setDefinition",
      isEmpty: function() {
        return this._definition._item.isEmpty();
      },
      _getBounds: function(t, e) {
        var i = this._definition._item;
        return i._getCachedBounds(i._matrix.prepended(t), e);
      },
      _hitTestSelf: function(t, e, i) {
        var n = e.extend({ all: !1 }), r = this._definition._item._hitTest(t, n, i);
        return r && (r.item = this), r;
      },
      _draw: function(t, e) {
        this._definition._item.draw(t, e);
      }
    }), Rt = I.extend({
      _class: "SymbolDefinition",
      initialize: function(e, i) {
        this._id = Ht.get(), this.project = rt.project, e && this.setItem(e, i);
      },
      _serialize: function(t, e) {
        return e.add(this, function() {
          return I.serialize(
            [this._class, this._item],
            t,
            !1,
            e
          );
        });
      },
      _changed: function(t) {
        t & 8 && $._clearBoundsCache(this), t & 1 && this.project._changed(t);
      },
      getItem: function() {
        return this._item;
      },
      setItem: function(t, e) {
        t._symbol && (t = t.clone()), this._item && (this._item._symbol = null), this._item = t, t.remove(), t.setSelected(!1), e || t.setPosition(new L()), t._symbol = this, this._changed(9);
      },
      getDefinition: "#getItem",
      setDefinition: "#setItem",
      place: function(t) {
        return new ne(this, t);
      },
      clone: function() {
        return new Rt(this._item.clone(!1));
      },
      equals: function(t) {
        return t === this || t && this._item.equals(t._item) || !1;
      }
    }), Ft = I.extend({
      _class: "HitResult",
      initialize: function(e, i, n) {
        this.type = e, this.item = i, n && this.inject(n);
      },
      statics: {
        getOptions: function(t) {
          var e = t && I.read(t);
          return new I({
            type: null,
            tolerance: rt.settings.hitTolerance,
            fill: !e,
            stroke: !e,
            segments: !e,
            handles: !1,
            ends: !1,
            position: !1,
            center: !1,
            bounds: !1,
            guides: !1,
            selected: !1
          }, e);
        }
      }
    }), J = I.extend({
      _class: "Segment",
      beans: !0,
      _selection: 0,
      initialize: function(e, i, n, r, s, o) {
        var a = arguments.length, h, u, _, d;
        a > 0 && (e == null || typeof e == "object" ? a === 1 && e && "point" in e ? (h = e.point, u = e.handleIn, _ = e.handleOut, d = e.selection) : (h = e, u = i, _ = n, d = r) : (h = [e, i], u = n !== B ? [n, r] : null, _ = s !== B ? [s, o] : null)), new re(h, this, "_point"), new re(u, this, "_handleIn"), new re(_, this, "_handleOut"), d && this.setSelection(d);
      },
      _serialize: function(t, e) {
        var i = this._point, n = this._selection, r = n || this.hasHandles() ? [i, this._handleIn, this._handleOut] : i;
        return n && r.push(n), I.serialize(r, t, !0, e);
      },
      _changed: function(t) {
        var e = this._path;
        if (e) {
          var i = e._curves, n = this._index, r;
          i && ((!t || t === this._point || t === this._handleIn) && (r = n > 0 ? i[n - 1] : e._closed ? i[i.length - 1] : null) && r._changed(), (!t || t === this._point || t === this._handleOut) && (r = i[n]) && r._changed()), e._changed(41);
        }
      },
      getPoint: function() {
        return this._point;
      },
      setPoint: function() {
        this._point.set(L.read(arguments));
      },
      getHandleIn: function() {
        return this._handleIn;
      },
      setHandleIn: function() {
        this._handleIn.set(L.read(arguments));
      },
      getHandleOut: function() {
        return this._handleOut;
      },
      setHandleOut: function() {
        this._handleOut.set(L.read(arguments));
      },
      hasHandles: function() {
        return !this._handleIn.isZero() || !this._handleOut.isZero();
      },
      isSmooth: function() {
        var t = this._handleIn, e = this._handleOut;
        return !t.isZero() && !e.isZero() && t.isCollinear(e);
      },
      clearHandles: function() {
        this._handleIn._set(0, 0), this._handleOut._set(0, 0);
      },
      getSelection: function() {
        return this._selection;
      },
      setSelection: function(t) {
        var e = this._selection, i = this._path;
        this._selection = t = t || 0, i && t !== e && (i._updateSelection(this, e, t), i._changed(257));
      },
      _changeSelection: function(t, e) {
        var i = this._selection;
        this.setSelection(e ? i | t : i & ~t);
      },
      isSelected: function() {
        return !!(this._selection & 7);
      },
      setSelected: function(t) {
        this._changeSelection(7, t);
      },
      getIndex: function() {
        return this._index !== B ? this._index : null;
      },
      getPath: function() {
        return this._path || null;
      },
      getCurve: function() {
        var t = this._path, e = this._index;
        return t ? (e > 0 && !t._closed && e === t._segments.length - 1 && e--, t.getCurves()[e] || null) : null;
      },
      getLocation: function() {
        var t = this.getCurve();
        return t ? new kt(t, this === t._segment1 ? 0 : 1) : null;
      },
      getNext: function() {
        var t = this._path && this._path._segments;
        return t && (t[this._index + 1] || this._path._closed && t[0]) || null;
      },
      smooth: function(t, e, i) {
        var n = t || {}, r = n.type, s = n.factor, o = this.getPrevious(), a = this.getNext(), h = (o || this)._point, u = this._point, _ = (a || this)._point, d = h.getDistance(u), c = u.getDistance(_);
        if (!r || r === "catmull-rom") {
          var l = s === B ? 0.5 : s, v = Math.pow(d, l), y = v * v, C = Math.pow(c, l), p = C * C;
          if (!e && o) {
            var m = 2 * p + 3 * C * v + y, f = 3 * C * (C + v);
            this.setHandleIn(f !== 0 ? new L(
              (p * h._x + m * u._x - y * _._x) / f - u._x,
              (p * h._y + m * u._y - y * _._y) / f - u._y
            ) : new L());
          }
          if (!i && a) {
            var m = 2 * y + 3 * v * C + p, f = 3 * v * (v + C);
            this.setHandleOut(f !== 0 ? new L(
              (y * _._x + m * u._x - p * h._x) / f - u._x,
              (y * _._y + m * u._y - p * h._y) / f - u._y
            ) : new L());
          }
        } else if (r === "geometric") {
          if (o && a) {
            var g = h.subtract(_), w = s === B ? 0.4 : s, S = w * d / (d + c);
            e || this.setHandleIn(g.multiply(S)), i || this.setHandleOut(g.multiply(S - w));
          }
        } else
          throw new Error("Smoothing method '" + r + "' not supported.");
      },
      getPrevious: function() {
        var t = this._path && this._path._segments;
        return t && (t[this._index - 1] || this._path._closed && t[t.length - 1]) || null;
      },
      isFirst: function() {
        return !this._index;
      },
      isLast: function() {
        var t = this._path;
        return t && this._index === t._segments.length - 1 || !1;
      },
      reverse: function() {
        var t = this._handleIn, e = this._handleOut, i = t.clone();
        t.set(e), e.set(i);
      },
      reversed: function() {
        return new J(this._point, this._handleOut, this._handleIn);
      },
      remove: function() {
        return this._path ? !!this._path.removeSegment(this._index) : !1;
      },
      clone: function() {
        return new J(this._point, this._handleIn, this._handleOut);
      },
      equals: function(t) {
        return t === this || t && this._class === t._class && this._point.equals(t._point) && this._handleIn.equals(t._handleIn) && this._handleOut.equals(t._handleOut) || !1;
      },
      toString: function() {
        var t = ["point: " + this._point];
        return this._handleIn.isZero() || t.push("handleIn: " + this._handleIn), this._handleOut.isZero() || t.push("handleOut: " + this._handleOut), "{ " + t.join(", ") + " }";
      },
      transform: function(t) {
        this._transformCoordinates(t, new Array(6), !0), this._changed();
      },
      interpolate: function(t, e, i) {
        var n = 1 - i, r = i, s = t._point, o = e._point, a = t._handleIn, h = e._handleIn, u = e._handleOut, _ = t._handleOut;
        this._point._set(
          n * s._x + r * o._x,
          n * s._y + r * o._y,
          !0
        ), this._handleIn._set(
          n * a._x + r * h._x,
          n * a._y + r * h._y,
          !0
        ), this._handleOut._set(
          n * _._x + r * u._x,
          n * _._y + r * u._y,
          !0
        ), this._changed();
      },
      _transformCoordinates: function(t, e, i) {
        var n = this._point, r = !i || !this._handleIn.isZero() ? this._handleIn : null, s = !i || !this._handleOut.isZero() ? this._handleOut : null, o = n._x, a = n._y, h = 2;
        return e[0] = o, e[1] = a, r && (e[h++] = r._x + o, e[h++] = r._y + a), s && (e[h++] = s._x + o, e[h++] = s._y + a), t && (t._transformCoordinates(e, e, h / 2), o = e[0], a = e[1], i ? (n._x = o, n._y = a, h = 2, r && (r._x = e[h++] - o, r._y = e[h++] - a), s && (s._x = e[h++] - o, s._y = e[h++] - a)) : (r || (e[h++] = o, e[h++] = a), s || (e[h++] = o, e[h++] = a))), e;
      }
    }), re = L.extend({
      initialize: function(e, i, n) {
        var r, s, o;
        if (!e)
          r = s = 0;
        else if ((r = e[0]) !== B)
          s = e[1];
        else {
          var a = e;
          (r = a.x) === B && (a = L.read(arguments), r = a.x), s = a.y, o = a.selected;
        }
        this._x = r, this._y = s, this._owner = i, i[n] = this, o && this.setSelected(!0);
      },
      _set: function(t, e) {
        return this._x = t, this._y = e, this._owner._changed(this), this;
      },
      getX: function() {
        return this._x;
      },
      setX: function(t) {
        this._x = t, this._owner._changed(this);
      },
      getY: function() {
        return this._y;
      },
      setY: function(t) {
        this._y = t, this._owner._changed(this);
      },
      isZero: function() {
        var t = et.isZero;
        return t(this._x) && t(this._y);
      },
      isSelected: function() {
        return !!(this._owner._selection & this._getSelection());
      },
      setSelected: function(t) {
        this._owner._changeSelection(this._getSelection(), t);
      },
      _getSelection: function() {
        var t = this._owner;
        return this === t._point ? 1 : this === t._handleIn ? 2 : this === t._handleOut ? 4 : 0;
      }
    }), R = I.extend(
      {
        _class: "Curve",
        beans: !0,
        initialize: function(e, i, n, r, s, o, a, h) {
          var u = arguments.length, _, d, c, l, v, y;
          u === 3 ? (this._path = e, _ = i, d = n) : u ? u === 1 ? "segment1" in e ? (_ = new J(e.segment1), d = new J(e.segment2)) : "point1" in e ? (c = e.point1, v = e.handle1, y = e.handle2, l = e.point2) : Array.isArray(e) && (c = [e[0], e[1]], l = [e[6], e[7]], v = [e[2] - e[0], e[3] - e[1]], y = [e[4] - e[6], e[5] - e[7]]) : u === 2 ? (_ = new J(e), d = new J(i)) : u === 4 ? (c = e, v = i, y = n, l = r) : u === 8 && (c = [e, i], l = [a, h], v = [n - e, r - i], y = [s - a, o - h]) : (_ = new J(), d = new J()), this._segment1 = _ || new J(c, null, v), this._segment2 = d || new J(l, y, null);
        },
        _serialize: function(t, e) {
          return I.serialize(
            this.hasHandles() ? [
              this.getPoint1(),
              this.getHandle1(),
              this.getHandle2(),
              this.getPoint2()
            ] : [this.getPoint1(), this.getPoint2()],
            t,
            !0,
            e
          );
        },
        _changed: function() {
          this._length = this._bounds = B;
        },
        clone: function() {
          return new R(this._segment1, this._segment2);
        },
        toString: function() {
          var t = ["point1: " + this._segment1._point];
          return this._segment1._handleOut.isZero() || t.push("handle1: " + this._segment1._handleOut), this._segment2._handleIn.isZero() || t.push("handle2: " + this._segment2._handleIn), t.push("point2: " + this._segment2._point), "{ " + t.join(", ") + " }";
        },
        classify: function() {
          return R.classify(this.getValues());
        },
        remove: function() {
          var t = !1;
          if (this._path) {
            var e = this._segment2, i = e._handleOut;
            t = e.remove(), t && this._segment1._handleOut.set(i);
          }
          return t;
        },
        getPoint1: function() {
          return this._segment1._point;
        },
        setPoint1: function() {
          this._segment1._point.set(L.read(arguments));
        },
        getPoint2: function() {
          return this._segment2._point;
        },
        setPoint2: function() {
          this._segment2._point.set(L.read(arguments));
        },
        getHandle1: function() {
          return this._segment1._handleOut;
        },
        setHandle1: function() {
          this._segment1._handleOut.set(L.read(arguments));
        },
        getHandle2: function() {
          return this._segment2._handleIn;
        },
        setHandle2: function() {
          this._segment2._handleIn.set(L.read(arguments));
        },
        getSegment1: function() {
          return this._segment1;
        },
        getSegment2: function() {
          return this._segment2;
        },
        getPath: function() {
          return this._path;
        },
        getIndex: function() {
          return this._segment1._index;
        },
        getNext: function() {
          var t = this._path && this._path._curves;
          return t && (t[this._segment1._index + 1] || this._path._closed && t[0]) || null;
        },
        getPrevious: function() {
          var t = this._path && this._path._curves;
          return t && (t[this._segment1._index - 1] || this._path._closed && t[t.length - 1]) || null;
        },
        isFirst: function() {
          return !this._segment1._index;
        },
        isLast: function() {
          var t = this._path;
          return t && this._segment1._index === t._curves.length - 1 || !1;
        },
        isSelected: function() {
          return this.getPoint1().isSelected() && this.getHandle1().isSelected() && this.getHandle2().isSelected() && this.getPoint2().isSelected();
        },
        setSelected: function(t) {
          this.getPoint1().setSelected(t), this.getHandle1().setSelected(t), this.getHandle2().setSelected(t), this.getPoint2().setSelected(t);
        },
        getValues: function(t) {
          return R.getValues(this._segment1, this._segment2, t);
        },
        getPoints: function() {
          for (var t = this.getValues(), e = [], i = 0; i < 8; i += 2)
            e.push(new L(t[i], t[i + 1]));
          return e;
        }
      },
      {
        getLength: function() {
          return this._length == null && (this._length = R.getLength(this.getValues(), 0, 1)), this._length;
        },
        getArea: function() {
          return R.getArea(this.getValues());
        },
        getLine: function() {
          return new Pt(this._segment1._point, this._segment2._point);
        },
        getPart: function(t, e) {
          return new R(R.getPart(this.getValues(), t, e));
        },
        getPartLength: function(t, e) {
          return R.getLength(this.getValues(), t, e);
        },
        divideAt: function(t) {
          return this.divideAtTime(t && t.curve === this ? t.time : this.getTimeAt(t));
        },
        divideAtTime: function(t, e) {
          var i = 1e-8, n = 1 - i, r = null;
          if (t >= i && t <= n) {
            var s = R.subdivide(this.getValues(), t), o = s[0], a = s[1], h = e || this.hasHandles(), u = this._segment1, _ = this._segment2, d = this._path;
            h && (u._handleOut._set(o[2] - o[0], o[3] - o[1]), _._handleIn._set(a[4] - a[6], a[5] - a[7]));
            var c = o[6], l = o[7], v = new J(
              new L(c, l),
              h && new L(o[4] - c, o[5] - l),
              h && new L(a[2] - c, a[3] - l)
            );
            d ? (d.insert(u._index + 1, v), r = this.getNext()) : (this._segment2 = v, this._changed(), r = new R(v, _));
          }
          return r;
        },
        splitAt: function(t) {
          var e = this._path;
          return e ? e.splitAt(t) : null;
        },
        splitAtTime: function(t) {
          return this.splitAt(this.getLocationAtTime(t));
        },
        divide: function(t, e) {
          return this.divideAtTime(t === B ? 0.5 : e ? t : this.getTimeAt(t));
        },
        split: function(t, e) {
          return this.splitAtTime(t === B ? 0.5 : e ? t : this.getTimeAt(t));
        },
        reversed: function() {
          return new R(this._segment2.reversed(), this._segment1.reversed());
        },
        clearHandles: function() {
          this._segment1._handleOut._set(0, 0), this._segment2._handleIn._set(0, 0);
        },
        statics: {
          getValues: function(t, e, i, n) {
            var r = t._point, s = t._handleOut, o = e._handleIn, a = e._point, h = r.x, u = r.y, _ = a.x, d = a.y, c = n ? [h, u, h, u, _, d, _, d] : [
              h,
              u,
              h + s._x,
              u + s._y,
              _ + o._x,
              d + o._y,
              _,
              d
            ];
            return i && i._transformCoordinates(c, c, 4), c;
          },
          subdivide: function(t, e) {
            var i = t[0], n = t[1], r = t[2], s = t[3], o = t[4], a = t[5], h = t[6], u = t[7];
            e === B && (e = 0.5);
            var _ = 1 - e, d = _ * i + e * r, c = _ * n + e * s, l = _ * r + e * o, v = _ * s + e * a, y = _ * o + e * h, C = _ * a + e * u, p = _ * d + e * l, m = _ * c + e * v, f = _ * l + e * y, g = _ * v + e * C, w = _ * p + e * f, S = _ * m + e * g;
            return [
              [i, n, d, c, p, m, w, S],
              [w, S, f, g, y, C, h, u]
            ];
          },
          getMonoCurves: function(t, e) {
            var i = [], n = e ? 0 : 1, r = t[n + 0], s = t[n + 2], o = t[n + 4], a = t[n + 6];
            if (r >= s == s >= o && s >= o == o >= a || R.isStraight(t))
              i.push(t);
            else {
              var h = 3 * (s - o) - r + a, u = 2 * (r + o) - 4 * s, _ = s - r, d = 1e-8, c = 1 - d, l = [], v = et.solveQuadratic(h, u, _, l, d, c);
              if (!v)
                i.push(t);
              else {
                l.sort();
                var y = l[0], C = R.subdivide(t, y);
                i.push(C[0]), v > 1 && (y = (l[1] - y) / (1 - y), C = R.subdivide(C[1], y), i.push(C[0])), i.push(C[1]);
              }
            }
            return i;
          },
          solveCubic: function(t, e, i, n, r, s) {
            var o = t[e], a = t[e + 2], h = t[e + 4], u = t[e + 6], _ = 0;
            if (!(o < i && u < i && a < i && h < i || o > i && u > i && a > i && h > i)) {
              var d = 3 * (a - o), c = 3 * (h - a) - d, l = u - o - d - c;
              _ = et.solveCubic(l, c, d, o - i, n, r, s);
            }
            return _;
          },
          getTimeOf: function(t, e) {
            var i = new L(t[0], t[1]), n = new L(t[6], t[7]), r = 1e-12, s = 1e-7, o = e.isClose(i, r) ? 0 : e.isClose(n, r) ? 1 : null;
            if (o === null)
              for (var a = [e.x, e.y], h = [], u = 0; u < 2; u++)
                for (var _ = R.solveCubic(t, u, a[u], h, 0, 1), d = 0; d < _; d++) {
                  var c = h[d];
                  if (e.isClose(R.getPoint(t, c), s))
                    return c;
                }
            return e.isClose(i, s) ? 0 : e.isClose(n, s) ? 1 : null;
          },
          getNearestTime: function(t, e) {
            if (R.isStraight(t)) {
              var i = t[0], n = t[1], r = t[6], s = t[7], o = r - i, a = s - n, h = o * o + a * a;
              if (h === 0)
                return 0;
              var u = ((e.x - i) * o + (e.y - n) * a) / h;
              return u < 1e-12 ? 0 : u > 0.999999999999 ? 1 : R.getTimeOf(
                t,
                new L(i + u * o, n + u * a)
              );
            }
            var _ = 100, d = 1 / 0, c = 0;
            function l(C) {
              if (C >= 0 && C <= 1) {
                var p = e.getDistance(R.getPoint(t, C), !0);
                if (p < d)
                  return d = p, c = C, !0;
              }
            }
            for (var v = 0; v <= _; v++)
              l(v / _);
            for (var y = 1 / (_ * 2); y > 1e-8; )
              !l(c - y) && !l(c + y) && (y /= 2);
            return c;
          },
          getPart: function(t, e, i) {
            var n = e > i;
            if (n) {
              var r = e;
              e = i, i = r;
            }
            return e > 0 && (t = R.subdivide(t, e)[1]), i < 1 && (t = R.subdivide(t, (i - e) / (1 - e))[0]), n ? [t[6], t[7], t[4], t[5], t[2], t[3], t[0], t[1]] : t;
          },
          isFlatEnough: function(t, e) {
            var i = t[0], n = t[1], r = t[2], s = t[3], o = t[4], a = t[5], h = t[6], u = t[7], _ = 3 * r - 2 * i - h, d = 3 * s - 2 * n - u, c = 3 * o - 2 * h - i, l = 3 * a - 2 * u - n;
            return Math.max(_ * _, c * c) + Math.max(d * d, l * l) <= 16 * e * e;
          },
          getArea: function(t) {
            var e = t[0], i = t[1], n = t[2], r = t[3], s = t[4], o = t[5], a = t[6], h = t[7];
            return 3 * ((h - i) * (n + s) - (a - e) * (r + o) + r * (e - s) - n * (i - o) + h * (s + e / 3) - a * (o + i / 3)) / 20;
          },
          getBounds: function(t) {
            for (var e = t.slice(0, 2), i = e.slice(), n = [0, 0], r = 0; r < 2; r++)
              R._addBounds(
                t[r],
                t[r + 2],
                t[r + 4],
                t[r + 6],
                r,
                0,
                e,
                i,
                n
              );
            return new j(e[0], e[1], i[0] - e[0], i[1] - e[1]);
          },
          _addBounds: function(t, e, i, n, r, s, o, a, h) {
            function u(w, S) {
              var x = w - S, b = w + S;
              x < o[r] && (o[r] = x), b > a[r] && (a[r] = b);
            }
            s /= 2;
            var _ = o[r] + s, d = a[r] - s;
            if (t < _ || e < _ || i < _ || n < _ || t > d || e > d || i > d || n > d)
              if (e < t != e < n && i < t != i < n)
                u(t, 0), u(n, 0);
              else {
                var c = 3 * (e - i) - t + n, l = 2 * (t + i) - 4 * e, v = e - t, y = et.solveQuadratic(c, l, v, h), C = 1e-8, p = 1 - C;
                u(n, 0);
                for (var m = 0; m < y; m++) {
                  var f = h[m], g = 1 - f;
                  C <= f && f <= p && u(
                    g * g * g * t + 3 * g * g * f * e + 3 * g * f * f * i + f * f * f * n,
                    s
                  );
                }
              }
          }
        }
      },
      I.each(
        ["getBounds", "getStrokeBounds", "getHandleBounds"],
        function(t) {
          this[t] = function() {
            this._bounds || (this._bounds = {});
            var e = this._bounds[t];
            return e || (e = this._bounds[t] = ot[t](
              [this._segment1, this._segment2],
              !1,
              this._path
            )), e.clone();
          };
        },
        {}
      ),
      I.each({
        isStraight: function(t, e, i, n) {
          if (e.isZero() && i.isZero())
            return !0;
          var r = n.subtract(t);
          if (r.isZero())
            return !1;
          if (r.isCollinear(e) && r.isCollinear(i)) {
            var s = new Pt(t, n), o = 1e-7;
            if (s.getDistance(t.add(e)) < o && s.getDistance(n.add(i)) < o) {
              var a = r.dot(r), h = r.dot(e) / a, u = r.dot(i) / a;
              return h >= 0 && h <= 1 && u <= 0 && u >= -1;
            }
          }
          return !1;
        },
        isLinear: function(t, e, i, n) {
          var r = n.subtract(t).divide(3);
          return e.equals(r) && i.negate().equals(r);
        }
      }, function(t, e) {
        this[e] = function(i) {
          var n = this._segment1, r = this._segment2;
          return t(
            n._point,
            n._handleOut,
            r._handleIn,
            r._point,
            i
          );
        }, this.statics[e] = function(i, n) {
          var r = i[0], s = i[1], o = i[6], a = i[7];
          return t(
            new L(r, s),
            new L(i[2] - r, i[3] - s),
            new L(i[4] - o, i[5] - a),
            new L(o, a),
            n
          );
        };
      }, {
        statics: {},
        hasHandles: function() {
          return !this._segment1._handleOut.isZero() || !this._segment2._handleIn.isZero();
        },
        hasLength: function(t) {
          return (!this.getPoint1().equals(this.getPoint2()) || this.hasHandles()) && this.getLength() > (t || 0);
        },
        isCollinear: function(t) {
          return t && this.isStraight() && t.isStraight() && this.getLine().isCollinear(t.getLine());
        },
        isHorizontal: function() {
          return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).y) < 1e-8;
        },
        isVertical: function() {
          return this.isStraight() && Math.abs(this.getTangentAtTime(0.5).x) < 1e-8;
        }
      }),
      {
        beans: !1,
        getLocationAt: function(t, e) {
          return this.getLocationAtTime(
            e ? t : this.getTimeAt(t)
          );
        },
        getLocationAtTime: function(t) {
          return t != null && t >= 0 && t <= 1 ? new kt(this, t) : null;
        },
        getTimeAt: function(t, e) {
          return R.getTimeAt(this.getValues(), t, e);
        },
        getParameterAt: "#getTimeAt",
        getTimesWithTangent: function() {
          var t = L.read(arguments);
          return t.isZero() ? [] : R.getTimesWithTangent(this.getValues(), t);
        },
        getOffsetAtTime: function(t) {
          return this.getPartLength(0, t);
        },
        getLocationOf: function() {
          return this.getLocationAtTime(this.getTimeOf(L.read(arguments)));
        },
        getOffsetOf: function() {
          var t = this.getLocationOf.apply(this, arguments);
          return t ? t.getOffset() : null;
        },
        getTimeOf: function() {
          return R.getTimeOf(this.getValues(), L.read(arguments));
        },
        getParameterOf: "#getTimeOf",
        getNearestLocation: function() {
          var t = L.read(arguments), e = this.getValues(), i = R.getNearestTime(e, t), n = R.getPoint(e, i);
          return new kt(this, i, n, null, t.getDistance(n));
        },
        getNearestPoint: function() {
          var t = this.getNearestLocation.apply(this, arguments);
          return t && t.getPoint();
        }
      },
      new function() {
        var t = [
          "getPoint",
          "getTangent",
          "getNormal",
          "getWeightedTangent",
          "getWeightedNormal",
          "getCurvature"
        ];
        return I.each(
          t,
          function(e) {
            this[e + "At"] = function(i, n) {
              var r = this.getValues();
              return R[e](r, n ? i : R.getTimeAt(r, i));
            }, this[e + "AtTime"] = function(i) {
              return R[e](this.getValues(), i);
            };
          },
          {
            statics: {
              _evaluateMethods: t
            }
          }
        );
      }(),
      new function() {
        function t(n) {
          var r = n[0], s = n[1], o = n[2], a = n[3], h = n[4], u = n[5], _ = n[6], d = n[7], c = 9 * (o - h) + 3 * (_ - r), l = 6 * (r + h) - 12 * o, v = 3 * (o - r), y = 9 * (a - u) + 3 * (d - s), C = 6 * (s + u) - 12 * a, p = 3 * (a - s);
          return function(m) {
            var f = (c * m + l) * m + v, g = (y * m + C) * m + p;
            return Math.sqrt(f * f + g * g);
          };
        }
        function e(n, r) {
          return Math.max(2, Math.min(16, Math.ceil(Math.abs(r - n) * 32)));
        }
        function i(n, r, s, o) {
          if (r == null || r < 0 || r > 1)
            return null;
          var a = n[0], h = n[1], u = n[2], _ = n[3], d = n[4], c = n[5], l = n[6], v = n[7], y = et.isZero;
          y(u - a) && y(_ - h) && (u = a, _ = h), y(d - l) && y(c - v) && (d = l, c = v);
          var C = 3 * (u - a), p = 3 * (d - u) - C, m = l - a - C - p, f = 3 * (_ - h), g = 3 * (c - _) - f, w = v - h - f - g, S, x;
          if (s === 0)
            S = r === 0 ? a : r === 1 ? l : ((m * r + p) * r + C) * r + a, x = r === 0 ? h : r === 1 ? v : ((w * r + g) * r + f) * r + h;
          else {
            var b = 1e-8, P = 1 - b;
            if (r < b ? (S = C, x = f) : r > P ? (S = 3 * (l - d), x = 3 * (v - c)) : (S = (3 * m * r + 2 * p) * r + C, x = (3 * w * r + 2 * g) * r + f), o) {
              S === 0 && x === 0 && (r < b || r > P) && (S = d - u, x = c - _);
              var T = Math.sqrt(S * S + x * x);
              T && (S /= T, x /= T);
            }
            if (s === 3) {
              var d = 6 * m * r + 2 * p, c = 6 * w * r + 2 * g, z = Math.pow(S * S + x * x, 3 / 2);
              S = z !== 0 ? (S * c - x * d) / z : 0, x = 0;
            }
          }
          return s === 2 ? new L(x, -S) : new L(S, x);
        }
        return { statics: {
          classify: function(n) {
            var r = n[0], s = n[1], o = n[2], a = n[3], h = n[4], u = n[5], _ = n[6], d = n[7], c = r * (d - u) + s * (h - _) + _ * u - d * h, l = o * (s - d) + a * (_ - r) + r * d - s * _, v = h * (a - s) + u * (r - o) + o * s - a * r, y = 3 * v, C = y - l, p = C - l + c, m = Math.sqrt(p * p + C * C + y * y), f = m !== 0 ? 1 / m : 0, g = et.isZero, w = "serpentine";
            p *= f, C *= f, y *= f;
            function S(T, z, M) {
              var O = z !== B, A = O && z > 0 && z < 1, k = O && M > 0 && M < 1;
              return O && (!(A || k) || T === "loop" && !(A && k)) && (T = "arch", A = k = !1), {
                type: T,
                roots: A || k ? A && k ? z < M ? [z, M] : [M, z] : [A ? z : M] : null
              };
            }
            if (g(p))
              return g(C) ? S(g(y) ? "line" : "quadratic") : S(w, y / (3 * C));
            var x = 3 * C * C - 4 * p * y;
            if (g(x))
              return S("cusp", C / (2 * p));
            var b = x > 0 ? Math.sqrt(x / 3) : Math.sqrt(-x), P = 2 * p;
            return S(
              x > 0 ? w : "loop",
              (C + b) / P,
              (C - b) / P
            );
          },
          getLength: function(n, r, s, o) {
            if (r === B && (r = 0), s === B && (s = 1), R.isStraight(n)) {
              var a = n;
              s < 1 && (a = R.subdivide(a, s)[0], r /= s), r > 0 && (a = R.subdivide(a, r)[1]);
              var h = a[6] - a[0], u = a[7] - a[1];
              return Math.sqrt(h * h + u * u);
            }
            return et.integrate(
              o || t(n),
              r,
              s,
              e(r, s)
            );
          },
          getTimeAt: function(n, r, s) {
            if (s === B && (s = r < 0 ? 1 : 0), r === 0)
              return s;
            var o = Math.abs, a = 1e-12, h = r > 0, u = h ? s : 0, _ = h ? 1 : s, d = t(n), c = R.getLength(n, u, _, d), l = o(r) - c;
            if (o(l) < a)
              return h ? _ : u;
            if (l > a)
              return null;
            var v = r / c, y = 0;
            function C(p) {
              return y += et.integrate(
                d,
                s,
                p,
                e(s, p)
              ), s = p, y - r;
            }
            return et.findRoot(
              C,
              d,
              s + v,
              u,
              _,
              32,
              1e-12
            );
          },
          getPoint: function(n, r) {
            return i(n, r, 0, !1);
          },
          getTangent: function(n, r) {
            return i(n, r, 1, !0);
          },
          getWeightedTangent: function(n, r) {
            return i(n, r, 1, !1);
          },
          getNormal: function(n, r) {
            return i(n, r, 2, !0);
          },
          getWeightedNormal: function(n, r) {
            return i(n, r, 2, !1);
          },
          getCurvature: function(n, r) {
            return i(n, r, 3, !1).x;
          },
          getPeaks: function(n) {
            var r = n[0], s = n[1], o = n[2], a = n[3], h = n[4], u = n[5], _ = n[6], d = n[7], c = -r + 3 * o - 3 * h + _, l = 3 * r - 6 * o + 3 * h, v = -3 * r + 3 * o, y = -s + 3 * a - 3 * u + d, C = 3 * s - 6 * a + 3 * u, p = -3 * s + 3 * a, m = 1e-8, f = 1 - m, g = [];
            return et.solveCubic(
              9 * (c * c + y * y),
              9 * (c * l + C * y),
              2 * (l * l + C * C) + 3 * (v * c + p * y),
              v * l + C * p,
              g,
              m,
              f
            ), g.sort();
          }
        } };
      }(),
      new function() {
        function t(l, v, y, C, p, m, f) {
          var g = !f && y.getPrevious() === p, w = !f && y !== p && y.getNext() === p, S = 1e-8, x = 1 - S;
          if (C !== null && C >= (g ? S : 0) && C <= (w ? x : 1) && m !== null && m >= (w ? S : 0) && m <= (g ? x : 1)) {
            var b = new kt(y, C, null, f), P = new kt(p, m, null, f);
            b._intersection = P, P._intersection = b, (!v || v(b)) && kt.insert(l, b, !0);
          }
        }
        function e(l, v, y, C, p, m, f, g, w, S, x, b, P) {
          if (++w >= 4096 || ++g >= 40)
            return w;
          var T = 1e-9, z = v[0], M = v[1], O = v[6], A = v[7], k = Pt.getSignedDistance, N = k(z, M, O, A, v[2], v[3]), E = k(z, M, O, A, v[4], v[5]), F = N * E > 0 ? 3 / 4 : 4 / 9, D = F * Math.min(0, N, E), V = F * Math.max(0, N, E), K = k(z, M, O, A, l[0], l[1]), W = k(z, M, O, A, l[2], l[3]), U = k(z, M, O, A, l[4], l[5]), Z = k(z, M, O, A, l[6], l[7]), Q = i(K, W, U, Z), X = Q[0], ut = Q[1], it, st;
          if (N === 0 && E === 0 && K === 0 && W === 0 && U === 0 && Z === 0 || (it = n(X, ut, D, V)) == null || (st = n(
            X.reverse(),
            ut.reverse(),
            D,
            V
          )) == null)
            return w;
          var at = S + (x - S) * it, nt = S + (x - S) * st;
          if (Math.max(P - b, nt - at) < T) {
            var It = (at + nt) / 2, Tt = (b + P) / 2;
            t(
              p,
              m,
              f ? C : y,
              f ? Tt : It,
              f ? y : C,
              f ? It : Tt
            );
          } else {
            l = R.getPart(l, it, st);
            var Ot = P - b;
            if (st - it > 0.8)
              if (nt - at > Ot) {
                var xt = R.subdivide(l, 0.5), It = (at + nt) / 2;
                w = e(
                  v,
                  xt[0],
                  C,
                  y,
                  p,
                  m,
                  !f,
                  g,
                  w,
                  b,
                  P,
                  at,
                  It
                ), w = e(
                  v,
                  xt[1],
                  C,
                  y,
                  p,
                  m,
                  !f,
                  g,
                  w,
                  b,
                  P,
                  It,
                  nt
                );
              } else {
                var xt = R.subdivide(v, 0.5), Tt = (b + P) / 2;
                w = e(
                  xt[0],
                  l,
                  C,
                  y,
                  p,
                  m,
                  !f,
                  g,
                  w,
                  b,
                  Tt,
                  at,
                  nt
                ), w = e(
                  xt[1],
                  l,
                  C,
                  y,
                  p,
                  m,
                  !f,
                  g,
                  w,
                  Tt,
                  P,
                  at,
                  nt
                );
              }
            else
              Ot === 0 || Ot >= T ? w = e(
                v,
                l,
                C,
                y,
                p,
                m,
                !f,
                g,
                w,
                b,
                P,
                at,
                nt
              ) : w = e(
                l,
                v,
                y,
                C,
                p,
                m,
                f,
                g,
                w,
                at,
                nt,
                b,
                P
              );
          }
          return w;
        }
        function i(l, v, y, C) {
          var p = [0, l], m = [1 / 3, v], f = [2 / 3, y], g = [1, C], w = v - (2 * l + C) / 3, S = y - (l + 2 * C) / 3, x;
          if (w * S < 0)
            x = [[p, m, g], [p, f, g]];
          else {
            var b = w / S;
            x = [
              b >= 2 ? [p, m, g] : b <= 0.5 ? [p, f, g] : [p, m, f, g],
              [p, g]
            ];
          }
          return (w || S) < 0 ? x.reverse() : x;
        }
        function n(l, v, y, C) {
          return l[0][1] < y ? r(l, !0, y) : v[0][1] > C ? r(v, !1, C) : l[0][0];
        }
        function r(l, v, y) {
          for (var C = l[0][0], p = l[0][1], m = 1, f = l.length; m < f; m++) {
            var g = l[m][0], w = l[m][1];
            if (v ? w >= y : w <= y)
              return w === y ? g : C + (y - p) * (g - C) / (w - p);
            C = g, p = w;
          }
          return null;
        }
        function s(l, v, y, C, p) {
          var m = et.isZero;
          if (m(C) && m(p)) {
            var f = R.getTimeOf(l, new L(v, y));
            return f === null ? [] : [f];
          }
          for (var g = Math.atan2(-p, C), w = Math.sin(g), S = Math.cos(g), x = [], b = [], P = 0; P < 8; P += 2) {
            var T = l[P] - v, z = l[P + 1] - y;
            x.push(
              T * S - z * w,
              T * w + z * S
            );
          }
          return R.solveCubic(x, 1, 0, b, 0, 1), b;
        }
        function o(l, v, y, C, p, m, f) {
          for (var g = v[0], w = v[1], S = v[6], x = v[7], b = s(l, g, w, S - g, x - w), P = 0, T = b.length; P < T; P++) {
            var z = b[P], M = R.getPoint(l, z), O = R.getTimeOf(v, M);
            O !== null && t(
              p,
              m,
              f ? C : y,
              f ? O : z,
              f ? y : C,
              f ? z : O
            );
          }
        }
        function a(l, v, y, C, p, m) {
          var f = Pt.intersect(
            l[0],
            l[1],
            l[6],
            l[7],
            v[0],
            v[1],
            v[6],
            v[7]
          );
          f && t(
            p,
            m,
            y,
            R.getTimeOf(l, f),
            C,
            R.getTimeOf(v, f)
          );
        }
        function h(l, v, y, C, p, m) {
          var f = 1e-12, g = Math.min, w = Math.max;
          if (w(l[0], l[2], l[4], l[6]) + f > g(v[0], v[2], v[4], v[6]) && g(l[0], l[2], l[4], l[6]) - f < w(v[0], v[2], v[4], v[6]) && w(l[1], l[3], l[5], l[7]) + f > g(v[1], v[3], v[5], v[7]) && g(l[1], l[3], l[5], l[7]) - f < w(v[1], v[3], v[5], v[7])) {
            var S = d(l, v);
            if (S)
              for (var x = 0; x < 2; x++) {
                var b = S[x];
                t(
                  p,
                  m,
                  y,
                  b[0],
                  C,
                  b[1],
                  !0
                );
              }
            else {
              var P = R.isStraight(l), T = R.isStraight(v), z = P && T, M = P && !T, O = p.length;
              if ((z ? a : P || T ? o : e)(
                M ? v : l,
                M ? l : v,
                M ? C : y,
                M ? y : C,
                p,
                m,
                M,
                0,
                0,
                0,
                1,
                0,
                1
              ), !z || p.length === O)
                for (var x = 0; x < 4; x++) {
                  var A = x >> 1, k = x & 1, N = A * 6, E = k * 6, F = new L(l[N], l[N + 1]), D = new L(v[E], v[E + 1]);
                  F.isClose(D, f) && t(
                    p,
                    m,
                    y,
                    A,
                    C,
                    k
                  );
                }
            }
          }
          return p;
        }
        function u(l, v, y, C) {
          var p = R.classify(l);
          if (p.type === "loop") {
            var m = p.roots;
            t(
              y,
              C,
              v,
              m[0],
              v,
              m[1]
            );
          }
          return y;
        }
        function _(l, v, y, C, p, m) {
          var f = 1e-7, g = !v;
          g && (v = l);
          for (var w = l.length, S = v.length, x = new Array(w), b = g ? x : new Array(S), P = [], T = 0; T < w; T++)
            x[T] = l[T].getValues(C);
          if (!g)
            for (var T = 0; T < S; T++)
              b[T] = v[T].getValues(p);
          for (var z = yt.findCurveBoundsCollisions(
            x,
            b,
            f
          ), M = 0; M < w; M++) {
            var O = l[M], A = x[M];
            g && u(A, O, P, y);
            var k = z[M];
            if (k)
              for (var N = 0; N < k.length; N++) {
                if (m && P.length)
                  return P;
                var E = k[N];
                if (!g || E > M) {
                  var F = v[E], D = b[E];
                  h(
                    A,
                    D,
                    O,
                    F,
                    P,
                    y
                  );
                }
              }
          }
          return P;
        }
        function d(l, v) {
          function y(Z) {
            var Q = Z[6] - Z[0], X = Z[7] - Z[1];
            return Q * Q + X * X;
          }
          var C = Math.abs, p = Pt.getDistance, m = 1e-8, f = 1e-7, g = R.isStraight(l), w = R.isStraight(v), S = g && w, x = y(l) < y(v), b = x ? v : l, P = x ? l : v, T = b[0], z = b[1], M = b[6] - T, O = b[7] - z;
          if (p(T, z, M, O, P[0], P[1], !0) < f && p(T, z, M, O, P[6], P[7], !0) < f)
            !S && p(T, z, M, O, b[2], b[3], !0) < f && p(T, z, M, O, b[4], b[5], !0) < f && p(T, z, M, O, P[2], P[3], !0) < f && p(T, z, M, O, P[4], P[5], !0) < f && (g = w = S = !0);
          else if (S)
            return null;
          if (g ^ w)
            return null;
          for (var A = [l, v], k = [], N = 0; N < 4 && k.length < 2; N++) {
            var E = N & 1, F = E ^ 1, D = N >> 1, V = R.getTimeOf(A[E], new L(
              A[F][D ? 6 : 0],
              A[F][D ? 7 : 1]
            ));
            if (V != null) {
              var K = E ? [D, V] : [V, D];
              (!k.length || C(K[0] - k[0][0]) > m && C(K[1] - k[0][1]) > m) && k.push(K);
            }
            if (N > 2 && !k.length)
              break;
          }
          if (k.length !== 2)
            k = null;
          else if (!S) {
            var W = R.getPart(l, k[0][0], k[1][0]), U = R.getPart(v, k[0][1], k[1][1]);
            (C(U[2] - W[2]) > f || C(U[3] - W[3]) > f || C(U[4] - W[4]) > f || C(U[5] - W[5]) > f) && (k = null);
          }
          return k;
        }
        function c(l, v) {
          var y = l[0], C = l[1], p = l[2], m = l[3], f = l[4], g = l[5], w = l[6], S = l[7], x = v.normalize(), b = x.x, P = x.y, T = 3 * w - 9 * f + 9 * p - 3 * y, z = 3 * S - 9 * g + 9 * m - 3 * C, M = 6 * f - 12 * p + 6 * y, O = 6 * g - 12 * m + 6 * C, A = 3 * p - 3 * y, k = 3 * m - 3 * C, N = 2 * T * P - 2 * z * b, E = [];
          if (Math.abs(N) < et.CURVETIME_EPSILON) {
            var F = T * k - z * A, N = T * O - z * M;
            if (N != 0) {
              var D = -F / N;
              D >= 0 && D <= 1 && E.push(D);
            }
          } else {
            var V = (M * M - 4 * T * A) * P * P + (-2 * M * O + 4 * z * A + 4 * T * k) * b * P + (O * O - 4 * z * k) * b * b, K = M * P - O * b;
            if (V >= 0 && N != 0) {
              var W = Math.sqrt(V), U = -(K + W) / N, Z = (-K + W) / N;
              U >= 0 && U <= 1 && E.push(U), Z >= 0 && Z <= 1 && E.push(Z);
            }
          }
          return E;
        }
        return {
          getIntersections: function(l) {
            var v = this.getValues(), y = l && l !== this && l.getValues();
            return y ? h(v, y, this, l, []) : u(v, this, []);
          },
          statics: {
            getOverlaps: d,
            getIntersections: _,
            getCurveLineIntersections: s,
            getTimesWithTangent: c
          }
        };
      }()
    ), kt = I.extend(
      {
        _class: "CurveLocation",
        initialize: function(e, i, n, r, s) {
          if (i >= 0.99999999) {
            var o = e.getNext();
            o && (i = 0, e = o);
          }
          this._setCurve(e), this._time = i, this._point = n || e.getPointAtTime(i), this._overlap = r, this._distance = s, this._intersection = this._next = this._previous = null;
        },
        _setPath: function(t) {
          this._path = t, this._version = t ? t._version : 0;
        },
        _setCurve: function(t) {
          this._setPath(t._path), this._curve = t, this._segment = null, this._segment1 = t._segment1, this._segment2 = t._segment2;
        },
        _setSegment: function(t) {
          var e = t.getCurve();
          e ? this._setCurve(e) : (this._setPath(t._path), this._segment1 = t, this._segment2 = null), this._segment = t, this._time = t === this._segment1 ? 0 : 1, this._point = t._point.clone();
        },
        getSegment: function() {
          var t = this._segment;
          if (!t) {
            var e = this.getCurve(), i = this.getTime();
            i === 0 ? t = e._segment1 : i === 1 ? t = e._segment2 : i != null && (t = e.getPartLength(0, i) < e.getPartLength(i, 1) ? e._segment1 : e._segment2), this._segment = t;
          }
          return t;
        },
        getCurve: function() {
          var t = this._path, e = this;
          t && t._version !== this._version && (this._time = this._offset = this._curveOffset = this._curve = null);
          function i(n) {
            var r = n && n.getCurve();
            if (r && (e._time = r.getTimeOf(e._point)) != null)
              return e._setCurve(r), r;
          }
          return this._curve || i(this._segment) || i(this._segment1) || i(this._segment2.getPrevious());
        },
        getPath: function() {
          var t = this.getCurve();
          return t && t._path;
        },
        getIndex: function() {
          var t = this.getCurve();
          return t && t.getIndex();
        },
        getTime: function() {
          var t = this.getCurve(), e = this._time;
          return t && e == null ? this._time = t.getTimeOf(this._point) : e;
        },
        getParameter: "#getTime",
        getPoint: function() {
          return this._point;
        },
        getOffset: function() {
          var t = this._offset;
          if (t == null) {
            t = 0;
            var e = this.getPath(), i = this.getIndex();
            if (e && i != null)
              for (var n = e.getCurves(), r = 0; r < i; r++)
                t += n[r].getLength();
            this._offset = t += this.getCurveOffset();
          }
          return t;
        },
        getCurveOffset: function() {
          var t = this._curveOffset;
          if (t == null) {
            var e = this.getCurve(), i = this.getTime();
            this._curveOffset = t = i != null && e && e.getPartLength(0, i);
          }
          return t;
        },
        getIntersection: function() {
          return this._intersection;
        },
        getDistance: function() {
          return this._distance;
        },
        divide: function() {
          var t = this.getCurve(), e = t && t.divideAtTime(this.getTime());
          return e && this._setSegment(e._segment1), e;
        },
        split: function() {
          var t = this.getCurve(), e = t._path, i = t && t.splitAtTime(this.getTime());
          return i && this._setSegment(e.getLastSegment()), i;
        },
        equals: function(t, e) {
          var i = this === t;
          if (!i && t instanceof kt) {
            var n = this.getCurve(), r = t.getCurve(), s = n._path, o = r._path;
            if (s === o) {
              var a = Math.abs, h = 1e-7, u = a(this.getOffset() - t.getOffset()), _ = !e && this._intersection, d = !e && t._intersection;
              i = (u < h || s && a(s.getLength() - u) < h) && (!_ && !d || _ && d && _.equals(d, !0));
            }
          }
          return i;
        },
        toString: function() {
          var t = [], e = this.getPoint(), i = ht.instance;
          e && t.push("point: " + e);
          var n = this.getIndex();
          n != null && t.push("index: " + n);
          var r = this.getTime();
          return r != null && t.push("time: " + i.number(r)), this._distance != null && t.push("distance: " + i.number(this._distance)), "{ " + t.join(", ") + " }";
        },
        isTouching: function() {
          var t = this._intersection;
          if (t && this.getTangent().isCollinear(t.getTangent())) {
            var e = this.getCurve(), i = t.getCurve();
            return !(e.isStraight() && i.isStraight() && e.getLine().intersect(i.getLine()));
          }
          return !1;
        },
        isCrossing: function() {
          var t = this._intersection;
          if (!t)
            return !1;
          var e = this.getTime(), i = t.getTime(), n = 1e-8, r = 1 - n, s = e >= n && e <= r, o = i >= n && i <= r;
          if (s && o)
            return !this.isTouching();
          var a = this.getCurve(), h = a && e < n ? a.getPrevious() : a, u = t.getCurve(), _ = u && i < n ? u.getPrevious() : u;
          if (e > r && (a = a.getNext()), i > r && (u = u.getNext()), !h || !a || !_ || !u)
            return !1;
          var d = [];
          function c(b, P) {
            var T = b.getValues(), z = R.classify(T).roots || R.getPeaks(T), M = z.length, O = R.getLength(
              T,
              P && M ? z[M - 1] : 0,
              !P && M ? z[0] : 1
            );
            d.push(M ? O : O / 32);
          }
          function l(b, P, T) {
            return P < T ? b > P && b < T : b > P || b < T;
          }
          s || (c(h, !0), c(a, !1)), o || (c(_, !0), c(u, !1));
          var v = this.getPoint(), y = Math.min.apply(Math, d), C = s ? a.getTangentAtTime(e) : a.getPointAt(y).subtract(v), p = s ? C.negate() : h.getPointAt(-y).subtract(v), m = o ? u.getTangentAtTime(i) : u.getPointAt(y).subtract(v), f = o ? m.negate() : _.getPointAt(-y).subtract(v), g = p.getAngle(), w = C.getAngle(), S = f.getAngle(), x = m.getAngle();
          return !!(s ? l(g, S, x) ^ l(w, S, x) && l(g, x, S) ^ l(w, x, S) : l(S, g, w) ^ l(x, g, w) && l(S, w, g) ^ l(x, w, g));
        },
        hasOverlap: function() {
          return !!this._overlap;
        }
      },
      I.each(R._evaluateMethods, function(t) {
        var e = t + "At";
        this[t] = function() {
          var i = this.getCurve(), n = this.getTime();
          return n != null && i && i[e](n, !0);
        };
      }, {
        preserve: !0
      }),
      new function() {
        function t(e, i, n) {
          var r = e.length, s = 0, o = r - 1;
          function a(v, y) {
            for (var C = v + y; C >= -1 && C <= r; C += y) {
              var p = e[(C % r + r) % r];
              if (!i.getPoint().isClose(
                p.getPoint(),
                1e-7
              ))
                break;
              if (i.equals(p))
                return p;
            }
            return null;
          }
          for (; s <= o; ) {
            var h = s + o >>> 1, u = e[h], _;
            if (n && (_ = i.equals(u) ? u : a(h, -1) || a(h, 1)))
              return i._overlap && (_._overlap = _._intersection._overlap = !0), _;
            var d = i.getPath(), c = u.getPath(), l = d !== c ? d._id - c._id : i.getIndex() + i.getTime() - (u.getIndex() + u.getTime());
            l < 0 ? o = h - 1 : s = h + 1;
          }
          return e.splice(s, 0, i), i;
        }
        return { statics: {
          insert: t,
          expand: function(e) {
            for (var i = e.slice(), n = e.length - 1; n >= 0; n--)
              t(i, e[n]._intersection, !1);
            return i;
          }
        } };
      }()
    ), Ut = $.extend({
      _class: "PathItem",
      _selectBounds: !1,
      _canScaleStroke: !0,
      beans: !0,
      initialize: function() {
      },
      statics: {
        create: function(t) {
          var e, i, n;
          if (I.isPlainObject(t) ? (i = t.segments, e = t.pathData) : Array.isArray(t) ? i = t : typeof t == "string" && (e = t), i) {
            var r = i[0];
            n = r && Array.isArray(r[0]);
          } else
            e && (n = (e.match(/m/gi) || []).length > 1 || /z\s*\S+/i.test(e));
          var s = n ? Nt : ot;
          return new s(t);
        }
      },
      _asPathItem: function() {
        return this;
      },
      isClockwise: function() {
        return this.getArea() >= 0;
      },
      setClockwise: function(t) {
        this.isClockwise() != (t = !!t) && this.reverse();
      },
      setPathData: function(t) {
        var e = t && t.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig), i, n = !1, r, s, o = new L(), a = new L();
        function h(f, g) {
          var w = +i[f];
          return n && (w += o[g]), w;
        }
        function u(f) {
          return new L(
            h(f, "x"),
            h(f + 1, "y")
          );
        }
        this.clear();
        for (var _ = 0, d = e && e.length; _ < d; _++) {
          var c = e[_], l = c[0], v = l.toLowerCase();
          i = c.match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g);
          var y = i && i.length;
          switch (n = l === v, r === "z" && !/[mz]/.test(v) && this.moveTo(o), v) {
            case "m":
            case "l":
              for (var C = v === "m", p = 0; p < y; p += 2)
                this[C ? "moveTo" : "lineTo"](o = u(p)), C && (a = o, C = !1);
              s = o;
              break;
            case "h":
            case "v":
              var m = v === "h" ? "x" : "y";
              o = o.clone();
              for (var p = 0; p < y; p++)
                o[m] = h(p, m), this.lineTo(o);
              s = o;
              break;
            case "c":
              for (var p = 0; p < y; p += 6)
                this.cubicCurveTo(
                  u(p),
                  s = u(p + 2),
                  o = u(p + 4)
                );
              break;
            case "s":
              for (var p = 0; p < y; p += 4)
                this.cubicCurveTo(
                  /[cs]/.test(r) ? o.multiply(2).subtract(s) : o,
                  s = u(p),
                  o = u(p + 2)
                ), r = v;
              break;
            case "q":
              for (var p = 0; p < y; p += 4)
                this.quadraticCurveTo(
                  s = u(p),
                  o = u(p + 2)
                );
              break;
            case "t":
              for (var p = 0; p < y; p += 2)
                this.quadraticCurveTo(
                  s = /[qt]/.test(r) ? o.multiply(2).subtract(s) : o,
                  o = u(p)
                ), r = v;
              break;
            case "a":
              for (var p = 0; p < y; p += 7)
                this.arcTo(
                  o = u(p + 5),
                  new G(+i[p], +i[p + 1]),
                  +i[p + 2],
                  +i[p + 4],
                  +i[p + 3]
                );
              break;
            case "z":
              this.closePath(1e-12), o = a;
              break;
          }
          r = v;
        }
      },
      _canComposite: function() {
        return !(this.hasFill() && this.hasStroke());
      },
      _contains: function(t) {
        var e = t.isInside(
          this.getBounds({ internal: !0, handle: !0 })
        ) ? this._getWinding(t) : {};
        return e.onPath || !!(this.getFillRule() === "evenodd" ? e.windingL & 1 || e.windingR & 1 : e.winding);
      },
      getIntersections: function(t, e, i, n) {
        var r = this === t || !t, s = this._matrix._orNullIfIdentity(), o = r ? s : (i || t._matrix)._orNullIfIdentity();
        return r || this.getBounds(s).intersects(
          t.getBounds(o),
          1e-12
        ) ? R.getIntersections(
          this.getCurves(),
          !r && t.getCurves(),
          e,
          s,
          o,
          n
        ) : [];
      },
      getCrossings: function(t) {
        return this.getIntersections(t, function(e) {
          return e.isCrossing();
        });
      },
      getNearestLocation: function() {
        for (var t = L.read(arguments), e = this.getCurves(), i = 1 / 0, n = null, r = 0, s = e.length; r < s; r++) {
          var o = e[r].getNearestLocation(t);
          o._distance < i && (i = o._distance, n = o);
        }
        return n;
      },
      getNearestPoint: function() {
        var t = this.getNearestLocation.apply(this, arguments);
        return t && t.getPoint();
      },
      interpolate: function(t, e, i) {
        var n = !this._children, r = n ? "_segments" : "_children", s = t[r], o = e[r], a = this[r];
        if (!s || !o || s.length !== o.length)
          throw new Error("Invalid operands in interpolate() call: " + t + ", " + e);
        var h = a.length, u = o.length;
        if (h < u)
          for (var _ = n ? J : ot, d = h; d < u; d++)
            this.add(new _());
        else
          h > u && this[n ? "removeSegments" : "removeChildren"](u, h);
        for (var d = 0; d < u; d++)
          a[d].interpolate(s[d], o[d], i);
        n && (this.setClosed(t._closed), this._changed(9));
      },
      compare: function(t) {
        var e = !1;
        if (t) {
          var i = this._children || [this], n = t._children ? t._children.slice() : [t], r = i.length, s = n.length, o = [], a = 0;
          e = !0;
          for (var h = yt.findItemBoundsCollisions(i, n, et.GEOMETRIC_EPSILON), u = r - 1; u >= 0 && e; u--) {
            var _ = i[u];
            e = !1;
            var d = h[u];
            if (d)
              for (var c = d.length - 1; c >= 0 && !e; c--)
                _.compare(n[d[c]]) && (o[d[c]] || (o[d[c]] = !0, a++), e = !0);
          }
          e = e && a === s;
        }
        return e;
      }
    }), ot = Ut.extend(
      {
        _class: "Path",
        _serializeFields: {
          segments: [],
          closed: !1
        },
        initialize: function(e) {
          this._closed = !1, this._segments = [], this._version = 0;
          var i = arguments, n = Array.isArray(e) ? typeof e[0] == "object" ? e : i : e && e.size === B && (e.x !== B || e.point !== B) ? i : null;
          n && n.length > 0 ? this.setSegments(n) : (this._curves = B, this._segmentSelection = 0, !n && typeof e == "string" && (this.setPathData(e), e = null)), this._initialize(!n && e);
        },
        _equals: function(t) {
          return this._closed === t._closed && I.equals(this._segments, t._segments);
        },
        copyContent: function(t) {
          this.setSegments(t._segments), this._closed = t._closed;
        },
        _changed: function t(e) {
          if (t.base.call(this, e), e & 8) {
            if (this._length = this._area = B, e & 32)
              this._version++;
            else if (this._curves)
              for (var i = 0, n = this._curves.length; i < n; i++)
                this._curves[i]._changed();
          } else
            e & 64 && (this._bounds = B);
        },
        getStyle: function() {
          var t = this._parent;
          return (t instanceof Nt ? t : this)._style;
        },
        getSegments: function() {
          return this._segments;
        },
        setSegments: function(t) {
          var e = this.isFullySelected(), i = t && t.length;
          if (this._segments.length = 0, this._segmentSelection = 0, this._curves = B, i) {
            var n = t[i - 1];
            typeof n == "boolean" && (this.setClosed(n), i--), this._add(J.readList(t, 0, {}, i));
          }
          e && this.setFullySelected(!0);
        },
        getFirstSegment: function() {
          return this._segments[0];
        },
        getLastSegment: function() {
          return this._segments[this._segments.length - 1];
        },
        getCurves: function() {
          var t = this._curves, e = this._segments;
          if (!t) {
            var i = this._countCurves();
            t = this._curves = new Array(i);
            for (var n = 0; n < i; n++)
              t[n] = new R(
                this,
                e[n],
                e[n + 1] || e[0]
              );
          }
          return t;
        },
        getFirstCurve: function() {
          return this.getCurves()[0];
        },
        getLastCurve: function() {
          var t = this.getCurves();
          return t[t.length - 1];
        },
        isClosed: function() {
          return this._closed;
        },
        setClosed: function(t) {
          if (this._closed != (t = !!t)) {
            if (this._closed = t, this._curves) {
              var e = this._curves.length = this._countCurves();
              t && (this._curves[e - 1] = new R(
                this,
                this._segments[e - 1],
                this._segments[0]
              ));
            }
            this._changed(41);
          }
        }
      },
      {
        beans: !0,
        getPathData: function(t, e) {
          var i = this._segments, n = i.length, r = new ht(e), s = new Array(6), o = !0, a, h, u, _, d, c, l, v, y = [];
          function C(m, f) {
            if (m._transformCoordinates(t, s), a = s[0], h = s[1], o)
              y.push("M" + r.pair(a, h)), o = !1;
            else if (d = s[2], c = s[3], d === a && c === h && l === u && v === _) {
              if (!f) {
                var g = a - u, w = h - _;
                y.push(
                  g === 0 ? "v" + r.number(w) : w === 0 ? "h" + r.number(g) : "l" + r.pair(g, w)
                );
              }
            } else
              y.push("c" + r.pair(l - u, v - _) + " " + r.pair(d - u, c - _) + " " + r.pair(a - u, h - _));
            u = a, _ = h, l = s[4], v = s[5];
          }
          if (!n)
            return "";
          for (var p = 0; p < n; p++)
            C(i[p]);
          return this._closed && n > 0 && (C(i[0], !0), y.push("z")), y.join("");
        },
        isEmpty: function() {
          return !this._segments.length;
        },
        _transformContent: function(t) {
          for (var e = this._segments, i = new Array(6), n = 0, r = e.length; n < r; n++)
            e[n]._transformCoordinates(t, i, !0);
          return !0;
        },
        _add: function(t, o) {
          for (var i = this._segments, n = this._curves, r = t.length, s = o == null, o = s ? i.length : o, a = 0; a < r; a++) {
            var h = t[a];
            h._path && (h = t[a] = h.clone()), h._path = this, h._index = o + a, h._selection && this._updateSelection(h, 0, h._selection);
          }
          if (s)
            I.push(i, t);
          else {
            i.splice.apply(i, [o, 0].concat(t));
            for (var a = o + r, u = i.length; a < u; a++)
              i[a]._index = a;
          }
          if (n) {
            var _ = this._countCurves(), d = o > 0 && o + r - 1 === _ ? o - 1 : o, c = d, l = Math.min(d + r, _);
            t._curves && (n.splice.apply(n, [d, 0].concat(t._curves)), c += t._curves.length);
            for (var a = c; a < l; a++)
              n.splice(a, 0, new R(this, null, null));
            this._adjustCurves(d, l);
          }
          return this._changed(41), t;
        },
        _adjustCurves: function(t, e) {
          for (var i = this._segments, n = this._curves, r, s = t; s < e; s++)
            r = n[s], r._path = this, r._segment1 = i[s], r._segment2 = i[s + 1] || i[0], r._changed();
          (r = n[this._closed && !t ? i.length - 1 : t - 1]) && (r._segment2 = i[t] || i[0], r._changed()), (r = n[e]) && (r._segment1 = i[e], r._changed());
        },
        _countCurves: function() {
          var t = this._segments.length;
          return !this._closed && t > 0 ? t - 1 : t;
        },
        add: function(t) {
          var e = arguments;
          return e.length > 1 && typeof t != "number" ? this._add(J.readList(e)) : this._add([J.read(e)])[0];
        },
        insert: function(t, e) {
          var i = arguments;
          return i.length > 2 && typeof e != "number" ? this._add(J.readList(i, 1), t) : this._add([J.read(i, 1)], t)[0];
        },
        addSegment: function() {
          return this._add([J.read(arguments)])[0];
        },
        insertSegment: function(t) {
          return this._add([J.read(arguments, 1)], t)[0];
        },
        addSegments: function(t) {
          return this._add(J.readList(t));
        },
        insertSegments: function(t, e) {
          return this._add(J.readList(e), t);
        },
        removeSegment: function(t) {
          return this.removeSegments(t, t + 1)[0] || null;
        },
        removeSegments: function(t, e, i) {
          t = t || 0, e = I.pick(e, this._segments.length);
          var n = this._segments, r = this._curves, s = n.length, o = n.splice(t, e - t), a = o.length;
          if (!a)
            return o;
          for (var h = 0; h < a; h++) {
            var u = o[h];
            u._selection && this._updateSelection(u, u._selection, 0), u._index = u._path = null;
          }
          for (var h = t, _ = n.length; h < _; h++)
            n[h]._index = h;
          if (r) {
            for (var d = t > 0 && e === s + (this._closed ? 1 : 0) ? t - 1 : t, r = r.splice(d, a), h = r.length - 1; h >= 0; h--)
              r[h]._path = null;
            i && (o._curves = r.slice(1)), this._adjustCurves(d, d);
          }
          return this._changed(41), o;
        },
        clear: "#removeSegments",
        hasHandles: function() {
          for (var t = this._segments, e = 0, i = t.length; e < i; e++)
            if (t[e].hasHandles())
              return !0;
          return !1;
        },
        clearHandles: function() {
          for (var t = this._segments, e = 0, i = t.length; e < i; e++)
            t[e].clearHandles();
        },
        getLength: function() {
          if (this._length == null) {
            for (var t = this.getCurves(), e = 0, i = 0, n = t.length; i < n; i++)
              e += t[i].getLength();
            this._length = e;
          }
          return this._length;
        },
        getArea: function() {
          var t = this._area;
          if (t == null) {
            var e = this._segments, i = this._closed;
            t = 0;
            for (var n = 0, r = e.length; n < r; n++) {
              var s = n + 1 === r;
              t += R.getArea(R.getValues(
                e[n],
                e[s ? 0 : n + 1],
                null,
                s && !i
              ));
            }
            this._area = t;
          }
          return t;
        },
        isFullySelected: function() {
          var t = this._segments.length;
          return this.isSelected() && t > 0 && this._segmentSelection === t * 7;
        },
        setFullySelected: function(t) {
          t && this._selectSegments(!0), this.setSelected(t);
        },
        setSelection: function t(e) {
          e & 1 || this._selectSegments(!1), t.base.call(this, e);
        },
        _selectSegments: function(t) {
          var e = this._segments, i = e.length, n = t ? 7 : 0;
          this._segmentSelection = n * i;
          for (var r = 0; r < i; r++)
            e[r]._selection = n;
        },
        _updateSelection: function(t, e, i) {
          t._selection = i;
          var n = this._segmentSelection += i - e;
          n > 0 && this.setSelected(!0);
        },
        divideAt: function(t) {
          var e = this.getLocationAt(t), i;
          return e && (i = e.getCurve().divideAt(e.getCurveOffset())) ? i._segment1 : null;
        },
        splitAt: function(t) {
          var e = this.getLocationAt(t), i = e && e.index, n = e && e.time, r = 1e-8, s = 1 - r;
          n > s && (i++, n = 0);
          var o = this.getCurves();
          if (i >= 0 && i < o.length) {
            n >= r && o[i++].divideAtTime(n);
            var a = this.removeSegments(i, this._segments.length, !0), h;
            return this._closed ? (this.setClosed(!1), h = this) : (h = new ot($.NO_INSERT), h.insertAbove(this), h.copyAttributes(this)), h._add(a, 0), this.addSegment(a[0]), h;
          }
          return null;
        },
        split: function(t, e) {
          var i, n = e === B ? t : (i = this.getCurves()[t]) && i.getLocationAtTime(e);
          return n != null ? this.splitAt(n) : null;
        },
        join: function(t, e) {
          var i = e || 0;
          if (t && t !== this) {
            var n = t._segments, r = this.getLastSegment(), s = t.getLastSegment();
            if (!s)
              return this;
            r && r._point.isClose(s._point, i) && t.reverse();
            var o = t.getFirstSegment();
            if (r && r._point.isClose(o._point, i))
              r.setHandleOut(o._handleOut), this._add(n.slice(1));
            else {
              var a = this.getFirstSegment();
              a && a._point.isClose(o._point, i) && t.reverse(), s = t.getLastSegment(), a && a._point.isClose(s._point, i) ? (a.setHandleIn(s._handleIn), this._add(n.slice(0, n.length - 1), 0)) : this._add(n.slice());
            }
            t._closed && this._add([n[0]]), t.remove();
          }
          var h = this.getFirstSegment(), u = this.getLastSegment();
          return h !== u && h._point.isClose(u._point, i) && (h.setHandleIn(u._handleIn), u.remove(), this.setClosed(!0)), this;
        },
        reduce: function(t) {
          for (var e = this.getCurves(), i = t && t.simplify, n = i ? 1e-7 : 0, r = e.length - 1; r >= 0; r--) {
            var s = e[r];
            !s.hasHandles() && (!s.hasLength(n) || i && s.isCollinear(s.getNext())) && s.remove();
          }
          return this;
        },
        reverse: function() {
          this._segments.reverse();
          for (var t = 0, e = this._segments.length; t < e; t++) {
            var i = this._segments[t], n = i._handleIn;
            i._handleIn = i._handleOut, i._handleOut = n, i._index = t;
          }
          this._curves = null, this._changed(9);
        },
        flatten: function(t) {
          for (var e = new he(this, t || 0.25, 256, !0), i = e.parts, n = i.length, r = [], s = 0; s < n; s++)
            r.push(new J(i[s].curve.slice(0, 2)));
          !this._closed && n > 0 && r.push(new J(i[n - 1].curve.slice(6))), this.setSegments(r);
        },
        simplify: function(t) {
          var e = new me(this).fit(t || 2.5);
          return e && this.setSegments(e), !!e;
        },
        smooth: function(t) {
          var e = this, i = t || {}, n = i.type || "asymmetric", r = this._segments, s = r.length, o = this._closed;
          function a(X, ut) {
            var it = X && X.index;
            if (it != null) {
              var st = X.path;
              if (st && st !== e)
                throw new Error(X._class + " " + it + " of " + st + " is not part of " + e);
              ut && X instanceof R && it++;
            } else
              it = typeof X == "number" ? X : ut;
            return Math.min(it < 0 && o ? it % s : it < 0 ? it + s : it, s - 1);
          }
          var h = o && i.from === B && i.to === B, u = a(i.from, 0), _ = a(i.to, s - 1);
          if (u > _)
            if (o)
              u -= s;
            else {
              var d = u;
              u = _, _ = d;
            }
          if (/^(?:asymmetric|continuous)$/.test(n)) {
            var c = n === "asymmetric", l = Math.min, v = _ - u + 1, y = v - 1, C = h ? l(v, 4) : 1, p = C, m = C, f = [];
            if (o || (p = l(1, u), m = l(1, s - _ - 1)), y += p + m, y <= 1)
              return;
            for (var g = 0, w = u - p; g <= y; g++, w++)
              f[g] = r[(w < 0 ? w + s : w) % s]._point;
            for (var S = f[0]._x + 2 * f[1]._x, x = f[0]._y + 2 * f[1]._y, b = 2, P = y - 1, T = [S], z = [x], M = [b], O = [], A = [], g = 1; g < y; g++) {
              var k = g < P, N = k || c ? 1 : 2, E = k ? 4 : c ? 2 : 7, F = k ? 4 : c ? 3 : 8, D = k ? 2 : c ? 0 : 1, V = N / b;
              b = M[g] = E - V, S = T[g] = F * f[g]._x + D * f[g + 1]._x - V * S, x = z[g] = F * f[g]._y + D * f[g + 1]._y - V * x;
            }
            O[P] = T[P] / M[P], A[P] = z[P] / M[P];
            for (var g = y - 2; g >= 0; g--)
              O[g] = (T[g] - O[g + 1]) / M[g], A[g] = (z[g] - A[g + 1]) / M[g];
            O[y] = (3 * f[y]._x - O[P]) / 2, A[y] = (3 * f[y]._y - A[P]) / 2;
            for (var g = p, K = y - m, w = u; g <= K; g++, w++) {
              var W = r[w < 0 ? w + s : w], U = W._point, Z = O[g] - U._x, Q = A[g] - U._y;
              (h || g < K) && W.setHandleOut(Z, Q), (h || g > p) && W.setHandleIn(-Z, -Q);
            }
          } else
            for (var g = u; g <= _; g++)
              r[g < 0 ? g + s : g].smooth(
                i,
                !h && g === u,
                !h && g === _
              );
        },
        toShape: function(t) {
          if (!this._closed)
            return null;
          var e = this._segments, i, n, r, s;
          function o(c, l) {
            var v = e[c], y = v.getNext(), C = e[l], p = C.getNext();
            return v._handleOut.isZero() && y._handleIn.isZero() && C._handleOut.isZero() && p._handleIn.isZero() && y._point.subtract(v._point).isCollinear(
              p._point.subtract(C._point)
            );
          }
          function a(c) {
            var l = e[c], v = l.getPrevious(), y = l.getNext();
            return v._handleOut.isZero() && l._handleIn.isZero() && l._handleOut.isZero() && y._handleIn.isZero() && l._point.subtract(v._point).isOrthogonal(
              y._point.subtract(l._point)
            );
          }
          function h(c) {
            var l = e[c], v = l.getNext(), y = l._handleOut, C = v._handleIn, p = 0.5522847498307936;
            if (y.isOrthogonal(C)) {
              var m = l._point, f = v._point, g = new Pt(m, y, !0).intersect(
                new Pt(f, C, !0),
                !0
              );
              return g && et.isZero(y.getLength() / g.subtract(m).getLength() - p) && et.isZero(C.getLength() / g.subtract(f).getLength() - p);
            }
            return !1;
          }
          function u(c, l) {
            return e[c]._point.getDistance(e[l]._point);
          }
          if (!this.hasHandles() && e.length === 4 && o(0, 2) && o(1, 3) && a(1) ? (i = zt.Rectangle, n = new G(u(0, 3), u(0, 1)), s = e[1]._point.add(e[2]._point).divide(2)) : e.length === 8 && h(0) && h(2) && h(4) && h(6) && o(1, 5) && o(3, 7) ? (i = zt.Rectangle, n = new G(u(1, 6), u(0, 3)), r = n.subtract(new G(
            u(0, 7),
            u(1, 2)
          )).divide(2), s = e[3]._point.add(e[4]._point).divide(2)) : e.length === 4 && h(0) && h(1) && h(2) && h(3) && (et.isZero(u(0, 2) - u(1, 3)) ? (i = zt.Circle, r = u(0, 2) / 2) : (i = zt.Ellipse, r = new G(u(2, 0) / 2, u(3, 1) / 2)), s = e[1]._point), i) {
            var _ = this.getPosition(!0), d = new i({
              center: _,
              size: n,
              radius: r,
              insert: !1
            });
            return d.copyAttributes(this, !0), d._matrix.prepend(this._matrix), d.rotate(s.subtract(_).getAngle() + 90), (t === B || t) && d.insertAbove(this), d;
          }
          return null;
        },
        toPath: "#clone",
        compare: function t(e) {
          if (!e || e instanceof Nt)
            return t.base.call(this, e);
          var i = this.getCurves(), n = e.getCurves(), r = i.length, s = n.length;
          if (!r || !s)
            return r == s;
          for (var o = i[0].getValues(), a = [], h = 0, u, _ = 0, d, c = 0; c < s; c++) {
            var C = n[c].getValues();
            a.push(C);
            var l = R.getOverlaps(o, C);
            if (l) {
              u = !c && l[0][0] > 0 ? s - 1 : c, d = l[0][1];
              break;
            }
          }
          for (var v = Math.abs, y = 1e-8, C = a[u], p; o && C; ) {
            var l = R.getOverlaps(o, C);
            if (l) {
              var m = l[0][0];
              if (v(m - _) < y) {
                _ = l[1][0], _ === 1 && (o = ++h < r ? i[h].getValues() : null, _ = 0);
                var f = l[0][1];
                if (v(f - d) < y) {
                  if (p || (p = [u, f]), d = l[1][1], d === 1 && (++u >= s && (u = 0), C = a[u] || n[u].getValues(), d = 0), !o)
                    return p[0] === u && p[1] === d;
                  continue;
                }
              }
            }
            break;
          }
          return !1;
        },
        _hitTestSelf: function(t, e, i, n) {
          var r = this, s = this.getStyle(), o = this._segments, a = o.length, h = this._closed, u = e._tolerancePadding, _ = u, d, c, l, v, y, C, p = e.stroke && s.hasStroke(), m = e.fill && s.hasFill(), f = e.curves, g = p ? s.getStrokeWidth() / 2 : m && e.tolerance > 0 || f ? 0 : null;
          g !== null && (g > 0 ? (d = s.getStrokeJoin(), c = s.getStrokeCap(), l = s.getMiterLimit(), _ = _.add(
            ot._getStrokePadding(g, n)
          )) : d = c = "round");
          function w(O, A) {
            return t.subtract(O).divide(A).length <= 1;
          }
          function S(O, A, k) {
            if (!e.selected || A.isSelected()) {
              var N = O._point;
              if (A !== N && (A = A.add(N)), w(A, _))
                return new Ft(k, r, {
                  segment: O,
                  point: A
                });
            }
          }
          function x(O, A) {
            return (A || e.segments) && S(O, O._point, "segment") || !A && e.handles && (S(O, O._handleIn, "handle-in") || S(O, O._handleOut, "handle-out"));
          }
          function b(O) {
            v.add(O);
          }
          function P(O) {
            var A = h || O._index > 0 && O._index < a - 1;
            if ((A ? d : c) === "round")
              return w(O._point, _);
            if (v = new ot({ internal: !0, closed: !0 }), A ? O.isSmooth() || ot._addBevelJoin(
              O,
              d,
              g,
              l,
              null,
              n,
              b,
              !0
            ) : c === "square" && ot._addSquareCap(
              O,
              c,
              g,
              null,
              n,
              b,
              !0
            ), !v.isEmpty()) {
              var k;
              return v.contains(t) || (k = v.getNearestLocation(t)) && w(k.getPoint(), u);
            }
          }
          if (e.ends && !e.segments && !h) {
            if (C = x(o[0], !0) || x(o[a - 1], !0))
              return C;
          } else if (e.segments || e.handles) {
            for (var T = 0; T < a; T++)
              if (C = x(o[T]))
                return C;
          }
          if (g !== null) {
            if (y = this.getNearestLocation(t), y) {
              var z = y.getTime();
              z === 0 || z === 1 && a > 1 ? P(y.getSegment()) || (y = null) : w(y.getPoint(), _) || (y = null);
            }
            if (!y && d === "miter" && a > 1)
              for (var T = 0; T < a; T++) {
                var M = o[T];
                if (t.getDistance(M._point) <= l * g && P(M)) {
                  y = M.getLocation();
                  break;
                }
              }
          }
          return !y && m && this._contains(t) || y && !p && !f ? new Ft("fill", this) : y ? new Ft(p ? "stroke" : "curve", this, {
            location: y,
            point: y.getPoint()
          }) : null;
        }
      },
      I.each(
        R._evaluateMethods,
        function(t) {
          this[t + "At"] = function(e) {
            var i = this.getLocationAt(e);
            return i && i[t]();
          };
        },
        {
          beans: !1,
          getLocationOf: function() {
            for (var t = L.read(arguments), e = this.getCurves(), i = 0, n = e.length; i < n; i++) {
              var r = e[i].getLocationOf(t);
              if (r)
                return r;
            }
            return null;
          },
          getOffsetOf: function() {
            var t = this.getLocationOf.apply(this, arguments);
            return t ? t.getOffset() : null;
          },
          getLocationAt: function(t) {
            if (typeof t == "number") {
              for (var e = this.getCurves(), i = 0, n = 0, r = e.length; n < r; n++) {
                var s = i, o = e[n];
                if (i += o.getLength(), i > t)
                  return o.getLocationAt(t - s);
              }
              if (e.length > 0 && t <= this.getLength())
                return new kt(e[e.length - 1], 1);
            } else if (t && t.getPath && t.getPath() === this)
              return t;
            return null;
          },
          getOffsetsWithTangent: function() {
            var t = L.read(arguments);
            if (t.isZero())
              return [];
            for (var e = [], i = 0, n = this.getCurves(), r = 0, s = n.length; r < s; r++) {
              for (var o = n[r], a = o.getTimesWithTangent(t), h = 0, u = a.length; h < u; h++) {
                var _ = i + o.getOffsetAtTime(a[h]);
                e.indexOf(_) < 0 && e.push(_);
              }
              i += o.length;
            }
            return e;
          }
        }
      ),
      new function() {
        function t(i, n, r, s) {
          if (s <= 0)
            return;
          var o = s / 2, a = s - 2, h = o - 1, u = new Array(6), _, d;
          function c(m) {
            var f = u[m], g = u[m + 1];
            (_ != f || d != g) && (i.beginPath(), i.moveTo(_, d), i.lineTo(f, g), i.stroke(), i.beginPath(), i.arc(f, g, o, 0, Math.PI * 2, !0), i.fill());
          }
          for (var l = 0, v = n.length; l < v; l++) {
            var y = n[l], C = y._selection;
            if (y._transformCoordinates(r, u), _ = u[0], d = u[1], C & 2 && c(2), C & 4 && c(4), i.fillRect(_ - o, d - o, s, s), a > 0 && !(C & 1)) {
              var p = i.fillStyle;
              i.fillStyle = "#ffffff", i.fillRect(_ - h, d - h, a, a), i.fillStyle = p;
            }
          }
        }
        function e(i, n, r) {
          var s = n._segments, o = s.length, a = new Array(6), h = !0, u, _, d, c, l, v, y, C;
          function p(f) {
            if (r)
              f._transformCoordinates(r, a), u = a[0], _ = a[1];
            else {
              var g = f._point;
              u = g._x, _ = g._y;
            }
            if (h)
              i.moveTo(u, _), h = !1;
            else {
              if (r)
                l = a[2], v = a[3];
              else {
                var w = f._handleIn;
                l = u + w._x, v = _ + w._y;
              }
              l === u && v === _ && y === d && C === c ? i.lineTo(u, _) : i.bezierCurveTo(y, C, l, v, u, _);
            }
            if (d = u, c = _, r)
              y = a[4], C = a[5];
            else {
              var w = f._handleOut;
              y = d + w._x, C = c + w._y;
            }
          }
          for (var m = 0; m < o; m++)
            p(s[m]);
          n._closed && o > 0 && p(s[0]);
        }
        return {
          _draw: function(i, n, r, s) {
            var o = n.dontStart, a = n.dontFinish || n.clip, h = this.getStyle(), u = h.hasFill(), _ = h.hasStroke(), d = h.getDashArray(), c = !rt.support.nativeDash && _ && d && d.length;
            o || i.beginPath(), (u || _ && !c || a) && (e(i, this, s), this._closed && i.closePath());
            function l(f) {
              return d[(f % c + c) % c];
            }
            if (!a && (u || _) && (this._setStyles(i, n, r), u && (i.fill(h.getFillRule()), i.shadowColor = "rgba(0,0,0,0)"), _)) {
              if (c) {
                o || i.beginPath();
                for (var v = new he(
                  this,
                  0.25,
                  32,
                  !1,
                  s
                ), y = v.length, C = -h.getDashOffset(), p, m = 0; C > 0; )
                  C -= l(m--) + l(m--);
                for (; C < y; )
                  p = C + l(m++), (C > 0 || p > 0) && v.drawPart(
                    i,
                    Math.max(C, 0),
                    Math.max(p, 0)
                  ), C = p + l(m++);
              }
              i.stroke();
            }
          },
          _drawSelected: function(i, n) {
            i.beginPath(), e(i, this, n), i.stroke(), t(i, this._segments, n, rt.settings.handleSize);
          }
        };
      }(),
      new function() {
        function t(e) {
          var i = e._segments;
          if (!i.length)
            throw new Error("Use a moveTo() command first");
          return i[i.length - 1];
        }
        return {
          moveTo: function() {
            var e = this._segments;
            e.length === 1 && this.removeSegment(0), e.length || this._add([new J(L.read(arguments))]);
          },
          moveBy: function() {
            throw new Error("moveBy() is unsupported on Path items.");
          },
          lineTo: function() {
            this._add([new J(L.read(arguments))]);
          },
          cubicCurveTo: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = L.read(e), s = t(this);
            s.setHandleOut(i.subtract(s._point)), this._add([new J(r, n.subtract(r))]);
          },
          quadraticCurveTo: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = t(this)._point;
            this.cubicCurveTo(
              i.add(r.subtract(i).multiply(1 / 3)),
              i.add(n.subtract(i).multiply(1 / 3)),
              n
            );
          },
          curveTo: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = I.pick(I.read(e), 0.5), s = 1 - r, o = t(this)._point, a = i.subtract(o.multiply(s * s)).subtract(n.multiply(r * r)).divide(2 * r * s);
            if (a.isNaN())
              throw new Error(
                "Cannot put a curve through points with parameter = " + r
              );
            this.quadraticCurveTo(a, n);
          },
          arcTo: function() {
            var e = arguments, i = Math.abs, n = Math.sqrt, r = t(this), s = r._point, o = L.read(e), a, h = I.peek(e), u = I.pick(h, !0), _, d, c, l;
            if (typeof u == "boolean")
              var v = s.add(o).divide(2), a = v.add(v.subtract(s).rotate(
                u ? -90 : 90
              ));
            else if (I.remain(e) <= 2)
              a = o, o = L.read(e);
            else if (!s.equals(o)) {
              var y = G.read(e), C = et.isZero;
              if (C(y.width) || C(y.height))
                return this.lineTo(o);
              var p = I.read(e), u = !!I.read(e), m = !!I.read(e), v = s.add(o).divide(2), f = s.subtract(v).rotate(-p), g = f.x, w = f.y, S = i(y.width), x = i(y.height), b = S * S, P = x * x, T = g * g, z = w * w, M = n(T / b + z / P);
              if (M > 1 && (S *= M, x *= M, b = S * S, P = x * x), M = (b * P - b * z - P * T) / (b * z + P * T), i(M) < 1e-12 && (M = 0), M < 0)
                throw new Error(
                  "Cannot create an arc with the given arguments"
                );
              _ = new L(S * w / x, -x * g / S).multiply((m === u ? -1 : 1) * n(M)).rotate(p).add(v), l = new ft().translate(_).rotate(p).scale(S, x), c = l._inverseTransform(s), d = c.getDirectedAngle(l._inverseTransform(o)), !u && d > 0 ? d -= 360 : u && d < 0 && (d += 360);
            }
            if (a) {
              var O = new Pt(
                s.add(a).divide(2),
                a.subtract(s).rotate(90),
                !0
              ), A = new Pt(
                a.add(o).divide(2),
                o.subtract(a).rotate(90),
                !0
              ), k = new Pt(s, o), N = k.getSide(a);
              if (_ = O.intersect(A, !0), !_) {
                if (!N)
                  return this.lineTo(o);
                throw new Error(
                  "Cannot create an arc with the given arguments"
                );
              }
              c = s.subtract(_), d = c.getDirectedAngle(o.subtract(_));
              var E = k.getSide(_, !0);
              E === 0 ? d = N * i(d) : N === E && (d += d < 0 ? 360 : -360);
            }
            if (d) {
              for (var F = 1e-5, D = i(d), V = D >= 360 ? 4 : Math.ceil((D - F) / 90), K = d / V, W = K * Math.PI / 360, U = 4 / 3 * Math.sin(W) / (1 + Math.cos(W)), Z = [], Q = 0; Q <= V; Q++) {
                var f = o, X = null;
                if (Q < V && (X = c.rotate(90).multiply(U), l ? (f = l._transformPoint(c), X = l._transformPoint(c.add(X)).subtract(f)) : f = _.add(c)), !Q)
                  r.setHandleOut(X);
                else {
                  var ut = c.rotate(-90).multiply(U);
                  l && (ut = l._transformPoint(c.add(ut)).subtract(f)), Z.push(new J(f, ut, X));
                }
                c = c.rotate(K);
              }
              this._add(Z);
            }
          },
          lineBy: function() {
            var e = L.read(arguments), i = t(this)._point;
            this.lineTo(i.add(e));
          },
          curveBy: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = I.read(e), s = t(this)._point;
            this.curveTo(s.add(i), s.add(n), r);
          },
          cubicCurveBy: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = L.read(e), s = t(this)._point;
            this.cubicCurveTo(
              s.add(i),
              s.add(n),
              s.add(r)
            );
          },
          quadraticCurveBy: function() {
            var e = arguments, i = L.read(e), n = L.read(e), r = t(this)._point;
            this.quadraticCurveTo(r.add(i), r.add(n));
          },
          arcBy: function() {
            var e = arguments, i = t(this)._point, n = i.add(L.read(e)), r = I.pick(I.peek(e), !0);
            typeof r == "boolean" ? this.arcTo(n, r) : this.arcTo(n, i.add(L.read(e)));
          },
          closePath: function(e) {
            this.setClosed(!0), this.join(this, e);
          }
        };
      }(),
      {
        _getBounds: function(t, e) {
          var i = e.handle ? "getHandleBounds" : e.stroke ? "getStrokeBounds" : "getBounds";
          return ot[i](this._segments, this._closed, this, t, e);
        },
        statics: {
          getBounds: function(t, e, i, n, r, s) {
            var o = t[0];
            if (!o)
              return new j();
            var a = new Array(6), h = o._transformCoordinates(n, new Array(6)), u = h.slice(0, 2), _ = u.slice(), d = new Array(2);
            function c(y) {
              y._transformCoordinates(n, a);
              for (var C = 0; C < 2; C++)
                R._addBounds(
                  h[C],
                  h[C + 4],
                  a[C + 2],
                  a[C],
                  C,
                  s ? s[C] : 0,
                  u,
                  _,
                  d
                );
              var p = h;
              h = a, a = p;
            }
            for (var l = 1, v = t.length; l < v; l++)
              c(t[l]);
            return e && c(o), new j(u[0], u[1], _[0] - u[0], _[1] - u[1]);
          },
          getStrokeBounds: function(t, e, i, n, r) {
            var s = i.getStyle(), o = s.hasStroke(), a = s.getStrokeWidth(), h = o && i._getStrokeMatrix(n, r), u = o && ot._getStrokePadding(
              a,
              h
            ), _ = ot.getBounds(
              t,
              e,
              i,
              n,
              r,
              u
            );
            if (!o)
              return _;
            var d = a / 2, c = s.getStrokeJoin(), l = s.getStrokeCap(), v = s.getMiterLimit(), y = new j(new G(u));
            function C(S) {
              _ = _.include(S);
            }
            function p(S) {
              _ = _.unite(
                y.setCenter(S._point.transform(n))
              );
            }
            function m(S, x) {
              x === "round" || S.isSmooth() ? p(S) : ot._addBevelJoin(
                S,
                x,
                d,
                v,
                n,
                h,
                C
              );
            }
            function f(S, x) {
              x === "round" ? p(S) : ot._addSquareCap(
                S,
                x,
                d,
                n,
                h,
                C
              );
            }
            var g = t.length - (e ? 0 : 1);
            if (g > 0) {
              for (var w = 1; w < g; w++)
                m(t[w], c);
              e ? m(t[0], c) : (f(t[0], l), f(t[t.length - 1], l));
            }
            return _;
          },
          _getStrokePadding: function(t, e) {
            if (!e)
              return [t, t];
            var i = new L(t, 0).transform(e), n = new L(0, t).transform(e), r = i.getAngleInRadians(), s = i.getLength(), o = n.getLength(), a = Math.sin(r), h = Math.cos(r), u = Math.tan(r), _ = Math.atan2(o * u, s), d = Math.atan2(o, u * s);
            return [
              Math.abs(s * Math.cos(_) * h + o * Math.sin(_) * a),
              Math.abs(o * Math.sin(d) * h + s * Math.cos(d) * a)
            ];
          },
          _addBevelJoin: function(t, e, i, n, r, s, o, a) {
            var h = t.getCurve(), u = h.getPrevious(), _ = h.getPoint1().transform(r), d = u.getNormalAtTime(1).multiply(i).transform(s), c = h.getNormalAtTime(0).multiply(i).transform(s), l = d.getDirectedAngle(c);
            if ((l < 0 || l >= 180) && (d = d.negate(), c = c.negate()), a && o(_), o(_.add(d)), e === "miter") {
              var v = new Pt(
                _.add(d),
                new L(-d.y, d.x),
                !0
              ).intersect(new Pt(
                _.add(c),
                new L(-c.y, c.x),
                !0
              ), !0);
              v && _.getDistance(v) <= n * i && o(v);
            }
            o(_.add(c));
          },
          _addSquareCap: function(t, e, i, n, r, s, o) {
            var a = t._point.transform(n), h = t.getLocation(), u = h.getNormal().multiply(h.getTime() === 0 ? i : -i).transform(r);
            e === "square" && (o && (s(a.subtract(u)), s(a.add(u))), a = a.add(u.rotate(-90))), s(a.add(u)), s(a.subtract(u));
          },
          getHandleBounds: function(t, e, i, n, r) {
            var s = i.getStyle(), o = r.stroke && s.hasStroke(), a, h;
            if (o) {
              var u = i._getStrokeMatrix(n, r), _ = s.getStrokeWidth() / 2, d = _;
              s.getStrokeJoin() === "miter" && (d = _ * s.getMiterLimit()), s.getStrokeCap() === "square" && (d = Math.max(d, _ * Math.SQRT2)), a = ot._getStrokePadding(_, u), h = ot._getStrokePadding(d, u);
            }
            for (var c = new Array(6), l = 1 / 0, v = -l, y = l, C = v, p = 0, m = t.length; p < m; p++) {
              var f = t[p];
              f._transformCoordinates(n, c);
              for (var g = 0; g < 6; g += 2) {
                var w = g ? a : h, S = w ? w[0] : 0, x = w ? w[1] : 0, b = c[g], P = c[g + 1], T = b - S, z = b + S, M = P - x, O = P + x;
                T < l && (l = T), z > v && (v = z), M < y && (y = M), O > C && (C = O);
              }
            }
            return new j(l, y, v - l, C - y);
          }
        }
      }
    );
    ot.inject({ statics: new function() {
      var t = 0.5522847498307936, e = [
        new J([-1, 0], [0, t], [0, -t]),
        new J([0, -1], [-t, 0], [t, 0]),
        new J([1, 0], [0, -t], [0, t]),
        new J([0, 1], [t, 0], [-t, 0])
      ];
      function i(r, s, o) {
        var a = I.getNamed(o), h = new ot(a && (a.insert == !0 ? $.INSERT : a.insert == !1 ? $.NO_INSERT : null));
        return h._add(r), h._closed = s, h.set(a, $.INSERT);
      }
      function n(r, s, o) {
        for (var a = new Array(4), h = 0; h < 4; h++) {
          var u = e[h];
          a[h] = new J(
            u._point.multiply(s).add(r),
            u._handleIn.multiply(s),
            u._handleOut.multiply(s)
          );
        }
        return i(a, !0, o);
      }
      return {
        Line: function() {
          var r = arguments;
          return i([
            new J(L.readNamed(r, "from")),
            new J(L.readNamed(r, "to"))
          ], !1, r);
        },
        Circle: function() {
          var r = arguments, s = L.readNamed(r, "center"), o = I.readNamed(r, "radius");
          return n(s, new G(o), r);
        },
        Rectangle: function() {
          var r = arguments, s = j.readNamed(r, "rectangle"), o = G.readNamed(
            r,
            "radius",
            0,
            { readNull: !0 }
          ), a = s.getBottomLeft(!0), h = s.getTopLeft(!0), u = s.getTopRight(!0), _ = s.getBottomRight(!0), d;
          if (!o || o.isZero())
            d = [
              new J(a),
              new J(h),
              new J(u),
              new J(_)
            ];
          else {
            o = G.min(o, s.getSize(!0).divide(2));
            var c = o.width, l = o.height, v = c * t, y = l * t;
            d = [
              new J(a.add(c, 0), null, [-v, 0]),
              new J(a.subtract(0, l), [0, y]),
              new J(h.add(0, l), null, [0, -y]),
              new J(h.add(c, 0), [-v, 0], null),
              new J(u.subtract(c, 0), null, [v, 0]),
              new J(u.add(0, l), [0, -y], null),
              new J(_.subtract(0, l), null, [0, y]),
              new J(_.subtract(c, 0), [v, 0])
            ];
          }
          return i(d, !0, r);
        },
        RoundRectangle: "#Rectangle",
        Ellipse: function() {
          var r = arguments, s = zt._readEllipse(r);
          return n(s.center, s.radius, r);
        },
        Oval: "#Ellipse",
        Arc: function() {
          var r = arguments, s = L.readNamed(r, "from"), o = L.readNamed(r, "through"), a = L.readNamed(r, "to"), h = I.getNamed(r), u = new ot(h && h.insert == !1 && $.NO_INSERT);
          return u.moveTo(s), u.arcTo(o, a), u.set(h);
        },
        RegularPolygon: function() {
          for (var r = arguments, s = L.readNamed(r, "center"), o = I.readNamed(r, "sides"), a = I.readNamed(r, "radius"), h = 360 / o, u = o % 3 === 0, _ = new L(0, u ? -a : a), d = u ? -1 : 0.5, c = new Array(o), l = 0; l < o; l++)
            c[l] = new J(s.add(
              _.rotate((l + d) * h)
            ));
          return i(c, !0, r);
        },
        Star: function() {
          for (var r = arguments, s = L.readNamed(r, "center"), o = I.readNamed(r, "points") * 2, a = I.readNamed(r, "radius1"), h = I.readNamed(r, "radius2"), u = 360 / o, _ = new L(0, -1), d = new Array(o), c = 0; c < o; c++)
            d[c] = new J(s.add(_.rotate(u * c).multiply(c % 2 ? h : a)));
          return i(d, !0, r);
        }
      };
    }() });
    var Nt = Ut.extend(
      {
        _class: "CompoundPath",
        _serializeFields: {
          children: []
        },
        beans: !0,
        initialize: function(e) {
          this._children = [], this._namedChildren = {}, this._initialize(e) || (typeof e == "string" ? this.setPathData(e) : this.addChildren(Array.isArray(e) ? e : arguments));
        },
        insertChildren: function t(e, i) {
          var n = i, r = n[0];
          r && typeof r[0] == "number" && (n = [n]);
          for (var s = i.length - 1; s >= 0; s--) {
            var o = n[s];
            n === i && !(o instanceof ot) && (n = I.slice(n)), Array.isArray(o) ? n[s] = new ot({ segments: o, insert: !1 }) : o instanceof Nt && (n.splice.apply(n, [s, 1].concat(o.removeChildren())), o.remove());
          }
          return t.base.call(this, e, n);
        },
        reduce: function t(e) {
          for (var i = this._children, n = i.length - 1; n >= 0; n--) {
            var r = i[n].reduce(e);
            r.isEmpty() && r.remove();
          }
          if (!i.length) {
            var r = new ot($.NO_INSERT);
            return r.copyAttributes(this), r.insertAbove(this), this.remove(), r;
          }
          return t.base.call(this);
        },
        isClosed: function() {
          for (var t = this._children, e = 0, i = t.length; e < i; e++)
            if (!t[e]._closed)
              return !1;
          return !0;
        },
        setClosed: function(t) {
          for (var e = this._children, i = 0, n = e.length; i < n; i++)
            e[i].setClosed(t);
        },
        getFirstSegment: function() {
          var t = this.getFirstChild();
          return t && t.getFirstSegment();
        },
        getLastSegment: function() {
          var t = this.getLastChild();
          return t && t.getLastSegment();
        },
        getCurves: function() {
          for (var t = this._children, e = [], i = 0, n = t.length; i < n; i++)
            I.push(e, t[i].getCurves());
          return e;
        },
        getFirstCurve: function() {
          var t = this.getFirstChild();
          return t && t.getFirstCurve();
        },
        getLastCurve: function() {
          var t = this.getLastChild();
          return t && t.getLastCurve();
        },
        getArea: function() {
          for (var t = this._children, e = 0, i = 0, n = t.length; i < n; i++)
            e += t[i].getArea();
          return e;
        },
        getLength: function() {
          for (var t = this._children, e = 0, i = 0, n = t.length; i < n; i++)
            e += t[i].getLength();
          return e;
        },
        getPathData: function(t, e) {
          for (var i = this._children, n = [], r = 0, s = i.length; r < s; r++) {
            var o = i[r], a = o._matrix;
            n.push(o.getPathData(t && !a.isIdentity() ? t.appended(a) : t, e));
          }
          return n.join("");
        },
        _hitTestChildren: function t(e, i, n) {
          return t.base.call(
            this,
            e,
            i.class === ot || i.type === "path" ? i : I.set({}, i, { fill: !1 }),
            n
          );
        },
        _draw: function(t, e, i, n) {
          var r = this._children;
          if (r.length) {
            e = e.extend({ dontStart: !0, dontFinish: !0 }), t.beginPath();
            for (var s = 0, o = r.length; s < o; s++)
              r[s].draw(t, e, n);
            if (!e.clip) {
              this._setStyles(t, e, i);
              var a = this._style;
              a.hasFill() && (t.fill(a.getFillRule()), t.shadowColor = "rgba(0,0,0,0)"), a.hasStroke() && t.stroke();
            }
          }
        },
        _drawSelected: function(t, e, i) {
          for (var n = this._children, r = 0, s = n.length; r < s; r++) {
            var o = n[r], a = o._matrix;
            i[o._id] || o._drawSelected(t, a.isIdentity() ? e : e.appended(a));
          }
        }
      },
      new function() {
        function t(e, i) {
          var n = e._children;
          if (i && !n.length)
            throw new Error("Use a moveTo() command first");
          return n[n.length - 1];
        }
        return I.each(
          [
            "lineTo",
            "cubicCurveTo",
            "quadraticCurveTo",
            "curveTo",
            "arcTo",
            "lineBy",
            "cubicCurveBy",
            "quadraticCurveBy",
            "curveBy",
            "arcBy"
          ],
          function(e) {
            this[e] = function() {
              var i = t(this, !0);
              i[e].apply(i, arguments);
            };
          },
          {
            moveTo: function() {
              var e = t(this), i = e && e.isEmpty() ? e : new ot($.NO_INSERT);
              i !== e && this.addChild(i), i.moveTo.apply(i, arguments);
            },
            moveBy: function() {
              var e = t(this, !0), i = e && e.getLastSegment(), n = L.read(arguments);
              this.moveTo(i ? n.add(i._point) : n);
            },
            closePath: function(e) {
              t(this, !0).closePath(e);
            }
          }
        );
      }(),
      I.each(["reverse", "flatten", "simplify", "smooth"], function(t) {
        this[t] = function(e) {
          for (var i = this._children, n, r = 0, s = i.length; r < s; r++)
            n = i[r][t](e) || n;
          return n;
        };
      }, {})
    );
    Ut.inject(new function() {
      var t = Math.min, e = Math.max, i = Math.abs, n = {
        unite: { 1: !0, 2: !0 },
        intersect: { 2: !0 },
        subtract: { 1: !0 },
        exclude: { 1: !0, "-1": !0 }
      };
      function r(p) {
        return p._children || [p];
      }
      function s(p, m) {
        var f = p.clone(!1).reduce({ simplify: !0 }).transform(null, !0, !0);
        if (m) {
          for (var g = r(f), w = 0, S = g.length; w < S; w++) {
            var p = g[w];
            !p._closed && !p.isEmpty() && (p.closePath(1e-12), p.getFirstSegment().setHandleIn(0, 0), p.getLastSegment().setHandleOut(0, 0));
          }
          f = f.resolveCrossings().reorient(f.getFillRule() === "nonzero", !0);
        }
        return f;
      }
      function o(p, m, f, g, w) {
        var S = new Nt($.NO_INSERT);
        return S.addChildren(p, !0), S = S.reduce({ simplify: m }), w && w.insert == !1 || S.insertAbove(g && f.isSibling(g) && f.getIndex() < g.getIndex() ? g : f), S.copyAttributes(f, !0), S;
      }
      function a(p) {
        return p.hasOverlap() || p.isCrossing();
      }
      function h(p, m, f, g) {
        if (g && (g.trace == !1 || g.stroke) && /^(subtract|intersect)$/.test(f))
          return u(p, m, f);
        var w = s(p, !0), S = m && p !== m && s(m, !0), x = n[f];
        x[f] = !0, S && (x.subtract || x.exclude) ^ (S.isClockwise() ^ w.isClockwise()) && S.reverse();
        var b = l(kt.expand(
          w.getIntersections(S, a)
        )), P = r(w), T = S && r(S), z = [], M = [], O;
        function A(X) {
          for (var ut = 0, it = X.length; ut < it; ut++) {
            var st = X[ut];
            I.push(z, st._segments), I.push(M, st.getCurves()), st._overlapsOnly = !0;
          }
        }
        function k(X) {
          for (var ut = [], it = 0, st = X && X.length; it < st; it++)
            ut.push(M[X[it]]);
          return ut;
        }
        if (b.length) {
          A(P), T && A(T);
          for (var N = new Array(M.length), E = 0, F = M.length; E < F; E++)
            N[E] = M[E].getValues();
          for (var D = yt.findCurveBoundsCollisions(
            N,
            N,
            0,
            !0
          ), V = {}, E = 0; E < M.length; E++) {
            var K = M[E], W = K._path._id, U = V[W] = V[W] || {};
            U[K.getIndex()] = {
              hor: k(D[E].hor),
              ver: k(D[E].ver)
            };
          }
          for (var E = 0, F = b.length; E < F; E++)
            y(
              b[E]._segment,
              w,
              S,
              V,
              x
            );
          for (var E = 0, F = z.length; E < F; E++) {
            var Z = z[E], Q = Z._intersection;
            Z._winding || y(
              Z,
              w,
              S,
              V,
              x
            ), Q && Q._overlap || (Z._path._overlapsOnly = !1);
          }
          O = C(z, x);
        } else
          O = c(
            T ? P.concat(T) : P.slice(),
            function(X) {
              return !!x[X];
            }
          );
        return o(O, !0, p, m, g);
      }
      function u(p, m, f) {
        var g = s(p), w = s(m), S = g.getIntersections(w, a), x = f === "subtract", b = f === "divide", P = {}, T = [];
        function z(A) {
          if (!P[A._id] && (b || w.contains(A.getPointAt(A.getLength() / 2)) ^ x))
            return T.unshift(A), P[A._id] = !0;
        }
        for (var M = S.length - 1; M >= 0; M--) {
          var O = S[M].split();
          O && (z(O) && O.getFirstSegment().setHandleIn(0, 0), g.getLastSegment().setHandleOut(0, 0));
        }
        return z(g), o(T, !1, p, m);
      }
      function _(p, m) {
        for (var f = p; f; ) {
          if (f === m)
            return;
          f = f._previous;
        }
        for (; p._next && p._next !== m; )
          p = p._next;
        if (!p._next) {
          for (; m._previous; )
            m = m._previous;
          p._next = m, m._previous = p;
        }
      }
      function d(p) {
        for (var m = p.length - 1; m >= 0; m--)
          p[m].clearHandles();
      }
      function c(p, m, f) {
        var g = p && p.length;
        if (g) {
          var w = I.each(p, function(D, V) {
            this[D._id] = {
              container: null,
              winding: D.isClockwise() ? 1 : -1,
              index: V
            };
          }, {}), S = p.slice().sort(function(D, V) {
            return i(V.getArea()) - i(D.getArea());
          }), x = S[0], b = yt.findItemBoundsCollisions(
            S,
            null,
            et.GEOMETRIC_EPSILON
          );
          f == null && (f = x.isClockwise());
          for (var P = 0; P < g; P++) {
            var T = S[P], z = w[T._id], M = 0, O = b[P];
            if (O) {
              for (var A = null, k = O.length - 1; k >= 0; k--)
                if (O[k] < P) {
                  A = A || T.getInteriorPoint();
                  var N = S[O[k]];
                  if (N.contains(A)) {
                    var E = w[N._id];
                    M = E.winding, z.winding += M, z.container = E.exclude ? E.container : N;
                    break;
                  }
                }
            }
            if (m(z.winding) === m(M))
              z.exclude = !0, p[z.index] = null;
            else {
              var F = z.container;
              T.setClockwise(
                F ? !F.isClockwise() : f
              );
            }
          }
        }
        return p;
      }
      function l(p, m, f) {
        var g = m && [], w = 1e-8, S = 1 - w, x = !1, b = f || [], P = f && {}, T, z, M;
        function O(ut) {
          return ut._path._id + "." + ut._segment1._index;
        }
        for (var A = (f && f.length) - 1; A >= 0; A--) {
          var k = f[A];
          k._path && (P[O(k)] = !0);
        }
        for (var A = p.length - 1; A >= 0; A--) {
          var N = p[A], E = N._time, F = E, D = m && !m(N), k = N._curve, V;
          if (k && (k !== z ? (x = !k.hasHandles() || P && P[O(k)], T = [], M = null, z = k) : M >= w && (E /= M)), D) {
            T && T.push(N);
            continue;
          } else
            m && g.unshift(N);
          if (M = F, E < w)
            V = k._segment1;
          else if (E > S)
            V = k._segment2;
          else {
            var K = k.divideAtTime(E, !0);
            x && b.push(k, K), V = K._segment1;
            for (var W = T.length - 1; W >= 0; W--) {
              var U = T[W];
              U._time = (U._time - E) / (1 - E);
            }
          }
          N._setSegment(V);
          var Z = V._intersection, Q = N._intersection;
          if (Z) {
            _(Z, Q);
            for (var X = Z; X; )
              _(X._intersection, Z), X = X._next;
          } else
            V._intersection = Q;
        }
        return f || d(b), g || p;
      }
      function v(p, m, f, g, w) {
        var S = Array.isArray(m) ? m : m[f ? "hor" : "ver"], x = f ? 1 : 0, b = x ^ 1, P = [p.x, p.y], T = P[x], z = P[b], M = 1e-9, O = 1e-6, A = T - M, k = T + M, N = 0, E = 0, F = 0, D = 0, V = !1, K = !1, W = 1, U = [], Z, Q;
        function X(ct) {
          var bt = ct[b + 0], At = ct[b + 6];
          if (!(z < t(bt, At) || z > e(bt, At))) {
            var Mt = ct[x + 0], Vt = ct[x + 2], Kt = ct[x + 4], qt = ct[x + 6];
            if (bt === At) {
              (Mt < k && qt > A || qt < k && Mt > A) && (V = !0);
              return;
            }
            var Zt = z === bt ? 0 : z === At || A > e(Mt, Vt, Kt, qt) || k < t(Mt, Vt, Kt, qt) ? 1 : R.solveCubic(ct, b, z, U, 0, 1) > 0 ? U[0] : 1, Lt = Zt === 0 ? Mt : Zt === 1 ? qt : R.getPoint(ct, Zt)[f ? "y" : "x"], Et = bt > At ? 1 : -1, ee = Z[b] > Z[b + 6] ? 1 : -1, Gt = Z[x + 6];
            return z !== bt ? (Lt < A ? F += Et : Lt > k ? D += Et : V = !0, Lt > T - O && Lt < T + O && (W /= 2)) : (Et !== ee ? Mt < A ? F += Et : Mt > k && (D += Et) : Mt != Gt && (Gt < k && Lt > k ? (D += Et, V = !0) : Gt > A && Lt < A && (F += Et, V = !0)), W /= 4), Z = ct, !w && Lt > A && Lt < k && R.getTangent(ct, Zt)[f ? "x" : "y"] === 0 && v(p, m, !f, g, !0);
          }
        }
        function ut(ct) {
          var bt = ct[b + 0], At = ct[b + 2], Mt = ct[b + 4], Vt = ct[b + 6];
          if (z <= e(bt, At, Mt, Vt) && z >= t(bt, At, Mt, Vt)) {
            for (var Kt = ct[x + 0], qt = ct[x + 2], Zt = ct[x + 4], Lt = ct[x + 6], Et = A > e(Kt, qt, Zt, Lt) || k < t(Kt, qt, Zt, Lt) ? [ct] : R.getMonoCurves(ct, f), ee, Gt = 0, Ie = Et.length; Gt < Ie; Gt++)
              if (ee = X(Et[Gt]))
                return ee;
          }
        }
        for (var it = 0, st = S.length; it < st; it++) {
          var at = S[it], nt = at._path, It = at.getValues(), Tt;
          if ((!it || S[it - 1]._path !== nt) && (Z = null, nt._closed || (Q = R.getValues(
            nt.getLastCurve().getSegment2(),
            at.getSegment1(),
            null,
            !g
          ), Q[b] !== Q[b + 6] && (Z = Q)), !Z)) {
            Z = It;
            for (var Ot = nt.getLastCurve(); Ot && Ot !== at; ) {
              var xt = Ot.getValues();
              if (xt[b] !== xt[b + 6]) {
                Z = xt;
                break;
              }
              Ot = Ot.getPrevious();
            }
          }
          if (Tt = ut(It))
            return Tt;
          if (it + 1 === st || S[it + 1]._path !== nt) {
            if (Q && (Tt = ut(Q)))
              return Tt;
            V && !F && !D && (F = D = nt.isClockwise(g) ^ f ? 1 : -1), N += F, E += D, F = D = 0, V && (K = !0, V = !1), Q = null;
          }
        }
        return N = i(N), E = i(E), {
          winding: e(N, E),
          windingL: N,
          windingR: E,
          quality: W,
          onPath: K
        };
      }
      function y(p, m, f, g, w) {
        var S = [], x = p, b = 0, M;
        do {
          var P = p.getCurve();
          if (P) {
            var T = P.getLength();
            S.push({ segment: p, curve: P, length: T }), b += T;
          }
          p = p.getNext();
        } while (p && !p._intersection && p !== x);
        for (var z = [0.5, 0.25, 0.75], M = { winding: 0, quality: -1 }, O = 1e-3, A = 1 - O, k = 0; k < z.length && M.quality < 0.5; k++)
          for (var T = b * z[k], N = 0, E = S.length; N < E; N++) {
            var F = S[N], D = F.length;
            if (T <= D) {
              var P = F.curve, V = P._path, K = V._parent, W = K instanceof Nt ? K : V, U = et.clamp(P.getTimeAt(T), O, A), Z = P.getPointAtTime(U), Q = i(P.getTangentAtTime(U).y) < Math.SQRT1_2, X = null;
              if (w.subtract && f) {
                var ut = W === m ? f : m, it = ut._getWinding(Z, Q, !0);
                if (W === m && it.winding || W === f && !it.winding) {
                  if (it.quality < 1)
                    continue;
                  X = { winding: 0, quality: 1 };
                }
              }
              X = X || v(
                Z,
                g[V._id][P.getIndex()],
                Q,
                !0
              ), X.quality > M.quality && (M = X);
              break;
            }
            T -= D;
          }
        for (var N = S.length - 1; N >= 0; N--)
          S[N].segment._winding = M;
      }
      function C(p, m) {
        var f = [], g;
        function w(st) {
          var at;
          return !!(st && !st._visited && (!m || m[(at = st._winding || {}).winding] && !(m.unite && at.winding === 2 && at.windingL && at.windingR)));
        }
        function S(st) {
          if (st) {
            for (var at = 0, nt = g.length; at < nt; at++)
              if (st === g[at])
                return !0;
          }
          return !1;
        }
        function x(st) {
          for (var at = st._segments, nt = 0, It = at.length; nt < It; nt++)
            at[nt]._visited = !0;
        }
        function b(st, at) {
          var nt = st._intersection, It = nt, Tt = [];
          at && (g = [st]);
          function Ot(xt, ct) {
            for (; xt && xt !== ct; ) {
              var bt = xt._segment, At = bt && bt._path;
              if (At) {
                var Mt = bt.getNext() || At.getFirstSegment(), Vt = Mt._intersection;
                bt !== st && (S(bt) || S(Mt) || Mt && w(bt) && (w(Mt) || Vt && w(Vt._segment))) && Tt.push(bt), at && g.push(bt);
              }
              xt = xt._next;
            }
          }
          if (nt) {
            for (Ot(nt); nt && nt._previous; )
              nt = nt._previous;
            Ot(nt, It);
          }
          return Tt;
        }
        p.sort(function(st, at) {
          var nt = st._intersection, It = at._intersection, Tt = !!(nt && nt._overlap), Ot = !!(It && It._overlap), xt = st._path, ct = at._path;
          return Tt ^ Ot ? Tt ? 1 : -1 : !nt ^ !It ? nt ? 1 : -1 : xt !== ct ? xt._id - ct._id : st._index - at._index;
        });
        for (var P = 0, T = p.length; P < T; P++) {
          var z = p[P], M = w(z), O = null, A = !1, k = !0, N = [], E, F, D;
          if (M && z._path._overlapsOnly) {
            var V = z._path, K = z._intersection._segment._path;
            V.compare(K) && (V.getArea() && f.push(V.clone(!1)), x(V), x(K), M = !1);
          }
          for (; M; ) {
            var W = !O, U = b(z, W), Z = U.shift(), A = !W && (S(z) || S(Z)), Q = !A && Z;
            if (W && (O = new ot($.NO_INSERT), E = null), A) {
              (z.isFirst() || z.isLast()) && (k = z._path._closed), z._visited = !0;
              break;
            }
            if (Q && E && (N.push(E), E = null), E || (Q && U.push(z), E = {
              start: O._segments.length,
              crossings: U,
              visited: F = [],
              handleIn: D
            }), Q && (z = Z), !w(z)) {
              O.removeSegments(E.start);
              for (var X = 0, ut = F.length; X < ut; X++)
                F[X]._visited = !1;
              F.length = 0;
              do
                z = E && E.crossings.shift(), (!z || !z._path) && (z = null, E = N.pop(), E && (F = E.visited, D = E.handleIn));
              while (E && !w(z));
              if (!z)
                break;
            }
            var it = z.getNext();
            O.add(new J(
              z._point,
              D,
              it && z._handleOut
            )), z._visited = !0, F.push(z), z = it || z._path.getFirstSegment(), D = it && it._handleIn;
          }
          A && (k && (O.getFirstSegment().setHandleIn(D), O.setClosed(k)), O.getArea() !== 0 && f.push(O));
        }
        return f;
      }
      return {
        _getWinding: function(p, m, f) {
          return v(p, this.getCurves(), m, f);
        },
        unite: function(p, m) {
          return h(this, p, "unite", m);
        },
        intersect: function(p, m) {
          return h(this, p, "intersect", m);
        },
        subtract: function(p, m) {
          return h(this, p, "subtract", m);
        },
        exclude: function(p, m) {
          return h(this, p, "exclude", m);
        },
        divide: function(p, m) {
          return m && (m.trace == !1 || m.stroke) ? u(this, p, "divide") : o([
            this.subtract(p, m),
            this.intersect(p, m)
          ], !0, this, p, m);
        },
        resolveCrossings: function() {
          var p = this._children, m = p || [this];
          function f(E, F) {
            var D = E && E._intersection;
            return D && D._overlap && D._path === F;
          }
          var g = !1, w = !1, S = this.getIntersections(null, function(E) {
            return E.hasOverlap() && (g = !0) || E.isCrossing() && (w = !0);
          }), x = g && w && [];
          if (S = kt.expand(S), g)
            for (var b = l(S, function(E) {
              return E.hasOverlap();
            }, x), P = b.length - 1; P >= 0; P--) {
              var T = b[P], z = T._path, M = T._segment, O = M.getPrevious(), A = M.getNext();
              f(O, z) && f(A, z) && (M.remove(), O._handleOut._set(0, 0), A._handleIn._set(0, 0), O !== M && !O.getCurve().hasLength() && (A._handleIn.set(O._handleIn), O.remove()));
            }
          w && (l(S, g && function(E) {
            var F = E.getCurve(), D = E.getSegment(), V = E._intersection, K = V._curve, W = V._segment;
            if (F && K && F._path && K._path)
              return !0;
            D && (D._intersection = null), W && (W._intersection = null);
          }, x), x && d(x), m = C(I.each(m, function(E) {
            I.push(this, E._segments);
          }, [])));
          var k = m.length, N;
          return k > 1 && p ? (m !== p && this.setChildren(m), N = this) : k === 1 && !p && (m[0] !== this && this.setSegments(m[0].removeSegments()), N = this), N || (N = new Nt($.NO_INSERT), N.addChildren(m), N = N.reduce(), N.copyAttributes(this), this.replaceWith(N)), N;
        },
        reorient: function(p, m) {
          var f = this._children;
          return f && f.length ? this.setChildren(c(
            this.removeChildren(),
            function(g) {
              return !!(p ? g : g & 1);
            },
            m
          )) : m !== B && this.setClockwise(m), this;
        },
        getInteriorPoint: function() {
          var p = this.getBounds(), m = p.getCenter(!0);
          if (!this.contains(m)) {
            for (var f = this.getCurves(), g = m.y, w = [], S = [], x = 0, b = f.length; x < b; x++) {
              var P = f[x].getValues(), T = P[1], z = P[3], M = P[5], O = P[7];
              if (g >= t(T, z, M, O) && g <= e(T, z, M, O))
                for (var A = R.getMonoCurves(P), k = 0, N = A.length; k < N; k++) {
                  var E = A[k], F = E[1], D = E[7];
                  if (F !== D && (g >= F && g <= D || g >= D && g <= F)) {
                    var V = g === F ? E[0] : g === D ? E[6] : R.solveCubic(E, 1, g, S, 0, 1) === 1 ? R.getPoint(E, S[0]).x : (E[0] + E[6]) / 2;
                    w.push(V);
                  }
                }
            }
            w.length > 1 && (w.sort(function(K, W) {
              return K - W;
            }), m.x = (w[0] + w[1]) / 2);
          }
          return m;
        }
      };
    }());
    var he = I.extend(
      {
        _class: "PathFlattener",
        initialize: function(t, e, i, n, r) {
          var s = [], o = [], a = 0, h = 1 / (i || 32), u = t._segments, _ = u[0], d;
          function c(C, p) {
            var m = R.getValues(C, p, r);
            s.push(m), l(m, C._index, 0, 1);
          }
          function l(C, p, m, f) {
            if (f - m > h && !(n && R.isStraight(C)) && !R.isFlatEnough(C, e || 0.25)) {
              var g = R.subdivide(C, 0.5), w = (m + f) / 2;
              l(g[0], p, m, w), l(g[1], p, w, f);
            } else {
              var S = C[6] - C[0], x = C[7] - C[1], b = Math.sqrt(S * S + x * x);
              b > 0 && (a += b, o.push({
                offset: a,
                curve: C,
                index: p,
                time: f
              }));
            }
          }
          for (var v = 1, y = u.length; v < y; v++)
            d = u[v], c(_, d), _ = d;
          t._closed && c(d || _, u[0]), this.curves = s, this.parts = o, this.length = a, this.index = 0;
        },
        _get: function(t) {
          for (var e = this.parts, i = e.length, n, r = this.index; n = r, !(!r || e[--r].offset < t); )
            ;
          for (; n < i; n++) {
            var s = e[n];
            if (s.offset >= t) {
              this.index = n;
              var o = e[n - 1], a = o && o.index === s.index ? o.time : 0, h = o ? o.offset : 0;
              return {
                index: s.index,
                time: a + (s.time - a) * (t - h) / (s.offset - h)
              };
            }
          }
          return {
            index: e[i - 1].index,
            time: 1
          };
        },
        drawPart: function(t, e, i) {
          for (var n = this._get(e), r = this._get(i), s = n.index, o = r.index; s <= o; s++) {
            var a = R.getPart(
              this.curves[s],
              s === n.index ? n.time : 0,
              s === r.index ? r.time : 1
            );
            s === n.index && t.moveTo(a[0], a[1]), t.bezierCurveTo.apply(t, a.slice(2));
          }
        }
      },
      I.each(
        R._evaluateMethods,
        function(t) {
          this[t + "At"] = function(e) {
            var i = this._get(e);
            return R[t](this.curves[i.index], i.time);
          };
        },
        {}
      )
    ), me = I.extend({
      initialize: function(t) {
        for (var e = this.points = [], i = t._segments, n = t._closed, r = 0, s, o = i.length; r < o; r++) {
          var a = i[r].point;
          (!s || !s.equals(a)) && e.push(s = a.clone());
        }
        n && (e.unshift(e[e.length - 1]), e.push(e[1])), this.closed = n;
      },
      fit: function(t) {
        var e = this.points, i = e.length, n = null;
        return i > 0 && (n = [new J(e[0])], i > 1 && (this.fitCubic(
          n,
          t,
          0,
          i - 1,
          e[1].subtract(e[0]),
          e[i - 2].subtract(e[i - 1])
        ), this.closed && (n.shift(), n.pop()))), n;
      },
      fitCubic: function(t, e, i, n, r, s) {
        var o = this.points;
        if (n - i === 1) {
          var a = o[i], h = o[n], u = a.getDistance(h) / 3;
          this.addCurve(t, [
            a,
            a.add(r.normalize(u)),
            h.add(s.normalize(u)),
            h
          ]);
          return;
        }
        for (var _ = this.chordLengthParameterize(i, n), d = Math.max(e, e * e), c, l = !0, v = 0; v <= 4; v++) {
          var y = this.generateBezier(i, n, _, r, s), C = this.findMaxError(i, n, y, _);
          if (C.error < e && l) {
            this.addCurve(t, y);
            return;
          }
          if (c = C.index, C.error >= d)
            break;
          l = this.reparameterize(i, n, _, y), d = C.error;
        }
        var p = o[c - 1].subtract(o[c + 1]);
        this.fitCubic(t, e, i, c, r, p), this.fitCubic(t, e, c, n, p.negate(), s);
      },
      addCurve: function(t, e) {
        var i = t[t.length - 1];
        i.setHandleOut(e[1].subtract(e[0])), t.push(new J(e[3], e[2].subtract(e[3])));
      },
      generateBezier: function(t, e, i, n, r) {
        for (var s = 1e-12, o = Math.abs, a = this.points, h = a[t], u = a[e], _ = [[0, 0], [0, 0]], d = [0, 0], c = 0, l = e - t + 1; c < l; c++) {
          var v = i[c], y = 1 - v, C = 3 * v * y, p = y * y * y, m = C * y, f = C * v, g = v * v * v, w = n.normalize(m), S = r.normalize(f), x = a[t + c].subtract(h.multiply(p + m)).subtract(u.multiply(f + g));
          _[0][0] += w.dot(w), _[0][1] += w.dot(S), _[1][0] = _[0][1], _[1][1] += S.dot(S), d[0] += w.dot(x), d[1] += S.dot(x);
        }
        var b = _[0][0] * _[1][1] - _[1][0] * _[0][1], P, T;
        if (o(b) > s) {
          var z = _[0][0] * d[1] - _[1][0] * d[0], M = d[0] * _[1][1] - d[1] * _[0][1];
          P = M / b, T = z / b;
        } else {
          var O = _[0][0] + _[0][1], A = _[1][0] + _[1][1];
          P = T = o(O) > s ? d[0] / O : o(A) > s ? d[1] / A : 0;
        }
        var k = u.getDistance(h), N = s * k, E, F;
        if (P < N || T < N)
          P = T = k / 3;
        else {
          var D = u.subtract(h);
          E = n.normalize(P), F = r.normalize(T), E.dot(D) - F.dot(D) > k * k && (P = T = k / 3, E = F = null);
        }
        return [
          h,
          h.add(E || n.normalize(P)),
          u.add(F || r.normalize(T)),
          u
        ];
      },
      reparameterize: function(t, e, i, n) {
        for (var r = t; r <= e; r++)
          i[r - t] = this.findRoot(n, this.points[r], i[r - t]);
        for (var r = 1, s = i.length; r < s; r++)
          if (i[r] <= i[r - 1])
            return !1;
        return !0;
      },
      findRoot: function(t, e, i) {
        for (var n = [], r = [], s = 0; s <= 2; s++)
          n[s] = t[s + 1].subtract(t[s]).multiply(3);
        for (var s = 0; s <= 1; s++)
          r[s] = n[s + 1].subtract(n[s]).multiply(2);
        var o = this.evaluate(3, t, i), a = this.evaluate(2, n, i), h = this.evaluate(1, r, i), u = o.subtract(e), _ = a.dot(a) + u.dot(h);
        return et.isMachineZero(_) ? i : i - u.dot(a) / _;
      },
      evaluate: function(t, e, i) {
        for (var n = e.slice(), r = 1; r <= t; r++)
          for (var s = 0; s <= t - r; s++)
            n[s] = n[s].multiply(1 - i).add(n[s + 1].multiply(i));
        return n[0];
      },
      chordLengthParameterize: function(t, e) {
        for (var i = [0], n = t + 1; n <= e; n++)
          i[n - t] = i[n - t - 1] + this.points[n].getDistance(this.points[n - 1]);
        for (var n = 1, r = e - t; n <= r; n++)
          i[n] /= i[r];
        return i;
      },
      findMaxError: function(t, e, i, n) {
        for (var r = Math.floor((e - t + 1) / 2), s = 0, o = t + 1; o < e; o++) {
          var a = this.evaluate(3, i, n[o - t]), h = a.subtract(this.points[o]), u = h.x * h.x + h.y * h.y;
          u >= s && (s = u, r = o);
        }
        return {
          error: s,
          index: r
        };
      }
    }), Qt = $.extend({
      _class: "TextItem",
      _applyMatrix: !1,
      _canApplyMatrix: !1,
      _serializeFields: {
        content: null
      },
      _boundsOptions: { stroke: !1, handle: !1 },
      initialize: function(e) {
        this._content = "", this._lines = [];
        var i = e && I.isPlainObject(e) && e.x === B && e.y === B;
        this._initialize(i && e, !i && L.read(arguments));
      },
      _equals: function(t) {
        return this._content === t._content;
      },
      copyContent: function(t) {
        this.setContent(t._content);
      },
      getContent: function() {
        return this._content;
      },
      setContent: function(t) {
        this._content = "" + t, this._lines = this._content.split(/\r\n|\n|\r/mg), this._changed(521);
      },
      isEmpty: function() {
        return !this._content;
      },
      getCharacterStyle: "#getStyle",
      setCharacterStyle: "#setStyle",
      getParagraphStyle: "#getStyle",
      setParagraphStyle: "#setStyle"
    }), we = Qt.extend({
      _class: "PointText",
      initialize: function() {
        Qt.apply(this, arguments);
      },
      getPoint: function() {
        var t = this._matrix.getTranslation();
        return new Dt(t.x, t.y, this, "setPoint");
      },
      setPoint: function() {
        var t = L.read(arguments);
        this.translate(t.subtract(this._matrix.getTranslation()));
      },
      _draw: function(t, e, i) {
        if (this._content) {
          this._setStyles(t, e, i);
          var n = this._lines, r = this._style, s = r.hasFill(), o = r.hasStroke(), a = r.getLeading(), h = t.shadowColor;
          t.font = r.getFontStyle(), t.textAlign = r.getJustification();
          for (var u = 0, _ = n.length; u < _; u++) {
            t.shadowColor = h;
            var d = n[u];
            s && (t.fillText(d, 0, 0), t.shadowColor = "rgba(0,0,0,0)"), o && t.strokeText(d, 0, 0), t.translate(0, a);
          }
        }
      },
      _getBounds: function(t, e) {
        var i = this._style, n = this._lines, r = n.length, s = i.getJustification(), o = i.getLeading(), a = this.getView().getTextWidth(i.getFontStyle(), n), h = 0;
        s !== "left" && (h -= a / (s === "center" ? 2 : 1));
        var u = new j(
          h,
          r ? -0.75 * o : 0,
          a,
          r * o
        );
        return t ? t._transformBounds(u, u) : u;
      }
    }), St = I.extend(
      new function() {
        var t = {
          gray: ["gray"],
          rgb: ["red", "green", "blue"],
          hsb: ["hue", "saturation", "brightness"],
          hsl: ["hue", "saturation", "lightness"],
          gradient: ["gradient", "origin", "destination", "highlight"]
        }, e = {}, i = {
          transparent: [0, 0, 0, 0]
        }, n;
        function r(a) {
          var h = a.match(
            /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})?$/i
          ) || a.match(
            /^#([\da-f])([\da-f])([\da-f])([\da-f])?$/i
          ), u = "rgb", _;
          if (h) {
            var d = h[4] ? 4 : 3;
            _ = new Array(d);
            for (var c = 0; c < d; c++) {
              var l = h[c + 1];
              _[c] = parseInt(l.length == 1 ? l + l : l, 16) / 255;
            }
          } else if (h = a.match(/^(rgb|hsl)a?\((.*)\)$/)) {
            u = h[1], _ = h[2].trim().split(/[,\s]+/g);
            for (var v = u === "hsl", c = 0, y = Math.min(_.length, 4); c < y; c++) {
              var C = _[c], l = parseFloat(C);
              if (v)
                if (c === 0) {
                  var p = C.match(/([a-z]*)$/)[1];
                  l *= {
                    turn: 360,
                    rad: 180 / Math.PI,
                    grad: 0.9
                  }[p] || 1;
                } else
                  c < 3 && (l /= 100);
              else
                c < 3 && (l /= /%$/.test(C) ? 100 : 255);
              _[c] = l;
            }
          } else {
            var m = i[a];
            if (!m)
              if (Y) {
                n || (n = wt.getContext(1, 1, {
                  willReadFrequently: !0
                }), n.globalCompositeOperation = "copy"), n.fillStyle = "rgba(0,0,0,0)", n.fillStyle = a, n.fillRect(0, 0, 1, 1);
                var f = n.getImageData(0, 0, 1, 1).data;
                m = i[a] = [
                  f[0] / 255,
                  f[1] / 255,
                  f[2] / 255
                ];
              } else
                m = [0, 0, 0];
            _ = m.slice();
          }
          return [u, _];
        }
        var s = [
          [0, 3, 1],
          [2, 0, 1],
          [1, 0, 3],
          [1, 2, 0],
          [3, 1, 0],
          [0, 1, 2]
        ], o = {
          "rgb-hsb": function(a, h, u) {
            var _ = Math.max(a, h, u), d = Math.min(a, h, u), c = _ - d, l = c === 0 ? 0 : (_ == a ? (h - u) / c + (h < u ? 6 : 0) : _ == h ? (u - a) / c + 2 : (a - h) / c + 4) * 60;
            return [l, _ === 0 ? 0 : c / _, _];
          },
          "hsb-rgb": function(a, h, u) {
            a = (a / 60 % 6 + 6) % 6;
            var d = Math.floor(a), _ = a - d, d = s[d], c = [
              u,
              u * (1 - h),
              u * (1 - h * _),
              u * (1 - h * (1 - _))
            ];
            return [c[d[0]], c[d[1]], c[d[2]]];
          },
          "rgb-hsl": function(a, h, u) {
            var _ = Math.max(a, h, u), d = Math.min(a, h, u), c = _ - d, l = c === 0, v = l ? 0 : (_ == a ? (h - u) / c + (h < u ? 6 : 0) : _ == h ? (u - a) / c + 2 : (a - h) / c + 4) * 60, y = (_ + d) / 2, C = l ? 0 : y < 0.5 ? c / (_ + d) : c / (2 - _ - d);
            return [v, C, y];
          },
          "hsl-rgb": function(a, h, u) {
            if (a = (a / 360 % 1 + 1) % 1, h === 0)
              return [u, u, u];
            for (var _ = [a + 1 / 3, a, a - 1 / 3], d = u < 0.5 ? u * (1 + h) : u + h - u * h, c = 2 * u - d, l = [], v = 0; v < 3; v++) {
              var y = _[v];
              y < 0 && (y += 1), y > 1 && (y -= 1), l[v] = 6 * y < 1 ? c + (d - c) * 6 * y : 2 * y < 1 ? d : 3 * y < 2 ? c + (d - c) * (2 / 3 - y) * 6 : c;
            }
            return l;
          },
          "rgb-gray": function(a, h, u) {
            return [a * 0.2989 + h * 0.587 + u * 0.114];
          },
          "gray-rgb": function(a) {
            return [a, a, a];
          },
          "gray-hsb": function(a) {
            return [0, 0, a];
          },
          "gray-hsl": function(a) {
            return [0, 0, a];
          },
          "gradient-rgb": function() {
            return [];
          },
          "rgb-gradient": function() {
            return [];
          }
        };
        return I.each(t, function(a, h) {
          e[h] = [], I.each(a, function(u, _) {
            var d = I.capitalize(u), c = /^(hue|saturation)$/.test(u), l = e[h][_] = h === "gradient" ? u === "gradient" ? function(v) {
              var y = this._components[0];
              return v = $t.read(
                Array.isArray(v) ? v : arguments,
                0,
                { readNull: !0 }
              ), y !== v && (y && y._removeOwner(this), v && v._addOwner(this)), v;
            } : function() {
              return L.read(arguments, 0, {
                readNull: u === "highlight",
                clone: !0
              });
            } : function(v) {
              return v == null || isNaN(v) ? 0 : +v;
            };
            this["get" + d] = function() {
              return this._type === h || c && /^hs[bl]$/.test(this._type) ? this._components[_] : this._convert(h)[_];
            }, this["set" + d] = function(v) {
              this._type !== h && !(c && /^hs[bl]$/.test(this._type)) && (this._components = this._convert(h), this._properties = t[h], this._type = h), this._components[_] = l.call(this, v), this._changed();
            };
          }, this);
        }, {
          _class: "Color",
          _readIndex: !0,
          initialize: function a(h) {
            var u = arguments, _ = this.__read, d = 0, c, l, v, y;
            Array.isArray(h) && (u = h, h = u[0]);
            var C = h != null && typeof h;
            if (C === "string" && h in t && (c = h, h = u[1], Array.isArray(h) ? (l = h, v = u[2]) : (_ && (d = 1), u = I.slice(u, 1), C = typeof h)), !l) {
              if (y = C === "number" ? u : C === "object" && h.length != null ? h : null, y) {
                c || (c = y.length >= 3 ? "rgb" : "gray");
                var p = t[c].length;
                v = y[p], _ && (d += y === arguments ? p + (v != null ? 1 : 0) : 1), y.length > p && (y = I.slice(y, 0, p));
              } else if (C === "string") {
                var m = r(h);
                c = m[0], l = m[1], l.length === 4 && (v = l[3], l.length--);
              } else if (C === "object")
                if (h.constructor === a) {
                  if (c = h._type, l = h._components.slice(), v = h._alpha, c === "gradient")
                    for (var f = 1, g = l.length; f < g; f++) {
                      var w = l[f];
                      w && (l[f] = w.clone());
                    }
                } else if (h.constructor === $t)
                  c = "gradient", y = u;
                else {
                  c = "hue" in h ? "lightness" in h ? "hsl" : "hsb" : "gradient" in h || "stops" in h || "radial" in h ? "gradient" : "gray" in h ? "gray" : "rgb";
                  var S = t[c], x = e[c];
                  this._components = l = [];
                  for (var f = 0, g = S.length; f < g; f++) {
                    var b = h[S[f]];
                    b == null && !f && c === "gradient" && "stops" in h && (b = {
                      stops: h.stops,
                      radial: h.radial
                    }), b = x[f].call(this, b), b != null && (l[f] = b);
                  }
                  v = h.alpha;
                }
              _ && c && (d = 1);
            }
            if (this._type = c || "rgb", !l) {
              this._components = l = [];
              for (var x = e[this._type], f = 0, g = x.length; f < g; f++) {
                var b = x[f].call(this, y && y[f]);
                b != null && (l[f] = b);
              }
            }
            return this._components = l, this._properties = t[this._type], this._alpha = v, _ && (this.__read = d), this;
          },
          set: "#initialize",
          _serialize: function(a, h) {
            var u = this.getComponents();
            return I.serialize(
              /^(gray|rgb)$/.test(this._type) ? u : [this._type].concat(u),
              a,
              !0,
              h
            );
          },
          _changed: function() {
            this._canvasStyle = null, this._owner && (this._setter ? this._owner[this._setter](this) : this._owner._changed(129));
          },
          _convert: function(a) {
            var h;
            return this._type === a ? this._components.slice() : (h = o[this._type + "-" + a]) ? h.apply(this, this._components) : o["rgb-" + a].apply(
              this,
              o[this._type + "-rgb"].apply(
                this,
                this._components
              )
            );
          },
          convert: function(a) {
            return new St(a, this._convert(a), this._alpha);
          },
          getType: function() {
            return this._type;
          },
          setType: function(a) {
            this._components = this._convert(a), this._properties = t[a], this._type = a;
          },
          getComponents: function() {
            var a = this._components.slice();
            return this._alpha != null && a.push(this._alpha), a;
          },
          getAlpha: function() {
            return this._alpha != null ? this._alpha : 1;
          },
          setAlpha: function(a) {
            this._alpha = a == null ? null : Math.min(Math.max(a, 0), 1), this._changed();
          },
          hasAlpha: function() {
            return this._alpha != null;
          },
          equals: function(a) {
            var h = I.isPlainValue(a, !0) ? St.read(arguments) : a;
            return h === this || h && this._class === h._class && this._type === h._type && this.getAlpha() === h.getAlpha() && I.equals(this._components, h._components) || !1;
          },
          toString: function() {
            for (var a = this._properties, h = [], u = this._type === "gradient", _ = ht.instance, d = 0, c = a.length; d < c; d++) {
              var l = this._components[d];
              l != null && h.push(a[d] + ": " + (u ? l : _.number(l)));
            }
            return this._alpha != null && h.push("alpha: " + _.number(this._alpha)), "{ " + h.join(", ") + " }";
          },
          toCSS: function(a) {
            var h = this._convert("rgb"), u = a || this._alpha == null ? 1 : this._alpha;
            function _(d) {
              return Math.round((d < 0 ? 0 : d > 1 ? 1 : d) * 255);
            }
            return h = [
              _(h[0]),
              _(h[1]),
              _(h[2])
            ], u < 1 && h.push(u < 0 ? 0 : u), a ? "#" + ((1 << 24) + (h[0] << 16) + (h[1] << 8) + h[2]).toString(16).slice(1) : (h.length == 4 ? "rgba(" : "rgb(") + h.join(",") + ")";
          },
          toCanvasStyle: function(a, h) {
            if (this._canvasStyle)
              return this._canvasStyle;
            if (this._type !== "gradient")
              return this._canvasStyle = this.toCSS();
            var u = this._components, _ = u[0], d = _._stops, c = u[1], l = u[2], v = u[3], y = h && h.inverted(), C;
            if (y && (c = y._transformPoint(c), l = y._transformPoint(l), v && (v = y._transformPoint(v))), _._radial) {
              var p = l.getDistance(c);
              if (v) {
                var m = v.subtract(c);
                m.getLength() > p && (v = c.add(m.normalize(p - 0.1)));
              }
              var f = v || c;
              C = a.createRadialGradient(
                f.x,
                f.y,
                0,
                c.x,
                c.y,
                p
              );
            } else
              C = a.createLinearGradient(
                c.x,
                c.y,
                l.x,
                l.y
              );
            for (var g = 0, w = d.length; g < w; g++) {
              var S = d[g], x = S._offset;
              C.addColorStop(
                x ?? g / (w - 1),
                S._color.toCanvasStyle()
              );
            }
            return this._canvasStyle = C;
          },
          transform: function(a) {
            if (this._type === "gradient") {
              for (var h = this._components, u = 1, _ = h.length; u < _; u++) {
                var d = h[u];
                a._transformPoint(d, d, !0);
              }
              this._changed();
            }
          },
          statics: {
            _types: t,
            random: function() {
              var a = Math.random;
              return new St(a(), a(), a());
            },
            _setOwner: function(a, h, u) {
              return a && (a._owner && h && a._owner !== h && (a = a.clone()), !a._owner ^ !h && (a._owner = h || null, a._setter = u || null)), a;
            }
          }
        });
      }(),
      new function() {
        var t = {
          add: function(e, i) {
            return e + i;
          },
          subtract: function(e, i) {
            return e - i;
          },
          multiply: function(e, i) {
            return e * i;
          },
          divide: function(e, i) {
            return e / i;
          }
        };
        return I.each(t, function(e, i) {
          this[i] = function(n) {
            n = St.read(arguments);
            for (var r = this._type, s = this._components, o = n._convert(r), a = 0, h = s.length; a < h; a++)
              o[a] = e(s[a], o[a]);
            return new St(
              r,
              o,
              this._alpha != null ? e(this._alpha, n.getAlpha()) : null
            );
          };
        }, {});
      }()
    ), $t = I.extend({
      _class: "Gradient",
      initialize: function(e, i) {
        this._id = Ht.get(), e && I.isPlainObject(e) && (this.set(e), e = i = null), this._stops == null && this.setStops(e || ["white", "black"]), this._radial == null && this.setRadial(typeof i == "string" && i === "radial" || i || !1);
      },
      _serialize: function(t, e) {
        return e.add(this, function() {
          return I.serialize(
            [this._stops, this._radial],
            t,
            !0,
            e
          );
        });
      },
      _changed: function() {
        for (var t = 0, e = this._owners && this._owners.length; t < e; t++)
          this._owners[t]._changed();
      },
      _addOwner: function(t) {
        this._owners || (this._owners = []), this._owners.push(t);
      },
      _removeOwner: function(t) {
        var e = this._owners ? this._owners.indexOf(t) : -1;
        e != -1 && (this._owners.splice(e, 1), this._owners.length || (this._owners = B));
      },
      clone: function() {
        for (var t = [], e = 0, i = this._stops.length; e < i; e++)
          t[e] = this._stops[e].clone();
        return new $t(t, this._radial);
      },
      getStops: function() {
        return this._stops;
      },
      setStops: function(t) {
        if (t.length < 2)
          throw new Error(
            "Gradient stop list needs to contain at least two stops."
          );
        var e = this._stops;
        if (e)
          for (var i = 0, n = e.length; i < n; i++)
            e[i]._owner = B;
        e = this._stops = se.readList(t, 0, { clone: !0 });
        for (var i = 0, n = e.length; i < n; i++)
          e[i]._owner = this;
        this._changed();
      },
      getRadial: function() {
        return this._radial;
      },
      setRadial: function(t) {
        this._radial = t, this._changed();
      },
      equals: function(t) {
        if (t === this)
          return !0;
        if (t && this._class === t._class) {
          var e = this._stops, i = t._stops, n = e.length;
          if (n === i.length) {
            for (var r = 0; r < n; r++)
              if (!e[r].equals(i[r]))
                return !1;
            return !0;
          }
        }
        return !1;
      }
    }), se = I.extend({
      _class: "GradientStop",
      initialize: function(e, i) {
        var n = e, r = i;
        typeof e == "object" && i === B && (Array.isArray(e) && typeof e[0] != "number" ? (n = e[0], r = e[1]) : ("color" in e || "offset" in e || "rampPoint" in e) && (n = e.color, r = e.offset || e.rampPoint || 0)), this.setColor(n), this.setOffset(r);
      },
      clone: function() {
        return new se(this._color.clone(), this._offset);
      },
      _serialize: function(t, e) {
        var i = this._color, n = this._offset;
        return I.serialize(
          n == null ? [i] : [i, n],
          t,
          !0,
          e
        );
      },
      _changed: function() {
        this._owner && this._owner._changed(129);
      },
      getOffset: function() {
        return this._offset;
      },
      setOffset: function(t) {
        this._offset = t, this._changed();
      },
      getRampPoint: "#getOffset",
      setRampPoint: "#setOffset",
      getColor: function() {
        return this._color;
      },
      setColor: function() {
        St._setOwner(this._color, null), this._color = St._setOwner(
          St.read(arguments, 0),
          this,
          "setColor"
        ), this._changed();
      },
      equals: function(t) {
        return t === this || t && this._class === t._class && this._color.equals(t._color) && this._offset == t._offset || !1;
      }
    }), ae = I.extend(new function() {
      var t = {
        fillColor: null,
        fillRule: "nonzero",
        strokeColor: null,
        strokeWidth: 1,
        strokeCap: "butt",
        strokeJoin: "miter",
        strokeScaling: !0,
        miterLimit: 10,
        dashOffset: 0,
        dashArray: [],
        shadowColor: null,
        shadowBlur: 0,
        shadowOffset: new L(),
        selectedColor: null
      }, e = I.set({}, t, {
        fontFamily: "sans-serif",
        fontWeight: "normal",
        fontSize: 12,
        leading: null,
        justification: "left"
      }), i = I.set({}, e, {
        fillColor: new St()
      }), n = {
        strokeWidth: 193,
        strokeCap: 193,
        strokeJoin: 193,
        strokeScaling: 201,
        miterLimit: 193,
        fontFamily: 9,
        fontWeight: 9,
        fontSize: 9,
        font: 9,
        leading: 9,
        justification: 9
      }, r = {
        beans: !0
      }, s = {
        _class: "Style",
        beans: !0,
        initialize: function(a, h, u) {
          this._values = {}, this._owner = h, this._project = h && h._project || u || rt.project, this._defaults = !h || h instanceof Bt ? e : h instanceof Qt ? i : t, a && this.set(a);
        }
      };
      return I.each(e, function(o, a) {
        var h = /Color$/.test(a), u = a === "shadowOffset", _ = I.capitalize(a), d = n[a], c = "set" + _, l = "get" + _;
        s[c] = function(v) {
          var y = this._owner, C = y && y._children, p = C && C.length > 0 && !(y instanceof Nt);
          if (p)
            for (var m = 0, f = C.length; m < f; m++)
              C[m]._style[c](v);
          if ((a === "selectedColor" || !p) && a in this._defaults) {
            var g = this._values[a];
            g !== v && (h && (g && (St._setOwner(g, null), g._canvasStyle = null), v && v.constructor === St && (v = St._setOwner(
              v,
              y,
              p && c
            ))), this._values[a] = v, y && y._changed(d || 129));
          }
        }, s[l] = function(v) {
          var y = this._owner, C = y && y._children, p = C && C.length > 0 && !(y instanceof Nt), m;
          if (p && !v)
            for (var f = 0, g = C.length; f < g; f++) {
              var w = C[f]._style[l]();
              if (!f)
                m = w;
              else if (!I.equals(m, w))
                return B;
            }
          else if (a in this._defaults) {
            var m = this._values[a];
            if (m === B)
              m = this._defaults[a], m && m.clone && (m = m.clone());
            else {
              var S = h ? St : u ? L : null;
              S && !(m && m.constructor === S) && (this._values[a] = m = S.read(
                [m],
                0,
                { readNull: !0, clone: !0 }
              ));
            }
          }
          return m && h && (m = St._setOwner(m, y, p && c)), m;
        }, r[l] = function(v) {
          return this._style[l](v);
        }, r[c] = function(v) {
          this._style[c](v);
        };
      }), I.each({
        Font: "FontFamily",
        WindingRule: "FillRule"
      }, function(o, a) {
        var h = "get" + a, u = "set" + a;
        s[h] = r[h] = "#get" + o, s[u] = r[u] = "#set" + o;
      }), $.inject(r), s;
    }(), {
      set: function(t) {
        var e = t instanceof ae, i = e ? t._values : t;
        if (i) {
          for (var n in i)
            if (n in this._defaults) {
              var r = i[n];
              this[n] = r && e && r.clone ? r.clone() : r;
            }
        }
      },
      equals: function(t) {
        function e(i, n, r) {
          var s = i._values, o = n._values, a = n._defaults;
          for (var h in s) {
            var u = s[h], _ = o[h];
            if (!(r && h in o) && !I.equals(
              u,
              _ === B ? a[h] : _
            ))
              return !1;
          }
          return !0;
        }
        return t === this || t && this._class === t._class && e(this, t) && e(t, this, !0) || !1;
      },
      _dispose: function() {
        var t;
        t = this.getFillColor(), t && (t._canvasStyle = null), t = this.getStrokeColor(), t && (t._canvasStyle = null), t = this.getShadowColor(), t && (t._canvasStyle = null);
      },
      hasFill: function() {
        var t = this.getFillColor();
        return !!t && t.alpha > 0;
      },
      hasStroke: function() {
        var t = this.getStrokeColor();
        return !!t && t.alpha > 0 && this.getStrokeWidth() > 0;
      },
      hasShadow: function() {
        var t = this.getShadowColor();
        return !!t && t.alpha > 0 && (this.getShadowBlur() > 0 || !this.getShadowOffset().isZero());
      },
      getView: function() {
        return this._project._view;
      },
      getFontStyle: function() {
        var t = this.getFontSize();
        return this.getFontWeight() + " " + t + (/[a-z]/i.test(t + "") ? " " : "px ") + this.getFontFamily();
      },
      getFont: "#getFontFamily",
      setFont: "#setFontFamily",
      getLeading: function t() {
        var e = t.base.call(this), i = this.getFontSize();
        return /pt|em|%|px/.test(i) && (i = this.getView().getPixelSize(i)), e ?? i * 1.2;
      }
    }), vt = new function() {
      function t(e, i, n, r) {
        for (var s = ["", "webkit", "moz", "Moz", "ms", "o"], o = i[0].toUpperCase() + i.substring(1), a = 0; a < 6; a++) {
          var h = s[a], u = h ? h + o : i;
          if (u in e) {
            if (n)
              e[u] = r;
            else
              return e[u];
            break;
          }
        }
      }
      return {
        getStyles: function(e) {
          var i = e && e.nodeType !== 9 ? e.ownerDocument : e, n = i && i.defaultView;
          return n && n.getComputedStyle(e, "");
        },
        getBounds: function(e, i) {
          var n = e.ownerDocument, r = n.body, s = n.documentElement, o;
          try {
            o = e.getBoundingClientRect();
          } catch {
            o = { left: 0, top: 0, width: 0, height: 0 };
          }
          var a = o.left - (s.clientLeft || r.clientLeft || 0), h = o.top - (s.clientTop || r.clientTop || 0);
          if (!i) {
            var u = n.defaultView;
            a += u.pageXOffset || s.scrollLeft || r.scrollLeft, h += u.pageYOffset || s.scrollTop || r.scrollTop;
          }
          return new j(a, h, o.width, o.height);
        },
        getViewportBounds: function(e) {
          var i = e.ownerDocument, n = i.defaultView, r = i.documentElement;
          return new j(
            0,
            0,
            n.innerWidth || r.clientWidth,
            n.innerHeight || r.clientHeight
          );
        },
        getOffset: function(e, i) {
          return vt.getBounds(e, i).getPoint();
        },
        getSize: function(e) {
          return vt.getBounds(e, !0).getSize();
        },
        isInvisible: function(e) {
          return vt.getSize(e).equals(new G(0, 0));
        },
        isInView: function(e) {
          return !vt.isInvisible(e) && vt.getViewportBounds(e).intersects(
            vt.getBounds(e, !0)
          );
        },
        isInserted: function(e) {
          return tt.body.contains(e);
        },
        getPrefixed: function(e, i) {
          return e && t(e, i);
        },
        setPrefixed: function(e, i, n) {
          if (typeof i == "object")
            for (var r in i)
              t(e, r, !0, i[r]);
          else
            t(e, i, !0, n);
        }
      };
    }(), Ct = {
      add: function(t, e) {
        if (t)
          for (var i in e)
            for (var n = e[i], r = i.split(/[\s,]+/g), s = 0, o = r.length; s < o; s++) {
              var a = r[s], h = t === tt && (a === "touchstart" || a === "touchmove") ? { passive: !1 } : !1;
              t.addEventListener(a, n, h);
            }
      },
      remove: function(t, e) {
        if (t)
          for (var i in e)
            for (var n = e[i], r = i.split(/[\s,]+/g), s = 0, o = r.length; s < o; s++)
              t.removeEventListener(r[s], n, !1);
      },
      getPoint: function(t) {
        var e = t.targetTouches ? t.targetTouches.length ? t.targetTouches[0] : t.changedTouches[0] : t;
        return new L(
          e.pageX || e.clientX + tt.documentElement.scrollLeft,
          e.pageY || e.clientY + tt.documentElement.scrollTop
        );
      },
      getTarget: function(t) {
        return t.target || t.srcElement;
      },
      getRelatedTarget: function(t) {
        return t.relatedTarget || t.toElement;
      },
      getOffset: function(t, e) {
        return Ct.getPoint(t).subtract(vt.getOffset(
          e || Ct.getTarget(t)
        ));
      }
    };
    Ct.requestAnimationFrame = new function() {
      var t = vt.getPrefixed(Y, "requestAnimationFrame"), e = !1, i = [], n;
      function r() {
        var s = i;
        i = [];
        for (var o = 0, a = s.length; o < a; o++)
          s[o]();
        e = t && i.length, e && t(r);
      }
      return function(s) {
        i.push(s), t ? e || (t(r), e = !0) : n || (n = setInterval(r, 1e3 / 60));
      };
    }();
    var pt = I.extend(
      gt,
      {
        _class: "View",
        initialize: function t(e, i) {
          function n(d) {
            return i[d] || parseInt(i.getAttribute(d), 10);
          }
          function r() {
            var d = vt.getSize(i);
            return d.isNaN() || d.isZero() ? new G(n("width"), n("height")) : d;
          }
          var s;
          if (Y && i) {
            this._id = i.getAttribute("id"), this._id == null && i.setAttribute("id", this._id = "paper-view-" + t._id++), Ct.add(i, this._viewEvents);
            var o = "none";
            if (vt.setPrefixed(i.style, {
              userDrag: o,
              userSelect: o,
              touchCallout: o,
              contentZooming: o,
              tapHighlightColor: "rgba(0,0,0,0)"
            }), lt.hasAttribute(i, "resize")) {
              var a = this;
              Ct.add(Y, this._windowEvents = {
                resize: function() {
                  a.setViewSize(r());
                }
              });
            }
            if (s = r(), lt.hasAttribute(i, "stats") && typeof Stats < "u") {
              this._stats = new Stats();
              var h = this._stats.domElement, u = h.style, _ = vt.getOffset(i);
              u.position = "absolute", u.left = _.x + "px", u.top = _.y + "px", tt.body.appendChild(h);
            }
          } else
            s = new G(i), i = null;
          this._project = e, this._scope = e._scope, this._element = i, this._pixelRatio || (this._pixelRatio = Y && Y.devicePixelRatio || 1), this._setElementSize(s.width, s.height), this._viewSize = s, t._views.push(this), t._viewsById[this._id] = this, (this._matrix = new ft())._owner = this, t._focused || (t._focused = this), this._frameItems = {}, this._frameItemCount = 0, this._itemEvents = { native: {}, virtual: {} }, this._autoUpdate = !rt.agent.node, this._needsUpdate = !1;
        },
        remove: function() {
          if (!this._project)
            return !1;
          pt._focused === this && (pt._focused = null), pt._views.splice(pt._views.indexOf(this), 1), delete pt._viewsById[this._id];
          var t = this._project;
          return t._view === this && (t._view = null), Ct.remove(this._element, this._viewEvents), Ct.remove(Y, this._windowEvents), this._element = this._project = null, this.off("frame"), this._animate = !1, this._frameItems = {}, !0;
        },
        _events: I.each(
          $._itemHandlers.concat(["onResize", "onKeyDown", "onKeyUp"]),
          function(t) {
            this[t] = {};
          },
          {
            onFrame: {
              install: function() {
                this.play();
              },
              uninstall: function() {
                this.pause();
              }
            }
          }
        ),
        _animate: !1,
        _time: 0,
        _count: 0,
        getAutoUpdate: function() {
          return this._autoUpdate;
        },
        setAutoUpdate: function(t) {
          this._autoUpdate = t, t && this.requestUpdate();
        },
        update: function() {
        },
        draw: function() {
          this.update();
        },
        requestUpdate: function() {
          if (!this._requested) {
            var t = this;
            Ct.requestAnimationFrame(function() {
              if (t._requested = !1, t._animate) {
                t.requestUpdate();
                var e = t._element;
                (!vt.getPrefixed(tt, "hidden") || lt.getAttribute(e, "keepalive") === "true") && vt.isInView(e) && t._handleFrame();
              }
              t._autoUpdate && t.update();
            }), this._requested = !0;
          }
        },
        play: function() {
          this._animate = !0, this.requestUpdate();
        },
        pause: function() {
          this._animate = !1;
        },
        _handleFrame: function() {
          rt = this._scope;
          var t = Date.now() / 1e3, e = this._last ? t - this._last : 0;
          this._last = t, this.emit("frame", new I({
            delta: e,
            time: this._time += e,
            count: this._count++
          })), this._stats && this._stats.update();
        },
        _animateItem: function(t, e) {
          var i = this._frameItems;
          e ? (i[t._id] = {
            item: t,
            time: 0,
            count: 0
          }, ++this._frameItemCount === 1 && this.on("frame", this._handleFrameItems)) : (delete i[t._id], --this._frameItemCount === 0 && this.off("frame", this._handleFrameItems));
        },
        _handleFrameItems: function(t) {
          for (var e in this._frameItems) {
            var i = this._frameItems[e];
            i.item.emit("frame", new I(t, {
              time: i.time += t.delta,
              count: i.count++
            }));
          }
        },
        _changed: function() {
          this._project._changed(4097), this._bounds = this._decomposed = B;
        },
        getElement: function() {
          return this._element;
        },
        getPixelRatio: function() {
          return this._pixelRatio;
        },
        getResolution: function() {
          return this._pixelRatio * 72;
        },
        getViewSize: function() {
          var t = this._viewSize;
          return new Wt(t.width, t.height, this, "setViewSize");
        },
        setViewSize: function() {
          var t = G.read(arguments), e = t.subtract(this._viewSize);
          e.isZero() || (this._setElementSize(t.width, t.height), this._viewSize.set(t), this._changed(), this.emit("resize", { size: t, delta: e }), this._autoUpdate && this.update());
        },
        _setElementSize: function(t, e) {
          var i = this._element;
          i && (i.width !== t && (i.width = t), i.height !== e && (i.height = e));
        },
        getBounds: function() {
          return this._bounds || (this._bounds = this._matrix.inverted()._transformBounds(
            new j(new L(), this._viewSize)
          )), this._bounds;
        },
        getSize: function() {
          return this.getBounds().getSize();
        },
        isVisible: function() {
          return vt.isInView(this._element);
        },
        isInserted: function() {
          return vt.isInserted(this._element);
        },
        getPixelSize: function(t) {
          var e = this._element, i;
          if (e) {
            var n = e.parentNode, r = tt.createElement("div");
            r.style.fontSize = t, n.appendChild(r), i = parseFloat(vt.getStyles(r).fontSize), n.removeChild(r);
          } else
            i = parseFloat(i);
          return i;
        },
        getTextWidth: function(t, e) {
          return 0;
        }
      },
      I.each(["rotate", "scale", "shear", "skew"], function(t) {
        var e = t === "rotate";
        this[t] = function() {
          var i = arguments, n = (e ? I : L).read(i), r = L.read(i, 0, { readNull: !0 });
          return this.transform(new ft()[t](
            n,
            r || this.getCenter(!0)
          ));
        };
      }, {
        _decompose: function() {
          return this._decomposed || (this._decomposed = this._matrix.decompose());
        },
        translate: function() {
          var t = new ft();
          return this.transform(t.translate.apply(t, arguments));
        },
        getCenter: function() {
          return this.getBounds().getCenter();
        },
        setCenter: function() {
          var t = L.read(arguments);
          this.translate(this.getCenter().subtract(t));
        },
        getZoom: function() {
          var t = this._decompose().scaling;
          return (t.x + t.y) / 2;
        },
        setZoom: function(t) {
          this.transform(new ft().scale(
            t / this.getZoom(),
            this.getCenter()
          ));
        },
        getRotation: function() {
          return this._decompose().rotation;
        },
        setRotation: function(t) {
          var e = this.getRotation();
          e != null && t != null && this.rotate(t - e);
        },
        getScaling: function() {
          var t = this._decompose().scaling;
          return new Dt(t.x, t.y, this, "setScaling");
        },
        setScaling: function() {
          var t = this.getScaling(), e = L.read(arguments, 0, { clone: !0, readNull: !0 });
          t && e && this.scale(e.x / t.x, e.y / t.y);
        },
        getMatrix: function() {
          return this._matrix;
        },
        setMatrix: function() {
          var t = this._matrix;
          t.set.apply(t, arguments);
        },
        transform: function(t) {
          this._matrix.append(t);
        },
        scrollBy: function() {
          this.translate(L.read(arguments).negate());
        }
      }),
      {
        projectToView: function() {
          return this._matrix._transformPoint(L.read(arguments));
        },
        viewToProject: function() {
          return this._matrix._inverseTransform(L.read(arguments));
        },
        getEventPoint: function(t) {
          return this.viewToProject(Ct.getOffset(t, this._element));
        }
      },
      {
        statics: {
          _views: [],
          _viewsById: {},
          _id: 0,
          create: function(t, e) {
            tt && typeof e == "string" && (e = tt.getElementById(e));
            var i = Y ? ye : pt;
            return new i(t, e);
          }
        }
      },
      new function() {
        if (!Y)
          return;
        var t, e, i = !1, n = !1;
        function r(M) {
          var O = Ct.getTarget(M);
          return O.getAttribute && pt._viewsById[O.getAttribute("id")];
        }
        function s() {
          var M = pt._focused;
          if (!M || !M.isVisible()) {
            for (var O = 0, A = pt._views.length; O < A; O++)
              if ((M = pt._views[O]).isVisible()) {
                pt._focused = e = M;
                break;
              }
          }
        }
        function o(M, O, A) {
          M._handleMouseEvent("mousemove", O, A);
        }
        var a = Y.navigator, h, u, _;
        a.pointerEnabled || a.msPointerEnabled ? (h = "pointerdown MSPointerDown", u = "pointermove MSPointerMove", _ = "pointerup pointercancel MSPointerUp MSPointerCancel") : (h = "touchstart", u = "touchmove", _ = "touchend touchcancel", "ontouchstart" in Y && a.userAgent.match(
          /mobile|tablet|ip(ad|hone|od)|android|silk/i
        ) || (h += " mousedown", u += " mousemove", _ += " mouseup"));
        var d = {}, c = {
          mouseout: function(M) {
            var O = pt._focused, A = Ct.getRelatedTarget(M);
            if (O && (!A || A.nodeName === "HTML")) {
              var k = Ct.getOffset(M, O._element), N = k.x, E = Math.abs, F = E(N), D = 1 << 25, V = F - D;
              k.x = E(V) < F ? V * (N < 0 ? -1 : 1) : N, o(O, M, O.viewToProject(k));
            }
          },
          scroll: s
        };
        d[h] = function(M) {
          var O = pt._focused = r(M);
          i || (i = !0, O._handleMouseEvent("mousedown", M));
        }, c[u] = function(M) {
          var O = pt._focused;
          if (!n) {
            var A = r(M);
            A ? O !== A && (O && o(O, M), t || (t = O), O = pt._focused = e = A) : e && e === O && (t && !t.isInserted() && (t = null), O = pt._focused = t, t = null, s());
          }
          O && o(O, M);
        }, c[h] = function() {
          n = !0;
        }, c[_] = function(M) {
          var O = pt._focused;
          O && i && O._handleMouseEvent("mouseup", M), n = i = !1;
        }, Ct.add(tt, c), Ct.add(Y, {
          load: s
        });
        var l = !1, v = !1, y = {
          doubleclick: "click",
          mousedrag: "mousemove"
        }, C = !1, p, m, f, g, w, S, x, b;
        function P(M, O, A, k, N, E, F) {
          var D = !1, V;
          function K(W, U) {
            if (W.responds(U)) {
              if (V || (V = new Ce(
                U,
                k,
                N,
                O || W,
                E ? N.subtract(E) : null
              )), W.emit(U, V) && (l = !0, V.prevented && (v = !0), V.stopped))
                return D = !0;
            } else {
              var Z = y[U];
              if (Z)
                return K(W, Z);
            }
          }
          for (; M && M !== F && !K(M, A); )
            M = M._parent;
          return D;
        }
        function T(M, O, A, k, N, E) {
          return M._project.removeOn(A), v = l = !1, w && P(
            w,
            null,
            A,
            k,
            N,
            E
          ) || O && O !== w && !O.isDescendant(w) && P(O, null, A === "mousedrag" ? "mousemove" : A, k, N, E, w) || P(
            M,
            w || O || M,
            A,
            k,
            N,
            E
          );
        }
        var z = {
          mousedown: {
            mousedown: 1,
            mousedrag: 1,
            click: 1,
            doubleclick: 1
          },
          mouseup: {
            mouseup: 1,
            mousedrag: 1,
            click: 1,
            doubleclick: 1
          },
          mousemove: {
            mousedrag: 1,
            mousemove: 1,
            mouseenter: 1,
            mouseleave: 1
          }
        };
        return {
          _viewEvents: d,
          _handleMouseEvent: function(M, O, A) {
            var k = this._itemEvents, N = k.native[M], E = M === "mousemove", F = this._scope.tool, D = this;
            function V(ut) {
              return k.virtual[ut] || D.responds(ut) || F && F.responds(ut);
            }
            E && i && V("mousedrag") && (M = "mousedrag"), A || (A = this.getEventPoint(O));
            var K = this.getBounds().contains(A), W = N && K && D._project.hitTest(A, {
              tolerance: 0,
              fill: !0,
              stroke: !0
            }), U = W && W.item || null, Z = !1, Q = {};
            if (Q[M.substr(5)] = !0, N && U !== g && (g && P(g, null, "mouseleave", O, A), U && P(U, null, "mouseenter", O, A), g = U), C ^ K && (P(
              this,
              null,
              K ? "mouseenter" : "mouseleave",
              O,
              A
            ), Z = !0), (K || Q.drag) && !A.equals(m) && (T(
              this,
              U,
              E ? M : "mousemove",
              O,
              A,
              m
            ), Z = !0), C = K, Q.down && K || Q.up && p) {
              if (T(this, U, M, O, A, p), Q.down) {
                if (b = U === S && Date.now() - x < 300, f = S = U, !v && U) {
                  for (var X = U; X && !X.responds("mousedrag"); )
                    X = X._parent;
                  X && (w = U);
                }
                p = A;
              } else
                Q.up && (!v && U === f && (x = Date.now(), T(this, U, b ? "doubleclick" : "click", O, A, p), b = !1), f = w = null);
              C = !1, Z = !0;
            }
            m = A, Z && F && (l = F._handleMouseEvent(M, O, A, Q) || l), O.cancelable !== !1 && (l && !Q.move || Q.down && V("mouseup")) && O.preventDefault();
          },
          _handleKeyEvent: function(M, O, A, k) {
            var N = this._scope, E = N.tool, F;
            function D(V) {
              V.responds(M) && (rt = N, V.emit(M, F = F || new Se(M, O, A, k)));
            }
            this.isVisible() && (D(this), E && E.responds(M) && D(E));
          },
          _countItemEvent: function(M, O) {
            var A = this._itemEvents, k = A.native, N = A.virtual;
            for (var E in z)
              k[E] = (k[E] || 0) + (z[E][M] || 0) * O;
            N[M] = (N[M] || 0) + O;
          },
          statics: {
            updateFocus: s,
            _resetState: function() {
              i = n = l = C = !1, t = e = p = m = f = g = w = S = x = b = null;
            }
          }
        };
      }()
    ), ye = pt.extend({
      _class: "CanvasView",
      initialize: function(e, i) {
        if (!(i instanceof Y.HTMLCanvasElement)) {
          var n = G.read(arguments, 1);
          if (n.isZero())
            throw new Error(
              "Cannot create CanvasView with the provided argument: " + I.slice(arguments, 1)
            );
          i = wt.getCanvas(n);
        }
        var r = this._context = i.getContext("2d");
        if (r.save(), this._pixelRatio = 1, !/^off|false$/.test(lt.getAttribute(i, "hidpi"))) {
          var s = Y.devicePixelRatio || 1, o = vt.getPrefixed(
            r,
            "backingStorePixelRatio"
          ) || 1;
          this._pixelRatio = s / o;
        }
        pt.call(this, e, i), this._needsUpdate = !0;
      },
      remove: function t() {
        return this._context.restore(), t.base.call(this);
      },
      _setElementSize: function t(e, i) {
        var n = this._pixelRatio;
        if (t.base.call(this, e * n, i * n), n !== 1) {
          var r = this._element, s = this._context;
          if (!lt.hasAttribute(r, "resize")) {
            var o = r.style;
            o.width = e + "px", o.height = i + "px";
          }
          s.restore(), s.save(), s.scale(n, n);
        }
      },
      getContext: function() {
        return this._context;
      },
      getPixelSize: function t(e) {
        var i = rt.agent, n;
        if (i && i.firefox)
          n = t.base.call(this, e);
        else {
          var r = this._context, s = r.font;
          r.font = e + " serif", n = parseFloat(r.font), r.font = s;
        }
        return n;
      },
      getTextWidth: function(t, e) {
        var i = this._context, n = i.font, r = 0;
        i.font = t;
        for (var s = 0, o = e.length; s < o; s++)
          r = Math.max(r, i.measureText(e[s]).width);
        return i.font = n, r;
      },
      update: function() {
        if (!this._needsUpdate)
          return !1;
        var t = this._project, e = this._context, i = this._viewSize;
        return e.clearRect(0, 0, i.width + 1, i.height + 1), t && t.draw(e, this._matrix, this._pixelRatio), this._needsUpdate = !1, !0;
      }
    }), te = I.extend({
      _class: "Event",
      initialize: function(e) {
        this.event = e, this.type = e && e.type;
      },
      prevented: !1,
      stopped: !1,
      preventDefault: function() {
        this.prevented = !0, this.event.preventDefault();
      },
      stopPropagation: function() {
        this.stopped = !0, this.event.stopPropagation();
      },
      stop: function() {
        this.stopPropagation(), this.preventDefault();
      },
      getTimeStamp: function() {
        return this.event.timeStamp;
      },
      getModifiers: function() {
        return ue.modifiers;
      }
    }), Se = te.extend({
      _class: "KeyEvent",
      initialize: function(e, i, n, r) {
        this.type = e, this.event = i, this.key = n, this.character = r;
      },
      toString: function() {
        return "{ type: '" + this.type + "', key: '" + this.key + "', character: '" + this.character + "', modifiers: " + this.getModifiers() + " }";
      }
    }), ue = new function() {
      var t = {
        "	": "tab",
        " ": "space",
        "\b": "backspace",
        "": "delete",
        Spacebar: "space",
        Del: "delete",
        Win: "meta",
        Esc: "escape"
      }, e = {
        tab: "	",
        space: " ",
        enter: "\r"
      }, i = {}, n = {}, r, s, o = new I({
        shift: !1,
        control: !1,
        alt: !1,
        meta: !1,
        capsLock: !1,
        space: !1
      }).inject({
        option: {
          get: function() {
            return this.alt;
          }
        },
        command: {
          get: function() {
            var u = rt && rt.agent;
            return u && u.mac ? this.meta : this.control;
          }
        }
      });
      function a(u) {
        var _ = u.key || u.keyIdentifier;
        return _ = /^U\+/.test(_) ? String.fromCharCode(parseInt(_.substr(2), 16)) : /^Arrow[A-Z]/.test(_) ? _.substr(5) : _ === "Unidentified" || _ === B ? String.fromCharCode(u.keyCode) : _, t[_] || (_.length > 1 ? I.hyphenate(_) : _.toLowerCase());
      }
      function h(u, _, d, c) {
        var l = pt._focused, v;
        if (i[_] = u, u ? n[_] = d : delete n[_], _.length > 1 && (v = I.camelize(_)) in o) {
          o[v] = u;
          var y = rt && rt.agent;
          if (v === "meta" && y && y.mac)
            if (u)
              r = {};
            else {
              for (var C in r)
                C in n && h(!1, C, r[C], c);
              r = null;
            }
        } else
          u && r && (r[_] = d);
        l && l._handleKeyEvent(
          u ? "keydown" : "keyup",
          c,
          _,
          d
        );
      }
      return Ct.add(tt, {
        keydown: function(u) {
          var _ = a(u), d = rt && rt.agent;
          _.length > 1 || d && d.chrome && (u.altKey || d.mac && u.metaKey || !d.mac && u.ctrlKey) ? h(
            !0,
            _,
            e[_] || (_.length > 1 ? "" : _),
            u
          ) : s = _;
        },
        keypress: function(u) {
          if (s) {
            var _ = a(u), d = u.charCode, c = d >= 32 ? String.fromCharCode(d) : _.length > 1 ? "" : _;
            _ !== s && (_ = c.toLowerCase()), h(!0, _, c, u), s = null;
          }
        },
        keyup: function(u) {
          var _ = a(u);
          _ in n && h(!1, _, n[_], u);
        }
      }), Ct.add(Y, {
        blur: function(u) {
          for (var _ in n)
            h(!1, _, n[_], u);
        }
      }), {
        modifiers: o,
        isDown: function(u) {
          return !!i[u];
        }
      };
    }(), Ce = te.extend({
      _class: "MouseEvent",
      initialize: function(e, i, n, r, s) {
        this.type = e, this.event = i, this.point = n, this.target = r, this.delta = s;
      },
      toString: function() {
        return "{ type: '" + this.type + "', point: " + this.point + ", target: " + this.target + (this.delta ? ", delta: " + this.delta : "") + ", modifiers: " + this.getModifiers() + " }";
      }
    }), xe = te.extend({
      _class: "ToolEvent",
      _item: null,
      initialize: function(e, i, n) {
        this.tool = e, this.type = i, this.event = n;
      },
      _choosePoint: function(t, e) {
        return t || (e ? e.clone() : null);
      },
      getPoint: function() {
        return this._choosePoint(this._point, this.tool._point);
      },
      setPoint: function(t) {
        this._point = t;
      },
      getLastPoint: function() {
        return this._choosePoint(this._lastPoint, this.tool._lastPoint);
      },
      setLastPoint: function(t) {
        this._lastPoint = t;
      },
      getDownPoint: function() {
        return this._choosePoint(this._downPoint, this.tool._downPoint);
      },
      setDownPoint: function(t) {
        this._downPoint = t;
      },
      getMiddlePoint: function() {
        return !this._middlePoint && this.tool._lastPoint ? this.tool._point.add(this.tool._lastPoint).divide(2) : this._middlePoint;
      },
      setMiddlePoint: function(t) {
        this._middlePoint = t;
      },
      getDelta: function() {
        return !this._delta && this.tool._lastPoint ? this.tool._point.subtract(this.tool._lastPoint) : this._delta;
      },
      setDelta: function(t) {
        this._delta = t;
      },
      getCount: function() {
        return this.tool[/^mouse(down|up)$/.test(this.type) ? "_downCount" : "_moveCount"];
      },
      setCount: function(t) {
        this.tool[/^mouse(down|up)$/.test(this.type) ? "downCount" : "count"] = t;
      },
      getItem: function() {
        if (!this._item) {
          var t = this.tool._scope.project.hitTest(this.getPoint());
          if (t) {
            for (var e = t.item, i = e._parent; /^(Group|CompoundPath)$/.test(i._class); )
              e = i, i = i._parent;
            this._item = e;
          }
        }
        return this._item;
      },
      setItem: function(t) {
        this._item = t;
      },
      toString: function() {
        return "{ type: " + this.type + ", point: " + this.getPoint() + ", count: " + this.getCount() + ", modifiers: " + this.getModifiers() + " }";
      }
    });
    _t.extend({
      _class: "Tool",
      _list: "tools",
      _reference: "tool",
      _events: [
        "onMouseDown",
        "onMouseUp",
        "onMouseDrag",
        "onMouseMove",
        "onActivate",
        "onDeactivate",
        "onEditOptions",
        "onKeyDown",
        "onKeyUp"
      ],
      initialize: function(e) {
        _t.call(this), this._moveCount = -1, this._downCount = -1, this.set(e);
      },
      getMinDistance: function() {
        return this._minDistance;
      },
      setMinDistance: function(t) {
        this._minDistance = t, t != null && this._maxDistance != null && t > this._maxDistance && (this._maxDistance = t);
      },
      getMaxDistance: function() {
        return this._maxDistance;
      },
      setMaxDistance: function(t) {
        this._maxDistance = t, this._minDistance != null && t != null && t < this._minDistance && (this._minDistance = t);
      },
      getFixedDistance: function() {
        return this._minDistance == this._maxDistance ? this._minDistance : null;
      },
      setFixedDistance: function(t) {
        this._minDistance = this._maxDistance = t;
      },
      _handleMouseEvent: function(t, e, i, n) {
        rt = this._scope, n.drag && !this.responds(t) && (t = "mousemove");
        var r = n.move || n.drag, s = this.responds(t), o = !1, a = this;
        function h(_, d) {
          var c = i, l = r ? a._point : a._downPoint || c;
          if (r) {
            if (a._moveCount >= 0 && c.equals(l))
              return !1;
            if (l && (_ != null || d != null)) {
              var v = c.subtract(l), y = v.getLength();
              if (y < (_ || 0))
                return !1;
              d && (c = l.add(v.normalize(
                Math.min(y, d)
              )));
            }
            a._moveCount++;
          }
          return a._point = c, a._lastPoint = l || c, n.down && (a._moveCount = -1, a._downPoint = c, a._downCount++), !0;
        }
        function u() {
          s && (o = a.emit(t, new xe(a, t, e)) || o);
        }
        if (n.down)
          h(), u();
        else if (n.up)
          h(null, this._maxDistance), u();
        else if (s)
          for (; h(this._minDistance, this._maxDistance); )
            u();
        return o;
      }
    });
    var be = I.extend(gt, {
      _class: "Tween",
      statics: {
        easings: new I({
          linear: function(t) {
            return t;
          },
          easeInQuad: function(t) {
            return t * t;
          },
          easeOutQuad: function(t) {
            return t * (2 - t);
          },
          easeInOutQuad: function(t) {
            return t < 0.5 ? 2 * t * t : -1 + 2 * (2 - t) * t;
          },
          easeInCubic: function(t) {
            return t * t * t;
          },
          easeOutCubic: function(t) {
            return --t * t * t + 1;
          },
          easeInOutCubic: function(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
          },
          easeInQuart: function(t) {
            return t * t * t * t;
          },
          easeOutQuart: function(t) {
            return 1 - --t * t * t * t;
          },
          easeInOutQuart: function(t) {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
          },
          easeInQuint: function(t) {
            return t * t * t * t * t;
          },
          easeOutQuint: function(t) {
            return 1 + --t * t * t * t * t;
          },
          easeInOutQuint: function(t) {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
          }
        })
      },
      initialize: function t(e, i, n, r, s, o) {
        this.object = e;
        var a = typeof s, h = a === "function";
        this.type = h ? a : a === "string" ? s : "linear", this.easing = h ? s : t.easings[this.type], this.duration = r, this.running = !1, this._then = null, this._startTime = null;
        var u = i || n;
        this._keys = u ? Object.keys(u) : [], this._parsedKeys = this._parseKeys(this._keys), this._from = u && this._getState(i), this._to = u && this._getState(n), o !== !1 && this.start();
      },
      then: function(t) {
        return this._then = t, this;
      },
      start: function() {
        return this._startTime = null, this.running = !0, this;
      },
      stop: function() {
        return this.running = !1, this;
      },
      update: function(t) {
        if (this.running) {
          t >= 1 && (t = 1, this.running = !1);
          for (var e = this.easing(t), i = this._keys, n = function(_) {
            return typeof _ == "function" ? _(e, t) : _;
          }, r = 0, s = i && i.length; r < s; r++) {
            var o = i[r], a = n(this._from[o]), h = n(this._to[o]), u = a && h && a.__add && h.__add ? h.__subtract(a).__multiply(e).__add(a) : (h - a) * e + a;
            this._setProperty(this._parsedKeys[o], u);
          }
          this.responds("update") && this.emit("update", new I({
            progress: t,
            factor: e
          })), !this.running && this._then && this._then(this.object);
        }
        return this;
      },
      _events: {
        onUpdate: {}
      },
      _handleFrame: function(t) {
        var e = this._startTime, i = e ? (t - e) / this.duration : 0;
        e || (this._startTime = t), this.update(i);
      },
      _getState: function(t) {
        for (var e = this._keys, i = {}, n = 0, r = e.length; n < r; n++) {
          var s = e[n], o = this._parsedKeys[s], a = this._getProperty(o), h;
          if (t) {
            var u = this._resolveValue(a, t[s]);
            this._setProperty(o, u), h = this._getProperty(o), h = h && h.clone ? h.clone() : h, this._setProperty(o, a);
          } else
            h = a && a.clone ? a.clone() : a;
          i[s] = h;
        }
        return i;
      },
      _resolveValue: function(t, e) {
        if (e) {
          if (Array.isArray(e) && e.length === 2) {
            var i = e[0];
            return i && i.match && i.match(/^[+\-\*\/]=/) ? this._calculate(t, i[0], e[1]) : e;
          } else if (typeof e == "string") {
            var n = e.match(/^[+\-*/]=(.*)/);
            if (n) {
              var r = JSON.parse(n[1].replace(
                /(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
                '"$2": '
              ));
              return this._calculate(t, e[0], r);
            }
          }
        }
        return e;
      },
      _calculate: function(t, e, i) {
        return rt.PaperScript.calculateBinary(t, e, i);
      },
      _parseKeys: function(t) {
        for (var e = {}, i = 0, n = t.length; i < n; i++) {
          var r = t[i], s = r.replace(/\.([^.]*)/g, "/$1").replace(/\[['"]?([^'"\]]*)['"]?\]/g, "/$1");
          e[r] = s.split("/");
        }
        return e;
      },
      _getProperty: function(t, e) {
        for (var i = this.object, n = 0, r = t.length - (e || 0); n < r && i; n++)
          i = i[t[n]];
        return i;
      },
      _setProperty: function(t, e) {
        var i = this._getProperty(t, 1);
        i && (i[t[t.length - 1]] = e);
      }
    }), Pe = {
      request: function(t) {
        var e = new H.XMLHttpRequest();
        return e.open(
          (t.method || "get").toUpperCase(),
          t.url,
          I.pick(t.async, !0)
        ), t.mimeType && e.overrideMimeType(t.mimeType), e.onload = function() {
          var i = e.status;
          i === 0 || i === 200 ? t.onLoad && t.onLoad.call(e, e.responseText) : e.onerror();
        }, e.onerror = function() {
          var i = e.status, n = 'Could not load "' + t.url + '" (Status: ' + i + ")";
          if (t.onError)
            t.onError(n, i);
          else
            throw new Error(n);
        }, e.send(null);
      }
    }, wt = I.exports.CanvasProvider = {
      canvases: [],
      getCanvas: function(t, e, i) {
        if (!Y)
          return null;
        var n, r = !0;
        typeof t == "object" && (e = t.height, t = t.width), this.canvases.length ? n = this.canvases.pop() : (n = tt.createElement("canvas"), r = !1);
        var s = n.getContext("2d", i || {});
        if (!s)
          throw new Error("Canvas " + n + " is unable to provide a 2D context.");
        return n.width === t && n.height === e ? r && s.clearRect(0, 0, t + 1, e + 1) : (n.width = t, n.height = e), s.save(), n;
      },
      getContext: function(t, e, i) {
        var n = this.getCanvas(t, e, i);
        return n ? n.getContext("2d", i || {}) : null;
      },
      release: function(t) {
        var e = t && t.canvas ? t.canvas : t;
        e && e.getContext && (e.getContext("2d").restore(), this.canvases.push(e));
      }
    }, oe = new function() {
      var t = Math.min, e = Math.max, i = Math.abs, n, r, s, o, a, h, u, _, d, c, l;
      function v(w, S, x) {
        return 0.2989 * w + 0.587 * S + 0.114 * x;
      }
      function y(w, S, x, T) {
        var P = T - v(w, S, x);
        d = w + P, c = S + P, l = x + P;
        var T = v(d, c, l), z = t(d, c, l), M = e(d, c, l);
        if (z < 0) {
          var O = T - z;
          d = T + (d - T) * T / O, c = T + (c - T) * T / O, l = T + (l - T) * T / O;
        }
        if (M > 255) {
          var A = 255 - T, k = M - T;
          d = T + (d - T) * A / k, c = T + (c - T) * A / k, l = T + (l - T) * A / k;
        }
      }
      function C(w, S, x) {
        return e(w, S, x) - t(w, S, x);
      }
      function p(w, S, x, b) {
        var P = [w, S, x], T = e(w, S, x), z = t(w, S, x), M;
        z = z === w ? 0 : z === S ? 1 : 2, T = T === w ? 0 : T === S ? 1 : 2, M = t(z, T) === 0 ? e(z, T) === 1 ? 2 : 1 : 0, P[T] > P[z] ? (P[M] = (P[M] - P[z]) * b / (P[T] - P[z]), P[T] = b) : P[M] = P[T] = 0, P[z] = 0, d = P[0], c = P[1], l = P[2];
      }
      var m = {
        multiply: function() {
          d = a * n / 255, c = h * r / 255, l = u * s / 255;
        },
        screen: function() {
          d = a + n - a * n / 255, c = h + r - h * r / 255, l = u + s - u * s / 255;
        },
        overlay: function() {
          d = a < 128 ? 2 * a * n / 255 : 255 - 2 * (255 - a) * (255 - n) / 255, c = h < 128 ? 2 * h * r / 255 : 255 - 2 * (255 - h) * (255 - r) / 255, l = u < 128 ? 2 * u * s / 255 : 255 - 2 * (255 - u) * (255 - s) / 255;
        },
        "soft-light": function() {
          var w = n * a / 255;
          d = w + a * (255 - (255 - a) * (255 - n) / 255 - w) / 255, w = r * h / 255, c = w + h * (255 - (255 - h) * (255 - r) / 255 - w) / 255, w = s * u / 255, l = w + u * (255 - (255 - u) * (255 - s) / 255 - w) / 255;
        },
        "hard-light": function() {
          d = n < 128 ? 2 * n * a / 255 : 255 - 2 * (255 - n) * (255 - a) / 255, c = r < 128 ? 2 * r * h / 255 : 255 - 2 * (255 - r) * (255 - h) / 255, l = s < 128 ? 2 * s * u / 255 : 255 - 2 * (255 - s) * (255 - u) / 255;
        },
        "color-dodge": function() {
          d = a === 0 ? 0 : n === 255 ? 255 : t(255, 255 * a / (255 - n)), c = h === 0 ? 0 : r === 255 ? 255 : t(255, 255 * h / (255 - r)), l = u === 0 ? 0 : s === 255 ? 255 : t(255, 255 * u / (255 - s));
        },
        "color-burn": function() {
          d = a === 255 ? 255 : n === 0 ? 0 : e(0, 255 - (255 - a) * 255 / n), c = h === 255 ? 255 : r === 0 ? 0 : e(0, 255 - (255 - h) * 255 / r), l = u === 255 ? 255 : s === 0 ? 0 : e(0, 255 - (255 - u) * 255 / s);
        },
        darken: function() {
          d = a < n ? a : n, c = h < r ? h : r, l = u < s ? u : s;
        },
        lighten: function() {
          d = a > n ? a : n, c = h > r ? h : r, l = u > s ? u : s;
        },
        difference: function() {
          d = a - n, d < 0 && (d = -d), c = h - r, c < 0 && (c = -c), l = u - s, l < 0 && (l = -l);
        },
        exclusion: function() {
          d = a + n * (255 - a - a) / 255, c = h + r * (255 - h - h) / 255, l = u + s * (255 - u - u) / 255;
        },
        hue: function() {
          p(n, r, s, C(a, h, u)), y(d, c, l, v(a, h, u));
        },
        saturation: function() {
          p(a, h, u, C(n, r, s)), y(d, c, l, v(a, h, u));
        },
        luminosity: function() {
          y(a, h, u, v(n, r, s));
        },
        color: function() {
          y(n, r, s, v(a, h, u));
        },
        add: function() {
          d = t(a + n, 255), c = t(h + r, 255), l = t(u + s, 255);
        },
        subtract: function() {
          d = e(a - n, 0), c = e(h - r, 0), l = e(u - s, 0);
        },
        average: function() {
          d = (a + n) / 2, c = (h + r) / 2, l = (u + s) / 2;
        },
        negation: function() {
          d = 255 - i(255 - n - a), c = 255 - i(255 - r - h), l = 255 - i(255 - s - u);
        }
      }, f = this.nativeModes = I.each([
        "source-over",
        "source-in",
        "source-out",
        "source-atop",
        "destination-over",
        "destination-in",
        "destination-out",
        "destination-atop",
        "lighter",
        "darker",
        "copy",
        "xor"
      ], function(w) {
        this[w] = !0;
      }, {}), g = wt.getContext(1, 1, { willReadFrequently: !0 });
      g && (I.each(m, function(w, S) {
        var x = S === "darken", b = !1;
        g.save();
        try {
          g.fillStyle = x ? "#300" : "#a00", g.fillRect(0, 0, 1, 1), g.globalCompositeOperation = S, g.globalCompositeOperation === S && (g.fillStyle = x ? "#a00" : "#300", g.fillRect(0, 0, 1, 1), b = g.getImageData(0, 0, 1, 1).data[0] !== x ? 170 : 51);
        } catch {
        }
        g.restore(), f[S] = b;
      }), wt.release(g)), this.process = function(w, S, x, b, P) {
        var T = S.canvas, z = w === "normal";
        if (z || f[w])
          x.save(), x.setTransform(1, 0, 0, 1, 0, 0), x.globalAlpha = b, z || (x.globalCompositeOperation = w), x.drawImage(T, P.x, P.y), x.restore();
        else {
          var M = m[w];
          if (!M)
            return;
          for (var O = x.getImageData(
            P.x,
            P.y,
            T.width,
            T.height
          ), A = O.data, k = S.getImageData(
            0,
            0,
            T.width,
            T.height
          ).data, N = 0, E = A.length; N < E; N += 4) {
            n = k[N], a = A[N], r = k[N + 1], h = A[N + 1], s = k[N + 2], u = A[N + 2], o = k[N + 3], _ = A[N + 3], M();
            var F = o * b / 255, D = 1 - F;
            A[N] = F * d + D * a, A[N + 1] = F * c + D * h, A[N + 2] = F * l + D * u, A[N + 3] = o * b + D * _;
          }
          x.putImageData(O, P.x, P.y);
        }
      };
    }(), mt = new function() {
      var t = "http://www.w3.org/2000/svg", e = "http://www.w3.org/2000/xmlns", i = "http://www.w3.org/1999/xlink", n = {
        href: i,
        xlink: e,
        xmlns: e + "/",
        "xmlns:xlink": e + "/"
      };
      function r(a, h, u) {
        return o(tt.createElementNS(t, a), h, u);
      }
      function s(a, h) {
        var u = n[h], _ = u ? a.getAttributeNS(u, h) : a.getAttribute(h);
        return _ === "null" ? null : _;
      }
      function o(a, h, u) {
        for (var _ in h) {
          var d = h[_], c = n[_];
          typeof d == "number" && u && (d = u.number(d)), c ? a.setAttributeNS(c, _, d) : a.setAttribute(_, d);
        }
        return a;
      }
      return {
        svg: t,
        xmlns: e,
        xlink: i,
        create: r,
        get: s,
        set: o
      };
    }(), le = I.each({
      fillColor: ["fill", "color"],
      fillRule: ["fill-rule", "string"],
      strokeColor: ["stroke", "color"],
      strokeWidth: ["stroke-width", "number"],
      strokeCap: ["stroke-linecap", "string"],
      strokeJoin: ["stroke-linejoin", "string"],
      strokeScaling: ["vector-effect", "lookup", {
        true: "none",
        false: "non-scaling-stroke"
      }, function(t, e) {
        return !e && (t instanceof Ut || t instanceof zt || t instanceof Qt);
      }],
      miterLimit: ["stroke-miterlimit", "number"],
      dashArray: ["stroke-dasharray", "array"],
      dashOffset: ["stroke-dashoffset", "number"],
      fontFamily: ["font-family", "string"],
      fontWeight: ["font-weight", "string"],
      fontSize: ["font-size", "number"],
      justification: ["text-anchor", "lookup", {
        left: "start",
        center: "middle",
        right: "end"
      }],
      opacity: ["opacity", "number"],
      blendMode: ["mix-blend-mode", "style"]
    }, function(t, e) {
      var i = I.capitalize(e), n = t[2];
      this[e] = {
        type: t[1],
        property: e,
        attribute: t[0],
        toSVG: n,
        fromSVG: n && I.each(n, function(r, s) {
          this[r] = s;
        }, {}),
        exportFilter: t[3],
        get: "get" + i,
        set: "set" + i
      };
    }, {});
    new function() {
      var t;
      function e(m, f, g) {
        var w = new I(), S = m.getTranslation();
        if (f) {
          var x;
          m.isInvertible() ? (m = m._shiftless(), x = m._inverseTransform(S), S = null) : x = new L(), w[g ? "cx" : "x"] = x.x, w[g ? "cy" : "y"] = x.y;
        }
        if (!m.isIdentity()) {
          var b = m.decompose();
          if (b) {
            var P = [], T = b.rotation, z = b.scaling, M = b.skewing;
            S && !S.isZero() && P.push("translate(" + t.point(S) + ")"), T && P.push("rotate(" + t.number(T) + ")"), (!et.isZero(z.x - 1) || !et.isZero(z.y - 1)) && P.push("scale(" + t.point(z) + ")"), M.x && P.push("skewX(" + t.number(M.x) + ")"), M.y && P.push("skewY(" + t.number(M.y) + ")"), w.transform = P.join(" ");
          } else
            w.transform = "matrix(" + m.getValues().join(",") + ")";
        }
        return w;
      }
      function i(m, f) {
        for (var g = e(m._matrix), w = m._children, S = mt.create("g", g, t), x = 0, b = w.length; x < b; x++) {
          var P = w[x], T = C(P, f);
          if (T)
            if (P.isClipMask()) {
              var z = mt.create("clipPath");
              z.appendChild(T), v(P, z, "clip"), mt.set(S, {
                "clip-path": "url(#" + z.id + ")"
              });
            } else
              S.appendChild(T);
        }
        return S;
      }
      function n(m, f) {
        var g = e(m._matrix, !0), w = m.getSize(), S = m.getImage();
        return g.x -= w.width / 2, g.y -= w.height / 2, g.width = w.width, g.height = w.height, g.href = f.embedImages == !1 && S && S.src || m.toDataURL(), mt.create("image", g, t);
      }
      function r(m, f) {
        var g = f.matchShapes;
        if (g) {
          var w = m.toShape(!1);
          if (w)
            return s(w);
        }
        var S = m._segments, x = S.length, b, P = e(m._matrix);
        if (g && x >= 2 && !m.hasHandles())
          if (x > 2) {
            b = m._closed ? "polygon" : "polyline";
            for (var T = [], z = 0; z < x; z++)
              T.push(t.point(S[z]._point));
            P.points = T.join(" ");
          } else {
            b = "line";
            var M = S[0]._point, O = S[1]._point;
            P.set({
              x1: M.x,
              y1: M.y,
              x2: O.x,
              y2: O.y
            });
          }
        else
          b = "path", P.d = m.getPathData(null, f.precision);
        return mt.create(b, P, t);
      }
      function s(m) {
        var f = m._type, g = m._radius, w = e(m._matrix, !0, f !== "rectangle");
        if (f === "rectangle") {
          f = "rect";
          var S = m._size, x = S.width, b = S.height;
          w.x -= x / 2, w.y -= b / 2, w.width = x, w.height = b, g.isZero() && (g = null);
        }
        return g && (f === "circle" ? w.r = g : (w.rx = g.width, w.ry = g.height)), mt.create(f, w, t);
      }
      function o(m, f) {
        var g = e(m._matrix), w = m.getPathData(null, f.precision);
        return w && (g.d = w), mt.create("path", g, t);
      }
      function a(m, f) {
        var g = e(m._matrix, !0), w = m._definition, S = l(w, "symbol"), x = w._item, b = x.getStrokeBounds();
        return S || (S = mt.create("symbol", {
          viewBox: t.rectangle(b)
        }), S.appendChild(C(x, f)), v(w, S, "symbol")), g.href = "#" + S.id, g.x += b.x, g.y += b.y, g.width = b.width, g.height = b.height, g.overflow = "visible", mt.create("use", g, t);
      }
      function h(m) {
        var f = l(m, "color");
        if (!f) {
          var g = m.getGradient(), w = g._radial, S = m.getOrigin(), x = m.getDestination(), b;
          if (w) {
            b = {
              cx: S.x,
              cy: S.y,
              r: S.getDistance(x)
            };
            var P = m.getHighlight();
            P && (b.fx = P.x, b.fy = P.y);
          } else
            b = {
              x1: S.x,
              y1: S.y,
              x2: x.x,
              y2: x.y
            };
          b.gradientUnits = "userSpaceOnUse", f = mt.create((w ? "radial" : "linear") + "Gradient", b, t);
          for (var T = g._stops, z = 0, M = T.length; z < M; z++) {
            var O = T[z], A = O._color, k = A.getAlpha(), N = O._offset;
            b = {
              offset: N ?? z / (M - 1)
            }, A && (b["stop-color"] = A.toCSS(!0)), k < 1 && (b["stop-opacity"] = k), f.appendChild(
              mt.create("stop", b, t)
            );
          }
          v(m, f, "color");
        }
        return "url(#" + f.id + ")";
      }
      function u(m) {
        var f = mt.create(
          "text",
          e(m._matrix, !0),
          t
        );
        return f.textContent = m._content, f;
      }
      var _ = {
        Group: i,
        Layer: i,
        Raster: n,
        Path: r,
        Shape: s,
        CompoundPath: o,
        SymbolItem: a,
        PointText: u
      };
      function d(m, f, g, w) {
        var S = {}, x = !w && m.getParent(), b = [];
        return m._name != null && (S.id = m._name), I.each(le, function(P) {
          var T = P.get, z = P.type, M = m[T]();
          if (P.exportFilter ? P.exportFilter(m, M) : g.reduceAttributes == !1 || !x || !I.equals(x[T](), M)) {
            if (z === "color" && M != null) {
              var O = M.getAlpha();
              O < 1 && (S[P.attribute + "-opacity"] = O);
            }
            z === "style" ? b.push(P.attribute + ": " + M) : S[P.attribute] = M == null ? "none" : z === "color" ? M.gradient ? h(M) : M.toCSS(!0) : z === "array" ? M.join(",") : z === "lookup" ? P.toSVG[M] : M;
          }
        }), b.length && (S.style = b.join(";")), S.opacity === 1 && delete S.opacity, m._visible || (S.visibility = "hidden"), mt.set(f, S, t);
      }
      var c;
      function l(m, f) {
        return c || (c = { ids: {}, svgs: {} }), m && c.svgs[f + "-" + (m._id || m.__id || (m.__id = Ht.get("svg")))];
      }
      function v(m, f, g) {
        c || l();
        var w = c.ids[g] = (c.ids[g] || 0) + 1;
        f.id = g + "-" + w, c.svgs[g + "-" + (m._id || m.__id)] = f;
      }
      function y(m, f) {
        var g = m, w = null;
        if (c) {
          g = m.nodeName.toLowerCase() === "svg" && m;
          for (var S in c.svgs)
            w || (g || (g = mt.create("svg"), g.appendChild(m)), w = g.insertBefore(
              mt.create("defs"),
              g.firstChild
            )), w.appendChild(c.svgs[S]);
          c = null;
        }
        return f.asString ? new H.XMLSerializer().serializeToString(g) : g;
      }
      function C(m, f, g) {
        var w = _[m._class], S = w && w(m, f);
        if (S) {
          var x = f.onExport;
          x && (S = x(m, S, f) || S);
          var b = JSON.stringify(m._data);
          b && b !== "{}" && b !== "null" && S.setAttribute("data-paper-data", b);
        }
        return S && d(m, S, f, g);
      }
      function p(m) {
        return m || (m = {}), t = new ht(m.precision), m;
      }
      $.inject({
        exportSVG: function(m) {
          return m = p(m), y(C(this, m, !0), m);
        }
      }), Yt.inject({
        exportSVG: function(m) {
          m = p(m);
          var f = this._children, g = this.getView(), w = I.pick(m.bounds, "view"), S = m.matrix || w === "view" && g._matrix, x = S && ft.read([S]), b = w === "view" ? new j([0, 0], g.getViewSize()) : w === "content" ? $._getBounds(f, x, { stroke: !0 }).rect : j.read([w], 0, { readNull: !0 }), P = {
            version: "1.1",
            xmlns: mt.svg,
            "xmlns:xlink": mt.xlink
          };
          b && (P.width = b.width, P.height = b.height, (b.x || b.x === 0 || b.y || b.y === 0) && (P.viewBox = t.rectangle(b)));
          var T = mt.create("svg", P, t), z = T;
          x && !x.isIdentity() && (z = T.appendChild(mt.create(
            "g",
            e(x),
            t
          )));
          for (var M = 0, O = f.length; M < O; M++)
            z.appendChild(C(f[M], m, !0));
          return y(T, m);
        }
      });
    }(), new function() {
      var t = {}, e;
      function i(f, g, w, S, x, b) {
        var P = mt.get(f, g) || b, T = P == null ? S ? null : w ? "" : 0 : w ? P : parseFloat(P);
        return /%\s*$/.test(P) ? T / 100 * (x ? 1 : e[/x|^width/.test(g) ? "width" : "height"]) : T;
      }
      function n(f, g, w, S, x, b, P) {
        return g = i(f, g || "x", !1, S, x, b), w = i(f, w || "y", !1, S, x, P), S && (g == null || w == null) ? null : new L(g, w);
      }
      function r(f, g, w, S, x) {
        return g = i(f, g || "width", !1, S, x), w = i(f, w || "height", !1, S, x), S && (g == null || w == null) ? null : new G(g, w);
      }
      function s(f, g, w) {
        return f === "none" ? null : g === "number" ? parseFloat(f) : g === "array" ? f ? f.split(/[\s,]+/g).map(parseFloat) : [] : g === "color" ? C(f) || f : g === "lookup" ? w[f] : f;
      }
      function o(f, g, w, S) {
        var x = f.childNodes, b = g === "clippath", P = g === "defs", T = new Bt(), z = T._project, M = z._currentStyle, O = [];
        if (!b && !P && (T = y(T, f, S), z._currentStyle = T._style.clone()), S)
          for (var A = f.querySelectorAll("defs"), k = 0, N = A.length; k < N; k++)
            p(A[k], w, !1);
        for (var k = 0, N = x.length; k < N; k++) {
          var E = x[k], F;
          E.nodeType === 1 && !/^defs$/i.test(E.nodeName) && (F = p(E, w, !1)) && !(F instanceof Rt) && O.push(F);
        }
        return T.addChildren(O), b && (T = y(T.reduce(), f, S)), z._currentStyle = M, (b || P) && (T.remove(), T = null), T;
      }
      function a(f, g) {
        for (var w = f.getAttribute("points").match(
          /[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g
        ), S = [], x = 0, b = w.length; x < b; x += 2)
          S.push(new L(
            parseFloat(w[x]),
            parseFloat(w[x + 1])
          ));
        var P = new ot(S);
        return g === "polygon" && P.closePath(), P;
      }
      function h(f) {
        return Ut.create(f.getAttribute("d"));
      }
      function u(f, g) {
        var w = (i(f, "href", !0) || "").substring(1), S = g === "radialgradient", x;
        if (w)
          x = t[w].getGradient(), x._radial ^ S && (x = x.clone(), x._radial = S);
        else {
          for (var b = f.childNodes, P = [], T = 0, z = b.length; T < z; T++) {
            var M = b[T];
            M.nodeType === 1 && P.push(y(new se(), M));
          }
          x = new $t(P, S);
        }
        var O, A, k, N = i(f, "gradientUnits", !0) !== "userSpaceOnUse";
        S ? (O = n(
          f,
          "cx",
          "cy",
          !1,
          N,
          "50%",
          "50%"
        ), A = O.add(
          i(f, "r", !1, !1, N, "50%"),
          0
        ), k = n(f, "fx", "fy", !0, N)) : (O = n(
          f,
          "x1",
          "y1",
          !1,
          N,
          "0%",
          "0%"
        ), A = n(
          f,
          "x2",
          "y2",
          !1,
          N,
          "100%",
          "0%"
        ));
        var E = y(
          new St(x, O, A, k),
          f
        );
        return E._scaleToBounds = N, null;
      }
      var _ = {
        "#document": function(f, g, w, S) {
          for (var x = f.childNodes, b = 0, P = x.length; b < P; b++) {
            var T = x[b];
            if (T.nodeType === 1)
              return p(T, w, S);
          }
        },
        g: o,
        svg: o,
        clippath: o,
        polygon: a,
        polyline: a,
        path: h,
        lineargradient: u,
        radialgradient: u,
        image: function(f) {
          var g = new Xt(i(f, "href", !0));
          return g.on("load", function() {
            var w = r(f);
            this.setSize(w);
            var S = n(f).add(w.divide(2));
            this._matrix.append(new ft().translate(S));
          }), g;
        },
        symbol: function(f, g, w, S) {
          return new Rt(
            o(f, g, w, S),
            !0
          );
        },
        defs: o,
        use: function(f) {
          var g = (i(f, "href", !0) || "").substring(1), w = t[g], S = n(f);
          return w ? w instanceof Rt ? w.place(S) : w.clone().translate(S) : null;
        },
        circle: function(f) {
          return new zt.Circle(
            n(f, "cx", "cy"),
            i(f, "r")
          );
        },
        ellipse: function(f) {
          return new zt.Ellipse({
            center: n(f, "cx", "cy"),
            radius: r(f, "rx", "ry")
          });
        },
        rect: function(f) {
          return new zt.Rectangle(new j(
            n(f),
            r(f)
          ), r(f, "rx", "ry"));
        },
        line: function(f) {
          return new ot.Line(
            n(f, "x1", "y1"),
            n(f, "x2", "y2")
          );
        },
        text: function(f) {
          var g = new we(n(f).add(
            n(f, "dx", "dy")
          ));
          return g.setContent(f.textContent.trim() || ""), g;
        },
        switch: o
      };
      function d(f, g, w, S) {
        if (f.transform) {
          for (var x = (S.getAttribute(w) || "").split(/\)\s*/g), b = new ft(), P = 0, T = x.length; P < T; P++) {
            var z = x[P];
            if (!z)
              break;
            for (var M = z.split(/\(\s*/), O = M[0].trim(), A = M[1].split(/[\s,]+/g), k = 0, N = A.length; k < N; k++)
              A[k] = parseFloat(A[k]);
            switch (O) {
              case "matrix":
                b.append(
                  new ft(A[0], A[1], A[2], A[3], A[4], A[5])
                );
                break;
              case "rotate":
                b.rotate(A[0], A[1] || 0, A[2] || 0);
                break;
              case "translate":
                b.translate(A[0], A[1] || 0);
                break;
              case "scale":
                b.scale(A);
                break;
              case "skewX":
                b.skew(A[0], 0);
                break;
              case "skewY":
                b.skew(0, A[0]);
                break;
            }
          }
          f.transform(b);
        }
      }
      function c(f, g, w) {
        var S = w === "fill-opacity" ? "getFillColor" : "getStrokeColor", x = f[S] && f[S]();
        x && x.setAlpha(parseFloat(g));
      }
      var l = I.set(I.each(le, function(f) {
        this[f.attribute] = function(g, w) {
          if (g[f.set] && (g[f.set](s(w, f.type, f.fromSVG)), f.type === "color")) {
            var S = g[f.get]();
            if (S && S._scaleToBounds) {
              var x = g.getBounds();
              S.transform(new ft().translate(x.getPoint()).scale(x.getSize()));
            }
          }
        };
      }, {}), {
        id: function(f, g) {
          t[g] = f, f.setName && f.setName(g);
        },
        "clip-path": function(f, g) {
          var w = C(g);
          if (w)
            if (w = w.clone(), w.setClipMask(!0), f instanceof Bt)
              f.insertChild(0, w);
            else
              return new Bt(w, f);
        },
        gradientTransform: d,
        transform: d,
        "fill-opacity": c,
        "stroke-opacity": c,
        visibility: function(f, g) {
          f.setVisible && f.setVisible(g === "visible");
        },
        display: function(f, g) {
          f.setVisible && f.setVisible(g !== null);
        },
        "stop-color": function(f, g) {
          f.setColor && f.setColor(g);
        },
        "stop-opacity": function(f, g) {
          f._color && f._color.setAlpha(parseFloat(g));
        },
        offset: function(f, g) {
          if (f.setOffset) {
            var w = g.match(/(.*)%$/);
            f.setOffset(w ? w[1] / 100 : parseFloat(g));
          }
        },
        viewBox: function(f, g, w, S, x) {
          var b = new j(s(g, "array")), P = r(S, null, null, !0), T, z;
          if (f instanceof Bt) {
            var M = P ? P.divide(b.getSize()) : 1, z = new ft().scale(M).translate(b.getPoint().negate());
            T = f;
          } else
            f instanceof Rt && (P && b.setSize(P), T = f._item);
          if (T) {
            if (v(S, "overflow", x) !== "visible") {
              var O = new zt.Rectangle(b);
              O.setClipMask(!0), T.addChild(O);
            }
            z && T.transform(z);
          }
        }
      });
      function v(f, g, w) {
        var S = f.attributes[g], x = S && S.value;
        if (!x && f.style) {
          var b = I.camelize(g);
          x = f.style[b], !x && w.node[b] !== w.parent[b] && (x = w.node[b]);
        }
        return x ? x === "none" ? null : x : B;
      }
      function y(f, g, w) {
        var S = g.parentNode, x = {
          node: vt.getStyles(g) || {},
          parent: !w && !/^defs$/i.test(S.tagName) && vt.getStyles(S) || {}
        };
        return I.each(l, function(b, P) {
          var T = v(g, P, x);
          f = T !== B && b(f, T, P, g, x) || f;
        }), f;
      }
      function C(f) {
        var g = f && f.match(/\((?:["'#]*)([^"')]+)/), w = g && g[1], S = w && t[Y ? w.replace(Y.location.href.split("#")[0] + "#", "") : w];
        return S && S._scaleToBounds && (S = S.clone(), S._scaleToBounds = !0), S;
      }
      function p(f, g, w) {
        var S = f.nodeName.toLowerCase(), x = S !== "#document", b = tt.body, P, T, z;
        w && x && (e = rt.getView().getSize(), e = r(f, null, null, !0) || e, P = mt.create("svg", {
          style: "stroke-width: 1px; stroke-miterlimit: 10"
        }), T = f.parentNode, z = f.nextSibling, P.appendChild(f), b.appendChild(P));
        var M = rt.settings, O = M.applyMatrix, A = M.insertItems;
        M.applyMatrix = !1, M.insertItems = !1;
        var k = _[S], N = k && k(f, S, g, w) || null;
        if (M.insertItems = A, M.applyMatrix = O, N) {
          x && !(N instanceof Bt) && (N = y(N, f, w));
          var E = g.onImport, F = x && f.getAttribute("data-paper-data");
          E && (N = E(f, N, g) || N), g.expandShapes && N instanceof zt && (N.remove(), N = N.toPath()), F && (N._data = JSON.parse(F));
        }
        return P && (b.removeChild(P), T && (z ? T.insertBefore(f, z) : T.appendChild(f))), w && (t = {}, N && I.pick(g.applyMatrix, O) && N.matrix.apply(!0, !0)), N;
      }
      function m(f, g, w) {
        if (!f)
          return null;
        g = typeof g == "function" ? { onLoad: g } : g || {};
        var S = rt, x = null;
        function b(M) {
          try {
            var O = typeof M == "object" ? M : new H.DOMParser().parseFromString(
              M.trim(),
              "image/svg+xml"
            );
            if (!O.nodeName)
              throw O = null, new Error("Unsupported SVG source: " + f);
            rt = S, x = p(O, g, !0), (!g || g.insert !== !1) && w._insertItem(B, x);
            var A = g.onLoad;
            A && A(x, M);
          } catch (k) {
            P(k);
          }
        }
        function P(M, O) {
          var A = g.onError;
          if (A)
            A(M, O);
          else
            throw new Error(M);
        }
        if (typeof f == "string" && !/^[\s\S]*</.test(f)) {
          var T = tt.getElementById(f);
          T ? b(T) : Pe.request({
            url: f,
            async: !0,
            onLoad: b,
            onError: P
          });
        } else if (typeof File < "u" && f instanceof File) {
          var z = new FileReader();
          return z.onload = function() {
            b(z.result);
          }, z.onerror = function() {
            P(z.error);
          }, z.readAsText(f);
        } else
          b(f);
        return x;
      }
      $.inject({
        importSVG: function(f, g) {
          return m(f, g, this);
        }
      }), Yt.inject({
        importSVG: function(f, g) {
          return this.activate(), m(f, g, this);
        }
      });
    }();
    var rt = new (lt.inject(I.exports, {
      Base: I,
      Numerical: et,
      Key: ue,
      DomEvent: Ct,
      DomElement: vt,
      document: tt,
      window: Y,
      Symbol: Rt,
      PlacedSymbol: ne
    }))();
    return rt.agent.node && ce(rt), typeof B == "function" && B.amd ? B("paper", rt) : q && (q.exports = rt), rt;
  }).call(Me, typeof self == "object" ? self : null);
})(de);
var Ze = de.exports;
const dt = /* @__PURE__ */ Oe(Ze);
function jt(q) {
  return Math.round(q * 100) / 100;
}
let _e = !1;
function Ge() {
  return _e || (dt.setup(new dt.Size(1, 1)), _e = !0), dt.project.clear(), dt.project;
}
function ie(q, H, B) {
  const Y = q.lastSegment.point, tt = Y.getDistance(B);
  if (tt <= 0) {
    q.lineTo(H);
    return;
  }
  const I = Y.subtract(B).normalize().add(H.subtract(B).normalize());
  q.arcTo(B.add(I.normalize(tt)), H);
}
function Ue(q, H, B) {
  const [Y, tt, I, gt] = B;
  if (!Y && !tt && !I && !gt)
    return new dt.Path.Rectangle(new dt.Rectangle(0, 0, q, H));
  const lt = (yt, ht) => new dt.Point(yt, ht), _t = new dt.Path();
  return _t.moveTo(lt(Y, 0)), _t.lineTo(lt(q - tt, 0)), ie(_t, lt(q, tt), lt(q - tt, tt)), _t.lineTo(lt(q, H - I)), ie(_t, lt(q - I, H), lt(q - I, H - I)), _t.lineTo(lt(gt, H)), ie(_t, lt(0, H - gt), lt(gt, H - gt)), _t.lineTo(lt(0, Y)), ie(_t, lt(Y, 0), lt(Y, Y)), _t.closePath(), _t;
}
function ge(q) {
  if (q instanceof dt.Path)
    return q.closed = !0, q;
  for (const H of q.children)
    H instanceof dt.Path && (H.closed = !0);
  return q;
}
function We(q, H, B) {
  var I;
  const Y = Ee(H, B, ((I = Fe(q)) == null ? void 0 : I.width) || 0, Be(q)), tt = De(Ve(q), Re(q), Y);
  return tt ? ge(dt.PathItem.create(tt)) : null;
}
function ve(q, H) {
  if (q instanceof dt.Path) {
    q.segments.length > 1 && H.push(q);
    return;
  }
  for (const B of q.children || [])
    ve(B, H);
}
function Je(q, H, B) {
  const Y = String(q.svgUrl || "");
  if (!Y.trim().startsWith("<"))
    return null;
  const I = new DOMParser().parseFromString(Y, "image/svg+xml").documentElement;
  if (!I || I.nodeName === "parsererror" || I.querySelector("parsererror"))
    return null;
  const gt = qe(I);
  if (!(gt.width > 0 && gt.height > 0))
    return null;
  for (const ht of ["width", "height", "viewBox", "preserveAspectRatio"])
    I.removeAttribute(ht);
  let lt = null;
  try {
    lt = dt.project.importSVG(I, { expandShapes: !0, insert: !0 });
  } catch {
    return null;
  }
  if (!lt)
    return null;
  const _t = [];
  if (ve(lt, _t), _t.length === 0)
    return null;
  const yt = new dt.CompoundPath({ children: _t.map((ht) => ge(ht)), insert: !0 });
  return yt.translate(new dt.Point(-gt.x, -gt.y)), yt.scale(H / gt.width, B / gt.height, new dt.Point(0, 0)), yt;
}
function Xe(q, H, B) {
  switch (String(q.type)) {
    case "w-rect":
      return Ue(H, B, Ne(q));
    case "w-ellipse":
      return new dt.Path.Ellipse(new dt.Rectangle(0, 0, H, B));
    case "w-polygon":
      return dt.PathItem.create(Le(H, B, ke(q)));
    case "w-path":
      return We(q, H, B);
    case "w-svg":
      return Je(q, H, B);
    default:
      return null;
  }
}
function Ke(q) {
  const H = Number.parseFloat(String(q.rotate ?? ""));
  if (Number.isFinite(H))
    return H;
  const B = /rotate\(\s*(-?[\d.]+)deg\s*\)/.exec(String(q.transform || ""));
  return B ? Number.parseFloat(B[1]) : 0;
}
function je(q) {
  const H = Math.max(Number(q.width) || 0, 0), B = Math.max(Number(q.height) || 0, 0);
  if (H <= 0 || B <= 0)
    return null;
  const Y = Xe(q, H, B);
  if (!Y)
    return null;
  const tt = Ke(q);
  return tt && Y.rotate(tt, new dt.Point(H / 2, B / 2)), Y.translate(new dt.Point(Number(q.left) || 0, Number(q.top) || 0)), Y;
}
function Ye(q) {
  var H;
  return String(q.type) === "w-svg" ? ((H = q.colors) == null ? void 0 : H[0]) || fe : q.color || fe;
}
function Qe(q) {
  return q.replace(/-?\d+\.\d+/g, (H) => String(jt(Number(H))));
}
function $e(q, H, B) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${H} ${B}" preserveAspectRatio="none"><path fill-rule="evenodd" fill="{{colors[0]}}" d="${q}"/></svg>`;
}
function ii(q, H) {
  if (H.length < 2 || !H.every(ze))
    return null;
  const B = Ge();
  try {
    const Y = [];
    for (const et of H) {
      const Ht = je(et);
      if (!Ht)
        return null;
      Y.push(Ht);
    }
    let tt = Y[0];
    for (let et = 1; et < Y.length; et += 1)
      tt = tt[q](Y[et]);
    if (!tt || tt.isEmpty())
      return null;
    const I = tt.bounds, gt = jt(I.width), lt = jt(I.height);
    if (gt < 1 || lt < 1)
      return null;
    tt.translate(new dt.Point(-I.x, -I.y));
    const _t = Qe(tt.pathData);
    if (!_t)
      return null;
    const yt = H[0], ht = JSON.parse(JSON.stringify(Ae));
    return ht.left = jt(I.x), ht.top = jt(I.y), ht.width = gt, ht.height = lt, ht.svgUrl = $e(_t, gt, lt), ht.colors = [Ye(yt)], ht.opacity = Number(yt.opacity ?? 1), ht.borderWidth = Number(yt.borderWidth) || 0, ht.borderColor = yt.borderColor || "#000000ff", ht.borderStyle = yt.borderStyle || "solid", yt.shadow && (ht.shadow = JSON.parse(JSON.stringify(yt.shadow))), ht;
  } finally {
    B.clear();
  }
}
export {
  ii as combinedShape
};
