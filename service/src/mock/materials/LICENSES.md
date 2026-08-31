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

## Stickers (`png.json`) and templates

Still the upstream poster-design demo content, under that project's MIT licence.
Drawn in a style unlikely to suit a Western school — expect to replace them.

## Photos (`photos/*.json`)

Lists of Unsplash URLs from upstream. Nothing is bundled; the browser loads
them directly. Check the Unsplash licence before relying on them in production.
