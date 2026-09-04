import { describe, expect, it } from 'vitest'
import { POSTER_PACK_KEYS, SLIDE_THEME_KEYS, applyBrand, applyOps, composeDeck, composePoster, describeDocument, pageKinds, type DeckOutline, type DeckSlide, type DesignDocument, type PosterOutline, type TBrandKit } from '@/compose'
import type { TdWidgetData } from '@/store/types'

const KIT: TBrandKit = {
  name: 'Riverbend Academy',
  shortName: 'Riverbend',
  tagline: 'Every child known',
  address: '9 Mill Lane, Riverbend',
  phone: '(555) 013-8800',
  email: 'office@riverbend.k12.us',
  website: 'riverbend.k12.us',
  colors: ['#7c3aedff', '#f59e0bff'],
  fonts: {},
}

function slide(over: Partial<DeckSlide> & Pick<DeckSlide, 'layout'>): DeckSlide {
  return {
    title: null,
    kicker: null,
    sub: null,
    bullets: [],
    bulletsRight: [],
    columnHeads: [],
    callout: null,
    notes: null,
    image: null,
    ...over,
  }
}

/** The words a model would actually send: long enough to need shrinking. */
const LONG = 'Enrollment grew for a third consecutive year while class sizes held steady across every grade band'

const OUTLINE: DeckOutline = {
  title: 'Annual report to families',
  slides: [
    slide({ layout: 'title', title: LONG, kicker: 'Riverbend Academy', sub: 'A review of the school year and what comes next', notes: 'Welcome everyone.' }),
    slide({ layout: 'statement', title: 'Ninety-four per cent average daily attendance, our highest since 2019', sub: 'Reported to the board in May' }),
    slide({
      layout: 'content',
      title: 'What changed this year',
      kicker: 'Section two',
      sub: 'Three things families asked for, and where each of them stands now',
      bullets: [
        { text: 'Two sixth-grade sections were added in August', sub: ['Class sizes fell from 31 to 24', 'A second counsellor started in September'] },
        { text: 'The library reopened after eighteen months', sub: [] },
        { text: 'Free and reduced-price meal participation rose to 31%', sub: [] },
      ],
      callout: 'The board votes on the facilities plan on 12 June.',
    }),
    slide({
      layout: 'two-column',
      title: 'Before and after',
      columnHeads: ['Last year', 'This year'],
      bullets: [{ text: 'One counsellor for 842 students', sub: [] }],
      bulletsRight: [{ text: 'Two counsellors and a part-time social worker', sub: [] }],
    }),
    slide({
      layout: 'media',
      title: 'The new library',
      sub: 'Reopened in October after eighteen months',
      image: { url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', width: 4000, height: 1000 },
      bullets: [{ text: 'Open until six on weekdays', sub: [] }],
    }),
  ],
}

/** Nothing may sit outside the page it is on, at any point. */
function overflowing(doc: DesignDocument): string[] {
  const out: string[] = []
  doc.layouts.forEach((layout, index) => {
    const { width, height } = layout.global
    for (const layer of layout.layers as TdWidgetData[]) {
      const right = layer.left + layer.width
      const bottom = layer.top + layer.height
      if (layer.left < -1 || layer.top < -1 || right > width + 1 || bottom > height + 1) {
        out.push(`page ${index}: ${layer.type} ${layer.uuid} at ${layer.left},${layer.top} ${layer.width}×${layer.height}`)
      }
    }
  })
  return out
}

describe('composeDeck', () => {
  it('composes every layout kind without anything running off the page', () => {
    for (const theme of SLIDE_THEME_KEYS) {
      const doc = composeDeck(OUTLINE, { theme })
      expect(doc.format).toBe('design-studio/v1')
      expect(doc.layouts).toHaveLength(5)
      expect(overflowing(doc), `${theme} overflowed`).toEqual([])
    }
  })

  it('is 1920 × 1080 and keeps the speaker notes off the page', () => {
    const doc = composeDeck(OUTLINE)
    expect(doc.layouts[0].global.width).toBe(1920)
    expect(doc.layouts[0].global.height).toBe(1080)
    expect(doc.layouts[0].global.notes).toBe('Welcome everyone.')
    const shown = describeDocument(doc).pages[0].texts.map((text) => text.text)
    expect(shown.join(' ')).not.toContain('Welcome everyone')
  })

  it('gives every widget an id of its own', () => {
    const doc = composeDeck(OUTLINE)
    const ids = doc.layouts.flatMap((layout) => layout.layers.map((layer) => layer.uuid))
    expect(new Set(ids).size).toBe(ids.length)
    // And two decks composed from one outline share no ids at all.
    const again = composeDeck(OUTLINE)
    const others = new Set(again.layouts.flatMap((layout) => layout.layers.map((layer) => layer.uuid)))
    expect(ids.some((id) => others.has(id))).toBe(false)
  })

  it('shrinks a heading that is too long, and cuts it only at the floor', () => {
    const short = composeDeck({ title: 'x', slides: [slide({ layout: 'title', title: 'Open House' })] })
    const long = composeDeck({ title: 'x', slides: [slide({ layout: 'title', title: LONG })] })
    const sizeOf = (doc: DesignDocument) => Number((doc.layouts[0].layers.find((layer) => layer.brandRole === 'heading') as any).fontSize)
    expect(sizeOf(long)).toBeLessThan(sizeOf(short))
    expect(describeDocument(long).pages[0].texts.some((text) => text.text.includes('Enrollment grew'))).toBe(true)
  })

  it('drops the bullets that will not fit rather than printing over the footer', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ text: `Point number ${i + 1}, written out at the length a real one would be`, sub: [] }))
    const doc = composeDeck({ title: 'x', slides: [slide({ layout: 'content', title: 'Everything', bullets: many })] })
    expect(overflowing(doc)).toEqual([])
    const shown = describeDocument(doc).pages[0].texts.filter((text) => text.role === 'bullet')
    expect(shown.length).toBeGreaterThan(2)
    expect(shown.length).toBeLessThan(many.length)
  })

  it('indents a sub-bullet under the point it belongs to', () => {
    const doc = composeDeck({
      title: 'x',
      slides: [slide({ layout: 'content', title: 'Changes', bullets: [{ text: 'Two sections added', sub: ['Class sizes fell'] }] })],
    })
    const layers = doc.layouts[0].layers as TdWidgetData[]
    const parent = layers.find((layer) => layer.label === 'bullet')
    const child = layers.find((layer) => layer.label === 'sub-bullet')
    expect(parent && child).toBeTruthy()
    expect((child as TdWidgetData).left).toBeGreaterThan((parent as TdWidgetData).left)
    expect((child as TdWidgetData).top).toBeGreaterThan((parent as TdWidgetData).top)
  })

  it('puts a two-column slide’s two lists under their own headings', () => {
    const doc = composeDeck(OUTLINE)
    const layers = doc.layouts[3].layers as TdWidgetData[]
    const heads = layers.filter((layer) => layer.label === 'column heading')
    expect(heads).toHaveLength(2)
    expect(heads[1].left).toBeGreaterThan(heads[0].left)
    const bullets = layers.filter((layer) => layer.label === 'bullet')
    expect(bullets).toHaveLength(2)
  })

  it('covers the picture slot on a media slide whatever shape the photo is', () => {
    const doc = composeDeck(OUTLINE)
    const picture = (doc.layouts[4].layers as TdWidgetData[]).find((layer) => layer.type === 'w-image') as any
    expect(picture.imgUrl).toContain('data:image/gif')
    // A very wide photograph in a tall slot is scaled on the wide axis only.
    expect(picture.zoom).toBeGreaterThan(1)
    expect(picture.zoomY).toBe(1)
  })

  it('draws a media slide with no picture without leaving a hole', () => {
    const doc = composeDeck({ title: 'x', slides: [slide({ layout: 'media', title: 'No photo yet' })] })
    expect(overflowing(doc)).toEqual([])
    expect((doc.layouts[0].layers as TdWidgetData[]).some((layer) => layer.type === 'w-image')).toBe(false)
  })
})

describe('composePoster', () => {
  const OUT: PosterOutline = {
    orientation: 'PORTRAIT',
    size: 'letter',
    signs: [
      { layout: 'direction', icon: null, eyebrow: 'Open House', badge: null, head: 'Gymnasium', sub: 'Through the double doors and left', foot: null },
      { layout: 'icon', icon: 'graduation cap', eyebrow: null, badge: null, head: 'Eighth Grade Promotion', sub: 'Friday 7 June, 6:00 p.m.', foot: null },
      { layout: 'statement', icon: null, eyebrow: 'Notice', badge: null, head: 'The library is closed for stocktaking until Monday', sub: 'Books may still be returned at the office', foot: null },
      { layout: 'number', icon: null, eyebrow: null, badge: '842', head: 'students', sub: 'and one new sixth-grade section', foot: null },
      { layout: 'notice', icon: 'bell', eyebrow: 'Please note', badge: null, head: 'Pick-up moves to the south lot', sub: 'From Monday 12 May the north lot is closed for resurfacing. Families collecting children should use the south lot entrance on Mill Lane.', foot: null },
    ],
  }

  it('composes every sign kind, in every pack, without overflowing', () => {
    for (const theme of POSTER_PACK_KEYS) {
      const doc = composePoster(OUT, { theme })
      expect(doc.layouts).toHaveLength(5)
      expect(overflowing(doc), `${theme} overflowed`).toEqual([])
    }
  })

  it('is Letter portrait at 150 DPI, and turns round on request', () => {
    expect(composePoster(OUT).layouts[0].global).toMatchObject({ width: 1275, height: 1650 })
    expect(composePoster({ ...OUT, orientation: 'LANDSCAPE' }).layouts[0].global).toMatchObject({ width: 1650, height: 1275 })
    expect(composePoster({ ...OUT, size: 'tabloid' }).layouts[0].global).toMatchObject({ width: 1650, height: 2550 })
  })

  it('places an icon it ships and drops one it does not', () => {
    const known = composePoster({ ...OUT, signs: [OUT.signs[1]] })
    expect((known.layouts[0].layers as TdWidgetData[]).some((layer) => layer.name === 'graduation cap')).toBe(true)
    const unknown = composePoster({ ...OUT, signs: [{ ...OUT.signs[1], icon: 'a picture of a school bus, but nicer' }] })
    expect((unknown.layouts[0].layers as TdWidgetData[]).some((layer) => layer.type === 'w-svg' && (layer as any).svgUrl?.includes('lucide'))).toBe(false)
    expect(overflowing(unknown)).toEqual([])
  })
})

describe('describeDocument', () => {
  it('reports every text box with its id and a role, and no picture bytes', () => {
    const doc = composeDeck(OUTLINE)
    const view = describeDocument(doc)
    expect(view.kind).toBe('slides')
    expect(view.pages).toHaveLength(5)

    const heading = view.pages[0].texts.find((text) => text.role === 'heading')
    expect(heading).toBeTruthy()
    expect(heading?.id).toMatch(/^[0-9a-f]{12}$/)

    // The footer is a merge field, and it is named as one rather than as a role.
    expect(view.pages[0].texts.some((text) => text.role === 'school.name')).toBe(true)

    const serialised = JSON.stringify(view)
    expect(serialised).not.toContain('data:image')
    expect(serialised).not.toContain('<svg')
    expect(view.pages[4].images[0].id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('reads the words rather than the markup', () => {
    const doc = composeDeck({ title: 'x', slides: [slide({ layout: 'title', title: 'Bake sale & book fair' })] })
    const heading = describeDocument(doc).pages[0].texts.find((text) => text.role === 'heading')
    expect(heading?.text).toBe('Bake sale & book fair')
  })
})

describe('applyOps', () => {
  it('round-trips describe → setText → describe', () => {
    const doc = composeDeck(OUTLINE)
    const before = describeDocument(doc)
    const target = before.pages[2].texts.find((text) => text.role === 'heading')!
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setText', id: target.id, text: 'What changed, and what did not' }])
    expect(rejected).toEqual([])
    const view = describeDocument(after)
    expect(view.pages[2].texts.find((text) => text.id === target.id)?.text).toBe('What changed, and what did not')
    // Everything it was not asked to touch is exactly as it was.
    expect(view.pages[0]).toEqual(before.pages[0])
    expect(after.layouts).toHaveLength(doc.layouts.length)
  })

  it('escapes the words a model sends rather than taking them as markup', () => {
    const doc = composeDeck(OUTLINE)
    const id = describeDocument(doc).pages[0].texts[0].id
    const { doc: after } = applyOps(doc, [{ op: 'setText', id, text: 'Maths & English' }])
    const widget = after.layouts[0].layers.find((layer) => layer.uuid === id) as TdWidgetData
    expect(widget.text).toBe('Maths &amp; English')
    expect(describeDocument(after).pages[0].texts.find((text) => text.id === id)?.text).toBe('Maths & English')
  })

  it('leaves the design alone and says why when an op cannot be applied', () => {
    const doc = composeDeck(OUTLINE)
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setText', id: 'nosuchwidget', text: 'hello' }, { op: 'removePage', index: 99 }, { op: 'movePage', from: 0, to: 12 }, { op: 'addPage', after: 0, kind: 'interpretive-dance', fields: {} }, { op: 'applyBrand' }])
    expect(rejected).toHaveLength(5)
    expect(rejected[0].reason).toContain('nosuchwidget')
    expect(rejected[3].reason).toContain('two-column')
    expect(rejected[4].reason).toContain('brand kit')
    expect(after).toEqual(doc)
  })

  it('adds, moves and removes pages by index', () => {
    const doc = composeDeck(OUTLINE)
    const names = (d: DesignDocument) => d.layouts.map((layout) => layout.global.name)

    const added = applyOps(doc, [{ op: 'addPage', after: 0, kind: 'statement', fields: { title: 'One number worth remembering' } }])
    expect(added.rejected).toEqual([])
    expect(added.doc.layouts).toHaveLength(6)
    expect(names(added.doc)[1]).toBe('One number worth remembering')

    const moved = applyOps(added.doc, [{ op: 'movePage', from: 1, to: 5 }])
    expect(names(moved.doc)[5]).toBe('One number worth remembering')
    expect(names(moved.doc)[1]).toBe(names(doc)[1])

    const removed = applyOps(moved.doc, [{ op: 'removePage', index: 5 }])
    expect(removed.doc.layouts).toHaveLength(5)
    expect(names(removed.doc)).toEqual(names(doc))
  })

  it('will not remove the last page a design has', () => {
    const one = composeDeck({ title: 'x', slides: [slide({ layout: 'title', title: 'Only page' })] })
    const { doc, rejected } = applyOps(one, [{ op: 'removePage', index: 0 }])
    expect(rejected[0].reason).toContain('one page')
    expect(doc.layouts).toHaveLength(1)
  })

  it('re-crops a swapped picture to the slot it is going into', () => {
    const doc = composeDeck(OUTLINE)
    const id = describeDocument(doc).pages[4].images[0].id
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setImage', id, url: '/uploads/tall.png', width: 600, height: 2000 }])
    expect(rejected).toEqual([])
    const picture = after.layouts[4].layers.find((layer) => layer.uuid === id) as any
    expect(picture.imgUrl).toBe('/uploads/tall.png')
    expect(picture.zoomY).toBeGreaterThan(1)
    expect(picture.zoom).toBe(1)
  })

  it('offers the page kinds each sort of design can hold', () => {
    expect(pageKinds('slides')).toEqual(['title', 'statement', 'content', 'two-column', 'media'])
    expect(pageKinds('poster')).toEqual(['direction', 'icon', 'statement', 'number', 'notice'])
  })
})

describe('applyBrand', () => {
  it('fills {{school.name}} and puts the kit’s colour where the theme’s accent was', () => {
    const doc = composeDeck(OUTLINE, { theme: 'editorial' })
    const plain = JSON.stringify(describeDocument(doc))
    expect(plain).toContain('{{school.name|upper}}')

    const branded = applyBrand(doc, KIT)
    const view = JSON.stringify(describeDocument(branded))
    expect(view).toContain('RIVERBEND ACADEMY')
    expect(view).not.toContain('{{school.name')

    // The accent the theme was drawn in is gone; the school's is on the page.
    const colours = JSON.stringify(branded.layouts)
    expect(colours.toLowerCase()).toContain('7c3aed')
    // And the design it was given back is untouched.
    expect(JSON.stringify(describeDocument(doc))).toBe(plain)
  })

  it('brands as it composes when the kit is handed in up front', () => {
    const doc = composeDeck(OUTLINE, { theme: 'swiss', brand: KIT })
    expect(JSON.stringify(describeDocument(doc))).toContain('RIVERBEND ACADEMY')
    expect(overflowing(doc)).toEqual([])
  })

  it('applies through applyOps too, and refuses without a kit', () => {
    const doc = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs: [{ layout: 'notice', icon: null, eyebrow: null, badge: null, head: 'Pick-up moves', sub: 'From Monday', foot: null }] })
    const { doc: branded, rejected } = applyOps(doc, [{ op: 'applyBrand' }], { brand: KIT })
    expect(rejected).toEqual([])
    expect(JSON.stringify(branded.layouts)).toContain('Riverbend Academy')
  })
})
