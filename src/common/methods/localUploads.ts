/**
 * The Uploads panel, backed by the browser.
 *
 * This fork has no account system and no upload endpoint — the Express service
 * upstream ships exists to render screenshots with Puppeteer, and nothing in
 * `npm start` runs it. The uploader still POSTed to it, so every upload
 * resolved to an empty result, the placed image got an undefined src, and the
 * panel showed Element Plus's "FAILED" thumbnail. That is the "photo upload
 * just says failed" people hit.
 *
 * So uploads live in the browser instead: IndexedDB for the bytes, which is the
 * only client-side store big enough for photographs (localStorage caps out
 * around 5MB across the whole origin) and the only one that keeps them across
 * a reload.
 *
 * Images are stored as data URLs rather than Blobs behind object URLs. An
 * object URL dies with the tab, which would break every design that referenced
 * it; a data URL is self-contained, survives being saved into a design, is
 * same-origin so html2canvas can rasterise it without tainting the canvas, and
 * is what pptxgenjs wants for an embedded picture. The cost is roughly a third
 * more bytes, which `downscale` more than pays back.
 *
 * When the editor is embedded in an app that does have a file store, that app
 * hands one in through the `uploads` prop and `setHostUploads` below routes the
 * three calls to it. IndexedDB is then neither read nor written: a picture a
 * teacher uploaded on the staffroom machine is on their laptop too, which is
 * the whole reason to hand it over. Nothing outside this module — not the
 * Photos panel, not the paste handler, not the picture picker — knows which of
 * the two it is talking to.
 */

import { run, STORES } from './localDb'
import type { HostUploads } from '@/common/hooks/hostApi'

export type LocalUpload = {
  id: string
  /** Data URL. Named `url` to match what the panels and widgets already read. */
  url: string
  width: number
  height: number
  /** Original filename, shown on hover. */
  title: string
  created_time: string
}

/** Longest edge kept for an uploaded photo, in pixels. */
const MAX_EDGE = 2400
/** Above this, re-encode as JPEG; below it, keep the original bytes. */
const REENCODE_ABOVE_BYTES = 600 * 1024
const JPEG_QUALITY = 0.85

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('That file could not be read as an image.'))
    img.src = src
  })
}

/**
 * Shrinks a photo to something a poster can actually use.
 *
 * A phone camera writes 4000px, 6MB files; a poster prints one at a few hundred
 * pixels across. Storing the original would blow through the browser's quota
 * after a handful of uploads and make every later canvas render slower, so the
 * long edge is capped and anything sizeable is re-encoded as JPEG.
 *
 * Returns the data URL plus the dimensions the editor should lay it out at.
 *
 * Exported because it is the rule for any picture the browser makes and then
 * has to keep — a background cut out of a photo goes through it too, so a
 * cut-out is stored on the same terms as the photo it came from.
 */
export async function downscale(file: File): Promise<{ url: string; width: number; height: number }> {
  const original = await readAsDataUrl(file)
  const img = await loadImage(original)
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  const small = scale < 1
  const heavy = file.size > REENCODE_ABOVE_BYTES

  // A small PNG or an SVG is left exactly as it is: re-encoding would cost it
  // its transparency, and logos and cut-outs are most of what gets uploaded.
  const transparent = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp'
  if (!small && (!heavy || transparent)) {
    return { url: original, width: img.naturalWidth, height: img.naturalHeight }
  }
  if (file.type === 'image/svg+xml') {
    return { url: original, width: img.naturalWidth, height: img.naturalHeight }
  }

  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return { url: original, width: img.naturalWidth, height: img.naturalHeight }
  if (!transparent) {
    // JPEG has no alpha; without this, a transparent source comes out black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)
  const type = transparent ? 'image/png' : 'image/jpeg'
  const url = canvas.toDataURL(type, JPEG_QUALITY)
  // Re-encoding can make a small, already-optimised file bigger. Keep whichever
  // is smaller, as long as we did not need to shrink it.
  if (!small && url.length >= original.length) {
    return { url: original, width: img.naturalWidth, height: img.naturalHeight }
  }
  return { url, width, height }
}

/**
 * The host's file store, when there is one. Set once as the editor mounts and
 * cleared when it goes, so a second editor on the same page without the prop
 * gets the browser's own store back.
 */
let host: HostUploads | null = null

export function setHostUploads(uploads: HostUploads | null) {
  host = uploads
}

export function hostKeepsUploads(): boolean {
  return host !== null
}

/**
 * The host speaks of a picture's `name`; the panels have always read `title`,
 * and a widget reads `url`. Translating here rather than at every reader is
 * what keeps the swap invisible.
 */
function fromHost(item: { id: string; url: string; width: number; height: number; name: string }): LocalUpload {
  return { id: String(item.id), url: item.url, width: Number(item.width) || 0, height: Number(item.height) || 0, title: item.name || 'Upload', created_time: new Date().toISOString() }
}

/** Stores one file and returns the record the panel should show. */
export async function saveUpload(file: File): Promise<LocalUpload> {
  // Straight to the host, original bytes and all: it has a store with room, and
  // `downscale` exists to fit a photograph into a browser's quota.
  if (host) return fromHost(await host.upload(file))
  const { url, width, height } = await downscale(file)
  const record: LocalUpload = {
    id: `up_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    width,
    height,
    title: file.name || 'Upload',
    created_time: new Date().toISOString(),
  }
  await run(STORES.uploads, 'readwrite', (store) => store.add(record) as IDBRequest<any>)
  return record
}

/** Newest first, which is the order someone expects after an upload. */
export async function listUploads(): Promise<LocalUpload[]> {
  // The host's order is the host's business — it knows when each was uploaded
  // and this side only ever knew when it read them.
  if (host) return (await host.list()).map(fromHost)
  const all = (await run(STORES.uploads, 'readonly', (store) => store.getAll() as IDBRequest<LocalUpload[]>)) || []
  return all.sort((a, b) => (a.created_time < b.created_time ? 1 : -1))
}

export async function deleteUpload(id: string): Promise<void> {
  if (host) {
    await host.remove(id)
    return
  }
  await run(STORES.uploads, 'readwrite', (store) => store.delete(id) as IDBRequest<any>)
}
