import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enablePatches, produceWithPatches } from 'immer'
import { canvasState, historyState, widgetState } from '@/store/state'
import { changeHistory, clearHistory, handleHistory } from '@/store/history'
import { setDLayouts } from '@/store/widget/widget'
import type { TdLayout } from '@/store/types'

enablePatches()

function pageOf(name: string): TdLayout {
  return { global: { name, width: 100, height: 100, backgroundColor: '#fff', uuid: '-1', type: 'page' } as any, layers: [{ uuid: `${name}-w`, type: 'w-text', text: name, parent: '-1' } as any] }
}

/** A design of `count` pages, with the canvas on the first. */
function design(count: number): TdLayout[] {
  return Array.from({ length: count }, (_, i) => pageOf(`p${i + 1}`))
}

/** Records the step from `before` to `after` the way the bracket does. */
function step(before: TdLayout[], change: (draft: TdLayout[]) => void) {
  const [, patches, inversePatches] = produceWithPatches(JSON.parse(JSON.stringify(before)), change)
  changeHistory({ patches, inversePatches })
}

const names = () => widgetState.dLayouts.map((layout) => layout.global.name)

beforeEach(() => {
  clearHistory()
  canvasState.dCurrentPage = 0
  setDLayouts(design(1))
})

describe('undo across pages', () => {
  it('puts back a design with fewer pages while a later page is on screen', () => {
    // One step that added four pages — an applyOps from the host, say — and
    // then a look at the last of them.
    const before = design(1)
    step(before, (draft) => {
      draft.push(pageOf('p2'), pageOf('p3'), pageOf('p4'), pageOf('p5'))
    })
    setDLayouts(design(5))
    canvasState.dCurrentPage = 4

    expect(() => handleHistory('undo')).not.toThrow()
    expect(names()).toEqual(['p1'])
    expect(canvasState.dCurrentPage).toBe(0)
    expect(widgetState.dWidgets[0].uuid).toBe('p1-w')
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)

    handleHistory('redo')
    expect(names()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
    expect(historyState.dHistoryParams.stackPointer).toBe(0)
  })

  it('keeps the store and the pointer together when a step cannot be applied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setDLayouts(design(3))
    // A step recorded against some other design: it names a page this one
    // does not have.
    changeHistory({ patches: [{ op: 'replace', path: [7, 'global', 'name'], value: 'x' }], inversePatches: [{ op: 'replace', path: [7, 'global', 'name'], value: 'y' }] })
    const layouts = widgetState.dLayouts

    expect(() => handleHistory('undo')).not.toThrow()
    // Nothing was swapped, and the history that did not fit is gone rather
    // than waiting to fail again.
    expect(widgetState.dLayouts).toBe(layouts)
    expect(historyState.dHistoryStack.changes).toHaveLength(0)
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)
    warn.mockRestore()
  })

  it('clamps the page on screen to the design however far past the end it is', () => {
    canvasState.dCurrentPage = 9
    setDLayouts(design(2))
    expect(canvasState.dCurrentPage).toBe(1)
    expect(widgetState.dWidgets[0].uuid).toBe('p2-w')
  })
})

describe('the undo stack across documents', () => {
  it('holds no more steps than maxLength, dropping the oldest', () => {
    const cap = historyState.dHistoryParams.maxLength
    for (let i = 0; i < cap + 5; i++) {
      changeHistory({ patches: [{ op: 'replace', path: [0, 'global', 'name'], value: `n${i}` }], inversePatches: [{ op: 'replace', path: [0, 'global', 'name'], value: `o${i}` }] })
    }
    expect(historyState.dHistoryStack.changes).toHaveLength(cap)
    expect(historyState.dHistoryStack.inverseChanges).toHaveLength(cap)
    expect(historyState.dHistoryParams.stackPointer).toBe(cap - 1)
    // The newest is still the one on top.
    expect(historyState.dHistoryStack.changes[cap - 1][0].value).toBe(`n${cap + 4}`)
  })

  it('forgets every step, and a press still open, when the document is replaced', async () => {
    const { beginHistory, recordHistory, resetHistory } = await import('@/common/hooks/history')
    recordHistory(() => {
      widgetState.dLayouts[0].global.name = 'renamed'
    })
    expect(historyState.dHistoryStack.changes).toHaveLength(1)

    // A press that began on the old design and has not been written down yet.
    beginHistory()
    resetHistory()
    setDLayouts(design(2))
    expect(historyState.dHistoryStack.changes).toHaveLength(0)
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)

    // Undo now has nothing to do, rather than old patches to misapply.
    handleHistory('undo')
    expect(names()).toEqual(['p1', 'p2'])
  })

  it('takes a swap that keeps its history back in one step', async () => {
    const { recordHistory } = await import('@/common/hooks/history')
    setDLayouts(design(2))
    recordHistory(() => setDLayouts(design(4)))
    expect(historyState.dHistoryStack.changes).toHaveLength(1)
    handleHistory('undo')
    expect(names()).toEqual(['p1', 'p2'])
  })
})
