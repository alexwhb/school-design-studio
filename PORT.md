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
npm run typecheck       # the Vue app
npm run typecheck:react # the port
npm run typecheck:tests # the parity and e2e suites
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

**Pixels** — 23 views, screenshotted at 1440×900 and diffed:

| view | mismatch |
| --- | --- |
| editor, dark and light | 0.000% |
| Templates / Elements / Text / Tools / Uploads panels | 0.000% |
| text, shape and QR settings panels | 0.000% / 0.000% / 0.001% |
| a full template loaded, dark and light | 0.001% |
| the resize dialog | 0.005% |
| the Animation section, and the picker open | 0.000% |
| the page strip, expanded | 0.000% |
| presentation mode | 0.000% |
| the rulers, with a guide pulled onto the page | 0.000% |
| the templates gallery, filtered and searched | 0.000% / 0.010% |
| a text effect preset applied | 0.005% |
| `/draw`, `/html` and `/psd` screens | 0.000% |

The non-zero figures are antialiasing, and none is more than a few hundred
pixels out of 1.3 million: 19 on the QR canvas, 10 on a template's artwork, 15
on the resize dialog's rounded corner, 62 and 131 on text the two engines lay
out a fraction of a pixel apart. The threshold the suite enforces is 0.05%.

**Layout** — menus and one picker are compared as geometry rather than pixels
(`tests/parity/menus.spec.ts`): every item's class, label, offset, height and
padding, plus the popper's size and its offset from the trigger.

Menus are positioned by their own engine in each app — Element Plus pins a
`bottom-end` popper's right edge to the trigger, Radix rounds the left edge to a
whole pixel — so the same text renders a third of a pixel apart. Nobody can see
that and a pixel diff cannot ignore it, but every number the layout depends on
is checked.

The text-effect picker is there for a different reason. It is 626px of presets
opened from a control near the bottom of the panel, and the two engines disagree
about where that goes: Element Plus lets it hang 283px off the bottom of the
window, so a third of the presets cannot be reached, while Radix shifts it up
until it fits. The port keeps Radix's, which is the reason the picker is usable
at all — so what is checked is that the same presets are laid out the same way,
not where the box lands.

**Behaviour** — 19 scenarios run against both apps, comparing every widget's
geometry and computed style, the selection box, the layer list and the zoom
readout: inserting text, cascading repeat inserts, selection, arrow and
shift-arrow nudges, delete, QR insertion, zoom stepping and presets, the layers
tab, resizing a design two ways, adding and duplicating pages, assigning an
animation, and three that drag an element onto a neighbour's edge and onto the
centre of the page — with snapping on, and with it off.

On top of that, 88 Playwright tests exercise the port on its own
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
- **The colour picker's hex field could not be typed in.** It was bound straight
  to the committed value, so React put the old text back on every keystroke —
  each one is a partial colour the picker does not accept.
- **The picker forgot the colours you had used**, because Radix unmounts a
  closed popover and Element Plus does not. The list is held by the control that
  owns it now.
- **Two pickers shared their class names.** The image-mask picker's tile size
  won over the text-effect picker's, so the presets came out at half the width
  and twice the height.
- **Three link buttons had Element Plus's padding**, because `&__choose` in Less
  concatenates to one class, which ties with `.el-button.is-link` and then loses
  on source order — and one of them was nested two blocks deep, where
  `& &__action` compiles to a selector that can never match at all.
- **The effect rows never laid out**, because the classes that make the toggle
  flexible and pin the swatch right were on the Vue components and not on the
  React ones.
- **The search box had no focus ring and no clear button.**
- **No entrance ever played in the presenter.** The set of drawn slides was
  rebuilt on every pass, so the effect that starts a slide watched a dependency
  that changed each time it ran — and cancelled, on the way out, the frame it
  had queued to begin that slide's build. The pixel-parity shot could not see
  it: by the time it is taken the animation has finished in both apps.

Two more came out of using the editor rather than testing it. Both have tests of
their own now:

- **A placed element was locked, so it could not be clicked again.** Vue watches
  `cropEdit` to lock the other layers while you crop, and a `watch` only fires on
  a change. The ported `useEffect` fires on mount as well, so a guard was added
  to skip the first run — but a `useRef` flag does not survive React invoking an
  effect twice in development: the first run clears the flag and the second sails
  past it. Every image mounting therefore called `lockWidgets`, which locks the
  whole canvas. `.layer-lock` is `pointer-events: none`, so the element you had
  just dropped ignored the mouse and could only be reached from the layer list.
  `lockWidgets` toggles, so a second image undid it — which is why it came and
  went. The same broken guard was in the page strip, where it fired a
  fit-to-screen zoom on mount, and in the SVG widget. All three now compare the
  value rather than counting runs, which is what a Vue `watch` actually does.
- **Dragging something onto the page could zoom the whole view and leave the new
  object unselectable.** React runs an effect twice in development. The canvas
  effect built a Selecto each time but only ever destroyed the Moveable, so a
  second Selecto stayed attached to the page driving a Moveable that was gone.
  Both handled the same rubber band, and both called `selectWidgetsInOut` for
  the same widget — that is a toggle, so the two cancelled out: the DOM came out
  marked as selected while the store believed nothing was. Moveable reads its
  targets straight out of the DOM, so it then framed widgets the store did not
  think were selected, and a resize wrote the new size onto whatever the store
  did think was active — the page. Page size is the input to fit-to-screen zoom.

Two smaller leaks of the same shape were fixed alongside them: the wheel-zoom
listener could not be removed and so was registered twice, which zoomed two
steps per notch, and the photo panel built a `DragHelper` on every render — the
argument to `useRef` is evaluated whether it is kept or not — each one adding
five window listeners that nothing ever took off again.

The lesson worth carrying: a Vue `watch` is lazy and `useEffect` is eager, and
the obvious fix — a ref that remembers whether this is the first run — is wrong
under `StrictMode`, because the first run clears the flag and the second acts on
it. Compare the value instead.

That was worth sweeping for. Every effect with a dependency list that called a
store action was checked against the `watch` it came from, which turned up three
more firing once too early:

- The rulers cleared the design's saved guides on mount and on every theme
  change, rather than only when you actually put the rulers away.
- Every text widget wrote `editable: false` into its own data as it mounted.
- The eraser handed the selection handles back as it mounted, rather than when
  it closed.

Sweeping the other way — effects that build something and never take it down —
found one more: the QR code widget appended its canvas without removing it, so
in development it drew two, one on top of the other.

Three bugs were found in the Vue app and fixed there. The port had reproduced
all three faithfully, which is how they were found; two of them are broken
features rather than cosmetic:

- A page's ⋯ button was positioned against Element Plus's own dropdown wrapper
  rather than the thumbnail, which put it on top of the collapse chevron where
  it could not be clicked at all.
- Clicking a shape, photo or element in a panel stopped placing it. `Math.abs`
  around the drag threshold made the pointer's arrival on a thumbnail read as a
  drag of ninety-nine thousand pixels — the distance from the "no drag" sentinel
  — so the click that followed was discarded as the end of one.
- A search that matched nothing left the results' height behind, because
  `Math.max()` of an empty list is `-Infinity`, which is not a length, so the
  browser kept the last one. The message saying nothing matched was pushed
  1,280px down, out of the panel.

One shared bug is left alone, because both apps do it and fixing it is a product
decision rather than a porting one: clearing the search box re-runs the search
with the term that was just cleared, so the gallery stays empty.

## Is it faster?

Production builds, median of five runs (`npm run bench:prod`):

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
| resize a design | 40 ms | 28 ms | −30% |
| open the presenter | 329 ms | 42 ms | **−87%** |
| step through slides | 563 ms | 565 ms | — |

Benchmark the **production** builds. In dev, React's `jsxDEV` dominates the
profile and the comparison means nothing.

Resizing a design is the noisiest line here — it read +7% on the run before this
one and −30% on this one, on a job that takes about 30ms. Read the spread rather
than the median for that one. The presenter is the opposite: 329ms against 42ms,
with no overlap between the two sets of runs at all.

Dragging is measured with snapping on, which is the default in both apps. It
costs nothing: 8.32ms a frame and no frame over 32ms, against 8.33ms before
snapping existed.

Selecting is measured because the Animation section is now built on every
selection; it costs nothing.

Bundles: `dist-react` 1561 kB JS (492 kB gzipped) + 281 kB CSS. The eraser is a
separate 45 kB chunk (16 kB gzipped), loaded when someone opens it — so the
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
snapshot, so editing one page repaints one thumbnail. The presenter's clock is
its own component, so the second hand does not go through the stage, and the
set of drawn slides keeps its identity when nothing new needs drawing —
returning a fresh one made the effect that starts a slide re-run and cancel
itself. Dragging and resizing write to the DOM directly and commit to the store
on release, exactly as the original does.

**Chrome.** Element Plus is a Vue library, so the controls are reimplemented in
React with the same DOM and class names, over Element Plus's own plain CSS (no
Vue runtime). Radix provides the behaviour for popovers, tooltips, menus and
dialogs. `react/src/main.tsx` imports element-vars → `index.less` →
element-components in that order on purpose: it reproduces the order the Vue app
happens to load them in, and changing it visibly changes the UI.

**The text-effect stack** is one expression, in
`react/src/components/modules/widgets/wText/effectStyle.ts`, shared by the
widget, its read-only twin and the preview glyph in the panel. `recolorEffects`
next to it is what makes the colour swatch work on a widget that has a stack:
the fill layer paints over the plain text, so without carrying the colour
through, the swatch appears to do nothing.

**The eraser** (`react/src/packages/image-extraction/`) is 1,300 lines of canvas
geometry written against Vue refs, with the drawing listeners mutating a shared
transform and a watcher repainting from it. The geometry is copied unchanged and
`matting.ts` replaces the four composables, over `@vue/reactivity` — the
reactivity system on its own, no components and no renderer. Rewriting the
watchers into explicit calls would have meant finding every mutation site in code
whose whole job is to be subtle about pixels. The whole thing — engine,
reactivity and all — is one lazy chunk of 16 kB gzipped, loaded when the dialog
is opened and by nobody else.

**Same libraries where they are framework-agnostic:** moveable, selecto,
@scena/guides, sortablejs, qr-code-styling, html2canvas, pptxgenjs, psd.js,
immer, microdiff, nanoid.

## Embedding

See `EMBEDDING.md`. `npm run build:embed` produces `dist-embed/design-studio.js`
plus a stylesheet whose every rule is scoped to the editor's own root, so it can
be dropped into the school planner without an iframe.

## Ported ahead of main

**Snapping and ruler guides** come from `t3code/smart-alignment-snapping-guides`,
which is not on main yet. The Vue branch is merged into this one so the two can
be compared; if it changes before it lands, the delta gets re-ported the same way
everything else here did.

What it adds: dragging and resizing snap to other objects, to the page and to the
page's centre, with equal-spacing hints; the rulers produce real guides (their
`changeGuides` handler was two `console.log`s); the rulers' zero point agrees
with the page rather than being 35px out; and `snapBox` finishes the snap
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
  piece of chrome not covered by a pixel-parity test.
