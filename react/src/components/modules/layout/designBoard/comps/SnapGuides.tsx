import { useSnapshot } from 'valtio'
import { canvasState } from '@/store/state'
import './snapGuides.less'

/**
 * Stand-ins for the ruler guides, laid out in page coordinates.
 *
 * The visible red line is drawn by @scena/guides, over the top of everything in
 * the editor's own coordinate space. Moveable cannot snap to that: it works
 * from elements it can measure. So for every guide there is an invisible,
 * zero-thickness box here, inside the page, and Moveable is handed those — which
 * also means the maths survives zooming, scrolling and resizing for free.
 */
export default function SnapGuides() {
  const { guidelines } = useSnapshot(canvasState)
  if (!guidelines.verticalGuidelines.length && !guidelines.horizontalGuidelines.length) return null

  return (
    <div className="snap-guide-layer">
      {guidelines.verticalGuidelines.map((x) => (
        <i key={'v' + x} className="snap-guide snap-guide-v" style={{ left: x + 'px' }} />
      ))}
      {guidelines.horizontalGuidelines.map((y) => (
        <i key={'h' + y} className="snap-guide snap-guide-h" style={{ top: y + 'px' }} />
      ))}
    </div>
  )
}
