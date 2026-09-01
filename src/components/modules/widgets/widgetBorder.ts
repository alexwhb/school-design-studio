/**
 * The one outline a shape or an image can be given, read off a widget.
 *
 * Shapes and photographs draw it by completely different means — one strokes
 * SVG geometry, the other lays a ring over the picture — but both take the same
 * three settings off the widget, and both have to agree on when there is
 * nothing to draw. That agreement lives here so a widget with `borderWidth: 0`
 * cannot end up outlined in one place and bare in the other.
 */
export type TWidgetBorder = {
  /** Design pixels, and always inside the element's own edge. */
  width: number
  color: string
  style: 'solid' | 'dashed' | 'dotted'
}

const STYLES = ['solid', 'dashed', 'dotted'] as const

/** Null when the widget asks for no outline, which is the usual case. */
export function widgetBorder(params: Record<string, any> | null | undefined): TWidgetBorder | null {
  const width = Number(params?.borderWidth) || 0
  if (width <= 0) return null
  const style = String(params?.borderStyle || 'solid')
  return {
    width,
    // The panel writes a colour alongside every thickness, so a width with no
    // colour can only have come from hand-edited or imported data.
    color: params?.borderColor || '#000000ff',
    style: (STYLES as readonly string[]).includes(style) ? (style as TWidgetBorder['style']) : 'solid',
  }
}
