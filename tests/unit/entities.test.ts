import { describe, expect, it } from 'vitest'
import { applyOps, composeDeck, describeDocument, sanitizeMarkup, type DesignDocument } from '@/compose'
import { decodeEntities } from '@/utils/mergeFieldsCore'

/** A one-page deck with one text widget, and that widget's id. */
function page(): { doc: DesignDocument; id: string } {
  const doc = composeDeck({
    title: 'x',
    slides: [{ layout: 'title', title: 'Open House', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }],
  })
  const id = describeDocument(doc).pages[0].texts.find((text) => text.role === 'heading')!.id
  return { doc, id }
}

/**
 * A character reference names a character, or it is text. `String.fromCodePoint`
 * throws on anything past U+10FFFF, and three readers promise not to throw:
 * sanitizeMarkup, which the planner runs inside a validator, the setMarkup op,
 * and describeDocument.
 */
describe('decoding a character reference', () => {
  it('decodes the ones that name a character', () => {
    expect(decodeEntities('&#37; &#x41; &amp; &lt;b&gt; &nbsp;')).toBe('% A & <b>  ')
    expect(decodeEntities('&#x1F600;')).toBe('\u{1F600}')
    expect(decodeEntities('&#x10FFFF;')).toBe('\u{10FFFF}')
  })

  it.each(['&#x110000;', '&#99999999999;', '&#1114112;', '&#xFFFFFFFFFFFFFFFFFFFF;', '&#0;', '&#xD800;', '&#56320;'])('leaves %s as the text it was', (reference) => {
    expect(() => decodeEntities(reference)).not.toThrow()
    expect(decodeEntities(`a${reference}b`)).toBe(`a${reference}b`)
  })

  it('does not read the names Object.prototype answers to as entities', () => {
    expect(decodeEntities('&constructor;')).toBe('&constructor;')
    expect(decodeEntities('&toString; &hasOwnProperty; &__proto__;')).toBe('&toString; &hasOwnProperty; &__proto__;')
  })

  it('does not read hex letters in a decimal reference as a number', () => {
    expect(decodeEntities('&#12ab;')).toBe('&#12ab;')
  })

  it('never throws out of sanitizeMarkup, setMarkup or describeDocument', () => {
    const odd = 'Hi &#x110000; &#99999999999; &constructor;'
    expect(() => sanitizeMarkup(odd)).not.toThrow()
    expect(sanitizeMarkup(odd)).toBe('Hi &amp;#x110000; &amp;#99999999999; &amp;constructor;')

    const { doc, id } = page()
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setMarkup', id, html: odd }])
    expect(rejected).toEqual([])
    expect(() => describeDocument(after)).not.toThrow()
    expect(describeDocument(after).pages[0].texts.find((text) => text.id === id)!.text).toBe('Hi &#x110000; &#99999999999; &constructor;')
  })
})
