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

/**
 * A gradient worked out but not yet built, so a caller can build it as DOM or
 * as React elements from the same numbers.
 *
 * `coords` are the attributes the element of that type takes — `x1`/`y1`/`x2`/
 * `y2` for a linear, `cx`/`cy`/`r` for a radial — already in the shape's own
 * coordinates, which is what `gradientUnits="userSpaceOnUse"` asks for.
 */
export type SvgGradientSpec = {
  element: 'linearGradient' | 'radialGradient'
  coords: Record<string, number>
  stops: { offset: string; color: string; opacity: number }[]
}

/** Null when the value is a flat colour, which needs no paint server at all. */
export function svgGradientSpec(value: string, box: PaintBox): SvgGradientSpec | null {
  if (!value || !isGradient(value)) return null

  const gradient = parseGradient(value)
  if (!gradient) return null

  const { x, y, width, height } = box
  const cx = x + width / 2
  const cy = y + height / 2

  let element: SvgGradientSpec['element']
  let coords: Record<string, number>
  if (gradient.type === 'radial') {
    element = 'radialGradient'
    // CSS reaches the farthest corner by default, which for a circle is the
    // half-diagonal.
    coords = { cx, cy, r: Math.hypot(width, height) / 2 }
  } else {
    // CSS measures the angle from straight up and turns clockwise, and the line
    // is long enough that the last stop lands on the far corner. SVG wants the
    // two ends of that line instead.
    const radians = (gradient.angle * Math.PI) / 180
    const dx = Math.sin(radians)
    const dy = -Math.cos(radians)
    const length = Math.abs(width * dx) + Math.abs(height * dy)
    element = 'linearGradient'
    coords = {
      x1: cx - (dx * length) / 2,
      y1: cy - (dy * length) / 2,
      x2: cx + (dx * length) / 2,
      y2: cy + (dy * length) / 2,
    }
  }

  const stops = gradient.stops.map((stop) => {
    const [r, g, b, a] = hexA2RGBA(stop.color)
    return { offset: `${stop.offset * 100}%`, color: `rgb(${r},${g},${b})`, opacity: Number.isFinite(a) ? a : 1 }
  })

  return { element, coords, stops }
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
  const spec = svgGradientSpec(value, box)
  if (!spec) return null

  const node = document.createElementNS(SVG_NS, spec.element)
  for (const [name, coordinate] of Object.entries(spec.coords)) node.setAttribute(name, String(coordinate))
  node.setAttribute('id', id)
  node.setAttribute('gradientUnits', 'userSpaceOnUse')
  for (const stop of spec.stops) {
    const el = document.createElementNS(SVG_NS, 'stop')
    el.setAttribute('offset', stop.offset)
    el.setAttribute('stop-color', stop.color)
    el.setAttribute('stop-opacity', String(stop.opacity))
    node.appendChild(el)
  }
  return node
}
