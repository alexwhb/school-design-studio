import { memo, useEffect, useRef } from 'react'
import type { WidgetProps } from '../types'
import TableGrid from './TableGrid'

/**
 * Read-only twin of wTable, for page thumbnails, slides and exports: the same
 * grid with nothing that answers the mouse and nothing that writes back.
 */
function WTableStatic({ params, parent, className, child, children, ...rest }: WidgetProps) {
  const p = params as Record<string, any>
  const widgetRef = useRef<HTMLDivElement | null>(null)

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
      <TableGrid params={p} />
    </div>
  )
}

export default memo(WTableStatic)
