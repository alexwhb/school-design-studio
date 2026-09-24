/**
 * A slide deck from an outline.
 *
 * The outline is what a model is good at — a layout name, a heading, some
 * bullets, a note to say out loud — and the layout is what it is bad at. So
 * nothing about position, size or colour comes from the caller. Each of the
 * five layouts is drawn here against the theme's own numbers, and the words are
 * measured into the boxes rather than poured into them: a heading two words
 * longer than the designer's comes down a point at a time until it fits.
 *
 * Bullets that run past the bottom of a slide go onto another one after it,
 * the same layout under the same heading with "(continued)" on the end. They
 * used to be dropped, on the theory that nobody reads the seventh bullet. But a
 * model that wrote eight points with two sub-points each got four of them and
 * half the sub-points, with nothing to say so, and the four that went missing
 * were the ones somebody had asked for. A second slide is a thing a person can
 * see and fix; a missing point is not. What still cannot be placed — a slide
 * past the page limit, a heading cut short to fit — is written down in the
 * report `composeDeckWithReport` hands back. See `report.ts`.
 */
import type { ComposeOptions, ComposeResult, DeckOutline, DeckSlide, DesignDocument, OutlineBullet } from './types'
import { MAX_PAGES, SLIDE_PAGE } from './types'
import type { Theme } from './themes'
import { slideTheme } from './themes'
import { fitText, heightOf } from './textFit'
import { IMAGE_SLOT_ROLE, imageWidget, markup, page, rectWidget, textWidget } from './widgets'
import { applyBrand, brandTheme, fieldFiller } from './brand'
import { pageCap, recorder, silent, type Recorder } from './report'
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

/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string

/** What every layout is handed besides the slide: the fill, and where to write down a cut. */
type Ctx = { fill: Fill; rec: Recorder }

type PlaceStyle = {
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
}

type Placed = { widget: TdWidgetData; bottom: number; truncated: boolean }

/**
 * Fits one run of words into a box and returns the widget, or nothing when the
 * words were empty. `bottom` is where the next thing may start, which is what
 * keeps a column honest as the pieces above it change size. `truncated` says
 * the words were cut to fit, which the caller either reports or answers by
 * trying the words somewhere with more room.
 */
function fit(text: string | null | undefined, box: Box, style: PlaceStyle): Placed | null {
  const words = String(text || '').trim()
  if (!words) return null
  const fitted = fitText(words, { fontFamily: style.font.value, fontSize: style.size, lineHeight: style.lineHeight, letterSpacing: style.tracking, bold: (style.weight || 400) >= 600 }, { width: box.width, height: box.height, minFontSize: style.minSize, maxLines: style.maxLines })
  if (!fitted.lines.length) return null
  const height = heightOf(fitted, style.lineHeight)
  return {
    widget: textWidget({
      left: box.left,
      top: box.top,
      width: box.width,
      height,
      fontSize: fitted.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.tracking ? Math.round(style.tracking * (fitted.fontSize / style.size)) : 0,
      color: style.color,
      font: style.font,
      fontWeight: style.weight,
      textAlign: style.align,
      brandRole: style.brandRole,
      role: style.role,
      text: markup(fitted.lines.join('\n')),
    }),
    bottom: box.top + height,
    truncated: fitted.truncated,
  }
}

/** `fit`, for a box that has nowhere else to go: a cut is written down and kept. */
function place(ctx: Ctx, field: string, text: string | null | undefined, box: Box, style: PlaceStyle): Placed | null {
  const placed = fit(text, box, style)
  if (placed?.truncated) ctx.rec.note(field, String(text), 'shortened')
  return placed
}

function eyebrow(ctx: Ctx, theme: Theme, text: string | null, top: number, left = M, width = CONTENT): Placed | null {
  return place(
    ctx,
    'kicker',
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
 * A bullet on its way onto a page, and which of the outline's bullets it is.
 *
 * `at` and `subAt` are the outline's own indexes, so a cut can be reported
 * against the words the model wrote even when they land on the third
 * continuation. `repeat` is a bullet whose sub-points were split across a page
 * break: its own line is shown again above the rest of them, because four
 * sub-points under no heading are four sentences about nothing.
 */
type Item = { text: string; sub: string[]; at: number; subAt: number; repeat: boolean }

function itemsOf(bullets: OutlineBullet[] | null | undefined): Item[] {
  if (!Array.isArray(bullets)) return []
  return bullets.map((bullet, at) => ({
    text: String(bullet?.text ?? ''),
    sub: Array.isArray(bullet?.sub) ? bullet.sub.map((line) => String(line ?? '')) : [],
    at,
    subAt: 0,
    repeat: false,
  }))
}

/**
 * A run of bullets down a column, each one its own text box with its own
 * marker, and whatever did not fit handed back for the next page.
 *
 * One box per bullet rather than one box of lines, so that a model handed the
 * page back can rewrite the third point without touching the other five, and so
 * that a sub-point can be indented rather than run on.
 *
 * A bullet and its sub-points go over a page break together when they can, so
 * a point does not end at the foot of one slide with its detail on the next.
 * Only the first bullet on a page is split, because on the next page it would
 * be the first again. `fresh` is a page that exists only to hold what is left:
 * there is no emptier page to send anything on to, so the first thing on it is
 * placed whatever it takes — cut to fit and written down if it must be — and
 * that is what makes sure every continuation moves the list on.
 */
function bulletColumn(ctx: Ctx, key: 'bullets' | 'bulletsRight', theme: Theme, items: Item[], box: Box, size: number, fresh: boolean): { widgets: TdWidgetData[]; rest: Item[] } {
  const out: TdWidgetData[] = []
  const gap = Math.round(size * 0.75)
  const subGap = Math.round(size * 0.35)
  const indent = Math.round(size * 1.3)
  let top = box.top
  const limit = box.top + box.height
  const bulletStyle: PlaceStyle = { font: theme.body, size, minSize: Math.round(size * 0.72), lineHeight: 1.4, color: theme.ink, brandRole: 'body', role: 'bullet' }
  const subStyle: PlaceStyle = { font: theme.body, size: Math.round(size * 0.82), minSize: Math.round(size * 0.62), lineHeight: 1.4, color: theme.muted, brandRole: 'body', role: 'sub-bullet' }
  const fits = (placed: Placed | null, forced: boolean) => !!placed && placed.bottom <= limit && (!placed.truncated || forced)

  for (let n = 0; n < items.length; n++) {
    const item = items[n]
    const first = out.length === 0
    // The first thing on a page with nothing before it can go nowhere better.
    const forced = first && fresh
    const group: TdWidgetData[] = []
    let y = top
    const field = `${key}[${item.at}]`

    const placed = fit(item.text, { left: box.left + indent, top: y, width: box.width - indent, height: limit - y }, bulletStyle)
    if (item.text.trim() && !fits(placed, forced)) {
      if (!forced) return { widgets: out, rest: items.slice(n) }
      // Not even a line of it fits on an empty page. Nothing will; say so and
      // move on rather than adding blank pages until the limit.
      ctx.rec.note(field, item.text, 'no-room')
      item.sub.forEach((line, k) => ctx.rec.note(`${field}.sub[${item.subAt + k}]`, line, 'no-room'))
      continue
    }
    if (placed) {
      if (placed.truncated && !item.repeat) ctx.rec.note(field, item.text, 'shortened')
      group.push(rectWidget(box.left + Math.round(size * 0.35), y + Math.round(size * 0.52), Math.round(size * 0.3), Math.round(size * 0.3), theme.accent, 999))
      group.push(placed.widget)
      y = placed.bottom + subGap
    }

    let split = -1
    let placedSubs = 0
    for (let k = 0; k < item.sub.length; k++) {
      const line = item.sub[k]
      if (!line.trim()) continue
      const subField = `${field}.sub[${item.subAt + k}]`
      // Progress again: the first sub-point under the first bullet of a fresh
      // page is placed or given up on, never sent on to another page.
      const forcedSub = forced && placedSubs === 0
      const child = fit(line, { left: box.left + indent * 2, top: y, width: box.width - indent * 2, height: limit - y }, subStyle)
      if (!fits(child, forcedSub)) {
        if (forcedSub) {
          ctx.rec.note(subField, line, 'no-room')
          continue
        }
        split = k
        break
      }
      if (child!.truncated) ctx.rec.note(subField, line, 'shortened')
      group.push(rectWidget(box.left + indent, y + Math.round(size * 0.5), Math.round(size * 0.5), 2, theme.muted))
      group.push(child!.widget)
      y = child!.bottom + subGap
      placedSubs++
    }

    if (split >= 0) {
      // Keep the bullet with its points: over the page together, unless it is
      // the first on this one and would be first on the next as well.
      if (!first) return { widgets: out, rest: items.slice(n) }
      out.push(...group)
      const carried: Item = { text: item.text, sub: item.sub.slice(split), at: item.at, subAt: item.subAt + split, repeat: true }
      return { widgets: out, rest: [carried, ...items.slice(n + 1)] }
    }

    out.push(...group)
    top = y + gap - subGap
  }
  return { widgets: out, rest: [] }
}

/** The hairline and the school's name along the bottom of every slide. */
function footer(ctx: Ctx, theme: Theme): TdWidgetData[] {
  const rule = rectWidget(M, FOOTER, CONTENT, 2, theme.rule)
  const line = ctx.fill('{{school.name|upper}}')
  // Fitted like everything else. It is one line of 22px across the whole slide
  // and nearly always fits, but a trust's full name set in a wide face does
  // not, and it used to run on under the bottom of the page.
  const name = place(
    ctx,
    'footer',
    line,
    { left: M, top: FOOTER + 22, width: CONTENT, height: 32 },
    {
      font: theme.eyebrow,
      size: 22,
      minSize: 16,
      lineHeight: 1.3,
      tracking: Math.round(theme.eyebrowTracking / 2),
      color: theme.muted,
      brandRole: 'keep',
      role: 'school.name',
      maxLines: 1,
    },
  )
  return name ? [rule, name.widget] : [rule]
}

/** Bullets a slide could not hold, by column. */
type Overflow = { bullets: Item[]; bulletsRight: Item[] }

/** A slide as the layouts draw it: the outline's, with its bullets as items. */
type Working = Omit<DeckSlide, 'bullets' | 'bulletsRight'> & { bullets: Item[]; bulletsRight: Item[]; continued: boolean }

type Drawn = { layers: TdWidgetData[]; overflow: Overflow | null }

function overflowOf(left: Item[], right: Item[] = []): Overflow | null {
  return left.length || right.length ? { bullets: left, bulletsRight: right } : null
}

function titleSlide(theme: Theme, slide: Working, ctx: Ctx): Drawn {
  const layers: TdWidgetData[] = []
  const brow = eyebrow(ctx, theme, slide.kicker, 110)
  if (brow) layers.push(brow.widget)
  layers.push(rectWidget(M, 190, 150, 8, theme.accent))

  const title = place(
    ctx,
    'title',
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
    ctx,
    'sub',
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
  return { layers: [...layers, ...footer(ctx, theme)], overflow: null }
}

function statementSlide(theme: Theme, slide: Working, ctx: Ctx): Drawn {
  const layers: TdWidgetData[] = [rectWidget(M, 250, 10, 420, theme.accent)]
  const left = M + 70
  const width = CONTENT - 70

  const brow = eyebrow(ctx, theme, slide.kicker, 110)
  if (brow) layers.push(brow.widget)

  const statement = place(
    ctx,
    slide.title ? 'title' : 'callout',
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
    ctx,
    'sub',
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
  return { layers: [...layers, ...footer(ctx, theme)], overflow: null }
}

/** The heading block every content-shaped slide starts with. Returns its floor. */
function heading(ctx: Ctx, theme: Theme, slide: Working, layers: TdWidgetData[], width = CONTENT): number {
  const brow = eyebrow(ctx, theme, slide.kicker, 110, M, width)
  let top = brow ? brow.bottom + 14 : 110
  if (brow) layers.push(brow.widget)

  const title = place(
    ctx,
    'title',
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

function contentSlide(theme: Theme, slide: Working, ctx: Ctx): Drawn {
  const layers: TdWidgetData[] = []
  let top = heading(ctx, theme, slide, layers)

  const sub = place(
    ctx,
    'sub',
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
  const column = bulletColumn(ctx, 'bullets', theme, slide.bullets, { left: M, top, width: CONTENT, height: FOOTER - 40 - calloutHeight - top }, 32, slide.continued)
  layers.push(...column.widgets)

  if (slide.callout) {
    const boxTop = FOOTER - 40 - calloutHeight
    layers.push(rectWidget(M, boxTop, CONTENT, calloutHeight - 16, theme.accent, 8))
    const words = place(
      ctx,
      'callout',
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
  return { layers: [...layers, ...footer(ctx, theme)], overflow: overflowOf(column.rest) }
}

function twoColumnSlide(theme: Theme, slide: Working, ctx: Ctx): Drawn {
  const layers: TdWidgetData[] = []
  const top = heading(ctx, theme, slide, layers)
  const gutter = 80
  const column = Math.round((CONTENT - gutter) / 2)
  const columns: Array<{ key: 'bullets' | 'bulletsRight'; left: number; head: string | null; items: Item[] }> = [
    { key: 'bullets', left: M, head: slide.columnHeads[0] || null, items: slide.bullets },
    { key: 'bulletsRight', left: M + column + gutter, head: slide.columnHeads[1] || null, items: slide.bulletsRight },
  ]

  layers.push(rectWidget(M + column + Math.round(gutter / 2), top, 2, FOOTER - 40 - top, theme.rule))

  const rest: Record<'bullets' | 'bulletsRight', Item[]> = { bullets: [], bulletsRight: [] }
  columns.forEach((side, index) => {
    let y = top
    const head = place(
      ctx,
      `columnHeads[${index}]`,
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
    const placed = bulletColumn(ctx, side.key, theme, side.items, { left: side.left, top: y, width: column, height: FOOTER - 40 - y }, 28, slide.continued)
    layers.push(...placed.widgets)
    rest[side.key] = placed.rest
  })
  return { layers: [...layers, ...footer(ctx, theme)], overflow: overflowOf(rest.bullets, rest.bulletsRight) }
}

function mediaSlide(theme: Theme, slide: Working, ctx: Ctx): Drawn {
  const layers: TdWidgetData[] = []
  const column = Math.round(CONTENT * 0.46)
  const slot = { left: M + column + 70, top: 110, width: CONTENT - column - 70, height: FOOTER - 150 }

  // The picture goes down first so the words are never behind it, and the slot
  // is filled whatever shape the photograph is — see `imageWidget`.
  if (slide.image?.url) {
    layers.push(imageWidget(slot.left, slot.top, slot.width, slot.height, slide.image))
  } else {
    // Marked, so a photo dropped on it in the editor takes its place.
    layers.push({ ...rectWidget(slot.left, slot.top, slot.width, slot.height, theme.rule, 6), role: IMAGE_SLOT_ROLE })
  }

  const brow = eyebrow(ctx, theme, slide.kicker, 130, M, column)
  let top = brow ? brow.bottom + 16 : 130
  if (brow) layers.push(brow.widget)

  const title = place(
    ctx,
    'title',
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
    ctx,
    'sub',
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

  const placed = bulletColumn(ctx, 'bullets', theme, slide.bullets, { left: M, top, width: column, height: FOOTER - 40 - top }, 26, slide.continued)
  layers.push(...placed.widgets)
  return { layers: [...layers, ...footer(ctx, theme)], overflow: overflowOf(placed.rest) }
}

const LAYOUTS: Record<DeckSlide['layout'], (theme: Theme, slide: Working, ctx: Ctx) => Drawn> = {
  title: titleSlide,
  statement: statementSlide,
  content: contentSlide,
  'two-column': twoColumnSlide,
  media: mediaSlide,
}

function working(slide: DeckSlide): Working {
  const base = { ...blankSlide(slide?.layout || 'content'), ...slide }
  return {
    ...base,
    columnHeads: Array.isArray(base.columnHeads) ? base.columnHeads : [],
    bullets: itemsOf(base.bullets),
    bulletsRight: itemsOf(base.bulletsRight),
    continued: false,
  }
}

/**
 * The page after a slide that ran out of room: the same heading with
 * "(continued)", and only the bullets still to place. A media slide carries on
 * as a plain content slide, because the photograph has been seen and its column
 * is the narrow one that ran out; the rest of the list wants the full width.
 * The standfirst, the callout and the speaker notes stay on the first page,
 * where they were written.
 */
function continuation(slide: Working, overflow: Overflow): Working {
  const title = slide.title?.replace(/\s*\(continued\)$/i, '').trim()
  return {
    ...slide,
    layout: slide.layout === 'media' ? 'content' : slide.layout,
    title: title ? `${title} (continued)` : 'Continued',
    sub: null,
    callout: null,
    notes: null,
    image: null,
    bullets: overflow.bullets,
    bulletsRight: overflow.bulletsRight,
    continued: true,
  }
}

function draw(slide: Working, theme: Theme, ctx: Ctx): { layout: TdLayout; overflow: Overflow | null } {
  const layout = LAYOUTS[slide.layout] || contentSlide
  const { layers, overflow } = layout(theme, slide, ctx)
  const name = slide.title?.trim() || slide.kicker?.trim() || 'Slide'
  return { layout: { global: page(name.slice(0, 60), W, H, theme.paper, slide.notes), layers }, overflow }
}

/** Every word of a slide that will not be placed, for the report. */
function noteAll(rec: Recorder, slide: Working, reason: 'page-limit', page: number) {
  if (!slide.continued) {
    rec.note('kicker', slide.kicker ?? '', reason, page)
    rec.note('title', slide.title ?? '', reason, page)
    rec.note('sub', slide.sub ?? '', reason, page)
    rec.note('callout', slide.callout ?? '', reason, page)
    rec.note('notes', slide.notes ?? '', reason, page)
    slide.columnHeads.forEach((head, index) => rec.note(`columnHeads[${index}]`, head, reason, page))
  }
  noteItems(rec, 'bullets', slide.bullets, reason, page)
  noteItems(rec, 'bulletsRight', slide.bulletsRight, reason, page)
}

function noteItems(rec: Recorder, key: string, items: Item[], reason: 'page-limit', page: number) {
  for (const item of items) {
    if (!item.repeat) rec.note(`${key}[${item.at}]`, item.text, reason, page)
    item.sub.forEach((line, k) => rec.note(`${key}[${item.at}].sub[${item.subAt + k}]`, line, reason, page))
  }
}

/**
 * One slide as however many pages it needs, up to `room`. What would have
 * needed more is written down as `page-limit` against the page it would have
 * started. Shared by the deck and by `addPage`, so a slide an AI refine adds
 * behaves exactly like one in a composed deck.
 */
export function composeSlidePages(slide: DeckSlide, theme: Theme, fill: Fill, rec: Recorder, firstPage: number, room: number): TdLayout[] {
  const ctx: Ctx = { fill, rec }
  const pages: TdLayout[] = []
  let current = working(slide)
  for (;;) {
    rec.page = firstPage + pages.length
    const { layout, overflow } = draw(current, theme, ctx)
    pages.push(layout)
    if (!overflow) break
    const next = continuation(current, overflow)
    if (pages.length >= room) {
      noteAll(rec, next, 'page-limit', firstPage + pages.length)
      break
    }
    rec.report.continuedPages++
    current = next
  }
  return pages
}

/** One slide, as a page of the design. Exported so `addPage` can make one. */
export function composeSlide(slide: DeckSlide, theme: Theme, fill: Fill = (text) => text): TdLayout {
  return composeSlidePages(slide, theme, fill, silent(), 0, 1)[0]
}

/**
 * A deck, and what had to give to make it.
 *
 * The slides the outline asked for come first: a continuation page is only
 * made while there is room for every slide still to come, so a long list on
 * slide two never pushes slide forty off the end. Past `maxPages`, whole
 * slides are left out and reported, never half of one.
 */
export function composeDeckWithReport(outline: DeckOutline, options: ComposeOptions = {}): ComposeResult {
  const theme = brandTheme(slideTheme(options.theme), options.brand)
  const fill = fieldFiller(options.brand)
  const cap = pageCap(options.maxPages, MAX_PAGES)
  const rec = recorder()
  const given = Array.isArray(outline?.slides) ? outline.slides : []
  const slides = given.length ? given : [blankSlide('title')]

  const layouts: TdLayout[] = []
  slides.forEach((slide, index) => {
    rec.source = index
    rec.page = layouts.length
    if (layouts.length >= cap) {
      noteAll(rec, working(slide), 'page-limit', layouts.length)
      return
    }
    // Room for this slide's continuations: what is left once every slide after
    // it has a page of its own.
    const later = Math.max(0, slides.length - index - 1)
    const room = Math.max(1, cap - layouts.length - later)
    layouts.push(...composeSlidePages(slide, theme, fill, rec, layouts.length, room))
  })

  const doc: DesignDocument = { format: 'design-studio/v1', title: String(outline?.title || 'Untitled deck'), layouts }
  // The kit goes on last, over a finished deck, so that every page's footer
  // reads the school's name and the theme's one accent becomes the school's
  // first colour — the same pass Apply brand makes in the editor. The type is
  // already in the kit's fonts (see `brandTheme`), so it measures what it sets.
  return { document: options.brand ? applyBrand(doc, options.brand) : doc, report: rec.report }
}

export function composeDeck(outline: DeckOutline, options: ComposeOptions = {}): DesignDocument {
  return composeDeckWithReport(outline, options).document
}
