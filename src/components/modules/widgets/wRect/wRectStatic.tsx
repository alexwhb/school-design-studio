import { memo } from 'react'
import type { WidgetProps } from '../types'
import { ShapeStatic } from '../shape/ShapeWidget'
import { cornersCss, readCorners } from './rectRadius'

function WRectStatic(props: WidgetProps) {
  return <ShapeStatic {...props} radius={cornersCss(readCorners(props.params))} />
}

export default memo(WRectStatic)
