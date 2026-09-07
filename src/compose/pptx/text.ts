/**
 * A PowerPoint text body into the markup a text widget holds.
 *
 * The two models are closer than they look. PowerPoint has paragraphs of runs,
 * each run carrying its own bold/italic/underline/colour; the editor has lines
 * of runs carrying exactly the same six things (`richText.ts`). So this builds
 * `TTextLine[]` and hands them to `linesToHtml` rather than writing HTML by
 * hand — which means the markup an import produces is canonical and inside the
 * allowlist by construction, and gets there the same way a paste into the
 * editor does. There is no string concatenation here that could grow an
 * attribute.
 *
 * What cannot come across is the part PowerPoint holds per-character and the
 * editor holds per-box: size and face. A text box in a deck can mix four sizes
 * in one sentence. The widget has one `fontSize` and one `fontClass`, so the
 * dominant run wins — see `dominant`.
 */
import { linesToHtml, type TTextLine, type TTextRun } from '@/utils/widgets/richText'
import { hundredthsToPx, nearestFont, colorInside, toDesignColor, type ColorMap, type ColorScheme } from './style'
import { attr, child, children, num, type XNode } from './xml'

/** What a whole text body came to, once its runs have been reconciled. */
export type ImportedText = {
  /** Canonical markup for the widget's `text`. */
  markup: string
  /** Plain words, for deciding whether the box is worth keeping at all. */
  plain: string
  fontSize: number
  /** The bundled family the box will be set in. */
  fontFamily: string
  /**
   * The family the file actually asked for, before substitution.
   *
   * Kept apart from `fontFamily` because the import reports what it swapped,
   * and by the time the face has been resolved the original name is gone —
   * which is how the report came out empty the first time.
   */
  requestedFamily: string
  color: string
  fontWeight: number
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline' | 'line-through'
  textAlign: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number
  listStyle: 'none' | 'bullet' | 'number'
  /** `t`, `ctr` or `b` — where the words sit in the shape's box. */
  anchor: 'top' | 'center' | 'bottom'
}

/** Sizes PowerPoint will not have written but a broken file might. */
const MIN_FONT_PX = 4
const MAX_FONT_PX = 800

const ALIGN: Record<string, ImportedText['textAlign']> = {
  l: 'left',
  ctr: 'center',
  r: 'right',
  just: 'justify',
  justLow: 'justify',
  dist: 'justify',
}

const ANCHOR: Record<string, ImportedText['anchor']> = {
  t: 'top',
  ctr: 'center',
  b: 'bottom',
}

/** Run properties, resolved as far as this element alone can resolve them. */
type RunStyle = {
  sizePx: number | null
  family: string | null
  color: string | null
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
}

/**
 * Resolves `+mj-lt` / `+mn-lt`, the theme's major and minor faces.
 *
 * A deck that has never had a font changed by hand names its typefaces this way
 * and nowhere else, so a reader that skipped it would import every slide in the
 * default face and lose the one typographic decision the author actually made.
 */
function typefaceOf(rPr: XNode | null, theme: { majorFont: string; minorFont: string }): string | null {
  const latin = child(rPr, 'latin')
  const raw = attr(latin, 'typeface')
  if (!raw) return null
  if (raw === '+mj-lt') return theme.majorFont || null
  if (raw === '+mn-lt') return theme.minorFont || null
  return raw
}

function readRunStyle(rPr: XNode | null, scheme: ColorScheme, map: ColorMap, theme: { majorFont: string; minorFont: string }): RunStyle {
  const sizeRaw = rPr ? num(rPr, 'sz', 0) : 0
  const sizePx = sizeRaw > 0 ? Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, hundredthsToPx(sizeRaw))) : null
  const fill = child(rPr, 'solidFill')
  return {
    sizePx,
    family: typefaceOf(rPr, theme),
    color: toDesignColor(colorInside(fill, scheme, map)),
    // `b="1"`, `b="true"` and `b="0"` all appear in the wild.
    bold: attr(rPr, 'b') === '1' || attr(rPr, 'b') === 'true',
    italic: attr(rPr, 'i') === '1' || attr(rPr, 'i') === 'true',
    underline: !!attr(rPr, 'u') && attr(rPr, 'u') !== 'none',
    strike: !!attr(rPr, 'strike') && attr(rPr, 'strike') !== 'noStrike',
  }
}

/**
 * The value that carried the most characters.
 *
 * Not the first value and not the most common one: a heading whose first word
 * was accidentally left at 18pt and whose remaining forty characters are 40pt
 * is a 40pt heading. Weighting by length is what gets that right, and it is
 * also what stops a stray empty run deciding the colour of a paragraph.
 */
function dominant<T>(weights: Map<T, number>, fallback: T): T {
  let best = fallback
  let bestWeight = 0
  for (const [value, weight] of weights) {
    if (weight > bestWeight) {
      best = value
      bestWeight = weight
    }
  }
  return best
}

function addWeight<T>(weights: Map<T, number>, value: T | null | undefined, weight: number) {
  if (value === null || value === undefined || weight <= 0) return
  weights.set(value, (weights.get(value) ?? 0) + weight)
}

/**
 * Whether a paragraph is bulleted.
 *
 * PowerPoint's default for a body placeholder is "bulleted", and `<a:buNone/>`
 * is how a paragraph opts out — so absence does not mean no bullet. But the
 * layout that supplies the default lives in another part, and following it for
 * every paragraph would mean resolving the whole placeholder inheritance chain
 * for a decoration. So the rule here is the conservative one: a bullet is a
 * bullet when the paragraph says so outright, and indentation alone is not
 * enough. A list that comes in flat can be made a list again in one click; text
 * that comes in wrongly bulleted has to be fixed line by line.
 */
function bulletOf(pPr: XNode | null): 'none' | 'bullet' | 'number' {
  if (!pPr) return 'none'
  if (child(pPr, 'buNone')) return 'none'
  if (child(pPr, 'buAutoNum')) return 'number'
  if (child(pPr, 'buChar')) return 'bullet'
  return 'none'
}

/**
 * The words of one `<a:p>`, as runs.
 *
 * `<a:br/>` splits the paragraph into more than one line, which is why this
 * returns an array. `<a:fld>` is a field — a slide number, a date — and carries
 * the text it last rendered as, which is the only value available offline and
 * the right one to freeze into the design.
 */
function readParagraph(paragraph: XNode, scheme: ColorScheme, map: ColorMap, theme: { majorFont: string; minorFont: string }, collect: (style: RunStyle, length: number) => void): TTextLine[] {
  const lines: TTextLine[] = [[]]

  for (const item of paragraph.children) {
    if (item.local === 'br') {
      lines.push([])
      continue
    }
    if (item.local !== 'r' && item.local !== 'fld') continue

    const textNode = child(item, 't')
    const text = textNode?.text ?? ''
    if (!text) continue

    const style = readRunStyle(child(item, 'rPr'), scheme, map, theme)
    collect(style, text.length)

    const run: TTextRun = { text }
    if (style.bold) run.bold = true
    if (style.italic) run.italic = true
    if (style.underline) run.underline = true
    if (style.strike) run.strike = true
    // The colour is only worth carrying per-run when it differs from the box's,
    // and that is not known yet — `finish` strips the ones that match.
    if (style.color) run.color = style.color
    lines[lines.length - 1]!.push(run)
  }
  return lines
}

/**
 * A `<p:txBody>` read into one widget's worth of text, or null when there are
 * no words in it.
 *
 * Null rather than an empty result on purpose: a deck is full of empty
 * placeholder boxes ("Click to add text"), and importing them would put a
 * hundred invisible widgets on the canvas for somebody to clean up by hand.
 */
export function readTextBody(body: XNode | null, scheme: ColorScheme, map: ColorMap, theme: { majorFont: string; minorFont: string }, defaults: { color: string; sizePx: number }): ImportedText | null {
  if (!body) return null

  const paragraphs = children(body, 'p')
  if (!paragraphs.length) return null

  const sizes = new Map<number, number>()
  const families = new Map<string, number>()
  const colors = new Map<string, number>()
  const weights = new Map<number, number>()
  const styles = new Map<'normal' | 'italic', number>()
  const decorations = new Map<ImportedText['textDecoration'], number>()
  const collect = (style: RunStyle, length: number) => {
    addWeight(sizes, style.sizePx, length)
    addWeight(families, style.family, length)
    addWeight(colors, style.color, length)
    addWeight(weights, style.bold ? 700 : 400, length)
    addWeight(styles, style.italic ? 'italic' : 'normal', length)
    addWeight(decorations, style.underline ? 'underline' : style.strike ? 'line-through' : 'none', length)
  }

  const lines: TTextLine[] = []
  const aligns = new Map<ImportedText['textAlign'], number>()
  const bullets = new Map<'none' | 'bullet' | 'number', number>()
  const spacings: number[] = []

  for (const paragraph of paragraphs) {
    const pPr = child(paragraph, 'pPr')
    const paragraphLines = readParagraph(paragraph, scheme, map, theme, collect)
    const length = paragraphLines.reduce((total, line) => total + line.reduce((sum, run) => sum + run.text.length, 0), 0)
    // An empty paragraph between two full ones is a blank line the author put
    // there. One at the very end is not, and `linesToHtml` drops trailing
    // emptiness for the same reason.
    addWeight(aligns, ALIGN[attr(pPr, 'algn') ?? ''] ?? 'left', Math.max(length, 1))
    addWeight(bullets, bulletOf(pPr), Math.max(length, 1))
    const spcPct = num(child(child(pPr, 'lnSpc'), 'spcPct'), 'val', 0)
    if (spcPct > 0) spacings.push(spcPct / 100000)
    lines.push(...paragraphLines)
  }

  const plain = lines
    .map((line) => line.map((run) => run.text).join(''))
    .join('\n')
    .trim()
  if (!plain) return null

  const color = dominant(colors, defaults.color)
  const listStyle = dominant(bullets, 'none')

  // A run whose colour is the box's colour does not need to say so. Dropping
  // them is what keeps an ordinary paragraph one run instead of forty spans.
  for (const line of lines) {
    for (const run of line) {
      if (run.color === color) delete run.color
    }
  }

  const family = dominant(families, '')
  const font = nearestFont(family)

  return {
    markup: linesToHtml(lines, listStyle),
    plain,
    fontSize: Math.round(dominant(sizes, defaults.sizePx)),
    fontFamily: font.value,
    requestedFamily: family,
    color,
    fontWeight: dominant(weights, 400),
    fontStyle: dominant(styles, 'normal'),
    textDecoration: dominant(decorations, 'none'),
    textAlign: dominant(aligns, 'left'),
    // PowerPoint's own default is single spacing, which it draws a shade looser
    // than 1.0; 1.2 is what the editor's boxes use and what makes an imported
    // paragraph occupy about the space it did.
    lineHeight: spacings.length ? Math.min(4, Math.max(0.5, spacings.reduce((a, b) => a + b, 0) / spacings.length)) : 1.2,
    listStyle,
    anchor: ANCHOR[attr(child(body, 'bodyPr'), 'anchor') ?? ''] ?? 'top',
  }
}
