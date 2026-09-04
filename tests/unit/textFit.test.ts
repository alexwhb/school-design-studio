import { describe, expect, it } from 'vitest'
import { fitText, measureText, wrapText } from '@/compose/textFit'
import fonts from '@/assets/data/FontsData'

/**
 * The composer places everything below a run of text against the height it
 * predicts for that run, so a prediction that is too small is not a slightly
 * wrong layout — it is the next thing down disappearing behind the second line.
 * These are the promises the rest of `compose` is built on.
 */
describe('fitting words into a box', () => {
  const box = { width: 600, height: 400, minFontSize: 20 }
  const style = { fontFamily: 'Inter', fontSize: 100, lineHeight: 1.2 }

  it('never hands back a line wider than the box', () => {
    // `wrapText` breaks at spaces and nowhere else, so a single long word comes
    // back as one line at any size. A fitter that only counted lines called
    // that a fit, and the browser then wrapped it mid-word — which is how the
    // arrow on a direction sign ended up behind the second line of "Gymnasium".
    const hard = ['Gymnasium', 'Supercalifragilisticexpialidocious', 'Riverbend', 'Auditorium', 'Kindergarten', 'W'.repeat(40)]
    for (const family of fonts.map((font) => font.value)) {
      for (const text of hard) {
        const fit = fitText(text, { ...style, fontFamily: family }, box)
        const scaled = { ...style, fontFamily: family, fontSize: fit.fontSize }
        for (const line of fit.lines) {
          expect(Math.round(measureText(line, scaled)), `${family} «${text}»`).toBeLessThanOrEqual(box.width)
        }
      }
    }
  })

  it('shrinks a word before it cuts it, and cuts it only at the floor', () => {
    const big = fitText('Gymnasium', style, box)
    expect(big.truncated).toBe(false)
    expect(big.fontSize).toBeLessThan(100)
    expect(big.text).toBe('Gymnasium')

    // Too long for the box even at the floor: cut by characters, because there
    // are no words to drop, and marked so it reads as deliberate.
    const cut = fitText('Supercalifragilisticexpialidocious', style, { width: 200, height: 100, minFontSize: 60 })
    expect(cut.truncated).toBe(true)
    expect(cut.text.endsWith('…')).toBe(true)
    expect(measureText(cut.lines[0], { ...style, fontSize: cut.fontSize })).toBeLessThanOrEqual(200)
  })

  it('keeps every line inside the box when there are several', () => {
    const fit = fitText('Enrollment grew for a third consecutive year while class sizes held steady', style, box)
    expect(fit.lines.length).toBeGreaterThan(1)
    for (const line of fit.lines) expect(measureText(line, { ...style, fontSize: fit.fontSize })).toBeLessThanOrEqual(box.width)
    expect(fit.lines.join(' ')).toBe(fit.text)
  })

  it('measures a monospace face as monospace', () => {
    // Every glyph is the same width in these, which a per-character table
    // cannot express: it made `iiiillll` half the width the browser draws.
    for (const family of ['IBM Plex Mono', 'JetBrains Mono']) {
      const narrow = measureText('iiiillll', { fontFamily: family, fontSize: 100, lineHeight: 1 })
      const wide = measureText('MMMMWWWW', { fontFamily: family, fontSize: 100, lineHeight: 1 })
      expect(narrow).toBe(wide)
      // 0.6em a character, measured in the browser rather than guessed.
      expect(narrow).toBe(8 * 60)
    }
  })

  it('breaks at the spaces and keeps the words whole', () => {
    const lines = wrapText('Open House on Thursday', 1, { fontFamily: 'Inter', fontSize: 100, lineHeight: 1 })
    expect(lines).toEqual(['Open', 'House', 'on', 'Thursday'])
  })

  it('has nothing to say about nothing', () => {
    const empty = fitText('   ', style, box)
    expect(empty.lines).toEqual([])
    expect(empty.text).toBe('')
  })
})
