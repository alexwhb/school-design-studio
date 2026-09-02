import { memo } from 'react'
import { useSnapshot } from 'valtio'
import { controlState, widgetState } from '@/store/state'
import type { WidgetProps } from '../types'
import { ShapeWidget } from '../shape/ShapeWidget'
import RadiusHandles from './RadiusHandles'
import { cornersCss, readCorners } from './rectRadius'
import './wRect.less'

function WRect(props: WidgetProps) {
  const { params, child } = props
  const p = useSnapshot(params) as any
  const snap = useSnapshot(widgetState)
  const showMoveable = useSnapshot(controlState).showMoveable

  /*
   * The corner grips belong to one box being worked on, so they wait for the
   * same conditions the selection box does: this layer and no other, its own
   * handles on screen, and not locked or nested inside a group — a grip on a
   * child of a group would round a corner nobody could see they had selected.
   */
  const rounding =
    !child &&
    !p.lock &&
    showMoveable &&
    snap.dSelectWidgets.length === 0 &&
    snap.dActiveElement?.uuid === params.uuid

  return (
    <ShapeWidget {...props} kind="w-rect" radius={cornersCss(readCorners(p))}>
      {rounding ? <RadiusHandles params={params} /> : null}
    </ShapeWidget>
  )
}

export default memo(WRect)
