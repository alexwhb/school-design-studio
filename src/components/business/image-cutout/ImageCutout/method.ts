/**
 * Keeps a background-removed cut-out and returns the record to place it with.
 *
 * This used to push the PNG to Qiniu — a CDN this fork has no account for — so
 * it always threw, returned '' and silently lost the cut-out the user had just
 * waited for. It goes to the same browser-side library as every other upload
 * now, which also means it turns up in the Uploads panel to be reused.
 */
import { saveUpload, type LocalUpload } from '@/common/methods/localUploads'
import eventBus from '@/utils/plugins/eventBus'

export async function saveCutOut(cutImage: string): Promise<LocalUpload | null> {
  try {
    const response = await fetch(cutImage)
    const blob = await response.blob()
    // PNG, not JPEG: cutting a background out is pointless without the alpha.
    const file = new File([blob], `cut-out-${Date.now()}.png`, { type: 'image/png' })
    const saved = await saveUpload(file)
    eventBus.emit('refreshUserImages')
    return saved
  } catch (e) {
    console.error(`[cut-out] could not save the result: ${e}`)
    return null
  }
}
