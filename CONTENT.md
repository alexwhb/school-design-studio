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
    cates.json        the category chips above it
    101..127.json     the school pack (see below)
  components/
    list/text.json    Text > Text with effects, and the effect presets
    list/comp.json    Text > Sample element groups
    detail/1..117.json  the elements themselves
```

After editing, run `npm run build` if you are serving the production build.
In `npm run dev` the changes appear on reload.

The commands below live in [`tools/`](tools) at the root of this repository, so
they run straight out of a fresh clone. The JSON they write is committed too, so
the content library works whether or not you ever run them — the scripts are the
documented way to _regenerate_ it, not a build step.

The `.mjs` scripts need Node 20+; the `.py` scripts need Python 3.9+ and nothing
else. Run both from the repository root.

## Shapes, stickers and masks

Use the helper rather than writing JSON by hand:

```bash
node tools/add-content.mjs shapes   ~/my-svgs      # Elements > Shapes
node tools/add-content.mjs stickers ~/my-pngs      # Elements > Stickers
node tools/add-content.mjs masks    ~/my-masks     # Elements > Masks
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
python3 tools/make-stickers.py          # write the SVGs and rewrite png.json
python3 tools/make-stickers.py --list   # just name what it would write
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
throw. (Saved _elements_ under `components/` are the opposite: those are
URL-encoded, because every path that loads them decodes.)

Write the school's own details as **merge fields** rather than as one made-up
school's: `{{school.name}}`, `{{school.tagline}}`, `{{school.address}}`,
`{{school.phone}}`, `{{school.email}}`, `{{school.website}}` and
`{{school.short_name}}`. They are filled in from the Brand panel as the template
is added, and from a sample school when nobody has set a kit up, so a template
carrying them reads sensibly either way. `{{school.name|upper}}` sets the value
in capitals, which is what a footer usually wants. See **Brand kit** in
[README.md](README.md). Two things to hold on to: the box is sized where it is
written, and nothing reflows, so leave room for a school with a longer name than
the sample's; and a field must sit inside one text widget rather than being
split across two.

Then add to `templates/list.json`:

```json
{ "id": 3, "cover": "/covers/newsletter.png", "title": "Newsletter header", "width": 1275, "height": 1650, "state": 1, "cate": "flyer" }
```

`cover` is the thumbnail. Put it in `public/` and reference it by path.

### Categories

The chips above the Templates panel — All, Posters, Flyers, Slides, Awards,
Signs — come from `templates/cates.json`, which is only names and order:

```json
{ "id": "flyer", "name": "Flyers" }
```

A record's `cate` is one of those ids. Two rules follow from how the panel
builds the row, and neither needs you to edit both files in lockstep:

- **A category with no templates gets no chip.** So removing a pack takes its
  chips with it rather than leaving ones that lead nowhere.
- **A `cate` this file does not name still gets a chip**, labelled with the
  slug itself. Adding `"cate": "menu"` to a record puts a "Menu" chip in the
  row; naming it here is how you give it a better label and a place in the
  order.

A record with no `cate` appears under All and nowhere else.

Both generators set the field, so the categories survive a rebuild: the school
pack carries one per builder in its `BUILDERS` list, and the slide themes share
a single `CATE` at the top of `make-slide-themes.py`. Adding a template by hand
means setting `cate` yourself.

Searching stays inside the selected chip. That is the opposite of the Elements
panel, which searches its whole library whatever row you are on — there the
rows live in a dropdown, so a scoped search would hide results for no visible
reason, while here the chip doing the scoping is on screen.

### The school pack

Twenty-seven templates — thirteen posters and notices, a certificate, a door
sign and twelve presentation slides — are generated rather than hand-written:

```bash
python3 tools/make-school-templates.py      # write them
node tools/make-template-covers.mjs         # then shoot the thumbnails
python3 tools/make-school-templates.py --remove   # or take them back out
```

Editing a layout means editing the builder function for it and re-running,
which is a good deal less painful than hand-editing a JSON string.

They are ids 101–127 and every record carries `"pack": "school-events"`, which
is what `--remove` keys on, so removing them cannot touch anything else. Each
also carries a `cate`, set alongside its builder in the `BUILDERS` list.
Covers need the app running (`npm run dev` or `npm start`) because there is no
way to render a page outside the editor — pass a different base URL as the
first argument if you are not on port 4173, and any ids after it to re-shoot
just those (`node tools/make-template-covers.mjs http://127.0.0.1:5173 116`).

Ids follow position in `BUILDERS`, so a new layout goes on the end of that
list: inserting one in the middle renumbers everything after it and orphans the
covers already shot.

Every run reassigns every widget's uuid, so all twenty-seven files turn up
dirty in `git status` even when you changed one layout — or none. That is the
generator working, not you breaking something: the ids are per-widget handles
the editor mints fresh each time, and nothing outside the file refers to them.
Read the diff of the template you meant to change and take the rest as noise.

The twelve slides (113–124) are a deck rather than a dozen unrelated layouts —
one navy header, a 90px margin, Archivo for headings and Inter for body — so a
school can pick six of them and have a presentation that looks made rather than
assembled. Between them they cover the shape of an ordinary school talk: title,
section divider, agenda, one big number, three numbers, a quote, two columns, a
timeline, a photo and caption, next steps, the team, key dates, thank you.

Two things to hold on to when editing a slide. Text is **placed, not flowed**:
nothing reflows around a line that grew, so copy long enough to wrap runs into
whatever was positioned below it — the quote slide is two lines and has to stay
two. And a slide is 1920x1080 at 96dpi, which the .pptx export scales to a
standard 13.333in widescreen slide, so a design that fits the page fits
PowerPoint.

Nothing in the pack introduces a licence obligation. The shapes and icons come
from `materials/svg.json` (the icons are Lucide, ISC), the fonts are the
bundled Google Fonts under the OFL, and there are no photographs and no remote
URLs. Layouts are original; the copy is placeholder text for a school to
overwrite.

The two upstream demo templates that used to ship — Chinese-language phone
posters, ids 1 and 2, with covers hotlinked from an image host that was often
unreachable — have been removed, along with the two images under `mock/assets/`
that only they referenced. The gallery is the two generated packs and nothing
else, so removing both leaves the Templates panel empty rather than falling
back to demo content.

### The slide themes

Twenty-five more slides, ids 201–225, marked `"pack": "slide-themes"`:

```bash
python3 tools/make-slide-themes.py                       # write them
node tools/make-template-covers.mjs --pack=slide-themes  # then shoot the thumbnails
python3 tools/make-slide-themes.py --remove              # or take them back out
```

They are five decks of five rather than twenty-five separate layouts. Each deck
— Editorial, Swiss, Academic, Dark, Pastel — covers the same evening: a cover,
the year in numbers, results, facilities, and the year ahead. A school picks a
theme and gets five slides that already agree with each other, which is the
thing that is tedious to do by hand.

All twenty-five sit under the **Slides** chip, alongside the school pack's own
slides, set by `CATE` near the top of the script. A themed slide and a plain one
are the same thing to someone looking for a slide, so they share a chip;
splitting the themes out again is a matter of making `CATE` a per-builder field
the way the school pack does it.

The layouts are denser than the school pack's: real tables, four-up figures,
two-column body copy, and a ruled placeholder where a photograph goes. Three
things follow from that.

- **Heights come from a wrap estimate**, not from the browser. `text()` counts
  the lines a string will take at its width and sizes the box to fit, so
  rewriting the copy moves what is underneath it only if you rebuild. The
  estimate is deliberately generous: over-guessing leaves a gap, under-guessing
  overlaps the next thing down. `ADVANCE` holds the per-family character width
  it works from.
- **Per cents are written `&#37;`.** Template text has to be free of a literal
  `%` (see above) and these slides are full of test scores, so `text()` swaps
  it for the entity. Both exports read the text back through the DOM, so it
  comes out as `%` in the .pptx and the .png alike.
- **The tables are drawn, not laid out.** Each column is a text box on a shared
  right edge with a rule under the row, and `head_boxes()` widens the headers
  leftward so "DISTRICT" fits over "67&#37;" without colliding with the column
  before it.

The pack needs six fonts the school pack does not — Space Grotesk, Karla,
Spectral, DM Serif Display, IBM Plex Mono and JetBrains Mono. They are bundled
like the rest (`npm run fetch-fonts`, all SIL OFL) and appear in the text
panel, the last two under a new Monospace group.

## Text effects and sample elements

The Text panel has two rows below the plain heading/body buttons — **Text with
effects** and **Sample element groups** — and they come from
`components/list/text.json` and `components/list/comp.json`, each entry
pointing at a `components/detail/<id>.json` that holds the actual widgets.

```bash
python3 tools/make-samples.py                          # write them
node tools/make-sample-covers.mjs http://127.0.0.1:5173  # size and shoot
```

The cover pass does two jobs: it measures each sample in the real browser with
the real font and writes the box back, then screenshots it on transparency. It
has to run after any edit, because a sample whose box was sized for the old
wording clips the new one.

There are forty-three lettering presets and seventy-four grouped lockups.

### What a text preset is

Every entry in **Text with effects** is one text widget carrying a
`textEffects` array, and they are used two different ways:

- picking one in the **Text panel** drops the whole thing on the page — wording,
  font, size and effect;
- the **Choose** button in the settings panel's Text effects section lists the
  same file and takes only the effect stack, applying it to the text you have.
  It carries the preset's text colour across as well, because the plain text
  still paints underneath the stack — the hollow preset is only hollow if the
  text below it is transparent.

A stack is a list of layers, painted in array order, so the array reads back to
front: the face of the lettering is the last entry. The settings panel numbers
them the other way up, nearest first. Each layer can carry:

| part      | what it does                                                                |
| --------- | --------------------------------------------------------------------------- |
| `filling` | `type: 0` flat colour, `2` gradient (`gradient.angle` + `stops`), `1` image |
| `stroke`  | an outline, drawn outward from the glyph edge                               |
| `shadow`  | offset and blur; with no offset and no fill of its own, a glow              |
| `offset`  | the whole layer moved — stack several for an extruded block                 |
| `skew`    | the whole layer leaned, pivoting on the bottom of the box                   |

Only `filling`, `stroke`, `shadow` and `offset` came from upstream; `skew` is
ours, and it is what makes a cast shadow possible. A preset stores only the
parts it uses, and the panel fills in the rest when you open it, so an older
preset still offers every control.

Three things worth knowing before you add one:

- **Keep it to a single widget.** The Choose button reads `textEffects` off the
  parsed detail file, so a grouped sample has nothing for it to apply.
- **The step in an extrude has to be one pixel.** At three the diagonals come
  out visibly stepped; depth comes from the number of layers instead.
- **A stroke, a gradient or an image fill does not survive PNG export.** All
  three are drawn with CSS that html2canvas has no renderer for
  (`-webkit-text-stroke`, `background-clip: text`), so an outlined heading
  exports as a flat one. Shadows and offsets do survive. The .pptx export is
  aware of this and rasterises text carrying any effect rather than writing it
  as editable text.

Beyond the stack, three things a single text widget can still carry:

- **A background colour**, which paints the whole box. Neon glow, Chalkboard
  hand, Engraved plate and Debossed on navy are type on a plate. There is no
  padding property, so they buy their vertical air with a generous
  `lineHeight`, and the cover pass pads the sides.
- **A `text-decoration` shorthand**, written straight into the element's inline
  style. `underline #E1A731ff 18px` gives Thick underline a weight and colour
  the underline button cannot set, and `underline wavy` is where Wavy underline
  comes from. The .pptx export only matches the bare string `underline`, so it
  drops the rule.
- **A tiling image fill**, for a pattern a gradient cannot describe. A
  background repeats by default, so a one-cell SVG tile is enough — that is
  Dotted fill, Checker fill and Comic halftone. The settings panel only offers
  a colour swatch for flat and gradient fills, so a layer filled this way
  cannot be recoloured there; it is used only where the pattern _is_ the
  preset.

### Where the line between the two sections falls

Not quite where you might expect. A stack styles the whole run at once, so
anything wanting a second styled run, per-letter rotation, a rule, or a shape
behind the words is a **group** however much it reads as lettering — Arched,
Ransom letters, Mixed weight, Stacked words, Knockout slab and Pill highlight
are all in Sample element groups for that reason.

A group is a list of widgets with a `w-group` container last. Its size is
measured off its children rather than written down: the panel centres a group
on the page using that box, so a container disagreeing with the artwork inside
drops the group off-centre. Every part is its own widget and every shape keeps
its palette in `colors`, so a school can change a colour or a line of copy
without rebuilding the artwork.
