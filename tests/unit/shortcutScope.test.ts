import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * Just enough of a DOM to say where focus is. The unit suite runs in node on
 * purpose (see vitest.config.ts), and the question under test is only which
 * element an event came from and what it is inside.
 */
class FakeNode {
  parentElement: FakeElement | null = null
}
class FakeElement extends FakeNode {
  isConnected = true
  isContentEditable = false
  constructor(
    public nodeName: string,
    parent: FakeElement | null = null,
  ) {
    super()
    this.parentElement = parent
  }
  contains(other: FakeNode | null): boolean {
    for (let node: FakeNode | null = other; node; node = node.parentElement) if (node === this) return true
    return false
  }
  classList = { add: () => undefined, remove: () => undefined }
}

const html = new FakeElement('HTML')
const body = new FakeElement('BODY', html)
const hostButton = new FakeElement('BUTTON', body)
const hostInput = new FakeElement('INPUT', body)
const hostEditable = Object.assign(new FakeElement('DIV', body), { isContentEditable: true })
const editorRoot = new FakeElement('DIV', body)
const editorBoard = new FakeElement('DIV', editorRoot)
const editorTitle = new FakeElement('INPUT', editorRoot)
const editorSelect = new FakeElement('SELECT', editorRoot)

beforeAll(() => {
  vi.stubGlobal('Node', FakeNode)
  vi.stubGlobal('Element', FakeElement)
  vi.stubGlobal('document', { body, documentElement: html, hasFocus: () => true, getElementById: () => null, querySelector: () => null, activeElement: null, addEventListener: () => undefined, removeEventListener: () => undefined })
  vi.stubGlobal('window', {})
})
afterAll(() => {
  vi.unstubAllGlobals()
})

async function load() {
  const appRoot = await import('@/common/hooks/appRoot')
  appRoot.setAppRoot(editorRoot as unknown as HTMLElement)
  const { handleKeydowm } = await import('@/mixins/shortcuts')
  const { widgetState, controlState } = await import('@/store/state')
  return { appRoot, handleKeydowm, widgetState, controlState }
}

function key(target: FakeNode, props: Record<string, unknown>) {
  return { target, key: '', keyCode: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, preventDefault: vi.fn(), ...props }
}

describe('whose key is it', () => {
  let widget: any
  beforeEach(async () => {
    const { widgetState, controlState } = await load()
    widget = { uuid: 'w1', type: 'w-rect', parent: '-1', left: 10, top: 10 }
    widgetState.dWidgets = [widget]
    widgetState.dLayouts = [{ global: {} as any, layers: widgetState.dWidgets }]
    widgetState.dActiveElement = widgetState.dWidgets[0]
    widgetState.dSelectWidgets = []
    controlState.showMoveable = true
  })

  it('does not delete the selection for a Backspace on the host’s button', async () => {
    const { handleKeydowm, widgetState } = await load()
    handleKeydowm({ save: vi.fn(), zoomAdd: vi.fn(), zoomSub: vi.fn() })(key(hostButton, { key: 'Backspace', keyCode: 8 }))
    expect(widgetState.dWidgets).toHaveLength(1)
  })

  it('does not nudge the selection for an arrow in the host’s menus', async () => {
    const { handleKeydowm, widgetState } = await load()
    const e = key(hostButton, { key: 'ArrowDown', keyCode: 40 })
    handleKeydowm({ save: vi.fn(), zoomAdd: vi.fn(), zoomSub: vi.fn() })(e)
    expect(widgetState.dWidgets[0].top).toBe(10)
    expect(e.preventDefault).not.toHaveBeenCalled()
  })

  it('leaves the host’s own fields and contentEditable alone, Ctrl+S and Ctrl+Z included', async () => {
    const { handleKeydowm } = await load()
    const save = vi.fn()
    for (const target of [hostInput, hostEditable]) {
      for (const props of [
        { key: 's', keyCode: 83, ctrlKey: true },
        { key: 'z', keyCode: 90, metaKey: true },
        { key: 'a', keyCode: 65, ctrlKey: true },
        { key: ' ', keyCode: 32 },
      ]) {
        const e = key(target, props)
        handleKeydowm({ save, zoomAdd: vi.fn(), zoomSub: vi.fn() })(e)
        expect(e.preventDefault).not.toHaveBeenCalled()
      }
    }
    expect(save).not.toHaveBeenCalled()
  })

  it('still answers with focus on the body, where a click on the canvas leaves it', async () => {
    const { handleKeydowm, widgetState } = await load()
    const e = key(body, { key: 'ArrowDown', keyCode: 40 })
    handleKeydowm({ save: vi.fn(), zoomAdd: vi.fn(), zoomSub: vi.fn() })(e)
    expect(widgetState.dWidgets[0].top).toBe(11)
    expect(e.preventDefault).toHaveBeenCalled()
  })

  it('answers inside the editor', async () => {
    const { handleKeydowm, widgetState } = await load()
    handleKeydowm({ save: vi.fn(), zoomAdd: vi.fn(), zoomSub: vi.fn() })(key(editorBoard, { key: 'ArrowRight', keyCode: 39 }))
    expect(widgetState.dWidgets[0].left).toBe(11)
  })

  it('saves on Ctrl+S in the editor’s own fields, instead of the browser’s Save page', async () => {
    const { handleKeydowm, widgetState } = await load()
    const save = vi.fn()
    const e = key(editorTitle, { key: 's', keyCode: 83, metaKey: true })
    handleKeydowm({ save, zoomAdd: vi.fn(), zoomSub: vi.fn() })(e)
    expect(save).toHaveBeenCalledOnce()
    expect(e.preventDefault).toHaveBeenCalled()

    // Any other key in a field is the field's.
    const del = key(editorSelect, { key: 'Backspace', keyCode: 8 })
    handleKeydowm({ save, zoomAdd: vi.fn(), zoomSub: vi.fn() })(del)
    expect(widgetState.dWidgets).toHaveLength(1)
  })
})

describe('whose right-click is it', () => {
  it('is the editor’s only inside it, and never in a field or text being typed', async () => {
    const { appRoot } = await load()
    expect(appRoot.isEditorPointerTarget(hostButton)).toBe(false)
    expect(appRoot.isEditorPointerTarget(body)).toBe(false)
    expect(appRoot.isEditorPointerTarget(editorBoard)).toBe(true)
    const typing = Object.assign(new FakeElement('DIV', editorBoard), { isContentEditable: true })
    expect(appRoot.isFieldTarget(typing)).toBe(true)
    expect(appRoot.isFieldTarget(editorTitle)).toBe(true)
    expect(appRoot.isFieldTarget(editorBoard)).toBe(false)
  })
})
