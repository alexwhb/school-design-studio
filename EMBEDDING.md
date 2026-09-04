# Embedding the editor in the school planner

The editor is a React component. It mounts into a `<div>` in the host app — no
iframe, no second React root, no separate bundle to keep in step.

Two things it does that reach past its own box, both deliberate. Presentation
mode takes over the viewport; it is still inside `.ds-root`, so it keeps its
styles. And the Export menu writes a file through the browser's download, which
is what somebody clicking Export means — a host that wants the bytes instead
asks the ref for them. Everything else stays inside the container it was given.

## What you get

```tsx
import { DesignStudio } from 'design-studio'
import 'design-studio/style.css'

export default function Editor() {
  return <DesignStudio />
}
```

| Prop               | Default           | What it does                                                                        |
| ------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| `mode`             | `'home'`          | Which screen to show: the editor, or one of the render-only screens.                |
| `apiUrl`           | `''`              | Where `/design/*` lives. Empty means "same origin as the host".                     |
| `homeUrl`          | `'/'`             | Where the app name in the toolbar links back to. Not shown at all once `onSave` is. |
| `appName`          | `'Design Studio'` | Name shown in the toolbar.                                                          |
| `theme`            | `'host'`          | `host` follows the `dark` class on `<html>`; `light`/`dark` pin it.                 |
| `brand`            | —                 | The school's brand kit. Given, the host owns it; left out, it lives in the browser. |
| `onBrandChange`    | —                 | Called with the whole kit whenever the Brand panel changes it.                      |
| `document`         | —                 | The design to edit. Given, the browser keeps none of its own.                       |
| `documentKind`     | `'slides'`        | `slides` or `poster`. Sets the page, the gallery, and whether there is a presenter. |
| `onDocumentChange` | —                 | The whole document, a second after the last edit.                                   |
| `onSave`           | —                 | Puts a Save in the toolbar and answers Cmd/Ctrl-S.                                  |
| `saveLabel`        | `'Save'`          | What that button says.                                                              |
| `uploads`          | —                 | The host's file store, for the Uploads section of the Photos panel.                 |
| `assistant`        | —                 | A panel of the host's own, behind an "AI" tab at the top of the left rail.          |
| `ref`              | —                 | A `DesignStudioHandle`, for driving the editor from outside.                        |
| `config`           | —                 | Anything else from `src/config.ts`.                                                 |

Everything the editor keeps in the browser is per-feature, and each of the three
props above turns one of them off: `brand` stops the kit being stored, `document`
stops the design being stored and the restore offer appearing, `uploads` stops
pictures being stored. Left out, each behaves as it always did.

### The brand kit

The **Brand** panel holds the school's crest, colours, fonts and contact line,
and everything else in the editor reads from it — templates fill their
`{{school.name}}` fields as they land, the colour pickers offer its colours, the
font list offers its fonts. See **Brand kit** in [README.md](README.md) for what
it does; this is only where it is kept.

Left alone, the kit lives in the browser alongside the uploads and the draft.
That is right for the standalone editor and wrong for a planner that already
knows which school the user belongs to, so the two props hand ownership over:

```tsx
const [brand, setBrand] = useState<TBrandKit>(school.brandKit)

<DesignStudio brand={brand} onBrandChange={(kit) => { setBrand(kit); void save(kit) }} />
```

Passing `brand` at all switches the editor to host-managed: the kit is used as
given, the browser's own copy is neither read nor written, and every change made
in the panel comes back through `onBrandChange` as a whole plain kit, debounced
so that typing a name is one call rather than one per letter. Storing it is the
host's job — nothing is kept if the host drops it.

Changing the prop later is followed, which is what a planner does when the user
switches school. It is compared by contents rather than by identity, so a kit
built inline in `render` is not a change and does not interrupt typing in the
panel.

`TBrandKit`, `TBrandFonts` and `TBrandLogo` are exported from the package. Every
field is optional in practice: anything missing, and any font id the editor no
longer bundles, is dropped rather than trusted. The logo is a data URL, so a kit
is self-contained JSON with no second fetch behind it.

## The design

Left alone, the editor keeps one design in IndexedDB and offers it back on the
next visit. That is right for a tool somebody opens on their own machine and
wrong for a planner, which already knows which school and which user this is and
has somewhere better than one browser to put the work. So the host hands the
design in and takes the changes back out:

```tsx
<DesignStudio
  document={artefact.content}
  documentKind="slides"
  onDocumentChange={(doc) => draft.set(doc)}
  onSave={async (doc) => {
    await fetch(`/design/${artefact.id}`, { method: 'POST', body: JSON.stringify(doc) })
  }}
  saveLabel="Save to planner"
/>
```

A `DesignDocument` is a format tag, a name, and one page per entry in `layouts`
— exactly the array the widget store holds, so what goes in and what comes out
are the same shape with nothing lost:

```ts
type DesignDocument = {
  format: 'design-studio/v1'
  title: string
  layouts: TdLayout[]
}
```

Passing `document` at all switches the design to host-managed. Nothing is
written to IndexedDB, the "pick up where you left off?" offer never appears —
the draft it would offer is somebody else's work — and this document is where
undo stops going back.

**It is read once.** Changing the prop later is deliberately _not_ followed. A
design is not a setting; swapping one out from under somebody mid-sentence would
lose what they were typing. To open a different design, call `setDocument` on the
ref, which is an explicit act, or remount the component with a new `key`.

`onDocumentChange` fires a second after the last edit — one call for a typed
word rather than one per letter — and again when the tab is hidden, which on
mobile is often the last warning before the browser discards the page. `onSave`
is the toolbar button and Cmd/Ctrl-S. The pill beside the design's name follows
the promise it returns: **Saving…**, then **Saved**, or **Couldn't save**. After
a save that resolved, `isDirty()` is false.

### What is being made

`documentKind` is the answer to a question the host already knows: somebody
pressed "make a presentation" or "make a sign" two screens ago.

|                          | `slides`        | `poster`                                    |
| ------------------------ | --------------- | ------------------------------------------- |
| A blank design starts at | 1920 × 1080     | 1275 × 1650 (Letter portrait at 150 DPI)    |
| The gallery offers       | slide templates | posters, flyers, signs, awards              |
| Present, speaker notes   | yes             | no — nobody stands up and presents a poster |

## Uploads

```tsx
const uploads = {
  async list() { return (await fetch('/uploads').then((r) => r.json())).map(toHostUpload) },
  async upload(file: File) { … },
  async remove(id: string) { … },
}

<DesignStudio uploads={uploads} />
```

Three calls, because that is all the Uploads section does. Given, the browser's
own store is neither read nor written — by the panel, by the paste handler, or
by the picture picker, none of which know which store they are talking to. A
`HostUpload` is `{ id, url, width, height, name }`; `url` is what goes into the
design, so it has to keep working for as long as the design does.

### Stock photos

There is a fourth call, and it is optional:

```ts
async importUrl(url: string, meta: HostImportMeta): Promise<HostUpload>
```

The Photos panel and the background library hand back `images.unsplash.com`
addresses, and without this the editor writes them straight into the design.
That is fine for a tool whose work lives in one browser and wrong for a planner:
a design has to still look like itself in a year, and Unsplash can change a URL
or a key can be revoked. Given `importUrl`, every _remote_ picture is fetched
into your store first and the design points at the copy.

`meta` carries what the panel knows — `name`, `width`, `height`, and an
`attribution` of `{ photographer, profileUrl, photoUrl }`. Keep the attribution:
Unsplash's terms ask for it, and once the URL has been replaced the studio has
nowhere to put it.

Only remote pictures go through it. An upload is already yours, a sticker is
markup rather than an address, and a data URL is the bytes themselves. The
editor shows its loading overlay while the call runs, and if it rejects it says
so and **does not place the picture** — falling back to the remote address would
put in exactly the thing you refused. Download tracking still fires either way,
because Unsplash counts the picture being used and it is being used. The copy
also turns up under "My uploads", since it is one of the school's pictures now.

## A brand kit somebody else looks after

```tsx
<DesignStudio brand={kit} brandReadOnly={!user.isAdmin} />
```

The panel shows the kit and will not change it. What it does _with_ the kit is
untouched, because none of that changes the kit: Apply brand still applies, a
colour still paints the selection, the crest still drops onto the page, a field
still goes into a text box. What goes is replacing or removing the crest,
editing or adding a colour, and the fonts and the written details.

The guarantee is not the greying-out. `updateBrandKit` is the one door into the
kit and it refuses outright, so a control somebody forgot to disable cannot get
through it either.

## Driving it from outside

```tsx
const studio = useRef<DesignStudioHandle>(null)

<DesignStudio ref={studio} … />

const pdf = await studio.current.exportPdf()   // a Blob, not a download
```

|                                      |                                                                   |
| ------------------------------------ | ----------------------------------------------------------------- |
| `getDocument()`                      | Plain JSON, safe to structured-clone or stringify.                |
| `setDocument(doc, { resetHistory })` | Replaces the canvas. Resets the undo baseline unless told not to. |
| `applyOps(ops)`                      | `{ applied, rejected }`. See below.                               |
| `exportPdf()` / `exportPptx()`       | A `Blob` — `application/pdf`, or the OOXML presentation type.     |
| `exportPng(pageIndex, { scale })`    | One page. `scale: 1` is the page's own pixel size.                |
| `goToPage(index)`                    |                                                                   |
| `isDirty()`                          | Whether the canvas has moved on from the last save.               |

Everything on it is a whole-document operation on purpose. A host that could
move one widget by ten pixels would, and a layout drawn for a school would
slowly stop being one.

The exports are the same code the Export menu runs; the only difference is that
these hand back the bytes instead of writing a file. The host is the one that
knows whether they should be downloaded, attached to a task, or POSTed.

## The AI tab

```tsx
<DesignStudio assistant={<MyPanel studio={studio} />} ref={studio} />
```

The node is rendered in the panel column at panel width, behind a tab at the top
of the rail. The studio passes it nothing and knows nothing about it: everything
it wants to do to the design it does through the ref. Without the prop there is
no tab, which is what the standalone editor should show.

## Composing a design without a browser

`design-studio/compose` is the editor's layout knowledge as pure functions over
JSON. No DOM, no `window`, no React, no valtio — it runs in a request handler on
Node, under vitest's `node` environment, and in the browser, and gives the same
answer in all three. That is what lets a planner compose a deck from a model's
outline on the server, store it, and open the same JSON in the editor later.

```ts
import { composeDeck, describeDocument, applyOps, applyBrand, SLIDE_THEME_KEYS } from 'design-studio/compose'

const doc = composeDeck(outline, { theme: 'editorial', brand: school.brandKit })
const view = describeDocument(doc) // what an LLM is shown
const { doc: next, rejected } = applyOps(doc, ops) // what it is allowed to send back
```

|                                 |                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `composeDeck(outline, opts)`    | Five slide layouts: `title`, `statement`, `content`, `two-column`, `media`.                  |
| `composePoster(outline, opts)`  | Five sign layouts: `direction`, `icon`, `statement`, `number`, `notice`.                     |
| `describeDocument(doc)`         | Every text box with its id, its words and its role. Never a data URL or a byte of a picture. |
| `applyOps(doc, ops, { brand })` | The six operations, applied or refused with a reason.                                        |
| `applyBrand(doc, kit)`          | What the Brand panel's Apply brand does, on a copy.                                          |
| `pageKinds(kind)`               | The `kind` values `addPage` will take.                                                       |
| `SLIDE_THEME_KEYS`              | `editorial`, `swiss`, `academic`, `dark`, `pastel`.                                          |
| `POSTER_PACK_KEYS`              | `navy`, `crimson`, `forest`.                                                                 |

**Where the look comes from.** The themes are not a second set of colours
written out here — they are read off the artwork the editor already ships. Each
theme's own cover slide and one poster per pack are imported, and the paper, the
ink, the soft second ink, the accent, the hairline and the three faces are taken
out of them by contrast against the paper rather than by position, so the same
rule reads the dark theme and the cream one. Only those eight files are bundled;
importing the whole gallery to find twenty numbers would put three quarters of a
megabyte of somebody else's artwork into the module.

### What markup a design may hold

```ts
import { sanitizeMarkup } from 'design-studio/compose'

const safe = sanitizeMarkup(widget.text)
```

A text widget's `text` is an HTML string, and a planner stores those and renders
them back into other people's browsers. So call this on every `w-text.text` of
every document you store. It is the one description of what may be in one:

```
b/strong   i/em   u   s/strike/del   span[style=color:…]   a[href]   br
div/p/ul/ol/li
```

Everything else is read for its words and dropped — fonts, sizes, classes,
tables, images, stylesheets, scripts. A colour comes out as `#rrggbb`, a link as
an `http`, `https`, `mailto` or `tel` address, and a `javascript:` URL not at
all.

It is an allowlist by construction rather than a list of forbidden things. The
markup is parsed into runs of text with a fixed handful of on-or-off styles, and
then written back out: every run is escaped, and the only elements that can be
emitted are the six above with the two attributes above. There is no branch on
which an unexpected attribute survives, so there is no `onerror` to remember to
block, and nothing here to keep up to date as new attacks are invented.

It is the editor's own rule, not a second one. `richText.ts` in the browser and
`compose/markup.ts` on a server share the allowlist and the writer, and differ
only in how they parse; the e2e suite runs both over the same thirty-odd inputs
and requires them to agree character for character.

It is also safe to point at rubbish. This runs on your server over text that
reached you through a model, so the cost of an answer matters as much as the
answer: the parser reads each character once, and it stops deepening the tree
past sixty-four levels, which is where a recursive reader would otherwise run
out of stack. Two hundred thousand stray `<` take about a tenth of a second. An
element past the depth cap still contributes its words.

**Nothing overflows.** There is no font engine on a server, so text is measured
from the shape of the letters and a factor per family, deliberately a few per
cent pessimistic: guessing a line wider than it turns out to be costs a slightly
smaller heading, and guessing narrower costs a heading off the edge of a printed
page. A heading shrinks a point at a time to a floor and is only then cut with
an ellipsis. Bullets past what fits are dropped — nobody reads the seventh
bullet on a slide, they read the mess at the bottom of the page.

**The six operations.**

```ts
type DesignOp = { op: 'setText'; id: string; text: string } | { op: 'setImage'; id: string; url: string; width: number; height: number } | { op: 'addPage'; after: number; kind: string; fields: Record<string, string> } | { op: 'removePage'; index: number } | { op: 'movePage'; from: number; to: number } | { op: 'applyBrand' }
```

`applyOps` never throws. An op naming an id that is not on the page, or an index
off the end, comes back in `rejected` with a reason — a model handed an
exception learns nothing, and a half-applied batch is worse than a refused one.
Everything an op does not name is left exactly as it was. `setImage` keeps the
frame where the layout put it and re-crops the picture to fill it, so swapping a
portrait for a landscape leaves no hole and pushes nothing sideways.

The same six go through the component's `ref`, against the design on screen, as
one entry in the undo stack.

## The content library

`design-studio/server` is the six read-only `/design/*` endpoints the panels ask
for templates, elements, stickers and photographs. Five of them are the JSON
bundled in the package; the sixth proxies Unsplash, which has to be a proxy
because the access key must never reach a browser.

```ts
import { createContentLibrary } from 'design-studio/server'

const library = createContentLibrary({ unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY })

// in a resource route
const { status, body, headers } = await library.handle(url.pathname, url.searchParams)
return json(body, { status, headers })
```

Framework-agnostic on purpose: no Express, no `req`, no `res`. An Express
wrapper is four lines and so is a React Router resource route, and neither can
be written against the other one's types. The Unsplash responses are cached for
ten minutes per library, because the free tier allows fifty requests an hour and
an infinitely scrolling panel with a search box will spend that in two minutes.

## Building it

```bash
npm run build:embed     # -> dist-embed/
```

That is four steps: the editor, the compose entry, the declarations, and a copy
of the bundled content the server entry reads. They are separate Vite builds
rather than one with two entries — one build with two entries lets Rollup put
what they share into a chunk they both import, and the day a browser-only module
lands in that chunk, `import('design-studio/compose')` stops working on Node
with nothing to say why. Two builds cannot share a chunk, so the guarantee holds
by construction.

`react`, `react-dom` and the JSX runtime are external, so the host's copy of
React is the only one on the page.

**Transformers.js is external too, and invisible to your bundler.** Bundled, it
put a 63 MB chunk in a package the host has to install for a button most designs
never touch. It was already behind a dynamic import, and there are three other
ways to have background removal — a host's own remover through
`setBackgroundRemover`, a service through `config.BACKGROUND_REMOVAL_URL`, or
`config.BACKGROUND_REMOVAL: false` to take the button away. So the one that
costs 63 MB is the one you opt into, by installing `@huggingface/transformers`
yourself. It is an optional peer, so npm neither installs it nor warns.

Being external is not enough on its own. A literal `import('@huggingface/transformers')`
in the shipped chunk is a static dependency as far as your bundler is concerned:
esbuild fails the dev pre-bundle and Rollup fails the production build, and the
app that does not use background removal is the one that will not start. So the
specifier is held in a variable and the call carries `/* @vite-ignore */` and
`/* webpackIgnore: true */`. A specifier a bundler cannot read is one it hands
to the browser untouched, which is what this import is for. Reached with nothing
behind it, the import rejects and the button says the library is not installed.

### Cutting a release

```bash
npm run release:embed              # build, commit, tag, push
npm run release:embed -- --dry-run # build and show what would be in the tag
```

The planner depends on this repo as a git dependency, and a git dependency is a
checkout rather than a build: whatever is in the tagged tree is what lands in
`node_modules`. Building on install is not an option either — a `prepare` script
would mean the planner's CI installing TypeScript, Vite and Playwright to
produce a file this machine already has.

So the tag carries the built output and a slim `package.json`: no
devDependencies, no scripts, no `prepare`, and no dependencies at all — React is
a peer, Transformers.js is an optional one, and everything else is inlined. It
is an **orphan** commit rather than one on `main`, because history there is the
source and committing megabytes of bundle once a release would double the repo
inside a year for files nobody reads. An orphan commit costs exactly its own
contents and `main` never sees it.

```json
"design-studio": "github:alexwhb/school-design-studio#embed-v0.1.0"
```

`npm pack` from a checkout of that tag produces the same tarball, which is the
way to install it before a tag exists.

## Why the host's CSS survives

The editor was written as a whole page: it styles `html`, `body` and `*`, which
would wreck any app it was dropped into. The embed build runs every rule through
`tools/build/scope-css.mjs`, which

- prefixes every selector with `.ds-root`,
- rewrites `:root`, `html` and `body` to `.ds-root`,
- rewrites `html.dark` to `.ds-root.ds-dark`.

That transform runs **only** in `vite.embed.config.ts`. Consumers import the
already-scoped `design-studio.css`; nothing scopes their own stylesheets.

Menus, tooltips, dialogs and toasts are portalled into `.ds-root` rather than
`document.body` for the same reason — outside that root the scoped rules would
not match and they would render unstyled. See
`src/common/hooks/appRoot.ts`.

The editor never writes to `document.documentElement`. In `theme="host"` it
watches the host's `dark` class and paints its own root.

`tests/e2e/embed.spec.ts` asserts all of this, including a sweep that fails if
any shipped rule is not confined to `.ds-root`.

## Wiring it into the planner

The planner renders on the server, and the editor is browser-only (canvas,
`window`, IndexedDB). Load it client-side:

```tsx
// app/routes/admin+/design-studio.tsx
import { lazy, Suspense } from 'react'
import { ClientOnly } from 'remix-utils/client-only'

const DesignStudio = lazy(async () => ({
  default: (await import('design-studio')).DesignStudio,
}))

export default function DesignStudioRoute() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ClientOnly fallback={<div className="p-6 text-sm">Loading the editor…</div>}>
        {() => (
          <Suspense fallback={<div className="p-6 text-sm">Loading the editor…</div>}>
            <DesignStudio homeUrl="/admin" appName="Design Studio" />
          </Suspense>
        )}
      </ClientOnly>
    </div>
  )
}
```

Import `design-studio/style.css` once, from `app/root.tsx`.

### Three things the host has to serve

The toolbar's icon font is not one of them: it is inside `design-studio.css`, as
a data URL. A stylesheet fetched at runtime never goes through the build, so its
`.iconfont` and hundred-odd `.icon-*` rules would have landed on the host
unscoped.

1. **`/design/*`** — the read-only content endpoints (templates, elements,
   photos). `design-studio/server` answers them; see
   [The content library](#the-content-library). Point `apiUrl` elsewhere if the
   planner would rather serve them from another origin.
2. **`/fonts/fonts.css` and `/fonts/*`** — the fonts a design can use. They have
   to be at the same paths in the host, because font URLs are stored inside
   saved designs.
3. **`/snap.svg-min.js`** — used to recolour shape SVGs. The component loads it
   itself if `window.Snap` is missing.

Copy `public/` from this repo into the planner's `public/`.

### What it keeps, and where

Everything the editor saves lives in the browser, in one IndexedDB database
called `design-studio`: uploaded pictures in `uploads`, the design being worked
on in `designs`, and the school's brand kit in `brand` — that last one only when
the host has not taken it over with the `brand` prop. Two consequences worth
knowing before this goes near a real school:

- It is per-origin and per-browser. A teacher who starts a poster on the
  staffroom machine will not find it on their laptop, and clearing site data
  loses it.
- It is not where a planner should keep anything. The `document`, `uploads` and
  `brand` props each take one of the three over, and with all three given the
  editor writes to IndexedDB not at all.

The design is written two seconds after the last edit, and again when the tab is
hidden. On a blank canvas the editor offers the last one back.

### Sizing

`.ds-root` fills its container and has `min-width: 1180px`; the editor's layout
does not go narrower than that. Give it a container with a definite height —
`h-screen`, a grid row, or an explicit `height` — not `h-auto`.

## Running it from source instead

If the planner would rather build the editor with its own pipeline, add an alias
to `design-studio/src` and apply the scoping plugin to those files only. The
built bundle is the simpler path and is what `EMBEDDING.md` assumes.
