import { customAlphabet } from 'nanoid/non-secure'
import { brandState, brandResolver, type TTemplateBrand } from '@/common/methods/brandKit'
import { fillLayers } from '@/utils/mergeFields'
import { getDPage } from '../canvas'
import { widgetState } from '../state'
import type { TdLayout, TdWidgetData } from '../types'
import { applyTemplateBrand } from './brand'
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
 *
 * `brand` is the block the template file carries beside its data, saying which
 * of its own colours plays which role. It only ever comes from a template, for
 * the same reason the fill does: a design opened again is what someone left,
 * not what the kit says today.
 */
export function setTemplate(allWidgets: TdWidgetData[], brand?: TTemplateBrand) {
  allWidgets.forEach((item) => {
    Number(item.uuid) < 0 && (item.uuid = nanoid())
    item.text && (item.text = decodeText(item.text))
  })
  const { layers } = fillLayers(allWidgets, brandResolver())
  brandOnePage(layers, brand).forEach((item) => {
    widgetState.dWidgets.push(item)
  })
  updateDWidgets()
}

/**
 * The kit onto the one page a template of one page lands on.
 *
 * The page it repaints is the layout's own `global`, which is the template's
 * page at all three of the places `setTemplate` is called from — the gallery
 * and Draw have handed it to `setDPage` a line earlier, and the `?tempid=`
 * path is about to — so the background is repainted in the same pass as the
 * layers rather than in a second one after the canvas has drawn it. Only the
 * two background keys can have moved, so only those are carried back onto the
 * page the store is already holding.
 */
function brandOnePage(layers: TdWidgetData[], brand?: TTemplateBrand): TdWidgetData[] {
  const page = getDPage()
  if (!page) return layers
  const result = applyTemplateBrand(layers, page, brand, brandState.kit)
  if (result.page !== page) {
    page.backgroundColor = result.page.backgroundColor
    page.backgroundGradient = result.page.backgroundGradient
  }
  return result.layers
}

/**
 * The same fill for a template that is a whole deck: every page of it, before
 * the layouts are handed to the store, and the kit's colours and fonts with
 * it. Returns a new list; the layouts given are left alone.
 */
export function fillTemplateLayouts(layouts: TdLayout[], brand?: TTemplateBrand): TdLayout[] {
  const resolve = brandResolver()
  const kit = brandState.kit
  return layouts.map((layout) => {
    const { layers, filled } = fillLayers(layout.layers, resolve)
    const branded = applyTemplateBrand(layers, layout.global, brand, kit)
    if (branded.layers !== layers || branded.page !== layout.global) {
      return { ...layout, global: branded.page, layers: branded.layers }
    }
    return filled ? { ...layout, layers } : layout
  })
}
