/**
 * Renders pages and individual elements to PNG data URLs.
 *
 * The editor only ever has one page mounted, so rendering a whole design means
 * switching to each page in turn, letting it paint, capturing it, and putting
 * the original page back when we are done. All of that is hidden behind
 * `withPageRenderer` so callers cannot forget the restore step.
 */
import html2canvas from 'html2canvas'
import FontFaceObserver from 'fontfaceobserver'
import { nextTick } from 'vue'
import { useCanvasStore, useControlStore, useWidgetStore } from '@/store'
import { rasterizeElement, subtreeNeedsRasterizing } from './rasterizeElement'
import { withTimeout } from './utils'
import type { TdWidgetData } from '@/store/design/widget'

const CANVAS_ID = 'page-design-canvas'

// These bounds exist to catch a wait that will never end, not to police slow
// work, so they are set well past anything a working export should need. A
// healthy machine renders a page in about 200ms; a throttled tab was measured
// taking ten times that for a heading with no effects at all, and an old laptop
// exporting a large design at 3× is doing real work in the same range. Cutting
// one of those off would turn a slow success into a failure, which is the
// mistake these were added to avoid making in the other direction. The render
// bound is per page, so a multi-page deck gets it afresh each time.
const RENDER_TIMEOUT = 120000

// Decoding is the one that degrades quietly rather than loudly: a widget that
// times out here falls back to html2canvas, which is exactly the wrong render
// for the outlined and gradient headings this path exists to fix. Worth extra
// room for that reason.
const DECODE_TIMEOUT = 30000

const IMAGE_TIMEOUT = 15000

/** Waits for every font used in the design, so text is not captured mid-swap. */
async function waitForFonts(): Promise<void> {
  const widgetStore = useWidgetStore()
  const families = new Set<string>()
  for (const page of widgetStore.dLayouts || []) {
    for (const widget of page.layers || []) {
      const family = (widget as any)?.fontClass?.value
      if (family) families.add(family)
    }
  }
  await Promise.all(
    Array.from(families).map((family) =>
      new FontFaceObserver(family).load(null, 10000).catch(() => {
        // A font that never arrives should not block the export; the browser
        // will fall back and the page still renders.
      }),
    ),
  )
}

/**
 * Gives the browser a frame or two to actually paint the page we just switched to.
 *
 * A hidden tab does not run requestAnimationFrame at all, so waiting only on a
 * frame would never return — and since this sits between pages, a multi-page
 * export left in the background would stop dead with the progress bar frozen
 * and no way out but a reload. A plain timer settles it in that case. The tab
 * is also throttled while hidden, so a background export is slower and can
 * catch a page mid-layout; imperfect beats unrecoverable.
 */
function afterPaint(delay = 120): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    requestAnimationFrame(() => setTimeout(finish, delay))
    setTimeout(finish, delay + 400)
  })
}

/**
 * Swaps every inline `<svg>` for an `<img>` of the same SVG.
 *
 * html2canvas walks the DOM itself and has no SVG renderer, so it draws an
 * inline `<svg>` as nothing at all — which is how a shape or sticker could sit
 * on the canvas and then be missing from the exported file. An `<img>` pointing
 * at the same markup goes down html2canvas's image path instead, where the
 * browser does the rasterising.
 *
 * Runs on the clone, after it is in the document, so the sizes are the ones the
 * element actually renders at.
 */
async function inlineSvgToImages(root: HTMLElement): Promise<void> {
  const pending: Promise<unknown>[] = []

  // The canvas carries the editor's zoom as `transform: scale()`, so every
  // getBoundingClientRect inside it comes back multiplied by that zoom. The
  // replacement <img> is sized in ordinary layout pixels, which the same
  // transform then scales again — so divide the zoom back out first, or a
  // shape exports at whatever fraction of its size the user was zoomed to.
  const zoom = root.getBoundingClientRect().width / root.offsetWidth || 1

  for (const svg of Array.from(root.querySelectorAll('svg'))) {
    const rect = svg.getBoundingClientRect()
    const width = rect.width / zoom
    const height = rect.height / zoom
    if (!width || !height) continue

    const standalone = svg.cloneNode(true) as SVGSVGElement
    standalone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    standalone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    // The widget strips the width/height attributes and sets `width: inherit`
    // so the SVG fills its box. Standing on its own there is nothing to inherit
    // from, so pin the size it was just measured at.
    standalone.setAttribute('width', String(width))
    standalone.setAttribute('height', String(height))
    standalone.style.width = `${width}px`
    standalone.style.height = `${height}px`

    const markup = new XMLSerializer().serializeToString(standalone)
    const img = document.createElement('img')
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
    img.style.width = `${width}px`
    img.style.height = `${height}px`
    img.style.display = 'block'
    svg.replaceWith(img)

    // Decode up front: html2canvas snapshots whatever the image has painted so
    // far, and an undecoded one paints nothing.
    pending.push(withTimeout(img.decode(), DECODE_TIMEOUT, 'decoding a shape').catch(() => undefined))
  }

  await Promise.all(pending)
}

/**
 * Pre-renders the widgets html2canvas would get wrong.
 *
 * A text widget carrying an outline or a gradient fill, and any masked image,
 * are drawn by the browser into a flat picture first — see `rasterizeElement`
 * for why. Each one that succeeds is swapped for that picture; each one that
 * fails is left alone, so the worst case is the old imperfect render rather
 * than a hole in the page.
 */
async function rasterizeUnsupported(root: HTMLElement, scale: number): Promise<void> {
  // Only whole widgets are replaced, never the layers inside one: an outlined
  // heading is a stack of layers that overlap exactly, and swapping them
  // individually would lose how they sit together.
  const widgets = Array.from(root.children).filter((child): child is HTMLElement => child instanceof HTMLElement)

  for (const widget of widgets) {
    if (!subtreeNeedsRasterizing(widget)) continue

    const picture = await rasterizeElement(widget, scale)
    if (!picture) {
      console.warn('[export] could not pre-render a widget; leaving it to html2canvas', widget.className)
      continue
    }

    const img = document.createElement('img')
    img.src = picture
    const style = getComputedStyle(widget)
    img.style.cssText = `position:absolute;left:${style.left};top:${style.top};width:${widget.offsetWidth}px;height:${widget.offsetHeight}px;transform:${style.transform};transform-origin:${style.transformOrigin};opacity:${style.opacity};display:block`
    widget.replaceWith(img)
    await withTimeout(img.decode(), DECODE_TIMEOUT, 'decoding a pre-rendered widget').catch(() => undefined)
  }
}

async function capture(el: HTMLElement, scale: number): Promise<string | null> {
  const clone = el.cloneNode(true) as HTMLElement
  clone.setAttribute('id', 'export-clone')
  clone.style.position = 'absolute'
  clone.style.left = '-99999px'
  clone.style.top = '0'
  document.body.appendChild(clone)
  try {
    await rasterizeUnsupported(clone, scale)
    await inlineSvgToImages(clone)
    const fonts = document.fonts
    // html2canvas waits on every image it finds, and has internal waits of its
    // own. If one of them never settles the export does not fail, it stops —
    // progress frozen, no error, nothing to do but reload. Bounding it makes
    // the worst case an error the caller can actually show.
    const canvas = await withTimeout(
      html2canvas(clone, {
        backgroundColor: null,
        useCORS: true,
        scale,
        logging: false,
        imageTimeout: IMAGE_TIMEOUT,
        // Firefox throws InvalidModificationError from `FontFaceSet.add()` for any
        // face that came from an @font-face rule, and html2canvas lets that escape
        // the whole export. Those faces are already in the clone, which carries
        // the same stylesheets; only the ones registered from JS (wText.vue) need
        // copying, so skip whatever the set refuses.
        onclone: (doc: Document) =>
          fonts.forEach((font) => {
            try {
              ;(doc as any).fonts.add(font)
            } catch {
              // already present via the cloned stylesheets
            }
          }),
      }),
      RENDER_TIMEOUT,
      'rendering the page',
    )
    return canvas.toDataURL('image/png')
  } catch (e) {
    console.warn('[export] could not render', e)
    return null
  } finally {
    clone.remove()
  }
}

export type PageRenderer = {
  /** `scale` multiplies the output resolution; 1 is the design's true pixel size. */
  renderPage: (pageIndex: number, scale?: number) => Promise<string | null>
  renderWidget: (pageIndex: number, widget: TdWidgetData, scale?: number) => Promise<string | null>
}

/**
 * Runs `work` with a renderer that can draw any page of the design, then puts
 * the editor back exactly as it was — same page, same selection, same zoom.
 */
export async function withPageRenderer<T>(work: (renderer: PageRenderer) => Promise<T>): Promise<T> {
  const canvasStore = useCanvasStore()
  const widgetStore = useWidgetStore()
  const controlStore = useControlStore()

  const originalPage = canvasStore.dCurrentPage
  const originalZoom = canvasStore.dZoom

  // Deselect first: the selection outline would otherwise be baked into the
  // exported image.
  controlStore.setShowMoveable(false)
  widgetStore.selectWidget({ uuid: '-1' })
  await waitForFonts()

  const goTo = async (pageIndex: number) => {
    if (canvasStore.dCurrentPage !== pageIndex) {
      canvasStore.dCurrentPage = pageIndex
      widgetStore.setDWidgets(widgetStore.getWidgets())
      canvasStore.setDPage(widgetStore.dLayouts[pageIndex].global)
      widgetStore.selectWidget({ uuid: '-1' })
      await nextTick()
      await afterPaint()
    }
  }

  // Capture at 100% so the output is the design's true pixel size regardless
  // of how far the user happens to be zoomed in.
  const scaleForZoom = () => 100 / (canvasStore.dZoom || 100)

  const renderer: PageRenderer = {
    async renderPage(pageIndex, scale = 1) {
      await goTo(pageIndex)
      const el = document.getElementById(CANVAS_ID)
      return el ? capture(el, scaleForZoom() * scale) : null
    },
    async renderWidget(pageIndex, widget, scale = 1) {
      await goTo(pageIndex)
      const el = document.getElementById(String(widget.uuid))
      return el ? capture(el, scaleForZoom() * scale) : null
    },
  }

  try {
    return await work(renderer)
  } finally {
    canvasStore.dCurrentPage = originalPage
    widgetStore.setDWidgets(widgetStore.getWidgets())
    canvasStore.setDPage(widgetStore.dLayouts[originalPage].global)
    canvasStore.updateZoom(originalZoom)
    widgetStore.selectWidget({ uuid: '-1' })
    await nextTick()
  }
}
