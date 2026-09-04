import { describe, expect, it } from 'vitest'
import { SAFE_FONT_FAMILY, SANITISED_FIELDS, applyOps, composeDeck, sanitizeFields, type DesignDocument } from '@/compose'
import fonts from '@/assets/data/FontsData'
import type { TdWidgetData } from '@/store/types'

/** A one-page deck whose heading carries whatever font family is given. */
function withFamily(value: unknown): DesignDocument {
  const doc = composeDeck({
    title: 'x',
    slides: [{ layout: 'title', title: 'Open House', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }],
  })
  const heading = doc.layouts[0].layers.find((layer) => layer.brandRole === 'heading') as TdWidgetData
  ;(heading.fontClass as Record<string, unknown>).value = value
  heading.fontFamily = value as string
  return doc
}

const headingOf = (doc: DesignDocument) => doc.layouts[0].layers.find((layer) => layer.brandRole === 'heading') as TdWidgetData

describe('fields that get interpolated somewhere', () => {
  it('names the one field there is, and where it lives', () => {
    expect(SANITISED_FIELDS['w-text']).toEqual(['fontClass.value'])
    expect(SANITISED_FIELDS['w-table']).toEqual(['fontClass.value'])
  })

  it('accepts every family the editor actually bundles', () => {
    // The obvious pattern — letters, digits, underscore, hyphen — rejects nine
    // of these, which is every two-word family. The space has to be allowed.
    expect(fonts.length).toBeGreaterThan(20)
    for (const font of fonts) expect(SAFE_FONT_FAMILY.test(font.value), font.value).toBe(true)
  })

  it('drops a family that could write CSS of its own', () => {
    const attacks = ['"; } body { display: none } @font-face { font-family: "x', 'Inter"; src: url("https://evil.test/x.woff2")', 'a</style><script>alert(1)</script>', 'a{}', 'a\\\\', 'x'.repeat(65), '']
    for (const value of attacks) {
      const { doc, report } = sanitizeFields(withFamily(value))
      expect(report.dropped.length, value).toBe(1)
      expect(report.dropped[0].path).toBe('fontClass.value')
      // The family and the name the widget draws in are one setting written
      // twice, so both go — the text falls back to the editor's own default.
      expect(headingOf(doc).fontClass, value).toBeUndefined()
      expect(headingOf(doc).fontFamily, value).toBeUndefined()
      expect(JSON.stringify(doc), value).not.toContain('evil.test')
    }
  })

  it('leaves a real design entirely alone', () => {
    const doc = composeDeck({
      title: 'x',
      slides: [{ layout: 'content', title: 'What is on', kicker: null, sub: null, bullets: [{ text: 'Tours from six', sub: [] }], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }],
    })
    const { doc: after, report } = sanitizeFields(doc)
    expect(report.dropped).toEqual([])
    expect(after).toEqual(doc)
  })

  it('works on a copy, so a host can hand in what it is still holding', () => {
    const doc = withFamily('a{}')
    const before = JSON.stringify(doc)
    sanitizeFields(doc)
    expect(JSON.stringify(doc)).toBe(before)
  })

  it('cannot be got past by going through applyOps', () => {
    // applyOps is one of the three ways a document reaches the editor, so it
    // cleans on the way in rather than trusting what it was handed.
    const poisoned = withFamily('"; } body { display: none } .x { font-family: "y')
    const id = headingOf(poisoned).uuid
    const { doc } = applyOps(poisoned, [{ op: 'setText', id, text: 'Spring Open House' }])
    expect(headingOf(doc).fontClass).toBeUndefined()
    expect(JSON.stringify(doc)).not.toContain('display: none')
  })

  it('does not mind a widget with no fontClass at all', () => {
    const doc = composeDeck({ title: 'x', slides: [{ layout: 'title', title: 'x', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }] })
    delete (headingOf(doc) as Record<string, unknown>).fontClass
    expect(() => sanitizeFields(doc)).not.toThrow()
    expect(sanitizeFields(doc).report.dropped).toEqual([])
  })
})
