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
import { normaliseBrandKit, type TBrandKit } from '@/common/methods/brandKitCore'
import type { DesignDocument } from './types'

export function applyBrand(doc: DesignDocument, brand: TBrandKit): DesignDocument {
  const next = JSON.parse(JSON.stringify(doc)) as DesignDocument
  // A kit off the wire may name a font the editor no longer bundles, or a
  // colour that is not one. Normalising drops those rather than trusting them.
  applyBrandToLayouts(next.layouts, normaliseBrandKit(brand), { fields: true, fonts: true, colors: true })
  return next
}
