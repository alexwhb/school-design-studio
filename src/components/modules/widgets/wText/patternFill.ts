/**
 * A tiling fill, held as markup and a palette rather than as a finished image.
 *
 * The editor's gradient fill is one linear gradient with stops, which cannot
 * say "dots" or "checks". A repeating background image can, so the patterned
 * presets are built from a one-cell SVG tile written into `background-image`.
 *
 * Baking that tile into a data URI is what made those presets the ones where
 * changing the colour did visibly nothing: by the time the editor saw the fill
 * its colours were pixels, so the colour swatch had nothing to change and the
 * settings panel had no control to offer. Keeping the tile as markup with
 * numbered slots keeps the colours as colours — `colors[n]` fills every `{n}`
 * — so the same walk that follows a gradient's stops follows a pattern's
 * palette, and the URI is built at paint time from whatever it now says.
 */
export type TPatternFill = {
  /** The tile is square; this is its side, in design pixels. */
  size: number
  /** The SVG body of one tile, with `{0}`, `{1}`… where a palette colour goes. */
  markup: string
  colors: string[]
}

const SLOT = /\{(\d+)\}/g

/** The tile painted in its current palette, as a data URI. */
export default function patternUri({ size, markup, colors }: TPatternFill): string {
  const painted = markup.replace(SLOT, (slot, index) => colors[Number(index)] ?? slot)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${painted}</svg>`
  // Percent-encoded rather than base64: every colour in the markup carries a
  // `#`, which has to be escaped for a URI either way, and this stays legible
  // in the inspector. It also sidesteps btoa, which cannot take a non-ASCII
  // character a future tile might well hold.
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
