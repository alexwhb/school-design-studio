/**
 * A page as a document rather than a picture.
 *
 * This is the bridge between the two halves of the accessible export: what the
 * design means (from common/methods/accessibility) and where it sits on the
 * sheet (measured off the live page). The PDF writer takes it and needs to make
 * no judgements of its own.
 *
 * Geometry is finished by the time it leaves here — every line already carries
 * the place its baseline starts and the direction it runs in, with the widget's
 * rotation folded in — so the exporter's only remaining job is design pixels to
 * points and the flip from a screen's downward y to a page's upward one.
 */
import { altTextOf, boxOf, headingLevels, isHidden, isPictorial, isTextWidget, readingOrder, rotationOf, textOf, type Box, type StructureTag } from '@/common/methods/accessibility/structure'
import type { MeasuredText } from './measureText'
import type { TdWidgetData } from '@/store/types'

/** One stretch of text placed on the page: a word, or a whole line of one. */
export type ContentRun = {
  text: string
  /** Where the baseline starts, in page coordinates: design pixels, y down. */
  x: number
  y: number
  /** How far the run goes along its baseline, in design pixels. */
  length: number
  /** Em size, in design pixels. */
  size: number
  /** Which way the baseline runs: degrees clockwise from left-to-right. */
  angle: number
}

export type ContentText = {
  kind: 'text'
  uuid: string
  tag: StructureTag
  runs: ContentRun[]
}

export type ContentFigure = {
  kind: 'figure'
  uuid: string
  alt: string
  /** Where to put the tag, as an upright box around the element. */
  box: Box
}

export type PageContent = {
  items: (ContentText | ContentFigure)[]
}

/**
 * Where the baseline sits inside a measured word box.
 *
 * A Range's rectangle spans the font's ascent and descent, and for the faces in
 * the editor the baseline falls about four fifths of the way down it. Only the
 * vertical placement of invisible text depends on this, so an approximation
 * costs a couple of points of selection alignment and nothing else.
 */
const BASELINE = 0.8

/** Default leading, matching what the text widget applies when none is set. */
const DEFAULT_LINE_HEIGHT = 1.5

/**
 * Text a screen reader should be given for a picture nobody described.
 *
 * The alternative is leaving the picture out of the structure altogether, which
 * is what the export did before any of this existed: silence, and no way for
 * the person listening to know there was anything there. Saying that a picture
 * is present and undescribed is worse than a good description and better than
 * pretending it is not there — and the check in the editor exists so it should
 * never get this far.
 */
export const UNDESCRIBED = 'Image with no description'

const num = (value: unknown): number => Number(value) || 0

/** Turns a point about a centre, clockwise, the way a CSS rotation does. */
function turn(x: number, y: number, centreX: number, centreY: number, degrees: number): { x: number; y: number } {
  if (!degrees) return { x, y }
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = x - centreX
  const dy = y - centreY
  return { x: centreX + dx * cos - dy * sin, y: centreY + dx * sin + dy * cos }
}

/**
 * The placed text of a widget, from the browser's own layout where we have it.
 *
 * Each measured word becomes its own run, pinned where the browser put it.
 * Without a measurement — the page was never mounted, or the element has since
 * gone — the text is laid out from the store instead: one run per hard break,
 * stacked down the box at the widget's leading. Wrapping is lost, so a
 * paragraph that shows as four lines becomes one long run. It still reads
 * correctly and in the right order; only the selection rectangle suffers.
 */
function runsFor(widget: TdWidgetData, measured?: MeasuredText): ContentRun[] {
  const data = widget as Record<string, any>
  const size = num(data.fontSize)
  const rotate = rotationOf(widget)

  if (measured && measured.lines.length) {
    const centreX = measured.left + measured.width / 2
    const centreY = measured.top + measured.height / 2
    const runs: ContentRun[] = []

    for (const line of measured.lines) {
      for (const word of line.words) {
        // Vertical writing turns the run on its side; the extra quarter turn
        // rides on top of whatever the widget itself is rotated by.
        const start = line.vertical ? { x: word.left + word.width * BASELINE, y: word.top } : { x: word.left, y: word.top + word.height * BASELINE }
        const placed = turn(start.x, start.y, centreX, centreY, rotate)
        runs.push({
          text: word.text,
          x: placed.x,
          y: placed.y,
          length: line.vertical ? word.height : word.width,
          size: size || word.height / 1.2,
          angle: rotate + (line.vertical ? 90 : 0),
        })
      }
    }
    return runs
  }

  const box = boxOf(widget)
  const leading = size * (num(data.lineHeight) || DEFAULT_LINE_HEIGHT)
  const centreX = box.left + box.width / 2
  const centreY = box.top + box.height / 2

  return textOf(widget)
    .split('\n')
    .map((text, index) => ({ text: text.trim(), index }))
    .filter((line) => line.text.length > 0)
    .map(({ text, index }) => {
      const placed = turn(box.left, box.top + leading * index + size * BASELINE, centreX, centreY, rotate)
      return { text, x: placed.x, y: placed.y, length: box.width, size, angle: rotate }
    })
}

/**
 * Builds the readable form of one page.
 *
 * Order is reading order, not stacking order, because that is the order it will
 * be read aloud in. Decorative elements are left out entirely: they become part
 * of the page's picture, which the exporter marks as an artifact, and a reader
 * skips the lot.
 */
export function buildPageContent(layers: readonly TdWidgetData[], measured?: Map<string, MeasuredText>): PageContent {
  const tags = headingLevels(layers)
  const items: PageContent['items'] = []

  for (const widget of readingOrder(layers)) {
    if (isHidden(widget)) continue
    const uuid = String(widget.uuid)

    if (isTextWidget(widget)) {
      if (!textOf(widget)) continue
      const runs = runsFor(widget, measured?.get(uuid))
      if (runs.length) items.push({ kind: 'text', uuid, tag: tags.get(uuid) || 'P', runs })
      continue
    }

    if (!isPictorial(widget)) continue
    const alt = altTextOf(widget)
    if (alt.state === 'decorative') continue
    items.push({ kind: 'figure', uuid, alt: alt.state === 'described' ? alt.text : UNDESCRIBED, box: boxOf(widget) })
  }

  return { items }
}
