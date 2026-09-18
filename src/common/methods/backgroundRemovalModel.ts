/**
 * The in-browser background remover: Transformers.js running a segmentation
 * model over the photograph and keeping what it says is the subject.
 *
 * Everything here is behind a dynamic import from `backgroundRemoval`, and this
 * module in turn imports the library dynamically, so neither the runtime nor
 * the model is fetched until someone actually presses the button. The library
 * is bundled rather than pulled from a CDN — the same reasoning as the fonts
 * and the icon font, which were moved out of one because an unreachable CDN
 * took the whole editor down with it. The weights are not: they are tens of
 * megabytes and belong in the browser's cache, not in `dist/`.
 *
 * The model is `onnx-community/ormbg-ONNX`, which is Apache-2.0 — and so,
 * unusually, is the data it was trained on, which matters when the weights are
 * the part of this that a licence can bite. Most browser cut-out demos run
 * BRIA's RMBG, whose weights are licensed for non-commercial use only; the
 * IS-Net weights it shares an architecture with are AGPL. Both are out here.
 * The library's own default, `Xenova/modnet`, is Apache-2.0 and 6.6MB against
 * this one's 44, but it is a portrait matting model and returns nonsense for
 * anything that is not a person. `config.BACKGROUND_REMOVAL_MODEL` points at
 * anything else of the same shape, including a folder served from your own
 * origin.
 *
 * The 8-bit weights are the ones fetched: 44MB against 176MB for the full
 * precision, for a cut-out no one can tell apart.
 */
import config from '@/config'
import { REMOVAL_FAILED_DETAIL, type TRemovalProgress } from './backgroundRemoval'

type Segmenter = (input: string) => Promise<{ toBlob(type?: string, quality?: number): Promise<Blob> }>

/** The model is loaded once per tab and kept, so a second photo is immediate. */
let loading: Promise<Segmenter> | null = null

/**
 * Turns the library's per-file download reports into one number.
 *
 * A model is several files fetched at once, each reporting its own percentage,
 * so the bar tracks the total bytes rather than whichever file spoke last.
 */
function downloadProgress(onProgress?: (progress: TRemovalProgress) => void) {
  const files = new Map<string, { loaded: number; total: number }>()
  return (event: any) => {
    if (!onProgress) return
    if (event?.status === 'progress' && event.file && event.total) {
      files.set(event.file, { loaded: Number(event.loaded) || 0, total: Number(event.total) || 0 })
      let loaded = 0
      let total = 0
      for (const file of files.values()) {
        loaded += file.loaded
        total += file.total
      }
      if (total > 0) onProgress({ fraction: Math.min(1, loaded / total), message: 'Getting ready…' })
    } else if (event?.status === 'initiate') {
      onProgress({ fraction: 0, message: 'Getting ready…' })
    }
  }
}

/**
 * Transformers.js, if the host installed it.
 *
 * The specifier is held in a variable on purpose, and both bundlers are told to
 * leave the call alone. Written literally, this is a static dependency as far
 * as every bundler downstream is concerned: the embed build leaves it external,
 * so the published chunk carries `import("@huggingface/transformers")`, and the
 * host's own build then tries to resolve a package the host has no reason to
 * have installed. esbuild fails the dev pre-bundle and Rollup fails the
 * production build, and the app that does not use background removal is the one
 * that will not start. A specifier a bundler cannot read is one it hands to the
 * browser untouched, which is the whole point — this import is meant to be
 * answered at run time or not at all.
 *
 * See vite.embed.config.ts, and "Building it" in EMBEDDING.md.
 */
const TRANSFORMERS = '@huggingface/transformers'

async function loadTransformers() {
  try {
    return (await import(/* @vite-ignore */ /* webpackIgnore: true */ TRANSFORMERS)) as typeof import('@huggingface/transformers')
  } catch (error) {
    console.warn(`[background removal] ${TRANSFORMERS} is not installed`, error)
    throw new Error(MISSING_LIBRARY)
  }
}

/** Said when the library was never installed, which is not a network problem. */
export const MISSING_LIBRARY = 'Cutting a background out in the browser needs the @huggingface/transformers package, which this app does not have installed. Ask for it, or pick the photo out another way.'

async function load(onProgress?: (progress: TRemovalProgress) => void): Promise<Segmenter> {
  const { pipeline, env } = await loadTransformers()
  // There is no model folder on this origin to look in, and the library's
  // default under a bundler can be to try one first and 404 on every file it
  // wants. The browser's own cache keeps the weights after the first download.
  env.allowLocalModels = false
  env.allowRemoteModels = true
  const segmenter = await pipeline('background-removal', config.BACKGROUND_REMOVAL_MODEL, {
    dtype: 'q8',
    progress_callback: downloadProgress(onProgress),
  })
  return segmenter as unknown as Segmenter
}

/** The photograph with its background cut away, as a PNG with an alpha channel. */
export async function removeInBrowser(image: Blob, onProgress?: (progress: TRemovalProgress) => void): Promise<Blob> {
  let segmenter: Segmenter
  try {
    // A failed load leaves nothing cached, so pressing the button again after
    // the network comes back tries afresh rather than replaying the failure.
    loading = loading || load(onProgress)
    segmenter = await loading
  } catch (e) {
    loading = null
    console.warn('[background removal] could not load the model', e)
    // A missing library and a missing network are two different problems with
    // two different fixes, so they are not reported as one.
    throw new Error(e instanceof Error && e.message === MISSING_LIBRARY ? MISSING_LIBRARY : REMOVAL_FAILED_DETAIL)
  }

  onProgress?.({ fraction: -1, message: 'Removing the background…' })
  const url = URL.createObjectURL(image)
  try {
    const cutOut = await segmenter(url)
    // PNG, and only PNG: it is the format the transparency survives in, and the
    // whole point of the exercise is the transparency.
    return await cutOut.toBlob('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
