import { R as c, c as n } from "./index-C2nt2h3Y.mjs";
let i = null;
function s(l) {
  const t = /* @__PURE__ */ new Map();
  return (a) => {
    if (l)
      if ((a == null ? void 0 : a.status) === "progress" && a.file && a.total) {
        t.set(a.file, { loaded: Number(a.loaded) || 0, total: Number(a.total) || 0 });
        let o = 0, e = 0;
        for (const r of t.values())
          o += r.loaded, e += r.total;
        e > 0 && l({ fraction: Math.min(1, o / e), message: "Getting ready…" });
      } else
        (a == null ? void 0 : a.status) === "initiate" && l({ fraction: 0, message: "Getting ready…" });
  };
}
async function u(l) {
  const { pipeline: t, env: a } = await import("@huggingface/transformers");
  return a.allowLocalModels = !1, a.allowRemoteModels = !0, await t("background-removal", n.BACKGROUND_REMOVAL_MODEL, {
    dtype: "q8",
    progress_callback: s(l)
  });
}
async function f(l, t) {
  let a;
  try {
    i = i || u(t), a = await i;
  } catch (e) {
    throw i = null, console.warn("[background removal] could not load the model", e), new Error(c);
  }
  t == null || t({ fraction: -1, message: "Removing the background…" });
  const o = URL.createObjectURL(l);
  try {
    return await (await a(o)).toBlob("image/png");
  } finally {
    URL.revokeObjectURL(o);
  }
}
export {
  f as removeInBrowser
};
