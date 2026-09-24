import { describe, expect, it } from 'vitest'
import { applyBrandToLayouts, brandFontFor } from '@/store/widget/brandCore'
import { applyBrand, composeDeck, composePoster, type TBrandKit } from '@/compose'
import type { TdLayout, TdWidgetData } from '@/store/types'

const KIT: TBrandKit = {
  name: 'Riverbend Academy',
  shortName: 'Riverbend',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  colors: [],
  // Libre Baskerville for headings, Montserrat for body text.
  fonts: { heading: 17, body: 5 },
}

function text(over: Partial<TdWidgetData>): TdWidgetData {
  return {
    uuid: Math.random().toString(16).slice(2),
    type: 'w-text',
    text: 'Words',
    fontSize: 24,
    fontWeight: 400,
    fontFamily: 'Inter',
    fontClass: { id: 1, value: 'Inter', alias: 'Inter', url: '' },
    left: 0,
    top: 0,
    width: 400,
    height: 40,
    parent: '-1',
    ...over,
  } as unknown as TdWidgetData
}

function pageOf(layers: TdWidgetData[]): TdLayout[] {
  return [{ global: { uuid: '-1', type: 'page', width: 1920, height: 1080 } as never, layers }]
}

describe('Apply brand and brandRole', () => {
  it('leaves a box marked keep in its own face', () => {
    const layers = [text({ brandRole: 'keep', fontWeight: 700, fontSize: 90 })]
    applyBrandToLayouts(pageOf(layers), KIT, { fields: false, fonts: true, colors: false })
    expect(layers[0].fontFamily).toBe('Inter')
  })

  it('gives a box what it asks for, whatever its size and weight', () => {
    // A bold body line would be taken for a heading by the guess, and a small
    // light heading for body text.
    const layers = [text({ brandRole: 'body', fontWeight: 700, fontSize: 90 }), text({ brandRole: 'heading', fontWeight: 400, fontSize: 18 })]
    applyBrandToLayouts(pageOf(layers), KIT, { fields: false, fonts: true, colors: false })
    expect(layers[0].fontFamily).toBe('Montserrat')
    expect(layers[1].fontFamily).toBe('Libre Baskerville')
  })

  it('still guesses for a box that says nothing', () => {
    const layers = [text({ fontWeight: 700, fontSize: 90 }), text({ fontSize: 18 })]
    applyBrandToLayouts(pageOf(layers), KIT, { fields: false, fonts: true, colors: false })
    expect(layers[0].fontFamily).toBe('Libre Baskerville')
    expect(layers[1].fontFamily).toBe('Montserrat')
  })

  it('falls back to the other font when the kit names one', () => {
    expect(brandFontFor('heading', { fonts: { body: 5 } })?.value).toBe('Montserrat')
    expect(brandFontFor('body', { fonts: { heading: 17 } })?.value).toBe('Libre Baskerville')
    expect(brandFontFor('body', { fonts: {} })).toBeUndefined()
  })

  it('keeps a composed deck’s eyebrows and footers in the theme’s face', () => {
    const deck = composeDeck({ title: 'Deck', slides: [{ layout: 'content', title: 'Heading', kicker: 'Section one', sub: null, bullets: [{ text: 'A point', sub: [] }], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }] }, { theme: 'editorial' })
    const branded = applyBrand(deck, KIT)
    const byRole = (role: string) => branded.layouts[0].layers.find((layer) => layer.role === role) as TdWidgetData
    expect(byRole('eyebrow').fontFamily).toBe('IBM Plex Mono')
    expect(byRole('school.name').fontFamily).toBe('IBM Plex Mono')
    expect(byRole('heading').fontFamily).toBe('Libre Baskerville')
    expect(byRole('bullet').fontFamily).toBe('Montserrat')
  })

  it('keeps a sign’s eyebrow and footer too', () => {
    const doc = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs: [{ layout: 'notice', icon: null, eyebrow: 'Please note', badge: null, head: 'Pick-up moves', sub: 'From Monday', foot: null }] }, { theme: 'navy', brand: KIT })
    const byRole = (role: string) => doc.layouts[0].layers.find((layer) => layer.role === role) as TdWidgetData
    expect(byRole('eyebrow').fontFamily).toBe('Inter')
    expect(byRole('footer').fontFamily).toBe('Inter')
    expect(byRole('heading').fontFamily).toBe('Libre Baskerville')
  })
})
