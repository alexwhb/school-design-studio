import { describe, expect, it } from 'vitest'
import { drawable } from '@/viewer/drawable'
import { composeDeck, type DesignDocument } from '@/compose'

describe('what the viewer draws', () => {
  it('draws a composed deck as it is', () => {
    const doc = composeDeck({ title: 'x', slides: [{ layout: 'title', title: 'Open House', kicker: null, sub: 'Thursday', bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }] })
    const pages = drawable(doc)
    expect(pages).toHaveLength(1)
    expect(JSON.stringify(pages[0].layers.map((layer) => layer.text))).toBe(JSON.stringify(doc.layouts[0].layers.map((layer) => layer.text)))
  })

  it('never draws markup or a paint a design may not hold', () => {
    const doc = {
      format: 'design-studio/v1',
      title: 'x',
      layouts: [
        {
          global: { uuid: '-1', type: 'page', width: 100, height: 100, backgroundColor: 'url(https://evil.example/x)' },
          layers: [
            { uuid: 'a', type: 'w-text', text: 'Hi <img src=x onerror="alert(1)"><script>alert(2)</script>' },
            { uuid: 'b', type: 'w-table', cells: [['<b>ok</b>', '<iframe src="//evil"></iframe>']] },
          ],
        },
      ],
    } as unknown as DesignDocument
    const [page] = drawable(doc)
    expect(page.global.backgroundColor).toBe('#ffffffff')
    expect(String(page.layers[0].text)).not.toMatch(/<img|<script|onerror/)
    expect(String(page.layers[0].text)).toContain('Hi')
    expect(JSON.stringify((page.layers[1] as any).cells)).not.toMatch(/iframe/)
    // The host's copy is left as it was.
    expect(String(doc.layouts[0].layers[0].text)).toContain('<img')
  })

  it('draws nothing for something that is not a design', () => {
    expect(drawable(null as unknown as DesignDocument)).toEqual([])
    expect(drawable({ format: 'design-studio/v1', title: '', layouts: 'x' } as unknown as DesignDocument)).toEqual([])
  })
})
