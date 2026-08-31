/**
 * The animation presets an element can be given.
 *
 * A preset is stored as a list of stops rather than a CSS `@keyframes` block,
 * because every place that plays one — the picker tiles, the canvas preview and
 * the presenter — drives it through the Web Animations API. Keeping one
 * declarative source and no injected `<style>` tags means a preset cannot drift
 * between where it is previewed and where it is played, and it keeps generated
 * keyframe names out of the document entirely.
 *
 * Each stop is split at play time into two tracks (see `play.ts`): `transform`
 * is composited *onto* whatever transform the element already carries, so a
 * rotated element still animates correctly, while the remaining properties
 * replace theirs for the duration.
 */

export type AnimationStop = {
  /** 0-1 position in the animation. Omitted stops are spaced evenly. */
  offset?: number
  transform?: string
  opacity?: number
  filter?: string
  clipPath?: string
}

export type AnimationGroup = 'Fade' | 'Move' | 'Scale' | 'Reveal' | 'Flourish'

export type AnimationPreset = {
  id: string
  /** Shown in the picker and on the settings card. */
  name: string
  /** One line describing the movement, in plain words. */
  hint: string
  group: AnimationGroup
  /** Milliseconds. The user can override this per element. */
  duration: number
  easing: string
  stops: AnimationStop[]
}

/** Overshoots slightly past the end value and settles back — reads as "springy". */
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
/** Fast out of the gate, long slow settle. The workhorse for entrances. */
const GLIDE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_OUT = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ---- Fade ---------------------------------------------------------------
  {
    id: 'fade',
    name: 'Fade',
    hint: 'Simply fades into view',
    group: 'Fade',
    duration: 500,
    easing: EASE_OUT,
    stops: [{ opacity: 0 }, { opacity: 1 }],
  },
  {
    id: 'soft-focus',
    name: 'Soft focus',
    hint: 'Blurred at first, then sharpens',
    group: 'Fade',
    duration: 750,
    easing: GLIDE,
    stops: [
      { opacity: 0, filter: 'blur(12px)', transform: 'scale(1.04)' },
      { opacity: 1, filter: 'blur(0px)', transform: 'none' },
    ],
  },

  // ---- Move ---------------------------------------------------------------
  {
    id: 'rise',
    name: 'Rise',
    hint: 'Lifts up from below as it fades in',
    group: 'Move',
    duration: 620,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'translateY(48px)' },
      { opacity: 1, transform: 'none' },
    ],
  },
  {
    id: 'drop',
    name: 'Drop',
    hint: 'Falls in from above and settles',
    group: 'Move',
    duration: 620,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'translateY(-48px)' },
      { opacity: 1, transform: 'none' },
    ],
  },
  {
    id: 'slide-left',
    name: 'In from left',
    hint: 'Slides in from off the left edge',
    group: 'Move',
    duration: 680,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'translateX(-80px)' },
      { opacity: 1, transform: 'none' },
    ],
  },
  {
    id: 'slide-right',
    name: 'In from right',
    hint: 'Slides in from off the right edge',
    group: 'Move',
    duration: 680,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'translateX(80px)' },
      { opacity: 1, transform: 'none' },
    ],
  },
  {
    id: 'drift',
    name: 'Drift',
    hint: 'A slow cinematic push, good behind a title',
    group: 'Move',
    duration: 1800,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    stops: [
      { opacity: 0, transform: 'translateY(18px) scale(1.08)' },
      { opacity: 1, offset: 0.35 },
      { opacity: 1, transform: 'none' },
    ],
  },

  // ---- Scale --------------------------------------------------------------
  {
    id: 'pop',
    name: 'Pop',
    hint: 'Springs up to size with a little overshoot',
    group: 'Scale',
    duration: 480,
    easing: SPRING,
    stops: [
      { opacity: 0, transform: 'scale(0.6)' },
      { opacity: 1, transform: 'none' },
    ],
  },
  {
    id: 'bounce',
    name: 'Bounce',
    hint: 'Lands, rebounds, then settles',
    group: 'Scale',
    duration: 900,
    easing: 'ease-out',
    stops: [
      { opacity: 0, transform: 'scale(0.3)', offset: 0 },
      { opacity: 1, transform: 'scale(1.12)', offset: 0.45 },
      { transform: 'scale(0.94)', offset: 0.7 },
      { transform: 'scale(1.02)', offset: 0.86 },
      { transform: 'none', offset: 1 },
    ],
  },
  {
    id: 'zoom-back',
    name: 'Zoom back',
    hint: 'Rushes in oversized and pulls back into place',
    group: 'Scale',
    duration: 720,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'scale(1.8)' },
      { opacity: 1, transform: 'none' },
    ],
  },

  // ---- Reveal -------------------------------------------------------------
  // These use clip-path in percentages, which resolves against the element's
  // own box, so a wipe covers exactly the element and nothing around it.
  {
    id: 'wipe-right',
    name: 'Wipe across',
    hint: 'Uncovers left to right, like a highlighter',
    group: 'Reveal',
    duration: 700,
    easing: EASE_OUT,
    stops: [
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)' },
    ],
  },
  {
    id: 'wipe-up',
    name: 'Wipe up',
    hint: 'Uncovers from the bottom edge upwards',
    group: 'Reveal',
    duration: 700,
    easing: EASE_OUT,
    stops: [
      { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0 0 0 0)' },
    ],
  },
  {
    id: 'unfold',
    name: 'Unfold',
    hint: 'Opens outwards from the middle',
    group: 'Reveal',
    duration: 760,
    easing: GLIDE,
    stops: [
      { clipPath: 'inset(0 50% 0 50%)', opacity: 0.2 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1 },
    ],
  },

  // ---- Flourish -----------------------------------------------------------
  {
    id: 'flip',
    name: 'Flip',
    hint: 'Tips forward on its own horizontal axis',
    group: 'Flourish',
    duration: 800,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'perspective(900px) rotateX(-80deg)' },
      { opacity: 1, transform: 'perspective(900px) rotateX(0deg)' },
    ],
  },
  {
    id: 'spin',
    name: 'Spin',
    hint: 'Whirls in from small, best kept for one thing',
    group: 'Flourish',
    duration: 820,
    easing: GLIDE,
    stops: [
      { opacity: 0, transform: 'rotate(-200deg) scale(0.2)' },
      { opacity: 1, transform: 'none' },
    ],
  },
]

/** The order groups appear in the picker. */
export const ANIMATION_GROUPS: AnimationGroup[] = ['Fade', 'Move', 'Scale', 'Reveal', 'Flourish']

const BY_ID = new Map(ANIMATION_PRESETS.map((preset) => [preset.id, preset]))

export function getPreset(id?: string | null): AnimationPreset | null {
  if (!id) return null
  return BY_ID.get(id) || null
}

export function presetsInGroup(group: AnimationGroup): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((preset) => preset.group === group)
}

/**
 * What is stored on a widget.
 *
 * `start` describes how this element's entrance relates to the one before it in
 * the layer order, which is the same vocabulary PowerPoint and Keynote use:
 *
 *  - `after` — waits for the previous element to finish, giving a cascade
 *  - `with`  — begins at the same moment as the previous element
 *  - `click` — holds until the presenter advances, making it a separate build
 */
export type TWidgetAnimation = {
  preset: string
  /** Milliseconds. Defaults to the preset's own duration when first chosen. */
  duration: number
  /** Milliseconds to wait before this element starts. */
  delay: number
  start: 'after' | 'with' | 'click'
}

export function defaultAnimationFor(preset: AnimationPreset): TWidgetAnimation {
  return { preset: preset.id, duration: preset.duration, delay: 0, start: 'after' }
}
