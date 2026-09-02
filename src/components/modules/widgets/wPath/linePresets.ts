/**
 * The lines the Elements panel offers ready-made: a plain rule, an arrow, and
 * the few variations people reach for most.
 *
 * Each is the same open path the line tool draws — two corner points, level —
 * with its ends and its dash already set, so what arrives is styled the same
 * way a hand-drawn line would be after a visit to the panel, and can be taken
 * apart in the same panel.
 */
import type { TdWidgetData } from '@/store/types'
import { fitFrame } from './pathGeometry'
import { endsPad, type TLineEnd } from './lineEnds'
import { openPathSetting } from './wPathSetting'

export type TLinePreset = {
  name: string
  start?: TLineEnd
  end?: TLineEnd
  style?: 'solid' | 'dashed' | 'dotted'
  width?: number
}

export const LINE_PRESETS: TLinePreset[] = [
  { name: 'Line' },
  { name: 'Arrow', end: 'triangle' },
  { name: 'Double arrow', start: 'triangle', end: 'triangle' },
  { name: 'Dashed arrow', end: 'arrow', style: 'dashed' },
  { name: 'Dotted line', start: 'circle', end: 'circle', style: 'dotted' },
]

/** How long a preset line arrives, in design pixels, before the page is allowed a say. */
const PRESET_LENGTH = 320

/** A preset laid level across the middle of a page this size. */
export function linePresetSetting(preset: TLinePreset, page: { width: number; height: number }): TdWidgetData {
  const setting: any = openPathSetting()
  setting.name = preset.name
  if (preset.width) setting.borderWidth = preset.width
  if (preset.style) setting.borderStyle = preset.style
  if (preset.start) setting.lineStart = preset.start
  if (preset.end) setting.lineEnd = preset.end

  const length = Math.min(PRESET_LENGTH, page.width * 0.8)
  const left = Math.round((page.width - length) / 2)
  const y = Math.round(page.height / 2)
  const fitted = fitFrame(
    [
      { x: left, y },
      { x: left + length, y },
    ],
    false,
    setting.borderWidth / 2 + endsPad(setting),
  )
  setting.left = fitted.box.left
  setting.top = fitted.box.top
  setting.width = fitted.box.width
  setting.height = fitted.box.height
  setting.points = fitted.points
  return setting
}
