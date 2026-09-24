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
import { applyBrandToLayouts, brandFontFor } from '@/store/widget/brandCore'
import { brandResolver, normaliseBrandKit, type TBrandKit } from '@/common/methods/brandKitCore'
import { fillMarkup } from '@/utils/mergeFieldsCore'
import type { DesignDocument } from './types'
import type { FontChoice, Theme } from './themes'

/**
 * The theme with the kit's fonts in it, for setting type before it is measured.
 *
 * Apply brand swaps the fonts on a finished page, and on a composed one that is
 * too late: every line has already been measured and broken in the theme's
 * face. Anton to Libre Baskerville is a third wider again, so a heading that
 * fitted on two lines in one came out on three in the other, over whatever was
 * under it. So the composer asks here first and lays the words out in the font
 * they will be read in. The pass at the end then finds every box already in
 * the right face and leaves it be.
 *
 * Same choice as Apply brand, from the same function: headings take the kit's
 * heading font, body text its body font, each falling back to the other. The
 * eyebrow face is not touched, because the boxes set in it say `keep`.
 */
export function brandTheme(theme: Theme, brand?: TBrandKit): Theme {
  if (!brand) return theme
  const kit = normaliseBrandKit(brand)
  const choice = (role: 'heading' | 'body'): FontChoice | null => {
    const font = brandFontFor(role, kit)
    return font ? { id: font.id, value: font.value, url: font.url, alias: font.alias } : null
  }
  return { ...theme, display: choice('heading') ?? theme.display, body: choice('body') ?? theme.body }
}

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
