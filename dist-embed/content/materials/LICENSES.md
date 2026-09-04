# Bundled element licences

## Shapes (`svg.json`)

**Geometric shapes** — rectangle, circle, triangle, star, arrow, banner, badge
and so on. Generated for this project; no third-party rights apply.

**Icons** — 51 icons from [Lucide](https://lucide.dev), used under the ISC
licence. The full notice is in `LICENSE-lucide.txt` and must travel with any
redistribution. Each icon keeps its `@license` comment in the markup.

Lucide ships stroke icons as `stroke="currentColor"`, which nothing resolves
once the markup is parsed onto the canvas. On import that is rewritten to the
editor's `{{colors[0]}}` placeholder with a dark default, so the icons render
and stay recolourable.

## Masks (`mask.json`)

Derived from the geometric shapes above. Generated for this project.

## Stickers (`png.json`)

Thirty flat vector stickers — apple, bus, trophy, clipboard, lab flask and so
on — generated for this project by `tools/make-stickers.py`. No third-party
rights apply: every path is drawn in that script, nothing is traced from
existing artwork, and nothing is fetched at runtime.

They replace three hotlinked kawaii planner cut-outs that came from upstream,
captioned in Chinese and served from an image host that is often unreachable.

They are `.svg` under `public/stickers/`, but filed as `type: "image"`. `svg`
means "recolourable line art" to this app, and the Elements panel inverts
those in dark mode, which would wreck full-colour artwork.

## Templates

Ids 1 and 2 are upstream poster-design demo content, under that project's MIT
licence. The school pack (101–112) is generated — see CONTENT.md.

## Photos (`photos/*.json`)

Lists of Unsplash URLs from upstream. Nothing is bundled; the browser loads
them directly. Check the Unsplash licence before relying on them in production.
