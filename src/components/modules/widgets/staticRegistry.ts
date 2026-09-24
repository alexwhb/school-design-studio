/**
 * The read-only widgets, by type: what page thumbnails, the presenter, the
 * exports' copies and the viewer draw with. Kept apart from `registry.ts`,
 * whose editing widgets bring the store, Moveable and the rest of the editor
 * with them. Nothing imported here may reach for the store.
 */
import type { ComponentType } from 'react'
import WTextStatic from './wText/wTextStatic'
import WImageStatic from './wImage/wImageStatic'
import WSvgStatic from './wSvg/wSvgStatic'
import WRectStatic from './wRect/wRectStatic'
import WEllipseStatic from './wEllipse/wEllipseStatic'
import WPolygonStatic from './wPolygon/wPolygonStatic'
import WPathStatic from './wPath/wPathStatic'
import WGroupStatic from './wGroup/wGroupStatic'
import WQrcodeStatic from './wQrcode/wQrcodeStatic'
import WTableStatic from './wTable/wTableStatic'
import type { WidgetProps } from './types'
import type { TWidgetType } from './widgetTypes'

// Checked against `TWidgetType` the same way the editing list is.
const staticComponents = {
  'w-text': WTextStatic,
  'w-image': WImageStatic,
  'w-svg': WSvgStatic,
  'w-rect': WRectStatic,
  'w-ellipse': WEllipseStatic,
  'w-polygon': WPolygonStatic,
  'w-path': WPathStatic,
  'w-group': WGroupStatic,
  'w-qrcode': WQrcodeStatic,
  'w-table': WTableStatic,
} satisfies Record<TWidgetType, ComponentType<WidgetProps>>

export const staticWidgetComponents: Record<string, ComponentType<WidgetProps>> = staticComponents
