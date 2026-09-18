/**
 * What "turn animation on" actually does to a composed deck.
 *
 * The interesting assertions here are the ones about what does NOT move. The
 * failure this recipe is guarding against is not a deck with no animation, it
 * is a deck where the heading and the footer animate too and every slide takes
 * two seconds to become readable.
 */
import { describe, expect, it } from 'vitest'
import { applyMotion, composeDeck, composePoster, hasMotion, type DesignDocument } from '@/compose'
import { buildSchedule } from '@/common/animations/play'

const deck = (): DesignDocument =>
  composeDeck({
    title: 'Open House',
    slides: [
      { layout: 'title', title: 'Open House', kicker: 'Riverbend', sub: 'September 12', bullets: [] },
      { layout: 'content', title: 'What to bring', bullets: [{ text: 'Sports physical', sub: [] }, { text: 'Code of conduct', sub: ['Signed'] }] },
    ],
  } as never)

const roleOf = (layer: unknown) => String((layer as Record<string, unknown>).role ?? '')
const animationOf = (layer: unknown) => (layer as Record<string, unknown>).animation as { preset: string; start: string; duration: number } | undefined

describe('applyMotion', () => {
  it('gives every page the same fade, so the deck reads as one thing', () => {
    const out = applyMotion(deck(), true)
    for (const layout of out.layouts) {
      expect((layout.global as Record<string, unknown>).transition).toEqual({ type: 'fade', duration: 400 })
    }
  })

  it('builds the points and leaves everything else alone', () => {
    const out = applyMotion(deck(), true)
    const content = out.layouts[1]

    const moving = content.layers.filter((layer) => animationOf(layer))
    const still = content.layers.filter((layer) => !animationOf(layer))

    // Every bullet moves.
    expect(moving.filter((layer) => roleOf(layer) === 'bullet')).toHaveLength(2)
    expect(moving.filter((layer) => roleOf(layer) === 'sub-bullet')).toHaveLength(1)
    // The heading and the school's name in the footer are simply there.
    expect(still.map(roleOf)).toContain('heading')
    expect(still.map(roleOf)).toContain('school.name')
  })

  it('leaves the title slide entirely still — it has no points to build', () => {
    const out = applyMotion(deck(), true)
    expect(out.layouts[0].layers.every((layer) => !animationOf(layer))).toBe(true)
    // But it still gives way to the next one.
    expect((out.layouts[0].global as Record<string, unknown>).transition).toBeTruthy()
  })

  it('brings a bullet in with its marker, not a step behind it', () => {
    const out = applyMotion(deck(), true)
    const layers = out.layouts[1].layers
    const animated = layers.filter((layer) => animationOf(layer))

    // The schedule the presenter and the exporter both read.
    const schedule = buildSchedule(animated.map((layer, i) => ({ uuid: String(i), animation: animationOf(layer) as never })))
    const starts = schedule.steps[0].map((item) => item.at)

    // Marker and bullet share a start; each pair is one beat after the last.
    expect(starts).toEqual([0, 0, 420, 420, 840, 840])
    // Nothing waits for a click — a presenter who talks fast is never blocked.
    expect(schedule.steps).toHaveLength(1)
  })

  it('takes it all off again, transition and entrances both', () => {
    const on = applyMotion(deck(), true)
    const off = applyMotion(on, false)
    for (const layout of off.layouts) {
      expect((layout.global as Record<string, unknown>).transition).toBeUndefined()
      expect(layout.layers.every((layer) => !animationOf(layer))).toBe(true)
    }
  })

  it('is the same deck whether it is turned on once or twice', () => {
    const once = applyMotion(deck(), true)
    expect(applyMotion(once, true)).toEqual(once)
  })

  it('does not touch the words, the positions or anything else on the page', () => {
    const before = deck()
    const after = applyMotion(before, true)
    const strip = (doc: DesignDocument) =>
      doc.layouts.map((layout) => ({
        global: { ...(layout.global as Record<string, unknown>), transition: undefined },
        layers: layout.layers.map((layer) => ({ ...(layer as Record<string, unknown>), animation: undefined })),
      }))
    expect(strip(after)).toEqual(strip(before))
  })

  it('leaves a poster alone — nobody presents a sign', () => {
    const signs = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs: [{ layout: 'title', title: 'Gym', bullets: [] }] } as never)
    expect(applyMotion(signs, true)).toEqual(signs)
  })

  it('survives a document with no pages in it', () => {
    const empty = { format: 'design-studio/v1', title: 'x', layouts: [] } as DesignDocument
    expect(applyMotion(empty, true)).toEqual(empty)
  })
})

describe('hasMotion', () => {
  it('reads back what applyMotion did, which is what a toggle shows', () => {
    expect(hasMotion(deck())).toBe(false)
    expect(hasMotion(applyMotion(deck(), true))).toBe(true)
    expect(hasMotion(applyMotion(applyMotion(deck(), true), false))).toBe(false)
  })

  it('counts a transition somebody set by hand on one page', () => {
    const doc = deck()
    ;(doc.layouts[1].global as Record<string, unknown>).transition = { type: 'push', duration: 500 }
    expect(hasMotion(doc)).toBe(true)
  })

  it('does not count a transition explicitly set to none', () => {
    const doc = deck()
    ;(doc.layouts[1].global as Record<string, unknown>).transition = { type: 'none', duration: 500 }
    expect(hasMotion(doc)).toBe(false)
  })
})
