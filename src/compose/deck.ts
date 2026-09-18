/**
 * A slide deck from an outline.
 *
 * The outline is what a model is good at — a layout name, a heading, some
 * bullets, a note to say out loud — and the layout is what it is bad at. So
 * nothing about position, size or colour comes from the caller. Each of the
 * five layouts is drawn here against the theme's own numbers, and the words are
 * measured into the boxes rather than poured into them: a heading two words
 * longer than the designer's comes down a point at a time until it fits, and a
 * seventh bullet on a slide with room for six is dropped rather than printed
 * over the footer.
 *
 * Dropping is the right answer and it is worth saying why. Nobody reads the
 * seventh bullet on a slide; they read the six above it and the mess at the
 * bottom of the page. A deck that quietly holds fewer points than the outline
 * asked for is a deck somebody can stand up and present.
 */
import type { ComposeOptions, DeckOutline, DeckSlide, DesignDocument, OutlineBullet } from './types'
import { SLIDE_PAGE } from './types'
import type { Theme } from './themes'
import { slideTheme } from './themes'
import { fitText, heightOf } from './textFit'
import { imageWidget, markup, page, rectWidget, textWidget } from './widgets'
import { applyBrand, fieldFiller } from './brand'
import type { TdLayout, TdWidgetData } from '@/store/types'

const M = 110
const { width: W, height: H } = SLIDE_PAGE
const CONTENT = W - M * 2
/** Where the footer rule sits, and therefore how far anything may reach down. */
const FOOTER = H - 96

/** The layout names `addPage` will take for a deck. */
export const DECK_PAGE_KINDS: DeckSlide['layout'][] = ['title', 'statement', 'content', 'two-column', 'media']

export function blankSlide(layout: DeckSlide['layout']): DeckSlide {
  return { layout, title: null, kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }
}

type Box = { left: number; top: number; width: number; height: number }

/**
 * Fits one run of words into a box and returns the widget, or nothing when the
 * words were empty. `bottom` is where the next thing may start, which is what
 * keeps a column honest as the pieces above it change size.
 */
function place(
  text: string | null | undefined,
  box: Box,
  style: {
    font: Theme['display'] | Theme['body']
    size: number
    minSize: number
    lineHeight: number
    color: string
    weight?: number
    tracking?: number
    align?: 'left' | 'center' | 'right'
    brandRole?: 'heading' | 'body' | 'keep'
    role?: string
    maxLines?: number
  },
): { widget: TdWidgetData; bottom: number } | null {
  const words = String(text || '').trim()
  if (!words) return null
  const fit = fitText(words, { fontFamily: style.font.value, fontSize: style.size, lineHeight: style.lineHeight, letterSpacing: style.tracking, bold: (style.weight || 400) >= 600 }, { width: box.width, height: box.height, minFontSize: style.minSize, maxLines: style.maxLines })
  if (!fit.lines.length) return null
  const height = heightOf(fit, style.lineHeight)
  return {
    widget: textWidget({
      left: box.left,
      top: box.top,
      width: box.width,
      height,
      fontSize: fit.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.tracking ? Math.round(style.tracking * (fit.fontSize / style.size)) : 0,
      color: style.color,
      font: style.font,
      fontWeight: style.weight,
      textAlign: style.align,
      brandRole: style.brandRole,
      role: style.role,
      text: markup(fit.lines.join('\n')),
    }),
    bottom: box.top + height,
  }
}

function eyebrow(theme: Theme, text: string | null, top: number, left = M, width = CONTENT): { widget: TdWidgetData; bottom: number } | null {
  return place(
    text ? text.toUpperCase() : null,
    { left, top, width, height: 40 },
    {
      font: theme.eyebrow,
      size: 25,
      minSize: 18,
      lineHeight: 1.3,
      tracking: theme.eyebrowTracking,
      color: theme.accent,
      brandRole: 'keep',
      role: 'eyebrow',
      maxLines: 1,
    },
  )
}

/**
 * A run of bullets down a column, each one its own text box with its own
 * marker, stopping at the first that will not fit.
 *
 * One box per bullet rather than one box of lines, so that a model handed the
 * page back can rewrite the third point without touching the other five, and so
 * that a sub-point can be indented rather than run on.
 */
function bulletColumn(theme: Theme, bullets: OutlineBullet[], box: Box, size: number): TdWidgetData[] {
  const out: TdWidgetData[] = []
  const gap = Math.round(size * 0.75)
  const subGap = Math.round(size * 0.35)
  const indent = Math.round(size * 1.3)
  let top = box.top
  const limit = box.top + box.height

  for (const bullet of bullets) {
    const placed = place(
      bullet.text,
      { left: box.left + indent, top, width: box.width - indent, height: limit - top },
      {
        font: theme.body,
        size,
        minSize: Math.round(size * 0.72),
        lineHeight: 1.4,
        color: theme.ink,
        brandRole: 'body',
        role: 'bullet',
      },
    )
    // Out of room. Everything after this would be off the page too, so stop
    // rather than skipping one and printing the next.
    if (!placed || placed.bottom > limit) break
    out.push(rectWidget(box.left + Math.round(size * 0.35), top + Math.round(size * 0.52), Math.round(size * 0.3), Math.round(size * 0.3), theme.accent, 999))
    out.push(placed.widget)
    top = placed.bottom + subGap

    for (const sub of bullet.sub || []) {
      const child = place(
        sub,
        { left: box.left + indent * 2, top, width: box.width - indent * 2, height: limit - top },
        {
          font: theme.body,
          size: Math.round(size * 0.82),
          minSize: Math.round(size * 0.62),
          lineHeight: 1.4,
          color: theme.muted,
          brandRole: 'body',
          role: 'sub-bullet',
        },
      )
      if (!child || child.bottom > limit) break
      out.push(rectWidget(box.left + indent, top + Math.round(size * 0.5), Math.round(size * 0.5), 2, theme.muted))
      out.push(child.widget)
      top = child.bottom + subGap
    }
    top += gap - subGap
  }
  return out
}

/** The hairline and the school's name along the bottom of every slide. */
function footer(theme: Theme, fill: (text: string) => string): TdWidgetData[] {
  const rule = rectWidget(M, FOOTER, CONTENT, 2, theme.rule)
  const line = fill('{{school.name|upper}}')
  const name = textWidget({
    left: M,
    top: FOOTER + 22,
    width: CONTENT,
    height: 32,
    fontSize: 22,
    lineHeight: 1.3,
    letterSpacing: Math.round(theme.eyebrowTracking / 2),
    color: theme.muted,
    font: theme.eyebrow,
    brandRole: 'keep',
    role: 'school.name',
    text: markup(line),
  })
  return [rule, name]
}

function titleSlide(theme: Theme, slide: DeckSlide, fill: Fill): TdWidgetData[] {
  const layers: TdWidgetData[] = []
  const brow = eyebrow(theme, slide.kicker, 110)
  if (brow) layers.push(brow.widget)
  layers.push(rectWidget(M, 190, 150, 8, theme.accent))

  const title = place(
    slide.title,
    { left: M, top: 260, width: Math.round(CONTENT * 0.84), height: 400 },
    {
      font: theme.display,
      size: 112,
      minSize: 52,
      lineHeight: theme.displayLineHeight,
      tracking: theme.displayTracking,
      color: theme.ink,
      weight: theme.displayWeight,
      brandRole: 'heading',
      role: 'heading',
    },
  )
  let top = 660
  if (title) {
    layers.push(title.widget)
    top = title.bottom + 46
  }
  const sub = place(
    slide.sub,
    { left: M, top, width: Math.round(CONTENT * 0.68), height: FOOTER - 40 - top },
    {
      font: theme.body,
      size: 38,
      minSize: 26,
      lineHeight: 1.4,
      color: theme.muted,
      brandRole: 'body',
      role: 'body',
    },
  )
  if (sub) layers.push(sub.widget)
  return [...layers, ...footer(theme, fill)]
}

function statementSlide(theme: Theme, slide: DeckSlide, fill: Fill): TdWidgetData[] {
  const layers: TdWidgetData[] = [rectWidget(M, 250, 10, 420, theme.accent)]
  const left = M + 70
  const width = CONTENT - 70

  const brow = eyebrow(theme, slide.kicker, 110)
  if (brow) layers.push(brow.widget)

  const statement = place(
    slide.title || slide.callout,
    { left, top: 270, width, height: 380 },
    {
      font: theme.display,
      size: 84,
      minSize: 40,
      lineHeight: 1.18,
      color: theme.ink,
      weight: theme.displayWeight,
      brandRole: 'heading',
      role: 'heading',
    },
  )
  let top = 680
  if (statement) {
    layers.push(statement.widget)
    top = statement.bottom + 40
  }
  const sub = place(
    slide.sub,
    { left, top, width: Math.round(width * 0.7), height: FOOTER - 40 - top },
    {
      font: theme.body,
      size: 32,
      minSize: 22,
      lineHeight: 1.4,
      color: theme.muted,
      brandRole: 'body',
      role: 'body',
    },
  )
  if (sub) layers.push(sub.widget)
  return [...layers, ...footer(theme, fill)]
}

/** The heading block every content-shaped slide starts with. Returns its floor. */
function heading(theme: Theme, slide: DeckSlide, layers: TdWidgetData[], width = CONTENT): number {
  const brow = eyebrow(theme, slide.kicker, 110, M, width)
  let top = brow ? brow.bottom + 14 : 110
  if (brow) layers.push(brow.widget)

  const title = place(
    slide.title,
    { left: M, top, width, height: 200 },
    {
      font: theme.display,
      size: 62,
      minSize: 34,
      lineHeight: 1.15,
      color: theme.ink,
      weight: theme.displayWeight,
      brandRole: 'heading',
      role: 'heading',
    },
  )
  if (title) {
    layers.push(title.widget)
    top = title.bottom + 26
  }
  layers.push(rectWidget(M, top, width, 2, theme.rule))
  return top + 40
}

function contentSlide(theme: Theme, slide: DeckSlide, fill: Fill): TdWidgetData[] {
  const layers: TdWidgetData[] = []
  let top = heading(theme, slide, layers)

  const sub = place(
    slide.sub,
    { left: M, top, width: Math.round(CONTENT * 0.8), height: 130 },
    {
      font: theme.body,
      size: 30,
      minSize: 22,
      lineHeight: 1.4,
      color: theme.muted,
      brandRole: 'body',
      role: 'body',
    },
  )
  if (sub) {
    layers.push(sub.widget)
    top = sub.bottom + 34
  }

  const calloutHeight = slide.callout ? 130 : 0
  layers.push(...bulletColumn(theme, slide.bullets, { left: M, top, width: CONTENT, height: FOOTER - 40 - calloutHeight - top }, 32))

  if (slide.callout) {
    const boxTop = FOOTER - 40 - calloutHeight
    layers.push(rectWidget(M, boxTop, CONTENT, calloutHeight - 16, theme.accent, 8))
    const words = place(
      slide.callout,
      { left: M + 34, top: boxTop + 28, width: CONTENT - 68, height: calloutHeight - 72 },
      {
        font: theme.body,
        size: 30,
        minSize: 20,
        lineHeight: 1.35,
        color: theme.paper,
        brandRole: 'body',
        role: 'callout',
      },
    )
    if (words) layers.push(words.widget)
  }
  return [...layers, ...footer(theme, fill)]
}

function twoColumnSlide(theme: Theme, slide: DeckSlide, fill: Fill): TdWidgetData[] {
  const layers: TdWidgetData[] = []
  const top = heading(theme, slide, layers)
  const gutter = 80
  const column = Math.round((CONTENT - gutter) / 2)
  const columns: Array<{ left: number; head: string | null; bullets: OutlineBullet[] }> = [
    { left: M, head: slide.columnHeads[0] || null, bullets: slide.bullets },
    { left: M + column + gutter, head: slide.columnHeads[1] || null, bullets: slide.bulletsRight },
  ]

  layers.push(rectWidget(M + column + Math.round(gutter / 2), top, 2, FOOTER - 40 - top, theme.rule))

  for (const side of columns) {
    let y = top
    const head = place(
      side.head,
      { left: side.left, top: y, width: column, height: 90 },
      {
        font: theme.display,
        size: 34,
        minSize: 24,
        lineHeight: 1.25,
        color: theme.accent,
        weight: theme.displayWeight,
        brandRole: 'heading',
        role: 'column heading',
      },
    )
    if (head) {
      layers.push(head.widget)
      y = head.bottom + 24
    }
    layers.push(...bulletColumn(theme, side.bullets, { left: side.left, top: y, width: column, height: FOOTER - 40 - y }, 28))
  }
  return [...layers, ...footer(theme, fill)]
}

function mediaSlide(theme: Theme, slide: DeckSlide, fill: Fill): TdWidgetData[] {
  const layers: TdWidgetData[] = []
  const column = Math.round(CONTENT * 0.46)
  const slot = { left: M + column + 70, top: 110, width: CONTENT - column - 70, height: FOOTER - 150 }

  // The picture goes down first so the words are never behind it, and the slot
  // is filled whatever shape the photograph is — see `imageWidget`.
  if (slide.image?.url) {
    layers.push(imageWidget(slot.left, slot.top, slot.width, slot.height, slide.image))
  } else {
    layers.push(rectWidget(slot.left, slot.top, slot.width, slot.height, theme.rule, 6))
  }

  const brow = eyebrow(theme, slide.kicker, 130, M, column)
  let top = brow ? brow.bottom + 16 : 130
  if (brow) layers.push(brow.widget)

  const title = place(
    slide.title,
    { left: M, top, width: column, height: 300 },
    {
      font: theme.display,
      size: 62,
      minSize: 32,
      lineHeight: 1.14,
      color: theme.ink,
      weight: theme.displayWeight,
      brandRole: 'heading',
      role: 'heading',
    },
  )
  if (title) {
    layers.push(title.widget)
    top = title.bottom + 26
  }
  const sub = place(
    slide.sub,
    { left: M, top, width: column, height: 200 },
    {
      font: theme.body,
      size: 30,
      minSize: 22,
      lineHeight: 1.4,
      color: theme.muted,
      brandRole: 'body',
      role: 'body',
    },
  )
  if (sub) top = sub.bottom + 30
  if (sub) layers.push(sub.widget)

  layers.push(...bulletColumn(theme, slide.bullets, { left: M, top, width: column, height: FOOTER - 40 - top }, 26))
  return [...layers, ...footer(theme, fill)]
}

/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string

const LAYOUTS: Record<DeckSlide['layout'], (theme: Theme, slide: DeckSlide, fill: Fill) => TdWidgetData[]> = {
  title: titleSlide,
  statement: statementSlide,
  content: contentSlide,
  'two-column': twoColumnSlide,
  media: mediaSlide,
}

/** One slide, as a page of the design. Exported so `addPage` can make one. */
export function composeSlide(slide: DeckSlide, theme: Theme, fill: Fill = (text) => text): TdLayout {
  const draw = LAYOUTS[slide.layout] || contentSlide
  const name = slide.title?.trim() || slide.kicker?.trim() || 'Slide'
  return { global: page(name.slice(0, 60), W, H, theme.paper, slide.notes), layers: draw(theme, slide, fill) }
}

export function composeDeck(outline: DeckOutline, options: ComposeOptions = {}): DesignDocument {
  const theme = slideTheme(options.theme)
  const fill = fieldFiller(options.brand)
  const slides = Array.isArray(outline?.slides) ? outline.slides : []
  const layouts = (slides.length ? slides : [blankSlide('title')]).map((slide) => composeSlide({ ...blankSlide(slide?.layout || 'content'), ...slide }, theme, fill))
  const doc: DesignDocument = { format: 'design-studio/v1', title: String(outline?.title || 'Untitled deck'), layouts }
  // The kit goes on last, over a finished deck, so that every page's footer
  // reads the school's name and the theme's one accent becomes the school's
  // first colour — the same pass Apply brand makes in the editor.
  return options.brand ? applyBrand(doc, options.brand) : doc
}
