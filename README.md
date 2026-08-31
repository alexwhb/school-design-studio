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

### Content, and the optional backend

`npm start` serves the bundled content library too, so Templates, Elements
(stickers, shapes, masks) and Photos all have content with nothing else
running. That content lives in `service/src/mock` as plain JSON. Upstream only
serves it through the Express app in `service/`, which pulls in Puppeteer and a
Chromium download purely to render screenshots — a lot of setup for a folder of
JSON — so `serve.mjs` answers the read-only lookups directly.

You still need the real `service/` backend to *save* designs or templates, and
for server-side rendering of the trickier exports. Point `API_URL` in
`src/config.ts` at your own backend to supply your own content.

If the app is served some other way with no backend at all, it degrades rather
than erroring: the panels show empty states and one informational line is
logged.

**The two sample templates are the upstream demo content** — Chinese-language
phone posters at 1242×2208. They are useful for checking that loading and
applying a template works, and useless to a school. Replacing them is a content
job: a template is just a JSON file in `service/src/mock/templates/` plus an
entry in `list.json`.

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
shadows or gradients. All of it comes from `src/assets/styles/tokens.less`, so
the editor can be re-skinned from one file. No features were removed — the
toolbar was regrouped, panels were flattened, and section headings were set in
quiet uppercase.

**Page sizes.** The Chinese e-commerce presets (WeChat article headers, product
listing pages) are replaced with sizes a school actually uses: slides, Letter,
A4, flyers, name badges, display boards.

**PowerPoint export.** New. See below.

**Defaults.** The watermark is off unless you turn it on, and the app name links
to `HOME_URL` rather than the original project's marketing site.

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
   the editor is already self-contained.
2. **Serve it as a separate app** on a subdomain, sharing a session cookie.
3. **Port the editor surface** to React. Realistic only if the design data model
   is what you want long term — the store is plain Pinia and the widget schema
   is straightforward, but it is a large job.

Either way, the things a real deployment still needs:

- **Auth and tenancy.** There is none. `src/utils/axios.ts` ships a hard-coded
  demo token from upstream. Any real deployment must scope saved designs by
  school, exactly as the rest of the planner does.
- **Storage.** Uploads and saved designs currently target the upstream backend
  and a Qiniu bucket (`IMG_URL` in `src/config.ts`).
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
