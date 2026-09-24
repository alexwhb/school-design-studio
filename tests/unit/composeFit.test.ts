import { describe, expect, it } from 'vitest'
import { POSTER_PACK_KEYS, SLIDE_THEME_KEYS, applyOps, composeDeck, composePoster, type DeckOutline, type DeckSlide, type DesignDocument, type OutlineBullet, type PosterSign, type TBrandKit } from '@/compose'
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
      const lines = String(layer.text).split('<br/>').map((line) => markupToText(line))
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
  slides: [
    slide({ layout: 'title', kicker: 'Riverbend Academy', title: 'Enrollment grew for a third consecutive year across every grade band', sub: 'A review of the school year and what comes next' }),
    slide({ layout: 'statement', title: 'Ninety-four per cent average daily attendance, our highest since 2019', sub: 'Reported to the board in May' }),
    slide({ layout: 'content', kicker: 'Section two', title: 'What changed this year for families', sub: 'Three things families asked for', bullets: bullets(3, 1), callout: 'The board votes on 12 June.' }),
    slide({ layout: 'two-column', title: 'Before and after', columnHeads: ['Last year', 'This year'], bullets: bullets(2, 0), bulletsRight: bullets(2, 0) }),
    slide({ layout: 'media', title: 'The new library', sub: 'Open every lunchtime', bullets: bullets(2, 0) }),
  ],
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
    const signs = [
      sign({ layout: 'direction', head: 'Gymnasium', sub: 'Past the library and through the double doors' }),
      sign({ layout: 'statement', head: 'Every child known, every day', sub: 'Our promise to families' }),
      sign({ layout: 'notice', eyebrow: 'Please note', head: 'Pick-up moves to the north gate', sub: 'From Monday the car park is closed while the new classrooms are built.' }),
      sign({ layout: 'number', badge: '42', head: 'Days until the book fair', sub: 'Bring a book to swap' }),
    ]
    for (const theme of POSTER_PACK_KEYS) {
      const doc = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs }, { theme, brand: WIDE })
      expect(tooWide(doc), theme).toEqual([])
      expect(overlapping(doc), theme).toEqual([])
    }
  })
})

describe('an added page', () => {
  it('is set in the kit’s fonts before it is measured', () => {
    const doc = composeDeck({ title: 'Deck', slides: [slide({ layout: 'title', title: 'Hello' })] })
    const { doc: next } = applyOps(doc, [{ op: 'addPage', after: 0, kind: 'content', fields: { title: 'Pick-up arrangements for the spring term', bullets: 'One\nTwo' } }], { brand: WIDE })
    const heading = next.layouts[1].layers.find((layer) => layer.role === 'heading') as TdWidgetData
    expect(heading.fontFamily).toBe('Libre Baskerville')
    expect(tooWide(next)).toEqual([])
  })
})
