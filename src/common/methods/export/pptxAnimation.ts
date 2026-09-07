/**
 * Writes motion into a .pptx after pptxgenjs has finished with it.
 *
 * pptxgenjs has no API for either half of this — it never emits a
 * `<p:transition>` element and never emits a `<p:timing>` tree, and exposes no
 * hook to add one. So the deck is built normally, and this module reopens the
 * finished file and edits the slide XML directly.
 *
 * That sounds worse than it is. Both elements are leaves of `CT_Slide` that sit
 * after `</p:clrMapOvr>`, so adding them is an append rather than a rewrite,
 * and everything pptxgenjs produced is left exactly as it was.
 *
 * WHY THIS EXISTS AT ALL: a deck exported from here is usually opened in Google
 * Slides rather than PowerPoint — the planner uploads it to Drive asking for a
 * `application/vnd.google-apps.presentation` conversion. Drive's importer reads
 * both of these elements faithfully, so a transition set in the editor arrives
 * as a real Slides transition the school can then edit. Verified end to end
 * before any of this was written: a hand-injected file was converted, opened,
 * and the effects were there in the Motion panel.
 *
 * WHAT IS DELIBERATELY NOT HERE: per-paragraph builds, where the bullets of one
 * text box appear one at a time. The XML for it works — the same experiment
 * proved it — but the editor has no way to *author* one (an animation is held
 * on a widget, not on a line of it) and the presenter has no way to play one.
 * Writing it would put a beat in the school's Google copy that neither the
 * editor nor the presenter agrees with, which is the drift this codebase keeps
 * out of its export paths. It needs an authoring model first.
 */
import { buildSchedule, type AnimatableWidget } from '@/common/animations/play'
import { getPreset } from '@/common/animations/presets'
import { readTransition, type TPageTransition, type TTransitionType } from '@/common/animations/transitions'

/** What one slide should be given. */
export type SlideMotion = {
  /** The page's own transition, or null. */
  transition: TPageTransition | null
  /**
   * The widgets that were actually placed on this slide, in the order they were
   * placed, each with the `objectName` the exporter gave it. A widget the
   * exporter skipped must not appear: its shape is not in the file, and an
   * effect pointed at a missing shape is what makes PowerPoint offer to repair
   * the deck.
   */
  builds: MotionTarget[]
}

export type MotionTarget = AnimatableWidget & {
  /** The `objectName` passed to pptxgenjs, which lands in the shape's `name`. */
  objectName: string
}

/** Prefix for every `objectName` this exporter sets, so a shape can be found again. */
export const MOTION_NAME_PREFIX = 'ds:'

export function motionName(uuid: string): string {
  return `${MOTION_NAME_PREFIX}${uuid}`
}

// --- slide transitions ---------------------------------------------------

/**
 * PowerPoint holds a transition's speed as one of three words, not as a
 * duration. The editor holds milliseconds, so the closest word is used and the
 * exact number is dropped — there is nowhere faithful to put it. The
 * boundaries are picked so the editor's own default (500ms) reads as `med`.
 */
function speedWord(duration: number): 'fast' | 'med' | 'slow' {
  if (duration <= 350) return 'fast'
  if (duration <= 900) return 'med'
  return 'slow'
}

/**
 * The OOXML element for each of the editor's transitions.
 *
 * `dir` is the direction of TRAVEL, which is why the mapping is not always the
 * word it looks like. The editor's `slide` and `push` both bring the next page
 * in from the right edge, so the motion is leftwards and `dir="l"`. Its `wipe`
 * uncovers from the left edge rightwards, so that one is `dir="r"`.
 *
 * `none` never reaches here — `readTransition` returns null for it.
 */
const TRANSITION_ELEMENT: Record<Exclude<TTransitionType, 'none'>, string> = {
  fade: '<p:fade/>',
  slide: '<p:cover dir="l"/>',
  push: '<p:pull dir="l"/>',
  zoom: '<p:zoom dir="in"/>',
  wipe: '<p:wipe dir="r"/>',
}

export function transitionXml(transition: TPageTransition): string {
  const element = TRANSITION_ELEMENT[transition.type as Exclude<TTransitionType, 'none'>]
  if (!element) return ''
  return `<p:transition spd="${speedWord(transition.duration)}">${element}</p:transition>`
}

// --- element entrances ---------------------------------------------------

/**
 * How each of the editor's presets is written into the file.
 *
 * PowerPoint's entrance vocabulary is coarser than the presenter's: it has no
 * spring, no blur, no rotation-and-scale. Rather than approximate those with
 * something that would read as a different animation, everything outside the
 * fades and the four wipes comes out as a fade — which is honest, and keeps the
 * thing that actually carries the effect, the BEAT. When each element arrives,
 * how long it takes and what waits for a click all survive exactly; only the
 * flourish is flattened.
 *
 * `presetID` and `presetSubtype` are what PowerPoint's own UI reads to put a
 * name against the effect; `filter` is what actually draws it.
 */
type EntranceEffect = { presetID: number; presetSubtype: number; filter: string }

const FADE: EntranceEffect = { presetID: 10, presetSubtype: 0, filter: 'fade' }
/** Wipe subtypes are PowerPoint's direction codes: 1 up, 2 right, 4 left, 8 down. */
const wipe = (subtype: number, direction: string): EntranceEffect => ({ presetID: 22, presetSubtype: subtype, filter: `wipe(${direction})` })

const ENTRANCE_BY_PRESET: Record<string, EntranceEffect> = {
  fade: FADE,
  'soft-focus': FADE,
  rise: wipe(1, 'up'),
  drop: wipe(8, 'down'),
  'slide-left': wipe(2, 'right'),
  'slide-right': wipe(4, 'left'),
  drift: FADE,
  pop: FADE,
  bounce: FADE,
  'zoom-back': FADE,
  'wipe-right': wipe(2, 'right'),
  'wipe-up': wipe(1, 'up'),
  unfold: FADE,
  flip: FADE,
  spin: FADE,
}

function entranceFor(presetId: string): EntranceEffect {
  return ENTRANCE_BY_PRESET[presetId] ?? FADE
}

/**
 * Hands out the `id` every node in a timing tree needs.
 *
 * They only have to be unique within the slide's tree, and PowerPoint writes
 * them in document order, so a counter is the whole requirement. 1 and 2 are
 * spoken for by the root and the main sequence.
 */
function ids(start: number) {
  let next = start
  return () => next++
}

/**
 * One element's entrance: make it visible, then play the filter.
 *
 * The `<p:set>` is not decoration. Everything in a build sequence starts hidden
 * and the set is what reveals it at its turn; without it PowerPoint draws the
 * element from the first frame and the effect plays over something already on
 * screen.
 */
function entranceXml(target: MotionTarget, spid: number, delay: number, nodeType: string, nextId: () => number): string {
  const animation = target.animation
  const preset = getPreset(animation?.preset)
  if (!animation || !preset) return ''
  const effect = entranceFor(animation.preset)
  const duration = Math.max(1, Math.round(animation.duration))
  const tgt = `<p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl>`

  const groupId = nextId()
  const setId = nextId()
  const effectId = nextId()

  return (
    `<p:par><p:cTn id="${groupId}" presetID="${effect.presetID}" presetClass="entr" presetSubtype="${effect.presetSubtype}" fill="hold" grpId="0" nodeType="${nodeType}">` +
    `<p:stCondLst><p:cond delay="${Math.max(0, Math.round(delay))}"/></p:stCondLst>` +
    `<p:childTnLst>` +
    `<p:set><p:cBhvr><p:cTn id="${setId}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
    `<p:animEffect transition="in" filter="${effect.filter}"><p:cBhvr><p:cTn id="${effectId}" dur="${duration}"/>${tgt}</p:cBhvr></p:animEffect>` +
    `</p:childTnLst></p:cTn></p:par>`
  )
}

/**
 * The whole `<p:timing>` tree for one slide.
 *
 * The shape is PowerPoint's own and is not worth deviating from: a root node
 * holding one `mainSeq`, holding one group per advance. A group that waits for
 * the presenter starts on `indefinite`; the first group starts on `0`, because
 * in the editor's model step 0 plays the moment the slide opens.
 *
 * Returns '' when nothing on the slide is animated, so a slide with only a
 * transition gets no timing tree at all rather than an empty one.
 */
export function timingXml(targets: MotionTarget[], spids: Map<string, number>): string {
  const animated = targets.filter((target) => getPreset(target.animation?.preset))
  if (animated.length === 0) return ''

  // Scheduled over EVERY animated element, including any whose shape did not
  // make it into the file, and filtered afterwards. The start modes are
  // relative — `with` means "as the one before it" — so dropping an element
  // before the schedule is built silently re-times the ones that are left. A
  // page of bullets whose markers failed to rasterise came out with all three
  // arriving at once, instead of the cascade it has in the presenter.
  const schedule = buildSchedule(animated)
  const nextId = ids(3)
  const groups: string[] = []

  schedule.steps.forEach((items, step) => {
    if (items.length === 0) return
    // Step 0 runs on arrival; every later step is an advance of the deck.
    const startsOnClick = step > 0
    const effects = items
      .map((item, index) => {
        const target = item.widget as MotionTarget
        const spid = spids.get(target.objectName)
        if (spid === undefined) return ''
        // The first effect of a click group is what the click triggers; the rest
        // hang off it with their own offsets, which is how the editor's `with`
        // and `after` both come out right.
        const nodeType = startsOnClick && index === 0 ? 'clickEffect' : 'afterEffect'
        return entranceXml(target, spid, item.at, nodeType, nextId)
      })
      .join('')
    if (!effects) return

    const outerId = nextId()
    const innerId = nextId()
    groups.push(
      `<p:par><p:cTn id="${outerId}" fill="hold">` +
        `<p:stCondLst><p:cond delay="${startsOnClick ? 'indefinite' : '0'}"/></p:stCondLst>` +
        `<p:childTnLst><p:par><p:cTn id="${innerId}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst>` +
        `<p:childTnLst>${effects}</p:childTnLst>` +
        `</p:cTn></p:par></p:childTnLst>` +
        `</p:cTn></p:par>`,
    )
  })

  if (groups.length === 0) return ''

  return (
    `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
    `<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${groups}</p:childTnLst></p:cTn>` +
    `<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>` +
    `<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>` +
    `</p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`
  )
}

// --- shape ids -----------------------------------------------------------

const CNVPR = /<p:cNvPr id="(\d+)" name="([^"]*)"/g

/**
 * Renumbers every shape on the slide and reports where each one ended up.
 *
 * This is not tidying. pptxgenjs counts pictures, shapes and tables on separate
 * counters and writes the result into one slide, so a deck with a text box and
 * a table on the same page ships two shapes both claiming `id="2"`. That is
 * invalid OOXML on its own — PowerPoint offers to repair such a file — and it
 * makes `<p:spTgt spid="2">` ambiguous, which is exactly what an entrance is.
 *
 * So ids are reassigned in document order before anything points at one. The
 * first `<p:cNvPr>` in a slide belongs to the shape tree itself and keeps id 1;
 * real shapes start at 2.
 */
export function renumberShapes(xml: string): { xml: string; spids: Map<string, number> } {
  const spids = new Map<string, number>()
  let seen = 0
  let next = 2

  const out = xml.replace(CNVPR, (match, _id: string, name: string) => {
    seen += 1
    // The shape tree's own non-visual properties, not a shape.
    if (seen === 1) return '<p:cNvPr id="1" name=""'
    const id = next++
    if (name.startsWith(MOTION_NAME_PREFIX)) spids.set(name, id)
    return `<p:cNvPr id="${id}" name="${name}"`
  })

  return { xml: out, spids }
}

/**
 * Puts a slide's motion into its XML.
 *
 * Order matters: `CT_Slide` wants `cSld`, `clrMapOvr`, `transition`, `timing`,
 * so both go in immediately before `</p:sld>`, which is where pptxgenjs leaves
 * off. A slide with neither comes back untouched — including its original shape
 * ids, so a deck with no motion is byte-for-byte what it was before.
 */
export function applySlideMotion(xml: string, motion: SlideMotion): string {
  const transition = motion.transition ? transitionXml(motion.transition) : ''
  const animated = motion.builds.some((target) => getPreset(target.animation?.preset))
  if (!transition && !animated) return xml

  const { xml: renumbered, spids } = animated ? renumberShapes(xml) : { xml, spids: new Map<string, number>() }
  const timing = animated ? timingXml(motion.builds, spids) : ''
  const extra = `${transition}${timing}`
  if (!extra) return xml

  return renumbered.replace('</p:sld>', `${extra}</p:sld>`)
}

/**
 * Reopens a finished .pptx and writes the motion for every slide into it.
 *
 * JSZip is imported here rather than at the top of the file so a deck with no
 * motion in it never pays for the library. pptxgenjs already carries a copy for
 * its own writing but does not re-export it, so this is the same code twice in
 * the bundle — which is why it is worth keeping behind a dynamic import and out
 * of the main chunk.
 *
 * Anything that goes wrong here gives back the original deck. A file that opens
 * without its transitions beats no file at all, and the caller has no better
 * answer to offer than the deck it already had.
 */
export async function applyPptxMotion(blob: Blob, motion: SlideMotion[]): Promise<Blob> {
  const wanted = motion.some((slide) => slide.transition || slide.builds.some((target) => getPreset(target.animation?.preset)))
  if (!wanted) return blob

  try {
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())

    for (let i = 0; i < motion.length; i++) {
      const path = `ppt/slides/slide${i + 1}.xml`
      const file = zip.file(path)
      if (!file) continue
      const xml = await file.async('string')
      zip.file(path, applySlideMotion(xml, motion[i]))
    }

    const out = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: blob.type })
    return out.type === blob.type ? out : new Blob([out], { type: blob.type })
  } catch (e) {
    console.warn('[pptx] the deck was written without its animations', e)
    return blob
  }
}
