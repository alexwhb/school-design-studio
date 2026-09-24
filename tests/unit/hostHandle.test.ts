import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, historyState, widgetState } from '@/store/state'
import { clearHistory, handleHistory } from '@/store/history'
import { setDLayouts } from '@/store/widget/widget'
import { showPage } from '@/store/widget/pages'
import { recordHistory } from '@/common/hooks/history'
import { createHostDocument, readDocument } from '@/common/hooks/hostDocument'
import { autosaveState } from '@/common/hooks/autosave'
import { fitZoom, MIN_ZOOM } from '@/components/modules/layout/zoomControl/fitZoom'
import type { TdLayout } from '@/store/types'

function design(pages = 1): TdLayout[] {
  return Array.from({ length: pages }, (_, index) => ({
    global: { name: `p${index + 1}`, width: 100, height: 100, uuid: '-1', type: 'page' } as any,
    layers: [{ uuid: `t${index}`, type: 'w-text', text: 'Hello', parent: '-1', left: 0, top: 0 } as any],
  }))
}

function keeper(title = { value: 'Open House' }) {
  const options = { current: { getTitle: () => title.value, onChange: vi.fn(), onSave: vi.fn(async () => undefined) } }
  const host = createHostDocument(options)
  host.start()
  return { host, options, title }
}

beforeEach(() => {
  clearHistory()
  canvasState.dCurrentPage = 0
  setDLayouts(design(3))
})

describe('markSaved', () => {
  it('makes the design read as saved without touching the canvas or the undo history', () => {
    const { host } = keeper()
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].left = 50
    })
    expect(host.isDirty()).toBe(true)
    const layouts = widgetState.dLayouts
    const steps = historyState.dHistoryStack.changes.length

    host.markSaved()
    expect(host.isDirty()).toBe(false)
    expect(autosaveState.status).toBe('saved')
    expect(widgetState.dLayouts).toBe(layouts)
    expect(widgetState.dLayouts[0].layers[0].left).toBe(50)
    expect(historyState.dHistoryStack.changes).toHaveLength(steps)

    // Undo past the host's save is unsaved again.
    handleHistory('undo')
    expect(host.isDirty()).toBe(true)
    host.dispose()
  })

  it('takes the document the host saved as the baseline', () => {
    const { host } = keeper()
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].left = 50
    })
    const saved = readDocument('Open House')
    host.markSaved(saved)
    expect(host.isDirty()).toBe(false)

    // A document older than the canvas leaves the canvas unsaved, which is true.
    const older = { ...saved, layouts: design(3) }
    host.markSaved(older)
    expect(host.isDirty()).toBe(true)
    expect(autosaveState.status).toBe('unsaved')
    host.dispose()
  })
})

describe('renaming the design', () => {
  it('is an unsaved change, and the host hears about it', async () => {
    vi.useFakeTimers()
    const { host, options, title } = keeper()
    expect(host.isDirty()).toBe(false)
    title.value = 'Spring Open House'
    host.schedule()
    await vi.advanceTimersByTimeAsync(1100)
    expect(host.isDirty()).toBe(true)
    expect(autosaveState.status).toBe('unsaved')
    expect(options.current.onChange).toHaveBeenCalledWith(expect.objectContaining({ title: 'Spring Open House' }), { dirty: true })
    host.dispose()
    vi.useRealTimers()
  })
})

describe('goToPage', () => {
  it('rounds and clamps what it is given rather than throwing', () => {
    expect(() => showPage(1.6)).not.toThrow()
    expect(canvasState.dCurrentPage).toBe(2)
    showPage(0.4)
    expect(canvasState.dCurrentPage).toBe(0)
    showPage(-3)
    expect(canvasState.dCurrentPage).toBe(0)
    showPage(99)
    expect(canvasState.dCurrentPage).toBe(2)
    expect(() => showPage(Number.NaN)).not.toThrow()
    expect(canvasState.dCurrentPage).toBe(0)
    expect(() => showPage(Infinity)).not.toThrow()
  })
})

describe('the zoom that fits the page', () => {
  const page = { width: 1920, height: 1080 }

  it('is never negative when the board measures nothing', () => {
    expect(fitZoom({ screen: { width: 0, height: 0 }, page, padding: 25, bottom: 0 })).toBe(MIN_ZOOM)
    expect(fitZoom({ screen: { width: 0, height: 0 }, page: { width: 0, height: 0 }, padding: 25, bottom: 0 })).toBe(MIN_ZOOM)
  })

  it('is the fit otherwise', () => {
    expect(fitZoom({ screen: { width: 1000, height: 1000 }, page, padding: 25, bottom: 0 })).toBeCloseTo(((1000 - 72) * 100) / 1920)
  })
})
