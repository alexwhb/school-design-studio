# Design Studio

A drag-and-drop design editor for schools — posters, flyers, newsletters,
certificates and slides — that exports to PNG and **PowerPoint**.

This is a fork of [palxiao/poster-design](https://github.com/palxiao/poster-design)
(MIT), rewritten for an English-speaking, non-technical audience. The original
is an excellent editor; it was just built for a Chinese market.

## Run it

```bash
npm install
npm start          # builds, then serves on http://127.0.0.1:4173
```

For development with hot reload:

```bash
npm run dev        # http://127.0.0.1:5173
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run serve` | Serves an existing `dist/` (no rebuild) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run fetch-fonts` | Re-downloads the bundled fonts (see below) |

### Stock photos

The Photos panel is backed by [Unsplash](https://unsplash.com). Searching and
the three browse rows both go through the Unsplash API, so it needs a key:

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

Without a key, the panel falls back to the sample images bundled in
`service/src/mock/materials/photos`, and search says so instead of pretending.
The same goes for a rejected key or a spent rate limit — each gets its own
message in the panel rather than an empty grid.

The three browse rows are stored searches. Change what they cover by editing
`BROWSE_CATEGORIES` in `server/content-library.mjs` (the queries) and the list
of the same name in `src/components/modules/panel/wrap/PhotoListWrap.vue` (the
headings shown before any request goes out).

Unsplash's API terms ask that apps credit photographers and report when a photo
is used. Hovering a thumbnail shows the photographer, and placing one pings the
photo's `download_location` through the proxy.

### Uploads

Pictures you add — the Upload button, a pasted screenshot, a background image,
the result of Remove background — are stored in the browser, in IndexedDB. There
is no account system and no upload endpoint in this fork, so there is nowhere
else for them to go; upstream posted them to a Chinese CDN this project has no
account for, which is why uploading used to end in a thumbnail reading FAILED.

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

`npm start` serves the bundled content library too, so Templates, Elements
(stickers, shapes, masks) and Photos all have content with nothing else
running. That content lives in `service/src/mock` as plain JSON. Upstream only
serves it through the Express app in `service/`, which pulls in Puppeteer and a
Chromium download purely to render screenshots — a lot of setup for a folder of
JSON — so `serve.mjs` answers the read-only lookups directly.

`npm run dev` answers them the same way, from the same code
(`server/content-library.mjs`, mounted as Vite middleware), so the panels
behave identically either way.

You still need the real `service/` backend to *save* designs or templates, and
for server-side rendering of the trickier exports. Set `DESIGN_API_URL` to
point the editor at it — or at your own backend, to supply your own content.

If the app is served some other way with no backend at all, it degrades rather
than erroring: the panels show empty states and one informational line is
logged.

See **[CONTENT.md](CONTENT.md)** for how to add your own shapes, stickers,
masks, photos and templates.

**The bundled templates, stickers and element groups are upstream demo
content.** The wording is English now, but they are drawn in a style that will
not suit most Western schools, and the two templates are Chinese phone posters
at 1242×2208. Expect to replace them.

## What changed from upstream

**Language.** Every user-visible string is English, written for teachers and
office staff rather than designers. Most code comments were translated too. Two
Chinese literals survive on purpose: `psd/index.ts` matches the Photoshop layer
name `背景`, which is data inside a `.psd` file rather than UI text.

**Fonts.** The Chinese font list is replaced with 20 open-licence English
families (SIL OFL / Apache 2.0), bundled in `public/fonts` instead of loaded
from a CDN. That means they work offline and render identically in the editor
and in every export. Google serves most of them as a single variable file, so
each family ships once and `fonts.css` declares a 400–700 weight range, which
makes bold interpolate properly instead of being faked by the browser. See
`public/fonts/LICENSES.md`.

**Look.** One accent colour, a small neutral ramp, hairline borders, no
shadows or gradients. Every colour in the editor comes from the tokens named in
`src/assets/styles/tokens.less`, so it can be re-skinned from one file. No
features were removed — the toolbar was regrouped, panels were flattened, and
section headings were set in quiet uppercase.

**Dark mode.** New. See below.

**Uploads.** New — they used to go to a server that does not exist here. See
below.

**Page sizes.** The Chinese e-commerce presets (WeChat article headers, product
listing pages) are replaced with sizes a school actually uses: slides, Letter,
A4, flyers, name badges, display boards.

**PowerPoint export.** New. See below.

**Defaults.** The watermark is off unless you turn it on, and the app name links
to `HOME_URL` rather than the original project's marketing site.

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
  to one. `fade(@accent, 25%)` fails the build with *"Argument cannot be
  evaluated to a color"*. Use `@accent-a25` / `@accent-a45`, or add a token.
- Never hardcode a hex for chrome. `tools/` has no lint for this; the check is
  `grep -rn '#[0-9a-f]\{3,8\}' src --include='*.vue'`, and everything that
  legitimately remains is either artwork (a widget's default colour, a swatch
  palette) or something drawn on top of a photo.

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

A design is stored in CSS pixels, so 1920×1080 read literally at 96 DPI would
be a 20-inch-wide slide — valid, but nothing like a normal deck, and it merges
badly into an existing presentation. The longest side is scaled to 13.333in,
which lands a 16:9 design on PowerPoint's standard widescreen size and keeps
everything else proportional.

Relevant code:

```
src/common/methods/export/
  exportPptx.ts    the mapping from design widgets to slide objects
  renderPage.ts    renders any page or element to a PNG, restoring editor state
  utils.ts         unit, colour, HTML-to-text and image helpers
src/views/components/ExportMenu.vue   the toolbar button
```

## Using it inside School Planner

School Planner is React Router 7; this is Vue 3. The two do not share a runtime,
so the practical options are:

1. **Iframe it** at a route like `/design`, and set `HOME_URL` in
   `src/config.ts` so the app name links back into the planner. Simplest, and
   the editor is already self-contained. Its dark palette is the planner's admin
   theme, so an iframe on an `/admin/*` route matches the chrome around it —
   drive the theme from the host by setting `ds_theme` in `localStorage` on the
   same origin, or by dropping the `dark` class on `<html>` directly.
2. **Serve it as a separate app** on a subdomain, sharing a session cookie.
3. **Port the editor surface** to React. Realistic only if the design data model
   is what you want long term — the store is plain Pinia and the widget schema
   is straightforward, but it is a large job.

Either way, the things a real deployment still needs:

- **Auth and tenancy.** There is none. `src/utils/axios.ts` ships a hard-coded
  demo token from upstream. Any real deployment must scope saved designs by
  school, exactly as the rest of the planner does.
- **Storage.** Uploads live in the visitor's own browser (see
  [Uploads](#uploads)) — fine for one person at one desk, wrong the moment two
  members of staff are meant to share a picture, or the same person opens the
  editor on a different machine. Point `src/common/methods/localUploads.ts` at
  the planner's own file store, scoped by school, before this is more than a
  demo. Saved *designs* still target the upstream backend and are not wired up
  at all.
- **The icon font** is still loaded from `at.alicdn.com`. It works, but it is a
  third-party CDN in the critical path and should be self-hosted like the text
  fonts now are.

## Developer tooling

`experimental/tools/` holds the scripts used to build this fork:

| Script | Purpose |
| --- | --- |
| `fetch-fonts.mjs` | Downloads the font set and regenerates `fonts.css` |
| `apply-i18n.py` + `i18n-map.json` | The translation pass |
| `test-export.mjs` | End-to-end check: drives the editor, exports, unzips the `.pptx` and asserts the slide contents |
| `shot.mjs`, `shot-state.mjs` | Screenshot helpers |

## Licence

MIT, as upstream. The original copyright notice is kept in `LICENSE`. Bundled
fonts carry their own licences, recorded in `public/fonts/LICENSES.md`.
