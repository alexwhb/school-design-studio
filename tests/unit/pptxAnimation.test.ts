/**
 * What gets written into a .pptx so its motion survives.
 *
 * These assert on XML strings, which is usually a smell — but here the string
 * IS the contract. PowerPoint and Drive's importer both read this by schema,
 * and the difference between an effect that plays and a file that prompts to be
 * repaired is an attribute. Asserting on the shape of a returned object would
 * test the code and not the thing the code exists to produce.
 */
import { describe, expect, it } from 'vitest'
import { applySlideMotion, motionName, renumberShapes, timingXml, transitionXml, type MotionTarget } from '@/common/methods/export/pptxAnimation'
import type { TWidgetAnimation } from '@/common/animations/presets'

/** An element carrying an entrance. Defaults to the plainest one there is. */
const target = (uuid: string, animation: Partial<TWidgetAnimation> = {}): MotionTarget => ({
  uuid,
  objectName: motionName(uuid),
  animation: { preset: 'fade', duration: 500, delay: 0, start: 'after', ...animation },
})

/** An element with no entrance at all, which is most of them on most slides. */
const plain = (uuid: string): MotionTarget => ({ uuid, objectName: motionName(uuid) })

/** A slide as pptxgenjs leaves it: one shape tree, then shapes, then the close. */
function slideXml(shapes: Array<{ id: number; name: string }>): string {
  const body = shapes.map((s) => `<p:sp><p:nvSpPr><p:cNvPr id="${s.id}" name="${s.name}"/></p:nvSpPr></p:sp>`).join('')
  return `<p:sld><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/></p:nvGrpSpPr>${body}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
}

describe('transitionXml', () => {
  it('writes the element PowerPoint names for each of the editor’s transitions', () => {
    expect(transitionXml({ type: 'fade', duration: 500 })).toContain('<p:fade/>')
    expect(transitionXml({ type: 'slide', duration: 500 })).toContain('<p:cover dir="l"/>')
    expect(transitionXml({ type: 'push', duration: 500 })).toContain('<p:pull dir="l"/>')
    expect(transitionXml({ type: 'zoom', duration: 500 })).toContain('<p:zoom dir="in"/>')
    expect(transitionXml({ type: 'wipe', duration: 500 })).toContain('<p:wipe dir="r"/>')
  })

  it('rounds the editor’s milliseconds to the three words the format has', () => {
    expect(transitionXml({ type: 'fade', duration: 200 })).toContain('spd="fast"')
    // The editor's own default has to land in the middle, or every deck
    // exported without a thought about it comes out slow.
    expect(transitionXml({ type: 'fade', duration: 500 })).toContain('spd="med"')
    expect(transitionXml({ type: 'fade', duration: 2000 })).toContain('spd="slow"')
  })
})

describe('renumberShapes', () => {
  it('gives every shape its own id, which pptxgenjs does not', () => {
    // Straight from the exporter: a text box and a table on one slide both come
    // out as id 2, because pptxgenjs counts them on separate counters.
    const xml = slideXml([
      { id: 2, name: motionName('text') },
      { id: 2, name: motionName('table') },
      { id: 5, name: motionName('photo') },
    ])
    const { xml: out, spids } = renumberShapes(xml)

    const ids = [...out.matchAll(/<p:cNvPr id="(\d+)"/g)].map((m) => Number(m[1]))
    expect(ids).toEqual([1, 2, 3, 4])
    expect(new Set(ids).size).toBe(ids.length)
    // The shape tree's own entry stays 1 and is not offered as a target.
    expect(spids.get(motionName('text'))).toBe(2)
    expect(spids.get(motionName('table'))).toBe(3)
    expect(spids.get(motionName('photo'))).toBe(4)
  })

  it('leaves shapes it did not name out of the map', () => {
    const { spids } = renumberShapes(slideXml([{ id: 2, name: 'Picture 1' }]))
    expect(spids.size).toBe(0)
  })

  it('keeps the names, so nothing else in the file stops matching', () => {
    const { xml } = renumberShapes(slideXml([{ id: 9, name: motionName('a') }]))
    expect(xml).toContain(`name="${motionName('a')}"`)
  })
})

describe('timingXml', () => {
  const spids = new Map([
    [motionName('a'), 2],
    [motionName('b'), 3],
    [motionName('c'), 4],
  ])

  it('is empty when nothing on the slide is animated', () => {
    expect(timingXml([plain('a'), plain('b')], spids)).toBe('')
  })

  it('plays the first step on arrival and every later one on a click', () => {
    const xml = timingXml([target('a', { start: 'after' }), target('b', { start: 'click' }), target('c', { start: 'click' })], spids)
    const starts = [...xml.matchAll(/<p:cTn id="\d+" fill="hold"><p:stCondLst><p:cond delay="(\w+)"\/>/g)]
      .map((m) => m[1])
      // A group is a par inside a par: the outer one carries the start
      // condition, the inner one always begins at 0. So every other match.
      .filter((_, index) => index % 2 === 0)
    expect(starts).toEqual(['0', 'indefinite', 'indefinite'])
  })

  it('gives every node a unique id', () => {
    const xml = timingXml([target('a'), target('b', { start: 'click' }), target('c')], spids)
    const ids = [...xml.matchAll(/<p:cTn id="(\d+)"/g)].map((m) => Number(m[1]))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain(1) // tmRoot
    expect(ids).toContain(2) // mainSeq
  })

  it('carries each element’s own duration and its offset within the step', () => {
    // 'after' waits for the one before it: 500ms in, 300ms long.
    const xml = timingXml([target('a', { duration: 500 }), target('b', { duration: 300, start: 'after' })], spids)
    expect(xml).toContain('dur="500"')
    expect(xml).toContain('dur="300"')
    expect(xml).toContain('<p:cond delay="500"/>')
  })

  it('starts a `with` element at the same moment as the one before it', () => {
    const xml = timingXml([target('a', { duration: 500 }), target('b', { start: 'with' })], spids)
    const delays = [...xml.matchAll(/presetClass="entr"[^>]*><p:stCondLst><p:cond delay="(\d+)"\/>/g)].map((m) => m[1])
    expect(delays).toEqual(['0', '0'])
  })

  it('points each effect at the shape id the renumbering handed out', () => {
    const xml = timingXml([target('b')], spids)
    expect(xml).toContain('<p:spTgt spid="3"/>')
    expect(xml).not.toContain('spid="2"')
  })

  it('skips a widget whose shape never made it onto the slide', () => {
    // The exporter drops a text box with no words in it. An effect aimed at a
    // shape that was never written is what makes PowerPoint offer to repair.
    const xml = timingXml([target('a'), target('missing')], spids)
    expect(xml).toContain('<p:spTgt spid="2"/>')
    expect(xml).not.toContain(motionName('missing'))
    expect([...xml.matchAll(/presetClass="entr"/g)]).toHaveLength(1)
  })

  it('keeps the survivors on their own beat when one is dropped', () => {
    // Compose pairs each bullet with a marker drawn just before it, and the
    // bullet starts `with` that marker. When the marker cannot be written —
    // a shape that failed to rasterise — the bullets must keep the cascade
    // they have in the presenter rather than all arriving at once.
    const xml = timingXml(
      [
        target('gone-1', { duration: 420 }),
        target('a', { duration: 420, start: 'with' }),
        target('gone-2', { duration: 420 }),
        target('b', { duration: 420, start: 'with' }),
        target('gone-3', { duration: 420 }),
        target('c', { duration: 420, start: 'with' }),
      ],
      spids,
    )
    const delays = [...xml.matchAll(/presetClass="entr"[^>]*><p:stCondLst><p:cond delay="(\d+)"\/>/g)].map((m) => m[1])
    expect(delays).toEqual(['0', '420', '840'])
  })

  it('reveals the element before playing its filter', () => {
    const xml = timingXml([target('a')], spids)
    expect(xml).toContain('<p:attrName>style.visibility</p:attrName>')
    expect(xml.indexOf('style.visibility')).toBeLessThan(xml.indexOf('animEffect'))
  })

  it('keeps a direction where PowerPoint has one and fades where it does not', () => {
    expect(timingXml([target('a', { preset: 'rise' })], spids)).toContain('filter="wipe(up)"')
    expect(timingXml([target('a', { preset: 'drop' })], spids)).toContain('filter="wipe(down)"')
    expect(timingXml([target('a', { preset: 'slide-left' })], spids)).toContain('filter="wipe(right)"')
    // No spring in the format, so Pop keeps its beat and loses its bounce.
    expect(timingXml([target('a', { preset: 'pop' })], spids)).toContain('filter="fade"')
    expect(timingXml([target('a', { preset: 'spin' })], spids)).toContain('filter="fade"')
  })

  it('ignores an animation naming a preset that no longer exists', () => {
    expect(timingXml([target('a', { preset: 'no-such-preset' })], spids)).toBe('')
  })
})

describe('applySlideMotion', () => {
  const xml = slideXml([{ id: 2, name: motionName('a') }])

  it('leaves a slide with no motion exactly as it was', () => {
    expect(applySlideMotion(xml, { transition: null, builds: [plain('a')] })).toBe(xml)
  })

  it('puts both elements where CT_Slide wants them, after clrMapOvr', () => {
    const out = applySlideMotion(xml, { transition: { type: 'fade', duration: 500 }, builds: [target('a', { preset: 'fade' })] })
    expect(out.indexOf('<p:clrMapOvr>')).toBeLessThan(out.indexOf('<p:transition'))
    expect(out.indexOf('<p:transition')).toBeLessThan(out.indexOf('<p:timing>'))
    expect(out.trimEnd().endsWith('</p:sld>')).toBe(true)
  })

  it('writes a transition on a slide with nothing animated on it', () => {
    const out = applySlideMotion(xml, { transition: { type: 'fade', duration: 500 }, builds: [plain('a')] })
    expect(out).toContain('<p:transition')
    expect(out).not.toContain('<p:timing>')
    // Nothing points at a shape, so the ids are left alone.
    expect(out).toContain('<p:cNvPr id="2"')
  })

  it('renumbers only when something is going to point at a shape', () => {
    const messy = slideXml([
      { id: 2, name: motionName('a') },
      { id: 2, name: motionName('b') },
    ])
    expect(applySlideMotion(messy, { transition: { type: 'fade', duration: 500 }, builds: [] })).toContain('<p:transition')
    const animated = applySlideMotion(messy, { transition: null, builds: [plain('a'), target('b', { preset: 'fade' })] })
    expect(animated).toContain('<p:cNvPr id="3"')
  })
})
