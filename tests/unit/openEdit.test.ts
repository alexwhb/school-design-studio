import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sanitizeFields, type DesignDocument } from '@/compose'
import { readDocument } from '@/common/hooks/hostDocument'
import { commitOpenEdit, registerOpenEdit } from '@/common/methods/openEdit'
import { canvasState, widgetState } from '@/store/state'
import { setDLayouts } from '@/store/widget/widget'
import { plainLayouts } from '@/store/transient'
import type { TdLayout } from '@/store/types'

function layouts(): TdLayout[] {
  return [
    {
      global: { name: 'p1', width: 100, height: 100, uuid: '-1', type: 'page' } as any,
      layers: [{ uuid: 't1', type: 'w-text', text: 'Hello', parent: '-1', editable: true, cropEdit: true } as any],
    },
  ]
}

let unregister: (() => void) | null = null

beforeEach(() => {
  canvasState.dCurrentPage = 0
  setDLayouts(layouts())
})
afterEach(() => {
  unregister?.()
  unregister = null
})

describe('words still being typed', () => {
  it('are stored before the design is read out', () => {
    // What a text box with the caret registers: its words, into the store.
    unregister = registerOpenEdit({
      commit: () => {
        widgetState.dLayouts[0].layers[0].text = 'Hello, everyone'
      },
      finish: () => undefined,
    })
    expect(readDocument('Title').layouts[0].layers[0].text).toBe('Hello, everyone')
  })

  it('end the edit when asked to, and only that edit', () => {
    let finished = 0
    let committed = 0
    const edit = { commit: () => committed++, finish: () => finished++ }
    unregister = registerOpenEdit(edit)
    commitOpenEdit({ end: true })
    expect([committed, finished]).toEqual([0, 1])
    unregister()
    unregister = null
    commitOpenEdit()
    expect(committed).toBe(0)
  })

  it('do not stop a save when the box cannot store them', () => {
    unregister = registerOpenEdit({
      commit: () => {
        throw new Error('gone')
      },
      finish: () => undefined,
    })
    const warn = console.warn
    console.warn = () => undefined
    expect(() => readDocument('Title')).not.toThrow()
    console.warn = warn
  })
})

describe('the flags a box has while it is being edited', () => {
  it('are left off a document read out of the editor', () => {
    const layer = readDocument('Title').layouts[0].layers[0] as Record<string, unknown>
    expect(layer).not.toHaveProperty('editable')
    expect(layer).not.toHaveProperty('cropEdit')
    expect(layer.text).toBe('Hello')
    // The store keeps them: the shortcuts read `editable` while the caret is in.
    expect(widgetState.dLayouts[0].layers[0].editable).toBe(true)
  })

  it('are taken off a document on its way in', () => {
    const doc: DesignDocument = { format: 'design-studio/v1', title: 'x', layouts: layouts() }
    const { doc: safe } = sanitizeFields(doc)
    expect(safe.layouts[0].layers[0]).not.toHaveProperty('editable')
    expect(safe.layouts[0].layers[0]).not.toHaveProperty('cropEdit')
    // And the host's own object is left as it was.
    expect(doc.layouts[0].layers[0].editable).toBe(true)
  })

  it('are left off a plain copy of the layouts', () => {
    expect(plainLayouts(layouts())[0].layers[0]).toEqual({ uuid: 't1', type: 'w-text', text: 'Hello', parent: '-1' })
  })
})
