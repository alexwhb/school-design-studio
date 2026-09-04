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
 * How much narrower or wider a family runs than the table above.
 *
 * Only the families the bundled themes and packs actually use are named; a
 * family nobody named measures as an ordinary sans, which is what the table is.
 */
const FAMILY_FACTOR: Record<string, number> = {
  Anton: 0.78,
  'Bebas Neue': 0.72,
  Oswald: 0.8,
  Archivo: 0.98,
  Inter: 1,
  Roboto: 0.98,
  'Open Sans': 1.01,
  Lato: 0.97,
  Montserrat: 1.08,
  Poppins: 1.06,
  Nunito: 1,
  Quicksand: 1.02,
  Fredoka: 1.03,
  Merriweather: 1.09,
  'Playfair Display': 1.02,
  Lora: 1.02,
  'Libre Baskerville': 1.12,
  'Source Serif 4': 1,
  Spectral: 1,
  'DM Serif Display': 1.02,
  'Space Grotesk': 1,
  Karla: 0.96,
  Caveat: 0.72,
  Pacifico: 1.05,
  'IBM Plex Mono': 1.15,
  'JetBrains Mono': 1.15,
}

/** A safety margin, because being wrong in one direction is much worse. */
const PESSIMISM = 1.03

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
  const factor = (style.fontFamily && FAMILY_FACTOR[style.fontFamily]) || 1
  let ems = 0
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

  const floor = Math.max(6, Math.min(options.minFontSize, style.fontSize))
  for (let size = style.fontSize; size >= floor; size -= 1) {
    const scaled = { ...style, fontSize: size, letterSpacing: (style.letterSpacing || 0) * (size / style.fontSize) }
    const lines = wrapText(words, options.width, scaled)
    const room = Math.min(linesThatFit(options.height, size, style.lineHeight), options.maxLines || Number.MAX_SAFE_INTEGER)
    if (lines.length <= room) return { text: words, fontSize: size, lines, truncated: false }
  }

  // At the floor and still too long. Keep whole words, and say so with an
  // ellipsis on the end of the last line that fits.
  const scaled = { ...style, fontSize: floor, letterSpacing: (style.letterSpacing || 0) * (floor / style.fontSize) }
  const room = Math.min(linesThatFit(options.height, floor, style.lineHeight), options.maxLines || Number.MAX_SAFE_INTEGER)
  const lines = wrapText(words, options.width, scaled).slice(0, room)
  while (lines.length && measureText(`${lines[lines.length - 1]}…`, scaled) > options.width) {
    const last = lines[lines.length - 1].split(' ')
    last.pop()
    if (last.length === 0) {
      lines.pop()
      continue
    }
    lines[lines.length - 1] = last.join(' ')
  }
  if (lines.length === 0) return { text: '…', fontSize: floor, lines: ['…'], truncated: true }
  lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[\s,;:.]+$/, '')}…`
  return { text: lines.join(' '), fontSize: floor, lines, truncated: true }
}

/** The height a fitted run actually takes on the page. */
export function heightOf(result: Pick<FitResult, 'lines' | 'fontSize'>, lineHeight: number): number {
  return Math.ceil(result.lines.length * result.fontSize * lineHeight)
}
