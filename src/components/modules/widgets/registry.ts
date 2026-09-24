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

// The read-only half lives on its own, so the viewer can have it without the
// editing widgets. See staticRegistry.ts.
export { staticWidgetComponents } from './staticRegistry'
