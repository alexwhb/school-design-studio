import { memo } from 'react'
import type { WidgetProps } from '../types'

function WGroupStatic({ params, parent, children, className, ...rest }: WidgetProps) {
  const p = params as any
  return (
    <div
      {...rest}
      className={className}
      style={{
        position: 'absolute',
        left: (p.left || 0) - (parent?.left || 0) + 'px',
        top: (p.top || 0) - (parent?.top || 0) + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      {children}
    </div>
  )
}

export default memo(WGroupStatic)
