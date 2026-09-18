/**
 * The one outline a shape or an image can be given, read off a widget.
 *
 * Shapes and photographs draw it by completely different means — one strokes
 * SVG geometry, the other lays a ring over the picture — but both take the same
 * three settings off the widget, and both have to agree on when there is
 * nothing to draw. That agreement lives here so a widget with `borderWidth: 0`
 * cannot end up outlined in one place and bare in the other.
 */
import type { CSSProperties } from 'react'

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

/**
 * The gap pattern a dashed or dotted outline is drawn with, in design pixels.
 *
 * Shared so that a dashed outline round a photograph, round a library shape and
 * round a path drawn with the pen all break into the same rhythm. A dotted one
 * is a run of zero-length dashes, which only shows up at all once the ends are
 * rounded off — every caller that asks for it rounds its caps.
 *
 * @returns null for a solid outline, which needs no pattern.
 */
export function dashesFor(border: TWidgetBorder): string | null {
  if (border.style === 'dashed') return `${border.width * 3} ${border.width * 2}`
  if (border.style === 'dotted') return `0 ${border.width * 2}`
  return null
}

/**
 * A gradient outline is a band of paint, not a border.
 *
 * `border` takes a colour and nothing else, so an outline that is a gradient
 * has to be painted across the whole element and then masked down to a band of
 * the asked-for width lying inside its edge — the border box minus the content
 * box, which is the padding. It curves with whatever corner radius it is given,
 * and it is always solid: a band cut out of a mask has no run of line to break
 * into dashes.
 *
 * Both the keyline round a photograph and the outline round a drawn box use
 * this, so the two curve and sit identically.
 */

/** Only asked once, and only in a browser; `CSS` is absent when it is not. */
let ringSupported: boolean | null = null

export function supportsMaskRing(): boolean {
  if (ringSupported === null) {
    ringSupported = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && (CSS.supports('mask-composite', 'exclude') || CSS.supports('-webkit-mask-composite', 'xor'))
  }
  return ringSupported
}

/**
 * @param radius any CSS `border-radius` value — one length, or the four a box
 * with its corners held apart needs.
 */
export function gradientRingStyle(width: number, color: string, radius: string): CSSProperties {
  const layers = 'linear-gradient(#000 0 0), linear-gradient(#000 0 0)'
  return {
    background: color,
    borderRadius: radius,
    padding: `${width}px`,
    boxSizing: 'border-box',
    WebkitMaskImage: layers,
    WebkitMaskClip: 'content-box, border-box',
    WebkitMaskComposite: 'xor',
    maskImage: layers,
    maskClip: 'content-box, border-box',
    maskComposite: 'exclude',
  }
}
