/**
 * Gives a composed deck its motion, or takes it away again.
 *
 * JSON in, JSON out, like everything else in this entry — the planner runs it
 * in a request handler when somebody asks the AI for a deck with animation on,
 * and the editor runs it in the browser when somebody turns it on afterwards.
 * Both get the same deck.
 *
 * WHAT "SUBTLE" MEANS HERE, and why it is one recipe rather than a set of
 * knobs. The ask this was built for was "really subtle, but might add some
 * extra flavor", and the failure mode of deck animation is not too little of
 * it — it is a title that flies in over a slide that is still zooming. So:
 *
 *   - the page gives way with a fade, which is the one transition that reads as
 *     considered rather than as a transition;
 *   - the heading, the eyebrow, the standfirst and the footer are simply THERE
 *     when the slide arrives. They are what the room reads first, and holding
 *     them back to animate them is the thing that makes a deck feel slow;
 *   - only the points build, one after the next, and on their own — nobody has
 *     to click through them, and a presenter who talks fast is never waiting on
 *     the deck.
 *
 * The whole effect is that a slide lands and its points settle in behind it.
 *
 * Compose already gives every bullet its own text box, so this needs no
 * per-paragraph animation: the classic "points arrive one at a time" falls out
 * of animating widgets, which is the only thing the editor and the presenter
 * both understand. A bullet's marker is a separate shape drawn just before it,
 * so it is animated WITH its bullet — otherwise a page of dots sits there
 * waiting for its words.
 */
import { kindOf } from './describe'
import type { DesignDocument, TdLayout } from './types'

/** Milliseconds. Long enough to read as deliberate, short enough not to be waited on. */
const TRANSITION_MS = 400
const ENTRANCE_MS = 420

/** The one entrance used, chosen because it survives export as a real wipe. */
const ENTRANCE_PRESET = 'rise'

/**
 * Which roles build. Everything else on the page is there from the start.
 *
 * Roles are compose's own (`deck.ts`), so this list is exhaustive by
 * construction rather than by hope: a role that is not here is one that does
 * not move.
 */
const BUILDS: ReadonlySet<string> = new Set(['bullet', 'sub-bullet'])

type Layer = TdLayout['layers'][number]

function roleOf(layer: Layer): string {
  return String((layer as Record<string, unknown>).role ?? '')
}

/**
 * A bullet's marker, which compose draws as the shape immediately BEFORE it.
 *
 * Pairing on layer order rather than on geometry because layer order is what
 * compose controls and what the presenter reads; two shapes that happen to line
 * up are a coincidence, the one written just before is a decision.
 */
function isMarker(layers: Layer[], index: number): boolean {
  const layer = layers[index]
  const next = layers[index + 1]
  if (!layer || !next) return false
  return String(layer.type) === 'w-svg' && BUILDS.has(roleOf(next))
}

/**
 * The running order is the layer order — `buildSchedule` reads it the same way
 * in the presenter, and the exporter reads it the same way again.
 *
 * The start modes are relative to the PREVIOUS animated layer, which is what
 * decides the pairing: the marker comes first and so is the one that waits
 * (`after`), and its bullet joins it (`with`). Written the other way round the
 * marker would arrive with the bullet *above* it, one step early, and the page
 * would tick down a line ahead of itself.
 */
function animateLayers(layers: Layer[]): Layer[] {
  return layers.map((layer, index) => {
    const next = { ...layer } as Layer & { animation?: unknown }
    const marker = isMarker(layers, index)
    const builds = BUILDS.has(roleOf(layer))
    if (!builds && !marker) {
      // Anything that does not build must not keep an entrance from an earlier
      // pass, or turning motion on twice leaves a heading animating.
      delete next.animation
      return next
    }
    // A bullet whose marker was animated just before it comes in alongside it.
    // A bullet with no marker of its own waits its turn like everything else.
    const withMarker = builds && isMarker(layers, index - 1)
    next.animation = {
      preset: ENTRANCE_PRESET,
      duration: ENTRANCE_MS,
      delay: 0,
      start: withMarker ? 'with' : 'after',
    }
    return next
  })
}

function clearLayers(layers: Layer[]): Layer[] {
  return layers.map((layer) => {
    const next = { ...layer } as Layer & { animation?: unknown }
    delete next.animation
    return next
  })
}

/**
 * Turns motion on or off across a whole deck.
 *
 * A poster is returned untouched: it is one page, nobody presents it, and a
 * transition on a sign that gets printed is meaningless.
 *
 * Turning it off is a real erase rather than a no-op, so the toggle works both
 * ways — including over a deck somebody has since edited by hand. That is the
 * intended behaviour and worth knowing: this is a deck-wide setting, not a
 * merge, so switching it off clears entrances the person set themselves.
 */
export function applyMotion(doc: DesignDocument, on: boolean): DesignDocument {
  const layouts = Array.isArray(doc?.layouts) ? doc.layouts : []
  if (layouts.length === 0) return doc
  if (kindOf(doc) !== 'slides') return doc

  return {
    ...doc,
    layouts: layouts.map((layout) => ({
      ...layout,
      global: on ? { ...layout.global, transition: { type: 'fade', duration: TRANSITION_MS } } : withoutTransition(layout.global),
      layers: on ? animateLayers(layout.layers || []) : clearLayers(layout.layers || []),
    })),
  }
}

function withoutTransition(global: TdLayout['global']): TdLayout['global'] {
  const next = { ...global } as Record<string, unknown>
  delete next.transition
  return next as TdLayout['global']
}

/** Whether a deck already has motion on it — what a toggle reads to know its state. */
export function hasMotion(doc: DesignDocument): boolean {
  const layouts = Array.isArray(doc?.layouts) ? doc.layouts : []
  return layouts.some((layout) => {
    const transition = (layout.global as Record<string, unknown> | undefined)?.transition as { type?: string } | undefined
    if (transition && transition.type && transition.type !== 'none') return true
    return (layout.layers || []).some((layer) => Boolean((layer as Record<string, unknown>).animation))
  })
}
