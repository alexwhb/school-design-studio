/**
 * A path: the shape panel, plus the two things only a path has — whether it
 * runs back to where it started, and its points.
 *
 * Closing a path is geometry and nothing else. The fill and the outline are
 * left exactly as they were, because SVG fills an open path as though it were
 * closed and outlines it as though it were not, so a path can be moved between
 * the two and back with nothing else changing under it — which is what Adobe
 * XD's own toggle does.
 *
 * An open path is a line, and a line takes a head on either end: that section
 * is its own file, and only mounted while the path is open.
 *
 * Editing the points is a mode, and the panel is the second way into it after
 * double-clicking the path itself: the same pair of ways the crop tool offers,
 * because a mode entered only by a double-click is a mode nobody finds. Leaving
 * the panel leaves the mode, so selecting anything else puts the selection box
 * back rather than stranding the points on a path nobody is looking at.
 */
import { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import Switch from '@/components/ui/Switch'
import { controlState, widgetState } from '@/store/state'
import { setPathEditUuid } from '@/store/control'
import { PanelSection } from '@/components/ui/PanelSection'
import ShapeStyle from '../shape/ShapeStyle'
import LineEnds, { applyLineEnds } from './LineEndsSection'
import { isClosed, readPoints } from './pathGeometry'
import './wPathStyle.less'

export default function WPathStyle() {
  const active = useSnapshot(widgetState).dActiveElement as any
  const editing = useSnapshot(controlState).dPathEditUuid === active?.uuid

  useEffect(() => () => setPathEditUuid('-1'), [])

  if (!active) return null

  const points = readPoints(active)
  const closed = isClosed(active)

  return (
    <ShapeStyle
      shape={
        <>
          <PanelSection title="Path">
            <div className="path-style__row">
              <span className="path-style__label">Closed</span>
              <Switch
                className="path-style__closed"
                value={closed}
                // A path of two points has nothing to close: run the second back
                // to the first and the return lies on top of the way out.
                disabled={points.length < 3}
                onChange={(value) => applyLineEnds(active, { closed: value })}
              />
            </div>
            <div className="path-style__row">
              <span className="path-style__label">Edit points</span>
              <Switch className="path-style__edit" value={editing} onChange={(value) => setPathEditUuid(value ? active.uuid : '-1')} />
            </div>
            <p className="path-style__hint">
              {points.length} points. Double-click the path to open it up, then drag a point to move it or Alt-click one to curve or
              square it off.
            </p>
          </PanelSection>
          {/* Only a line has ends to put anything on; a closed path keeps its
              setting out of sight in case it is opened again. */}
          {closed ? null : <LineEnds active={active} />}
        </>
      }
    />
  )
}
