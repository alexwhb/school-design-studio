import { customAlphabet } from 'nanoid/non-secure'
import { brandResolver } from '@/common/methods/brandKit'
import { fillLayers } from '@/utils/mergeFields'
import { widgetState } from '../state'
import type { TdLayout, TdWidgetData } from '../types'
import { updateDWidgets } from './widget'

const nanoid = customAlphabet('1234567890abcdef', 12)

/**
 * Saved elements store their text URL-encoded and templates store it raw (see
 * CONTENT.md), and both arrive here. Decoding raw text is a no-op — unless it
 * carries a literal `%`, which decodeURIComponent throws on. "50% off" is
 * ordinary school copy, so a text that will not decode is taken as it is.
 */
export function decodeText(text: string): string {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

/**
 * Puts a one-page template's layers on the page.
 *
 * Picking a template in the gallery comes through here, and so does opening a
 * single-page one with `?tempid=`, so this is where the school's fields are
 * filled in: `{{school.name}}` becomes the school's name, or the sample one
 * when no kit has been set up. See brandKit.ts. A template of several pages
 * arrives as layouts instead and goes through `fillTemplateLayouts`; a saved
 * *design* goes through neither, because its fields were filled when it was
 * made and refilling them would overwrite whatever was typed since.
 */
export function setTemplate(allWidgets: TdWidgetData[]) {
  allWidgets.forEach((item) => {
    Number(item.uuid) < 0 && (item.uuid = nanoid())
    item.text && (item.text = decodeText(item.text))
  })
  const { layers } = fillLayers(allWidgets, brandResolver())
  layers.forEach((item) => {
    widgetState.dWidgets.push(item)
  })
  updateDWidgets()
}

/**
 * The same fill for a template that is a whole deck: every page of it, before
 * the layouts are handed to the store. Returns a new list; the layouts given
 * are left alone.
 */
export function fillTemplateLayouts(layouts: TdLayout[]): TdLayout[] {
  const resolve = brandResolver()
  return layouts.map((layout) => {
    const { layers, filled } = fillLayers(layout.layers, resolve)
    return filled ? { ...layout, layers } : layout
  })
}
