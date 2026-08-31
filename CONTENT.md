# Adding content

Everything in the Templates and Elements panels comes from JSON in
`service/src/mock/`. There is no database and no CMS — you edit files, and
`serve.mjs` reads them straight off disk. The Photos panel is the exception:
it comes from Unsplash, and the JSON here is only its offline fallback.

```
service/src/mock/
  materials/
    svg.json          Elements > Shapes
    png.json          Elements > Stickers
    mask.json         Elements > Masks
    photos/1..3.json  Photos, when there is no Unsplash key
  templates/
    list.json         what appears in the Templates panel
    101..112.json     the school pack (see below)
  components/
    list/text.json    Text > Text with effects
    list/comp.json    Text > Sample element groups
    detail/1..6.json  the elements themselves
```

After editing, run `npm run build` if you are serving the production build.
In `npm run dev` the changes appear on reload.

> **The `../tools/` scripts are not in this repository.** They sit one level up,
> in the parent working tree, and are not tracked there either — so a fresh
> clone of this fork will not have them and the commands below will not run.
> The JSON they write *is* committed, so the content library works regardless;
> what you lose without the scripts is the documented way to regenerate it.

## Shapes, stickers and masks

Use the helper rather than writing JSON by hand:

```bash
node ../tools/add-content.mjs shapes   ~/my-svgs      # Elements > Shapes
node ../tools/add-content.mjs stickers ~/my-pngs      # Elements > Stickers
node ../tools/add-content.mjs masks    ~/my-masks     # Elements > Masks
```

It reads every file in the folder, works out the dimensions, and appends to the
right JSON file. Add `--replace` to start a category from scratch. The filename
becomes the title, so name them how you want them to read.

- **Shapes** must be `.svg`. The markup is inlined into the JSON, so there is
  nothing to host, and any `fill="#RRGGBB"` colours are collected into the
  `model` field — that is what lets someone recolour the shape after placing it.
  Give the SVG a `viewBox`, and `preserveAspectRatio="none"` if it should
  stretch freely when resized.
- **Stickers** and **masks** are images, copied into `public/` and referenced
  by path. `add-content.mjs` expects raster files; the bundled sticker set is
  SVG, which the same JSON shape handles fine (see below).
- A **mask** is a silhouette: solid where the photo should show through,
  transparent everywhere else. Dropping a photo onto one crops it to that shape.

Written out by hand, one entry looks like this:

```json
{
  "id": 42,
  "title": "Star",
  "width": 200,
  "height": 200,
  "type": "svg",
  "model": "{\"colors\":[\"#4F46E5\"]}",
  "thumb": "data:image/svg+xml;base64,...",
  "url": "<svg viewBox=\"0 0 200 200\">…</svg>",
  "state": 1
}
```

`type` is what decides the widget you get: `svg` → a recolourable shape,
`image` → a picture, `mask` → a photo container. `thumb` is what the panel
previews, and it must be something an `<img>` can load — a URL, or a data URI.
For a raster sticker, `thumb` and `url` are usually the same file.

### The bundled stickers

The thirty in the panel — apple, bus, trophy, clipboard, lab flask — are
generated rather than drawn by hand or sourced:

```bash
python3 ../tools/make-stickers.py          # write the SVGs and rewrite png.json
python3 ../tools/make-stickers.py --list   # just name what it would write
```

Editing one means editing its builder function and re-running. Each is a
self-contained SVG in `public/stickers/`, so they stay sharp when someone
scales one up to fill half a poster, and nothing is fetched at runtime.

Three things to keep if you add more:

- **File them as `type: "image"`, not `type: "svg"`,** even though they are SVG
  files. `svg` means "recolourable line art" here — it routes the sticker to a
  different widget, and the Elements panel inverts those in dark mode, which
  ruins full-colour artwork.
- **No `id` attributes in the markup.** Two copies of one sticker can sit on
  the same canvas, and duplicate ids would have them fighting over references.
- **No `stroke="currentColor"`.** These load through `<img src="…">`, and an
  `<img>` is an isolated document — `currentColor` resolves against its
  default, black, with nothing our CSS can reach. Fine when you draw the
  artwork with its own fills; a trap if you ever extend the set from an icon
  library. It is why the Lucide shapes need the dark-mode invert filter.

They replaced three hotlinked kawaii planner cut-outs from upstream, captioned
in Chinese and served from an image host that is often unreachable.

## Photos

The Photos panel comes from the Unsplash API, not from this folder — see
**Stock photos** in [README.md](README.md) for the key it needs, and for how to
change what the three browse rows search for.

`materials/photos/1.json` … `3.json` are the fallback shown when no Unsplash
key is configured: plain lists of remote image URLs. Replace them with your own
— a school photo library, or your own asset host — if you would rather not use
Unsplash at all:

```json
{ "id": 1, "thumb": "https://…/small.jpg", "url": "https://…/full.jpg", "width": 1600, "height": 1067 }
```

`1.json`, `2.json` and `3.json` back the three browse rows in that order.

## Templates

A template is one JSON file plus a line in `list.json`.

The easiest way to make one is to **build it in the editor and save it**, rather
than writing the JSON. That needs the real `service/` backend running, because
saving is a write:

```bash
cd service && npm install && npm run dev
```

Then open the editor with `?tempid=<new-id>` and use **File → Save**. It writes
`templates/<id>.json`, renders a cover, and adds the entry to `list.json`.

To do it by hand, `templates/<id>.json` looks like:

```json
{
  "id": 3,
  "title": "Newsletter header",
  "width": 1275,
  "height": 1650,
  "data": "[ …widgets… ]"
}
```

`data` is a **string** containing the JSON array of widgets — the same shape the
editor holds in memory.

Store a widget's `text` **raw**, not URL-encoded. Templates are loaded by two
different paths and only one of them decodes: picking a template in the panel
goes through `setTemplate`, which calls `decodeURIComponent`, but opening one
directly with `?tempid=` goes through `setDWidgets`, which does not. Raw text
survives both, since decoding it is a no-op. The one thing raw text cannot
contain is a literal `%` — that would make the panel's `decodeURIComponent`
throw. (Saved *elements* under `components/` are the opposite: those are
URL-encoded, because every path that loads them decodes.)

Then add to `templates/list.json`:

```json
{ "id": 3, "cover": "/covers/newsletter.png", "title": "Newsletter header", "width": 1275, "height": 1650, "state": 1 }
```

`cover` is the thumbnail. Put it in `public/` and reference it by path.

### The school pack

Twelve templates — posters, a certificate, a door sign and two slides — are
generated rather than hand-written:

```bash
python3 ../tools/make-school-templates.py      # write them
node ../tools/make-template-covers.mjs         # then shoot the thumbnails
python3 ../tools/make-school-templates.py --remove   # or take them back out
```

Editing a layout means editing the builder function for it and re-running,
which is a good deal less painful than hand-editing a JSON string.

They are ids 101–112 and every record carries `"pack": "school-events"`, which
is what `--remove` keys on, so removing them cannot touch anything else.
Covers need the app running (`npm run dev` or `npm start`) because there is no
way to render a page outside the editor — pass a different base URL as the
first argument if you are not on port 4173.

Nothing in the pack introduces a licence obligation. The shapes and icons come
from `materials/svg.json` (the icons are Lucide, ISC), the fonts are the
bundled Google Fonts under the OFL, and there are no photographs and no remote
URLs. Layouts are original; the copy is placeholder text for a school to
overwrite.

The gallery holds the pack and nothing else. The two upstream demo templates
that used to ship — Chinese-language phone posters, ids 1 and 2, with covers
hotlinked from an image host that was often unreachable — have been removed,
along with the two images under `mock/assets/` that only they referenced.

That makes the pack the whole gallery, so `--remove` now leaves the Templates
panel empty rather than falling back to demo content.
