import type { ComponentType } from 'react'
import WText from './wText/wText'
import WImage from './wImage/wImage'
import WSvg from './wSvg/wSvg'
import WGroup from './wGroup/wGroup'
import WQrcode from './wQrcode/wQrcode'
import WTextStatic from './wText/wTextStatic'
import WImageStatic from './wImage/wImageStatic'
import WSvgStatic from './wSvg/wSvgStatic'
import WGroupStatic from './wGroup/wGroupStatic'
import type { WidgetProps } from './types'

export const widgetComponents: Record<string, ComponentType<WidgetProps>> = {
  'w-text': WText,
  'w-image': WImage,
  'w-svg': WSvg,
  'w-group': WGroup,
  'w-qrcode': WQrcode,
}

export const staticWidgetComponents: Record<string, ComponentType<WidgetProps>> = {
  'w-text': WTextStatic,
  'w-image': WImageStatic,
  'w-svg': WSvgStatic,
  'w-group': WGroupStatic,
  'w-qrcode': WImageStatic,
}
