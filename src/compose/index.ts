/**
 * `design-studio/compose` — the editor's layout knowledge, without the editor.
 *
 * Everything here is a function from JSON to JSON. No DOM, no window, no React,
 * no valtio proxies: it runs in a request handler on Node, in a test under
 * vitest's node environment, and in the browser, and gives the same answer in
 * all three. That is the point of it — the planner composes a deck on the
 * server from a model's outline, stores the result, and the editor opens that
 * same JSON later with nothing in between.
 *
 * See EMBEDDING.md for how the two halves fit together.
 */
export { composeDeck, composeSlide, blankSlide, DECK_PAGE_KINDS } from './deck'
export { composePoster, composeSign, blankSign, pageSize, SIGN_PAGE_KINDS } from './poster'
export { describeDocument, kindOf } from './describe'
export { applyOps, pageKinds } from './ops'
export { sanitizeMarkup, markupToText, parseMarkup } from './markup'
// What a design may be made of, for a host validating one before it stores it.
// Derived from the widget registry rather than typed out again — see the
// `satisfies` in `components/modules/widgets/registry.ts`.
export { WIDGET_TYPES, URL_FIELDS, NESTED_URL_PATHS, PAGE_TYPE } from '@/components/modules/widgets/widgetTypes'
export type { TWidgetType } from '@/components/modules/widgets/widgetTypes'
export { applyBrand } from './brand'
export { SLIDE_THEME_KEYS, POSTER_PACK_KEYS, slideTheme, posterPack } from './themes'
export type { Theme, SlideThemeKey, PosterPackKey } from './themes'
export { ICON_KEYS } from './icons'
export { SLIDE_PAGE, POSTER_PAGE, pageSizeFor } from './types'
export type { ComposeOptions, DeckOutline, DeckSlide, DeckSlideLayout, DesignDocument, DesignKind, DesignOp, DocumentView, ImageRef, OutlineBullet, PosterOutline, PosterSign, PosterSignLayout, PosterSize, RejectedOp, TBrandKit, TdLayout } from './types'
