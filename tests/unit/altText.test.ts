import { describe, expect, it } from 'vitest'
import { applyOps, composeDeck, describeDocument, sanitizeFields, MAX_ALT_LENGTH, type DesignDocument } from '@/compose'
import { altTextOf } from '@/common/methods/accessibility/structure'
import { applySlideAlt, pptxAltFor } from '@/common/methods/export/pptxAlt'
import { buildPageContent, UNDESCRIBED } from '@/common/methods/export/pageContent'
import { assemblePdf, safeLanguage } from '@/common/methods/export/exportPdf'
import { pdfString } from '@/common/methods/export/pdfWriter'
import type { TdWidgetData } from '@/store/types'

const image = (over: Partial<TdWidgetData> = {}) => ({ uuid: 'img1', type: 'w-image', imgUrl: '/p.jpg', left: 100, top: 100, width: 400, height: 300, ...over }) as unknown as TdWidgetData
const text = (words: string, over: Partial<TdWidgetData> = {}) => ({ uuid: Math.random().toString(16).slice(2), type: 'w-text', text: words, fontSize: 24, left: 100, top: 20, width: 800, height: 40, ...over }) as unknown as TdWidgetData

describe('altTextOf', () => {
  it('asks for a photo nobody described, and not for a shape', () => {
    expect(altTextOf(image())).toEqual({ state: 'missing' })
    expect(altTextOf(image({ alt: '  ' }))).toEqual({ state: 'missing' })
    expect(altTextOf(image({ alt: 'Year 5 at the science fair' }))).toEqual({ state: 'described', text: 'Year 5 at the science fair' })
    expect(altTextOf(image({ decorative: true }))).toEqual({ state: 'decorative' })
    expect(altTextOf({ uuid: 's', type: 'w-svg' } as unknown as TdWidgetData)).toEqual({ state: 'decorative' })
    expect(altTextOf({ uuid: 's', type: 'w-svg', alt: 'School crest' } as unknown as TdWidgetData)).toEqual({ state: 'described', text: 'School crest' })
  })
})

describe('the PowerPoint’s alt text', () => {
  const slide = (pics: string) => `<p:sld><p:cSld><p:spTree>${pics}</p:spTree></p:cSld></p:sld>`
  const pic = (id: number, name: string, descr: string) => `<p:pic>  <p:nvPicPr><p:cNvPr id="${id}" name="${name}" descr="${descr}">    </p:cNvPr>    <p:cNvPicPr/></p:nvPicPr></p:pic>`

  it('keeps a description, and takes out the file name pptxgenjs makes up', () => {
    const xml = slide(pic(2, 'ds:a', 'Year 5 at the fair') + pic(3, 'ds:b', 'preencoded.png'))
    const out = applySlideAlt(
      xml,
      new Map([
        ['ds:a', { text: 'Year 5 at the fair', decorative: false }],
        ['ds:b', { text: '', decorative: false }],
      ]),
    )
    expect(out).toContain('name="ds:a" descr="Year 5 at the fair"')
    expect(out).toContain('name="ds:b" descr=""')
    expect(out).not.toContain('preencoded.png')
    expect(out).not.toContain('adec:decorative')
  })

  it('marks a decorative picture the way PowerPoint does, and a background as decoration', () => {
    const out = applySlideAlt(slide(pic(2, 'ds:a', 'preencoded.png') + pic(3, 'Image 0', 'preencoded.png')), new Map([['ds:a', { text: '', decorative: true }]]))
    expect(out.match(/<adec:decorative [^>]*val="1"\/>/g)).toHaveLength(2)
    // The extension is the last thing inside cNvPr, where the schema wants it.
    expect(out).toMatch(/<\/a:extLst><\/p:cNvPr>/)
    // Twice over does not add it twice.
    expect(applySlideAlt(out, new Map([['ds:a', { text: '', decorative: true }]])).match(/adec:decorative xmlns/g)).toHaveLength(2)
  })

  it('leaves a text box’s self-closing cNvPr alone', () => {
    const xml = slide('<p:sp><p:nvSpPr><p:cNvPr id="4" name="Text 1"/></p:nvSpPr></p:sp>')
    expect(applySlideAlt(xml, new Map())).toBe(xml)
  })

  it('describes a text box drawn as a picture by its own words', () => {
    expect(pptxAltFor(text('Book fair <b>Friday</b>'))).toEqual({ text: 'Book fair Friday', decorative: false })
    expect(pptxAltFor(image({ alt: 'A crest' }))).toEqual({ text: 'A crest', decorative: false })
    expect(pptxAltFor(image())).toEqual({ text: '', decorative: false })
    expect(pptxAltFor(image({ decorative: true }))).toEqual({ text: '', decorative: true })
  })
})

describe('the PDF’s structure', () => {
  const layers = [text('Spring Fair', { fontSize: 90, top: 20, height: 100 }), image({ alt: 'Children on the bouncy castle (and a dog)' }), image({ uuid: 'img2', top: 500 }), image({ uuid: 'img3', top: 800, decorative: true }), text('Saturday 10 till 2, in the field behind the hall.', { top: 420 })]

  it('reads a page in order, tags the heading, and describes the pictures', () => {
    const { items } = buildPageContent(layers)
    expect(items.map((item) => (item.kind === 'text' ? item.tag : `Figure:${item.alt}`))).toEqual(['H1', 'Figure:Children on the bouncy castle (and a dog)', 'P', `Figure:${UNDESCRIBED}`])
  })

  it('writes a tagged file with a title, a language and the alt text', async () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
    const blob = assemblePdf([{ jpeg, pixelWidth: 1, pixelHeight: 1, widthPt: 612, heightPt: 792, content: buildPageContent(layers) }], 'Spring Fair (draft)', safeLanguage('en-US'))
    const pdf = Buffer.from(await blob.arrayBuffer()).toString('latin1')
    expect(pdf.startsWith('%PDF-1.7')).toBe(true)
    expect(pdf).toContain('/MarkInfo << /Marked true >>')
    expect(pdf).toContain(`/Lang ${pdfString('en-US')}`)
    expect(pdf).toContain('/DisplayDocTitle true')
    expect(pdf).toContain(`/Title ${pdfString('Spring Fair (draft)')}`)
    expect(pdf).toContain('/S /H1')
    // The description goes in as UTF-16 hex, so its brackets are never syntax.
    expect(pdf).toContain(`/S /Figure`)
    expect(pdf).toContain(`/Alt ${pdfString('Children on the bouncy castle (and a dog)')}`)
    expect(pdf).toContain(`/Alt ${pdfString(UNDESCRIBED)}`)
    // The words are there, invisibly, over the picture.
    expect(pdf).toContain('3 Tr')
    expect(pdf).toContain('/Artifact BMC')
    // The cross-reference table points at every object.
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n\r$/gm)].map((m) => Number(m[1]))
    for (const at of offsets) expect(pdf.slice(at, at + 12)).toMatch(/^\d+ 0 obj\n/)
  })

  it('falls back to a default language rather than writing whatever it was given', () => {
    expect(safeLanguage('fr-CA')).toBe('fr-CA')
    expect(safeLanguage(') /JS (x')).toBe('en-US')
    expect(safeLanguage('')).toBe('en-US')
  })
})

describe('alt text in a design', () => {
  const deck = (): DesignDocument => composeDeck({ title: 'x', slides: [{ layout: 'media', title: 'Library', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: { url: '/lib.jpg', width: 800, height: 600, alt: 'The new library shelves' } }] })
  const imageOf = (doc: DesignDocument) => doc.layouts[0].layers.find((layer) => layer.type === 'w-image') as TdWidgetData

  it('comes in with a composed picture and is what a model is shown', () => {
    const doc = deck()
    expect(imageOf(doc).alt).toBe('The new library shelves')
    expect(describeDocument(doc).pages[0].images[0].alt).toBe('The new library shelves')
  })

  it('goes with the picture it described when setImage swaps it, unless a new one comes too', () => {
    const doc = deck()
    const id = String(imageOf(doc).uuid)
    const swapped = applyOps(doc, [{ op: 'setImage', id, url: '/b.jpg', width: 10, height: 10 }]).doc
    expect(imageOf(swapped).alt).toBeUndefined()
    const described = applyOps(doc, [{ op: 'setImage', id, url: '/b.jpg', width: 10, height: 10, alt: 'Reading corner' }]).doc
    expect(imageOf(described).alt).toBe('Reading corner')
  })

  it('is plain words of a sensible length, or it is not kept', () => {
    const doc = deck()
    const layer = imageOf(doc) as any
    layer.alt = `A\u0000 photo\u0007 ${'x'.repeat(MAX_ALT_LENGTH * 2)}`
    const { doc: safe } = sanitizeFields(doc)
    expect(imageOf(safe).alt).toMatch(/^A photo x+$/)
    expect(String(imageOf(safe).alt).length).toBe(MAX_ALT_LENGTH)

    layer.alt = { toString: () => 'x' }
    layer.decorative = 'yes'
    const { doc: dropped, report } = sanitizeFields(doc)
    expect(imageOf(dropped).alt).toBeUndefined()
    expect(imageOf(dropped).decorative).toBeUndefined()
    expect(report.dropped.map((entry) => entry.path)).toEqual(['alt', 'decorative'])
  })
})
