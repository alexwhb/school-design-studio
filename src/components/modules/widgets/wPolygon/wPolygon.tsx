import { memo } from 'react'
import { useSnapshot } from 'valtio'
import { controlState, widgetState } from '@/store/state'
import type { WidgetProps } from '../types'
import { ShapeWidget } from '../shape/ShapeWidget'
import PolygonPaint from './PolygonPaint'
import SidesHandle from './SidesHandle'
import './wPolygon.less'

function WPolygon(props: WidgetProps) {
  const { params, child } = props
  const p = useSnapshot(params) as any
  const snap = useSnapshot(widgetState)
  const showMoveable = useSnapshot(controlState).showMoveable

  /*
   * The corner-count grip belongs to one shape being worked on, so it waits for
   * the same conditions the selection box does: this layer and no other, its
   * own handles on screen, and not locked or nested inside a group — a grip on
   * a child of a group would reshape something nobody could see they had
   * selected.
   */
  const reshaping =
    !child &&
    !p.lock &&
    showMoveable &&
    snap.dSelectWidgets.length === 0 &&
    snap.dActiveElement?.uuid === params.uuid

  return (
    <ShapeWidget {...props} kind="w-polygon" paint={<PolygonPaint params={p} />}>
      {reshaping ? <SidesHandle params={params} /> : null}
    </ShapeWidget>
  )
}

export default memo(WPolygon)
