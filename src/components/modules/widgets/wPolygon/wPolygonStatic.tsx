import { memo } from 'react'
import type { WidgetProps } from '../types'
import { ShapeStatic } from '../shape/ShapeStatic'
import PolygonPaint from './PolygonPaint'
import './wPolygon.less'

function WPolygonStatic(props: WidgetProps) {
  return <ShapeStatic {...props} paint={<PolygonPaint params={props.params as any} />} />
}

export default memo(WPolygonStatic)
