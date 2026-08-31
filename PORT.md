# The React port

The editor has been ported from Vue 3 to React 19. Both versions are in the repo
while the port is being checked: `src/` is the original, `react/src/` is the port.
Every claim below is enforced by a test.

## Running it

```bash
npm run dev:servers     # Vue on :5174, React on :5273, embed demo on :5373
npm run dev:react       # React only
npm run test:parity     # drives both apps and compares them
npm run test:e2e:react  # end-to-end tests for the port and the embed
npm run typecheck:react
npm run bench:prod      # production builds, before/after numbers
```

The dev servers must be started through `tools/dev/servers.mjs` (that is what
`dev:servers` does) — as plain background jobs they get reaped. Each Vite config
has its own `cacheDir`; sharing one made them invalidate each other's optimised
deps and 504.

## Is it the same?

`npm run test:parity` opens both apps side by side, drives the same gestures, and
compares them two ways.

**Pixels** — 15 views, screenshotted at 1440×900 in both themes and diffed:

| view | mismatch |
| --- | --- |
| editor, dark and light | 0.000% |
| Templates / Elements / Text / Tools / Uploads panels | 0.000% |
| text, shape and QR settings panels | 0.000% / 0.000% / 0.001% |
| a full template loaded, dark and light | 0.000% |
| `/draw` and `/html` render screens | 0.000% |
| `/psd` import screen | 0.000% |

The one non-zero figure is 19 pixels of antialiasing on the QR code canvas.

**Behaviour** — 12 scenarios run against both apps, comparing every widget's
geometry and computed style, the selection box, the layer list and the zoom
readout: inserting text, cascading repeat inserts, selection, arrow and
shift-arrow nudges, delete, QR insertion, zoom stepping and presets, the layers
tab, and page resizing.

On top of that, 33 Playwright tests exercise the port on its own (`tests/e2e/`),
including six that assert the embed does not leak into its host.

## Is it faster?

Production builds, median of five runs (`npm run bench:prod`):

| | Vue | React | |
| --- | --- | --- | --- |
| cold load to first canvas | 1087 ms | 155 ms | **−86%** |
| insert 30 text widgets | 589 ms | 558 ms | −5% |
| drag, mean frame | 8.33 ms | 8.34 ms | — |
| drag, 95th percentile frame | 10.1 ms | 10.1 ms | — |
| drag, frames over 32 ms | 0 | 0 | — |
| zoom, mean frame | 8.34 ms | 8.33 ms | — |
| zoom, 95th percentile frame | 10.0 ms | 10.0 ms | — |
| zoom, frames over 32 ms | 0 | 0 | — |
| switch page | 913 ms | 896 ms | −2% |

Benchmark the **production** builds. In dev, React's `jsxDEV` dominates the
profile and the comparison means nothing.

## How it is put together

**Store.** valtio. The Vue original mutates deeply nested widget objects from
everywhere (`widget.left = x`), so a proxy store let the Pinia action bodies come
across almost unchanged while keeping per-widget render granularity. State lives
in `react/src/store/state.ts`; actions are plain functions over it.

Watch a slice with `subscribeSelector` (`react/src/store/subscribe.ts`), not by
filtering `subscribe`'s ops — valtio hands back an empty ops array unless op
tracking is switched on through an unstable API, so op-path filters look right
and silently never fire.

**Rendering.** `Layers` is memoised and takes primitives, so a zoom step
re-renders the page container and nothing else; each widget subscribes only to
its own object. Dragging and resizing write to the DOM directly and commit to the
store on release, exactly as the original does.

**Chrome.** Element Plus is a Vue library, so the controls are reimplemented in
React with the same DOM and class names, over Element Plus's own plain CSS (no
Vue runtime). Radix provides the behaviour for popovers, tooltips, menus and
dialogs. `react/src/main.tsx` imports element-vars → `index.less` →
element-components in that order on purpose: it reproduces the order the Vue app
happens to load them in, and changing it visibly changes the UI.

**Same libraries where they are framework-agnostic:** moveable, selecto,
@scena/guides, sortablejs, qr-code-styling, html2canvas, pptxgenjs, psd.js,
immer, microdiff, nanoid.

## Embedding

See `EMBEDDING.md`. `npm run build:embed` produces `dist-embed/design-studio.js`
plus a stylesheet whose every rule is scoped to the editor's own root, so it can
be dropped into the school planner without an iframe.

## Not carried over

- **Background removal** (`ImageCutout`) is a placeholder dialog. The original
  drives `@palxp/image-extraction`, a Vue package, against a third-party endpoint.
- **vue-i18n.** The app is English-only in practice; the port drops the
  machinery rather than reimplementing it around a single locale.
- **`Tour`** is reimplemented rather than wrapping Element Plus's; it is the one
  piece of chrome not covered by a pixel-parity test.
