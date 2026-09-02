import { memo } from 'react'
import type { WidgetProps } from '../types'
import { ShapeStatic } from '../shape/ShapeWidget'
import PathPaint from './PathPaint'

function WPathStatic(props: WidgetProps) {
  return <ShapeStatic {...props} paint={<PathPaint params={props.params as any} />} />
}

export default memo(WPathStatic)
