/*
 * What the brand kit does to a design.
 *
 * Three operations, all of them across the whole design rather than the page
 * on screen, for the same reason find-and-replace is: the school's name is on
 * every slide, and the one it misses is the one that gets printed. Like
 * findReplace.ts this goes through `dLayouts[].layers`, which is the same
 * array the canvas draws the current page from, so the page on screen updates
 * along with the rest and there is no special case for it.
 *
 * None of these record history themselves — the caller decides how much one
 * undo takes back, and wraps the call in `recordHistory`.
 */
import { brandFont, brandResolver, brandRoleIndex, isBrandField, type TBrandKit, type TTemplateBrand } from '@/common/methods/brandKit'
import {
  DECORATIVE_TARGET,
  INK,
  PAPER,
  adjustForContrast,
  composite,
  contrastRatio,
  contrastTarget,
  readableOn,
  relativeLuminance,
} from '@/common/methods/contrast'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import effectColors from '@/components/modules/widgets/wText/effectColors'
import recolorEffects from '@/components/modules/widgets/wText/recolorEffects'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import type { TFontItem } from '@/assets/data/FontsData'
import { isGradient, parseGradient, toGradientString } from '@/packages/color-picker/utils/gradient'
import { fieldsInLayers, fillText, hasFields } from '@/utils/mergeFields'
import { updatePageData } from '../canvas'
import { canvasState, widgetState } from '../state'
import type { TdLayout, TdWidgetData, TPageState } from '../types'
import { addWidget } from './widget'

/** The drawn shapes, which all keep their fill in `color`. */
const SHAPE_TYPES = new Set(['w-rect', 'w-ellipse', 'w-polygon', 'w-path'])

function carriesText(widget: TdWidgetData): widget is TdWidgetData & { text: string } {
  return widget.type === 'w-text' && typeof widget.text === 'string'
}

// ---- one colour onto the selection ------------------------------------------

/**
 * Paints whatever is selected in one brand colour: the words of a text box,
 * the fill of a shape, the first colour of a piece of line art, or the page
 * itself when nothing is selected. A group takes it on every member; a
 * marquee selection takes it on each thing in it. Returns how many things
 * changed, so the caller can say when the answer is none — a photograph,
 * say, which has no colour of its own to change.
 */
export function applyBrandColorToSelection(color: string): number {
  // Nothing has been clicked yet on a design just opened, so dActiveElement is
  // still null rather than the page. That is the same "nothing is selected" the
  // page stands for everywhere else, so treat it as the page.
  const active = widgetState.dActiveElement ?? canvasState.dPage
  const selected = widgetState.dSelectWidgets
  const targets: TdWidgetData[] = selected.length ? selected.slice() : [active]
  if (targets.length === 0) return 0

  let changed = 0
  for (const target of targets) {
    if (target.uuid === '-1') {
      updatePageData({ key: 'backgroundColor', value: color })
      updatePageData({ key: 'backgroundGradient', value: '' })
      changed++
      continue
    }
    const members = target.isContainer ? widgetState.dWidgets.filter((item) => item.parent === target.uuid) : [target]
    for (const member of members) {
      // The selection holds snapshots of the widgets as often as the widgets
      // themselves; paint the one the store holds.
      const widget = widgetState.dWidgets.find((item) => item.uuid === member.uuid)
      if (widget && paintWidget(widget, color)) changed++
    }
  }
  return changed
}

function paintWidget(widget: TdWidgetData, color: string): boolean {
  if (widget.type === 'w-text') {
    const effects = (widget as any).textEffects
    if (effects?.length) {
      ;(widget as any).textEffects = recolorEffects(JSON.parse(JSON.stringify(effects)), (widget as any).color, color)
    }
    ;(widget as any).color = color
    return true
  }
  if (SHAPE_TYPES.has(widget.type)) {
    ;(widget as any).color = color
    return true
  }
  if (widget.type === 'w-svg') {
    const colors: string[] = Array.isArray((widget as any).colors) ? (widget as any).colors.slice() : []
    colors[0] = color
    ;(widget as any).colors = colors
    return true
  }
  return false
}

// ---- a field or the logo onto the page ---------------------------------------

/**
 * Puts a `{{school.*}}` field where it will be read: on the end of the text
 * box that is selected, or into a new text box in the middle of the page when
 * none is. Says which it did.
 */
export function insertBrandField(field: string): 'appended' | 'added' {
  const token = `{{${field}}}`
  const active = widgetState.dActiveElement
  const widget = active && active.uuid !== '-1' ? widgetState.dWidgets.find((item) => item.uuid === active.uuid) : undefined
  if (widget && carriesText(widget) && !widget.hidden) {
    const text = widget.text
    const needsSpace = text.length > 0 && !/(\s|&nbsp;|>)$/.test(text)
    widget.text = text + (needsSpace ? ' ' : '') + token
    return 'appended'
  }

  const setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = token
  setting.fontSize = 32
  const { width: pW, height: pH } = canvasState.dPage
  setting.width = Math.round(Math.min(setting.fontSize * 0.55 * token.length, pW * 0.8))
  setting.left = Math.round((pW - setting.width) / 2)
  setting.top = Math.round((pH - setting.fontSize * setting.lineHeight) / 2)
  addWidget(setting)
  return 'added'
}

/**
 * Puts the logo on the page as a picture, a fifth of the page wide — big
 * enough to read on a poster, small enough to sit in a corner of a slide —
 * and no bigger than the file itself, so a small crest is not blown up soft.
 */
export function insertBrandLogo(logo: NonNullable<TBrandKit['logo']>) {
  const { width: pW, height: pH } = canvasState.dPage
  const ratio = logo.width && logo.height ? logo.width / logo.height : 1
  let width = Math.round(pW * 0.2)
  let height = Math.round(width / ratio)
  if (height > pH * 0.2) {
    height = Math.round(pH * 0.2)
    width = Math.round(height * ratio)
  }
  if (logo.width && width > logo.width) {
    width = logo.width
    height = logo.height
  }
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  setting.imgUrl = logo.url
  setting.width = width
  setting.height = height
  setting.left = Math.round((pW - width) / 2)
  setting.top = Math.round((pH - height) / 2)
  addWidget(setting)
}

// ---- the whole kit onto the whole design -------------------------------------

export type TApplyBrandOptions = {
  fields: boolean
  fonts: boolean
  colors: boolean
}

export type TApplyBrandOutcome = {
  /** Text boxes whose fields were filled, and how many pages they were on. */
  filled: number
  fieldPages: number
  /** School fields that had nothing to fill them and were left standing. */
  unresolved: number
  /** Text boxes moved onto a brand font. */
  fonts: number
  /** Layers and page backgrounds repainted. */
  recoloured: number
  backgrounds: number
  /** What the readability guard had to do afterwards. See `ensureReadable`. */
  readability: TReadabilityCounts
}

/**
 * How big text has to be to count as a heading, on a given page.
 *
 * Four and a half per cent of the page's shorter side: 49px on a slide, 57px
 * on Letter paper at 150dpi. A fixed pixel size would call every line on a
 * poster a heading and nothing on a slide one, and a smaller fraction is no
 * better — at three per cent half the text in the bundled packs comes out a
 * heading, including the body copy of every poster. Bold text is a heading at
 * any size, which is what catches a table header or a run-in label.
 */
export function headingThreshold(page: Pick<TPageState, 'width' | 'height'>): number {
  return Math.round(Math.min(page.width, page.height) * 0.045)
}

function isBold(widget: TdWidgetData): boolean {
  const weight = (widget as any).fontWeight
  return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600
}

function fontClassOf(font: TFontItem) {
  const { id, oid, value, url, alias, preview } = font
  return { id, oid, value, url, alias, preview }
}

function setFont(widget: TdWidgetData, font: TFontItem): boolean {
  if (widget.fontClass?.value === font.value) return false
  widget.fontClass = fontClassOf(font)
  ;(widget as any).fontFamily = font.value
  return true
}

/** `#rrggbb` or `#rrggbbaa`, split; null for anything else, gradients included. */
function parseHex(value: unknown): { rgb: string; alpha: string } | null {
  if (typeof value !== 'string') return null
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(value.trim())
  return match ? { rgb: match[1].toLowerCase(), alpha: (match[2] || 'ff').toLowerCase() } : null
}

/**
 * Whether a colour is one of the design's neutrals: the whites, the blacks
 * and the greys, and the near-enough of each. Those are left alone — a brand
 * kit says what the school's colours are, not what colour the paper is.
 */
export function isNeutralColor(rgb: string): boolean {
  const r = parseInt(rgb.slice(0, 2), 16)
  const g = parseInt(rgb.slice(2, 4), 16)
  const b = parseInt(rgb.slice(4, 6), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2 / 255
  return max - min < 28 || lightness > 0.94 || lightness < 0.1
}

type TColorSlot = {
  kind: 'layer' | 'page'
  read: () => unknown
  write: (value: string) => void
}

/**
 * The slots one painted property is worth.
 *
 * A flat colour is one. A gradient is one per stop, because the two ends of a
 * band are two of the design's colours and following only the first would
 * leave a stripe of the old palette running through the new one. Which it is
 * is decided as the slots are gathered, so a slot never has to answer for both.
 */
function paintSlots(kind: TColorSlot['kind'], read: () => unknown, write: (value: string) => void): TColorSlot[] {
  const value = read()
  if (typeof value !== 'string' || !isGradient(value)) return [{ kind, read, write }]
  const parsed = parseGradient(value)
  if (!parsed) return []
  return parsed.stops.map((_, index) => ({
    kind,
    read: () => parseGradient(String(read() ?? ''))?.stops[index]?.color,
    // Re-read rather than closed over, so two stops of the same gradient can
    // both be repainted in one pass without the second undoing the first.
    write: (color: string) => {
      const current = parseGradient(String(read() ?? ''))
      if (!current) return
      const stops = current.stops.map((stop, at) => (at === index ? { ...stop, color } : stop))
      write(toGradientString(current.type, current.angle, stops))
    },
  }))
}

/**
 * The colours an effect stack paints that are not the text's own — the second
 * tone of a check, the middle band of a retro gradient. The text's own colour
 * is carried through the stack by the `color` slot below, so listing it here
 * as well would repaint it twice.
 */
function effectSlots(layer: any): TColorSlot[] {
  return effectColors(layer.textEffects, layer.color).map((entry) => ({
    kind: 'layer' as const,
    read: () => entry.value,
    write: (value: string) => {
      layer.textEffects = recolorEffects(JSON.parse(JSON.stringify(layer.textEffects)), entry.value, value)
    },
  }))
}

/** Every place a colour is painted, across the whole design. */
function colorSlots(layouts: TdLayout[]): TColorSlot[] {
  const slots: TColorSlot[] = []
  for (const layout of layouts) {
    const page = layout.global as any
    // A picture over the page hides whatever is under it, so neither the flat
    // colour nor the gradient is one of the design's colours while it is there.
    if (!page.backgroundImage) {
      if (page.backgroundGradient) {
        slots.push(...paintSlots('page', () => page.backgroundGradient, (value) => (page.backgroundGradient = value)))
      } else {
        slots.push(...paintSlots('page', () => page.backgroundColor, (value) => (page.backgroundColor = value)))
      }
    }
    for (const layer of layout.layers as any[]) {
      if (layer.type === 'w-text') {
        slots.push(...paintSlots('layer', () => layer.color, (value) => paintTextColor(layer, value)))
        slots.push(...effectSlots(layer))
      } else if (SHAPE_TYPES.has(layer.type)) {
        slots.push(...paintSlots('layer', () => layer.color, (value) => (layer.color = value)))
      } else if (layer.type === 'w-svg' && Array.isArray(layer.colors)) {
        layer.colors.forEach((_: unknown, index: number) => {
          slots.push(
            ...paintSlots(
              'layer',
              () => layer.colors[index],
              (value) => {
                const next = layer.colors.slice()
                next[index] = value
                layer.colors = next
              },
            ),
          )
        })
      }
      // An outline is a colour of the design wherever there is one to see; a
      // design saved before outlines existed has neither key at all.
      if (Number(layer.borderWidth) > 0 && layer.borderColor) {
        slots.push(...paintSlots('layer', () => layer.borderColor, (value) => (layer.borderColor = value)))
      }
    }
  }
  return slots
}

/** A text box's colour, and every part of its effect stack that was following it. */
function paintTextColor(layer: any, value: string) {
  const effects = layer.textEffects
  if (Array.isArray(effects) && effects.length) {
    layer.textEffects = recolorEffects(JSON.parse(JSON.stringify(effects)), layer.color, value)
  }
  layer.color = value
}

/**
 * The design's colours, most used first, neutrals left out. Counted by the
 * places they are painted rather than by area: the colour a design is "in"
 * is the one it reaches for most often, not the one on its biggest shape.
 */
export function rankDesignColors(layouts: TdLayout[]): string[] {
  const counts = new Map<string, number>()
  for (const slot of colorSlots(layouts)) {
    const parsed = parseHex(slot.read())
    if (!parsed || isNeutralColor(parsed.rgb)) continue
    counts.set(parsed.rgb, (counts.get(parsed.rgb) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([rgb]) => rgb)
}

/**
 * Where one colour is already painted, so the Brand panel can say what
 * changing it would touch before it is changed. Transparency is ignored: a
 * wash of the school's navy at 7% is still the school's navy.
 */
export function countColorUsage(layouts: TdLayout[], color: string): { layers: number; pages: number } {
  const target = parseHex(color)
  if (!target) return { layers: 0, pages: 0 }
  let layers = 0
  let pages = 0
  for (const layout of layouts) {
    let here = 0
    for (const slot of colorSlots([layout])) {
      const parsed = parseHex(slot.read())
      if (!parsed || parsed.rgb !== target.rgb) continue
      here++
      if (slot.kind === 'layer') layers++
    }
    if (here) pages++
  }
  return { layers, pages }
}

// ---- keeping the words readable ---------------------------------------------

/**
 * What can be the paper under a line of text: the drawn shapes and a piece of
 * line art. A photograph is deliberately not one of them — a picture has no
 * one colour, so text over it is left exactly as the designer set it.
 */
const SURFACE_TYPES = new Set([...SHAPE_TYPES, 'w-svg'])

type TBounds = { left: number; top: number; right: number; bottom: number }

function boundsOf(layer: TdWidgetData): TBounds {
  const left = Number(layer.left) || 0
  const top = Number(layer.top) || 0
  return { left, top, right: left + (Number(layer.width) || 0), bottom: top + (Number(layer.height) || 0) }
}

function holds(box: TBounds, x: number, y: number): boolean {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
}

function holdsAll(outer: TBounds, inner: TBounds): boolean {
  return outer.left <= inner.left && outer.top <= inner.top && outer.right >= inner.right && outer.bottom >= inner.bottom
}

/**
 * Where a layer sits in the stack, as a pair.
 *
 * Z-order is array order, except that a group draws its members inside itself:
 * a shape in a group that is early in the list is under everything the group is
 * under, whatever index the shape itself has. So the first number is where the
 * layer's group sits among the page's layers, and the second is where the layer
 * sits inside it. Comparing the pairs in order is comparing what is on top.
 */
function stackKeys(layers: TdWidgetData[]): number[][] {
  const at = new Map<string, number>()
  layers.forEach((layer, index) => at.set(layer.uuid, index))
  return layers.map((layer, index) => {
    const parent = layer.parent ? at.get(layer.parent) : undefined
    return [parent === undefined ? index : parent, index]
  })
}

function above(a: number[], b: number[]): boolean {
  return a[0] !== b[0] ? a[0] > b[0] : a[1] > b[1]
}

/** The one colour a layer paints, flat: a shape's fill, or the first colour of line art. */
function paintOf(layer: TdWidgetData): unknown {
  if (SHAPE_TYPES.has(layer.type)) return (layer as any).color
  if (layer.type === 'w-svg') return Array.isArray((layer as any).colors) ? (layer as any).colors[0] : undefined
  return undefined
}

/** What a text box turns out to be sitting on: the colour a reader sees, and the paint it came from. */
type TSurface = {
  /** Opaque, with anything translucent already composited over what is behind it. */
  color: string
  /** The paint as it is stored, so the caller can tell whether the brand pass put it there. */
  rgb: string
}

/**
 * What a layer is drawn on top of, or null for "no idea".
 *
 * The topmost thing below it whose bounds hold its centre, which is the same
 * rough answer a person gives when asked what a headline is sitting on. Bounds
 * rather than the artwork itself: a piece of line art is a path inside a box
 * and following the path would mean rasterising it, while the templates that
 * matter here paint bands and washes that fill their boxes.
 *
 * Null is the honest answer over a photograph, over a gradient and over a page
 * with a picture for a background — none of those has one colour to be read
 * against — and the guard leaves anything it cannot see under alone rather
 * than repainting on a guess.
 */
function surfaceUnder(index: number, layers: TdWidgetData[], keys: number[][], backdrop: TSurface | null): TSurface | null {
  const box = boundsOf(layers[index])
  const x = (box.left + box.right) / 2
  const y = (box.top + box.bottom) / 2

  let covering: TdWidgetData | null = null
  let coveringKey: number[] | null = null
  for (let at = 0; at < layers.length; at++) {
    const other = layers[at]
    if (at === index || other.hidden || other.isContainer) continue
    if (!above(keys[index], keys[at])) continue
    if (coveringKey && !above(keys[at], coveringKey)) continue
    if (!holds(boundsOf(other), x, y)) continue
    covering = other
    coveringKey = keys[at]
  }

  if (!covering) return backdrop
  if (!SURFACE_TYPES.has(covering.type)) return null
  const parsed = parseHex(paintOf(covering))
  if (!parsed) return null
  // A shape painted at nothing at all is not what the text is read against,
  // but neither is it something to give up over — fall through to the page.
  if (parsed.alpha === '00') return backdrop
  if (!backdrop) return null
  return { color: composite(`#${parsed.rgb}${parsed.alpha}`, backdrop.color), rgb: parsed.rgb }
}

/** The page itself as a surface, or null when a picture or a gradient is on it. */
function pageSurface(page: TPageState): TSurface | null {
  if (page.backgroundImage || page.backgroundGradient) return null
  const parsed = parseHex(page.backgroundColor)
  if (!parsed) return null
  return { color: composite(`#${parsed.rgb}${parsed.alpha}`, PAPER), rgb: parsed.rgb }
}

/**
 * How dark a neutral has to be before a design can be said to set text in it.
 * A pale grey caption is a neutral, and it is not the ink.
 */
const INK_LUMINANCE = 0.5

/**
 * The darkest neutral a design already sets text in — its ink. Reaching for
 * the template's own near-black rather than for pure black is what keeps a
 * rescued headline looking like it belongs to the rest of the poster; a design
 * whose only neutrals are pale, which is every slide set in white on a dark
 * band, has no ink of its own and gets black.
 */
function inkOf(layers: TdWidgetData[]): string {
  let ink: string | null = null
  let darkest = INK_LUMINANCE
  for (const layer of layers) {
    if (layer.type !== 'w-text') continue
    const parsed = parseHex((layer as any).color)
    if (!parsed || !isNeutralColor(parsed.rgb)) continue
    const luminance = relativeLuminance(`#${parsed.rgb}`)
    if (luminance < darkest) {
      ink = `#${parsed.rgb}ff`
      darkest = luminance
    }
  }
  return ink ?? INK
}

export type TReadabilityCounts = {
  /** Text boxes whose own colour was moved, keeping its hue, until it could be read. */
  adjusted: number
  /** Text boxes swapped between the paper and the ink, because moving them was not the answer. */
  swapped: number
  /** Text boxes that could not be got to the target, and were left as legible as they could be. */
  unreadable: number
  /** Decorative marks nudged off a band they had disappeared into. */
  marks: number
}

export function noReadabilityCounts(): TReadabilityCounts {
  return { adjusted: 0, swapped: 0, unreadable: 0, marks: 0 }
}

/**
 * Puts back the contrast the recolour took away.
 *
 * Swapping a template's colours for the school's is a swap of hues, and hues
 * carry lightness with them. The Field Day poster is a white headline on a
 * navy band and a navy sub-heading on cream; a school whose primary is a pale
 * yellow gets a white headline on pale yellow — which is nothing — and a pale
 * yellow sub-heading on cream, which is nearly nothing. Neither is a bug in
 * the template or in the kit. It is what happens when two independent choices
 * meet, and it has to be repaired afterwards rather than prevented.
 *
 * So: every text box that the colour pass either painted or moved the ground
 * out from under is checked against WCAG's targets for its size, and the two
 * repairs are the two the situation allows. Text that was a neutral — white on
 * a band — swaps to whichever of the paper and the ink can be read, because a
 * white headline made grey is neither. Text in one of the school's own colours
 * is darkened or lightened in its own hue until it passes, because that keeps
 * the design in the school's colours; only if that cannot reach the target
 * does it fall back to ink or paper.
 *
 * Nothing else is touched. Text over a photograph, over a gradient or over
 * anything this cannot see under is left as it was drawn, and the colours a
 * text effect brought with it — the second tone of a check, a white outline —
 * stay as they are; only the parts of the stack that were following the text's
 * own colour follow it here too.
 */
export function ensureReadable(layers: TdWidgetData[], page: TPageState, kit: TBrandKit): TReadabilityCounts {
  const counts = noReadabilityCounts()
  const brandRgbs = new Set<string>()
  for (const color of kit.colors) {
    const parsed = parseHex(color)
    if (parsed) brandRgbs.add(parsed.rgb)
  }
  if (!brandRgbs.size) return counts

  const ink = inkOf(layers)
  const keys = stackKeys(layers)
  const backdrop = pageSurface(page)

  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index]
    if (layer.type !== 'w-text' || layer.hidden) continue
    const text = parseHex((layer as any).color)
    if (!text) continue
    const surface = surfaceUnder(index, layers, keys, backdrop)
    if (!surface) continue
    // Only what the pass reached: either the words are now one of the school's
    // colours, or the ground under them is. A line of black on cream that the
    // recolour never came near is none of this function's business.
    const surfaceIsBrand = brandRgbs.has(surface.rgb)
    const textIsBrand = brandRgbs.has(text.rgb)
    if (!surfaceIsBrand && !textIsBrand) continue

    const target = contrastTarget(Number((layer as any).fontSize) || 0, isBold(layer), page)
    const shown = composite(`#${text.rgb}${text.alpha}`, surface.color)
    if (contrastRatio(shown, surface.color) >= target) continue

    // The colour it is now is always in the running, and first, so a repair
    // can only ever make a line easier to read than it was. `readableOn` gives
    // ties to the earlier candidate.
    const was = `#${text.rgb}${text.alpha}`

    if (isNeutralColor(text.rgb)) {
      const pick = readableOn(surface.color, [was, PAPER, ink])
      if (pick !== was) {
        paintTextColor(layer, `#${parseHex(pick)!.rgb}${text.alpha}`)
        counts.swapped++
      }
      if (contrastRatio(pick, surface.color) < target) counts.unreadable++
      continue
    }

    const moved = adjustForContrast(was, surface.color, target)
    if (moved.met) {
      if (moved.changed) {
        paintTextColor(layer, moved.color)
        counts.adjusted++
      }
      continue
    }
    // The school's own colour could not be got there in its own hue. Fall back
    // to whichever of the paper, the ink and the furthest it managed reads
    // best — sometimes that is still the darkened school colour.
    const pick = readableOn(surface.color, [moved.color, PAPER, ink])
    if (pick === moved.color) {
      if (moved.changed) {
        paintTextColor(layer, moved.color)
        counts.adjusted++
      }
    } else {
      paintTextColor(layer, `#${parseHex(pick)!.rgb}${text.alpha}`)
      counts.swapped++
    }
    if (contrastRatio(pick, surface.color) < target) counts.unreadable++
  }

  counts.marks = separateMarks(layers, keys, backdrop, brandRgbs)
  return counts
}

/**
 * The decorative case, kept deliberately small.
 *
 * A rule, a bullet or a badge in the school's second colour, drawn wholly
 * inside a band in its first, vanishes when the two colours turn out to be
 * neighbours. Only that shape of it is repaired — one brand-coloured shape
 * entirely within another, and only when the two are near enough to be the
 * same colour at a glance — because anything looser starts repainting artwork
 * that was drawn tone-on-tone on purpose.
 */
function separateMarks(layers: TdWidgetData[], keys: number[][], backdrop: TSurface | null, brandRgbs: Set<string>): number {
  if (!backdrop) return 0
  let nudged = 0
  for (let index = 0; index < layers.length; index++) {
    const layer = layers[index]
    if (layer.hidden || !SURFACE_TYPES.has(layer.type)) continue
    const paint = parseHex(paintOf(layer))
    if (!paint || !brandRgbs.has(paint.rgb)) continue
    const box = boundsOf(layer)

    let ground = ''
    let hostKey: number[] | null = null
    for (let at = 0; at < layers.length; at++) {
      const other = layers[at]
      if (at === index || other.hidden || !SURFACE_TYPES.has(other.type)) continue
      if (!above(keys[index], keys[at]) || (hostKey && !above(keys[at], hostKey))) continue
      if (!holdsAll(boundsOf(other), box)) continue
      const under = parseHex(paintOf(other))
      if (!under || !brandRgbs.has(under.rgb) || under.alpha === '00') continue
      ground = composite(`#${under.rgb}${under.alpha}`, backdrop.color)
      hostKey = keys[at]
    }
    if (!ground) continue

    const mark = composite(`#${paint.rgb}${paint.alpha}`, ground)
    if (contrastRatio(mark, ground) >= 1.5) continue
    const moved = adjustForContrast(`#${paint.rgb}${paint.alpha}`, ground, DECORATIVE_TARGET)
    if (!moved.changed) continue
    if (SHAPE_TYPES.has(layer.type)) (layer as any).color = moved.color
    else (layer as any).colors = [moved.color, ...(((layer as any).colors as string[]) || []).slice(1)]
    nudged++
  }
  return nudged
}

/**
 * Pushes the kit onto every page.
 *
 * Fields first, then fonts, then colours, each only if asked. The colour pass
 * maps the design's colours to the brand's in order — its most-used to the
 * primary, its second to the second — and keeps each place's own alpha, so a
 * wash that was the old navy at 7% comes out as the new blue at 7%.
 */
export function applyBrandToDesign(kit: TBrandKit, options: TApplyBrandOptions): TApplyBrandOutcome {
  const outcome: TApplyBrandOutcome = { filled: 0, fieldPages: 0, unresolved: 0, fonts: 0, recoloured: 0, backgrounds: 0, readability: noReadabilityCounts() }
  const layouts = widgetState.dLayouts

  if (options.fields) {
    const resolve = brandResolver(kit)
    const pages = new Set<number>()
    layouts.forEach((layout, index) => {
      for (const layer of layout.layers) {
        if (!carriesText(layer) || !hasFields(layer.text)) continue
        const next = fillText(layer.text, resolve)
        if (next === layer.text) continue
        layer.text = next
        outcome.filled++
        pages.add(index)
      }
    })
    outcome.fieldPages = pages.size
    outcome.unresolved = fieldsInLayers(layouts.flatMap((layout) => layout.layers)).filter(isBrandField).length
  }

  const heading = brandFont(kit.fonts.heading)
  const body = brandFont(kit.fonts.body)
  if (options.fonts && (heading || body)) {
    for (const layout of layouts) {
      const threshold = headingThreshold(layout.global)
      for (const layer of layout.layers) {
        if (!carriesText(layer)) continue
        const isHeading = isBold(layer) || Number((layer as any).fontSize) >= threshold
        const font = isHeading ? heading || body : body || heading
        if (font && setFont(layer, font)) outcome.fonts++
      }
    }
  }

  if (options.colors && kit.colors.length) {
    const ranked = rankDesignColors(layouts).slice(0, kit.colors.length)
    const mapping = new Map<string, string>()
    ranked.forEach((rgb, index) => {
      const brand = parseHex(kit.colors[index])
      if (brand && brand.rgb !== rgb) mapping.set(rgb, brand.rgb)
    })
    if (mapping.size) {
      for (const slot of colorSlots(layouts)) {
        const parsed = parseHex(slot.read())
        const to = parsed && mapping.get(parsed.rgb)
        if (!parsed || !to) continue
        slot.write(`#${to}${parsed.alpha}`)
        if (slot.kind === 'page') outcome.backgrounds++
        else outcome.recoloured++
      }
      // Once the page is in the school's colours, and not before: what a line
      // has to be read against is what is under it afterwards.
      for (const layout of layouts) {
        const counts = ensureReadable(layout.layers, layout.global, kit)
        outcome.readability.adjusted += counts.adjusted
        outcome.readability.swapped += counts.swapped
        outcome.readability.unreadable += counts.unreadable
        outcome.readability.marks += counts.marks
      }
    }
  }

  return outcome
}

/** The outcome as a sentence for the notification. */
export function describeBrandOutcome(outcome: TApplyBrandOutcome): string {
  const parts: string[] = []
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  if (outcome.filled) {
    parts.push(`Filled ${plural(outcome.filled, 'text box', 'text boxes')} on ${plural(outcome.fieldPages, 'page', 'pages')}`)
  }
  if (outcome.fonts) parts.push(`set ${plural(outcome.fonts, 'text box', 'text boxes')} in the brand fonts`)
  if (outcome.recoloured || outcome.backgrounds) {
    const bits = []
    if (outcome.recoloured) bits.push(plural(outcome.recoloured, 'layer', 'layers'))
    if (outcome.backgrounds) bits.push(plural(outcome.backgrounds, 'page background', 'page backgrounds'))
    parts.push(`recoloured ${bits.join(' and ')}`)
  }
  // Said out loud because it is a change nobody asked for: the kit's colour is
  // on the page, but not on the two lines it would have hidden.
  const rescued = outcome.readability.adjusted + outcome.readability.swapped
  if (rescued) parts.push(`${plural(rescued, 'line', 'lines')} adjusted to stay readable`)
  let text = parts.length ? parts.join(', ') + '.' : 'Nothing needed changing.'
  if (outcome.unresolved) {
    text += ` ${plural(outcome.unresolved, 'field is', 'fields are')} still waiting for a detail the kit does not have.`
  }
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ---- the kit onto a template as it lands -------------------------------------

export type TTemplateBrandResult = {
  layers: TdWidgetData[]
  page: TPageState
  /** Places repainted, the page background among them. */
  recoloured: number
  /** Text boxes moved onto one of the kit's fonts. */
  fonts: number
  /** What the readability guard had to do afterwards. See `ensureReadable`. */
  readability: TReadabilityCounts
}

/**
 * A template in the school's colours and fonts, as it lands.
 *
 * Apply brand has to guess which of a design's colours is the main one, by
 * counting where each is painted, because a design made before the kit never
 * said. A template can say: its `brand` block names which of its own colours
 * plays which role, so the answer is looked up rather than ranked, and adding
 * the same template twice gives the same design both times. Each place keeps
 * its own transparency, so a wash of the template's navy at 7% comes out as
 * the school's first colour at 7%.
 *
 * Pure: the layers and the page given are read and never written, and what
 * comes back is a copy — the template object the API returned is shared with
 * whatever cached it, and the kit belongs to the Brand panel. When there is
 * nothing to do the same objects come back, so a caller can tell by identity.
 */
export function applyTemplateBrand(layers: TdWidgetData[], page: TPageState, brand: TTemplateBrand | undefined, kit: TBrandKit): TTemplateBrandResult {
  const unchanged: TTemplateBrandResult = { layers, page, recoloured: 0, fonts: 0, readability: noReadabilityCounts() }
  // `keep` is the template whose palette and lettering are the point of it —
  // the fields still fill, which is what the caller does either side of here.
  if (!brand || brand.keep) return unchanged

  // The block names colours the way a designer would write them down: six hex
  // digits, no hash, no alpha. Neutrals are never listed, so nothing here has
  // to leave the paper alone — saying a colour has a role is saying it is not
  // the paper.
  const mapping = new Map<string, string>()
  for (const [hex, role] of Object.entries(brand.colors || {})) {
    const from = parseHex(`#${String(hex).replace(/^#/, '')}`)
    const index = brandRoleIndex(role)
    // A role the kit has no colour for leaves the template's own colour alone,
    // which is what makes a three-colour template safe on a one-colour kit.
    const to = index >= 0 ? parseHex(kit.colors[index]) : null
    if (from && to && from.rgb !== to.rgb) mapping.set(from.rgb, to.rgb)
  }

  const heading = brandFont(kit.fonts.heading)
  const body = brandFont(kit.fonts.body)
  if (!mapping.size && !heading && !body) return unchanged

  const copy: TdLayout = JSON.parse(JSON.stringify({ global: page, layers }))
  let recoloured = 0
  let fonts = 0

  if (mapping.size) {
    for (const slot of colorSlots([copy])) {
      const parsed = parseHex(slot.read())
      const to = parsed && mapping.get(parsed.rgb)
      if (!parsed || !to) continue
      slot.write(`#${to}${parsed.alpha}`)
      recoloured++
    }
  }

  if (heading || body) {
    const threshold = headingThreshold(copy.global)
    for (const layer of copy.layers) {
      if (!carriesText(layer)) continue
      const role = layer.brandRole
      if (role === 'keep') continue
      const wantsHeading = role ? role === 'heading' : isBold(layer) || Number((layer as any).fontSize) >= threshold
      // No falling back to the other font, which is where this parts company
      // with Apply brand: a kit that named only a body font has said nothing
      // about headings, and putting the body face on them would undo the
      // pairing the template was drawn with.
      const font = wantsHeading ? heading : body
      if (font && setFont(layer, font)) fonts++
    }
  }

  // Only after a recolour: a template landing in its own colours is as its
  // designer left it, and second-guessing that would be this guard's job
  // creeping into the artwork.
  const readability = mapping.size ? ensureReadable(copy.layers, copy.global, kit) : noReadabilityCounts()

  return { layers: copy.layers, page: copy.global, recoloured, fonts, readability }
}
