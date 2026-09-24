/**
 * The check before a download: what in a design will not come out the way it
 * looks in the editor, or will not reach somebody who cannot see it.
 *
 * Four things, each one a question a colleague would ask on seeing the page:
 *
 * - `overflow`: part of the text is off the page, a word is wider than its box,
 *   or there is more text than its box holds.
 * - `tiny-text`: too small to read where it is going. See `minimumSize`.
 * - `low-contrast`: the text against what is behind it, by WCAG's ratio, with
 *   the target for its size. Over a photograph or a gradient there is no one
 *   colour to measure against, and the check says nothing rather than guess.
 * - `missing-alt`: a photo nobody described or marked decorative.
 *
 * Pure: layouts in, a list out. Words are measured with the same estimate the
 * composer fits them with (compose/textFit.ts), which is deliberately a few per
 * cent wide, so the thresholds below leave room for that rather than flag a
 * line that is only too long on paper.
 */
import { contrastRatio, composite, contrastTarget, pageDpi } from '@/common/methods/contrast'
import { DESIGN_DPI } from '@/common/methods/export/dpi'
import { markupToText } from '@/compose/markup'
import { measureText, wrapText, type TextMetrics } from '@/compose/textFit'
import { surfaceColors } from '@/store/widget/brandCore'
import type { TdLayout, TdWidgetData, TPageState } from '@/store/types'
import { altTextOf, isHidden } from './structure'

export type DesignIssueKind = 'overflow' | 'tiny-text' | 'low-contrast' | 'missing-alt'

/** One thing to look at, on one page, on one widget. `page` is 0-based. */
export type DesignIssue = {
  page: number
  widgetId: string
  kind: DesignIssueKind
  message: string
}

export type CheckOptions = {
  /**
   * Leave out the missing-alt check. A PNG carries no alt text at all, so
   * asking for it before one is pointless.
   */
  skipAlt?: boolean
}

/**
 * The smallest type worth putting on this page, in design pixels.
 *
 * Printed (a page the shape of a sheet of paper, drawn at 150 DPI): 12pt, which
 * is where the RNIB's Clear Print guidance, the one schools and councils are
 * held to for paper, puts its floor. 12pt at 150 DPI is 25px.
 *
 * On a screen (a slide, or anything else not paper-shaped): 20px on a page
 * 1080 high, scaled with the page. That is 10pt on PowerPoint's 7.5-inch
 * slide. Presentation guides ask for 18pt for body text, which is 36px here,
 * but the studio's own themes set bullets at 26 to 32px, and a check that
 * flags every slide stops being read. This is aimed at the text nobody in the
 * room can read at all: a caption pasted in at 14px, a footnote at 12.
 */
export function minimumSize(page: Pick<TPageState, 'width' | 'height'>): number {
  if (pageDpi(page as { width: number; height: number }) === DESIGN_DPI) return Math.round((12 / 72) * DESIGN_DPI)
  const short = Math.min(Number(page.width) || 1080, Number(page.height) || 1080)
  return Math.max(10, Math.round((20 * short) / 1080))
}

const num = (value: unknown) => Number(value) || 0

function isBold(widget: TdWidgetData): boolean {
  const weight = (widget as any).fontWeight
  return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600
}

function metricsOf(widget: TdWidgetData): TextMetrics {
  return {
    fontFamily: String((widget as any).fontFamily || (widget as any).fontClass?.value || ''),
    fontSize: num((widget as any).fontSize) || 24,
    lineHeight: num((widget as any).lineHeight) || 1.5,
    letterSpacing: num((widget as any).letterSpacing),
    bold: isBold(widget),
  }
}

/** Widgets in a group that is hidden are hidden too, and a group draws nothing itself. */
function visibleText(layers: TdWidgetData[]): Array<{ widget: TdWidgetData; index: number }> {
  const hiddenGroups = new Set(layers.filter((layer) => layer.isContainer && layer.hidden).map((layer) => layer.uuid))
  return layers.map((widget, index) => ({ widget, index })).filter(({ widget }) => !widget.isContainer && !isHidden(widget) && !(widget.parent && hiddenGroups.has(widget.parent)))
}

function overflowOf(widget: TdWidgetData, page: TPageState): string | null {
  const words = markupToText(String(widget.text ?? ''))
  if (!words.trim()) return null
  // Turned or set vertically, the box is not where the words are; leave it.
  const rotated = num(widget.rotate) || /rotate\(\s*-?[1-9]/.test(String(widget.transform || ''))
  if (rotated || String((widget as any).writingMode || '').startsWith('vertical')) return null

  const style = metricsOf(widget)
  const width = num(widget.width)
  const lineHeight = style.fontSize * style.lineHeight

  // The estimate runs six per cent wide on purpose, so a word has to beat the
  // box by more than that to be called too long.
  for (const word of words.split(/\s+/)) {
    if (word && measureText(word, style) > width * 1.08 + 2) return `“${word.length > 24 ? `${word.slice(0, 24)}…` : word}” is too long for its box and will spill out of it.`
  }

  const lines = wrapText(words, width, style)
  const widest = lines.reduce((most, line) => Math.max(most, measureText(line, style) / 1.06), 0)
  const tall = lines.length * lineHeight
  // The editor grows a box to fit what is typed, so a box that is short of its
  // text by a line and a half has been squashed, not estimated wrong.
  if (tall > num(widget.height) + lineHeight * 1.5) return 'There is more text than this box holds. Make the box bigger or cut some words.'

  const align = String((widget as any).textAlign || 'left')
  const left = align === 'center' ? num(widget.left) + (width - widest) / 2 : align === 'right' ? num(widget.left) + width - widest : num(widget.left)
  const top = num(widget.top)
  const bottom = top + Math.min(tall, Math.max(num(widget.height), lineHeight))
  const slack = 2
  if (left < -slack || left + widest > num(page.width) + slack || top < -slack || bottom > num(page.height) + slack) return 'Part of this text is off the edge of the page.'
  return null
}

function tinyOf(widget: TdWidgetData, page: TPageState): string | null {
  const size = num((widget as any).fontSize)
  const floor = minimumSize(page)
  if (!size || size >= floor) return null
  if (pageDpi(page) === DESIGN_DPI) {
    const points = Math.round((size / DESIGN_DPI) * 72)
    return `This text prints at about ${points}pt, which is hard to read. Make it at least 12pt (${floor}px).`
  }
  return `This text is too small to read on a screen. Make it at least ${floor}px.`
}

function contrastOf(widget: TdWidgetData, page: TPageState, surface: string | null): string | null {
  // A text effect (an outline, a shadow, a second fill) changes what the words
  // are read against, and the fill alone would be the wrong answer.
  const effects = (widget as any).textEffects
  if (!surface || (Array.isArray(effects) && effects.length)) return null
  const color = String((widget as any).color || '')
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)) return null
  const ratio = contrastRatio(composite(color, surface), surface)
  const target = contrastTarget(num((widget as any).fontSize), isBold(widget), page)
  if (ratio >= target) return null
  return `This text is hard to read against what is behind it. The contrast is ${Math.floor(ratio * 10) / 10}:1 and needs to be ${target}:1.`
}

/** Every issue in a design, page by page, in the order the page is stacked. */
export function checkLayouts(layouts: readonly TdLayout[], options: CheckOptions = {}): DesignIssue[] {
  const issues: DesignIssue[] = []
  layouts.forEach((layout, pageIndex) => {
    const page = layout.global as TPageState
    const layers = (layout.layers || []) as TdWidgetData[]
    const surfaceOf = surfaceColors(layers, page)
    for (const { widget, index } of visibleText(layers)) {
      const add = (kind: DesignIssueKind, message: string | null) => {
        if (message) issues.push({ page: pageIndex, widgetId: String(widget.uuid), kind, message })
      }
      if (widget.type === 'w-text') {
        if (!markupToText(String(widget.text ?? '')).trim()) continue
        add('overflow', overflowOf(widget, page))
        add('tiny-text', tinyOf(widget, page))
        add('low-contrast', contrastOf(widget, page, surfaceOf(index)))
      } else if (widget.type === 'w-image' && !options.skipAlt && altTextOf(widget).state === 'missing') {
        add('missing-alt', 'This picture has no alt text. Describe it, or mark it decorative.')
      }
    }
  })
  return issues
}
