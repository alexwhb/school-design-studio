import { memo } from 'react'
import type { WidgetProps } from '../types'
import { ShapeWidget } from '../shape/ShapeWidget'
import { ELLIPSE_RADIUS } from './ellipseRadius'

function WEllipse(props: WidgetProps) {
  return <ShapeWidget {...props} kind="w-ellipse" radius={ELLIPSE_RADIUS} />
}

export default memo(WEllipse)
