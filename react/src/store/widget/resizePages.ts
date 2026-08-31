/*
 * Changing the size of a design that already has artwork on it.
 *
 * Distinct from resize.ts, which is the drag handles on one selected element.
 * This is the whole page changing shape underneath everything, which is how a
 * finished flyer becomes a slide.
 *
 * How the artwork follows is not decided here — see
 * common/methods/resize/strategies.ts. This action's job is the bookkeeping:
 * which pages are affected, reading each one's old size before it is
 * overwritten, and leaving the editor pointing at something consistent.
 */
import { canvasState, widgetState } from '../state'
import { getResizeStrategy, type PageSize, type ResizeStrategyId } from '@/common/methods/resize/strategies'
import { showPage } from './pages'

export type TResizeScope = 'page' | 'all'

export type TResizePagesPayload = {
  width: number
  height: number
  /** Which of common/methods/resize/strategies.ts to lay the artwork out with. */
  strategy: ResizeStrategyId
  /** Just the page on screen, or every page in the design. */
  scope: TResizeScope
}

export function resizePages(payload: TResizePagesPayload) {
  const to: PageSize = { width: Math.round(payload.width), height: Math.round(payload.height) }
  if (!(to.width > 0) || !(to.height > 0)) return

  const strategy = getResizeStrategy(payload.strategy)
  const indexes = payload.scope === 'all' ? widgetState.dLayouts.map((_, index) => index) : [canvasState.dCurrentPage]

  for (const index of indexes) {
    const layout = widgetState.dLayouts[index]
    if (!layout) continue

    // Read the old size before overwriting it: it is half of every calculation
    // the strategy makes, and pages in one design need not be the same size.
    const from: PageSize = { width: layout.global.width, height: layout.global.height }
    if (from.width === to.width && from.height === to.height) continue

    for (const widget of layout.layers) {
      const resized = strategy.transform(widget, { from, to })
      widget.left = resized.left
      widget.top = resized.top
      widget.width = resized.width
      widget.height = resized.height
      if (typeof resized.fontSize === 'number') widget.fontSize = resized.fontSize
      // The measured box is stale now, but every widget rewrites it from its own
      // DOM node on the next render, so clearing it here would only cause a flash.
    }

    layout.global.width = to.width
    layout.global.height = to.height
  }

  // dPage is the canvas store's own handle on the current page, so it has to be
  // re-pointed at the object this action just changed.
  showPage(canvasState.dCurrentPage)
}
