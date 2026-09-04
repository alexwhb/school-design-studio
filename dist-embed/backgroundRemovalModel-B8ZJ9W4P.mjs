import { R as s, c as u } from "./index-BJZuUXKn.mjs";
let l = null;
function d(a) {
  const o = /* @__PURE__ */ new Map();
  return (t) => {
    if (a)
      if ((t == null ? void 0 : t.status) === "progress" && t.file && t.total) {
        o.set(t.file, { loaded: Number(t.loaded) || 0, total: Number(t.total) || 0 });
        let r = 0, e = 0;
        for (const i of o.values())
          r += i.loaded, e += i.total;
        e > 0 && a({ fraction: Math.min(1, r / e), message: "Getting ready…" });
      } else
        (t == null ? void 0 : t.status) === "initiate" && a({ fraction: 0, message: "Getting ready…" });
  };
}
const c = "@huggingface/transformers";
async function f() {
  try {
    return await import(
      /* @vite-ignore */
      /* webpackIgnore: true */
      c
    );
  } catch (a) {
    throw console.warn(`[background removal] ${c} is not installed`, a), new Error(n);
  }
}
const n = "Cutting a background out in the browser needs the @huggingface/transformers package, which this app does not have installed. Ask for it, or pick the photo out another way.";
async function m(a) {
  const { pipeline: o, env: t } = await f();
  return t.allowLocalModels = !1, t.allowRemoteModels = !0, await o("background-removal", u.BACKGROUND_REMOVAL_MODEL, {
    dtype: "q8",
    progress_callback: d(a)
  });
}
async function w(a, o) {
  let t;
  try {
    l = l || m(o), t = await l;
  } catch (e) {
    throw l = null, console.warn("[background removal] could not load the model", e), new Error(e instanceof Error && e.message === n ? n : s);
  }
  o == null || o({ fraction: -1, message: "Removing the background…" });
  const r = URL.createObjectURL(a);
  try {
    return await (await t(r)).toBlob("image/png");
  } finally {
    URL.revokeObjectURL(r);
  }
}
export {
  n as MISSING_LIBRARY,
  w as removeInBrowser
};
