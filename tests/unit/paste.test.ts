import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handlePaste, { clipboardTextToMarkup } from '@/mixins/methods/handlePaste'
import { historyState, widgetState } from '@/store/state'

/** A clipboard holding `text` as plain text, the way the async API hands it over. */
function clipboardWith(text: string) {
  return {
    read: async () => [{ types: ['text/plain'], getType: async () => new Blob([text], { type: 'text/plain' }) }],
    readText: async () => text,
    write: async () => undefined,
  }
}

describe('pasting words off the clipboard', () => {
  it('keeps the characters markup would eat', () => {
    expect(clipboardTextToMarkup('A < B')).toBe('A &lt; B')
    expect(clipboardTextToMarkup('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('never lets pasted markup through as markup', () => {
    expect(clipboardTextToMarkup('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('turns each line into a line of the box, whatever wrote the line ends', () => {
    expect(clipboardTextToMarkup('one\r\ntwo\rthree\nfour')).toBe('one<br>two<br>three<br>four')
  })
})

describe('what Ctrl+V does', () => {
  beforeEach(() => {
    widgetState.dActiveElement = null
    widgetState.dWidgets = []
    historyState.dHistoryParams.stackPointer = -1
    historyState.dHistoryStack.changes = []
    historyState.dHistoryStack.inverseChanges = []
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('makes a text box of what was copied, escaped', async () => {
    vi.stubGlobal('navigator', { clipboard: clipboardWith('Tom & Jerry <3') })
    expect(await handlePaste(null)).toBe('text')
    expect(widgetState.dWidgets).toHaveLength(1)
    expect(widgetState.dWidgets[0].text).toBe('Tom &amp; Jerry &lt;3')
  })

  it('reads an empty clipboard as nothing, so a copied widget is pasted instead', async () => {
    // Copying a widget writes an empty string to the clipboard on purpose.
    vi.stubGlobal('navigator', { clipboard: clipboardWith('') })
    expect(await handlePaste(null)).toBe('none')
    expect(widgetState.dWidgets).toHaveLength(0)
  })

  it('settles when the clipboard cannot be read at all', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        read: async () => {
          throw new Error('denied')
        },
      },
    })
    expect(await handlePaste(null)).toBe('none')
  })
})
