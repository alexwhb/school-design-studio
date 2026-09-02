import { memo } from 'react'
import type { WidgetProps } from '../types'
import { ShapeStatic } from '../shape/ShapeWidget'
import { ELLIPSE_RADIUS } from './ellipseRadius'

function WEllipseStatic(props: WidgetProps) {
  return <ShapeStatic {...props} radius={ELLIPSE_RADIUS} />
}

export default memo(WEllipseStatic)
