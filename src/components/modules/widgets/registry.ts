import type { ComponentType } from 'react'
import WText from './wText/wText'
import WImage from './wImage/wImage'
import WSvg from './wSvg/wSvg'
import WRect from './wRect/wRect'
import WEllipse from './wEllipse/wEllipse'
import WPolygon from './wPolygon/wPolygon'
import WPath from './wPath/wPath'
import WGroup from './wGroup/wGroup'
import WQrcode from './wQrcode/wQrcode'
import WTable from './wTable/wTable'
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

/**
 * Checked against `TWidgetType`, then widened to a string lookup.
 *
 * The `satisfies` is the point: a widget added here and not to
 * `widgetTypes.ts` fails the build, and so does one added there and not here.
 * `design-studio/compose` publishes that list to the host, which validates
 * stored designs against it, so the two drifting apart would mean the host
 * rejecting a widget the editor happily makes. The exported type stays a plain
 * string map because callers look a widget up by whatever `type` a saved design
 * happens to carry.
 */
const components = {
  'w-text': WText,
  'w-image': WImage,
  'w-svg': WSvg,
  'w-rect': WRect,
  'w-ellipse': WEllipse,
  'w-polygon': WPolygon,
  'w-path': WPath,
  'w-group': WGroup,
  'w-qrcode': WQrcode,
  'w-table': WTable,
} satisfies Record<TWidgetType, ComponentType<WidgetProps>>

export const widgetComponents: Record<string, ComponentType<WidgetProps>> = components

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
