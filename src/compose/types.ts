/**
 * The shapes the planner and the editor agree on.
 *
 * A `DesignDocument` is the whole of what the host stores: a format tag, a
 * name, and one `TdLayout` per page — exactly the array the widget store holds,
 * so handing one to `<DesignStudio document={…}/>` and reading one back out of
 * `getDocument()` are the same thing in both directions with nothing lost.
 */
import type { TdLayout } from '@/store/types'
import type { TBrandKit } from '@/common/methods/brandKitCore'

export type { TdLayout, TBrandKit }

export type DesignDocument = {
  /** Format tag, so a stored blob can be recognised and migrated later. */
  format: 'design-studio/v1'
  title: string
  /** One per page, exactly as the widget store holds them. */
  layouts: TdLayout[]
}

/**
 * What a document is for.
 *
 * `slides` is 1920 × 1080, the template panel offers slide templates only, and
 * the presenter and the speaker notes are there. `poster` is Letter portrait at
 * 150 DPI — 1275 × 1650 — the panel offers posters, flyers, signs and awards,
 * and there is nothing to present.
 */
export type DesignKind = 'slides' | 'poster'

export const SLIDE_PAGE = { width: 1920, height: 1080 } as const
export const POSTER_PAGE = { width: 1275, height: 1650 } as const

export function pageSizeFor(kind: DesignKind): { width: number; height: number } {
  return kind === 'poster' ? { ...POSTER_PAGE } : { ...SLIDE_PAGE }
}

/**
 * A picture the host has already resolved. Never an id, never bytes to fetch.
 * `alt` is what it shows, in words, for a screen reader and the exports.
 */
export type ImageRef = { url: string; width: number; height: number; alt?: string }

/** A bullet, and the points made under it. */
export type OutlineBullet = { text: string; sub: string[] }

export type DeckSlideLayout = 'title' | 'statement' | 'content' | 'two-column' | 'media'

export type DeckSlide = {
  layout: DeckSlideLayout
  title: string | null
  kicker: string | null
  sub: string | null
  bullets: OutlineBullet[]
  bulletsRight: OutlineBullet[]
  columnHeads: string[]
  callout: string | null
  notes: string | null
  image: ImageRef | null
}

export type DeckOutline = {
  title: string
  slides: DeckSlide[]
}

export type PosterSignLayout = 'direction' | 'icon' | 'statement' | 'number' | 'notice'

export type PosterSign = {
  layout: PosterSignLayout
  /** A sticker key the studio ships. One it does not know is dropped. */
  icon: string | null
  eyebrow: string | null
  badge: string | null
  head: string
  sub: string | null
  foot: string | null
}

/**
 * The paper a sign is printed on.
 *
 * Two spellings, because the planner stores the orientation in the size for
 * Letter and this has always taken it separately. `letter-landscape` and
 * `letter-portrait` say which way round they are and win over `orientation`;
 * the bare names leave that to `orientation`, as they always did.
 */
export type PosterSize = 'letter' | 'letter-landscape' | 'letter-portrait' | 'tabloid' | 'banner'

export type PosterOutline = {
  orientation: 'LANDSCAPE' | 'PORTRAIT'
  size: PosterSize
  signs: PosterSign[]
}

/**
 * The most pages a design holds. The editor stops adding pages here, and the
 * composer stops here too: a deck it made that the editor would refuse to add
 * one more slide to is a deck nobody can finish. A host with a lower ceiling
 * passes it as `maxPages`.
 */
export const MAX_PAGES = 50

export type ComposeOptions = {
  /** A slide theme key, or a poster pack key. Anything else falls back. */
  theme?: string
  brand?: TBrandKit
  /**
   * The most pages the document may come back with, continuation pages
   * included. Capped at `MAX_PAGES`, which is also the default.
   */
  maxPages?: number
}

/**
 * Words from the outline that are not on the page as the outline had them.
 *
 * - `shortened`: set at the smallest size the box allows and still too long,
 *   so the end was cut and an ellipsis put in its place.
 * - `no-room`: nowhere to put them at all, even on a page of their own.
 * - `page-limit`: they would have needed a page past `maxPages`.
 */
export type DroppedText = {
  /**
   * 0-based index of the page in the returned document the words were meant
   * for. For `page-limit`, the index the page would have had.
   */
  page: number
  /** Which item of the outline they came from: an index into `slides` or `signs`. */
  source: number
  /**
   * Where in that item, in the outline's own names: `title`, `sub`, `kicker`,
   * `callout`, `notes`, `columnHeads[1]`, `bullets[3]`, `bullets[3].sub[0]`,
   * `bulletsRight[2]`, `head`, `eyebrow`, `badge`, `foot`, and `footer` for
   * the school's line along the bottom of a slide.
   */
  field: string
  /** The words, whole, as the outline had them. */
  text: string
  reason: 'shortened' | 'no-room' | 'page-limit'
}

/**
 * What composing had to do to make the outline fit. Plain JSON, so a host can
 * store it beside the design or hand it back to the model that wrote the
 * outline.
 */
export type ComposeReport = {
  /**
   * Pages added because one slide's bullets ran past the bottom of it. Each is
   * the same layout with the same heading and "(continued)" after it.
   */
  continuedPages: number
  /** Empty when every word of the outline is on a page, whole. */
  dropped: DroppedText[]
}

export type ComposeResult = {
  document: DesignDocument
  report: ComposeReport
}

export type DesignOp =
  /** Words. Always escaped — `<b>` lands on the page as the characters `<b>`. */
  | { op: 'setText'; id: string; text: string }
  /**
   * Markup, for a host round-tripping the editor's own output. It goes through
   * the allowlist first, so what is stored is what a design may hold whatever
   * was sent. Anything that came from a person or a model wants `setText`.
   */
  | { op: 'setMarkup'; id: string; html: string }
  /**
   * A different picture in the same frame. `alt` describes the new one; left
   * out, the old description goes, because it was about the old picture.
   */
  | { op: 'setImage'; id: string; url: string; width: number; height: number; alt?: string }
  | { op: 'addPage'; after: number; kind: string; fields: Record<string, string> }
  | { op: 'removePage'; index: number }
  | { op: 'movePage'; from: number; to: number }
  | { op: 'applyBrand' }
  /**
   * Motion across the whole deck, on or off. Deck-wide on purpose: a deck with
   * a transition on four pages out of nine reads as a mistake, and the thing
   * anybody actually asks for is "give it some movement" or "take it off".
   */
  | { op: 'setMotion'; on: boolean }

export type RejectedOp = { op: DesignOp; reason: string }

/**
 * What an LLM is shown of a design. Text only, and never a data URL or a byte
 * of a picture — a page carrying a photograph would otherwise be megabytes of
 * base64 in a prompt.
 */
export type DocumentView = {
  title: string
  kind: DesignKind | 'unknown'
  pages: Array<{
    index: number
    width: number
    height: number
    texts: Array<{ id: string; role: string | null; text: string }>
    images: Array<{ id: string; alt: string | null }>
    notes: string | null
  }>
}
