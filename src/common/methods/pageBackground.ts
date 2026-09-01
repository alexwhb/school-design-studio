/**
 * A page background fills the page, so a picture whose shape is not the page's
 * shape gets cropped. `backgroundTransform` is what the user chooses about that
 * crop: which part of the picture stays visible, and how far it is zoomed past
 * the size that just covers the page.
 */
import type { CSSProperties } from 'react'
import type { TPageState } from '@/store/types'

export type TBackgroundTransform = {
  /** Horizontal focal point: 0 shows the picture's left edge, 100 its right. */
  x?: number
  /** Vertical focal point: 0 shows the top edge, 100 the bottom. */
  y?: number
  /** Zoom over the size that just covers the page, so 1 is that size. */
  scale?: number
  /**
   * The picture's own width / height, recorded when the background is set.
   * Only a zoom needs it, and only because CSS cannot express "cover, times
   * 1.4": the size has to be given on whichever axis overflows, and which axis
   * that is depends on the picture's shape.
   */
  ratio?: number
}

export const DEFAULT_FOCUS = 50
export const MIN_SCALE = 1
export const MAX_SCALE = 3

const clampFocus = (value?: number) => (typeof value === 'number' && isFinite(value) ? Math.min(100, Math.max(0, value)) : DEFAULT_FOCUS)

const clampScale = (value?: number) =>
  typeof value === 'number' && isFinite(value) ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, value)) : MIN_SCALE

/** The transform with every gap filled in, for a control that has to show a value. */
export function backgroundTransformOf(page: Pick<TPageState, 'backgroundTransform'>) {
  const transform = (page.backgroundTransform || {}) as TBackgroundTransform
  return {
    x: clampFocus(transform.x),
    y: clampFocus(transform.y),
    scale: clampScale(transform.scale),
    ratio: transform.ratio,
  }
}

/**
 * The `background-*` half of a page's style, shared by every surface that draws
 * a page — the editor canvas, the page thumbnails, the presentation view — so
 * that a background positioned in one is positioned the same in all of them.
 *
 * A percentage `background-position` is measured against the part that overflows
 * rather than the box, which is exactly the pan the user wants: 0 to 100 walks
 * the visible window across the cropped picture, and needs to know nothing about
 * the picture's size.
 */
export function pageBackgroundStyle(page: TPageState): CSSProperties {
  const { x, y, scale, ratio } = backgroundTransformOf(page)
  const zoomed = scale > MIN_SCALE && !!ratio && !!page.backgroundImage
  const zoom = `${(scale * 100).toFixed(3)}%`

  return {
    backgroundColor: page.backgroundGradient ? undefined : page.backgroundColor,
    backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : page.backgroundGradient || undefined,
    // Landscape picture on a portrait page: its height is what fills, so the
    // height carries the zoom and the width follows the picture's shape.
    backgroundSize: zoomed ? ((ratio as number) > page.width / page.height ? `auto ${zoom}` : `${zoom} auto`) : 'cover',
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
  }
}
