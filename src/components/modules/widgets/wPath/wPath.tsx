import { memo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { controlState, widgetState } from '@/store/state'
import { setPathEditUuid } from '@/store/control'
import type { WidgetProps } from '../types'
import { ShapeWidget } from '../shape/ShapeWidget'
import PathPaint from './PathPaint'
import PointHandles from './PointHandles'
import './wPath.less'

function WPath(props: WidgetProps) {
  const { params, child } = props
  const p = useSnapshot(params) as any
  const snap = useSnapshot(widgetState)
  const control = useSnapshot(controlState)

  /*
   * The points belong to one path being worked on, so they wait for the same
   * conditions the selection box does — this layer and no other, not locked and
   * not nested inside a group, since a grip on a child of a group would reshape
   * something nobody could see they had selected — and then for the path to have
   * been asked to show them. See setPathEditUuid for why that is a mode.
   */
  const editing = !child && !p.lock && snap.dSelectWidgets.length === 0 && control.dPathEditUuid === params.uuid

  // Double-click to edit the points, which is how a path is opened up in Adobe
  // XD. A native listener on the element rather than a React one, because the
  // widget's props are laid out by the frame it shares with the other shapes;
  // this is the arrangement the image crop tool already uses.
  useEffect(() => {
    if (child || p.lock) return
    const el = document.getElementById(params.uuid)
    if (!el) return
    const open = () => setPathEditUuid(params.uuid)
    el.addEventListener('dblclick', open, false)
    return () => el.removeEventListener('dblclick', open, false)
  }, [params.uuid, child, p.lock])

  return (
    <ShapeWidget {...props} kind="w-path" paint={<PathPaint params={p} />}>
      {editing ? <PointHandles params={params} /> : null}
    </ShapeWidget>
  )
}

export default memo(WPath)
