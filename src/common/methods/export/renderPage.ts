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
import type { TdWidgetData } from '@/store/design/widget'

const CANVAS_ID = 'page-design-canvas'

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

/** Gives the browser a frame or two to actually paint the page we just switched to. */
function afterPaint(delay = 120): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, delay))
  })
}

async function capture(el: HTMLElement, scale: number): Promise<string | null> {
  const clone = el.cloneNode(true) as HTMLElement
  clone.setAttribute('id', 'export-clone')
  clone.style.position = 'absolute'
  clone.style.left = '-99999px'
  clone.style.top = '0'
  document.body.appendChild(clone)
  try {
    const fonts = document.fonts
    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      useCORS: true,
      scale,
      logging: false,
      onclone: (doc: Document) => fonts.forEach((font) => (doc as any).fonts.add(font)),
    })
    return canvas.toDataURL('image/png')
  } catch (e) {
    console.warn('[export] could not render', e)
    return null
  } finally {
    clone.remove()
  }
}

export type PageRenderer = {
  renderPage: (pageIndex: number) => Promise<string | null>
  renderWidget: (pageIndex: number, widget: TdWidgetData) => Promise<string | null>
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
    async renderPage(pageIndex) {
      await goTo(pageIndex)
      const el = document.getElementById(CANVAS_ID)
      return el ? capture(el, scaleForZoom()) : null
    },
    async renderWidget(pageIndex, widget) {
      await goTo(pageIndex)
      const el = document.getElementById(String(widget.uuid))
      return el ? capture(el, scaleForZoom()) : null
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
