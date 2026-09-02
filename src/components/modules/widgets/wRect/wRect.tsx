import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { controlState, widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import RectPaint from './RectPaint'
import RadiusHandles from './RadiusHandles'
import './wRect.less'

function WRect({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any
  const snap = useSnapshot(widgetState)
  const showMoveable = useSnapshot(controlState).showMoveable

  const widgetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    updateRecord()
    setUpdateRect()
  })

  // Rebuilt from the store whenever it changes rather than once on mount, or an
  // undone rotation stays on screen: Moveable writes the turn straight to the
  // element, so nothing else puts it back.
  useEffect(() => {
    const el = widgetRef.current
    if (!el) return
    el.style.transform = p.rotate ? `rotate(${p.rotate})` : ''
  }, [p.rotate])

  function updateRecord() {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid) {
      const record = active.record
      if (record && widgetRef.current) {
        record.width = widgetRef.current.offsetWidth
        record.height = widgetRef.current.offsetHeight
      }
    }
  }

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
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-rect', { 'layer-lock': !!p.lock }, className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      <RectPaint params={p} />
      {rounding ? <RadiusHandles params={params} /> : null}
    </div>
  )
}

export default memo(WRect)
