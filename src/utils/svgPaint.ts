import { hexA2RGBA } from '@/packages/color-picker/utils/color'
import { isGradient, parseGradient } from '@/packages/color-picker/utils/gradient'

const SVG_NS = 'http://www.w3.org/2000/svg'

export type PaintBox = { x: number; y: number; width: number; height: number }

/** The area a gradient is laid across, in the shape's own coordinates. */
export function viewBoxOf(svg: SVGSVGElement): PaintBox {
  const box = svg.viewBox?.baseVal
  if (box && (box.width || box.height)) return { x: box.x, y: box.y, width: box.width, height: box.height }
  return { x: 0, y: 0, width: Number(svg.getAttribute('width')) || 100, height: Number(svg.getAttribute('height')) || 100 }
}

function defsOf(svg: SVGSVGElement) {
  const existing = svg.querySelector(':scope > defs')
  if (existing) return existing
  const defs = document.createElementNS(SVG_NS, 'defs')
  svg.insertBefore(defs, svg.firstChild)
  return defs
}

function appendStops(node: Element, stops: { color: string; offset: number }[]) {
  stops.forEach((stop) => {
    const [r, g, b, a] = hexA2RGBA(stop.color)
    const el = document.createElementNS(SVG_NS, 'stop')
    el.setAttribute('offset', `${stop.offset * 100}%`)
    el.setAttribute('stop-color', `rgb(${r},${g},${b})`)
    el.setAttribute('stop-opacity', String(Number.isFinite(a) ? a : 1))
    node.appendChild(el)
  })
}

/**
 * Gives an SVG attribute something it can hold.
 *
 * A flat colour goes straight through, because `fill="#ff0000ff"` is already
 * valid. A CSS gradient is not. SVG paints with a gradient by referring to a
 * paint server, so the gradient is built under the shape's own `<defs>` with
 * the id given, and what comes back is `url(#id)`.
 *
 * The paint server is measured in the shape's coordinates rather than each
 * element's bounding box, so a gradient runs across the whole shape the way it
 * does in the picker, instead of starting again on every path.
 */
export function resolveSvgPaint(svg: SVGSVGElement, id: string, value: string, box: PaintBox): string {
  svg.querySelector(`#${CSS.escape(id)}`)?.remove()
  const node = createGradientNode(id, value, box)
  if (!node) return value
  defsOf(svg).appendChild(node)
  return `url(#${id})`
}

/**
 * The paint server on its own, for a caller that keeps its own `<defs>`.
 *
 * `applySvgBorder` builds and throws away a `<defs>` of clip paths on every
 * pass, and the border's gradient belongs in it: put there, it is cleaned up
 * with the rest rather than left behind when the border goes.
 *
 * Returns null when the value is a flat colour, which needs no paint server.
 */
export function createGradientNode(id: string, value: string, box: PaintBox): Element | null {
  if (!value || !isGradient(value)) return null

  const gradient = parseGradient(value)
  if (!gradient) return null

  const { x, y, width, height } = box
  const cx = x + width / 2
  const cy = y + height / 2
  let node: Element

  if (gradient.type === 'radial') {
    node = document.createElementNS(SVG_NS, 'radialGradient')
    node.setAttribute('cx', String(cx))
    node.setAttribute('cy', String(cy))
    // CSS reaches the farthest corner by default, which for a circle is the
    // half-diagonal.
    node.setAttribute('r', String(Math.hypot(width, height) / 2))
  } else {
    // CSS measures the angle from straight up and turns clockwise, and the line
    // is long enough that the last stop lands on the far corner. SVG wants the
    // two ends of that line instead.
    const radians = (gradient.angle * Math.PI) / 180
    const dx = Math.sin(radians)
    const dy = -Math.cos(radians)
    const length = Math.abs(width * dx) + Math.abs(height * dy)
    node = document.createElementNS(SVG_NS, 'linearGradient')
    node.setAttribute('x1', String(cx - (dx * length) / 2))
    node.setAttribute('y1', String(cy - (dy * length) / 2))
    node.setAttribute('x2', String(cx + (dx * length) / 2))
    node.setAttribute('y2', String(cy + (dy * length) / 2))
  }

  node.setAttribute('id', id)
  node.setAttribute('gradientUnits', 'userSpaceOnUse')
  appendStops(node, gradient.stops)
  return node
}
