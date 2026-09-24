/**
 * Reads back where the browser actually put every word of text.
 *
 * The store knows a text widget's box and its font size. It does not know where
 * the words wrapped, and that is precisely what the text layer in the PDF needs
 * — a heading that reads as three lines on the page has to be three lines in
 * the file, in the right places, or selecting one of them highlights the wrong
 * part of the picture and a reader gets the words run together.
 *
 * Nothing here reimplements line breaking. The page is already on screen and
 * already laid out, so the measurements come from asking the browser, one
 * character at a time, which rectangle it ended up in. Characters that share a
 * rectangle edge are on the same line; within a line they are cut into words.
 *
 * Words rather than whole lines because the invisible text is set in a font
 * whose characters are all declared the same width — see pdfTextLayer.ts — so
 * positions drift across a long run even though its two ends are exact. Pinning
 * each word where it really is keeps that drift to the length of one word,
 * which is what stops a text extractor inventing line breaks in the middle of a
 * sentence.
 *
 * Everything comes back in page coordinates — design pixels, y downwards from
 * the top-left of the page — and with the widget's own rotation taken off, so
 * the caller has plain unrotated geometry plus an angle to apply.
 */

export type MeasuredWord = {
  /** The word, including the space after it where the browser drew one. */
  text: string
  left: number
  top: number
  width: number
  height: number
}

export type MeasuredLine = {
  /** Text stacked downwards rather than running across, for vertical writing. */
  vertical: boolean
  words: MeasuredWord[]
}

export type MeasuredText = {
  /** The widget's own box, unrotated, in page coordinates. */
  left: number
  top: number
  width: number
  height: number
  lines: MeasuredLine[]
}

/**
 * Two characters belong to the same line when their boxes start within this
 * fraction of a line height of each other. Generous, because a line can mix
 * sizes — a superscript, an inline span with its own styling — and mean, so
 * two tightly leaded lines are not run together.
 */
const SAME_LINE = 0.4

/** A character smaller than this contributes nothing but noise to a word box. */
const MIN_GLYPH = 0.01

/**
 * Measures every text widget currently on the canvas.
 *
 * Returns a map keyed by widget uuid; a widget that is not on screen, or holds
 * nothing, simply will not be in it, and the caller falls back to the store's
 * own geometry.
 */
export function measureTextOnCanvas(canvasId: string, uuids: readonly string[]): Map<string, MeasuredText> {
  const measured = new Map<string, MeasuredText>()
  const canvas = document.getElementById(canvasId)
  if (!canvas) return measured

  const canvasRect = canvas.getBoundingClientRect()
  // The canvas carries the editor's zoom as a CSS transform, so every rectangle
  // read out of it comes back multiplied by that zoom. Divide it back out and
  // the numbers are the design's own pixels, whatever the person was zoomed to.
  const zoom = canvasRect.width / canvas.offsetWidth || 1

  for (const uuid of uuids) {
    const element = document.getElementById(uuid)
    if (!element) continue
    const text = measureWidget(element, canvasRect, zoom)
    if (text) measured.set(uuid, text)
  }

  return measured
}

function measureWidget(element: HTMLElement, canvasRect: DOMRect, zoom: number): MeasuredText | null {
  // A text widget with effects renders the same words several times over — one
  // layer per effect, stacked exactly — and measuring all of them would put the
  // text into the file once per layer. The unadorned copy is the last one.
  const layers = Array.from(element.querySelectorAll<HTMLElement>('.edit-text'))
  const container = layers.find((node) => !node.classList.contains('effect-text')) || layers[layers.length - 1]
  if (!container) return null

  // Measure the element as it was laid out rather than as it is displayed. The
  // rotation is put back by the caller, from the angle in the store, and taking
  // it off here means the word boxes are the real ones instead of the bounding
  // boxes of turned ones. Set and restored without yielding, so nothing paints
  // in between and there is nothing to see.
  const held = element.style.transform
  element.style.transform = 'none'
  try {
    const box = element.getBoundingClientRect()
    const vertical = getComputedStyle(container).writingMode.startsWith('vertical')

    const toPage = (rect: { left: number; top: number; width: number; height: number }) => ({
      left: (rect.left - canvasRect.left) / zoom,
      top: (rect.top - canvasRect.top) / zoom,
      width: rect.width / zoom,
      height: rect.height / zoom,
    })

    const lines = collectLines(container, vertical).map((line) => ({
      vertical,
      words: line.map((word) => ({ ...toPage(word), text: word.text })),
    }))

    return { ...toPage(box), lines: lines.filter((line) => line.words.length > 0) }
  } finally {
    element.style.transform = held
  }
}

type Glyph = { char: string; left: number; top: number; right: number; bottom: number }
type RawWord = { text: string; left: number; top: number; width: number; height: number }

/**
 * Walks the text one character at a time, groups the characters into lines and
 * the lines into words.
 *
 * A Range over a single character reports the rectangle that character occupies
 * on screen, which is the only way to find out where the browser decided to
 * wrap. It is a lot of calls, but none of them touches the DOM, so the layout
 * is calculated once and every read after that comes out of the same cache.
 */
function collectLines(container: HTMLElement, vertical: boolean): RawWord[][] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  const lines: Glyph[][] = []

  let node = walker.nextNode() as Text | null
  while (node) {
    const value = node.data
    for (let index = 0; index < value.length; index++) {
      range.setStart(node, index)
      range.setEnd(node, index + 1)
      const rect = range.getBoundingClientRect()
      // The space a line wraps at is collapsed away and has no box at all;
      // keeping it would put a stray character at the origin of the page. The
      // break it stood for is not lost — the next character starts a new line.
      if (rect.width < MIN_GLYPH && rect.height < MIN_GLYPH) continue

      const glyph: Glyph = { char: value[index], left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
      const line = lines[lines.length - 1]
      const previous = line?.[line.length - 1]
      const start = vertical ? rect.left : rect.top
      const extent = vertical ? rect.width : rect.height

      if (previous && Math.abs(start - (vertical ? previous.left : previous.top)) <= extent * SAME_LINE) {
        line.push(glyph)
      } else {
        lines.push([glyph])
      }
    }
    node = walker.nextNode() as Text | null
  }

  return lines.map(toWords).filter((words) => words.length > 0)
}

/**
 * Cuts a line into words, each keeping the space that follows it.
 *
 * The space rides along rather than being dropped because a reader would
 * otherwise have to infer it from the gap between two boxes, and it gets that
 * wrong often enough to run words together. Carrying it makes the extracted
 * text right by construction.
 */
function toWords(line: Glyph[]): RawWord[] {
  const words: Glyph[][] = []
  let ended = false

  for (const glyph of line) {
    const blank = !glyph.char.trim()
    if (words.length === 0 || (ended && !blank)) words.push([])
    words[words.length - 1].push(glyph)
    ended = blank
  }

  return words
    .map((glyphs) => {
      const left = Math.min(...glyphs.map((g) => g.left))
      const top = Math.min(...glyphs.map((g) => g.top))
      return {
        text: glyphs.map((g) => g.char).join(''),
        left,
        top,
        width: Math.max(...glyphs.map((g) => g.right)) - left,
        height: Math.max(...glyphs.map((g) => g.bottom)) - top,
      }
    })
    .filter((word) => word.text.trim().length > 0 && word.width > 0)
}
