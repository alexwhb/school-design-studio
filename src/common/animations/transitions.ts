/**
 * How one slide gives way to the next in the presenter.
 *
 * A transition belongs to the page being arrived at, which is how PowerPoint
 * and Keynote both read it: "this slide fades in" is a fact about this slide.
 * Going backwards plays the same transition mirrored, so a slide that pushed in
 * from the right pushes back out to the right.
 *
 * Played through the Web Animations API for the same reasons the entrances are
 * (see play.ts): nothing is written to an element's inline style, and a
 * transition still running when the next key is pressed can be cancelled
 * cleanly, which is what stops a quick run of arrow presses from stacking up
 * half-finished fades. Nothing fills forwards: when an animation ends the
 * slot simply reverts to its own CSS, which is already where it was heading.
 *
 * PowerPoint export cannot carry any of this — pptxgenjs has no slide
 * transition API — so a transition lives in the presenter only.
 */
import type { TPageState } from '@/store/types'

export type TTransitionType = 'none' | 'fade' | 'slide' | 'push' | 'zoom' | 'wipe'

export type TPageTransition = {
  type: TTransitionType
  /** Milliseconds. */
  duration: number
}

export type TTransitionSpec = {
  id: TTransitionType
  name: string
  /** One line describing the movement, in plain words. */
  hint: string
}

export const TRANSITIONS: TTransitionSpec[] = [
  { id: 'none', name: 'None', hint: 'The next slide simply appears' },
  { id: 'fade', name: 'Fade', hint: 'One slide dissolves into the next' },
  { id: 'slide', name: 'Slide', hint: 'The next slide glides in over this one' },
  { id: 'push', name: 'Push', hint: 'The next slide pushes this one off the screen' },
  { id: 'zoom', name: 'Zoom', hint: 'The next slide grows into place' },
  { id: 'wipe', name: 'Wipe', hint: 'The next slide is revealed from one edge' },
]

export const DEFAULT_TRANSITION_DURATION = 500
export const MIN_TRANSITION_DURATION = 150
export const MAX_TRANSITION_DURATION = 2500

/** Set on every animation this file starts, so a test or a debugger can tell them from the entrances. */
export const TRANSITION_ANIMATION_ID = 'page-transition'

export function getTransitionSpec(type: unknown): TTransitionSpec | undefined {
  return TRANSITIONS.find((spec) => spec.id === type)
}

/**
 * The transition a page carries, or null when it has none. Absent, 'none' and
 * anything unrecognised all read as none, so a design saved before this
 * existed, or edited by hand, still presents.
 */
export function readTransition(page: Partial<TPageState> | null | undefined): TPageTransition | null {
  const held = page?.transition as Partial<TPageTransition> | undefined
  const spec = getTransitionSpec(held?.type)
  if (!spec || spec.id === 'none') return null
  const duration = Number(held?.duration)
  return {
    type: spec.id,
    duration: Number.isFinite(duration) && duration > 0 ? Math.min(Math.max(duration, MIN_TRANSITION_DURATION), MAX_TRANSITION_DURATION) : DEFAULT_TRANSITION_DURATION,
  }
}

/** Whether the person watching has asked their system for less movement. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const GLIDE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'

type TTracks = { in: Keyframe[]; out: Keyframe[]; easing: string }

/**
 * What the arriving slot and the departing slot each do. `forwards` mirrors
 * the horizontal ones; a fade and a zoom look the same in either direction.
 *
 * The departing slot's CSS puts it at opacity 0 the moment it stops being
 * current, so a transition that wants it to stay visible underneath — a slide
 * gliding in over it, a wipe revealing across it — has to say so with an
 * explicit `[1, 1]` opacity track.
 */
export function transitionTracks(type: TTransitionType, forwards: boolean): TTracks {
  const from = forwards ? '100%' : '-100%'
  const to = forwards ? '-100%' : '100%'
  switch (type) {
    case 'fade':
      return { in: [{ opacity: 0 }, { opacity: 1 }], out: [{ opacity: 1 }, { opacity: 0 }], easing: EASE_IN_OUT }
    case 'slide':
      return {
        in: [{ transform: `translateX(${from})`, opacity: 1 }, { transform: 'translateX(0)', opacity: 1 }],
        out: [{ opacity: 1 }, { opacity: 1 }],
        easing: GLIDE,
      }
    case 'push':
      return {
        in: [{ transform: `translateX(${from})`, opacity: 1 }, { transform: 'translateX(0)', opacity: 1 }],
        out: [{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${to})`, opacity: 1 }],
        easing: EASE_IN_OUT,
      }
    case 'zoom':
      return {
        in: [{ transform: 'scale(0.86)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        out: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.06)', opacity: 0 }],
        easing: GLIDE,
      }
    case 'wipe':
      return {
        in: [
          { clipPath: forwards ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', opacity: 1 },
          { clipPath: 'inset(0 0 0 0)', opacity: 1 },
        ],
        out: [{ opacity: 1 }, { opacity: 1 }],
        easing: EASE_IN_OUT,
      }
    default:
      return { in: [], out: [], easing: EASE_IN_OUT }
  }
}

/**
 * Plays a transition between two slots and hands back the animations, so the
 * caller can cancel them if the talk moves on before they finish. Cancelling
 * drops both elements straight to their resting CSS, which is the state the
 * transition was heading for anyway — so a run of quick presses ends on the
 * right slide with nothing left over.
 *
 * `out` may be missing: opening the presenter has nothing to leave from.
 */
export function playTransition(inEl: HTMLElement, outEl: HTMLElement | null, transition: TPageTransition, forwards: boolean): Animation[] {
  const tracks = transitionTracks(transition.type, forwards)
  if (tracks.in.length === 0) return []
  const timing: KeyframeAnimationOptions = { duration: transition.duration, easing: tracks.easing, fill: 'none' }
  const running: Animation[] = []

  const arriving = inEl.animate(tracks.in, timing)
  arriving.id = TRANSITION_ANIMATION_ID
  running.push(arriving)

  if (outEl && tracks.out.length > 1) {
    const departing = outEl.animate(tracks.out, timing)
    departing.id = TRANSITION_ANIMATION_ID
    running.push(departing)
  }
  return running
}

/**
 * Previews a transition on any element — the canvas, in the page settings
 * panel — by playing only the arriving half of it onto the element itself.
 * The transform is composited onto whatever the element already carries, so
 * the canvas keeps its zoom while it glides in.
 */
export function previewTransition(el: HTMLElement, transition: TPageTransition): Animation[] {
  const tracks = transitionTracks(transition.type, true)
  if (tracks.in.length === 0) return []
  const timing: KeyframeAnimationOptions = { duration: transition.duration, easing: tracks.easing, fill: 'none' }
  const transform = tracks.in.filter((frame) => frame.transform !== undefined).map((frame) => ({ offset: frame.offset, transform: frame.transform }))
  const style = tracks.in.map((frame) => {
    const { transform: _drop, ...rest } = frame
    return rest
  })
  const running: Animation[] = []
  if (transform.length > 1) {
    const a = el.animate(transform as Keyframe[], { ...timing, composite: 'add' })
    a.id = TRANSITION_ANIMATION_ID
    running.push(a)
  }
  if (style.some((frame) => Object.keys(frame).some((key) => key !== 'offset'))) {
    const a = el.animate(style as Keyframe[], { ...timing, composite: 'replace' })
    a.id = TRANSITION_ANIMATION_ID
    running.push(a)
  }
  return running
}
