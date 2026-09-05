/**
 * Taking a picture off somebody's computer and putting it on the page.
 *
 * Three doors lead here — the dock's "Upload from device", the Photos panel's
 * upload tile, and a file dragged onto the canvas — and they used to be two,
 * each with its own copy of the size cap, the failure notice and the arithmetic
 * that decides where the picture lands. The third one is the reason to stop:
 * a drop is the first of the three that has an opinion about *where*, and
 * adding that to two copies would have made them three.
 */
import { saveUpload } from './localUploads'
import useNotification from './notification'
import setImageData from './DesignFeatures/setImage'
import { canvasState } from '@/store/state'
import { recordHistory } from '@/common/hooks/history'
import { addWidget } from '@/store/widget'
import eventBus from '@/utils/plugins/eventBus'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'

export type TUploadDoneData = {
  width: number
  height: number
  url: string
  id?: string
  title?: string
}

/**
 * What a file picker offers and what a drop will take.
 *
 * SVG earns its place rather than arriving with `image/*`: a crest or a mascot
 * is drawn as vector art, and every other format here turns it into pixels that
 * go soft the moment somebody scales it up for a poster. It is also the one
 * entry that is a document rather than a picture — see the host's own upload
 * route, which reads the markup before it will store one. Standalone, the file
 * only ever reaches this browser's IndexedDB.
 *
 * WebP and AVIF are left off deliberately, the same way the host leaves WebP
 * off: a design becomes a `.pptx`, and a picture some copies of PowerPoint draw
 * and some do not is worse than one nobody could add.
 */
export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg,image/gif,image/svg+xml'

/** The same list, for a person reading it under a button. */
export const IMAGE_UPLOAD_LABEL = 'jpg, png, gif, svg'

const ACCEPTED = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'])

/**
 * The `accept` attribute is a filter on a dialog, not a rule — a drop never saw
 * one, and every file dialog has an "All files" escape hatch.
 */
export function isUploadableImage(file: File): boolean {
  return ACCEPTED.has(file.type)
}

/** Well past anything a page can use, and the host caps far lower again. */
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024

/**
 * Store one file, with the notice on failure. Null means it did not land, and
 * the caller has already been told why.
 */
export async function uploadImageFile(file: File): Promise<TUploadDoneData | null> {
  if (!isUploadableImage(file)) {
    useNotification('That file is not a picture', `Choose a ${IMAGE_UPLOAD_LABEL} file.`, { type: 'error', position: 'bottom-left' })
    return null
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    useNotification('That image is too big', 'Please use a picture under 40MB.', { type: 'error', position: 'bottom-left' })
    return null
  }
  try {
    const saved = await saveUpload(file)
    useNotification('Uploaded', saved.title, { position: 'bottom-left' })
    return { id: saved.id, width: saved.width, height: saved.height, url: saved.url, title: saved.title }
  } catch (error) {
    // A browser out of room says so in its own words; a host says why it
    // refused the file, and that sentence is the useful one — it is the only
    // place that read the bytes.
    const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    useNotification(
      quota ? 'No room left for uploads' : 'That image could not be added',
      quota ? 'Delete some uploads and try again.' : (error as Error)?.message || 'The file could not be read.',
      { type: 'error', position: 'bottom-left' },
    )
    return null
  }
}

/**
 * Put a stored picture on the current page.
 *
 * `at` is a point in page coordinates, and the picture is centred on it — where
 * somebody let go is where they meant the middle of it to be, not its corner.
 * Without one it lands in the middle of the page, which is what the dock and
 * the panel have always done.
 */
export async function placeUploadedImage(res: TUploadDoneData, at?: { x: number; y: number }) {
  // The Photos panel's own uploads section listens for this and reloads.
  eventBus.emit('refreshUserImages')
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  const img = await setImageData({ width: res.width, height: res.height, url: res.url })
  setting.width = img.width
  setting.height = img.height
  setting.imgUrl = res.url
  const { width: pageWidth, height: pageHeight } = canvasState.dPage
  const centre = at ?? { x: pageWidth / 2, y: pageHeight / 2 }
  // Clamped so a drop near an edge still leaves the picture somewhere it can be
  // grabbed. A widget dropped mostly off the page is one nobody can select.
  setting.left = Math.round(clamp(centre.x - img.width / 2, -img.width / 2, pageWidth - img.width / 2))
  setting.top = Math.round(clamp(centre.y - img.height / 2, -img.height / 2, pageHeight - img.height / 2))
  recordHistory(() => addWidget(setting))
}

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), Math.max(low, high))
}

/**
 * Upload a set of files and lay them on the page, one after another.
 *
 * Serial rather than parallel: each has to be stored before the next, or a host
 * with a per-school count cap accepts however many happen to win the race. Each
 * one after the first is nudged along the diagonal so a drop of four pictures
 * is four pictures rather than one pile.
 */
export async function uploadAndPlaceImages(files: File[], at?: { x: number; y: number }) {
  let placed = 0
  for (const file of files) {
    const saved = await uploadImageFile(file)
    if (!saved) continue
    const offset = placed * CASCADE_STEP
    await placeUploadedImage(saved, at ? { x: at.x + offset, y: at.y + offset } : undefined)
    placed++
  }
  return placed
}

/** Design pixels between one dropped picture and the next. */
const CASCADE_STEP = 24

/**
 * Where on the page a pointer at these client coordinates is, or null when the
 * pointer was not over the page at all.
 *
 * The canvas carries a `scale()` for the zoom, and `getBoundingClientRect`
 * reports the box after that transform — so dividing by the zoom is enough and
 * the transform's origin, which changes at 100%, does not come into it.
 */
export function pagePointAt(clientX: number, clientY: number): { x: number; y: number } | null {
  if (typeof document === 'undefined') return null
  const canvas = document.querySelector('.design-canvas')
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return null
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null
  }
  const zoom = (canvasState.dZoom || 100) / 100
  return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom }
}
