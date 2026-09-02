/**
 * The positions worth snapping to, in page coordinates.
 *
 * Moveable works out object-to-object alignment itself, from the elements it is
 * handed, and it is what draws the guides you see while dragging. Two things
 * still need the list in page coordinates: the rulers, so a guide you drag
 * lands on an object's edge rather than a pixel beside it, and the tidy-up
 * after a drag — Moveable rounds its guides to a tenth of a *screen* pixel, so
 * at 25% zoom "snapped" can still leave two edges a couple of page pixels
 * apart, which shows the moment you zoom in.
 */
import type { TGuidelinesData, TPageState, TdWidgetData } from '@/store/types'

export type TSnapPositions = {
  /** Vertical lines: left, centre and right of everything on the page */
  x: number[]
  /** Horizontal lines: top, middle and bottom of everything on the page */
  y: number[]
}

export type TSnapBox = {
  left: number
  top: number
  width: number
  height: number
}

type TSnapOptions = {
  /** Layer to leave out — nothing aligns to itself */
  exclude?: string
  /** Ruler guides, in page coordinates */
  guides?: TGuidelinesData
  /** Grid spacing in page pixels, when the grid is on. 0 or absent means no grid. */
  grid?: number
}

/** De-duplicated and sorted, so a snap target is offered once. */
function tidy(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value)))].sort((a, b) => a - b)
}

/**
 * Edges and centres of the page, of every top-level layer on it, and of any
 * ruler guides.
 *
 * Rotation is ignored: the box used is the un-rotated one that `left`, `top`,
 * `width` and `height` describe. Callers that care about rotated objects should
 * leave them alone — Moveable handles those against their real bounds.
 */
export default function getSnapPositions(widgets: TdWidgetData[], page: TPageState, { exclude, guides, grid }: TSnapOptions = {}): TSnapPositions {
  const x: number[] = [0, page.width / 2, page.width, ...(guides?.verticalGuidelines ?? [])]
  const y: number[] = [0, page.height / 2, page.height, ...(guides?.horizontalGuidelines ?? [])]

  if (grid && grid > 0) {
    for (let at = grid; at < page.width; at += grid) x.push(at)
    for (let at = grid; at < page.height; at += grid) y.push(at)
  }

  for (const widget of widgets) {
    // Children of a group snap as part of their parent, not on their own.
    if (widget.parent && widget.parent !== page.uuid) continue
    // A layer nobody can see is not an edge anybody meant to line up with.
    if (widget.hidden) continue
    if (exclude && widget.uuid === exclude) continue
    const left = Number(widget.left)
    const top = Number(widget.top)
    const width = Number(widget.width)
    const height = Number(widget.height)
    if (!Number.isFinite(left) || !Number.isFinite(top)) continue
    x.push(left, left + width / 2, left + width)
    y.push(top, top + height / 2, top + height)
  }

  return { x: tidy(x), y: tidy(y) }
}

/** The smallest nudge that puts one of `edges` exactly on one of `positions`. */
function bestCorrection(edges: number[], positions: number[], tolerance: number): number {
  let best = 0
  let bestDistance = tolerance
  for (const edge of edges) {
    for (const position of positions) {
      const distance = Math.abs(position - edge)
      if (distance < bestDistance) {
        bestDistance = distance
        best = position - edge
      }
    }
  }
  return best
}

/**
 * Closes the sub-pixel gap Moveable's rounding leaves behind.
 *
 * `tolerance` must stay well under Moveable's own snap threshold: taking the
 * smallest correction available means an edge that is already sitting on a
 * guide wins, so this tidies up the snap that happened rather than inventing a
 * different one.
 */
export function snapBox(box: TSnapBox, positions: TSnapPositions, tolerance: number): { left: number; top: number } {
  const { left, top, width, height } = box
  return {
    left: left + bestCorrection([left, left + width / 2, left + width], positions.x, tolerance),
    top: top + bestCorrection([top, top + height / 2, top + height], positions.y, tolerance),
  }
}
