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
 * When the editor is embedded in an app that does have a file store, this is
 * the seam: keep saveUpload/listUploads/deleteUpload and swap their bodies for
 * calls to that app's endpoints. Nothing outside this module knows where the
 * bytes live.
 */

/** Longest edge kept for an uploaded photo, in pixels. */
const MAX_EDGE = 2400
/** Above this, re-encode as JPEG; below it, keep the original bytes. */
const REENCODE_ABOVE_BYTES = 600 * 1024
const JPEG_QUALITY = 0.85

const DB_NAME = 'design-studio'
const DB_VERSION = 1
const STORE = 'uploads'

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

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    }).catch((error) => {
      // Let the next call try again rather than caching the failure forever.
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = work(tx.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

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
 */
async function downscale(file: File): Promise<{ url: string; width: number; height: number }> {
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

/** Stores one file and returns the record the panel should show. */
export async function saveUpload(file: File): Promise<LocalUpload> {
  const { url, width, height } = await downscale(file)
  const record: LocalUpload = {
    id: `up_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    width,
    height,
    title: file.name || 'Upload',
    created_time: new Date().toISOString(),
  }
  await run('readwrite', (store) => store.add(record) as IDBRequest<any>)
  return record
}

/** Newest first, which is the order someone expects after an upload. */
export async function listUploads(): Promise<LocalUpload[]> {
  const all = (await run('readonly', (store) => store.getAll() as IDBRequest<LocalUpload[]>)) || []
  return all.sort((a, b) => (a.created_time < b.created_time ? 1 : -1))
}

export async function deleteUpload(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id) as IDBRequest<any>)
}
