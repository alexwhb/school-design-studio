/*
 * Whether words can be read where they have been put.
 *
 * The brand kit repaints a template in the school's colours the moment it is
 * added, and a colour swap has no opinion about what sits on top of it. A
 * poster drawn with a navy band and a white headline is fine; the same poster
 * with a pale yellow primary is a white headline on pale yellow, which is
 * nothing at all. So something has to be able to say "these two are 1.2 to one"
 * and "this colour, three shades darker, would pass" — that is this file.
 *
 * The maths is WCAG 2.x, which is the only contrast rule anybody agrees on and
 * the one every accessibility checker a school might be audited against uses:
 * relative luminance per channel, a ratio between 1 and 21, 4.5:1 for ordinary
 * text and 3:1 for large text and for marks that are decoration rather than
 * words. Everything here is a pure function of the strings it is given — no
 * DOM, no store — so it can be reasoned about, and tested, on its own.
 */
import { DESIGN_DPI } from './export/exportPdf'
import { paperName } from './pageSize'

/** The two ends a poster is printed between: the paper and the ink. */
export const PAPER = '#ffffffff'
export const INK = '#000000ff'

/** How far `adjustForContrast` will move a colour's lightness before giving up. */
const MAX_LIGHTNESS_SHIFT = 0.6

/** The size of one of its steps. Small enough that the answer is the nearest shade that will do. */
const LIGHTNESS_STEP = 0.02

/**
 * How far past the target a repair aims: a fifth again, so 3:1 is chased to
 * 3.6 and 4.5:1 to 5.4.
 *
 * Stopping at the first shade that passes leaves a line sitting exactly on the
 * bar, and a line on the bar is the faintest thing on the page — it satisfies
 * WCAG and still reads as an afterthought next to the headline beside it. The
 * margin costs a few per cent of lightness and buys a line that looks meant.
 * It is an aim rather than a requirement: the entry test and `met` are both
 * against the plain target, so a colour that can reach 3.2 but not 3.6 is a
 * repair that worked, and a second pass over a repaired design leaves it
 * exactly where the first one put it.
 */
const AIM_MARGIN = 1.2

/** Design pixels to the inch on a page that is not a sheet of paper — a slide, a banner. */
const SCREEN_DPI = 96

/**
 * The luminance at which black and white read equally well on a surface:
 * solve (1.05)/(L+0.05) = (L+0.05)/0.05 and you get 0.179. Below it, going
 * lighter buys more contrast than going darker; above it, the other way. It is
 * the only non-arbitrary place to turn round, and turning round in the wrong
 * place means a colour walks the long way and gives up short of the target.
 */
const PIVOT_LUMINANCE = 0.179

export type TRgba = { r: number; g: number; b: number; a: number }

/**
 * A colour as three channels and an alpha, all 0..1 for the alpha and 0..255
 * for the rest. Takes the four spellings the editor stores — `#rgb`, `#rrggbb`,
 * `#rrggbbaa`, and any of those without the hash, which is how a template's
 * `brand` block writes them. Anything else, a gradient included, is null: a
 * gradient has no one colour to compare against, and the caller has to decide
 * what to do about that rather than being handed a guess.
 */
export function parseColor(value: unknown): TRgba | null {
  if (typeof value !== 'string') return null
  const hex = value.trim().replace(/^#/, '').toLowerCase()
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return null
  const full = hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + 'ff' : hex.length === 6 ? hex + 'ff' : hex
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: parseInt(full.slice(6, 8), 16) / 255,
  }
}

/** The colour back as the editor stores one: `#rrggbbaa`, lower case. */
export function formatColor({ r, g, b, a }: TRgba): string {
  const byte = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0')
  return `#${byte(r)}${byte(g)}${byte(b)}${byte(a * 255)}`
}

/** One channel, un-gamma'd, the way WCAG asks for it. */
function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/**
 * How much light a colour gives back, 0 for black and 1 for white. Alpha is
 * ignored: a translucent colour has no luminance of its own until it is over
 * something, which is what `composite` is for.
 */
export function relativeLuminance(color: string): number {
  const rgb = parseColor(color)
  if (!rgb) return 0
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

/**
 * WCAG's contrast ratio between two colours: 1 when they are the same, 21 for
 * black on white. Symmetric — which of the pair is the text and which the
 * paper makes no difference to the number, only to what you do about it.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * A translucent colour laid over an opaque one, as the one colour a viewer
 * sees. A 7% wash of navy over cream is a very slightly cool cream, and it is
 * that cream the text on top has to be read against — comparing against the
 * navy would condemn every line sitting on a tint.
 */
export function composite(color: string, backdrop: string): string {
  const top = parseColor(color)
  const under = parseColor(backdrop)
  if (!top) return backdrop
  if (!under || top.a >= 1) return formatColor({ ...top, a: 1 })
  return formatColor({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  })
}

/**
 * How many design pixels make an inch of this page.
 *
 * A page is stored in pixels and records nothing about how big it is meant to
 * be, so the only clue is its shape: a page that matches a sheet of paper was
 * built on the 150 the presets and the PDF use, and anything else — a slide, a
 * banner, a social square — is a screen at the CSS 96. It matters here because
 * WCAG's "large text" is a physical size, and 44px on a Letter poster is a
 * third of an inch while 44px on a slide is not.
 */
export function pageDpi(page: { width: number; height: number }): number {
  // pageSize owns the table of sheets, and asking it rather than keeping a
  // second copy of the sizes here is what stops the two drifting apart.
  return paperName(page.width, page.height) ? DESIGN_DPI : SCREEN_DPI
}

/**
 * Whether WCAG would call this line large text, and so let it pass at 3:1
 * rather than 4.5:1: 18pt, or 14pt bold, converted to whatever a pixel is
 * worth on this page.
 */
export function largeText(fontSize: number, bold: boolean, page: { width: number; height: number }): boolean {
  const cssPx = (Number(fontSize) || 0) * (SCREEN_DPI / pageDpi(page))
  return bold ? cssPx >= 18.66 : cssPx >= 24
}

/** What a line of this size has to reach to be readable. Decorative marks use `DECORATIVE_TARGET`. */
export function contrastTarget(fontSize: number, bold: boolean, page: { width: number; height: number }): number {
  return largeText(fontSize, bold, page) ? 3 : 4.5
}

/** What a rule, an icon or a border has to reach against what it is drawn on. */
export const DECORATIVE_TARGET = 3

/**
 * Whichever of the candidates reads best on this surface. Ties go to the
 * earlier one, so a caller that puts the colour the text already was first
 * keeps it when nothing is gained by changing.
 */
export function readableOn(surface: string, candidates: string[]): string {
  let best = candidates[0]
  let bestRatio = -1
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, surface)
    if (ratio > bestRatio) {
      best = candidate
      bestRatio = ratio
    }
  }
  return best
}

export type TAdjustResult = {
  /** The colour to use — the one given back unchanged when it already passed, or gave up. */
  color: string
  /** What it reaches against the surface. */
  ratio: number
  /**
   * Whether it got to the target — the plain one, not the aim. False means the
   * caller has to fall back to ink or paper.
   */
  met: boolean
  /** Whether the colour was actually moved. */
  changed: boolean
}

/**
 * The nearest shade of the same colour that can be read on this surface.
 *
 * Hue and saturation are held and only lightness moves, because the school's
 * colour has to still look like the school's colour: a pale yellow that has to
 * darken to be read on cream comes out as a deeper yellow, not as brown and
 * not as black. It moves away from the surface — darker on light paper,
 * lighter on a dark band — in small steps, until it is a margin clear of the
 * target rather than sitting on it; see AIM_MARGIN.
 *
 * The shift is bounded. A colour that cannot reach the target inside that
 * bound says so rather than walking all the way to black, and the caller
 * decides what to do instead; walking to black would technically pass and
 * would have thrown the palette away to do it.
 */
export function adjustForContrast(color: string, surface: string, target: number): TAdjustResult {
  const start = contrastRatio(color, surface)
  // The plain target, deliberately: a colour that is already good enough is
  // left alone even though it sits below the aim, which is what makes running
  // this over an already-repaired design a no-op.
  if (start >= target) return { color, ratio: start, met: true, changed: false }
  const rgb = parseColor(color)
  if (!rgb) return { color, ratio: start, met: false, changed: false }

  const aim = target * AIM_MARGIN
  const hsl = toHsl(rgb)
  // Away from the surface: on anything lighter than the pivot the text has to
  // go darker, and on a darker band it has to go lighter. Deciding by the
  // surface rather than by the text is what stops a mid-grey oscillating.
  const direction = relativeLuminance(surface) > PIVOT_LUMINANCE ? -1 : 1

  let best = color
  let bestRatio = start
  for (let step = 1; step * LIGHTNESS_STEP <= MAX_LIGHTNESS_SHIFT; step++) {
    const lightness = hsl.l + direction * step * LIGHTNESS_STEP
    if (lightness < 0 || lightness > 1) break
    const candidate = formatColor({ ...fromHsl(hsl.h, hsl.s, lightness), a: rgb.a })
    const ratio = contrastRatio(candidate, surface)
    best = candidate
    bestRatio = ratio
    if (ratio >= aim) return { color: candidate, ratio, met: true, changed: true }
  }
  // Out of room. It still counts as met if it cleared the target on the way —
  // the margin is what the walk was for, not what it owed.
  return { color: best, ratio: bestRatio, met: bestRatio >= target, changed: best !== color }
}

// ---- HSL, for the one thing that needs it -----------------------------------

function toHsl({ r, g, b }: TRgba): { h: number; s: number; l: number } {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  const span = max - min
  if (span === 0) return { h: 0, s: 0, l }
  const s = span / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (max === rr) h = ((gg - bb) / span) % 6
  else if (max === gg) h = (bb - rr) / span + 2
  else h = (rr - gg) / span + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

function fromHsl(h: number, s: number, l: number): TRgba {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const sixth = Math.floor(((h % 360) + 360) % 360 / 60)
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sixth]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255, a: 1 }
}
