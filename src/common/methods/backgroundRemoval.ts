/**
 * Cutting the background out of a photograph.
 *
 * This is a seam with three implementations behind it, tried in that order:
 *
 * 1. Whatever a host app installed with `setBackgroundRemover`. An app that
 *    embeds the editor and already has this — a service, a worker, a licence
 *    for something better — should use it rather than the one below.
 * 2. A server, when `config.BACKGROUND_REMOVAL_URL` names one: the picture goes
 *    up as the request body and a transparent PNG is expected back.
 * 3. The browser's own, in `backgroundRemovalModel`, which is where the weight
 *    is. Nothing in this file imports it; it is loaded the first time someone
 *    presses the button, so the editor's bundle does not carry a machine
 *    learning runtime for a feature most designs never touch.
 *
 * **On licences.** The obvious libraries are not usable here. `@imgly/background-removal`
 * is AGPL, which would reach into any closed-source app the editor is embedded
 * in; BRIA's RMBG weights, which most browser demos actually run, are licensed
 * for non-commercial use only. The built-in path therefore uses Transformers.js
 * (Apache-2.0) with a permissively licensed model, and this seam exists so that
 * a host who has bought a licence for something else can drop it in without
 * touching the editor.
 */
import config from '@/config'

export type TRemovalProgress = {
  /** 0 to 1 while the model comes down, or -1 for work with no measurable end. */
  fraction: number
  /** What to show the person waiting. */
  message: string
}

export type TBackgroundRemover = (image: Blob, onProgress?: (progress: TRemovalProgress) => void) => Promise<Blob>

let installed: TBackgroundRemover | null = null

/** Hands the work to a host app's own implementation. Pass null to take it back. */
export function setBackgroundRemover(remover: TBackgroundRemover | null): void {
  installed = remover
}

/** Whether the button should be offered at all. */
export function canRemoveBackground(): boolean {
  return Boolean(installed) || Boolean(config.BACKGROUND_REMOVAL_URL) || config.BACKGROUND_REMOVAL !== false
}

/**
 * Said when the work fails and nothing more specific is known.
 *
 * Which is nearly always a network problem: the model is a download, cached by
 * the browser afterwards, so the first cut-out on a machine is the one that
 * needs a connection and every later one does not.
 */
export const REMOVAL_FAILED = 'The background could not be removed'
export const REMOVAL_FAILED_DETAIL = 'This needs an internet connection the first time. After one photo has been cut out on this computer it works offline.'

async function removeOnServer(image: Blob, url: string): Promise<Blob> {
  const response = await fetch(url, { method: 'POST', body: image, headers: { 'Content-Type': image.type || 'image/png' } })
  if (!response.ok) throw new Error(`the server answered ${response.status}`)
  const png = await response.blob()
  if (!png.size) throw new Error('the server sent nothing back')
  return png
}

/** The picture with its background gone, as a PNG with transparency. */
export async function removeBackground(image: Blob, onProgress?: (progress: TRemovalProgress) => void): Promise<Blob> {
  if (installed) return installed(image, onProgress)
  if (config.BACKGROUND_REMOVAL_URL) {
    onProgress?.({ fraction: -1, message: 'Removing the background…' })
    return removeOnServer(image, config.BACKGROUND_REMOVAL_URL)
  }
  const { removeInBrowser } = await import('./backgroundRemovalModel')
  return removeInBrowser(image, onProgress)
}

// A test has to drive this without a network, and the model is a download this
// machine may not be able to make. Development builds only; a production bundle
// has the branch compiled out, and a host app uses the export above.
if ((import.meta as any).env?.DEV && typeof window !== 'undefined') {
  const globals = ((window as any).__designStudio ||= {})
  globals.setBackgroundRemover = setBackgroundRemover
}
