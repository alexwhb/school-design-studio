/**
 * The lines the Graphics panel offers ready-made: a plain rule, an arrow, and
 * the few variations people reach for most.
 *
 * Each is the same open path the line tool draws — with its ends and its dash
 * already set, so what arrives is styled the same way a hand-drawn line would
 * be after a visit to the panel, and can be taken apart in the same panel.
 *
 * A preset is not a shape, it is a way of arming the line tool: clicking one
 * arms the tool carrying it, and the line is then drawn between two points on
 * the page like any other. Which is why the preset is carried through the
 * control store as a name — `applyLinePreset` is what turns that name back into
 * a styled path once the two points are known.
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

export const LINE_PRESETS: TLinePreset[] = [{ name: 'Line' }, { name: 'Arrow', end: 'triangle' }, { name: 'Double arrow', start: 'triangle', end: 'triangle' }, { name: 'Dashed arrow', end: 'arrow', style: 'dashed' }, { name: 'Dotted line', start: 'circle', end: 'circle', style: 'dotted' }]

/** How long a preset line arrives, in design pixels, before the page is allowed a say. */
const PRESET_LENGTH = 320

/** The preset of that name, or null for a line that was armed without one. */
export function findLinePreset(name: string | null | undefined): TLinePreset | null {
  return LINE_PRESETS.find((preset) => preset.name === name) || null
}

/** What the preset says about a line, put onto a path setting that has none of it yet. */
export function applyLinePreset(setting: Record<string, any>, preset: TLinePreset) {
  setting.name = preset.name
  if (preset.width) setting.borderWidth = preset.width
  if (preset.style) setting.borderStyle = preset.style
  if (preset.start) setting.lineStart = preset.start
  if (preset.end) setting.lineEnd = preset.end
}

/**
 * A preset laid level across the middle of a page this size. What the panel's
 * thumbnails are drawn from; a preset chosen to draw with is fitted to the two
 * points it was drawn between instead, in `DrawLine`.
 */
export function linePresetSetting(preset: TLinePreset, page: { width: number; height: number }): TdWidgetData {
  const setting: any = openPathSetting()
  applyLinePreset(setting, preset)

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
