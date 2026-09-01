/**
 * Outlines a shape by stroking its own geometry.
 *
 * Two things make this less obvious than setting `stroke` on the markup.
 *
 * A shape is stored with a viewBox and drawn with `preserveAspectRatio="none"`,
 * so a 200×200 rectangle stretched into a 350×78 banner is scaled by different
 * amounts on each axis. A plain stroke width goes through that scale and comes
 * out fat on one side and thin on the other, so the stroke is asked to be
 * measured in the SVG's own viewport instead — `non-scaling-stroke` — where one
 * unit is one design pixel whatever the shape has been stretched to.
 *
 * And a stroke straddles the edge it follows, so half of it falls outside the
 * shape, where the SVG viewport clips it and the export crops it again. Asking
 * for twice the width and clipping the result to the shape leaves exactly the
 * width that was asked for, lying wholly inside the edge — which is also what
 * the keyline on a photograph does, so the two read as the same setting.
 *
 * Shapes that already stroke themselves — every Lucide icon is drawn as lines,
 * not fills — are left alone. Adding to their stroke would not outline them, it
 * would repaint them.
 */
import type { TWidgetBorder } from '../widgetBorder'

const NS = 'http://www.w3.org/2000/svg'

const DRAWABLE = 'path, rect, circle, ellipse, polygon, polyline, line'

/** Attributes this module writes, and so is free to take back off again. */
const OWNED = ['stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'vector-effect', 'clip-path']

/** Ids have to be unique across the document, not just within one shape. */
let sequence = 0

/**
 * True when the shape paints a stroke of its own, here or anywhere above.
 *
 * `stroke` inherits, and a Lucide icon puts it on the root `<svg>` rather than
 * on each path, so the walk has to go all the way up to the root.
 */
function paintsItsOwnStroke(el: Element): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const stroke = node.getAttribute('stroke')
    if (stroke && stroke !== 'none') return true
    if (node.tagName.toLowerCase() === 'svg') break
  }
  return false
}

/** The gap pattern for a dashed or dotted outline, in design pixels. */
function dashesFor(border: TWidgetBorder): string | null {
  if (border.style === 'dashed') return `${border.width * 3} ${border.width * 2}`
  if (border.style === 'dotted') return `0 ${border.width * 2}`
  return null
}

/**
 * Applies `border` to `svg`, replacing whatever the last call left behind.
 *
 * Called again for every step of the thickness slider, so undoing the previous
 * pass first is what keeps a dragged slider from stacking clip paths up in the
 * markup.
 */
export default function applySvgBorder(svg: SVGSVGElement, border: TWidgetBorder | null): void {
  for (const defs of Array.from(svg.querySelectorAll('[data-border-clip]'))) defs.remove()
  for (const el of Array.from(svg.querySelectorAll('[data-border]'))) {
    el.removeAttribute('data-border')
    for (const attribute of OWNED) el.removeAttribute(attribute)
  }
  if (!border) return

  const defs = document.createElementNS(NS, 'defs')
  defs.setAttribute('data-border-clip', '')
  const dashes = dashesFor(border)

  for (const el of Array.from(svg.querySelectorAll(DRAWABLE))) {
    if (paintsItsOwnStroke(el)) continue

    const id = `shape-outline-${++sequence}`
    const clip = document.createElementNS(NS, 'clipPath')
    clip.setAttribute('id', id)
    const silhouette = el.cloneNode(false) as Element
    silhouette.removeAttribute('id')
    // Which parts of a compound path count as inside it is the fill rule's
    // decision, and the clip has to make the same one or a shape with a hole in
    // it — the Frame — loses its hole.
    const fillRule = el.getAttribute('fill-rule')
    if (fillRule) silhouette.setAttribute('clip-rule', fillRule)
    clip.appendChild(silhouette)
    defs.appendChild(clip)

    el.setAttribute('stroke', border.color)
    el.setAttribute('stroke-width', String(border.width * 2))
    el.setAttribute('vector-effect', 'non-scaling-stroke')
    if (dashes) el.setAttribute('stroke-dasharray', dashes)
    if (border.style === 'dotted') el.setAttribute('stroke-linecap', 'round')
    el.setAttribute('clip-path', `url(#${id})`)
    el.setAttribute('data-border', '')
  }

  if (defs.childNodes.length) svg.insertBefore(defs, svg.firstChild)
}
