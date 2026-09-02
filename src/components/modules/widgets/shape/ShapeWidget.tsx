/**
 * The frame a drawn shape sits in, on the canvas and off it.
 *
 * Everything a rectangle and an ellipse have in common is here: where the
 * shape is, how big, how see-through, which way up, and the size it reports
 * back to the selection box. What each one paints inside that frame is a
 * corner radius, which is handed in — and anything that belongs to one of them
 * alone, such as the rectangle's corner grips, comes in as a child.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import { widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import ShapePaint from './ShapePaint'
import './shape.less'

type Props = WidgetProps & {
  /** Any CSS `border-radius`: four lengths for a box, `50%` for an ellipse. */
  radius: string
  /** The widget's own class, `w-rect` or `w-ellipse`. */
  kind: string
}

export function ShapeWidget({ params, parent, id, className, kind, radius, child, children, ...rest }: Props) {
  const p = useSnapshot(params) as any
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

  return (
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-shape', kind, { 'layer-lock': !!p.lock }, className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      <ShapePaint params={p} radius={radius} />
      {children}
    </div>
  )
}

/**
 * The same shape with nothing that answers the mouse, for page thumbnails,
 * slides and exports. It reads its widget straight rather than through a
 * snapshot, because nothing here is going to change under it.
 */
export function ShapeStatic({ params, parent, className, radius, child, children, ...rest }: Omit<Props, 'kind'>) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)

  // A turned shape has to look the same here as it does on the canvas, or
  // thumbnails, slides and exports quietly straighten it out.
  useEffect(() => {
    if (p.rotate && widgetRef.current) widgetRef.current.style.transform = `rotate(${p.rotate})`
  }, [p.rotate])

  return (
    <div
      {...rest}
      ref={widgetRef}
      className={className}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      <ShapePaint params={p} radius={radius} />
    </div>
  )
}
