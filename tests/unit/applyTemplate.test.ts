import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, historyState, widgetState } from '@/store/state'
import { clearHistory, handleHistory } from '@/store/history'
import { setDLayouts } from '@/store/widget/widget'
import { applyTemplate, pageHasContent, templatePages, type LoadedTemplate } from '@/store/widget/applyTemplate'
import { MAX_PAGES } from '@/compose'
import type { TdLayout } from '@/store/types'

vi.useFakeTimers()

const pageGlobal = (name: string, width = 1920) => ({ uuid: '-1', type: 'page', name, width, height: 1080, backgroundColor: '#ffffffff' }) as any
const text = (uuid: string, words: string) => ({ uuid, type: 'w-text', text: words, parent: '-1', left: 0, top: 0, width: 100, height: 40, fontSize: 24 }) as any

function mine(): TdLayout[] {
  return [
    { global: pageGlobal('Mine'), layers: [text('a', 'My heading'), text('b', 'My words')] },
    { global: pageGlobal('Second'), layers: [text('c', 'Page two')] },
  ]
}

const TEMPLATE: LoadedTemplate = {
  title: 'Book fair',
  pages: [{ global: pageGlobal('Template', 1275), layers: [text('-1', 'Book fair'), text('-2', 'Friday in the hall')] }],
}

const words = (index: number) => widgetState.dLayouts[index].layers.map((layer) => layer.text)

beforeEach(() => {
  clearHistory()
  canvasState.dCurrentPage = 0
  setDLayouts(mine())
})

describe('applyTemplate', () => {
  it('replaces the page on screen as one step, and one undo gives the old page back unmixed', () => {
    expect(pageHasContent()).toBe(true)
    expect(applyTemplate(TEMPLATE, 'replace')).toBe(true)
    expect(historyState.dHistoryParams.stackPointer).toBe(0)
    expect(words(0)).toEqual(['Book fair', 'Friday in the hall'])
    expect(widgetState.dLayouts[0].global.width).toBe(1275)
    expect(widgetState.dLayouts).toHaveLength(2)

    handleHistory('undo')
    expect(words(0)).toEqual(['My heading', 'My words'])
    expect(widgetState.dLayouts[0].global.width).toBe(1920)
    expect(words(1)).toEqual(['Page two'])
  })

  it('adds the template after the page on screen and leaves that page alone', () => {
    expect(applyTemplate(TEMPLATE, 'add')).toBe(true)
    expect(widgetState.dLayouts.map((layout) => layout.global.name)).toEqual(['Mine', 'Template', 'Second'])
    expect(canvasState.dCurrentPage).toBe(1)
    expect(words(0)).toEqual(['My heading', 'My words'])
    expect(words(1)).toEqual(['Book fair', 'Friday in the hall'])

    handleHistory('undo')
    expect(widgetState.dLayouts.map((layout) => layout.global.name)).toEqual(['Mine', 'Second'])
  })

  it('gives every widget a fresh id, so the same template twice is two pages', () => {
    applyTemplate(TEMPLATE, 'add')
    applyTemplate(TEMPLATE, 'add')
    const ids = widgetState.dLayouts.flatMap((layout) => layout.layers.map((layer) => layer.uuid))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.some((id) => Number(id) < 0)).toBe(false)
  })

  it('refuses to add past the page limit, and changes nothing', () => {
    setDLayouts(Array.from({ length: MAX_PAGES }, (_, i) => ({ global: pageGlobal(`p${i}`), layers: [] })))
    expect(applyTemplate(TEMPLATE, 'add')).toBe(false)
    expect(widgetState.dLayouts).toHaveLength(MAX_PAGES)
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)
  })

  it('reads both shapes a template file comes in', () => {
    expect(templatePages([{ global: pageGlobal('x'), layers: [text('1', 'a')] }])).toHaveLength(1)
    expect(templatePages({ page: pageGlobal('x'), widgets: [text('1', 'a')] })[0].layers).toHaveLength(1)
    expect(templatePages(null)).toEqual([])
  })
})
