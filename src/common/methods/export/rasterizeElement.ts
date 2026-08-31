/**
 * Draws a DOM subtree that html2canvas cannot, by handing it back to the
 * browser.
 *
 * html2canvas reimplements CSS painting rather than using the engine, so it
 * only draws the properties it has code for. Three of ours it has none for:
 * `-webkit-text-stroke`, `background-clip: text`, and `-webkit-mask-image`.
 * They do not degrade — an outlined heading loses its outline and, because the
 * fill underneath is usually white, disappears; a gradient-filled heading keeps
 * its background but loses the clip, so a solid block paints over the design.
 *
 * The way out is an SVG `<foreignObject>`: markup inside one is laid out and
 * painted by the browser itself, so every property works. Load that SVG as an
 * `<img>` and html2canvas draws it down its image path, where it only has to
 * copy pixels.
 *
 * The catch, and the reason most of this file exists: an SVG loaded as an image
 * is rendered in a sandbox with no network. It cannot fetch a stylesheet, a
 * font or a photo. Anything the subtree needs has to be carried in as a data
 * URL first, and anything that fails to inline has to abort the whole attempt —
 * a heading rasterised in a fallback font is a worse export than one html2canvas
 * draws imperfectly.
 */
import { imageToDataUrl } from './utils'

/** The alpha of a computed colour, which is always serialised as rgb/rgba. */
function alphaOf(color: string): number {
  const parts = color.match(/^rgba?\(([^)]+)\)$/i)?.[1]
  if (!parts) return 1
  const values = parts.split(/[,/]/).map((p) => parseFloat(p.trim()))
  return values.length > 3 && !Number.isNaN(values[3]) ? values[3] : 1
}

/** Properties whose presence means html2canvas will get the element wrong. */
export function needsRasterizing(el: Element): boolean {
  const style = getComputedStyle(el)
  const strokeWidth = parseFloat(style.getPropertyValue('-webkit-text-stroke-width')) || 0
  const clip = style.getPropertyValue('-webkit-background-clip') || style.getPropertyValue('background-clip')
  const mask = style.getPropertyValue('-webkit-mask-image') || style.getPropertyValue('mask-image')
  if (strokeWidth > 0 || clip === 'text' || (Boolean(mask) && mask !== 'none')) return true

  // A glow is a stack of invisible copies of the text, each casting a blurred
  // shadow. html2canvas paints the shadow as part of painting the text, so
  // when the text is fully transparent it skips both and the glow is lost —
  // no stroke or clip involved, which is why this case needs naming
  // separately.
  return alphaOf(style.color) === 0 && style.textShadow !== 'none' && Boolean(style.textShadow)
}

/** True when this element, or anything inside it, needs the treatment. */
export function subtreeNeedsRasterizing(el: Element): boolean {
  if (needsRasterizing(el)) return true
  return Array.from(el.querySelectorAll('*')).some(needsRasterizing)
}

// A design reuses the same few fonts across many headings, and re-fetching a
// woff2 per heading is wasted work, so results are kept for the session.
const fontCache = new Map<string, string | null>()
let fontFaces: Promise<{ family: string; url: string }[]> | null = null

/** Reads the app's own @font-face declarations so we can re-issue them inline. */
function loadFontFaces(): Promise<{ family: string; url: string }[]> {
  if (!fontFaces) {
    fontFaces = fetch('/fonts/fonts.css')
      .then((res) => (res.ok ? res.text() : ''))
      .then((css) => {
        const faces: { family: string; url: string }[] = []
        for (const block of css.split('@font-face')) {
          const family = block.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1]
          const url = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1]
          if (family && url) faces.push({ family, url })
        }
        return faces
      })
      .catch(() => [])
  }
  return fontFaces
}

async function fontAsDataUrl(url: string): Promise<string | null> {
  if (!fontCache.has(url)) {
    const value = await fetch(url)
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => (blob ? blobToDataUrl(blob) : null))
      .catch(() => null)
    fontCache.set(url, value)
  }
  return fontCache.get(url) ?? null
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Every font family named anywhere in the subtree, quotes stripped. */
function familiesUsed(root: Element): Set<string> {
  const families = new Set<string>()
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const part of getComputedStyle(el).fontFamily.split(',')) {
      const name = part.trim().replace(/^['"]|['"]$/g, '')
      if (name) families.add(name)
    }
  }
  return families
}

/**
 * Rebuilds the @font-face rules the subtree needs, with the font bytes inline.
 *
 * Returns null if a font the subtree actually uses could not be embedded, so
 * the caller can leave the element to html2canvas rather than rasterise it in
 * the wrong typeface.
 */
async function inlineFontFaces(root: Element): Promise<string | null> {
  const faces = await loadFontFaces()
  const wanted = familiesUsed(root)
  const rules: string[] = []
  for (const face of faces) {
    if (!wanted.has(face.family)) continue
    const data = await fontAsDataUrl(face.url)
    if (!data) return null
    rules.push(`@font-face{font-family:'${face.family}';src:url(${data}) format('woff2');}`)
  }
  return rules.join('')
}

// Copying every computed property is what makes the clone look like the
// original with no stylesheet present. The layout ones are dropped on the root
// because the <img> that replaces it carries those instead.
const SKIPPED_ON_ROOT = new Set(['position', 'left', 'top', 'right', 'bottom', 'transform', 'margin', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom'])

function inlineComputedStyles(source: Element, clone: Element, isRoot: boolean): void {
  const computed = getComputedStyle(source)
  const declarations: string[] = []
  for (const property of Array.from(computed)) {
    if (isRoot && SKIPPED_ON_ROOT.has(property)) continue
    const value = computed.getPropertyValue(property)
    if (value) declarations.push(`${property}:${value}`)
  }
  clone.setAttribute('style', declarations.join(';'))

  const sourceChildren = Array.from(source.children)
  const cloneChildren = Array.from(clone.children)
  for (let i = 0; i < sourceChildren.length; i++) {
    if (cloneChildren[i]) inlineComputedStyles(sourceChildren[i], cloneChildren[i], false)
  }
}

/** Pulls every `url(...)` the sandbox could not fetch into the markup itself. */
async function inlineResources(clone: HTMLElement): Promise<boolean> {
  for (const img of Array.from(clone.querySelectorAll('img'))) {
    const data = await imageToDataUrl(img.getAttribute('src') || '')
    if (!data) return false
    img.setAttribute('src', data)
  }

  const elements = [clone, ...Array.from(clone.querySelectorAll('*'))] as HTMLElement[]
  for (const el of elements) {
    const style = el.getAttribute('style')
    if (!style) continue
    // Gradients also read as `url()`-free image values, so only real URLs are
    // touched; data: URLs are already inline.
    const urls = Array.from(style.matchAll(/url\(\s*['"]?(?!data:)([^'")]+)['"]?\s*\)/g)).map((m) => m[1])
    if (!urls.length) continue
    let rewritten = style
    for (const url of new Set(urls)) {
      const data = await imageToDataUrl(url)
      if (!data) return false
      rewritten = rewritten.split(url).join(data)
    }
    el.setAttribute('style', rewritten)
  }
  return true
}

/**
 * Renders `el` to a PNG data URL, or null if it could not be done faithfully.
 *
 * `scale` is the export's own pixel ratio: the SVG is given an intrinsic size
 * that large so the bitmap html2canvas copies is already at final resolution,
 * rather than a CSS-sized one it would have to blow up.
 */
export async function rasterizeElement(el: HTMLElement, scale: number): Promise<string | null> {
  const width = el.offsetWidth
  const height = el.offsetHeight
  if (!width || !height) return null

  const clone = el.cloneNode(true) as HTMLElement
  inlineComputedStyles(el, clone, true)
  if (!(await inlineResources(clone))) return null

  const fontCss = await inlineFontFaces(el)
  if (fontCss === null) return null

  clone.removeAttribute('id')
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')

  const markup = new XMLSerializer().serializeToString(clone)
  const ratio = Math.max(1, scale)
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * ratio}" height="${height * ratio}" viewBox="0 0 ${width} ${height}">`,
    `<foreignObject x="0" y="0" width="${width}" height="${height}">`,
    fontCss ? `<style xmlns="http://www.w3.org/1999/xhtml">${fontCss}</style>` : '',
    markup,
    '</foreignObject></svg>',
  ].join('')

  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  try {
    await img.decode()
  } catch {
    // A malformed subtree, or a resource that slipped through, leaves the image
    // undecodable. Better to let html2canvas have its imperfect go at it.
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
