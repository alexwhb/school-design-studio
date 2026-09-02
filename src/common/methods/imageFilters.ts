/**
 * The adjustments a photograph can be given: brightness, contrast, colour,
 * warmth, blur, and the two washes.
 *
 * They are CSS `filter` functions, applied to the picture itself rather than
 * to the widget round it, so a keyline stays crisp and a shadow keeps its
 * colour whatever is done to the photo inside them. The canvas widget and its
 * read-only twin both draw from here, so a page thumbnail and a slide show the
 * same photo the artboard does.
 *
 * Every value is a percentage of the untouched picture, 100 meaning "as it
 * came", except blur, which is a length in design pixels, and warmth, which
 * runs both ways from 0. A design carries only the keys that have been moved,
 * and none at all when nothing has, so a design saved before this existed
 * reads exactly as it did.
 *
 * html2canvas cannot draw a filter, so the exports pre-render a filtered
 * picture in the browser first — the same path a shadow takes — and a .pptx
 * gets a picture of the adjusted photo rather than the original with the
 * adjustments quietly dropped.
 */

export type TImageFilters = {
  brightness?: number
  contrast?: number
  saturation?: number
  /** Positive is warmer, negative cooler; both are a wash, not a hue shift. */
  warmth?: number
  /** Design pixels, not a percentage. */
  blur?: number
  grayscale?: number
  sepia?: number
}

export type TImageFilterKey = keyof TImageFilters

/** The untouched picture, which is also what Reset puts back. */
export const IMAGE_FILTER_DEFAULTS: Required<TImageFilters> = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
}

/** The sliders, in the order the panel shows them, with the range each runs over. */
export const IMAGE_FILTER_SLIDERS: { key: TImageFilterKey; label: string; min: number; max: number }[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200 },
  { key: 'warmth', label: 'Warmth', min: -100, max: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 20 },
  { key: 'grayscale', label: 'Black and white', min: 0, max: 100 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
]

export type TImageFilterPreset = { name: string; filters: TImageFilters | null }

/** A few looks to start from. Original is the absence of any. */
export const IMAGE_FILTER_PRESETS: TImageFilterPreset[] = [
  { name: 'Original', filters: null },
  { name: 'Warm', filters: { warmth: 45, saturation: 110 } },
  { name: 'Cool', filters: { warmth: -45, saturation: 105 } },
  { name: 'Black and white', filters: { grayscale: 100, contrast: 110 } },
  { name: 'Vivid', filters: { saturation: 145, contrast: 112 } },
  { name: 'Faded', filters: { contrast: 78, brightness: 108, saturation: 80 } },
]

function num(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Every adjustment, with the defaults filled in for whatever the widget left out. */
export function readImageFilters(filters: TImageFilters | null | undefined): Required<TImageFilters> {
  const out = { ...IMAGE_FILTER_DEFAULTS }
  if (!filters || typeof filters !== 'object') return out
  for (const key of Object.keys(IMAGE_FILTER_DEFAULTS) as TImageFilterKey[]) {
    out[key] = num(filters[key], IMAGE_FILTER_DEFAULTS[key])
  }
  return out
}

/**
 * The same adjustments with everything at its default left out, and null when
 * that is all of them — which is what the widget should hold, so a photo put
 * back to how it came carries nothing.
 */
export function packImageFilters(filters: TImageFilters | null | undefined): TImageFilters | null {
  const full = readImageFilters(filters)
  const packed: TImageFilters = {}
  for (const key of Object.keys(IMAGE_FILTER_DEFAULTS) as TImageFilterKey[]) {
    if (full[key] !== IMAGE_FILTER_DEFAULTS[key]) packed[key] = full[key]
  }
  return Object.keys(packed).length ? packed : null
}

/** True when nothing has been moved off its default. */
export function isUntouched(filters: TImageFilters | null | undefined): boolean {
  return packImageFilters(filters) === null
}

/** The preset these adjustments are, if they are exactly one; otherwise null. */
export function matchImageFilterPreset(filters: TImageFilters | null | undefined): TImageFilterPreset | null {
  const packed = packImageFilters(filters)
  for (const preset of IMAGE_FILTER_PRESETS) {
    const theirs = packImageFilters(preset.filters)
    if (JSON.stringify(theirs) === JSON.stringify(packed)) return preset
  }
  return null
}

const round = (value: number) => Math.round(value * 1000) / 1000

/**
 * The `filter` for these adjustments, or undefined when there is nothing to do.
 *
 * Warmth is a sepia wash, which is what makes a photo read as warm; there is no
 * "cool" function in CSS, so a cool wash is the same sepia applied with the
 * hues turned half way round and turned back again, which lands the wash on
 * the blues instead of the yellows. The order matters: CSS applies the
 * functions left to right.
 */
export function imageFilterCss(filters: TImageFilters | null | undefined): string | undefined {
  const f = readImageFilters(filters)
  const parts: string[] = []
  if (f.brightness !== 100) parts.push(`brightness(${round(Math.max(0, f.brightness) / 100)})`)
  if (f.contrast !== 100) parts.push(`contrast(${round(Math.max(0, f.contrast) / 100)})`)
  if (f.saturation !== 100) parts.push(`saturate(${round(Math.max(0, f.saturation) / 100)})`)
  if (f.warmth > 0) parts.push(`sepia(${round(Math.min(f.warmth, 100) / 200)})`)
  if (f.warmth < 0) parts.push(`hue-rotate(180deg) sepia(${round(Math.min(-f.warmth, 100) / 200)}) hue-rotate(180deg)`)
  if (f.grayscale > 0) parts.push(`grayscale(${round(Math.min(f.grayscale, 100) / 100)})`)
  if (f.sepia > 0) parts.push(`sepia(${round(Math.min(f.sepia, 100) / 100)})`)
  if (f.blur > 0) parts.push(`blur(${round(f.blur)}px)`)
  return parts.length ? parts.join(' ') : undefined
}
