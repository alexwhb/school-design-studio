# The React port

The editor was ported from Vue 3 to React 19. The Vue original was kept beside
the port while it was checked, and removed once it was; `src/` is now the React
app and there is no second version to compare against.

This file is the record of what the port did, and of the architecture decisions
that are still load-bearing. The parity evidence below can no longer be
reproduced — reproducing it would mean restoring the Vue app from history — so
it is written down here rather than left to a test that no longer exists.

## Running it

```bash
npm run dev             # the editor on :5273
npm run dev:servers     # editor on :5273, embed demo on :5373
npm run test:e2e        # 90 end-to-end tests for the app and the embed
npm run typecheck       # the app
npm run typecheck:tests # the e2e suite
npm run bench           # performance run, compared against the previous one
```

The dev servers must be started through `tools/dev/servers.mjs` (that is what
`dev:servers` does) — as plain background jobs they get reaped. Each Vite config
has its own `cacheDir`; sharing one made them invalidate each other's optimised
deps and 504.

The embed demo serves the **built** `dist-embed`, so run `npm run build:embed`
after changing anything the embed uses, and restart that server — its module
graph caches the old chunk hashes.

## What parity proved

A `test:parity` suite drove both apps side by side and compared them three ways.
At the point Vue was removed:

**Pixels** — 23 views screenshotted at 1440×900 and diffed. Nineteen were an
exact match; the rest were between 0.001% and 0.005%, all antialiasing, none
more than a few hundred pixels out of 1.3 million (19 on the QR canvas, 15 on
the resize dialog's rounded corner, 62 and 131 on text the two engines lay out a
fraction of a pixel apart). The threshold enforced was 0.05%.

**Layout** — menus and one picker compared as geometry rather than pixels: every
item's class, label, offset, height and padding, plus the popper's size and its
offset from the trigger. Menus are positioned by their own engine in each app,
so the same text rendered a third of a pixel apart; every number the layout
depends on was checked instead.

The text-effect picker was deliberately *not* held to Element Plus's placement.
It is 626px of presets opened from a control near the bottom of the panel:
Element Plus let it hang 283px off the bottom of the window, where a third of
the presets could not be reached, while Radix shifts it up until it fits. The
port keeps Radix's, which is the reason the picker is usable at all.

**Behaviour** — 19 scenarios run against both apps, comparing every widget's
geometry and computed style, the selection box, the layer list and the zoom
readout: inserting text, cascading repeat inserts, selection, arrow and
shift-arrow nudges, delete, QR insertion, zoom stepping and presets, the layers
tab, resizing a design two ways, adding and duplicating pages, assigning an
animation, and three that drag an element onto a neighbour's edge and onto the
centre of the page — with snapping on, and with it off.

### What the tests caught

Bugs found by the parity and e2e suites while porting, all fixed. They are the
list of things that a Vue-to-React port gets wrong, so they are worth keeping:

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
- **The colour picker's hex field could not be typed in.** It was bound straight
  to the committed value, so React put the old text back on every keystroke —
  each one is a partial colour the picker does not accept.
- **The picker forgot the colours you had used**, because Radix unmounts a
  closed popover and Element Plus does not. The list is held by the control that
  owns it now.
- **Two pickers shared their class names.** The image-mask picker's tile size
  won over the text-effect picker's, so the presets came out at half the width
  and twice the height.

## Was it faster?

Production builds, median of five runs, measured against the Vue app just before
it was removed:

| | Vue | React | |
| --- | --- | --- | --- |
| cold load to first canvas | 165 ms | 131 ms | **−21%** |
| insert 30 text widgets | 695 ms | 580 ms | **−17%** |
| drag, mean frame | 8.33 ms | 8.32 ms | — |
| drag, 95th percentile frame | 10.2 ms | 10.3 ms | +1% |
| zoom, mean frame | 8.35 ms | 8.35 ms | — |
| zoom, 95th percentile frame | 10.1 ms | 10.0 ms | −1% |
| drag and zoom, frames over 32 ms | 0 | 0 | — |
| select one element after another | 582 ms | 570 ms | −2% |
| switch page | 892 ms | 861 ms | −3% |
| resize a design | 40 ms | 28 ms | **−30%** |
| open the presenter | 329 ms | 42 ms | **−87%** |
| step through slides | 563 ms | 565 ms | — |

Resizing a design was the noisiest line — it read +7% on one run and −30% on the
next, on a job that takes about 30ms. The presenter was the opposite: 329ms
against 42ms, with no overlap between the two sets of runs at all.

`npm run bench` now runs the same measurements against the app alone and prints
each median beside the previous run's, so it is a regression check rather than a
comparison. Benchmark the **production** build (`npm run bench:prod`) — in dev,
React's `jsxDEV` dominates the profile and the numbers mean nothing.

Bundles: 1598 kB JS (492 kB gzipped) + 288 kB CSS.

## How it is put together

**Store.** valtio. The Vue original mutates deeply nested widget objects from
everywhere (`widget.left = x`), so a proxy store let the Pinia action bodies come
across almost unchanged while keeping per-widget render granularity. State lives
in `src/store/state.ts`; actions are plain functions over it.

Watch a slice with `subscribeSelector` (`src/store/subscribe.ts`), not by
filtering `subscribe`'s ops — valtio hands back an empty ops array unless op
tracking is switched on through an unstable API, so op-path filters look right
and silently never fire.

**Rendering.** `Layers` is memoised and takes primitives, so a zoom step
re-renders the page container and nothing else; each widget subscribes only to
its own object. The page strip memoises each thumbnail against valtio's own
snapshot, so editing one page repaints one thumbnail. The presenter's clock is
its own component, so the second hand does not go through the stage, and the
set of drawn slides keeps its identity when nothing new needs drawing —
returning a fresh one made the effect that starts a slide re-run and cancel
itself. Dragging and resizing write to the DOM directly and commit to the store
on release, exactly as the original does.

**Chrome.** Element Plus is a Vue library, so the controls are reimplemented in
React with the same DOM and class names, over Element Plus's own plain CSS (no
Vue runtime). That CSS is the only reason `element-plus` is still a dependency,
and the only reason `vue` is still installed at all — it is Element Plus's peer.
Radix provides the behaviour for popovers, tooltips, menus and dialogs.
`src/main.tsx` imports element-vars → `index.less` → element-components in that
order on purpose: it reproduces the order the Vue app happened to load them in,
and changing it visibly changes the UI.

**The text-effect stack** is one expression, in
`src/components/modules/widgets/wText/effectStyle.ts`, shared by the widget, its
read-only twin and the preview glyph in the panel. `recolorEffects` next to it
is what makes the colour swatch work on a widget that has a stack: the fill
layer paints over the plain text, so without carrying the colour through, the
swatch appears to do nothing.

**Same libraries where they are framework-agnostic:** moveable, selecto,
@scena/guides, sortablejs, qr-code-styling, html2canvas, pptxgenjs, psd.js,
immer, microdiff, nanoid.

## Embedding

See `EMBEDDING.md`. `npm run build:embed` produces `dist-embed/design-studio.js`
plus a stylesheet whose every rule is scoped to the editor's own root, so it can
be dropped into the school planner without an iframe.

## Snapping and ruler guides

These came from `t3code/smart-alignment-snapping-guides`, which was not on main
when the port was done, so they were ported alongside everything else.

What they add: dragging and resizing snap to other objects, to the page and to
the page's centre, with equal-spacing hints; the rulers produce real guides
(their `changeGuides` handler was two `console.log`s); the rulers' zero point
agrees with the page rather than being 35px out; and `snapBox` finishes the snap
Moveable leaves a fraction short — it rounds guides to a tenth of a *screen*
pixel, which at 37% zoom is nearly three page pixels, invisible until you zoom
back in. Snapping is a File-menu toggle, remembered in localStorage.

The one piece that needed rethinking for React rather than translating: ruler
guides are handed to Moveable as invisible zero-thickness boxes rendered inside
the page (`SnapGuides`), not as Moveable's own `verticalGuidelines` — those are
measured in the container's screen pixels, and the page is CSS-scaled by the
zoom.

## Not carried over

- **vue-i18n.** The app is English-only in practice; the port drops the
  machinery rather than reimplementing it around a single locale.
- **`Tour`** is reimplemented rather than wrapping Element Plus's; it is the one
  piece of chrome that was never covered by a pixel-parity test.
