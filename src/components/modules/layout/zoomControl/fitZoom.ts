/**
 * How far the wheel and the pinch may go, in percent. The buttons stop at the
 * ends of the two preset lists; a continuous gesture has no list to stop at, so
 * it stops here. The floor is under the smallest preset because wheeling out to
 * see a whole poster at once is the reason to wheel out.
 */
export const MIN_ZOOM = 10
export const MAX_ZOOM = 500

export type TFitInput = {
  screen: { width: number; height: number }
  page: { width: number; height: number }
  /** Space kept clear round the page, on each side. */
  padding: number
  /** Height taken by the page strip and the notes under the board. */
  bottom: number
}

/**
 * The zoom at which the whole page fits the board.
 *
 * Never below the zoom's own floor. The board is measured, and a board that is
 * not on screen — the editor mounted in a tab the host has not shown yet, or in
 * a panel that is collapsed — measures 0 across, which made the fit negative:
 * the page was drawn at minus a few hundred percent and the selection box
 * came out mirrored. A fit that cannot be worked out is the smallest zoom, and
 * the next measurement with the board on screen puts it right.
 */
export function fitZoom({ screen, page, padding, bottom }: TFitInput): number {
  const diffHeight = padding * 2 + 2 + bottom
  const diffWidth = padding * 2 + 22
  const widthZoom = ((screen.width - diffWidth) * 100) / page.width
  const heightZoom = ((screen.height - diffHeight) * 100) / page.height
  const best = Math.min(widthZoom, heightZoom)
  if (!Number.isFinite(best)) return MIN_ZOOM
  // Only the floor. A small page on a large board has always been allowed to
  // fit above the wheel's ceiling, and that is not what went wrong.
  return Math.max(MIN_ZOOM, best)
}
