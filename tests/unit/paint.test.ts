import { describe, expect, it } from 'vitest'
import { isSafePaint } from '@/compose'

describe('isSafePaint', () => {
  it.each(['#fff', '#ffffffff', '#7c3aed', '#00000059', 'rgb(255, 0, 0)', 'rgba(0,0,0,0.5)', 'rgb(255 0 0 / 50%)', 'hsl(210, 50%, 40%)', 'hsla(210deg 50% 40% / .3)', 'red', 'RebeccaPurple', 'transparent', 'none', 'currentColor', 'linear-gradient(90deg, #ff0000ff 0%,#0000ffff 100%)', 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(255, 255, 255, 0.5) 33.33333333333333%, #fff 100%)', 'radial-gradient(circle at 50% 50%, #ffffffff 0%,#000000ff 100%)', 'linear-gradient(to right, red, blue)', 'linear-gradient(-45deg, #000 0%, #fff 5.551115123125783e-15%)', 'repeating-linear-gradient(45deg, #000 0 10px, #fff 10px 20px)', 'linear-gradient(#000 0%, #fff 100%), radial-gradient(circle, red, blue)'])('accepts %s', (value) => {
    expect(isSafePaint(value)).toBe(true)
  })

  it.each(['url(/x)', 'url(data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>)', 'url(https://evil.test/p.png)', 'URL(/x)', 'red url(/x)', 'linear-gradient(red, blue), url(/x)', 'linear-gradient(red, url(/x))', 'image-set("/x.png" 1x)', 'var(--brand)', 'expression(alert(1))', 'red;background:url(/x)', 'red}body{display:none', '#fff\\3b background:url(/x)', "'red'", '"red"', 'notacolour', 'rgb(255, 0, 0', 'rgb(a, b, c)', 'linear-gradient(red)', 'linear-gradient(red,,blue)', 'conic-gradient(red, blue)', 'element(#x)', '', '   ', '#fff /* */', 'red !important', 'x'.repeat(3000)])('refuses %s', (value) => {
    expect(isSafePaint(value)).toBe(false)
  })

  it('refuses what is not a string at all', () => {
    expect(isSafePaint(undefined as unknown as string)).toBe(false)
    expect(isSafePaint(12 as unknown as string)).toBe(false)
  })
})
