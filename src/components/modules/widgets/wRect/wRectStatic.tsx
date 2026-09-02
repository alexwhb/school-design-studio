import { memo, useEffect, useRef } from 'react'
import type { WidgetProps } from '../types'
import RectPaint from './RectPaint'
import './wRect.less'

function WRectStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)

  // A turned box has to look the same here as it does on the canvas, or
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
      <RectPaint params={p} />
    </div>
  )
}

export default memo(WRectStatic)
