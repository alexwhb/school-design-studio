import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, widgetState } from '@/store/state'
import { setDLayouts } from '@/store/widget/widget'
import type { TdLayout } from '@/store/types'

beforeAll(() => {
  // A frame, as the renderer waits for one between pages. Node has none.
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => setTimeout(callback, 1))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

function design(count: number): TdLayout[] {
  return Array.from({ length: count }, (_, index) => ({
    global: { name: `p${index + 1}`, width: 100, height: 100, uuid: '-1', type: 'page' } as any,
    layers: [{ uuid: `a${index}`, type: 'w-rect', parent: '-1', left: 0, top: 0 } as any, { uuid: `b${index}`, type: 'w-rect', parent: '-1', left: 0, top: 0 } as any],
  }))
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('two exports at once', () => {
  beforeEach(async () => {
    canvasState.dCurrentPage = 0
    setDLayouts(design(3))
    // setDLayouts puts the page back as the active element on a timer of its own.
    await sleep(200)
  })

  it('run one after the other, never interleaved', async () => {
    const { withPageRenderer } = await import('@/common/methods/export/renderPage')
    const events: string[] = []
    const job = (name: string, ms: number) =>
      withPageRenderer(async () => {
        events.push(`${name} start`)
        await sleep(ms)
        events.push(`${name} end`)
        return name
      })
    const results = await Promise.all([job('download', 30), job('thumbnail', 5), job('pptx', 1)])
    expect(results).toEqual(['download', 'thumbnail', 'pptx'])
    expect(events).toEqual(['download start', 'download end', 'thumbnail start', 'thumbnail end', 'pptx start', 'pptx end'])
  })

  it('keeps going after one of them fails', async () => {
    const { withPageRenderer } = await import('@/common/methods/export/renderPage')
    const failed = withPageRenderer(async () => {
      throw new Error('no')
    })
    const next = withPageRenderer(async () => 'fine')
    await expect(failed).rejects.toThrow('no')
    await expect(next).resolves.toBe('fine')
  })

  it('puts the page and the selection back as they were', async () => {
    const { withPageRenderer } = await import('@/common/methods/export/renderPage')
    const { showPage } = await import('@/store/widget/pages')
    showPage(1)
    await sleep(20)
    widgetState.dActiveElement = canvasState.dPage
    widgetState.dSelectWidgets = [widgetState.dWidgets[0], widgetState.dWidgets[1]]

    await Promise.all([
      withPageRenderer(async () => {
        // What drawing page 3 does to the canvas.
        canvasState.dCurrentPage = 2
        widgetState.dSelectWidgets = []
      }),
      withPageRenderer(async () => undefined),
    ])
    await sleep(20)
    expect(canvasState.dCurrentPage).toBe(1)
    expect(widgetState.dSelectWidgets.map((item) => item.uuid)).toEqual(['a1', 'b1'])
  })

  it('selects the one widget again when one was selected', async () => {
    const { withPageRenderer } = await import('@/common/methods/export/renderPage')
    widgetState.dSelectWidgets = []
    widgetState.dActiveElement = widgetState.dWidgets[1]
    await withPageRenderer(async () => undefined)
    await sleep(20)
    expect(widgetState.dActiveElement?.uuid).toBe('b0')
  })
})
