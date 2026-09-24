import { describe, expect, it } from 'vitest'
import { checkLayouts, minimumSize } from '@/common/methods/accessibility/checkDesign'
import type { TdLayout, TdWidgetData } from '@/store/types'

const SLIDE = { uuid: '-1', type: 'page', name: 'p', width: 1920, height: 1080, backgroundColor: '#ffffffff', backgroundGradient: '', backgroundImage: '' } as any
const LETTER = { ...SLIDE, width: 1275, height: 1650 }

const text = (over: Partial<TdWidgetData> & { text: string }) => ({ uuid: 't', type: 'w-text', parent: '-1', left: 100, top: 100, width: 800, height: 60, fontSize: 40, lineHeight: 1.4, fontWeight: 400, color: '#111111ff', fontFamily: 'Inter', textAlign: 'left', ...over }) as unknown as TdWidgetData

function page(layers: TdWidgetData[], global = SLIDE): TdLayout[] {
  return [{ global, layers }]
}

const kinds = (layouts: TdLayout[]) => checkLayouts(layouts).map((issue) => issue.kind)

describe('checkLayouts', () => {
  it('says nothing about a page that is fine', () => {
    expect(checkLayouts(page([text({ text: 'Welcome back' })]))).toEqual([])
  })

  it('finds text off the page', () => {
    const issues = checkLayouts(page([text({ text: 'Welcome back to school', left: 1700 })]))
    expect(issues).toEqual([{ page: 0, widgetId: 't', kind: 'overflow', message: 'Part of this text is off the edge of the page.' }])
  })

  it('does not count a wide box whose words are on the page', () => {
    // Left-aligned words at the left of a box that runs off to the right.
    expect(kinds(page([text({ text: 'Hi', left: 1500, width: 900 })]))).toEqual([])
  })

  it('finds a word wider than its box, and more text than a box holds', () => {
    expect(checkLayouts(page([text({ text: 'Gymnasium', width: 90 })]))[0].message).toBe('“Gymnasium” is too long for its box and will spill out of it.')
    const squashed = checkLayouts(page([text({ text: 'One two three four five six seven eight nine ten '.repeat(6), width: 400, height: 60 })]))
    expect(squashed.map((issue) => issue.message)).toContain('There is more text than this box holds. Make the box bigger or cut some words.')
  })

  it('knows a slide from a sheet of paper when it asks for bigger type', () => {
    expect(minimumSize(SLIDE)).toBe(20)
    expect(minimumSize({ width: 1280, height: 720 })).toBe(13)
    // 12pt at 150 DPI.
    expect(minimumSize(LETTER)).toBe(25)

    expect(checkLayouts(page([text({ text: 'Small print', fontSize: 14, height: 24 })]))[0]).toMatchObject({ kind: 'tiny-text', message: 'This text is too small to read on a screen. Make it at least 20px.' })
    expect(checkLayouts(page([text({ text: 'Small print', fontSize: 17, height: 24 })], LETTER))[0]).toMatchObject({ kind: 'tiny-text', message: 'This text prints at about 8pt, which is hard to read. Make it at least 12pt (25px).' })
    expect(kinds(page([text({ text: 'Big enough', fontSize: 22, height: 40 })]))).toEqual([])
  })

  it('finds pale text on the paper, and on a panel under it', () => {
    const pale = checkLayouts(page([text({ text: 'Hard to see', color: '#bbbbbbff' })]))
    expect(pale).toHaveLength(1)
    expect(pale[0].kind).toBe('low-contrast')
    expect(pale[0].message).toMatch(/^This text is hard to read against what is behind it\. The contrast is 1\.9:1 and needs to be 3:1\.$/)

    // Navy words on a navy band.
    const band = { uuid: 'band', type: 'w-rect', parent: '-1', left: 0, top: 0, width: 1920, height: 400, color: '#1e3a5fff' } as unknown as TdWidgetData
    expect(checkLayouts(page([band, text({ text: 'On the band', color: '#22304aff' })])).map((issue) => issue.widgetId)).toEqual(['t'])
    // White on it is fine.
    expect(kinds(page([band, text({ text: 'On the band', color: '#ffffffff' })]))).toEqual([])
  })

  it('says nothing about text over a photo or a gradient, where there is no one colour to measure', () => {
    const photo = { uuid: 'p', type: 'w-image', parent: '-1', left: 0, top: 0, width: 1920, height: 1080, imgUrl: '/p.jpg', decorative: true } as unknown as TdWidgetData
    expect(kinds(page([photo, text({ text: 'Over the photo', color: '#bbbbbbff' })]))).toEqual([])
    expect(kinds(page([text({ text: 'Over a gradient', color: '#bbbbbbff' })], { ...SLIDE, backgroundGradient: 'linear-gradient(#000, #fff)' }))).toEqual([])
  })

  it('lets large text pass at 3:1', () => {
    // 3.5:1 on white: fails as body text, passes as a heading.
    expect(kinds(page([text({ text: 'Heading', color: '#888888ff', fontSize: 60, height: 90 })]))).toEqual([])
    expect(kinds(page([text({ text: 'Body text', color: '#888888ff', fontSize: 22, height: 40 })]))).toEqual(['low-contrast'])
  })

  it('asks for alt text on a photo, and not on one that has it or is decorative', () => {
    const photo = (over: Partial<TdWidgetData>) => ({ uuid: 'p', type: 'w-image', parent: '-1', left: 0, top: 0, width: 400, height: 300, imgUrl: '/p.jpg', ...over }) as unknown as TdWidgetData
    expect(checkLayouts(page([photo({})]))).toEqual([{ page: 0, widgetId: 'p', kind: 'missing-alt', message: 'This picture has no alt text. Describe it, or mark it decorative.' }])
    expect(kinds(page([photo({ alt: 'Children planting bulbs' })]))).toEqual([])
    expect(kinds(page([photo({ decorative: true })]))).toEqual([])
    expect(kinds(page([photo({ hidden: true })]))).toEqual([])
    expect(checkLayouts(page([photo({})]), { skipAlt: true })).toEqual([])
  })

  it('leaves hidden things alone, and names the page each issue is on', () => {
    const layouts = [...page([text({ text: 'Fine' })]), ...page([text({ uuid: 'x', text: 'Hidden', fontSize: 8, hidden: true }), text({ uuid: 'y', text: 'Tiny', fontSize: 8, height: 12 })])]
    expect(checkLayouts(layouts).map((issue) => [issue.page, issue.widgetId, issue.kind])).toEqual([[1, 'y', 'tiny-text']])
  })
})
