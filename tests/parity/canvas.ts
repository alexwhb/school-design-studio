import type { Page } from '@playwright/test'

export type CanvasSnapshot = {
  page: { width: string; height: string; transform: string; background: string; opacity: string }
  widgets: {
    type: string
    tag: string
    left: string
    top: string
    width: string
    height: string
    opacity: string
    fontSize: string
    fontWeight: string
    color: string
    lineHeight: string
    letterSpacing: string
    textAlign: string
    transform: string
    text: string
    src: string
    classes: string
  }[]
  selection: { present: boolean; left: string; top: string; width: string; height: string }
  layers: string[]
  zoom: string
}

/**
 * Reads what the editor is actually showing straight out of the DOM, so the
 * same probe works against the Vue build and the React one.
 */
export async function readCanvas(page: Page): Promise<CanvasSnapshot> {
  return page.evaluate(() => {
    const round = (value: string) => {
      const n = Number.parseFloat(value)
      return Number.isNaN(n) ? value : String(Math.round(n * 100) / 100)
    }

    const canvas = document.getElementById('page-design-canvas')
    const canvasStyle = canvas ? getComputedStyle(canvas) : null

    const widgets = Array.from(canvas?.querySelectorAll<HTMLElement>('[data-uuid]') ?? [])
      .filter((el) => el.getAttribute('data-uuid') !== '-1')
      .map((el) => {
        const cs = getComputedStyle(el)
        const img = el.querySelector('img')
        const textEl = el.querySelector('.edit-text')
        return {
          type: el.getAttribute('data-type') || '',
          tag: el.tagName.toLowerCase(),
          left: round(cs.left),
          top: round(cs.top),
          width: round(cs.width),
          height: round(cs.height),
          opacity: cs.opacity,
          fontSize: round(cs.fontSize),
          fontWeight: cs.fontWeight,
          color: cs.color,
          lineHeight: round(cs.lineHeight),
          letterSpacing: cs.letterSpacing,
          textAlign: cs.textAlign,
          transform: cs.transform,
          text: (textEl?.textContent || '').trim(),
          src: img ? new URL(img.getAttribute('src') || '', location.href).pathname : '',
          classes: Array.from(el.classList)
            .filter((c) => c.startsWith('w-') || c.startsWith('layer'))
            .sort()
            .join(' '),
        }
      })

    const control = document.querySelector<HTMLElement>('.moveable-control-box')
    const controlStyle = control ? getComputedStyle(control) : null
    const controlVisible = !!control && controlStyle?.display !== 'none' && controlStyle?.visibility !== 'hidden'

    const layers = Array.from(document.querySelectorAll<HTMLElement>('.widget-list .widget-name')).map((el) =>
      (el.textContent || '').trim(),
    )

    const zoomText = document.querySelector('#zoom-control .zoom-text')?.textContent?.trim() || ''

    return {
      page: {
        width: canvasStyle ? round(canvasStyle.width) : '',
        height: canvasStyle ? round(canvasStyle.height) : '',
        transform: canvasStyle ? canvasStyle.transform : '',
        background: canvasStyle ? canvasStyle.backgroundColor : '',
        opacity: canvasStyle ? canvasStyle.opacity : '',
      },
      widgets,
      selection: {
        present: !!controlVisible,
        left: controlStyle ? round(controlStyle.left) : '',
        top: controlStyle ? round(controlStyle.top) : '',
        width: controlStyle ? round(controlStyle.width) : '',
        height: controlStyle ? round(controlStyle.height) : '',
      },
      layers,
      zoom: zoomText,
    }
  })
}

/** Element Plus and the React port both key widgets off `data-uuid`. */
export async function widgetCount(page: Page): Promise<number> {
  return page.evaluate(
    () => document.querySelectorAll('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').length,
  )
}
