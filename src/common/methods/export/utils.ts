/**
 * Shared helpers for turning a design into an exported file.
 *
 * The editor stores a page in CSS pixels; PowerPoint works in inches and
 * points. Everything here converts between the two and normalises the odd
 * shapes the editor's data can take (8-digit hex colours, contenteditable
 * HTML, remote image URLs).
 */

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
    const hex = [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')
    return { color: hex.toUpperCase(), transparency: alphaToTransparency(a) }
  }

  let hex = value.replace(/^#/, '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
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
  return (el.textContent || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').replace(/\n+$/, '')
}

/** Reads the rotation, in degrees, out of a widget's transform string. */
export function readRotation(widget: Record<string, any>): number {
  if (typeof widget.rotate === 'number' && widget.rotate) return widget.rotate
  const transform = widget.transform
  if (typeof transform !== 'string') return 0
  const match = transform.match(/rotate\((-?[\d.]+)deg\)/i)
  return match ? parseFloat(match[1]) : 0
}

/**
 * PowerPoint needs image bytes, not a URL. Fetch the image and base64 it.
 *
 * Falls back to drawing it on a canvas, which covers images the browser has
 * already cached but will not hand over via fetch. Returns null when the image
 * cannot be read at all (a cross-origin host with no CORS headers), so the
 * caller can skip it rather than produce a corrupt file.
 */
export async function imageToDataUrl(url: string): Promise<string | null> {
  if (!url) return null
  if (url.startsWith('data:')) return url

  try {
    const res = await fetch(url, { mode: 'cors' })
    if (res.ok) {
      const blob = await res.blob()
      return await blobToDataUrl(blob)
    }
  } catch {
    // fall through to the canvas attempt
  }

  try {
    return await drawImageToDataUrl(url)
  } catch {
    return null
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function drawImageToDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no 2d context'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error(`could not load ${url}`))
    img.src = url
  })
}

/** Makes a filename safe to save on Windows and macOS. */
export function safeFileName(name: string, extension: string): string {
  const base = (name || 'Untitled design').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled design'
  return `${base}.${extension}`
}
