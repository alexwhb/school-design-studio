/**
 * Shared helpers for turning a design into an exported file.
 *
 * The editor stores a page in CSS pixels; PowerPoint works in inches and
 * points. Everything here converts between the two and normalises the odd
 * shapes the editor's data can take (8-digit hex colours, contenteditable
 * HTML, remote image URLs).
 */

/**
 * Rejects if `work` has not settled in time.
 *
 * Every await in the export path — a fetch, an image decode, html2canvas
 * itself — can in principle never settle, and when one of them doesn't the
 * export does not fail, it stops: progress frozen, no error, nothing to do but
 * reload. A bound turns any of those into an ordinary failure the caller can
 * report or fall back from.
 */
export function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([work, limit]).finally(() => clearTimeout(timer)) as Promise<T>
}

/** The editor treats a design pixel as a CSS pixel, which is 1/96 of an inch. */
export const PX_PER_INCH = 96

/** PowerPoint measures type in points: 72 per inch. */
export const PT_PER_PX = 72 / PX_PER_INCH

export const pxToInches = (px: number): number => (Number(px) || 0) / PX_PER_INCH
export const pxToPoints = (px: number): number => (Number(px) || 0) * PT_PER_PX

export type PptxColor = { color: string; transparency?: number }

/**
 * The editor writes colours as #rgb, #rrggbb or #rrggbbaa, and occasionally as
 * rgb()/rgba(). PowerPoint wants a bare RRGGBB plus a separate 0–100
 * transparency, so split them apart.
 */
export function toPptxColor(input?: string, fallback = '000000'): PptxColor {
  if (!input || typeof input !== 'string') return { color: fallback }
  const value = input.trim()

  const rgb = value.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => parseFloat(p.trim()))
    const [r, g, b, a = 1] = parts
    if ([r, g, b].some((n) => Number.isNaN(n))) return { color: fallback }
    const hex = [r, g, b]
      .map((n) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
    return { color: hex.toUpperCase(), transparency: alphaToTransparency(a) }
  }

  let hex = value.replace(/^#/, '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  if (hex.length === 8) {
    const alpha = parseInt(hex.slice(6, 8), 16) / 255
    return { color: hex.slice(0, 6).toUpperCase(), transparency: alphaToTransparency(alpha) }
  }
  if (hex.length === 6) return { color: hex.toUpperCase() }
  return { color: fallback }
}

function alphaToTransparency(alpha: number): number | undefined {
  if (Number.isNaN(alpha) || alpha >= 1) return undefined
  return Math.round((1 - Math.max(0, Math.min(1, alpha))) * 100)
}

/** True when the colour is fully transparent, so it is not worth drawing. */
export function isInvisible(input?: string): boolean {
  const { transparency } = toPptxColor(input)
  return transparency === 100
}

/**
 * Text widgets hold contenteditable HTML. Turn it back into plain text,
 * keeping the line breaks, because a PowerPoint text box takes a string.
 */
export function htmlToText(html?: string): string {
  if (!html) return ''
  const normalised = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
  const el = document.createElement('div')
  el.innerHTML = normalised
  return (el.textContent || '')
    .replace(/ /g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '')
}

/** Reads the rotation, in degrees, out of a widget's transform string. */
export function readRotation(widget: Record<string, any>): number {
  if (typeof widget.rotate === 'number' && widget.rotate) return widget.rotate
  // Some widgets store the angle as a CSS string ('30deg') rather than a number,
  // which used to fall through to the transform and read as no rotation at all.
  if (typeof widget.rotate === 'string' && widget.rotate.trim()) {
    const degrees = parseFloat(widget.rotate)
    if (!Number.isNaN(degrees) && degrees) return degrees
  }
  const transform = widget.transform
  if (typeof transform !== 'string') return 0
  const match = transform.match(/rotate\((-?[\d.]+)deg\)/i)
  return match ? parseFloat(match[1]) : 0
}

const IMAGE_TIMEOUT = 15000

/** How many device pixels to rasterise a vector at, per design pixel. */
const VECTOR_OVERSAMPLE = 2
/** And a ceiling, because a full-bleed background at 2x is already enormous. */
const VECTOR_MAX_EDGE = 4000

function isSvgType(type: string): boolean {
  return /^image\/svg\+xml/i.test(type)
}

/**
 * PowerPoint needs image bytes, not a URL. Fetch the image and base64 it.
 *
 * Falls back to drawing it on a canvas, which covers images the browser has
 * already cached but will not hand over via fetch. Returns null when the image
 * cannot be read at all (a cross-origin host with no CORS headers), or when a
 * host simply never answers, so the caller can skip it rather than produce a
 * corrupt file or wait forever.
 *
 * An SVG is the one thing that is NOT passed through. OOXML has carried SVG
 * since 2016 and PowerPoint draws it, but Keynote's importer, Google Slides and
 * every copy of Office older than that show a gap instead — and a school opens
 * a deck on whatever is in the building. It is exactly the reason WebP is not
 * an upload format here. So a vector is drawn onto a canvas at twice the size
 * it is laid out at and embedded as PNG: it prints as sharply as the slide can
 * show it, and it arrives everywhere.
 *
 * `at` is the size it is drawn at. Worth passing for a vector and ignored for
 * everything else — an SVG with only a `viewBox` has no intrinsic size, and a
 * browser asked to draw one anyway invents 300x150.
 */
export async function imageToDataUrl(url: string, at?: { width: number; height: number }): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:')) {
    if (!isSvgType(url.slice(5))) return url
    try {
      return await withTimeout(drawImageToDataUrl(url, at), IMAGE_TIMEOUT, `drawing ${url.slice(0, 40)}`)
    } catch {
      return null
    }
  }

  try {
    const res = await withTimeout(fetch(url, { mode: 'cors', signal: AbortSignal.timeout(IMAGE_TIMEOUT) }), IMAGE_TIMEOUT, `fetching ${url}`)
    if (res.ok) {
      const blob = await res.blob()
      const dataUrl = await blobToDataUrl(blob)
      // Drawn from the data URL rather than the original address: it is already
      // in hand, and a canvas fed a `data:` source is never tainted, whatever
      // the response's own origin was.
      if (isSvgType(blob.type)) {
        return await withTimeout(drawImageToDataUrl(dataUrl, at), IMAGE_TIMEOUT, `drawing ${url}`)
      }
      return dataUrl
    }
  } catch {
    // fall through to the canvas attempt
  }

  try {
    return await withTimeout(drawImageToDataUrl(url, at), IMAGE_TIMEOUT, `loading ${url}`)
  } catch {
    return null
  }
}

/**
 * Turns a `data:` URL back into a Blob.
 *
 * Decoded by hand rather than with `fetch(dataUrl)` because a page's
 * Content-Security-Policy can refuse to connect to a data: URL, and an export
 * that only works on some deployments is worse than no shortcut at all.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = String(dataUrl).split(',')
  const type = header.match(/^data:([^;,]+)/)?.[1] || 'application/octet-stream'
  const bytes = header.includes(';base64') ? atob(payload) : decodeURIComponent(payload)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i)
  return new Blob([buffer], { type })
}

/** The oversampled size, brought back under the ceiling on its long edge. */
function fitVector({ width, height }: { width: number; height: number }) {
  const scale = Math.min(VECTOR_OVERSAMPLE, VECTOR_MAX_EDGE / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function drawImageToDataUrl(url: string, at?: { width: number; height: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // The laid-out size when the caller knows it, oversampled so a vector is
      // not embedded at the resolution it happens to be shown at on screen.
      const target = at?.width && at?.height ? fitVector(at) : null
      canvas.width = target?.width || img.naturalWidth || 1
      canvas.height = target?.height || img.naturalHeight || 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no 2d context'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`could not load ${url}`))
    img.src = url
  })
}

/** Makes a filename safe to save on Windows and macOS. */
export function safeFileName(name: string, extension: string): string {
  const base =
    (name || 'Untitled design')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Untitled design'
  return `${base}.${extension}`
}
