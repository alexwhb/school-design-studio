/**
 * Plays presets on real elements, and works out what runs when.
 *
 * Everything here goes through the Web Animations API rather than CSS classes,
 * for two reasons that matter to this editor:
 *
 *  - A WAAPI animation never writes to the element's inline style, so a clone of
 *    the canvas is always at rest. That is what the PNG and .pptx exporters take
 *    (`export/renderPage.ts` clones the node before rasterising it), so a
 *    preview that happens to be mid-flight cannot leak a half-faded element into
 *    an exported file.
 *  - Transforms can be composited *onto* the element rather than replacing it,
 *    which is the only way an already-rotated widget can be animated without
 *    losing its rotation.
 *
 * That second point is why a preset is played as two animations rather than one:
 * WAAPI sets `composite` per keyframe effect, not per property, and the two
 * halves need opposite behaviour. Transforms add; opacity, filter and clip-path
 * replace — an additive opacity of 0 → 1 would resolve to 1 → 2 and never fade.
 */
import type { AnimationPreset, AnimationStop, TWidgetAnimation } from './presets'
import { getPreset } from './presets'

/** Set on an element that is waiting for its build step, to hold it off screen. */
export const PENDING_CLASS = 'ds-anim-pending'

/**
 * Gives every stop an explicit offset, so a track can drop the stops it does not
 * care about without the remaining ones silently re-spacing themselves.
 * Unspecified stops are spread evenly between their nearest fixed neighbours,
 * which is what CSS does with a keyframe list.
 */
type FixedStop = AnimationStop & { offset: number }

function resolveOffsets(stops: AnimationStop[]): FixedStop[] {
  const out = stops.map((stop) => ({ ...stop })) as FixedStop[]
  if (out.length === 0) return out
  if (out[0].offset === undefined) out[0].offset = 0
  if (out[out.length - 1].offset === undefined) out[out.length - 1].offset = 1

  let anchor = 0
  for (let i = 1; i < out.length; i++) {
    if (out[i].offset === undefined) continue
    const span = i - anchor
    const from = out[anchor].offset
    const step = (out[i].offset - from) / span
    for (let j = anchor + 1; j < i; j++) out[j].offset = from + step * (j - anchor)
    anchor = i
  }
  return out
}

const STYLE_KEYS = ['opacity', 'filter', 'clipPath'] as const

/** Splits the preset into the additive transform track and the replacing style track. */
function tracks(preset: AnimationPreset): { transform: Keyframe[]; style: Keyframe[] } {
  const stops = resolveOffsets(preset.stops)

  const transform: Keyframe[] = stops
    .filter((stop) => stop.transform !== undefined)
    .map((stop) => ({ offset: stop.offset, transform: stop.transform as string }))

  const style: Keyframe[] = stops
    .filter((stop) => STYLE_KEYS.some((key) => stop[key] !== undefined))
    .map((stop) => {
      const frame: Keyframe = { offset: stop.offset }
      for (const key of STYLE_KEYS) {
        if (stop[key] !== undefined) (frame as any)[key] = stop[key]
      }
      return frame
    })

  return { transform, style }
}

export type PlayOptions = {
  /** Overrides the preset's own duration, in milliseconds. */
  duration?: number
  delay?: number
  iterations?: number
  onFinish?: () => void
}

/**
 * Runs a preset on an element and hands back the animations, so the caller can
 * cancel them if the user navigates away mid-flight.
 *
 * `fill: 'backwards'` holds the opening frame through the delay, which is what
 * keeps a staggered build from flashing every element on screen before its turn.
 * Nothing fills forwards: at the end the element simply reverts to its own CSS,
 * which is already the state the animation was heading for.
 */
export function playPreset(el: HTMLElement, preset: AnimationPreset, options: PlayOptions = {}): Animation[] {
  const timing: KeyframeAnimationOptions = {
    duration: options.duration ?? preset.duration,
    delay: options.delay ?? 0,
    easing: preset.easing,
    iterations: options.iterations ?? 1,
    fill: 'backwards',
  }

  const { transform, style } = tracks(preset)
  const running: Animation[] = []

  if (transform.length > 1) running.push(el.animate(transform, { ...timing, composite: 'add' }))
  if (style.length > 1) running.push(el.animate(style, { ...timing, composite: 'replace' }))

  if (options.onFinish && running.length) {
    // The longest-running of the two decides when the element has arrived.
    Promise.all(running.map((animation) => animation.finished.catch(() => undefined))).then(() => options.onFinish?.())
  } else if (options.onFinish) {
    options.onFinish()
  }

  return running
}

/** Plays whatever a widget is configured with, if anything. */
export function playWidgetAnimation(el: HTMLElement, animation?: TWidgetAnimation | null, extraDelay = 0): Animation[] {
  const preset = getPreset(animation?.preset)
  if (!preset || !animation) return []
  return playPreset(el, preset, {
    duration: animation.duration,
    delay: animation.delay + extraDelay,
  })
}

export function cancelAll(animations: Animation[]): void {
  for (const animation of animations) {
    try {
      animation.cancel()
    } catch {
      // An animation already torn down with its element; nothing to undo.
    }
  }
}

// ---- scheduling ---------------------------------------------------------

/** The least a scheduler needs to know about a widget. */
export type AnimatableWidget = {
  uuid: string
  animation?: TWidgetAnimation
}

export type ScheduledItem<T extends AnimatableWidget> = {
  widget: T
  /** Which advance of the presenter reveals this element. 0 shows on arrival. */
  step: number
  /** Milliseconds after that step begins. */
  at: number
}

export type Schedule<T extends AnimatableWidget> = {
  /** Items grouped by step, so `steps[0]` runs the moment the slide opens. */
  steps: ScheduledItem<T>[][]
  /** Widgets with no animation, which are simply on screen from the start. */
  immediate: T[]
}

/**
 * Turns a page's layer list into a running order.
 *
 * Order follows the layer stack, which is also the order the elements were added
 * — the same thing the layer panel shows, so "the next one down the list goes
 * next" is a rule the user can see rather than guess.
 */
export function buildSchedule<T extends AnimatableWidget>(widgets: T[]): Schedule<T> {
  const steps: ScheduledItem<T>[][] = [[]]
  const immediate: T[] = []

  let step = 0
  let previousStart = 0
  let stepEnd = 0
  let first = true

  for (const widget of widgets) {
    const animation = widget.animation
    if (!animation || !getPreset(animation.preset)) {
      immediate.push(widget)
      continue
    }

    const span = Math.max(0, animation.delay) + Math.max(0, animation.duration)
    let at: number

    if (first) {
      at = 0
      first = false
    } else if (animation.start === 'click') {
      step += 1
      steps[step] = []
      at = 0
      stepEnd = 0
    } else if (animation.start === 'with') {
      at = previousStart
    } else {
      at = stepEnd
    }

    previousStart = at
    stepEnd = Math.max(stepEnd, at + span)
    steps[step].push({ widget, step, at })
  }

  return { steps, immediate }
}
