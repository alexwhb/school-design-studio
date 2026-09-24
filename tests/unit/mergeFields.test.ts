import { describe, expect, it } from 'vitest'
import { applyBrand, composeDeck, sanitizeMarkup, type DesignDocument } from '@/compose'
import { escapeMarkup, fillMarkup, valuesResolver } from '@/utils/mergeFieldsCore'

const fill = (html: string, values: Record<string, string>) => fillMarkup(html, valuesResolver(values))

/**
 * A field's value is words. It is filled into the text of a box, and into a
 * link's address when the link field was given one — and in the second place a
 * quote in the value would close the attribute and write new ones.
 */
describe('filling a field inside a link', () => {
  const link = '<a href="https://{{school.website}}">Our site</a>'

  it('cannot break out of the attribute', () => {
    const out = fill(link, { 'school.website': 'x" style="position:fixed;inset:0' })
    // The words are all still there, inside the address, where they are inert.
    expect(out).not.toContain('style="')
    expect(out).not.toContain('" style')
    expect(out).toBe('<a href="https://x&quot; style=&quot;position:fixed;inset:0">Our site</a>')
    // And the allowlist reads the same thing back: one link, no style.
    expect(sanitizeMarkup(out)).toBe('<a href="https://x&quot; style=&quot;position:fixed;inset:0">Our site</a>')
  })

  it('cannot break out of a single-quoted one either', () => {
    const out = fill("<a href='https://{{school.website}}'>Our site</a>", { 'school.website': "x' onclick='alert(1)" })
    expect(out).not.toMatch(/onclick='/)
    expect(out).toContain('&#39;')
  })

  it('fills an ordinary address and keeps the link', () => {
    expect(fill(link, { 'school.website': 'riverbend.k12.us' })).toBe('<a href="https://riverbend.k12.us">Our site</a>')
  })

  it('takes the link off when the finished address is not one', () => {
    expect(fill('<a href="{{school.website}}">Our site</a>', { 'school.website': 'javascript:alert(1)' })).toBe('<a>Our site</a>')
    expect(fill('<a href="{{school.website}}">Our site</a>', { 'school.website': 'data:text/html,hi' })).toBe('<a>Our site</a>')
  })

  it('leaves a field in any other attribute standing', () => {
    const html = '<span style="color:{{school.colour}}">Hi</span>'
    expect(fill(html, { 'school.colour': 'red;background:url(//evil.test/x.png)' })).toBe(html)
  })

  it('still fills the words, bold and all', () => {
    expect(fill('Welcome to {{<b>school.name</b>}}', { 'school.name': 'Tom & Jerry’s "Academy"' })).toBe('Welcome to Tom &amp; Jerry’s &quot;Academy&quot;')
  })

  it('escapes both quotes', () => {
    expect(escapeMarkup(`a"b'c<d>&`)).toBe('a&quot;b&#39;c&lt;d&gt;&amp;')
  })

  it('does the same through applyBrand', () => {
    const doc: DesignDocument = composeDeck({
      title: 'x',
      slides: [{ layout: 'title', title: 'Open House', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }],
    })
    const heading = doc.layouts[0].layers.find((layer) => layer.type === 'w-text')!
    heading.text = link
    const kit = { name: 'Riverbend', shortName: '', tagline: '', address: '', phone: '', email: '', website: 'x" style="position:fixed;inset:0', colors: [], fonts: {} }
    const out = String(applyBrand(doc, kit).layouts[0].layers.find((layer) => layer.uuid === heading.uuid)!.text)
    expect(out).not.toContain('" style')
  })
})
