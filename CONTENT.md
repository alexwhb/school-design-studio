# Adding content

Everything in the Templates, Elements and Photos panels comes from JSON in
`service/src/mock/`. There is no database and no CMS — you edit files, and
`serve.mjs` reads them straight off disk.

```
service/src/mock/
  materials/
    svg.json          Elements > Shapes
    png.json          Elements > Stickers
    mask.json         Elements > Masks
    photos/1..3.json  Photos
  templates/
    list.json         what appears in the Templates panel
    1.json, 2.json    the templates themselves
  components/
    list/text.json    Text > Text with effects
    list/comp.json    Text > Sample element groups
    detail/1..6.json  the elements themselves
```

After editing, run `npm run build` if you are serving the production build.
In `npm run dev` the changes appear on reload.

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
- **Stickers** and **masks** are raster images, copied into `public/` and
  referenced by path.
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

## Photos

`materials/photos/1.json` … `3.json` are lists of remote image URLs. The
bundled ones point at Unsplash. Replace the URLs with your own — a school photo
library, or your own asset host:

```json
{ "id": 1, "thumb": "https://…/small.jpg", "url": "https://…/full.jpg", "width": 1600, "height": 1067 }
```

The section headings live in `src/components/modules/panel/wrap/PhotoListWrap.vue`.

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
editor holds in memory. Note that a widget's `text` is URL-encoded, because the
app runs it through `decodeURIComponent` on load.

Then add to `templates/list.json`:

```json
{ "id": 3, "cover": "/covers/newsletter.png", "title": "Newsletter header", "width": 1275, "height": 1650, "state": 1 }
```

`cover` is the thumbnail. Put it in `public/` and reference it by path.

### The bundled templates

The two that ship are the upstream demo content — Chinese-language phone
posters. They prove the loading path works and are no use to a school; expect
to replace them. The same goes for the sample stickers and element groups,
which are drawn in a style that will not suit most Western schools even now
that their wording is English.
