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

The embed demo serves the **built** `dist-embed`, so run `npm run build:embed`
after changing anything the embed uses, and restart that server — its module
graph caches the old chunk hashes.

## Is it the same?

`npm run test:parity` opens both apps side by side, drives the same gestures, and
compares them three ways.

**Pixels** — 19 views, screenshotted at 1440×900 and diffed:

| view | mismatch |
| --- | --- |
| editor, dark and light | 0.000% |
| Templates / Elements / Text / Tools / Uploads panels | 0.000% |
| text, shape and QR settings panels | 0.000% / 0.000% / 0.001% |
| a full template loaded, dark and light | 0.001% |
| the resize dialog | 0.005% |
| the animation card, and the picker open | 0.000% |
| the page strip, expanded | 0.000% |
| presentation mode | 0.000% |
| `/draw`, `/html` and `/psd` screens | 0.000% |

The non-zero figures are antialiasing: 19 pixels on the QR canvas, 10 on a
template's artwork, 15 on the dialog's rounded corner.

**Layout** — menus are compared as geometry rather than pixels
(`tests/parity/menus.spec.ts`): every item's class, label, offset, height and
padding, plus the popper's size and its offset from the trigger. Menus are
positioned by their own engine in each app — Element Plus pins a `bottom-end`
popper's right edge to the trigger, Radix rounds the left edge to a whole pixel —
so the same text renders a third of a pixel apart. Nobody can see that and a
pixel diff cannot ignore it, but every number the layout depends on is checked.

**Behaviour** — 16 scenarios run against both apps, comparing every widget's
geometry and computed style, the selection box, the layer list and the zoom
readout: inserting text, cascading repeat inserts, selection, arrow and
shift-arrow nudges, delete, QR insertion, zoom stepping and presets, the layers
tab, resizing a design two ways, adding and duplicating pages, and assigning an
animation.

On top of that, 72 Playwright tests exercise the port on its own
(`tests/e2e/`), including ten that assert the embed does not leak into its host.

### What the tests caught

Bugs found by the parity and e2e suites while porting main's changes, all fixed:

- **Every style panel was the wrong height.** A wrapper `<div>` around the panel
  broke `height: 100%`, which nothing depended on until a card was placed below.
- **Menus opened off the side of the window.** Element Plus's `.el-popper` is
  `position: absolute`; Radix positions from a fixed wrapper it expects the
  content to fill, so every collision adjustment was made against a zero-size box.
- **Choosing from a menu also clicked what was behind it.** A React portal
  bubbles events up the *React* tree, so a page's ⋯ menu selected that page as
  well. Vue's Teleport does not, which is why the original never hit it.
- **Menus never closed on select**, which left `pointer-events: none` on the body
  and made the next dialog unclickable.
- **The finished-export overlay could not be dismissed** — its close button had
  no handler.
- **The embed's keyframes were destroyed**: the CSS scoper prefixed `0%` with a
  class inside `@-webkit-keyframes`, which does not parse.
- **The icon font leaked into the host.** It is fetched at runtime, so the build
  never scoped its `.iconfont` and hundred-odd `.icon-*` rules. It is bundled and
  scoped now, with the woff2 files inline.
- **The eraser never started.** Radix mounts portal content a tick after the
  dialog opens, so the canvas refs were still null when the engine was told to
  start.

One bug was found in the Vue app and fixed there: a page's ⋯ button was
positioned against Element Plus's own dropdown wrapper rather than the
thumbnail, which put it on top of the collapse chevron where it could not be
clicked at all.

## Is it faster?

Production builds, median of five runs (`npm run bench:prod`):

| | Vue | React | |
| --- | --- | --- | --- |
| cold load to first canvas | 156 ms | 124 ms | **−21%** |
| insert 30 text widgets | 649 ms | 550 ms | **−15%** |
| drag, mean frame | 8.34 ms | 8.33 ms | — |
| drag, 95th percentile frame | 10.0 ms | 9.7 ms | −3% |
| zoom, mean frame | 8.34 ms | 8.34 ms | — |
| zoom, 95th percentile frame | 9.7 ms | 9.8 ms | +1% |
| drag and zoom, frames over 32 ms | 0 | 0 | — |
| switch page | 919 ms | 896 ms | −3% |
| resize a design | 38 ms | 39 ms | +3% |
| open the presenter | 309 ms | 46 ms | **−85%** |
| step through slides | 569 ms | 558 ms | −2% |

Benchmark the **production** builds. In dev, React's `jsxDEV` dominates the
profile and the comparison means nothing.

Bundles: `dist-react` 1558 kB JS (479 kB gzipped) + 280 kB CSS. The eraser is a
separate 45 kB chunk (15 kB gzipped), loaded when someone opens it — so the
feature that does the most work costs nothing to everyone who never uses it.

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
its own object. The page strip memoises each thumbnail against valtio's own
snapshot, so editing one page repaints one thumbnail. Dragging and resizing write
to the DOM directly and commit to the store on release, exactly as the original
does.

**Chrome.** Element Plus is a Vue library, so the controls are reimplemented in
React with the same DOM and class names, over Element Plus's own plain CSS (no
Vue runtime). Radix provides the behaviour for popovers, tooltips, menus and
dialogs. `react/src/main.tsx` imports element-vars → `index.less` →
element-components in that order on purpose: it reproduces the order the Vue app
happens to load them in, and changing it visibly changes the UI.

**The eraser** (`react/src/packages/image-extraction/`) is 1,300 lines of canvas
geometry written against Vue refs, with the drawing listeners mutating a shared
transform and a watcher repainting from it. The geometry is copied unchanged and
`matting.ts` replaces the four composables, over `@vue/reactivity` — the
reactivity system on its own, no components and no renderer. Rewriting the
watchers into explicit calls would have meant finding every mutation site in code
whose whole job is to be subtle about pixels. The whole thing is lazy-loaded, so
the 10 kB it costs is only paid by someone who opens it.

**Same libraries where they are framework-agnostic:** moveable, selecto,
@scena/guides, sortablejs, qr-code-styling, html2canvas, pptxgenjs, psd.js,
immer, microdiff, nanoid.

## Embedding

See `EMBEDDING.md`. `npm run build:embed` produces `dist-embed/design-studio.js`
plus a stylesheet whose every rule is scoped to the editor's own root, so it can
be dropped into the school planner without an iframe.

## Not carried over

- **vue-i18n.** The app is English-only in practice; the port drops the
  machinery rather than reimplementing it around a single locale.
- **`Tour`** is reimplemented rather than wrapping Element Plus's; it is the one
  piece of chrome not covered by a pixel-parity test.
