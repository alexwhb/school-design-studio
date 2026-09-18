import { useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { controlState } from '@/store/state'
import './pageGrid.less'

type Props = {
  width: number
  height: number
  /** The editor's zoom, as a percentage. */
  zoom: number
}

/**
 * The grid, drawn over the page in design pixels.
 *
 * It lives inside the page rather than over the workspace, so it is scaled by
 * the same transform as the artwork and needs no arithmetic of its own to
 * follow the zoom, a scroll or a resize. The squares are painted with a pair of
 * repeating gradients — one element rather than a few hundred — and the lines
 * are widened as you zoom out so that a grid line stays a hairline instead of
 * fading away at 25%.
 *
 * `data-export="off"` keeps it out of every rendered picture; see `capture` in
 * common/methods/export/renderPage.ts. The page strip's thumbnails and the
 * presenter draw the design themselves, from the store, and never see this at
 * all.
 *
 * The stand-ins are what Moveable lines things up against, for the reason the
 * ruler guides have their own: Moveable's snapping is measured in the
 * container's screen pixels, which is the wrong space for a page that is
 * CSS-scaled by the zoom, but an invisible box inside the page is measured like
 * any other object. See SnapGuides, which does the same thing for guides.
 */
export default function PageGrid({ width, height, zoom }: Props) {
  const { dShowGrid, dGridSize } = useSnapshot(controlState)

  const lines = useMemo(() => {
    if (!dShowGrid || !dGridSize) return { x: [] as number[], y: [] as number[] }
    const x: number[] = []
    const y: number[] = []
    for (let at = dGridSize; at < width; at += dGridSize) x.push(at)
    for (let at = dGridSize; at < height; at += dGridSize) y.push(at)
    return { x, y }
  }, [dShowGrid, dGridSize, width, height])

  if (!dShowGrid) return null

  // One screen pixel, expressed in the design pixels the page is drawn in.
  const stroke = 100 / (zoom || 100)

  return (
    <div className="page-grid" data-export="off" style={{ '--ds-grid-step': `${dGridSize}px`, '--ds-grid-stroke': `${stroke}px` } as React.CSSProperties}>
      {lines.x.map((at) => (
        <i key={'v' + at} className="grid-snap grid-snap-v" style={{ left: at + 'px' }} />
      ))}
      {lines.y.map((at) => (
        <i key={'h' + at} className="grid-snap grid-snap-h" style={{ top: at + 'px' }} />
      ))}
    </div>
  )
}
