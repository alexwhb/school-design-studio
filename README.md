# School Design Studio

A drag-and-drop design editor for schools — posters, flyers, newsletters,
certificates and slides — that exports to **PDF**, PNG and **PowerPoint**.

Open it in a browser and you get a canvas, a page-size picker and panels down
the left for templates, text, elements, photos and uploads. Drag things on,
type over them, and export a PDF for the print shop, a PNG for the website, or
an editable `.pptx` deck. There is no sign-up and no server to stand up:
`npm install && npm start` is the whole setup, and the bundled content library
ships in the repository as JSON.

## Where this came from

This is a fork of **[palxiao/poster-design](https://github.com/palxiao/poster-design)**
by [palxiao](https://github.com/palxiao), released under the MIT licence. The
original is an excellent editor — the canvas engine, the widget model, the
history stack and the export pipeline are all theirs, and this fork keeps them.

What it was not built for is an English-speaking school office. Upstream targets
a Chinese market: the interface, code comments, font list, page-size presets and
sample content are all Chinese, uploads post to a CDN this project has no
account for, and the demo content is styled for e-commerce rather than a school
noticeboard. This fork translates the interface, swaps the fonts and page sizes,
replaces the content library, adds a dark theme and PowerPoint export, and makes
uploads work without a backend. [What changed from upstream](#what-changed-from-upstream)
lists all of it.

It was written as an experiment for **School Planner** (<https://synthed.co>), a
school planning app, with a view to embedding it there — see
[Using it inside School Planner](#using-it-inside-school-planner). It runs
perfectly well on its own, which is why it lives in its own repository.

## What is in here

| Path                | What it is                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/`              | The editor — React 19, valtio, TypeScript, built with Vite                                            |
| `public/`           | Bundled fonts, stickers, masks and template thumbnails                                                |
| `service/src/mock/` | The content library: templates, elements and photos, as plain JSON                                    |
| `server/`           | The content library — `library.mjs` is the implementation, and `design-studio/server` in the package  |
| `serve.mjs`         | A small Node server that serves `dist/` and the content lookups, so no backend is needed              |
| `service/`          | Upstream's full Express backend, kept for saving designs (optional, not required to run)              |
| `tools/`            | Scripts that generated the fonts, stickers and templates in this fork ([details](#developer-tooling)) |
| `tests/e2e/`        | Playwright end-to-end tests for the editor and the embed                                              |
| `tests/unit/`       | Vitest tests for the compose entry, which runs with no browser behind it                              |
| `embed-demo/`       | A host page that mounts the editor as a component, for checking [embedding](EMBEDDING.md)             |

## Run it

```bash
npm install
npm start          # builds, then serves on http://127.0.0.1:4173
```

For development with hot reload:

```bash
npm run dev        # http://127.0.0.1:5273
```

Other scripts:

| Script                  | What it does                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`         | Production build into `dist/`                                                                                                               |
| `npm run serve`         | Serves an existing `dist/` (no rebuild)                                                                                                     |
| `npm run typecheck`     | `tsc --noEmit`                                                                                                                              |
| `npm run test:e2e`      | Playwright end-to-end tests (needs `npm run dev:servers`)                                                                                   |
| `npm run test`          | Unit tests (Vitest) for the compose entry                                                                                                   |
| `npm run build:embed`   | Builds the embeddable component, the compose entry, the types and the bundled content into `dist-embed/` (see [EMBEDDING.md](EMBEDDING.md)) |
| `npm run release:embed` | Cuts a tagged release of that build for a host app to install                                                                               |
| `npm run fetch-fonts`   | Re-downloads the bundled fonts (see below)                                                                                                  |

### Stock photos

The Photos panel is backed by [Unsplash](https://unsplash.com), and so is the
background library behind the page's **Browse the background library** button.
Searching and the browse rows both go through the Unsplash API, so it needs a
key:

1. Register a free application at
   <https://unsplash.com/oauth/applications> and copy the **Access Key**.
2. `cp .env.example .env.local` and fill in `UNSPLASH_ACCESS_KEY`.
3. Restart the server — the file is read at startup.

The key is read server-side only and is never in the client bundle. The browser
talks to `/design/imgs`, which proxies to Unsplash, caches each result for ten
minutes and hides the key. That caching matters: a free Unsplash application is
capped at 50 requests an hour, which an infinite-scrolling grid would otherwise
spend in a couple of minutes. Apply for production access on the Unsplash
dashboard to raise it to 5000.

Without a key, both panels fall back to the sample images bundled in
`service/src/mock/materials/photos`, and search says so instead of pretending.
The same goes for a rejected key or a spent rate limit — each gets its own
message in the panel rather than an empty grid.

The chips above the library are stored searches. Change what they cover by
editing `BROWSE_CATEGORIES` in `server/content-library.mjs` (the queries) and
the list of the same name in
`src/components/modules/panel/wrap/PhotoListWrap.tsx` (the chip labels). The
library has no "everything" shelf, so one chip is always in force. The
background library browses the second of them; `BACKGROUND_CATE` in
`src/components/modules/panel/wrap/BgImgListWrap.tsx` picks which.

Unsplash's API terms ask that apps credit photographers and report when a photo
is used. Hovering a thumbnail shows the photographer, and placing one pings the
photo's `download_location` through the proxy.

### Uploads

Uploads are the first section of the **Photos** panel, above the stock library:
a dashed **Upload** tile and everything this browser has taken in, with a menu
on hover to remove one. They used to have a rail tab of their own, which put a
picture you had just added two clicks away from the pictures you were choosing
between.

Pictures you add — the Upload tile, a pasted screenshot, a background image —
are stored in the browser, in IndexedDB. There is no account system and no
upload endpoint in this fork, so there is nowhere else for them to go; upstream
posted them to a Chinese CDN this project has no account for, which is why
uploading used to end in a thumbnail reading FAILED.

What that means in practice:

- Uploads are per-browser and per-machine. Clearing site data clears them.
- Large photos are shrunk on the way in — the long edge is capped at 2400px and
  anything sizeable is re-encoded as JPEG. A phone photo lands at roughly a
  third of its original weight. PNGs, GIFs and WebP keep their transparency and
  are left alone unless they are oversized.
- Images are held as data URLs, so they survive a reload, embed cleanly into a
  PowerPoint export, and never taint the canvas during a PNG export.

`src/common/methods/localUploads.ts` is the whole of it, and the seam to replace
when embedding the editor in an app that has its own file store: keep
`saveUpload` / `listUploads` / `deleteUpload` and change what is inside them.

### Content, and the optional backend

`npm start` serves the bundled content library too, so Templates, Graphics
(stickers, shapes, masks) and Photos all have content with nothing else
running. That content lives in `service/src/mock` as plain JSON. Upstream only
serves it through the Express app in `service/`, which pulls in Puppeteer and a
Chromium download purely to render screenshots — a lot of setup for a folder of
JSON — so `serve.mjs` answers the read-only lookups directly.

`npm run dev` answers them the same way, from the same code
(`server/content-library.mjs`, mounted as Vite middleware), so the panels
behave identically either way.

You still need the real `service/` backend to _save_ designs or templates, and
for server-side rendering of the trickier exports. Set `DESIGN_API_URL` to
point the editor at it — or at your own backend, to supply your own content.

If the app is served some other way with no backend at all, it degrades rather
than erroring: the panels show empty states and one informational line is
logged.

See **[CONTENT.md](CONTENT.md)** for how to add your own shapes, stickers,
masks, photos and templates.

**The bundled templates, stickers and element groups are this fork's own.**
Upstream's two Chinese phone posters are gone. In their place: 52 templates —
27 school posters, notices, a certificate, a door sign and a twelve-slide deck,
plus 25 themed presentation slides — along with 30 school stickers and 74
sample element groups. All of it is generated by the scripts in `tools/` and
committed, so it works out of a fresh clone and is straightforward to swap for
your own.

## What changed from upstream

**Language.** Every user-visible string is English, written for teachers and
office staff rather than designers. One Chinese literal survives on purpose:
`psd/index.ts` matches the Photoshop layer name `背景`, which is data inside a
`.psd` file rather than interface text.

Comments are a different matter. The interface layer was translated as it was
rewritten, but upstream's Chinese comments remain throughout `packages/`,
`service/` and much of `src/` — a few hundred short trailing notes. They are
comments only; nothing a user sees goes through them. Translating them is a
standing chore rather than a blocker.

**Fonts.** The Chinese font list is replaced with 26 open-licence English
families (SIL OFL / Apache 2.0), bundled in `public/fonts` instead of loaded
from a CDN. That means they work offline and render identically in the editor
and in every export. Google serves most of them as a single variable file, so
each family ships once and `fonts.css` declares a 400–700 weight range, which
makes bold interpolate properly instead of being faked by the browser. See
`public/fonts/LICENSES.md`. The picker lists them as one scrolling menu with a
heading over each category, which sticks while its own families go by; the menu
opens on the family the box is already set in, and flips above the field when
there is no room below it.

**Look.** One accent colour, a small neutral ramp, hairline borders, no
shadows or gradients. Every colour in the editor comes from the tokens named in
`src/assets/styles/tokens.less`, so it can be re-skinned from one file. No
features were removed — the toolbar was regrouped, panels were flattened, and
section headings were set in quiet uppercase.

**The panels on the left.** Templates, Graphics, Text and Photos are each a
search box and a row of category chips over a scrolling body of named sections.
Everything you can put on the page is drawn as the same card — a thumbnail of
its own shape, its name, and a line of metadata set in a mono face (a template's
pixel size, a photographer's name, a sticker's title). Two tabs are gone:
**Elements** is now **Graphics**, and **Uploads** is the first section of
**Photos**. Templates additionally opens on **Your designs**, when the backend
this fork talks to has any to give.

**Dark mode.** New. See below.

**Uploads.** New — they used to go to a server that does not exist here, and
they now live inside the Photos panel rather than a tab of their own. See
below.

**Page sizes.** The Chinese e-commerce presets (WeChat article headers, product
listing pages) are replaced with sizes a school actually uses: slides, Letter,
A4, flyers, name badges, display boards.

**The tool dock.** New — the Tools panel is now a floating dock at the foot of
the canvas, and its Text tool draws the box the words go in. See below.

**Lines and arrows.** New — a Line tool and an Arrow tool. See below.

**Image adjustments.** New. See below.

**Background removal.** New. See below.

**Formatting part of a text box.** New — bold, italic, underline,
strikethrough, a colour or a link on a selection rather than on the whole box.
See below.

**Curved text.** New. See below.

**Gradients.** New. See below.

**PowerPoint export.** New. See below.

**Defaults.** The app name links to `HOME_URL` rather than the original
project's marketing site.

## Resizing a design

The reuse people actually ask for: the flyer that worked becomes a slide, or a
display board, without rebuilding it. **File → Resize design…**, or the sheet
name under Page in the settings panel. The width and height beside it can also
be typed straight in, which runs the same resize with the artwork fitted to the
new shape.

Three decisions, in the order you make them. How big — by preset or by typing a
size. What happens to the artwork:

| Choice        | What it does                                                     |
| ------------- | ---------------------------------------------------------------- |
| Scale to fit  | Everything grows or shrinks together and stays on the page       |
| Fill the page | Fills the new shape; the edges of the design may fall outside it |
| Keep sizes    | Nothing is resized, the design is recentred                      |

And, once a design has more than one page, whether it applies to the page you
are on or to all of them.

Every choice scales the whole composition by a single factor about the centre
of the page, rather than mapping each element's position proportionally.
Proportional mapping is the obvious approach and the wrong one: it moves
elements relative to each other, so a caption drifts away from the photo it
belongs to as the aspect ratio changes. Scaling as a unit keeps every
relationship in the design and simply lands it, centred, on the new page.

Adding a fourth behaviour means adding one object to `RESIZE_STRATEGIES` in
`src/common/methods/resize/strategies.ts`. Nothing else knows what is in that
list — the dialog renders whatever it finds, and the store action looks
strategies up by id.

## Page sizes and units

The preset list in **New design** and in **Resize design…** is the paper a
school actually prints on: Letter and Legal, A3, A4 and A5, in both orientations
where both are used, alongside the screen sizes. Every print size is its real
sheet at 150 DPI — A4 is 210 × 297mm, which is 1240 × 1754 pixels — so a page
picked from the list comes out of the PDF exporter as the sheet it is named
after. See [PDF export](#pdf-export-and-export-quality) for why 150.

Under the width and height boxes is the unit those two boxes are read and typed
in: **px**, **in**, **mm** or **cm**. It is a way of reading the same page
rather than a property of it — the design is stored in pixels whatever is
chosen, so switching between units cannot change anything, and 210 × 297mm typed
in by hand is the same page the A4 preset gives you. Type in centimetres if
that is how the display board was measured, and pixels if the design is for a
screen.

The panel's own Page size readout says both: the pixels, and what the page is on
paper underneath — "A4 landscape · 297 × 210 mm". Anything that is not a
recognised sheet still gets its real size, so a slide reads as the 325 × 183mm
it would print at.

`src/common/methods/pageSize.ts` owns the conversion and the list of sheets;
both dialogs and the panel read it, so there is one answer to "how big is this
really" rather than three.

## Pages

The strip along the bottom. Collapsed it is a pill telling you where you are;
expanded it is a row of thumbnails.

- **Reorder** by dragging, or with Move left / Move right in a page's ⋯ menu.
  Drag is not offered as the only way: it cannot be done from a keyboard, and it
  is awkward once the strip has scrolled.
- **Duplicate** copies a page and its artwork. Every element is renumbered, and
  grouped elements are re-linked to the copy's own container rather than the
  original's.
- **Rename** a page and the name shows under its thumbnail and in the collapsed
  pill. Unnamed pages show their position instead.
- **Delete** asks first, but only when there is artwork to lose. The last page
  is emptied rather than removed, because every part of the editor assumes there
  is a current page.

Up to 50 pages, raised from upstream's 9, which is too few for anything
presentation-shaped. It is a ceiling rather than a target: every page is held in
memory and written into the autosave, and the expanded strip renders each
thumbnail in full.

What a page operation _means_ lives in `src/store/design/widget/actions/pages.ts`
rather than in the strip, so that keeping the current page index, the widget
list and the canvas in step is written once instead of once per button.

## Hiding the panels

The editor is three columns: the rail of tabs on the far left, the panel that
tab opens beside it, and the design panel on the right. Either panel can be put
away — the chevron in its own top corner, or clicking the rail tab that is
already open — leaving a 26px strip in its place that brings it back. The rail
itself never goes, so every panel is still one click away.

The workspace is re-measured when a panel comes or goes, so the page recentres
and, at "Fit to screen", grows into the room it has just been given. Which
panels you had hidden is remembered between sessions: it belongs to you rather
than to the design, so it is kept in the browser and never saved into a file.

## The Design tab

The panel on the right has two tabs. **Design** is what you have selected;
**Layers** is everything on the page.

The Design tab opens with the thing itself: a badge for the kind of element it
is, the name it goes by in the Layers tab, and buttons to duplicate or delete
it. Under that is the align row — three ways across the page, three ways down —
and then the element's own settings, in the same order whatever is selected:

- **Transform** — X, Y, width, height and the angle, two to a row, over the
  arrange buttons that move it through the stack.
- Whatever only this kind of element has: a box's corners, a polygon's sides, a
  path's points, a photograph's crop, a text box's type.
- **Appearance** — how solid it is, what it is filled with, and its border. A
  fill and a border are each one row: a check that switches it on, the colour
  it paints, its name, and a pencil that opens the picker. The hex sits under
  the row, and says which of the school's colours it is when it is one of them.
- **Effects** — the drop shadow, and for text the effect presets and the curve.

With nothing selected the tab says so and shows the page instead: its size, the
sheet it would print on, its background, and the two things the editor draws
over it while you work — snapping and the grid.

Every section is an uppercase eyebrow over its content with a hairline running
the full width of the panel between one and the next, so the tab reads as a
stack of settings rather than a list of boxes.

## Layers

The Layers tab in the panel on the right lists everything on the page, topmost
first, with a group's members under the group itself. Drag a row to change what
sits in front of what.

A row is the kind of thing it is — one character in a small tinted square, or a
thumbnail for a photograph — then its name, then two toggles. Double-click a row
to rename it; clearing the name hands it back to the element's own text. Both
toggles are on every row, always: the state a layer is not in is drawn quietly
and the state it is in is drawn bright, so which layers are hidden or locked is
something you read off the list rather than something you have to go looking
for.

- **Lock** holds an element where it is. It is still drawn and still exported,
  and it can still be selected — that is how you see it is locked — but it will
  not move. See [Arrange and lock](#arrange-and-lock).
- **Hide** takes it off the canvas until you show it again. A hidden layer is
  not drawn at all rather than made faint, so nothing can click it, drag onto
  it or snap to its edges, and it is absent from the PDF, the PNG and both
  PowerPoint exports. It is how you keep last term's version of a poster in the
  file without it appearing in this term's.

Hiding a group hides what is inside it. Hiding the layer you had selected lets
go of it, because there is nothing left on the canvas for the selection box to
hold. Both toggles belong to the design, so they are saved with it and undo
puts them back.

## Arrange and lock

What sits in front of what. Every element's Transform section carries an arrange
row, and the same four moves are in the right-click menu and on the keyboard:

| Move           | Shortcut           |
| -------------- | ------------------ |
| Bring forward  | Ctrl/⌘ + ]         |
| Bring to front | Ctrl/⌘ + Shift + ] |
| Send backward  | Ctrl/⌘ + [         |
| Send to back   | Ctrl/⌘ + Shift + [ |

Forward and backward move one place at a time, which is what you want for a
caption that has to sit just above one photo. Front and back go the whole way,
for the background that belongs behind everything or the badge that has to come
out on top of it all. A group travels as one thing — its members go with it and
keep their order — and a member of a group can only move within the group. All
of it undoes with Ctrl/⌘ + Z.

**Locking.** A locked layer stays exactly as it is. It can still be clicked —
that is how you see it is locked, and how you unlock it — and its box is drawn
as a dashed line with no handles. What it refuses is everything that would
change it: moving, resizing, turning, nudging with the arrow keys, deleting,
grouping, and moving through the stack. Each refusal says so in a short notice
rather than silently doing nothing. Drag boxes and Select all leave locked
layers out, so the rest of the page can be moved around them.

Lock and unlock from the padlock at the end of the Arrange row, the right-click
menu, the Layers tab, or Ctrl/⌘ + Shift + L. A lock belongs to the design, so it
is saved with it and undo puts it back.

**Resizing several at once.** Select more than one thing — drag a box round
them, or Shift-click — and the box round the lot has corner handles. Dragging a
corner scales everything inside together: positions, sizes, and the type in any
text, so a heading and its caption stay in proportion to each other and to the
photo between them. There are no side handles on a multi-selection on purpose:
a side handle would have to stretch each layer by a different amount, and a
heading and a photograph do not distort alike.

**Turning.** The handle under the selection box rotates it, and the angle is
read out beside the pointer as you go. Hold Shift to turn in steps of 15°. Even
without it, square and the diagonals — every multiple of 45° — pull the handle
in from a couple of degrees away, gently enough that 43° is still there if 43°
is what you want.

## The right-click menu

Right-click anything on the page and the menu is what you would do to it: Copy,
Paste, Duplicate, the four stacking moves, Lock or Unlock, Hide, Delete — and
Ungroup, on a group. Right-click a selection of several and it changes to what
applies to all of them at once: Copy, Paste, Duplicate, **Group**, Hide, Delete.
The stacking moves are left off that list on purpose; they take one layer
through the order, and "bring these four forward" has no single answer.

The box Moveable draws round a selection sits over everything inside it, so a
right-click aimed at several things lands on the box rather than on the page.
That opens the menu for the selection, which is what was being pointed at.

Everything here does the same thing the panel and the keyboard do, from the same
place — see `arrangeLayer` — so a move cannot mean one thing on the menu and
another on Ctrl/⌘ + ]. The menu acts on the layer you pointed at rather than on
whatever happened to be selected a moment earlier, which is what the right-click
was in the middle of changing.

## Grid

**File → Show grid** rules the page into squares, and **Grid spacing** on the
row underneath sets how big they are: 25, 50 or 100 design pixels. Choosing a
spacing turns the grid on, because asking for 25px squares and being handed none
would be a strange answer. The same pair sit under **Canvas** in the page
settings, where the size can be any number of pixels rather than one of the
three. The setting belongs to you rather than to the design
— it is remembered between sessions, like the snapping toggle and the theme, and
it never travels to whoever opens the file next.

With the grid on, dragging and resizing line up on it as well as on the other
things on the page, so a row of certificates or a seating plan comes out even
without measuring anything. Grid snapping rides on the same **Snap to objects**
toggle: turn snapping off and the grid is drawn but nothing sticks to it.

The grid is drawn for you and nobody else. It is not in the PNG, not in the PDF,
not in either PowerPoint export, not in the page-strip thumbnails and not in the
presenter. It sits inside the page — which is how it scales with the zoom
without any arithmetic of its own — and marks itself `data-export="off"`, which
the exporter strips from its copy of the page before rendering. The lines
thicken as you zoom out so a grid line stays a hairline at 25% instead of fading
away.

## Outlines and keylines

Shapes and photographs both take a **Border** in the Appearance section: a row
with a check, the colour it is drawn in and a pencil that opens the picker, over
a thickness and a choice of solid, dashed or dotted. The check is the thickness:
switching it off puts the thickness to zero and switching it on brings back what
was last set. Nothing is drawn until the thickness leaves zero, and the style
only appears once there is a line for it to apply to.

The line is always drawn inside the element's own edge, so outlining something
never makes it bigger. The selection box still fits what you can see, a shape on
the edge of the page keeps its outline when the page is exported, and turning
the thickness up does not nudge anything else out of the way.

- **A shape is outlined along its own geometry**, so a circle gets a ring and a
  speech bubble keeps its tail. The stroke is measured in the shape's own
  viewport rather than in the stretched coordinates it is drawn in. Without
  that, a square pulled into a wide banner would come out with a fat top edge
  and thin sides.
- **A photograph gets a ring laid over it**, sharing its corner radius so the
  two curve together. A photograph poured into a container shape is outlined in
  that shape rather than in a rectangle. The ring is cut from the mask itself,
  so it narrows a little where the silhouette comes to a point.
- **Line drawings are left alone.** The stickers in the Graphics panel are drawn
  as strokes rather than as fills, and adding to that stroke would fatten the
  drawing and take its colour off rather than outline it. The setting does
  nothing to them.

An outline belongs to the design, so it is saved with it, undo puts it back, and
the page thumbnails draw it as well as the canvas. It survives the PNG, the PDF
and both PowerPoint exports. A photograph wearing a keyline goes into a .pptx as
a picture of itself, because a PowerPoint picture has no keyline of its own to
set.

## Shadows

Text has carried shadows all along, as one feature of a stacked text effect.
Photographs and shapes had nothing. Both now have a _Drop shadow_ row under
**Effects**: check it on, open the picker from the swatch beside it, and set a
blur and an x/y offset underneath. There is no shadow until it is switched on.

The shadow traces what the artwork paints rather than the box it sits in, so a
cut-out PNG casts the shape of what is in it, a shape casts its own outline, and
a photograph with rounded corners or a keyline casts those too. It is a CSS
`drop-shadow` rather than a `box-shadow` for exactly that reason.

- **It belongs to the whole element**, so flipping a photograph mirrors the
  picture without swinging its shadow to the other side, and rotating one turns
  the shadow with it.
- **It steps aside while you crop.** The crop frame and its grips live in the
  same box as the photograph, and each of them would otherwise pick up a shadow
  of its own. It comes back when you are done.
- **Switching it off clears it**, rather than saving a shadow that is turned
  off. The panel holds on to what you had set, so switching it back on returns
  the same shadow.

A shadow is saved with the design, undo puts it back, and the page thumbnails
and the presenter draw it as well as the canvas. It survives the PNG, the PDF
and both PowerPoint exports — the rasteriser cannot draw a CSS filter, so a
shadowed element is pre-rendered by the browser instead, with room left round it
for the shadow to fall into. A .pptx gets a real PowerPoint shadow rather than a
picture of one, so whoever opens the deck can still edit it.

## The tool dock

The row of tools that floats at the foot of the canvas: **Select**, **Text**,
**Shapes**, **Pen**, **Image**, and then **QR code** and **Table**. It replaced
a left-hand Tools tab, which spent a whole panel on seven buttons and pushed the
board over to do it.

Select puts the pointer back, which is also what Escape does. Text arms a tool
rather than dropping a box: see below. Shapes opens a row of five above the dock
— rectangle, ellipse, polygon, line and arrow — and Pen has a slot of its own
beside them, being a way of drawing rather than a shape. Image offers a file off
this machine or the Photos panel. QR code and Table put theirs on the page
outright.

Every tool keeps its keyboard shortcut: `T`, `R`, `E`, `Y`, `L`, `A`, `P` arm
and disarm the matching tool wherever the pointer is. While one is armed the dock
says what it is waiting for on a green line above itself, with an **Esc** chip
on the end that puts the pointer back. The rubber band while a shape is being
pulled out is the shape that is coming rather than the box it came from: a circle
for the ellipse tool, and for the polygon tool the polygon itself, drawn from the
same geometry the widget is painted with.

The dock, the page chip and the zoom pill share the bottom of the well. Open the
speaker notes and all three rise by the height of the drawer; open the page
strip and the dock stands on that too.

The dock is `src/components/business/tool-dock/`; what each tool is called, what
its shortcut is and what it says once armed is `drawTools.ts`, which the drawing
components read as well, so the dock and the canvas cannot describe a tool
differently.

### Drawing a text box

The **Text** tool, on the dock or the `T` key, is Adobe XD's: it arms, and the
page answers it two ways. **Drag** and you pull out a box of exactly that width,
which is what the words wrap at. **Click** and a box of a readable default width
is placed at that point. Edges are pulled into line with the page and everything
on it the same way a dragged shape's are, and Escape cancels a box mid-drag.

The box arrives empty, selected, with the caret already in it, so the first
thing you do after drawing one is type rather than double-click. A box you never
typed anything into is taken back off the page when the caret leaves it, which
is also what XD does — without it a mis-aimed click leaves an empty layer with
no height, which nothing on the canvas can show you.

The height follows the words, as it does for every text box in this editor: a
`w-text` is fixed in width and laid out by the browser down the page, so the
height you drag is the height it starts at rather than a floor it keeps.

It is `src/components/business/draw-shape/DrawText.tsx`, beside the shape tools
and built the same way — a capture-phase press on the document, a rubber band
drawn inside the page, `recordHistory` round what it adds.

## Lines and arrows

The **Line** tool, behind Shapes on the dock, or the `L` key. Two gestures, the
same two Adobe XD has: drag from one point to the other, or click once to put
the start down and click again to finish, with a rubber line following the
pointer in between. Shift holds it to a right angle or a diagonal, Alt draws it
out from the middle, and Escape takes back a line that has only one end down.

**Arrow** sits beside it in the same menu, on the `A` key, and is the same two
gestures again — what it leaves behind is a line with a triangle on its far end.
It is not a tool of its own: it arms the line tool carrying the `Arrow` preset,
which is what puts the head on. An arrow being the line most people are actually
after, it is worth a button rather than a trip to the panel.

The Graphics panel's **Arrows** row is that same trick with the other presets —
a double arrow, a dashed one, a dotted rule. Clicking one arms the line tool
carrying that preset's heads and dash — the tile stays lit and the dock says
what is coming — and the arrow is then drawn between two points like any other
line, rather than landing ready-made in the middle of the page where it has to
be moved and resized before it points at anything. Clicking the lit tile puts
the pointer back; arming the plain Line tool afterwards draws a bare line. The
panel's Arrow tile and the dock's Arrow item are one armed state, so either
lights both.

A line is an open path, so it takes the same stroke colour, thickness and dash
as any other path, and its points can still be moved. What is new is the ends:
select the line and the settings panel shows **Line ends**, with a picker for
each end — an open arrow, a filled triangle, a dot, a bar or nothing — and a
button to swap the two over. A head is sized from the stroke, so thickening the
line thickens its arrowhead with it, and painted in the stroke's colour.

The heads are drawn as ordinary SVG geometry rather than as SVG markers.
The rasteriser has no SVG renderer at all, so a path is exported by serialising its
whole `<svg>` into an `<img>` and letting the browser draw it; a polygon inside
that `<svg>` comes through the same door, where a marker would not. The line is
also drawn back to where a solid head begins, so a dashed stroke stops at the
arrow rather than running on through it.

Closing a path takes its heads off — a closed shape has no ends to put them on —
and both the switch and the pickers refit the frame afterwards, so the line
stays where it was drawn even though a head needs more room round the curve than
a bare stroke does. Every change is one undo entry, and the heads draw in the
page thumbnails, the presenter and the PNG, PDF and PowerPoint exports.

## Adjusting a photo

Select a photograph and the settings panel has an **Adjust** section, folded
until you want it. Inside are six looks to start from — Original, Warm, Cool,
Black and white, Vivid, Faded — and a slider for each adjustment underneath:
brightness, contrast, saturation, warmth, blur, black and white, and sepia.
**Reset** puts the photograph back to how it arrived. The section heading says
which look is on, or _Edited_ once the sliders have been moved off one.

Warmth runs both ways from the middle: warmer is a sepia wash, and cooler is the
same wash with the hues turned half way round and back again, which lands it on
the blues instead of the yellows. CSS has no cooling filter of its own.

The adjustments are applied to the picture and not to the frame around it, so a
keyline stays its own colour and a drop shadow keeps its edge whatever is done
to the photograph inside them. A design only carries the adjustments that have
actually been moved, and none at all when none have, so a design saved before
any of this existed reads exactly as it did.

Dragging a slider is one undo entry however far the thumb travels. The page
thumbnails and the presenter draw the same adjustments the canvas does, and so
do the PNG and PDF exports — the rasteriser cannot draw a CSS filter, so an
adjusted photograph is pre-rendered by the browser first, the same path a shadow
takes. A .pptx gets a picture of the adjusted photograph rather than the
original with the adjustments quietly dropped, because PowerPoint has no way to
brighten, blur or wash a picture that would survive the round trip.

## Removing a background

Select a photograph and press **Remove background** in the settings panel. What
comes back is the same picture with everything behind the subject cut away to
transparency, which is what a head-and-shoulders photo needs before it goes on a
certificate or a staff board.

The cut-out replaces the picture and nothing else: the crop, the size, the
corner radius, the keyline and any adjustments are all still there, because only
the image behind them changed. The original is kept, and **Restore original**
puts it back — the cut is a guess, and on a busy photograph it sometimes takes
an ear off. The whole thing is one undo entry either way. The cut-out is stored
the way an upload is, as a data URL run through the same downscaling rules, so
it survives a reload and embeds cleanly into a PowerPoint export.

### Where the work happens, and why not the obvious library

In this browser, on this computer. The photograph is not uploaded anywhere.

The catch is the model, which is a 44MB download the first time anyone on a
machine presses the button. After that the browser has it cached and the feature
works offline; before that it needs a connection, and says so rather than
failing silently. Expect a few seconds per photograph on a school laptop.

The two libraries every tutorial reaches for are both unusable here.
**`@imgly/background-removal` is AGPL**, which reaches into whatever closed
application the editor is embedded in — the whole point of
[Using it inside School Planner](#using-it-inside-school-planner). And **BRIA's
`RMBG-1.4`, which is what most browser demos actually run, is licensed for
non-commercial use only**, whatever the licence field on the dozen re-uploads of
it says. The IS-Net weights it shares an architecture with are AGPL again.

So the built-in path is [Transformers.js](https://github.com/huggingface/transformers.js)
(Apache 2.0) running
[`onnx-community/ormbg-ONNX`](https://huggingface.co/onnx-community/ormbg-ONNX),
which is Apache 2.0 and — unusually, and the reason it was picked over the MIT
BiRefNet and BEN2 ports — so is the data it was trained on. Licences on model
weights are only worth as much as the provenance behind them. The library is
bundled rather than loaded from a CDN, for the same reason the fonts and the
icon font are; only the weights come from the network, and they come from
Hugging Face's CDN.

Note that `npm install` grows by a few hundred megabytes for this, most of it
ONNX Runtime's Node build and `sharp` — neither of which is used or shipped,
but both of which Transformers.js declares.

### Pointing it somewhere else

`src/common/methods/backgroundRemoval.ts` is the seam, and it tries three things
in order:

| Who does the work | How to say so                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A host app's own  | `setBackgroundRemover(async (blob) => blob)`, exported from the package                                                                    |
| A server          | `configure({ BACKGROUND_REMOVAL_URL: '/api/cutout' })` — the picture is POSTed as the request body, and a transparent PNG is expected back |
| The browser       | the default above; `BACKGROUND_REMOVAL_MODEL` swaps the model, including for a folder of the same shape served from your own origin        |

`configure({ BACKGROUND_REMOVAL: false })` takes the button away entirely, for a
deployment that would rather not offer it.

## Formatting part of a text box

Bold one word of a heading, put the date in red, turn a phrase into a link. Every
other text setting — typeface, size, line height, letter spacing, alignment,
curve, effects — is still a property of the whole box, and says so.

There are two ways in, and they do the same thing:

- **A small bar floats over the selection** while you are typing: bold, italic,
  underline, strikethrough, a colour and a link. It is where people look first,
  because it is where the words are.
- **The panel's own buttons follow the caret.** With a run of text selected,
  Bold, Italic, Underline, Strikethrough and Colour apply to that run and show
  what it already is. With the caret merely sitting in the box they apply to the
  whole of it. A line between the two rows of buttons says which of the two is
  about to happen, so nobody has to guess.

**Ctrl+B, Ctrl+I and Ctrl+U** work while typing. **Escape** ends the edit —
unless a picker or the link field is standing open over the box, which takes the
first Escape for itself.

**A box that is bold all over stays that way.** Pressing Bold inside a heading
whose weight belongs to the box takes the weight off the box, rather than
writing a span that says "not bold". There is no such thing in the markup below
and no export could carry it. Old designs, whose `fontWeight` and
`textDecoration` sit on the widget, go on rendering exactly as they did.

### What the markup may be

`text` is still one HTML string. What may be inside it is a short list, and
every write goes through it:

```
b/strong   i/em   u   s/strike/del   span[style=color:…]   a[href]   br
div/p/ul/ol/li
```

Everything else is read for its words and dropped: fonts, sizes, classes,
backgrounds, tables, images, stylesheets, scripts. A colour is normalised to
`#rrggbb`, and a link to an `http`, `https`, `mailto` or `tel` address — a
`javascript:` URL never gets through the door. Markup is parsed in an inert
document, so a pasted design cannot even fetch an image on the way past.

The writing is canonical: the same runs always come out as the same string, in
a fixed order of tags, nested as little as that order allows. That is what keeps
the box from being rewritten under the caret on every keystroke.

The browser's own editing commands do the work — `document.execCommand` —
because they keep the caret and the field's own undo stack, which rewriting
`innerHTML` would throw away. What they produce does not matter. Whether
Chromium writes `<b>` or `<strong>`, a `<span>` or a `<font>`, it is read back
into runs and written out again in the one canonical form when the edit is
stored. That is the whole reason the sanitiser is a parser and a serialiser
rather than a list of forbidden tags: there is one description of what the
markup may be, and everything downstream reads it through the same door.

**A paste is plain text** unless it was copied out of one of these boxes, which
a marker comment in the clipboard's HTML says. So a paste from a web page or a
Word document arrives as words rather than as 14pt Calibri on a white
background, and a copy from one text box to another keeps its bold and its
links.

**Retyping in the panel keeps the formatting.** The text area at the bottom of
the panel is plain text, and a change made there is nearly always a word or two,
so the new text is matched against the old line by line and only the characters
that actually changed lose their styling.

### What survives where

|                               | Bold, italic, underline, strike | A colour on part of the text | A link                                  |
| ----------------------------- | ------------------------------- | ---------------------------- | --------------------------------------- |
| Canvas, thumbnails, presenter | yes                             | yes                          | followed in the presenter, in a new tab |
| Curved text                   | yes                             | yes                          | not marked, and not followed            |
| PowerPoint                    | yes, as run properties          | yes                          | yes, a real hyperlink                   |
| PDF and PNG                   | yes                             | yes                          | no, the page is a picture               |

**PowerPoint gets real runs.** A line becomes a paragraph and each formatted
piece of it a run carrying its own `bold`, `italic`, `underline`, `strike`,
colour and `hyperlink`, so what comes out is editable text rather than a picture
of it. A bulleted box still gets real bullets. A curved run is the exception it
already was, and goes in as a picture.

**A curved line is a character per element**, each drawn and measured in its own
weight and slant, since a bold glyph is wider than a regular one, and painted in
its own colour. An underline there is drawn under each character's own box, so
it follows the arc as a run of short strokes rather than one smooth curve — good
enough to read as an underline, and the alternative was not drawing it. A link
is the one thing an arc drops: a character there is its own element rather than
part of an anchor, so there is nothing to click and nothing to carry the link's
underline, and a linked word on a curve is just a word.

**A link is drawn as an underline in the text's own colour**, not in browser
blue, so it sits in the design like the rest of the line. On the canvas a click
selects the box; in the presenter it opens the address in a new tab, so the talk
is still on screen when the tab is closed.

**PDF and PNG are pictures of the page**, so a link in them is not clickable and
never will be. That is not a gap waiting to be closed: it is what those two
formats are for here. PowerPoint is the editable route, and it carries the link.

**Find and replace reads straight through the formatting**: "14 June" is found
whether or not the "14" is bold. A replacement that spans a bold edge lands
inside the first piece it touched, which is the only reading of "replace this
run" that leaves the surrounding markup standing. Merge fields fill through the
same matcher, so `{{name}}` may be styled like any other words. See Find and
replace above.

Relevant code:

```
src/utils/widgets/richText.ts     the allowlist: markup to lines of runs and back
src/components/modules/widgets/wText/
  inlineFormat.ts    the selection while a box is being typed in, and what the
                     controls do to it
  InlineToolbar.tsx  the bar that floats over the selection
src/common/methods/export/textRuns.ts   the same markup as PowerPoint text runs
```

## Curved text

What a badge, a crest or a Sports Day header is set on. Select a text box and
drag **Curve**, on the _Curve text_ row under Effects in the settings panel, or
type the angle into the field beside it — −180 to 180, arrow keys stepping by
one and Shift by ten.

The number is the sweep of the arc in degrees, not a radius: half a turn is half
a turn whether the line is one word or six, where a fixed radius would bend a
long line round on itself and barely touch a short one. Positive arcs over,
negative hangs under, and zero is straight.

- **The box is fitted to the arc**, so the selection, snapping and the exported
  crop all follow the shape rather than the line it was before. That is also why
  the side handle goes away while a run is curved: how wide the text may run
  before it wraps is no longer yours to set. The corner handle, which scales the
  type, works as usual.
- **Deepening the curve keeps the text where it stands.** The ends of a line
  draw in as it bends, so the box loses width; half of what it loses is given
  back to the left edge instead of letting the text creep across the page.
- **Straightening it gives the box back.** Going to zero puts the width the
  line had before it bent back on the box, off the same edge, and measures the
  height off the straight run again. A box that arrived from a saved design
  already curved has no earlier width to return to, so it is given the width
  the words need laid out flat.
- **Text effects follow it.** Every layer of an outline, a fill or a shadow is
  drawn along the same arc, so a curved heading can carry the same presets a
  straight one can.
- **Typing straightens it out.** There is nowhere to put a cursor in an arc —
  each character is its own element — so double-clicking gives you the plain
  line to edit, and it curves again when you click away. Text effects already
  behaved this way.
- **Two lines are drawn concentrically**, on one circle, a line's height apart.
  Each keeps its own letter spacing, so the inner one sweeps further than the
  outer one rather than being squeezed to match it.

Exports need nothing special: the rasteriser draws the turned characters as the
browser does, to within antialiasing, and a curved heading that also carries an
outline or a gradient goes down the same pre-render path those already use. A
PowerPoint export is the exception — a text box there runs in a straight line,
so a curved one is placed as a picture of itself rather than as text that has
quietly straightened out.

The layout is in `src/components/modules/widgets/wText/arcLayout.ts`, apart from
the drawing, so the canvas, the page thumbnails and the presenter all place the
characters the same way.

## Gradients

Following Adobe XD, a fill can be a gradient as well as a flat colour: a shape's
colour, the outline round a shape, the keyline round a photograph, a page
background and a text fill.

Open a swatch and pick Gradient. The tab has two buttons above the ramp, a
square for a linear gradient and a circle for a radial one. Linear keeps the
angle dial beside them. A radial gradient runs from the middle outwards, so
there is no angle to set and the dial goes away. Dragging along the ramp moves
a stop, clicking it adds one, and Backspace takes the selected one out, as
before.

**A shape carries its gradient with it.** An SVG attribute cannot hold a CSS
gradient the way `background` can, so a gradient becomes a paint server in the
shape's own `<defs>` and the `fill` or `stroke` refers to it. One paint server
serves the whole shape rather than one per path, so a gradient runs across the
artwork instead of starting again on every path. An outline's paint server goes
in the same `<defs>` as its clip paths, so removing the outline removes the
gradient with it.

**A gradient keyline on a photograph is always solid.** `border` takes a colour
and nothing else, so a gradient keyline is the whole element painted and then
masked down to its own padding, and a ring cut from a mask has no run of line to
break into dashes. A picture poured into a container shape was already a ring
of background, so it only needed that background widened from a colour to
anything CSS can paint.

The gradient itself is parsed and written in
`src/packages/color-picker/utils/gradient.ts`, the SVG paint servers are in
`src/utils/svgPaint.ts`, and a shape's colours in
`src/components/modules/widgets/wSvg/shapePaint.ts`. The static renderer paints
through the same code, so page thumbnails, presentation mode and every export
draw a shape the way the canvas does.

## Brand kit

The **Brand** tab in the left-hand rail. The school's crest, its colours, its
two fonts and its contact line, set once and then used by everything else.

A school office makes the same handful of things over and over — a notice, a
flyer, a slide deck — and every one of them carries the same name, the same
crest, the same navy, the same address at the bottom. Without somewhere to keep
them they get retyped and re-picked each time, and each time slightly
differently: the name in three capitalisations, four navies within a few points
of each other, the old phone number on the newsletter nobody caught. The kit
holds them once.

Everything typed into the panel is **saved as it is typed**. There is no Save
button and no dialog. It lives in the browser's IndexedDB, in the same database
as the uploads and the draft, so it is there the next morning; when the editor
is embedded, the host app hands the kit in and is told about every change
instead — see [EMBEDDING.md](EMBEDDING.md).

The panel opens on **the school itself**: a card carrying the crest, the name
and the tagline, and under them **Apply brand to this design** with a sentence
saying what pressing it would do and how many pages it would reach. It is first
because it answers the question anyone opening this tab has — is my kit set up,
and what will it do to this design. The five blocks below it are the pieces that
card is made of. An empty kit shows a checkerboard and _Your school_, and the
button is off, because there is nothing yet to apply.

- **Logo.** One logo, shown as a tile you click to put it on the page — at a
  fifth of the page's width, and never larger than the file itself, so a small
  crest is not blown up soft. The × on the tile takes it out; the dashed tile
  beside it uploads or replaces. A PNG or an SVG is never re-encoded as JPEG,
  so a crest with a transparent background keeps it rather than picking up a
  white box (the same rule the Uploads panel follows — see **Uploads** above).
- **Colours.** Up to eight, main colour first, one row each. Clicking a row puts
  that colour on whatever is selected: the words of a text box, the fill of a
  shape, the first colour of a piece of line art, or — with nothing selected —
  the page itself. That is one undo step. They also appear as a **Brand** row at
  the top of every colour picker in the editor, above the recent colours, so the
  school's navy is one click away from any swatch.

  Each row is labelled by where it sits — Primary, Secondary, Colour 3 — beside
  the nearest common name for the hue, _navy_, _gold_, _paper_. Neither is
  stored: a kit holds an order and a set of colours, and a name typed in once
  would be wrong the moment the order changed.

  Two small samples sit on each row: the colour set as words on white paper, and
  the colour as a band with whichever of white and ink reads on it. They are
  samples rather than ticks, so the colour that cannot be read on paper is shown
  being unreadable and needs no legend; hovering gives both ratios. The editing
  card says the same thing in a sentence — _"Reads on white at 1.3:1 — lighter
  text will be darkened on posters."_ None of it stops a colour going in the
  kit. A school's colour is its colour; the line only says what the editor will
  have to do when it lands on a poster.

  The pencil on a row opens the **editing card** in place of it: the draft
  colour and its hex, a strip of the kit's own colours and the ones this design
  already uses most (`rankDesignColors`), the full picker, and a line saying
  where the colour being edited is painted today. Nothing changes until **Save
  to kit**; **Cancel** leaves the row as it was, and a quiet **Remove from kit**
  takes the colour out. Editing happens in the row rather than in a popover
  because the strip and that line are the reasons to change a colour at all, and
  neither survives being read through a hole. **Add a colour** opens the same
  card on a fresh colour.

- **Fonts.** A heading font and a body font, each card showing the chosen
  family's name set in that family, at about the size the Apply brand pass uses
  it at — so the pair can be judged as a pair before it is put on a design.
  Both appear as a **Brand** group at the top of the text panel's font list. The
  families stay in their own groups further down too; the group at the top is a
  shortcut, not a filter.
- **Details.** Name, short name, tagline, address, phone, email, website. Each
  box shows the sample school's answer as its placeholder, so an empty kit still
  reads as an example rather than as a form. The card at the top of the panel
  takes its name and its second line from here.
- **Fields.** `{{school.name}}`, `{{school.tagline}}`, `{{school.email}}` and
  the rest, each shown next to what it currently reads as. Clicking one adds it
  to the end of the selected text box, or drops a new text box carrying it in
  the middle of the page.

### Fields, and what a template does with them

A merge field is `{{something}}` typed into a text box, filled in from somewhere
else. The bundled templates are written with them: the footer of the Field Day
poster is `{{school.name|upper}}`, not one made-up school's name. **A template
is filled in as it is added**, so picking it out of the gallery puts your
school's name on it and there is nothing to overwrite. Saved element groups and
a template opened by `?tempid=` go through the same fill.

With **no kit set up at all**, the fields answer with a sample school —
Springfield Elementary, `office@springfield.k12.us`, and so on — which is
exactly the copy the templates used to carry outright. So the gallery looks the
same to somebody who has never opened the Brand panel.

Once _any_ detail is filled in, the kit answers only what it has: an empty email
box leaves `{{school.email}}` standing on the page rather than quietly filling
it with somebody else's. A field nothing answers is always left exactly as it
was, so the author can see what is still waiting.

`|upper` after a field name sets the value in capitals. The bundled footers are
set that way, and a school's name should be stored as it is written rather than
as one template happens to set it.

**A template arrives in the school's colours as well**, when it says which of
its own colours play which part. A template file carries a small `brand` block
beside its artwork:

```json
"brand": { "colors": { "1e3a5f": "primary", "e1a731": "secondary" } }
```

— the Field Day poster naming its navy as the primary and its gold as the
secondary. On the way onto the page every place either colour is painted follows
the kit: the kit's first colour goes wherever the primary was, its second
wherever the secondary was, and so on down to Colour 8. Each place keeps its own
transparency, so the 7% wash behind the poster's details comes out as the
school's first colour at 7%; the page background, the outlines, the stops of a
gradient and the colours inside a text effect are all part of the same pass.
Whites, blacks and greys are never named in a block and never touched, because a
kit says what the school's colours are, not what colour the paper is.

Nothing is guessed here. A role the kit has no colour for — a three-colour
template on a one-colour kit — leaves the template's own colour where it is, and
a kit with no colours at all leaves the palette alone entirely. Adding the same
template twice gives the same design both times.

**And in the school's fonts.** With a heading font or a body font in the kit,
each text box takes the one that suits it: bold text, or text at or above the
heading threshold for that page size, takes the heading font and the rest take
the body. A text box can say which it is for itself with `"brandRole":
"heading"` or `"body"`, and `"keep"` for the one line whose face is the artwork
— a hand-lettered word mark a school font would ruin. A kit that has only a body
font sets the body boxes and leaves the headings as they were drawn, rather than
putting one face on everything.

A template whose palette and lettering are the point of it opts out with
`"keep": true` in the same block, and lands exactly as drawn. The fields still
fill: the school's name is the school's name whatever the artwork is.

**Readable whatever the colours are.** A recolour is a swap of hues, and hues
carry lightness with them. The Field Day poster is a white headline on a navy
band and a navy sub-heading on cream; a school whose primary is a pale yellow
would get a white headline on pale yellow, which is nothing, and a pale yellow
sub-heading on cream, which is nearly nothing. Neither the template nor the kit
is wrong — it is what happens when two independent choices meet — so it is
repaired as the template lands. Every text box the recolour either painted or
moved the ground out from under is measured against
[WCAG](https://www.w3.org/TR/WCAG21/#contrast-minimum)'s targets for its size:
4.5:1 for ordinary text, 3:1 for large text, where "large" is 18pt or 14pt bold
converted at the page's own DPI, so 44px counts as large on a Letter poster and
not on a slide.

Two repairs, and only two. Text that was a **neutral** — the white headline —
swaps to whichever of white and the ink the design already uses can be read on
the band, because a white headline made grey is neither one thing nor the other.
Text in one of the **school's own colours** is darkened or lightened _in its own
hue_, so a pale gold heading comes out a deeper gold rather than a brown or a
black; only when that cannot reach the target inside a bounded shift does it
fall back to ink or white.

A repair does not stop at the first shade that passes. It aims a fifth past the
target — 3.6:1 where 3 is asked, 5.4:1 where 4.5 is — because a line sitting
exactly on the bar is the faintest thing on the page, satisfying the standard
and still reading as an afterthought. The margin is an aim rather than a
requirement: a colour that can reach 3.2 but not 3.6 has been repaired, and a
line that is already over the plain target is not touched at all, which is what
makes running the guard twice leave a design exactly where the first pass put
it.

The marks get the same two repairs, at the decorative 3:1. A **neutral** mark —
the white trophy over the Field Day headline — swaps to the paper or the ink
when the band beneath it becomes a kit colour it cannot be seen on; a mark in
one of the **kit's own colours**, drawn wholly inside a band in another and less
than 1.5:1 from it, is nudged in its hue. Only a mark painted in a single colour
is touched, so a two-colour sticker is left as the drawing it is, and a shape
with words on it, or one covering more than a quarter of what it sits on, counts
as the paper of that part of the design rather than as a mark on it.

Nothing else is touched. Text over a photograph, over a gradient, or over
anything whose colour cannot be worked out is left exactly as it was drawn — the
surface under a text box is the topmost shape whose bounds hold its centre, and
"no idea" is an answer this takes rather than repainting on a guess. The colours
a text effect brought with it stay as they are. The maths is
`src/common/methods/contrast.ts`, which is pure functions and no DOM; the guard
that uses it is `ensureReadable` in `src/store/widget/brand.ts`.

Fields are found in the **rendered text**, never in the markup, which is what
lets one survive being half-bolded: contentEditable writes `{{<b>school</b>.name}}`
and it still fills. That machinery is shared with find and replace and is
described under it. The field code is `src/utils/mergeFields.ts`; the school's
answers are `brandResolver()` in `src/common/methods/brandKit.ts`, which other
features can compose with their own. The colour and font pass is
`applyTemplateBrand` in `src/store/widget/brand.ts`, called from `setTemplate`
and `fillTemplateLayouts`, so all three ways a template lands — the gallery,
`?tempid=`, and the renderer behind exports and thumbnails — go through it.

### Apply brand to this design

The button in the school's card at the top of the panel, for the design that was
made before the kit was, or brought in from somewhere else. One dialog, one
confirmation, and the whole thing is **one undo step** however many pages it
touches.

This is the **retrofit**, not the normal way a design gets the kit. A template
picked out of the gallery is already in the school's colours and fonts by the
time it is on the page, because it said which of its colours play which part
(above). Apply brand is for everything that never said: a design started before
the kit existed, one brought in from another editor, one drawn from scratch on a
blank page. It has to rank a design's colours to work out which is the main one,
where a template could simply be read.

It does three passes:

1. **Fields.** Every `{{school.…}}` on every page is filled in, not just the
   page on screen — the same reason find and replace works across the design.
2. **Fonts**, when the kit has any. Bold text, and text at or above four and a
   half per cent of the page's shorter side, is set in the heading font;
   everything else in the body font. That threshold is 49px on a slide and 57px
   on Letter paper at 150dpi. A fixed pixel size would call every line on a
   poster a heading and nothing on a slide one. The dialog states the rule in
   numbers for the page you are on, because a guess about which lines are
   headings should be checkable before it runs.
3. **Colours**, if the checkbox is ticked. It is offered, and ticked, only when
   the kit has colours to recolour with. The design's most-used colour becomes
   the kit's first, its second the kit's second, and so on. Counting is by how
   many places a colour is painted rather than by area: the colour a design is
   "in" is the one it reaches for most often, not the one on its biggest
   rectangle. Whites, blacks and greys are left alone, because a brand kit says
   what the school's colours are, not what colour the paper is. Each place keeps
   its own transparency, so a wash that was the old navy at 7% comes out as the
   new blue at 7%.

The same readability guard runs after the colour pass (above): a text box whose
colour or whose background the recolour changed is checked, and repaired if the
new colours would have hidden it. The notification says so — _"3 lines adjusted
to stay readable"_ — because it is a change nobody asked for.

Afterwards a notification says what changed, including how many fields were left
standing for want of a detail the kit does not have.

The model and its storage are in `src/common/methods/brandKit.ts`; what the kit
does to a design is `src/store/widget/brand.ts`, which walks `dLayouts[].layers`
the way find and replace does, so the page on screen updates along with the rest
and there is no special case for it.

### Brand roles in a template

The bundled templates get their `brand` blocks from the two generators rather
than by hand: `tools/make-school-templates.py` for the school pack and
`tools/make-slide-themes.py` for the five slide themes. Each script carries a
table saying which of its palette colours plays which part — the navy the pack
is set in is the primary, the gold it highlights with the secondary, a third
colour an accent — and which faces ask for the heading font, which for the body
font, and which (the hand-lettered ones) ask to be left alone. Neutrals are
never listed, and nothing in the bundled packs opts out. Writing them into the
generators means a regenerated pack cannot drift from its roles.

`tools/check-brand-roles.py` reads every template back and prints a table: each
non-neutral colour painted anywhere either has a role or is on the script's
list of deliberate exceptions with a reason, and every text box resolves to a
role. Run it after regenerating a pack, or after adding a template by hand.

## Tables

A term calendar, a class list, a room timetable. The **Table** button on the
dock puts a three by three grid on the page; double-click a cell to type into
it.

Tab and Shift+Tab run along the cells, Enter drops a row, Escape stops, and Tab
off the last cell adds a row rather than losing what you were about to type.
Right-click a cell to put a row or a column in or out _at that cell_; the panel
adds and removes them at the end, which is the other thing people mean. With the
table selected, the dividers between its columns can be dragged to trade width
between neighbours.

The height is never a number anyone types. A table is as tall as its rows, so it
is measured after every render and the store told, the way a text box already
works — type a long sentence into a cell and the table grows under it. Columns
are held as fractions of the width rather than as pixels, so resizing the table
scales them together for nothing.

Each cell holds the same contentEditable markup a text box does. That is what
lets **find and replace** search and rewrite cells through the same markup walk
as everything else, and what lets the **PowerPoint export** put a real table on
the slide — fills, borders, heading row and all — rather than a picture of one.
A tilted table still goes in as a picture, because a PowerPoint table cannot be
turned.

A cell being typed into takes its own presses with a native listener rather than
a React one: the board selects and starts moving a layer from below the React
root, so a React handler would be too late to stop it. The undo entries for a
cell edit and for a divider drag are bracketed by hand for the same reason.

Code: `src/components/modules/widgets/wTable/`, `src/store/widget/table.ts`.

## Find and replace

**Ctrl+F**, or **File → Find and replace…**. Type what to look for, type what
goes in its place, and press Replace all.

The designs this exists for are the long ones: a twenty-five slide assembly
deck, a twelve-page newsletter, a set of certificates. They repeat the same
handful of strings. The date of the trip, the head teacher's name, the hall the
concert is in. When the date moves, every one of them has to move with it.
Visiting twenty-five pages by hand is twenty-five chances to miss one, and the
one that gets missed is a reprint and a second letter home apologising.

So **the search covers the whole design, not the page you are on**. That is the
feature. A find that only looked at the current page would leave exactly the
mistake it was built to prevent. Narrowing it back to one page is offered as a
choice, off by default.

Both ways of working matter:

- **Replace all** is the common one. It says what it did afterwards, "Replaced
  11 matches across 6 pages", because most of what it changed is on a page
  nobody is looking at. A silent sweep through a deck is unnerving.
- **Previous and Next** are for a string short enough to turn up somewhere it
  was not meant to. Each press jumps to the match, changing page if it is on
  another one, and selects the box holding it so it can be read in context.

A whole Replace all is **one undo step**. Ctrl+Z once puts the design back, not
eleven times.

Hidden and locked layers are searched and replaced like any other: locking is
about dragging and hiding is about the canvas, and neither is about the words.
The result says how many of the matches were on a layer like that, because a
count you cannot see on screen is otherwise baffling.

**Matching runs against the rendered text, never against the markup.** This is
the part worth knowing before changing anything here. A text widget's `text`
field is HTML. contentEditable writes back whatever it produced, so the field
carries `<br>`s, `<ul>`/`<li>` lists and whatever spans a paste dragged in with
it. The obvious implementation, `text.replace(find, to)`, is wrong twice over.
Searching for "li" rewrites every bullet's tag, and a replacement that lands
inside an attribute quietly destroys formatting the author cannot get back.
Instead the HTML is parsed, its text nodes are walked to build the string a
reader actually sees, every character keeps a note of the node it came from, and
a hit is spliced into those particular nodes before the markup is serialised
again. Tags, attributes and entities are never in the search space at all. That
is why replacing a date inside a bulleted list leaves the bullets standing.

Three details fall out of the same walk. A `<br>` or the edge of a block
contributes a newline belonging to no text node, so a match can never straddle a
line. "Sports&lt;br&gt;Day" does not contain "sD". A non-breaking space folds to
a plain one for the comparison only, since browsers write `&nbsp;` into
contentEditable wherever spaces would otherwise collapse and nobody types one on
purpose. Case folding runs character by character rather than lower-casing the
whole string, because a few characters lower-case into two. 'İ' is the one
anybody meets, and it would shift every offset after it and splice the
replacement into the wrong place.

The markup walk is in `src/utils/widgets/textMatch.ts`; the walk across pages is
in `src/store/widget/findReplace.ts` and goes through `dLayouts[].layers`. The
page you are on is not a special case: `getWidgets()` hands back that same array
by reference, so the current page is covered by the same loop as the rest, and
grouped elements are in it too.

No regular expressions, no searching of layer or page names, no search across
saved designs. This is for a school office.

## Bulk documents

**File → Make one for each person…** Forty certificates for a year group, a
name badge for everyone coming to the open evening, an award letter to each
family. The design is made once, with `{{Name}}` typed where the name goes;
the list of people is pasted from wherever it already lives; and every copy is
filled in.

This is the job that otherwise gets done by hand, and the one where a mistake
is only found at the printer. The office has the list already — in the
management system, in a spreadsheet, in an email — and what it does not have
is an afternoon to type forty names into forty copies of the same page.

**The list.** Paste it, or choose a `.csv`, `.tsv` or `.txt` file. The
separator is worked out from the text (commas, tabs, semicolons, or one name
per line), quoted cells are honoured so "Lovelace, Ada" is one name, and blank
lines are dropped. Whether the first row is column names is guessed — a header
has no numbers in it, names no column twice, and is a different shape from the
row beneath it — and shown as a checkbox, so a wrong guess costs one click.
The parsing is pure functions in `src/utils/tabular.ts`, apart from the dialog
that uses them.

**The fields.** A field is `{{anything}}` typed into a text box. The dialog
lists every field the template asks for and the column it will read from,
matched by name without regard to case or spacing — `{{Pupil}}` finds a
column called `pupil`. A field with no matching column is flagged and left as
typed, or can be pointed at a column by hand. The list's columns are shown as
chips: clicking one puts `{{Column}}` on the end of the selected text box, or
into a new text box when nothing is selected, so a teacher can start from any
template and add the fields it is missing. Fields named `school.*` belong to
the brand kit, which fills them from the school's own details, and are listed
as such rather than offered for matching.

Filling goes through `src/utils/mergeFields.ts`, which finds fields in the
rendered text and splices values back through the same machinery find and
replace uses — so a field somebody has half-bolded still fills, and markup is
never touched.

**Two outputs.**

- **Add pages to this design** puts the filled copies in after the template,
  one page per person per template page, each named after its person so the
  strip reads as a register. Every element is renumbered the way a duplicated
  page is. The template can be removed in the same step, and the whole batch is
  **one undo**. Use this when the copies want a look-over or a touch-up before
  they go out.
- **Download a PDF** draws the copies straight to a file, one page per person,
  at the quality chosen under Export, and adds nothing to the design. The
  filename says how many are in it — `Sports Day certificate – 42 copies.pdf`
  — and a running count with a Cancel button sits in the dialog while it draws.
  Use this when the list is long.

The choice is offered as "This page" or "All pages": a two-sided certificate,
or a letter with a badge on its second page, copies both pages per person.

**Two caps, for two reasons.** A design holds 50 pages (see Pages), so a list
that would take it past that is steered to the PDF, and the dialog says so
before anything is made rather than after. A PDF run takes up to 500 people at
a time: each page is drawn through the browser and held in memory until the
file is assembled, and five hundred pages at Print quality is a few minutes and
a few hundred megabytes, which is about where a browser tab stops being a
reasonable place to do it. A whole school is usually more than one list anyway.

The copies for a PDF are rendered without ever being added to the design: the
page renderer (`renderLayout` in `renderPage.ts`) puts a page on the canvas
directly, so the autosave and the undo stack see no change and the page strip
does not fill with copies.

## Spelling

On by default, and switched off in **File → Check spelling**.

Upstream hardcoded `spellcheck="false"` on every text widget, which suits a
designer setting type and does not suit the person this fork is for: a teacher
writing the words on a poster that goes home to four hundred families. Off is
still a real choice though — a page of pupil names, or a school motto in Latin,
turns the whole design red and the underlines stop meaning anything. The
preference is remembered in `localStorage` under `ds_spellcheck`.

Only the box being edited is checked. The stacked copies that draw text effects,
and the thumbnails in the page strip, are never checked: a squiggle drawn three
times through an outlined heading is not a spelling mistake anyone can act on.

## Dark mode

The sun/moon button in the toolbar switches between light and dark. With no
choice made it follows the operating system and keeps following it; clicking
pins a theme, and shift-clicking the button hands control back to the system.
The choice is remembered in `localStorage` under `ds_theme`.

Only the editor's chrome changes. The page itself, the artwork on it and
everything exported from it are identical in both themes — a PNG exported in
dark mode is byte-for-byte the one exported in light mode.

Two files decide how it looks:

- `src/assets/styles/theme.less` holds the two palettes, as CSS custom
  properties on `:root` and `html.dark`.
- `src/assets/styles/tokens.less` names them (`@ink`, `@surface`, `@accent`, …).
  Components only ever reference the names, so a component written against the
  tokens themes itself.

The dark palette is the school planner's admin theme — near-black surfaces,
hairline borders, one green accent — so an embedded editor reads as part of that
app rather than a panel bolted onto it.

Two things to know before adding styles:

- Each token is a `var()` reference, so Less colour functions cannot be applied
  to one. `fade(@accent, 25%)` fails the build with _"Argument cannot be
  evaluated to a color"_. Use `@accent-a25` / `@accent-a45`, or add a token.
- Never hardcode a hex for chrome. `tools/` has no lint for this; the check is
  `grep -rn '#[0-9a-f]\{3,8\}' src --include='*.tsx'`, and everything that
  legitimately remains is either artwork (a widget's default colour, a swatch
  palette) or something drawn on top of a photo.

## PDF export, and export quality

**PDF** is the format a design usually leaves in: to a print shop, or attached
to an email home. Every page of the design becomes a page of the file, sized in
real inches rather than pixels, so nobody at the other end has to guess how big
you meant it.

Each page goes in as a picture rather than as rebuilt text and shapes. That is
deliberate: an editable PDF would need a second renderer kept in step with the
browser's, and the usual way that goes wrong is a font substituting at the print
shop. What you see is what prints. The editable route already exists and is
called PowerPoint.

There is no PDF library in the dependency list. `exportPdf.ts` writes the file
itself — a catalogue, a page tree, and one JPEG drawn across each page — which
is about a hundred lines of a stable, thirty-year-old format, against roughly
350kB for jsPDF on a bundle that is already a megabyte.

**Quality** sits at the top of the Export menu and applies to the image and the
PDF. It is a resolution multiplier, but it is labelled in the terms the decision
is actually made in:

| Setting  | Resolution | For                                   |
| -------- | ---------- | ------------------------------------- |
| Standard | 150 DPI    | Screen, email, the office copier      |
| Print    | 300 DPI    | What a print shop asks for            |
| Large    | 450 DPI    | Something read from across a corridor |

Those numbers are real, not decorative. The editor stores a page in pixels and
records nothing about how big it is meant to be, so the paper size has to be
inferred, and 150 DPI is the convention the page presets are already built on —
"Letter — portrait" is 1275 × 1650, which is 8.5 × 11 inches at 150. Read back
at 150, a Letter design produces a PDF that `pdfinfo` reports as
`612 x 792 pts (letter)`. Read at the CSS-pixel 96 instead, the same design
would claim to be a 13 × 17 inch sheet.

Turning the quality up puts more pixels on the same sheet rather than making the
sheet bigger, which is what asking for 300 DPI means. The menu shows both the
pixel size and the paper size before you commit to either.

## Transitions

How one page gives way to the next when you present. Click the page itself
rather than anything on it and the **Transition** section is under Background:
None, Fade, Slide, Push, Zoom or Wipe, with a duration between 150ms and 2.5s.
**Preview** plays it on the canvas, so you can see what you are choosing without
starting the show, and **Apply to all pages** gives the whole deck the same one
— which is what nearly everyone wants and what is tedious to set page by page.
That counts as a single undo step.

A transition belongs to the page being arrived at, which is how PowerPoint and
Keynote both read it: "this slide fades in" is a fact about this slide. Going
backwards plays the same one mirrored, so a slide that pushed in from the right
pushes back out to the right. A page carrying one is marked on its thumbnail in
the page strip, so a deck can be read for them without opening every page.

They are played through the Web Animations API rather than by writing to inline
styles, for the reason the element entrances are: one still running when the
next key is pressed can be cancelled cleanly rather than stacked on. A quick run
of arrow presses lands on the right slide with nothing half-faded left behind.
Nothing fills forwards — when an animation ends, the slot reverts to its own
CSS, which is where it was heading anyway.

**Somebody who has asked their system for less movement gets a plain cut.** The
presenter checks `prefers-reduced-motion` before playing anything, and the
stylesheet drops the cross-fade under the same query.

A `.pptx` file carries none of this. pptxgenjs has no slide transition API, so a
transition lives in the presenter only, and the panel says so rather than
letting you set one and find out in front of a room.

Code: `src/common/animations/transitions.ts`.

## Speaker notes and presenter view

What to say while a page is on screen, kept with the page and never drawn on it.

**Notes** by the page pill, or **File → Speaker notes**, opens a drawer along the
bottom of the board with one box in it. Type; it belongs to the page you are on,
so moving between pages moves between notes, and the button carries a dot when
the page you are looking at has some. The whole edit is one undo step rather
than one per keystroke: Ctrl+Z takes back the paragraph, not the last letter.
Notes are saved with the design like anything else, and a new page does not
inherit them — what you meant to say about last week's fixtures is not what you
mean to say about the blank page after it.

While presenting, **N** lays the notes for the slide over the stage. Over it, not
beside it: the slide is a projected image and nothing may take room off it.

**Presenter view** — the button in the presenter's bar, or **S** — opens a second
window you can drag onto the laptop while the projector keeps the slide. It
shows what is up, what is coming, the notes for this page, the clock and how far
through the deck you are, all at a size that can be read from a lectern. Either
window turns the page and the other follows.

The two are separate documents, and that is the whole difficulty. The second
window has its own key handler, so a space bar pressed while you are looking at
your notes arrives nowhere near the code that turns the page; and neither window
can safely hold a reference into the other's DOM, because the presenter view is
exactly the window somebody closes by accident halfway through a talk. So they
talk over a `BroadcastChannel`: the presenter owns where the talk is and
broadcasts it, the view sends presses back, and a view that has just opened says
hello and is told where things stand. The artwork itself needs no channel — the
view is drawn by the editor's own React tree through a portal, so it is the same
components the presenter draws, live, with no second copy of the deck to keep in
step.

If the browser blocks the pop-up there is nothing to see and nowhere to say so —
a toast is outside the full-screen element and would not be drawn at all — so
the notes overlay opens instead, carrying the explanation.

Notes travel into `.pptx` as real PowerPoint speaker notes, in both export
modes: they are for the person presenting, not part of the picture of the page.
**Find and replace does not search them.** It walks the artwork on every page,
and notes are not artwork; a date changed on the slides has to be changed in the
notes by hand.

Relevant code:

```
src/store/notes.ts                              whether the drawer is open
src/store/widget/pageMeta.ts                    the page's notes and transition
src/components/business/notes/                  the drawer and its button
src/components/business/presentation/
  presenterLink.ts   the channel, and opening the second window
  PresenterView.tsx  what that window shows
```

## PowerPoint export

Every page of a design becomes one slide. There are two modes, because they
suit different jobs:

- **PowerPoint** rebuilds the design out of real PowerPoint objects. Text stays
  text, so whoever opens the file can retype it, restyle it, or run it through
  a translator. Anything `.pptx` cannot express natively — a masked photo, a QR
  code, text with an outline or gradient fill — is rendered to a picture of
  just that element, so it still looks right.
- **PowerPoint (exact copy)** puts a flat image of each page on its slide.
  Nothing is editable, but it matches the editor pixel for pixel.

Speaker notes go into PowerPoint's own notes pane in either mode. Page
transitions do not travel at all: pptxgenjs has no API for them.

Text goes in as paragraphs of runs, so a word bolded in the editor is a bolded
run in the deck and a link is a real hyperlink. See Formatting part of a text
box above.

A design is stored in CSS pixels, so 1920×1080 read literally at 96 DPI would
be a 20-inch-wide slide — valid, but nothing like a normal deck, and it merges
badly into an existing presentation. The longest side is scaled to 13.333in,
which lands a 16:9 design on PowerPoint's standard widescreen size and keeps
everything else proportional.

Relevant code:

```
src/common/methods/export/
  exportPptx.ts    the mapping from design widgets to slide objects
  exportPdf.ts     the PDF writer, and the pixels-to-paper conversion
  renderPage.ts    renders any page or element to a PNG, restoring editor state
  textRuns.ts      a text widget's markup as PowerPoint runs
  utils.ts         unit, colour, HTML-to-text and image helpers
src/views/components/ExportMenu.tsx   the toolbar button, and the quality picker
```

## Using it inside School Planner

School Planner (<https://synthed.co>) is the app this fork was built for — a
school planning tool for events, tasks and staff assignments. It is a separate,
closed-source codebase, so nothing here depends on it; this section is a record
of how the two would be joined, and of what a real deployment still needs.

School Planner is React Router 7 and so is this, so the two share a runtime. The
editor mounts as a component: `<DesignStudio />` renders into a `<div>` in the
host — no iframe, no second React root, and the host's copy of React is the only
one on the page. Its CSS is scoped so it cannot leak into the surrounding
chrome. [EMBEDDING.md](EMBEDDING.md) is the reference, and `embed-demo/` is a
working host page to check it against.

The planner installs it from a tag carrying the built output:

```json
"design-studio": "github:alexwhb/school-design-studio#embed-v0.1.0"
```

`npm run release:embed` cuts one. Three entry points come out of it:

| Entry                   | What                                                                                                                                                                                      | Where it runs      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `design-studio`         | `<DesignStudio />`, its types, `configure`, `setBackgroundRemover`                                                                                                                        | browser            |
| `design-studio/compose` | Design JSON in, design JSON out: compose a deck or a sign from an outline, describe one for a model, apply the model's changes, apply a brand kit, and sanitise the markup a design holds | server and browser |
| `design-studio/server`  | `createContentLibrary(…)` — the six read-only `/design/*` endpoints, framework-agnostic                                                                                                   | Node               |

The host takes over each of the three things the editor would otherwise keep in
the browser, one prop each:

- **The design.** `document`, `onDocumentChange` and `onSave`. Nothing is
  written to IndexedDB, the restore offer never appears, and Save is a request
  the planner makes. The pill above the canvas follows the promise.
- **Uploads.** `uploads`, three calls against the planner's own file store,
  scoped by school. Without it a picture uploaded on the staffroom machine is
  not on the teacher's laptop. A fourth, `importUrl`, takes a copy of a stock
  photograph as it is placed, so a design does not end up pointing at somebody
  else's server.
- **The brand kit.** `brand` and `onBrandChange`, which the planner already
  keeps per school; `brandReadOnly` shows it to everyone and lets only an
  administrator change it.

And two the editor never had: `assistant`, a panel of the planner's own behind
an "AI" tab in the rail, and a `ref` that lets it read the design, change it,
and take a PDF, a `.pptx` or a page's PNG as bytes rather than as a download.

One thing the planner must do rather than may: call `sanitizeMarkup` on every
text widget of every document it stores. A design's text is HTML, and the
planner renders it back into other people's browsers, so the point to decide
what may be in it is before the bytes are written down. It is the editor's own
allowlist, exported so there is one answer rather than two. See
[EMBEDDING.md](EMBEDDING.md).

Still not done, and worth saying:

- **Auth and tenancy.** There is none in this repo. `src/utils/axios.ts` ships a
  hard-coded demo token from upstream. Scoping designs by school is the
  planner's job, on its side of the props above.
- **The standalone editor still keeps everything in the browser.** That is
  right for what it is — a tool somebody opens on their own machine — and it is
  what the props above turn off.

## Developer tooling

`tools/` holds the scripts that produced the content in this fork. None of them
run during a build — the output is committed — but they are how you regenerate
or extend it. Run them from the repository root. The `.mjs` scripts need Node
20+ and the `.py` scripts need Python 3.9+; the screenshot scripts additionally
need Puppeteer and a running server.

| Script                                                               | Purpose                                                                                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `fetch-fonts.mjs` + `font-list.json`                                 | Downloads the 26 bundled font families from Google Fonts and regenerates `public/fonts/fonts.css`                          |
| `fetch-iconfont.mjs`                                                 | Re-downloads the toolbar icon font into `public/iconfont/`, so no CDN sits in the critical path (`npm run fetch-iconfont`) |
| `apply-i18n.py` + `i18n-map.json`                                    | The translation pass — replaces Chinese source strings with English across the tree                                        |
| `add-content.mjs`                                                    | Imports a folder of your own SVGs or PNGs into Graphics (shapes, stickers or masks) and rewrites the manifest              |
| `make-stickers.py`                                                   | Draws the bundled school sticker set as SVG and rewrites `png.json`                                                        |
| `make-school-templates.py`                                           | Generates the school template pack (`--remove` takes it back out)                                                          |
| `make-slide-themes.py`                                               | Generates the five themed slide decks (`--remove` takes them back out)                                                     |
| `make-template-covers.mjs`                                           | Screenshots each template to produce its gallery thumbnail (`--pack=` narrows it to one pack)                              |
| `make-samples.py`, `englishify-samples.py`, `make-sample-covers.mjs` | Build and re-render the sample element groups shown under Text                                                             |
| `test-export.mjs`                                                    | End-to-end check: drives the editor, exports, unzips the `.pptx` and asserts the slide contents                            |
| `shot.mjs`, `shot-state.mjs`, `screenshots.mjs`                      | Screenshot helpers used while working on the interface                                                                     |

[CONTENT.md](CONTENT.md) documents what each content type expects and walks
through adding your own.

## Licence

MIT, the same as upstream, and the original copyright notice is kept intact in
[`LICENSE`](LICENSE) (upstream's Chinese-language copy is kept as
[`LICENSE-ZH`](LICENSE-ZH)). Credit for the editor itself belongs to
[palxiao/poster-design](https://github.com/palxiao/poster-design).

Bundled fonts carry their own licences — all SIL OFL or Apache 2.0 — recorded in
`public/fonts/LICENSES.md`. Sample photographs and their licences are listed in
`service/src/mock/materials/LICENSES.md`. Photos fetched through the Photos
panel at runtime come from Unsplash under the
[Unsplash licence](https://unsplash.com/license).

The background-removal model is fetched at runtime rather than bundled, and is
Apache 2.0 — see [Removing a background](#removing-a-background) for why that
took some choosing, and for how to point the feature at something else.
