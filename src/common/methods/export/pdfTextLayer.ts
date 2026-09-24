/**
 * The invisible text a screen reader reads off an exported page.
 *
 * The picture of the page stays exactly as it was — see exportPdf.ts for why
 * that trade is not up for renegotiation — and the words are laid over it in
 * text-rendering mode 3, which draws nothing at all. This is the same
 * arrangement a scanner produces when it runs OCR over a page: what you see is
 * the image, what a machine gets is real text, in the right order, in the right
 * place. Selecting, searching, copying and reading aloud all start working, and
 * nothing about the printed result changes.
 *
 * ## Why there is no embedded font here
 *
 * Text in a PDF is drawn with a font, and getting a design's real fonts into
 * the file would mean writing a TrueType subsetter — thousands of lines to
 * produce glyphs that are, by construction, never drawn. So the text is set in
 * Helvetica, one of the fourteen fonts every PDF reader is required to have,
 * and a `/ToUnicode` map tells the reader what each character really is.
 * Extraction and screen readers work entirely off that map, so the letters come
 * out as the person typed them whatever glyph Helvetica would have drawn.
 *
 * That frees the encoding completely: character codes are handed out in the
 * order the document first uses them, one byte each, so an emoji costs the same
 * as an "e" and no character is unrepresentable. Past 255 distinct characters a
 * second font takes over, and a line switches between them mid-word if it has
 * to.
 *
 * The one thing a made-up encoding loses is metrics — Helvetica's own widths
 * are meaningless for codes that mean whatever we said they mean — so every
 * character is declared half an em wide and each line is then squeezed
 * horizontally to the width the browser actually laid it out at. The invisible
 * word ends up exactly over the visible one, which is what makes selecting a
 * line highlight the right part of the picture.
 */
import { num } from './pdfWriter'

/** Codes 1 to 255. Zero is left alone: a null byte in a string invites trouble. */
const SLOTS_PER_FONT = 255

/** Every character is declared this wide, in thousandths of an em. */
const GLYPH_WIDTH = 500

/** Text rendering mode 3: fill nothing, stroke nothing, advance as normal. */
const INVISIBLE = '3 Tr'

export type EncodedRun = { fontIndex: number; hex: string; count: number }

/**
 * Hands out one-byte codes to whatever characters the document turns out to
 * contain, and remembers enough to write the `/ToUnicode` map back out.
 */
export class InvisibleFonts {
  private slots = new Map<number, number>()
  private points: number[] = []

  private slotFor(codePoint: number): number {
    const existing = this.slots.get(codePoint)
    if (existing !== undefined) return existing
    const slot = this.points.length
    this.points.push(codePoint)
    this.slots.set(codePoint, slot)
    return slot
  }

  /** How many fonts the document needs. Zero when it has no text at all. */
  get fontCount(): number {
    return Math.ceil(this.points.length / SLOTS_PER_FONT)
  }

  /**
   * Turns a string into runs of hex, split wherever the codes cross from one
   * font into the next.
   *
   * Iterated by code point rather than by UTF-16 unit, so an emoji or any other
   * character outside the basic plane takes one code and comes back out of
   * `/ToUnicode` as the surrogate pair it started as.
   */
  encode(text: string): EncodedRun[] {
    const runs: EncodedRun[] = []
    for (const character of text) {
      const slot = this.slotFor(character.codePointAt(0) as number)
      const fontIndex = Math.floor(slot / SLOTS_PER_FONT)
      const code = (slot % SLOTS_PER_FONT) + 1
      const last = runs[runs.length - 1]
      if (last && last.fontIndex === fontIndex) {
        last.hex += code.toString(16).padStart(2, '0')
        last.count++
      } else {
        runs.push({ fontIndex, hex: code.toString(16).padStart(2, '0'), count: 1 })
      }
    }
    return runs
  }

  /** The code points held by one font, in code order starting at code 1. */
  private pointsIn(fontIndex: number): number[] {
    return this.points.slice(fontIndex * SLOTS_PER_FONT, (fontIndex + 1) * SLOTS_PER_FONT)
  }

  /** The font dictionary, minus the two references only the writer can supply. */
  fontDict(fontIndex: number, toUnicodeRef: string): string {
    const used = this.pointsIn(fontIndex).length
    const widths = new Array(used).fill(GLYPH_WIDTH).join(' ')
    return `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /FirstChar 1 /LastChar ${used}` + ` /Widths [${widths}] /ToUnicode ${toUnicodeRef} >>`
  }

  /**
   * The CMap that says what each code means.
   *
   * `bfchar` blocks are capped at 100 entries by the specification, so the
   * mapping is written out in hundreds.
   */
  toUnicodeCMap(fontIndex: number): string {
    const points = this.pointsIn(fontIndex)
    const entries = points.map((point, index) => {
      const code = (index + 1).toString(16).padStart(2, '0').toUpperCase()
      return `<${code}> <${utf16beHex(point)}>`
    })

    const blocks: string[] = []
    for (let at = 0; at < entries.length; at += 100) {
      const chunk = entries.slice(at, at + 100)
      blocks.push(`${chunk.length} beginbfchar\n${chunk.join('\n')}\nendbfchar`)
    }

    return ['/CIDInit /ProcSet findresource begin', '12 dict begin', 'begincmap', '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def', '/CMapName /Adobe-Identity-UCS def', '/CMapType 2 def', '1 begincodespacerange', '<01> <FF>', 'endcodespacerange', ...blocks, 'endcmap', 'CMapName currentdict /CMap defineresource pop', 'end', 'end'].join('\n')
  }
}

function utf16beHex(codePoint: number): string {
  if (codePoint <= 0xffff) return codePoint.toString(16).padStart(4, '0').toUpperCase()
  const offset = codePoint - 0x10000
  const high = (0xd800 + (offset >> 10)).toString(16).padStart(4, '0')
  const low = (0xdc00 + (offset & 0x3ff)).toString(16).padStart(4, '0')
  return (high + low).toUpperCase()
}

/** The name a page's `/Resources` gives one of the fonts. */
export const fontName = (fontIndex: number): string => `/AT${fontIndex}`

export type InvisibleRun = {
  text: string
  /** Where the baseline starts, in points from the bottom-left of the page. */
  x: number
  y: number
  /** How far the run goes along its baseline, in points. */
  width: number
  /** Em size in points. Only sets the height of the selectable band. */
  size: number
  /** Baseline direction, anticlockwise from the x axis, in radians. */
  angle: number
}

/**
 * One run of unseen text, as a content-stream fragment.
 *
 * The horizontal scale is the whole trick: the declared width of the string is
 * known exactly (half an em a character, by construction), the width it has to
 * cover was measured off the page, and `Tz` is the ratio between them. Returns
 * an empty string for anything with no text or nowhere to put it, so a caller
 * can concatenate without checking.
 */
export function drawInvisibleRun(line: InvisibleRun, fonts: InvisibleFonts): string {
  const text = line.text
  if (!text || line.size <= 0 || line.width <= 0) return ''

  const runs = fonts.encode(text)
  const characters = runs.reduce((total, run) => total + run.count, 0)
  if (characters === 0) return ''

  const natural = (characters * GLYPH_WIDTH * line.size) / 1000
  // A pathological measurement — a run reported as a thousand times its own
  // length — would stretch the invisible text across the whole sheet and make
  // selection worse than useless. Well outside anything real text produces.
  const scale = Math.min(Math.max((line.width / natural) * 100, 1), 2000)

  // Two decimal places is plenty for a position on a page and far too coarse
  // for the cells of a rotation matrix, where it lands the end of a long line
  // most of a degree away from where it belongs.
  const cos = fine(Math.cos(line.angle))
  const sin = fine(Math.sin(line.angle))
  const shown = runs.map((run) => `${fontName(run.fontIndex)} ${num(line.size)} Tf <${run.hex.toUpperCase()}> Tj`).join(' ')

  return `BT ${INVISIBLE} ${num(scale)} Tz ` + `${cos} ${sin} ${negate(sin)} ${cos} ${num(line.x)} ${num(line.y)} Tm ` + `${shown} ET\n`
}

/** Five decimal places, with the trailing zeros trimmed off again. */
function fine(value: number): string {
  const text = value
    .toFixed(5)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
  return text === '-0' ? '0' : text
}

const negate = (text: string): string => (text.startsWith('-') ? text.slice(1) : text === '0' ? '0' : `-${text}`)
