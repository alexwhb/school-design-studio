import { resolveSvgPaint, viewBoxOf, type PaintBox } from '@/utils/svgPaint'

/** Where in a shape its colours land. Gathered once, when the markup is parsed. */
export type ShapePaint = {
  svg: SVGSVGElement
  /** The shape's own coordinates, which is the box a gradient runs across. */
  viewBox: PaintBox
  /** Every attribute holding a `{{colors[n]}}` placeholder, and the n it wants. */
  colorAttributes: { element: Element; attribute: string; index: number }[]
}

const PLACEHOLDER = /^\{\{colors\[(\d+)\]\}\}$/

export function collectShapePaint(svg: SVGSVGElement): ShapePaint {
  const colorAttributes: ShapePaint['colorAttributes'] = []

  // The root <svg> carries the placeholder as often as its children do — every
  // Lucide icon puts `stroke` there — so the walk starts at it.
  const walk = (element: Element) => {
    for (const attribute of Array.from(element.attributes)) {
      const found = PLACEHOLDER.exec(attribute.value)
      if (found) colorAttributes.push({ element, attribute: attribute.name, index: Number(found[1]) })
    }
    Array.from(element.children).forEach(walk)
  }
  walk(svg)

  return { svg, viewBox: viewBoxOf(svg), colorAttributes }
}

/**
 * Paints a shape's colours over its placeholders.
 *
 * A colour can be a gradient, which an SVG attribute cannot hold directly, so
 * `resolveSvgPaint` puts a paint server in the shape's `<defs>` and hands back
 * a reference to it. The ids are the widget's, so two copies of the same shape
 * do not share a gradient.
 */
export function paintShape(paint: ShapePaint, uuid: string, colors: string[]) {
  paint.colorAttributes.forEach(({ element, attribute, index }) => {
    const color = colors[index]
    if (color == null) return
    element.setAttribute(attribute, resolveSvgPaint(paint.svg, `g-${uuid}-fill-${index}`, color, paint.viewBox))
  })
}
