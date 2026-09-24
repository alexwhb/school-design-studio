import { describe, expect, it } from 'vitest'
import { PAINT_FIELDS, PAINT_NUMBER_FIELDS, WIDGET_TYPES, applyOps, composeDeck, isSafePaint, sanitizeFields, type DesignDocument } from '@/compose'
import { pageBackgroundStyle } from '@/common/methods/pageBackground'
import getGradientOrImg from '@/components/modules/widgets/wText/getGradientOrImg'
import { toGradientString } from '@/packages/color-picker/utils/gradient'
import type { TdWidgetData } from '@/store/types'

/** A one-page design holding exactly the layers given, on a page with `page` merged in. */
function docWith(layers: Record<string, unknown>[], page: Record<string, unknown> = {}): DesignDocument {
  return {
    format: 'design-studio/v1',
    title: 'x',
    layouts: [{ global: { name: 'p', type: 'page', uuid: '-1', width: 100, height: 100, backgroundColor: '#ffffffff', backgroundGradient: '', ...page } as any, layers: layers.map((layer, index) => ({ uuid: `w${index}`, parent: '-1', ...layer }) as unknown as TdWidgetData) }],
  }
}

const layer = (doc: DesignDocument, index = 0) => doc.layouts[0].layers[index] as Record<string, any>

const SVG_URL = 'url(data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E)'

describe('a colour that is really a picture', () => {
  it('is not a paint', () => {
    for (const value of ['url(/x)', SVG_URL, 'linear-gradient(red, blue), url(/x)', 'red) url(/x#f', '0deg, url(/x)']) {
      expect(isSafePaint(value), value).toBe(false)
    }
  })

  it('is taken off a shape’s fill, the audit’s own example', () => {
    const { doc, report } = sanitizeFields(docWith([{ type: 'w-rect', color: 'url(/x)' }]))
    expect(layer(doc).color).toBe('transparent')
    expect(report.dropped).toEqual([{ type: 'w-rect', path: 'color', value: 'url(/x)' }])
  })

  it('is taken off a fill that draws an SVG from nowhere', () => {
    const { doc } = sanitizeFields(docWith([{ type: 'w-ellipse', color: SVG_URL }]))
    expect(layer(doc).color).toBe('transparent')
  })

  it('is taken off an outline that passes for a gradient', () => {
    // `isGradient` only looks at the start, so this went into `background`.
    const { doc } = sanitizeFields(docWith([{ type: 'w-rect', color: '#fff', borderWidth: 4, borderColor: 'linear-gradient(red, blue), url(/x)' }]))
    expect(layer(doc).borderColor).toBe('transparent')
  })

  it('is taken off a page’s gradient and colour', () => {
    const { doc } = sanitizeFields(docWith([], { backgroundGradient: 'url(/x)', backgroundColor: 'red;background:url(/x)' }))
    expect(doc.layouts[0].global.backgroundGradient).toBe('')
    expect(doc.layouts[0].global.backgroundColor).toBe('#ffffffff')
  })

  it('is taken out of a shadow, which is written inside drop-shadow()', () => {
    const { doc } = sanitizeFields(docWith([{ type: 'w-image', imgUrl: '/a.png', shadow: { enable: true, color: 'red) url(/x#f', offsetX: 0, offsetY: 8, blur: 16 } }]))
    expect(layer(doc).shadow.color).toBe('transparent')
  })

  it('is taken out of every layer of a text effect, gradient stops and angle included', () => {
    const effect = {
      filling: {
        enable: true,
        type: 2,
        color: 'url(/a)',
        gradient: {
          type: 'linear',
          angle: '0deg, url(/x)',
          stops: [
            { color: 'url(/b)', offset: 0 },
            { color: '#fff', offset: '1' },
          ],
        },
        imageContent: { pattern: { size: 8, markup: '<rect fill="{0}"/>', colors: ['url(/c)', '#000'] } },
      },
      stroke: { enable: true, width: 2, color: 'var(--x)' },
      shadow: { enable: true, color: "red' onload='x", offsetX: 0, offsetY: 0, blur: 0 },
    }
    const { doc } = sanitizeFields(docWith([{ type: 'w-text', text: 'Hi', color: '#000', textEffects: [effect] }]))
    const out = layer(doc).textEffects[0]
    expect(out.filling.color).toBe('transparent')
    expect(out.filling.gradient.angle).toBe(180)
    expect(out.filling.gradient.stops[0].color).toBe('transparent')
    expect(out.filling.gradient.stops[1]).toEqual({ color: '#fff', offset: 0 })
    expect(out.filling.imageContent.pattern.colors).toEqual(['transparent', '#000'])
    expect(out.stroke.color).toBe('transparent')
    expect(out.shadow.color).toBe('transparent')
    expect(JSON.stringify(doc)).not.toContain('url(')
  })

  it('is taken off a library shape’s palette and a table’s fills', () => {
    const { doc } = sanitizeFields(
      docWith([
        { type: 'w-svg', svgUrl: '<svg/>', colors: ['#000', 'url(/x)'] },
        { type: 'w-table', cells: [['a']], headerFill: 'url(/x)', bodyFill: '#fff', altFill: 'image-set("/x.png" 1x)' },
      ]),
    )
    expect(layer(doc, 0).colors).toEqual(['#000', 'transparent'])
    expect(layer(doc, 1).headerFill).toBe('transparent')
    expect(layer(doc, 1).bodyFill).toBe('#fff')
    expect(layer(doc, 1).altFill).toBe('transparent')
  })

  it('cannot get past applyOps either', () => {
    const { doc } = applyOps(docWith([{ type: 'w-rect', color: 'url(/x)' }]), [])
    expect(layer(doc).color).toBe('transparent')
  })

  it('leaves real colours, and absent ones, alone', () => {
    const doc = docWith(
      [
        { type: 'w-text', text: 'Hi', color: '#000000ff', backgroundColor: '' },
        { type: 'w-rect', color: 'linear-gradient(90deg, #ff0000ff 0%,#0000ffff 100%)' },
      ],
      { backgroundGradient: 'radial-gradient(circle at 50% 50%, #ffffffff 0%,#000000ff 100%)' },
    )
    const { doc: after, report } = sanitizeFields(doc)
    expect(report.dropped).toEqual([])
    expect(after).toEqual(doc)
  })

  it('passes every colour a composed deck is made of', () => {
    const deck = composeDeck({ title: 'x', slides: [{ layout: 'content', title: 'What is on', kicker: 'Evening', sub: 'Six', bullets: [{ text: 'Tours', sub: [] }], bulletsRight: [], columnHeads: [], callout: 'Free', notes: null, image: null }] })
    expect(sanitizeFields(deck).report.dropped).toEqual([])
  })
})

describe('the registry', () => {
  it('names every widget type and the page', () => {
    for (const type of [...WIDGET_TYPES, 'page']) expect(PAINT_FIELDS[type], type).toBeDefined()
    expect(PAINT_NUMBER_FIELDS['w-text']).toContain('textEffects[].filling.gradient.angle')
  })
})

describe('the sinks themselves', () => {
  it('quote a page background so it is one url()', () => {
    const style = pageBackgroundStyle({ width: 100, height: 100, backgroundImage: '/a.png),url(https://evil/p.png' } as any)
    expect(style.backgroundImage).toBe('url("/a.png),url(https://evil/p.png")')
  })

  it('quote a text effect’s picture fill', () => {
    const value = getGradientOrImg({ filling: { type: 1, imageContent: { image: '/a.png"),url("https://evil/p.png' } } })
    expect(value).toBe('url("/a.png\\"),url(\\"https://evil/p.png")')
  })

  it('write a gradient’s angle as a number whatever it was given', () => {
    expect(toGradientString('linear', '0deg, url(/x)' as unknown as number, [{ color: '#000', offset: 0 }])).toBe('linear-gradient(180deg, #000 0%)')
    expect(toGradientString('linear', 45, [{ color: '#000', offset: 0 }])).toBe('linear-gradient(45deg, #000 0%)')
  })
})
