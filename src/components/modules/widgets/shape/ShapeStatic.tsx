/**
 * A drawn shape's frame with nothing that answers the mouse. Its own file, so
 * that the read-only views — page thumbnails, slides, the viewer — draw shapes
 * without loading the editor's store along with the editing frame.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import type { WidgetProps } from '../types'
import ShapePaint from './ShapePaint'
import './shape.less'

/**
 * How the shape is drawn, and only ever one of the two: a corner radius for
 * `ShapePaint` to round a box into, or a drawing that paints itself.
 */
export type ShapeFill = { radius: string; paint?: never } | { paint: ReactNode; radius?: never }

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
