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

/**
 * Pushes the kit onto every page.
 *
 * Fields first, then fonts, then colours, each only if asked. The colour pass
 * maps the design's colours to the brand's in order — its most-used to the
 * primary, its second to the second — and keeps each place's own alpha, so a
 * wash that was the old navy at 7% comes out as the new blue at 7%.
 */
export function applyBrandToDesign(kit: TBrandKit, options: TApplyBrandOptions): TApplyBrandOutcome {
  const outcome: TApplyBrandOutcome = { filled: 0, fieldPages: 0, unresolved: 0, fonts: 0, recoloured: 0, backgrounds: 0 }
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
  const unchanged: TTemplateBrandResult = { layers, page, recoloured: 0, fonts: 0 }
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

  return { layers: copy.layers, page: copy.global, recoloured, fonts }
}
