import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, historyState, widgetState } from '@/store/state'
import { layoutsRevision } from '@/store/revision'
import { clearHistory, handleHistory } from '@/store/history'
import { setDLayouts } from '@/store/widget/widget'
import { beginHistory, endHistory, recordHistory } from '@/common/hooks/history'
import { createHostDocument } from '@/common/hooks/hostDocument'
import { autosaveState } from '@/common/hooks/autosave'
import type { TdLayout } from '@/store/types'

function design(): TdLayout[] {
  return [{ global: { name: 'p1', width: 100, height: 100, uuid: '-1', type: 'page' } as any, layers: [{ uuid: 't1', type: 'w-text', text: 'Hello', parent: '-1', left: 0, top: 0 } as any] }]
}

beforeEach(() => {
  clearHistory()
  canvasState.dCurrentPage = 0
  setDLayouts(design())
})

describe('the design’s revision', () => {
  it('does not move for a selection or a hover', () => {
    const before = layoutsRevision()
    widgetState.dActiveElement = widgetState.dWidgets[0]
    widgetState.dHoverUuid = 't1'
    widgetState.dSelectWidgets = []
    expect(layoutsRevision()).toBe(before)
  })

  it('moves for a change to the design, at once', () => {
    const before = layoutsRevision()
    widgetState.dLayouts[0].layers[0].left = 20
    expect(layoutsRevision()).toBeGreaterThan(before)
  })

  it('moves when the layouts are swapped for others', () => {
    const before = layoutsRevision()
    setDLayouts(design())
    expect(layoutsRevision()).toBeGreaterThan(before)
  })
})

describe('the undo bracket', () => {
  it('records nothing, and writes no JSON, for a press that changed nothing', () => {
    const stringify = vi.spyOn(JSON, 'stringify')
    beginHistory()
    widgetState.dActiveElement = widgetState.dWidgets[0]
    endHistory()
    expect(historyState.dHistoryStack.changes).toHaveLength(0)
    expect(stringify).not.toHaveBeenCalled()
    stringify.mockRestore()
  })

  it('records a press that did change something', () => {
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].left = 40
    })
    expect(historyState.dHistoryStack.changes).toHaveLength(1)
    handleHistory('undo')
    expect(widgetState.dLayouts[0].layers[0].left).toBe(0)
  })

  it('does not make a step of a box being clicked into and out of', () => {
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].editable = true
    })
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].editable = false
    })
    expect(historyState.dHistoryStack.changes).toHaveLength(0)
  })

  it('closes a bracket left open as its own step when another begins', () => {
    beginHistory()
    widgetState.dLayouts[0].layers[0].left = 5
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].top = 7
    })
    expect(historyState.dHistoryStack.changes).toHaveLength(2)
    handleHistory('undo')
    expect(widgetState.dLayouts[0].layers[0].top).toBe(0)
    expect(widgetState.dLayouts[0].layers[0].left).toBe(5)
  })
})

describe('the dirty check', () => {
  function keeper() {
    const options = { current: { getTitle: () => 'Title', onChange: vi.fn(), onSave: vi.fn(async () => undefined) } }
    const host = createHostDocument(options)
    host.start()
    return { host, options }
  }

  it('asks again about the same design for free', () => {
    const { host } = keeper()
    expect(host.isDirty()).toBe(false)
    const stringify = vi.spyOn(JSON, 'stringify')
    widgetState.dHoverUuid = 'somewhere'
    widgetState.dActiveElement = widgetState.dWidgets[0]
    expect(host.isDirty()).toBe(false)
    expect(host.isDirty()).toBe(false)
    expect(stringify).not.toHaveBeenCalled()
    stringify.mockRestore()
    host.dispose()
  })

  it('sees a change, and sees it undone', async () => {
    vi.useFakeTimers()
    const { host, options } = keeper()
    recordHistory(() => {
      widgetState.dLayouts[0].layers[0].left = 90
    })
    expect(host.isDirty()).toBe(true)
    await vi.advanceTimersByTimeAsync(1100)
    expect(autosaveState.status).toBe('unsaved')
    expect(options.current.onChange).toHaveBeenLastCalledWith(expect.anything(), { dirty: true })

    // Undone all the way back to what was saved: clean again, and the host
    // is told so rather than left holding "unsaved".
    handleHistory('undo')
    await vi.advanceTimersByTimeAsync(1100)
    expect(host.isDirty()).toBe(false)
    expect(autosaveState.status).toBe('saved')
    expect(options.current.onChange).toHaveBeenLastCalledWith(expect.anything(), { dirty: false })
    host.dispose()
    vi.useRealTimers()
  })
})

describe('a step on a design of several pages', () => {
  it('is taken and undone page by page', () => {
    setDLayouts([...design(), ...design(), ...design()].map((layout, index) => ({ ...layout, global: { ...layout.global, name: `p${index + 1}` } })))
    recordHistory(() => {
      widgetState.dLayouts[1].layers[0].left = 12
      widgetState.dLayouts[2].layers.push({ uuid: 'n1', type: 'w-text', text: 'New', parent: '-1' } as any)
      widgetState.dLayouts[2].layers[0].text = 'Changed'
    })
    const step = historyState.dHistoryStack.changes[0]
    expect(step.every((patch: any) => patch.path[0] === 1 || patch.path[0] === 2)).toBe(true)
    handleHistory('undo')
    expect(widgetState.dLayouts[1].layers[0].left).toBe(0)
    expect(widgetState.dLayouts[2].layers).toHaveLength(1)
    expect(widgetState.dLayouts[2].layers[0].text).toBe('Hello')
    handleHistory('redo')
    expect(widgetState.dLayouts[1].layers[0].left).toBe(12)
    expect(widgetState.dLayouts[2].layers.map((layer) => layer.text)).toEqual(['Changed', 'New'])
  })

  it('falls back to the whole design when a page was added', () => {
    recordHistory(() => {
      widgetState.dLayouts.push(design()[0])
    })
    handleHistory('undo')
    expect(widgetState.dLayouts).toHaveLength(1)
  })
})
