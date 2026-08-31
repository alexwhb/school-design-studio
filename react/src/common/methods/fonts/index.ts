/**
 * The font list the editor works from.
 *
 * The fonts ship with the app (public/fonts), so unlike the original there is
 * nothing to fetch and nothing to cache — the list is a static import and is
 * always available, including offline. public/fonts/fonts.css declares every
 * face up front, so a font is ready the moment someone picks it.
 */
import fontsData, { type TFontItem } from '@/assets/data/FontsData'

export type TFontItemData = TFontItem

export const useFontStore = {
  list: fontsData as TFontItemData[],
  async init() {
    // Clear the cache the original build left behind, so upgrading users are
    // not stuck with a list of Chinese fonts that no longer resolve.
    localStorage.removeItem('FONTS')
    localStorage.removeItem('FONTS_VERSION')
    this.list = fontsData
  },
}
