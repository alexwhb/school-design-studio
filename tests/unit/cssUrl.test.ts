import { describe, expect, it } from 'vitest'
import { cssUrl } from '@/utils/cssUrl'

/** How many `url(` a value would open once it is in CSS. */
const urls = (css: string) => (css.match(/url\(/g) || []).length

describe('cssUrl', () => {
  it('quotes an ordinary address', () => {
    expect(cssUrl('/uploads/a.png')).toBe('url("/uploads/a.png")')
    expect(cssUrl('https://school.test/a b.png')).toBe('url("https://school.test/a b.png")')
  })

  it('cannot be closed by what is in the address', () => {
    const out = cssUrl('/a.png),url(https://evil/p.png')!
    expect(out).toBe('url("/a.png),url(https://evil/p.png")')
    // One string from the first quote to the last, so one url().
    expect(out.startsWith('url("') && out.endsWith('")')).toBe(true)
    expect(out.slice(5, -2)).not.toMatch(/(^|[^\\])"/)
  })

  it('escapes the quotes that would end the string', () => {
    expect(cssUrl(`/a.png"),url("https://evil/p.png`)).toBe('url("/a.png\\"),url(\\"https://evil/p.png")')
    expect(cssUrl(`/a.png'),url('https://evil/p.png`)).toBe(`url("/a.png'),url('https://evil/p.png")`)
    expect(cssUrl('/a\\"b')).toBe('url("/a\\\\\\"b")')
  })

  it('keeps a data URL with quotes in it whole', () => {
    const svg = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>`
    expect(cssUrl(svg)).toBe(`url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\"></svg>")`)
    expect(urls(cssUrl(svg)!)).toBe(1)
  })

  it('takes line breaks out and escapes other control characters', () => {
    expect(cssUrl('/a\n.png')).toBe('url("/a.png")')
    expect(cssUrl('/a\u0000.png')).toBe('url("/a\\0 .png")')
  })

  it('has nothing to say about nothing', () => {
    expect(cssUrl('')).toBeNull()
    expect(cssUrl('  ')).toBeNull()
    expect(cssUrl(undefined)).toBeNull()
    expect(cssUrl(42)).toBeNull()
  })
})
