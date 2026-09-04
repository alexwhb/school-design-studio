/**
 * The brand kit itself: what is in one, what its colours mean, and how it
 * answers a `{{school.*}}` field.
 *
 * Pure on purpose. `brandKit.ts` beside this holds the editor's live kit and
 * writes it to the browser, both of which need valtio and IndexedDB; the
 * compose entry runs on a server and needs none of that, only the rules. So the
 * rules are here and the storage is there, and `brandKit.ts` re-exports every
 * name below so nothing that already imported one has to change.
 */
import fonts, { type TFontItem } from '@/assets/data/FontsData'
import { fieldKey, valuesResolver, type TFieldResolver } from '@/utils/mergeFieldsCore'

export type TBrandLogo = {
  /** A data URL, like an upload, so it survives being saved into a design. */
  url: string
  width: number
  height: number
}

export type TBrandFonts = {
  /** Font ids from FontsData; absent means "not chosen". */
  heading?: number
  body?: number
}

export type TBrandKit = {
  name: string
  shortName: string
  tagline: string
  address: string
  phone: string
  email: string
  website: string
  logo?: TBrandLogo
  /** Ordered: the first is the primary. No more than MAX_BRAND_COLORS. */
  colors: string[]
  fonts: TBrandFonts
}

/** As many as there are roles a template can name; see `BRAND_ROLES`. */
export const MAX_BRAND_COLORS = 8

/** The written details, which are also the merge fields. */
export const BRAND_DETAIL_KEYS = ['name', 'shortName', 'tagline', 'address', 'phone', 'email', 'website'] as const
export type TBrandDetailKey = (typeof BRAND_DETAIL_KEYS)[number]

/** Each field as it is typed into a text box, the detail it reads, and what to call it. */
export const BRAND_FIELDS: { field: string; key: TBrandDetailKey; label: string }[] = [
  { field: 'school.name', key: 'name', label: 'School name' },
  { field: 'school.short_name', key: 'shortName', label: 'Short name' },
  { field: 'school.tagline', key: 'tagline', label: 'Tagline' },
  { field: 'school.address', key: 'address', label: 'Address' },
  { field: 'school.phone', key: 'phone', label: 'Phone' },
  { field: 'school.email', key: 'email', label: 'Email' },
  { field: 'school.website', key: 'website', label: 'Website' },
]

/**
 * What a field reads as for someone who has not set up a kit. These are the
 * strings the bundled templates used to carry outright, so with no kit a
 * template looks exactly as it did before it carried fields.
 */
export const SAMPLE_BRAND: Record<TBrandDetailKey, string> = {
  name: 'Springfield Elementary',
  shortName: 'Springfield',
  tagline: 'Learning together',
  address: '100 School Street, Springfield',
  phone: '(555) 010-2200',
  email: 'office@springfield.k12.us',
  website: 'springfield.k12.us',
}

export function emptyBrandKit(): TBrandKit {
  return { name: '', shortName: '', tagline: '', address: '', phone: '', email: '', website: '', colors: [], fonts: {} }
}

/** Whether any of the written details has been filled in. */
export function hasBrandDetails(kit: TBrandKit): boolean {
  return BRAND_DETAIL_KEYS.some((key) => (kit[key] || '').trim() !== '')
}

/** Whether there is anything in the kit at all for Apply brand to apply. */
export function hasBrandContent(kit: TBrandKit): boolean {
  return hasBrandDetails(kit) || kit.colors.length > 0 || !!kit.fonts.heading || !!kit.fonts.body
}

// ---- colours ---------------------------------------------------------------

/**
 * A colour as the editor stores one: `#rrggbbaa`, lower case. Accepts the
 * three shorter spellings too, and refuses anything that is not a flat hex
 * colour — a gradient is not a brand colour.
 */
export function normaliseBrandColor(value: string): string | null {
  const hex = String(value || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase()
  if (!/^[0-9a-f]+$/.test(hex)) return null
  if (hex.length === 3) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}ff`
  if (hex.length === 6) return `#${hex}ff`
  if (hex.length === 8) return `#${hex}`
  return null
}

/**
 * What one of a template's own colours is *for*.
 *
 * A template that says which of its colours is the primary, which the
 * secondary and which the accent can be recoloured the moment it is added,
 * without guessing: the school's first colour goes wherever the template said
 * primary, at whatever transparency that place was painted at. The names run
 * out at eight because the kit holds eight, and they are positions rather than
 * descriptions for the same reason `brandColorRole` is — "primary" is the
 * first colour of the kit, not a shade of blue.
 */
export const BRAND_ROLES = ['primary', 'secondary', 'accent', 'colour4', 'colour5', 'colour6', 'colour7', 'colour8'] as const
export type TBrandRole = (typeof BRAND_ROLES)[number]

/**
 * The `brand` block a template file carries beside its `data`. Keys are the
 * template's colours as lower case six-digit hex without `#` and without
 * alpha; every place one of them is painted follows its role's kit colour.
 * `keep` is the opt-out for a design whose palette and fonts are the point.
 */
export type TTemplateBrand = {
  colors: Record<string, TBrandRole>
  keep?: boolean
}

/** Which of the kit's ordered colours a role asks for, or -1 for a name nobody defined. */
export function brandRoleIndex(role: string): number {
  return BRAND_ROLES.indexOf(String(role || '').toLowerCase() as TBrandRole)
}

/**
 * What to call the nth colour of the kit.
 *
 * The kit stores an order, not names: the first colour is the school's main
 * one everywhere it is used, so the label follows the position rather than
 * being typed in and then left behind when the order changes.
 */
export function brandColorRole(index: number): string {
  if (index === 0) return 'Primary'
  if (index === 1) return 'Secondary'
  return `Colour ${index + 1}`
}

/**
 * A one-word name for a colour — navy, gold, paper — so two blues in a list
 * can be told apart at a glance without reading their hexes. It is the
 * nearest common name for the hue, not a match, and it is only ever shown
 * beside the swatch it describes.
 */
export function brandColorTone(color: string): string {
  const hex = (normaliseBrandColor(color) || '').slice(1, 7)
  if (hex.length !== 6) return ''
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const span = max - min
  if (span < 0.09) {
    if (lightness > 0.9) return 'paper'
    if (lightness < 0.12) return 'ink'
    return 'grey'
  }
  const saturation = span / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === r) hue = ((g - b) / span) % 6
  else if (max === g) hue = (b - r) / span + 2
  else hue = (r - g) / span + 4
  hue = (hue * 60 + 360) % 360
  const dark = lightness < 0.32
  const pale = lightness > 0.8 && saturation < 0.6
  if (hue < 15 || hue >= 345) return dark ? 'maroon' : 'red'
  if (hue < 35) return dark ? 'brown' : 'orange'
  if (hue < 55) return pale ? 'cream' : 'gold'
  if (hue < 70) return 'yellow'
  if (hue < 90) return 'lime'
  if (hue < 155) return dark ? 'forest' : 'green'
  if (hue < 185) return 'teal'
  if (hue < 205) return 'cyan'
  if (hue < 255) return dark ? 'navy' : 'blue'
  if (hue < 285) return 'indigo'
  if (hue < 325) return 'purple'
  return 'pink'
}

// ---- fonts -----------------------------------------------------------------

export function brandFont(id: number | undefined): TFontItem | undefined {
  return id ? fonts.find((font) => font.id === id) : undefined
}

/**
 * The kit's fonts as a list, heading first, each named once — a kit that uses
 * one family for both is one entry, not two of the same.
 */
export function brandFontItems(chosen: TBrandFonts): TFontItem[] {
  const items: TFontItem[] = []
  for (const id of [chosen.heading, chosen.body]) {
    const font = brandFont(id)
    if (font && !items.includes(font)) items.push(font)
  }
  return items
}

// ---- merge fields ----------------------------------------------------------

/**
 * `{{school.name|upper}}` — the value with its case changed. The bundled
 * footers are set in capitals, and a school's name should be stored as it is
 * written rather than as one template happens to set it.
 */
function applyModifier(value: string, modifier: string): string {
  switch (fieldKey(modifier)) {
    case 'upper':
      return value.toUpperCase()
    case 'lower':
      return value.toLowerCase()
    default:
      return value
  }
}

/**
 * Answers `school.*` fields from a kit.
 *
 * A kit with nothing written in it answers with the samples, so the bundled
 * templates read as they always have. A kit with anything written in it
 * answers only what it has: an empty email is left as `{{school.email}}`, not
 * quietly filled with somebody else's, so the author can see what is missing.
 * Anything that is not a school field is declined, which is what lets another
 * resolver be composed after this one.
 */
export function brandResolver(kit: TBrandKit): TFieldResolver {
  const source: Record<TBrandDetailKey, string> = hasBrandDetails(kit) ? kit : SAMPLE_BRAND
  const values: Record<string, string | undefined> = {}
  for (const { field, key } of BRAND_FIELDS) {
    const value = (source[key] || '').trim()
    values[field] = value || undefined
  }
  const plain = valuesResolver(values)
  return (name) => {
    const [base, ...modifiers] = name.split('|')
    const value = plain(base)
    if (value === undefined) return undefined
    return modifiers.reduce(applyModifier, value)
  }
}

/** Whether a field name is one of the school's, whatever its spelling or modifier. */
export function isBrandField(name: string): boolean {
  const base = fieldKey(name.split('|')[0])
  return BRAND_FIELDS.some((item) => item.field === base)
}

// ---- reading a kit in -------------------------------------------------------

/**
 * A kit as it came from the database or the host, made safe to use: every
 * detail a string, colours the editor can paint with, fonts the list still
 * has. A host handing in a font id from a list that has since changed should
 * get "not chosen", not a text box in a font nobody bundled.
 */
export function normaliseBrandKit(input: Partial<TBrandKit> | null | undefined): TBrandKit {
  const kit = emptyBrandKit()
  if (!input || typeof input !== 'object') return kit
  for (const key of BRAND_DETAIL_KEYS) {
    const value = input[key]
    kit[key] = typeof value === 'string' ? value : ''
  }
  const colors = Array.isArray(input.colors) ? input.colors : []
  for (const value of colors) {
    const color = normaliseBrandColor(String(value))
    if (color && !kit.colors.includes(color) && kit.colors.length < MAX_BRAND_COLORS) kit.colors.push(color)
  }
  const chosen = input.fonts && typeof input.fonts === 'object' ? input.fonts : {}
  if (brandFont(chosen.heading)) kit.fonts.heading = chosen.heading
  if (brandFont(chosen.body)) kit.fonts.body = chosen.body
  const logo = input.logo
  if (logo && typeof logo.url === 'string' && logo.url) {
    kit.logo = { url: logo.url, width: Number(logo.width) || 0, height: Number(logo.height) || 0 }
  }
  return kit
}
