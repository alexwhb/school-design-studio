import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Setting innerHTML on a detached element loads the images in it, so
 * `<img src=x onerror=…>` in a design's text ran as the text was read for its
 * words. The three readers that did that parse through DOMParser now; here the
 * detached element is made to throw, so a reader that went back to it fails.
 */
const parsed: string[] = []

beforeEach(() => {
  parsed.length = 0
  vi.stubGlobal(
    'DOMParser',
    class {
      parseFromString(source: string) {
        parsed.push(source)
        // Enough of a body for the readers: the words, with the tags taken off.
        const text = source.replace(/^<body>/, '').replace(/<[^>]*>/g, '')
        return { body: { textContent: text, childNodes: [], innerHTML: source.replace(/^<body>/, '') } }
      }
    },
  )
  vi.stubGlobal('document', {
    createElement: () => {
      throw new Error('a detached element was used to parse markup')
    },
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

const payload = '<img src=x onerror=alert(1)>Hello'

describe('reading the words out of markup', () => {
  it('a table cell', async () => {
    const { cellText } = await import('@/components/modules/widgets/wTable/tableModel')
    expect(cellText(payload)).toBe('Hello')
    expect(parsed).toEqual([`<body>${payload}`])
  })

  it('a text box on its way into a PowerPoint', async () => {
    const { htmlToText } = await import('@/common/methods/export/utils')
    expect(htmlToText(payload)).toBe('Hello')
    expect(parsed).toHaveLength(1)
  })

  it('a text box being searched', async () => {
    const { renderedText } = await import('@/utils/widgets/textMatch')
    expect(() => renderedText(payload)).not.toThrow()
    expect(parsed).toEqual([`<body>${payload}`])
  })
})
