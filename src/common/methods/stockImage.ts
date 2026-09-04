/**
 * A picture from the stock library, taken into the host's own store first.
 *
 * The Photos panel and the background library hand back `images.unsplash.com`
 * addresses, and the editor puts them straight into the design. That is right
 * for a tool whose work lives in one browser and wrong for a planner: a design
 * has to still look like itself in a year, and an address on somebody else's
 * server does not promise that — Unsplash can change a URL, a key can be
 * revoked, and what was a photograph becomes a broken box on a poster that has
 * already been printed once.
 *
 * So when the host has said it can take a copy (`uploads.importUrl`), every
 * remote picture goes through here on its way onto the page and the design
 * points at the host's copy instead. Without that, nothing changes.
 *
 * Only *remote* pictures. An upload is already the host's, a sticker is markup
 * rather than an address, and a data URL is the bytes themselves.
 */
import eventBus from '@/utils/plugins/eventBus'
import loading from './loading'
import { hostImportsUrls, importRemoteImage } from './localUploads'
import useNotification from './notification'

export type StockImage = {
  url?: string
  width?: number
  height?: number
  /** Unsplash's own name for the photographer, when the panel knows it. */
  author?: string
  authorUrl?: string
  photoUrl?: string
  description?: string
}

/** Whether this address is on somebody else's server rather than in the design. */
export function isRemoteImage(url: string | undefined): boolean {
  return /^https?:\/\//i.test(String(url || ''))
}

/**
 * The picture as it should be written into the design.
 *
 * Returns the original when there is nothing to do, so every caller can use it
 * unconditionally. A failed import is reported and the placement is abandoned
 * rather than quietly falling back to the remote address — the host said it
 * wants copies, and half-honouring that would put exactly the URL it refuses
 * into the design it is about to save.
 */
export async function resolveStockImage(item: StockImage): Promise<StockImage | null> {
  if (!hostImportsUrls() || !isRemoteImage(item.url)) return item

  const mask = loading('Saving this photo to your school’s library…')
  try {
    const saved = await importRemoteImage(String(item.url), {
      name: item.description || 'Stock photo',
      width: item.width,
      height: item.height,
      attribution: { photographer: item.author, profileUrl: item.authorUrl, photoUrl: item.photoUrl },
    })
    // The copy belongs in "My uploads" as well as on the page — it is one of
    // the school's pictures now, and the next design should be able to reach
    // for it without going back to the library.
    eventBus.emit('refreshUserImages')
    return { ...item, url: saved.url, width: saved.width || item.width, height: saved.height || item.height }
  } catch (error) {
    console.error('[photos] the host could not take a copy of this photo', error)
    useNotification('That photo could not be saved', 'It was not added to the page. Please try again, or upload a picture of your own.', { type: 'error', duration: 8000 })
    return null
  } finally {
    mask.close()
  }
}
