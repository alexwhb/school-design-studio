/**
 * The three vocabularies a PowerPoint file speaks that a design does not:
 * measurements, colours and typefaces.
 *
 * All three are lossy in the same direction. PowerPoint can name a colour by
 * pointing at a theme slot and then modifying it four times; a design holds
 * `#rrggbb`. PowerPoint can ask for any font installed on the machine that made
 * it; a design may only ask for one of the families the editor ships. So the
 * job here is to resolve as far as the format allows and then land on something
 * the editor can actually draw, rather than to preserve a reference the editor
 * has no way to follow.
 */
import fonts, { DEFAULT_FONT, type TFontItem } from '@/assets/data/FontsData'
import { attr, child, num, type XNode } from './xml'

// ---- measurements ------------------------------------------------------------

/**
 * English Metric Units per design pixel.
 *
 * A design pixel is a CSS pixel, 1/96 of an inch (`export/utils.ts` says so and
 * the exporter divides by it). OOXML measures in EMU, 914400 to the inch. So a
 * pixel is 914400/96 = 9525 EMU, and this is exactly the inverse of what
 * `exportPptx` does on the way out.
 */
export const EMU_PER_PX = 9525

export function emuToPx(emu: number): number {
  return emu / EMU_PER_PX
}

/**
 * OOXML writes type size in hundredths of a point, angles in sixtieths of a
 * degree, and percentages in thousandths of a percent. None of those are
 * guesses — they are what the schema says.
 */
export const pointsToPx = (points: number): number => (points * 96) / 72
export const hundredthsToPx = (value: number): number => pointsToPx(value / 100)
export const sixtiethsToDegrees = (value: number): number => value / 60000
export const percentOf = (value: number): number => value / 100000

// ---- colours -----------------------------------------------------------------

/** A theme's colour scheme, by slot name, as `rrggbb` with no `#`. */
export type ColorScheme = Record<string, string>

/**
 * What the slide master maps the background and text slots onto.
 *
 * `bg1` is not a colour, it is a pointer: on most masters it means `lt1`, but a
 * master built for a dark deck maps it to `dk1` instead. Reading `bg1` as
 * "light" without following the map is how an imported dark deck comes out with
 * black text on a black page.
 */
export type ColorMap = Record<string, string>

const HEX6 = /^[0-9a-fA-F]{6}$/

/** Colours DrawingML names outright. Only the ones that turn up in practice. */
const PRESET_COLORS: Record<string, string> = {
  black: '000000',
  white: 'ffffff',
  red: 'ff0000',
  green: '008000',
  blue: '0000ff',
  yellow: 'ffff00',
  gray: '808080',
  grey: '808080',
  darkGray: 'a9a9a9',
  lightGray: 'd3d3d3',
  orange: 'ffa500',
  purple: '800080',
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function toHex(r: number, g: number, b: number): string {
  return [r, g, b].map((part) => clamp255(part).toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): [number, number, number] {
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const lightness = (max + min) / 2
  if (max === min) return [0, 0, lightness]
  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue: number
  if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) hue = ((bn - rn) / delta + 2) / 6
  else hue = ((rn - gn) / delta + 4) / 6
  return [hue, saturation, lightness]
}

function hueToChannel(p: number, q: number, t: number): number {
  let shifted = t
  if (shifted < 0) shifted += 1
  if (shifted > 1) shifted -= 1
  if (shifted < 1 / 6) return p + (q - p) * 6 * shifted
  if (shifted < 1 / 2) return q
  if (shifted < 2 / 3) return p + (q - p) * (2 / 3 - shifted) * 6
  return p
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [hueToChannel(p, q, h + 1 / 3) * 255, hueToChannel(p, q, h) * 255, hueToChannel(p, q, h - 1 / 3) * 255]
}

/**
 * The transforms that can sit inside a colour element, applied in document
 * order.
 *
 * `lumMod`/`lumOff` are how a theme builds its tints: accent1 at 60% luminance
 * plus 40% is the pale version of the same colour, and a deck that uses them is
 * a deck where reading only `val` gives you five identical slides. `shade` and
 * `tint` are approximated in sRGB rather than the linear space the spec names —
 * the difference is a percent or two of lightness on a colour that is about to
 * be replaced by the school's own anyway, and doing it properly would mean a
 * gamma round-trip per stop for no visible gain.
 */
function applyColorMods(hex: string, source: XNode): { hex: string; alpha: number } {
  let [r, g, b] = fromHex(hex)
  let alpha = 1

  for (const mod of source.children) {
    const value = num(mod, 'val', NaN)
    if (!Number.isFinite(value)) continue
    const amount = percentOf(value)
    switch (mod.local) {
      case 'alpha':
        alpha = Math.min(1, Math.max(0, amount))
        break
      case 'lumMod':
      case 'lumOff': {
        const [h, s, l] = rgbToHsl(r, g, b)
        const next = mod.local === 'lumMod' ? l * amount : l + amount
        ;[r, g, b] = hslToRgb(h, s, Math.min(1, Math.max(0, next)))
        break
      }
      case 'satMod': {
        const [h, s, l] = rgbToHsl(r, g, b)
        ;[r, g, b] = hslToRgb(h, Math.min(1, Math.max(0, s * amount)), l)
        break
      }
      case 'shade':
        r *= amount
        g *= amount
        b *= amount
        break
      case 'tint':
        r = r * amount + 255 * (1 - amount)
        g = g * amount + 255 * (1 - amount)
        b = b * amount + 255 * (1 - amount)
        break
      default:
        break
    }
  }
  return { hex: toHex(r, g, b), alpha }
}

/** A resolved colour: `#rrggbb`, plus how opaque it was asked to be. */
export type ResolvedColor = { hex: string; alpha: number }

/**
 * One colour element — `<a:srgbClr>`, `<a:schemeClr>` and the rest — resolved
 * against the theme.
 *
 * Returns null when the element is not a colour at all, so a caller can tell
 * "this shape has no fill" from "this shape is filled black".
 */
export function resolveColorNode(source: XNode | null | undefined, scheme: ColorScheme, map: ColorMap): ResolvedColor | null {
  if (!source) return null
  let base: string | undefined

  switch (source.local) {
    case 'srgbClr': {
      const raw = attr(source, 'val')
      if (raw && HEX6.test(raw)) base = raw.toLowerCase()
      break
    }
    case 'schemeClr': {
      const slot = attr(source, 'val')
      if (slot) {
        // Follow the master's map first: `bg1` means whatever that master says
        // it means. `phClr` is a placeholder the style inherits and has no
        // value of its own here, so it falls through to the caller's default.
        const mapped = map[slot] ?? slot
        base = scheme[mapped] ?? scheme[slot]
      }
      break
    }
    case 'sysClr': {
      // The file records what the system colour resolved to when it was saved,
      // which is the only sensible answer on a machine that is not that one.
      const last = attr(source, 'lastClr')
      if (last && HEX6.test(last)) base = last.toLowerCase()
      else if (attr(source, 'val') === 'windowText') base = '000000'
      else if (attr(source, 'val') === 'window') base = 'ffffff'
      break
    }
    case 'prstClr': {
      const name = attr(source, 'val')
      if (name) base = PRESET_COLORS[name]
      break
    }
    case 'scrgbClr': {
      base = toHex((num(source, 'r') / 100000) * 255, (num(source, 'g') / 100000) * 255, (num(source, 'b') / 100000) * 255)
      break
    }
    default:
      return null
  }

  if (!base) return null
  const { hex, alpha } = applyColorMods(base, source)
  return { hex: `#${hex}`, alpha }
}

/** The colour inside a container such as `<a:solidFill>` or `<a:fgClr>`. */
export function colorInside(container: XNode | null | undefined, scheme: ColorScheme, map: ColorMap): ResolvedColor | null {
  if (!container) return null
  for (const item of container.children) {
    const resolved = resolveColorNode(item, scheme, map)
    if (resolved) return resolved
  }
  return null
}

/**
 * A colour and its alpha as one value the editor understands.
 *
 * The design format carries opacity in the colour itself as `#rrggbbaa`, which
 * is what a widget's `color` and `backgroundColor` fields hold, so a
 * half-transparent fill survives the trip without needing a separate field.
 */
export function toDesignColor(color: ResolvedColor | null): string | null {
  if (!color) return null
  if (color.alpha >= 1) return color.hex
  const alpha = clamp255(color.alpha * 255)
    .toString(16)
    .padStart(2, '0')
  return `${color.hex}${alpha}`
}

// ---- typefaces ---------------------------------------------------------------

const FONT_BY_VALUE = new Map<string, TFontItem>(fonts.map((font) => [font.value.toLowerCase(), font]))

/**
 * What each font a school's deck is likely to name should become.
 *
 * The editor may only set a family it ships — the files are bundled so that a
 * design renders the same in the editor, in a PDF and on a machine that has
 * never had Office on it. So every name here is a judgement about what the
 * original was *for*: Calibri and Aptos are Office's defaults and the closest
 * thing in the set is Inter; Times New Roman and Cambria are the serifs a
 * newsletter is set in; Impact and Haettenschweiler are display faces that
 * exist to be large and loud.
 *
 * Anything not listed falls back by category in `nearestFont`, which is a worse
 * guess but never a wrong-looking one.
 */
const FONT_ALIASES: Record<string, string> = {
  // Office and Windows UI sans
  calibri: 'Inter',
  'calibri light': 'Inter',
  aptos: 'Inter',
  'aptos display': 'Inter',
  'aptos narrow': 'Archivo Narrow',
  'segoe ui': 'Inter',
  'segoe ui light': 'Inter',
  tahoma: 'Open Sans',
  verdana: 'Open Sans',
  arial: 'Roboto',
  'arial narrow': 'Archivo Narrow',
  'arial black': 'Anton',
  helvetica: 'Roboto',
  'helvetica neue': 'Roboto',
  'liberation sans': 'Roboto',
  'trebuchet ms': 'Lato',
  'gill sans': 'Lato',
  'gill sans mt': 'Lato',
  'century gothic': 'Poppins',
  futura: 'Poppins',
  'franklin gothic book': 'Archivo',
  'franklin gothic medium': 'Archivo',
  candara: 'Karla',
  corbel: 'Karla',
  'lucida sans': 'Open Sans',
  'lucida grande': 'Open Sans',
  geneva: 'Open Sans',
  optima: 'Lato',
  avenir: 'Montserrat',
  'avenir next': 'Montserrat',
  'myriad pro': 'Open Sans',

  // Serifs
  'times new roman': 'Libre Baskerville',
  times: 'Libre Baskerville',
  'liberation serif': 'Libre Baskerville',
  cambria: 'Source Serif 4',
  georgia: 'Merriweather',
  garamond: 'EB Garamond',
  'adobe garamond pro': 'EB Garamond',
  'book antiqua': 'EB Garamond',
  palatino: 'EB Garamond',
  'palatino linotype': 'EB Garamond',
  'bookman old style': 'Lora',
  'century schoolbook': 'Lora',
  cochin: 'Lora',
  'baskerville old face': 'Libre Baskerville',
  didot: 'Playfair Display',
  'bodoni mt': 'Playfair Display',
  constantia: 'Spectral',
  rockwell: 'Roboto Slab',
  'courier new': 'JetBrains Mono',
  courier: 'JetBrains Mono',
  consolas: 'IBM Plex Mono',
  monaco: 'IBM Plex Mono',
  menlo: 'IBM Plex Mono',

  // Display
  impact: 'Anton',
  haettenschweiler: 'Anton',
  'cooper black': 'Alfa Slab One',
  'showcard gothic': 'Alfa Slab One',

  // Handwriting
  'comic sans ms': 'Patrick Hand',
  'bradley hand itc': 'Caveat',
  'segoe script': 'Caveat',
  'brush script mt': 'Pacifico',
  'lucida handwriting': 'Caveat',
  chalkduster: 'Permanent Marker',
  'marker felt': 'Permanent Marker',
}

/** The categories a name suggests when it is not one we know. */
const CATEGORY_HINTS: Array<{ test: RegExp; font: string }> = [
  { test: /mono|code|consol|courier|typewriter/i, font: 'IBM Plex Mono' },
  { test: /script|hand|brush|marker|comic|casual/i, font: 'Caveat' },
  { test: /slab/i, font: 'Roboto Slab' },
  { test: /serif|roman|garamond|georgia|book|times|minion/i, font: 'Libre Baskerville' },
  { test: /black|heavy|poster|display|impact|headline/i, font: 'Anton' },
  { test: /narrow|condensed/i, font: 'Archivo Narrow' },
]

/**
 * A `TFontItem` for whatever the file asked for.
 *
 * Never null: a text box has to have a face, and a box that came back without
 * one would render in the browser's default and look nothing like anything else
 * on the page. The default is the same one a new text box gets.
 */
export function nearestFont(name: string | undefined | null): TFontItem {
  const wanted = (name ?? '').trim()
  if (!wanted) return FONT_BY_VALUE.get(DEFAULT_FONT.value.toLowerCase()) ?? fonts[0]!

  const lower = wanted.toLowerCase()
  // A family the editor already ships, named exactly.
  const exact = FONT_BY_VALUE.get(lower)
  if (exact) return exact

  const aliased = FONT_ALIASES[lower]
  if (aliased) {
    const font = FONT_BY_VALUE.get(aliased.toLowerCase())
    if (font) return font
  }

  // `+mj-lt` and `+mn-lt` are the theme's own major/minor faces. They are
  // resolved before this is called; reaching here means the theme did not say,
  // so the default is the honest answer.
  for (const hint of CATEGORY_HINTS) {
    if (hint.test.test(wanted)) {
      const font = FONT_BY_VALUE.get(hint.font.toLowerCase())
      if (font) return font
    }
  }
  return FONT_BY_VALUE.get(DEFAULT_FONT.value.toLowerCase()) ?? fonts[0]!
}

/** The `fontClass` shape a text widget stores, from a resolved family. */
export function fontChoice(font: TFontItem) {
  const { id, oid, value, url, alias, preview } = font
  return { id, oid, value, url, alias, preview }
}

/**
 * A theme's colour scheme and its two typefaces.
 *
 * `dk1`/`lt1` are written as `sysClr` far more often than as `srgbClr`, which
 * is why this goes through the same resolver as everything else rather than
 * reading `val` directly.
 */
export function readTheme(theme: XNode | null): { scheme: ColorScheme; majorFont: string; minorFont: string } {
  const scheme: ColorScheme = {}
  const elements = child(theme, 'themeElements')
  const clrScheme = child(elements, 'clrScheme')
  if (clrScheme) {
    for (const slot of clrScheme.children) {
      const resolved = colorInside(slot, {}, {})
      if (resolved) scheme[slot.local] = resolved.hex.slice(1)
    }
  }
  const fontScheme = child(elements, 'fontScheme')
  const major = attr(child(child(fontScheme, 'majorFont'), 'latin'), 'typeface') ?? ''
  const minor = attr(child(child(fontScheme, 'minorFont'), 'latin'), 'typeface') ?? ''
  return { scheme, majorFont: major, minorFont: minor }
}

/** The `<a:clrMap>` / `<p:clrMapOvr>` on a master or slide, as a plain lookup. */
export function readColorMap(source: XNode | null | undefined): ColorMap {
  const map: ColorMap = {}
  if (!source) return map
  for (const [key, value] of Object.entries(source.attrs)) map[key] = value
  return map
}
