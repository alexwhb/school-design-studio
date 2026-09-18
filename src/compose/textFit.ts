/**
 * Making a line of somebody else's words fit a box that was drawn for other
 * words, without a browser to measure with.
 *
 * The editor lets a text box grow with its content, which is right when a
 * person is watching: they see it happen and move something. Composing is the
 * opposite case — the text arrives from a model, nobody is watching, and a
 * heading two words longer than the designer's silently runs off the page and
 * into the export. So every box composed here is measured against its own size
 * first, and nothing is ever placed that does not fit.
 *
 * The measurement is an estimate, because there is no font engine here. Widths
 * are per-character, in fractions of the font size, taken from the shape of the
 * letters rather than from any one family, then scaled by a factor per family —
 * Anton and Bebas Neue are far narrower than Inter at the same size, and
 * treating them alike would either waste half a poster or overflow it. It is
 * deliberately a few per cent pessimistic: guessing a line is wider than it
 * turns out to be costs a slightly smaller heading, and guessing narrow costs a
 * heading off the edge of the page.
 */

/** Advance widths in ems, by character, for an unremarkable sans face. */
const NARROW = new Set([...`iljItf.,;:'"|!\`()[]{}-/\\ `])
const WIDE = new Set([...'mwMW@%'])
const CAPS = new Set([...'ABCDEFGHKNOPQRSUVXYZ0123456789$&#'])

function advance(character: string): number {
  if (character === ' ') return 0.28
  if (character === 'i' || character === 'l' || character === 'j' || character === '.' || character === ',') return 0.25
  if (NARROW.has(character)) return 0.31
  if (WIDE.has(character)) return 0.86
  if (CAPS.has(character)) return 0.65
  return 0.53
}

/**
 * Families whose every glyph is the same width, and what that width is.
 *
 * A per-character table cannot describe a monospace face at all: it makes `i`
 * narrow and `M` wide, and in these they are both exactly 0.6em. Measured in
 * the browser rather than guessed — `iiiillll` came out twice as wide as this
 * file thought, which is the sort of error that puts a heading off a page.
 */
const MONOSPACE: Record<string, number> = {
  'IBM Plex Mono': 0.6,
  'JetBrains Mono': 0.6,
}

/**
 * How much narrower or wider a family runs than the table above.
 *
 * Not guessed. Each of these is the old estimate multiplied by the worst error
 * it made when checked against the browser's own `measureText`, over a dozen
 * strings a school actually writes — a heading, a date, a sentence of prose —
 * at both weights. Before that pass every family was under-measured, Anton by
 * fourteen per cent, which is how a nine-letter heading came out on one line
 * here and two in the browser, with the arrow underneath it disappearing
 * behind the second.
 *
 * Re-derive them the same way if a family is added: set the factor to 1, print
 * `browser width / measureText(...)` for those strings, and use the worst.
 */
const FAMILY_FACTOR: Record<string, number> = {
  Anton: 0.888,
  'Bebas Neue': 0.746,
  Oswald: 0.878,
  Archivo: 1.05,
  Inter: 1.079,
  Roboto: 1.003,
  'Open Sans': 1.081,
  Lato: 1.0,
  Montserrat: 1.15,
  Poppins: 1.144,
  Nunito: 1.028,
  Quicksand: 1.049,
  Fredoka: 0.999,
  Merriweather: 1.087,
  'Playfair Display': 1.009,
  Lora: 1.055,
  'Libre Baskerville': 1.179,
  'Source Serif 4': 1.073,
  Spectral: 1.019,
  'DM Serif Display': 0.974,
  'Space Grotesk': 1.076,
  Karla: 1.032,
  Caveat: 0.768,
  Pacifico: 1.139,
}

/**
 * A safety margin on top of the calibration, because being wrong in one
 * direction is much worse than the other. Six per cent is a heading a couple of
 * points smaller than it had to be, which nobody notices; the other way is a
 * word off the edge of something already printed.
 */
const PESSIMISM = 1.06

export type TextMetrics = {
  fontFamily?: string
  fontSize: number
  /** Multiplier, as the widget stores it. */
  lineHeight: number
  /** Design pixels added between characters, as the widget stores it. */
  letterSpacing?: number
  bold?: boolean
}

export function measureText(text: string, style: TextMetrics): number {
  const fixed = style.fontFamily ? MONOSPACE[style.fontFamily] : undefined
  const factor = (style.fontFamily && FAMILY_FACTOR[style.fontFamily]) || 1
  let ems = 0
  // A monospace face is exact, so it needs no factor and no pessimism beyond
  // the letter spacing — every character is the same width by definition.
  if (fixed !== undefined) {
    for (const _ of text) ems += fixed
    return ems * style.fontSize + (style.letterSpacing || 0) * text.length
  }
  for (const character of text) ems += advance(character)
  const bold = style.bold ? 1.03 : 1
  return (ems * style.fontSize * factor * bold + (style.letterSpacing || 0) * text.length) * PESSIMISM
}

/**
 * The text broken at the spaces so that no line is wider than `width`.
 *
 * A word longer than the whole box is not broken up: hyphenating a school's
 * name in the middle looks like a bug, and the shrink step below is the answer
 * to a word that will not fit.
 */
export function wrapText(text: string, width: number, style: TextMetrics): string[] {
  const lines: string[] = []
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (line && measureText(candidate, style) > width) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    lines.push(line)
  }
  return lines
}

export type FitOptions = {
  width: number
  height: number
  /** How small the type may get before the words are cut instead. */
  minFontSize: number
  /** Hard ceiling on lines, whatever the height says. 0 is no ceiling. */
  maxLines?: number
}

export type FitResult = {
  text: string
  fontSize: number
  lines: string[]
  /** True when words had to be dropped to make it fit. */
  truncated: boolean
}

/** How many lines of this size fit the box. */
function linesThatFit(height: number, fontSize: number, lineHeight: number): number {
  return Math.max(1, Math.floor(height / (fontSize * lineHeight) + 0.08))
}

/**
 * Shrinks, then cuts.
 *
 * The type comes down a point at a time to the floor, which is where a poster's
 * headline stops being a headline. Only then are words dropped, and the cut is
 * marked with an ellipsis so it reads as deliberate rather than as a bug.
 */
export function fitText(text: string, style: TextMetrics, options: FitOptions): FitResult {
  const words = String(text || '').trim()
  if (!words) return { text: '', fontSize: style.fontSize, lines: [], truncated: false }

  const scaleTo = (size: number): TextMetrics => ({ ...style, fontSize: size, letterSpacing: (style.letterSpacing || 0) * (size / style.fontSize) })
  const widest = (lines: string[], scaled: TextMetrics) => lines.reduce((most, line) => Math.max(most, measureText(line, scaled)), 0)

  const floor = Math.max(6, Math.min(options.minFontSize, style.fontSize))
  for (let size = style.fontSize; size >= floor; size -= 1) {
    const scaled = scaleTo(size)
    const lines = wrapText(words, options.width, scaled)
    const room = Math.min(linesThatFit(options.height, size, style.lineHeight), options.maxLines || Number.MAX_SAFE_INTEGER)
    // Both, and the width is the one that is easy to forget. `wrapText` breaks
    // at spaces and nowhere else, so a single long word — "Gymnasium" on a
    // direction sign — comes back as one line at any size and passes a check
    // that only counts lines. The browser then wraps it mid-word, the box grows
    // downwards, and whatever was laid out under it disappears behind the
    // second line. That is what happened to the arrow.
    if (lines.length <= room && widest(lines, scaled) <= options.width) return { text: words, fontSize: size, lines, truncated: false }
  }

  // At the floor and still too big. Cut, and say so with an ellipsis.
  const scaled = scaleTo(floor)
  const room = Math.min(linesThatFit(options.height, floor, style.lineHeight), options.maxLines || Number.MAX_SAFE_INTEGER)
  const lines = wrapText(words, options.width, scaled).slice(0, room)

  // Whole words first, because half a word reads as a mistake rather than as a
  // cut. A single word too wide for the box has no words to drop, so that one
  // is cut by characters — the alternative is an empty box.
  while (lines.length && measureText(`${lines[lines.length - 1]}…`, scaled) > options.width) {
    const last = lines[lines.length - 1]
    const parts = last.split(' ')
    if (parts.length > 1) {
      parts.pop()
      lines[lines.length - 1] = parts.join(' ')
      continue
    }
    if (last.length <= 1) {
      lines.pop()
      continue
    }
    lines[lines.length - 1] = last.slice(0, -1)
  }
  if (lines.length === 0) return { text: '…', fontSize: floor, lines: ['…'], truncated: true }
  lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[\s,;:.]+$/, '')}…`
  return { text: lines.join(' '), fontSize: floor, lines, truncated: true }
}

/** The height a fitted run actually takes on the page. */
export function heightOf(result: Pick<FitResult, 'lines' | 'fontSize'>, lineHeight: number): number {
  return Math.ceil(result.lines.length * result.fontSize * lineHeight)
}
