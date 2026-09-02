/**
 * The frame a drawn shape sits in, on the canvas and off it.
 *
 * Everything the drawn shapes have in common is here: where the shape is, how
 * big, how see-through, which way up, and the size it reports back to the
 * selection box. What goes inside the frame is handed in — a corner radius for
 * the shapes CSS can round into, or a drawing of its own for a polygon, which
 * it cannot. Anything belonging to one shape alone, such as the rectangle's
 * corner grips, comes in as a child.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import { widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import ShapePaint from './ShapePaint'
import './shape.less'

/**
 * How the shape is drawn, and only ever one of the two: a corner radius for
 * `ShapePaint` to round a box into, or a drawing that paints itself.
 */
type ShapeFill = { radius: string; paint?: never } | { paint: ReactNode; radius?: never }

/** The widget's own class, `w-rect`, `w-ellipse` or `w-polygon`. */
type Props = WidgetProps & ShapeFill & { kind: string }

export function ShapeWidget({ params, parent, id, className, kind, radius, paint, child, children, ...rest }: Props) {
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
      {paint ?? <ShapePaint params={p} radius={radius!} />}
      {children}
    </div>
  )
}

/**
 * The same shape with nothing that answers the mouse, for page thumbnails,
 * slides and exports. It reads its widget straight rather than through a
 * snapshot, because nothing here is going to change under it.
 */
export function ShapeStatic({ params, parent, className, radius, paint, child, children, ...rest }: WidgetProps & ShapeFill) {
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
      {paint ?? <ShapePaint params={p} radius={radius!} />}
    </div>
  )
}
