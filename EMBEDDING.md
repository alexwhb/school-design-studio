# Embedding the editor in the school planner

The editor is a React component. It mounts into a `<div>` in the host app — no
iframe, no second React root, no separate bundle to keep in step.

Two things it does that reach past its own box, both deliberate: presentation
mode takes over the viewport (it is still inside `.ds-root`, so it keeps its
styles), and exporting writes a file through the browser's download. Everything
else stays inside the container it was given.

## What you get

```tsx
import { DesignStudio } from 'design-studio'
import 'design-studio/style.css'

<DesignStudio />
```

| Prop            | Default  | What it does                                                                 |
| --------------- | -------- | ---------------------------------------------------------------------------- |
| `mode`          | `'home'` | Which screen to show: the editor, or one of the render-only screens.          |
| `apiUrl`        | `''`     | Where `/design/*` lives. Empty means "same origin as the host".               |
| `homeUrl`       | `'/'`    | Where the app name in the toolbar links back to.                              |
| `appName`       | `'Design Studio'` | Name shown in the toolbar.                                          |
| `theme`         | `'host'` | `host` follows the `dark` class on `<html>`; `light`/`dark` pin it.           |
| `config`        | —        | Anything else from `react/src/config.ts`.                                     |

## Building it

```bash
npm run build:embed     # -> dist-embed/design-studio.js + design-studio.css
```

`react`, `react-dom` and the JSX runtime are external, so the host's copy of
React is the only one on the page.

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
`react/src/common/hooks/appRoot.ts`.

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
   photos). `server/content-library.mjs` in this repo is a drop-in Express
   handler; point `apiUrl` elsewhere if the planner proxies them.
2. **`/fonts/fonts.css` and `/fonts/*`** — the fonts a design can use. They have
   to be at the same paths in the host, because font URLs are stored inside
   saved designs.
3. **`/snap.svg-min.js`** — used to recolour shape SVGs. The component loads it
   itself if `window.Snap` is missing.

Copy `public/` from this repo into the planner's `public/`.

### What it keeps, and where

Everything the editor saves lives in the browser, in one IndexedDB database
called `design-studio`: uploaded pictures in `uploads`, the design being worked
on in `designs`. Two consequences worth knowing before this goes near a real
school:

- It is per-origin and per-browser. A teacher who starts a poster on the
  staffroom machine will not find it on their laptop, and clearing site data
  loses it.
- It is the seam for the planner's own storage. `localUploads.ts` and
  `localDesigns.ts` are four functions each; swap their bodies for calls to the
  planner's API and nothing else has to change.

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
