/**
 * What a design means, as opposed to what it looks like.
 *
 * A page of the editor is a bag of absolutely positioned boxes in stacking
 * order. That is enough to draw it and nothing like enough to read it aloud: a
 * screen reader needs to know which box is the heading, which order the boxes
 * are meant to be taken in, and what the pictures are of. None of that is
 * recorded anywhere, because nobody laying out a poster is asked for it.
 *
 * So it is inferred here, once, and the PDF export, the PowerPoint export and
 * the check before a download all read the same answer. Otherwise the check
 * would be reporting on a document different from the one that gets published.
 *
 * The inferences are deliberately conservative and each one is explained where
 * it is made. Where a guess would be a coin toss, the answer is "unknown" and
 * the person is asked, which is the whole point of the alt-text field.
 */
import { readRotation } from '@/common/methods/export/utils'
import { markupToText } from '@/compose/markup'
import type { TdWidgetData } from '@/store/types'

/* ------------------------------------------------------------ reading order */

const num = (value: unknown): number => Number(value) || 0

/**
 * A group is a container for the elements under it, which appear in `layers`
 * in their own right. Placing both would say everything twice.
 */
export const isContainerOnly = (widget: TdWidgetData): boolean => String(widget.type) === 'w-group'

/**
 * Sorts a page into the order a sighted person would take it: across, then
 * down.
 *
 * Stacking order is no use for this — it says which element is in front, and
 * the front element on a poster is usually the last one someone dragged. Two
 * elements are treated as being on the same line when one's midpoint falls
 * inside the other's vertical span, which keeps a headline and the logo beside
 * it together instead of interleaving them with the paragraph below.
 *
 * Rows are built greedily from a top-down pass rather than by comparing pairs,
 * because "roughly level with" is not transitive and a sort comparator built on
 * it gives a different answer depending on the starting order.
 */
export function readingOrder(layers: readonly TdWidgetData[]): TdWidgetData[] {
  const items = layers.filter((w) => w && !isContainerOnly(w))
  const byTop = items.slice().sort((a, b) => num(a.top) - num(b.top) || num(a.left) - num(b.left))

  const rows: { bottom: number; items: TdWidgetData[] }[] = []
  for (const widget of byTop) {
    const top = num(widget.top)
    const middle = top + num(widget.height) / 2
    const row = rows[rows.length - 1]
    if (row && middle < row.bottom) {
      row.items.push(widget)
      row.bottom = Math.max(row.bottom, top + num(widget.height))
    } else {
      rows.push({ bottom: top + num(widget.height), items: [widget] })
    }
  }

  return rows.flatMap((row) => row.items.sort((a, b) => num(a.left) - num(b.left)))
}

/* --------------------------------------------------------------- headings */

export type StructureTag = 'H1' | 'H2' | 'H3' | 'P'

export const isTextWidget = (widget: TdWidgetData): boolean => String(widget.type) === 'w-text'

/** The words in a text widget, with the contenteditable markup taken off. */
// Read by the compose entry's parser rather than the browser's, so it runs in
// a test with no DOM and never loads an <img> somebody pasted into a text box.
export const textOf = (widget: TdWidgetData): string => markupToText(String((widget as any).text ?? '')).trim()

/**
 * Works out which text on a page is a heading, and at what level.
 *
 * Nothing in the design says so, but the page shows it: a heading is the type
 * that is bigger than the type most of the words are set in. So the body size
 * is found first — the size carrying the most characters, not the most boxes,
 * because three words of caption should not outvote four paragraphs — and every
 * distinct size above it becomes a level, largest first.
 *
 * The levels stop at H3. A poster with four sizes of heading and no body text
 * has a design problem, not a structure that is worth reproducing faithfully.
 * A page holding a single piece of text is that page's title, whatever size it
 * is set at.
 */
export function headingLevels(layers: readonly TdWidgetData[]): Map<string, StructureTag> {
  const tags = new Map<string, StructureTag>()
  const texts = layers.filter((w) => isTextWidget(w) && textOf(w))
  if (texts.length === 0) return tags

  if (texts.length === 1) {
    tags.set(String(texts[0].uuid), 'H1')
    return tags
  }

  const weight = new Map<number, number>()
  for (const widget of texts) {
    const size = Math.round(num((widget as any).fontSize))
    weight.set(size, (weight.get(size) || 0) + textOf(widget).length)
  }

  let bodySize = 0
  let bodyWeight = -1
  for (const [size, chars] of weight) {
    // Ties go to the smaller size: body text is the floor of a design, and
    // calling the larger of two equally-weighted sizes "body" would leave the
    // page with no headings at all.
    if (chars > bodyWeight || (chars === bodyWeight && size < bodySize)) {
      bodyWeight = chars
      bodySize = size
    }
  }

  const levels = Array.from(weight.keys())
    .filter((size) => size > bodySize)
    .sort((a, b) => b - a)

  for (const widget of texts) {
    const size = Math.round(num((widget as any).fontSize))
    const rank = levels.indexOf(size)
    tags.set(String(widget.uuid), rank === -1 ? 'P' : (['H1', 'H2', 'H3'][Math.min(rank, 2)] as StructureTag))
  }
  return tags
}

/* ------------------------------------------------------------- alternatives */

export type AltText =
  /** Has a description, either written or derivable. */
  | { state: 'described'; text: string }
  /** Deliberately skipped: it carries no information a reader would miss. */
  | { state: 'decorative' }
  /** Nobody has said what it is, and nothing here can work it out. */
  | { state: 'missing' }

/**
 * What a screen reader should say about an element that is not text.
 *
 * Only pictures the person chose can be described by the person, so only those
 * are ever reported as missing. A QR code describes itself — it is a link, and
 * the link is right there in the widget — and a shape from the sticker library
 * is scenery until somebody says otherwise, which is what `decorative` is for
 * and what "an image of a swoosh" would be worse than.
 */
export function altTextOf(widget: TdWidgetData): AltText {
  const data = widget as Record<string, any>
  const written = typeof data.alt === 'string' ? data.alt.trim() : ''
  if (written) return { state: 'described', text: written }
  if (data.decorative) return { state: 'decorative' }

  switch (String(widget.type)) {
    case 'w-image':
      return { state: 'missing' }
    case 'w-qrcode': {
      const target = String(data.value || data.url || '').trim()
      return { state: 'described', text: target ? `QR code linking to ${target}` : 'QR code' }
    }
    default:
      // Shapes, lines and stickers. Decorative by default; the alt box on the
      // panel is there for the ones that are not.
      return { state: 'decorative' }
  }
}

/** Elements a reader needs described. Text is excluded: it describes itself. */
export const isPictorial = (widget: TdWidgetData): boolean => ['w-image', 'w-svg', 'w-qrcode'].includes(String(widget.type))

/* ------------------------------------------------------------------ geometry */

export type Box = { left: number; top: number; width: number; height: number }

export const boxOf = (widget: TdWidgetData): Box => ({
  left: num(widget.left),
  top: num(widget.top),
  width: num(widget.width),
  height: num(widget.height),
})

export const rotationOf = (widget: TdWidgetData): number => readRotation(widget as Record<string, any>)

/** True when an element is invisible and so has nothing to say to anybody. */
export function isHidden(widget: TdWidgetData): boolean {
  if (widget.hidden) return true
  const opacity = (widget as any).opacity
  return opacity !== undefined && Number(opacity) === 0
}
