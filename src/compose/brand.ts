/**
 * A school's brand kit onto a design, away from the browser.
 *
 * Exactly what the Brand panel's Apply brand does — the same three passes over
 * the same pages, from `brandCore.ts` — so a deck branded by the planner as it
 * is composed and one branded by hand in the editor come out the same. Fields
 * first, then fonts, then colours, and the readability guard after the colours
 * because what a line has to be read against is what ends up under it.
 *
 * A copy comes back. The document handed in is the host's, and a function that
 * quietly rewrote it would be a function nobody could call twice.
 */
import { applyBrandToLayouts } from '@/store/widget/brandCore'
import { brandResolver, normaliseBrandKit, type TBrandKit } from '@/common/methods/brandKitCore'
import { fillMarkup } from '@/utils/mergeFieldsCore'
import type { DesignDocument } from './types'

/**
 * What a line carrying `{{school.*}}` will actually read once the kit fills it.
 *
 * Needed *before* the line is measured, not after. A footer laid out around
 * `{{school.name}}` and then filled with "Riverbend Academy Middle School" is a
 * footer that fits in the composer's arithmetic and runs off the page in print.
 * With no kit the field is left standing, which is what an author should see.
 */
export function fieldFiller(brand?: TBrandKit): (text: string) => string {
  if (!brand) return (text) => text
  const resolve = brandResolver(normaliseBrandKit(brand))
  return (text) => fillMarkup(text, resolve)
}

export function applyBrand(doc: DesignDocument, brand: TBrandKit): DesignDocument {
  const next = JSON.parse(JSON.stringify(doc)) as DesignDocument
  // A kit off the wire may name a font the editor no longer bundles, or a
  // colour that is not one. Normalising drops those rather than trusting them.
  applyBrandToLayouts(next.layouts, normaliseBrandKit(brand), { fields: true, fonts: true, colors: true })
  return next
}
