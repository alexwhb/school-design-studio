import { describe, expect, it } from 'vitest'
import { POSTER_PACK_KEYS, SLIDE_THEME_KEYS, applyOps, composeDeck, composeDeckWithReport, composePoster, composePosterWithReport, MAX_PAGES, type DeckOutline, type DeckSlide, type DesignDocument, type OutlineBullet, type PosterSign, type TBrandKit } from '@/compose'
import { measureText } from '@/compose/textFit'
import { markupToText } from '@/compose/markup'
import type { TdWidgetData } from '@/store/types'

const WIDE: TBrandKit = {
  name: 'Riverbend Academy',
  shortName: 'Riverbend',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  colors: ['#7c3aedff'],
  // The widest pair the studio ships: Libre Baskerville headings on
  // Montserrat, over themes drawn in Anton, Oswald and Inter.
  fonts: { heading: 17, body: 5 },
}

function slide(over: Partial<DeckSlide> & Pick<DeckSlide, 'layout'>): DeckSlide {
  return { title: null, kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null, ...over }
}

function sign(over: Partial<PosterSign> & Pick<PosterSign, 'layout'>): PosterSign {
  return { icon: null, eyebrow: null, badge: null, head: '', sub: null, foot: null, ...over }
}

function bullets(count: number, subs: number, prefix = 'Point'): OutlineBullet[] {
  return Array.from({ length: count }, (_, i) => ({
    text: `${prefix} ${i + 1}: families asked for a later start on Fridays and the governors agreed`,
    sub: Array.from({ length: subs }, (_, k) => `Detail ${i + 1}.${k + 1} about how that will work in practice`),
  }))
}

const texts = (layers: TdWidgetData[]) => layers.filter((layer) => layer.type === 'w-text')

/**
 * Every line of every text box, measured in the face and size the box is set
 * in now — after the brand went on — against the box it has to fit.
 */
function tooWide(doc: DesignDocument): string[] {
  const out: string[] = []
  doc.layouts.forEach((layout, page) => {
    for (const layer of texts(layout.layers)) {
      const style = { fontFamily: String(layer.fontFamily), fontSize: Number(layer.fontSize), lineHeight: Number(layer.lineHeight), letterSpacing: Number(layer.letterSpacing) || 0, bold: Number(layer.fontWeight) >= 600 }
      const lines = String(layer.text)
        .split('<br/>')
        .map((line) => markupToText(line))
      for (const line of lines) {
        const width = measureText(line, style)
        if (width > layer.width + 0.5) out.push(`page ${page} ${layer.role}: “${line}” is ${Math.round(width)} in ${layer.width} (${layer.fontFamily})`)
      }
      const tall = Math.ceil(lines.length * style.fontSize * style.lineHeight)
      if (tall > layer.height + 1) out.push(`page ${page} ${layer.role}: ${lines.length} lines need ${tall} in ${layer.height}`)
    }
  })
  return out
}

/** Text boxes that sit on top of one another. */
function overlapping(doc: DesignDocument): string[] {
  const out: string[] = []
  doc.layouts.forEach((layout, page) => {
    const boxes = texts(layout.layers)
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height) out.push(`page ${page}: ${a.role} over ${b.role}`)
      }
    }
  })
  return out
}

const DECK: DeckOutline = {
  title: 'Annual report',
  slides: [slide({ layout: 'title', kicker: 'Riverbend Academy', title: 'Enrollment grew for a third consecutive year across every grade band', sub: 'A review of the school year and what comes next' }), slide({ layout: 'statement', title: 'Ninety-four per cent average daily attendance, our highest since 2019', sub: 'Reported to the board in May' }), slide({ layout: 'content', kicker: 'Section two', title: 'What changed this year for families', sub: 'Three things families asked for', bullets: bullets(3, 1), callout: 'The board votes on 12 June.' }), slide({ layout: 'two-column', title: 'Before and after', columnHeads: ['Last year', 'This year'], bullets: bullets(2, 0), bulletsRight: bullets(2, 0) }), slide({ layout: 'media', title: 'The new library', sub: 'Open every lunchtime', bullets: bullets(2, 0) })],
}

describe('composing in the kit’s fonts', () => {
  it('measures a deck in the fonts it will be read in', () => {
    for (const theme of SLIDE_THEME_KEYS) {
      const doc = composeDeck(DECK, { theme, brand: WIDE })
      const heading = doc.layouts[0].layers.find((layer) => layer.role === 'heading') as TdWidgetData
      expect(heading.fontFamily).toBe('Libre Baskerville')
      expect(tooWide(doc), theme).toEqual([])
      expect(overlapping(doc), theme).toEqual([])
    }
  })

  it('measures a sign in them too, where the theme’s face is a condensed one', () => {
    const signs = [sign({ layout: 'direction', head: 'Gymnasium', sub: 'Past the library and through the double doors' }), sign({ layout: 'statement', head: 'Every child known, every day', sub: 'Our promise to families' }), sign({ layout: 'notice', eyebrow: 'Please note', head: 'Pick-up moves to the north gate', sub: 'From Monday the car park is closed while the new classrooms are built.' }), sign({ layout: 'number', badge: '42', head: 'Days until the book fair', sub: 'Bring a book to swap' })]
    for (const theme of POSTER_PACK_KEYS) {
      const doc = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs }, { theme, brand: WIDE })
      expect(tooWide(doc), theme).toEqual([])
      expect(overlapping(doc), theme).toEqual([])
    }
  })
})

describe('bullets that do not fit on one slide', () => {
  const bulletTexts = (doc: DesignDocument) => doc.layouts.flatMap((layout) => layout.layers.filter((layer) => layer.role === 'bullet').map((layer) => markupToText(String(layer.text).replace(/<br\/>/g, ' '))))
  const subTexts = (doc: DesignDocument) => doc.layouts.flatMap((layout) => layout.layers.filter((layer) => layer.role === 'sub-bullet').map((layer) => markupToText(String(layer.text).replace(/<br\/>/g, ' '))))

  for (const [count, subs] of [
    [8, 2],
    [5, 3],
    [14, 0],
  ] as const) {
    it(`carries ${count} bullets of ${subs} sub-points onto another slide rather than dropping them`, () => {
      const outline: DeckOutline = { title: 'Deck', slides: [slide({ layout: 'content', title: 'What families told us', bullets: bullets(count, subs) })] }
      const { document, report } = composeDeckWithReport(outline)
      expect(document.layouts.length).toBeGreaterThan(1)
      expect(report.continuedPages).toBe(document.layouts.length - 1)
      expect(report.dropped).toEqual([])
      // Every point once, in order, apart from a heading repeated over sub-points
      // that went over a page break.
      const unique = [...new Set(bulletTexts(document))]
      expect(unique).toEqual(outline.slides[0].bullets.map((bullet) => bullet.text))
      expect(subTexts(document)).toEqual(outline.slides[0].bullets.flatMap((bullet) => bullet.sub))
      for (const layout of document.layouts.slice(1)) {
        const heading = layout.layers.find((layer) => layer.role === 'heading') as TdWidgetData
        expect(markupToText(String(heading.text).replace(/<br\/>/g, ' '))).toBe('What families told us (continued)')
        expect(layout.global.notes).toBeUndefined()
      }
      expect(tooWide(document)).toEqual([])
      expect(overlapping(document)).toEqual([])
    })
  }

  it('continues both columns of a two-column slide', () => {
    const outline: DeckOutline = { title: 'Deck', slides: [slide({ layout: 'two-column', title: 'Then and now', columnHeads: ['Then', 'Now'], bullets: bullets(9, 0, 'Left'), bulletsRight: bullets(4, 0, 'Right') })] }
    const { document, report } = composeDeckWithReport(outline)
    expect(report.dropped).toEqual([])
    expect(document.layouts.length).toBeGreaterThan(1)
    const all = bulletTexts(document)
    expect(all.filter((line) => line.startsWith('Left'))).toHaveLength(9)
    expect(all.filter((line) => line.startsWith('Right'))).toHaveLength(4)
  })

  it('carries a media slide on as a full-width content slide, without the photo again', () => {
    const outline: DeckOutline = { title: 'Deck', slides: [slide({ layout: 'media', title: 'The new library', image: { url: '/p.jpg', width: 800, height: 600 }, bullets: bullets(8, 0) })] }
    const { document, report } = composeDeckWithReport(outline)
    expect(report.dropped).toEqual([])
    expect(document.layouts.length).toBeGreaterThan(1)
    expect(document.layouts[1].layers.some((layer) => layer.type === 'w-image')).toBe(false)
    expect(new Set(bulletTexts(document)).size).toBe(8)
  })

  it('keeps the slides that were asked for ahead of continuations, at the page limit', () => {
    const slides = Array.from({ length: MAX_PAGES }, (_, i) => slide({ layout: 'content', title: `Slide ${i + 1}`, bullets: i === 0 ? bullets(20, 0) : bullets(1, 0) }))
    const { document, report } = composeDeckWithReport({ title: 'Long', slides })
    expect(document.layouts).toHaveLength(MAX_PAGES)
    expect(document.layouts[MAX_PAGES - 1].global.name).toBe(`Slide ${MAX_PAGES}`)
    expect(report.continuedPages).toBe(0)
    expect(report.dropped.length).toBeGreaterThan(0)
    expect(report.dropped.every((entry) => entry.reason === 'page-limit' && entry.source === 0 && entry.field.startsWith('bullets['))).toBe(true)
    expect(report.dropped[0].page).toBe(1)
  })

  it('stops at maxPages and says which slides were left out', () => {
    const slides = Array.from({ length: 5 }, (_, i) => slide({ layout: 'statement', title: `Statement ${i + 1}` }))
    const { document, report } = composeDeckWithReport({ title: 'Five', slides }, { maxPages: 3 })
    expect(document.layouts).toHaveLength(3)
    expect(report.dropped).toEqual([
      { page: 3, source: 3, field: 'title', text: 'Statement 4', reason: 'page-limit' },
      { page: 3, source: 4, field: 'title', text: 'Statement 5', reason: 'page-limit' },
    ])
  })

  it('never goes past what the editor can hold, whatever maxPages says', () => {
    const slides = Array.from({ length: MAX_PAGES + 5 }, (_, i) => slide({ layout: 'statement', title: `S${i}` }))
    expect(composeDeck({ title: 'x', slides }, { maxPages: 500 }).layouts).toHaveLength(MAX_PAGES)
  })

  it('hands back a report that survives JSON', () => {
    const { report } = composeDeckWithReport({ title: 'x', slides: [slide({ layout: 'content', title: 'T', bullets: bullets(12, 2) })] }, { maxPages: 1 })
    expect(report.dropped.length).toBeGreaterThan(0)
    expect(JSON.parse(JSON.stringify(report))).toEqual(report)
  })
})

describe('words cut to fit', () => {
  it('reports a sign heading that had to be cut, with the words in full', () => {
    const head = 'The annual whole-school celebration of reading, writing, speaking and listening across every year group'.repeat(3)
    const { document, report } = composePosterWithReport({ orientation: 'PORTRAIT', size: 'letter', signs: [sign({ layout: 'direction', head })] })
    expect(document.layouts).toHaveLength(1)
    expect(report.dropped).toContainEqual({ page: 0, source: 0, field: 'head', text: head, reason: 'shortened' })
    expect(tooWide(document)).toEqual([])
  })

  it('reports a slide title that had to be cut, once', () => {
    const title = 'An extraordinarily long heading '.repeat(24).trim()
    const { report } = composeDeckWithReport({ title: 'x', slides: [slide({ layout: 'content', title, bullets: bullets(14, 0) })] })
    expect(report.dropped.filter((entry) => entry.field === 'title')).toEqual([{ page: 0, source: 0, field: 'title', text: title, reason: 'shortened' }])
  })

  it('says nothing when everything fits', () => {
    expect(composeDeckWithReport(DECK).report).toEqual({ continuedPages: 0, dropped: [] })
    expect(composePosterWithReport({ orientation: 'PORTRAIT', size: 'letter', signs: [sign({ layout: 'icon', icon: 'bus', head: 'Bus bay' })] }).report).toEqual({ continuedPages: 0, dropped: [] })
  })
})

describe('addPage', () => {
  it('adds continuation pages for bullets a slide cannot hold, and says so', () => {
    const doc = composeDeck({ title: 'Deck', slides: [slide({ layout: 'title', title: 'Hello' })] })
    const lines = Array.from({ length: 16 }, (_, i) => `Point ${i + 1}: the new timetable starts after half term for every class`).join('\n')
    const { doc: next, rejected, report } = applyOps(doc, [{ op: 'addPage', after: 0, kind: 'content', fields: { title: 'The plan', bullets: lines } }])
    expect(rejected).toEqual([])
    expect(next.layouts.length).toBeGreaterThan(2)
    expect(report.continuedPages).toBe(next.layouts.length - 2)
    expect(report.dropped).toEqual([])
    const placed = next.layouts.slice(1).flatMap((layout) => layout.layers.filter((layer) => layer.role === 'bullet'))
    expect(placed).toHaveLength(16)
    expect(tooWide(next)).toEqual([])
  })

  it('sets an added page in the kit’s fonts before measuring it', () => {
    const doc = composeDeck({ title: 'Deck', slides: [slide({ layout: 'title', title: 'Hello' })] })
    const { doc: next } = applyOps(doc, [{ op: 'addPage', after: 0, kind: 'content', fields: { title: 'Pick-up arrangements for the spring term', bullets: 'One\nTwo' } }], { brand: WIDE })
    const heading = next.layouts[1].layers.find((layer) => layer.role === 'heading') as TdWidgetData
    expect(heading.fontFamily).toBe('Libre Baskerville')
    expect(tooWide(next)).toEqual([])
  })

  it('reports the op, by its index, when a page had to cut words', () => {
    const doc = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs: [sign({ layout: 'notice', head: 'Hello' })] })
    const head = 'Please remember that the car park is closed '.repeat(8).trim()
    const { report } = applyOps(doc, [
      { op: 'setMotion', on: false },
      { op: 'addPage', after: 0, kind: 'direction', fields: { head } },
    ])
    expect(report.dropped).toContainEqual({ page: 1, source: 1, field: 'head', text: head, reason: 'shortened' })
  })
})
