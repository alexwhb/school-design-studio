import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { PENDING_CLASS, buildSchedule, cancelAll, playWidgetAnimation } from '@/common/animations/play'
import { pageBackgroundStyle } from '@/common/methods/pageBackground'
import { staticWidgetComponents } from '@/components/modules/widgets/registry'
import { cx } from '@/utils/dom'
import type { TdLayout, TdWidgetData, TPageState } from '@/store/types'
import './slideView.less'

export type SlideViewHandle = {
  stepCount: number
  showUpTo: (target: number, animate: boolean) => void
}

type Props = {
  page: TdLayout
  /** The box the slide has to fit inside, in CSS pixels. */
  maxWidth: number
  maxHeight: number
  /** Play the elements' entrances. Off for thumbnails, which want a built slide. */
  animated?: boolean
}

/**
 * One page of a design, drawn at whatever size it is given.
 *
 * The page is laid out at its true pixel size and then scaled as a whole, so a
 * slide is the design exactly as it was drawn — the same trick the canvas and
 * the page thumbnails use. Everything here is read-only: the widgets are the
 * `-static` variants, which have none of the selection, drag or measurement
 * hooks the editing components carry.
 *
 * With `animated` set, elements that have been given an entrance are held back
 * until their turn and then played, one build step per advance of the presenter.
 * The animation goes on the widget's own element rather than a wrapper around
 * it: every static component has a single root, so a class and a data attribute
 * fall through to it, and transforms are composited additively (see
 * `animations/play.ts`) so an element the renderer has already rotated keeps its
 * rotation. The overview grid leaves `animated` off and gets built slides.
 */
const SlideView = forwardRef<SlideViewHandle, Props>(function SlideView({ page, maxWidth, maxHeight, animated = false }, ref) {
  const slideRef = useRef<HTMLDivElement | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())
  const timers = useRef<number[]>([])
  const running = useRef<Animation[]>([])

  const global = page.global as TPageState
  const layers = page.layers || []

  /** Scale to fit, never past 1:1 in either direction — letterboxed, not cropped. */
  const scale = useMemo(() => {
    const { width, height } = global
    if (!width || !height || !maxWidth || !maxHeight) return 0
    return Math.min(maxWidth / width, maxHeight / height)
  }, [global.width, global.height, maxWidth, maxHeight])

  const schedule = useMemo(() => (animated ? buildSchedule(layers as TdWidgetData[]) : null), [animated, layers])
  /** How many advances this slide is worth. Always at least one, for the slide itself. */
  const stepCount = Math.max(1, schedule?.steps.length ?? 1)
  const scheduled = useMemo(() => new Set((schedule?.steps.flat() ?? []).map((item) => item.widget.uuid)), [schedule])

  const stop = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    cancelAll(running.current)
    running.current = []
  }, [])

  useEffect(() => stop, [stop])

  /**
   * Puts the slide into the state it should be in at `target`, playing that
   * step's entrances when asked to. Stepping backwards, and arriving from a
   * later slide, pass `animate` off: a build the room has already watched
   * should not replay.
   */
  const showUpTo = useCallback(
    (target: number, animate: boolean) => {
      if (!animated) return
      stop()

      const shown = new Set<string>()
      for (let i = 0; i <= target; i++) {
        for (const item of schedule?.steps[i] || []) {
          if (!(animate && i === target)) shown.add(item.widget.uuid)
        }
      }
      setRevealed(shown)
      if (!animate) return

      for (const item of schedule?.steps[target] || []) {
        const uuid = item.widget.uuid
        timers.current.push(
          window.setTimeout(() => {
            const el = slideRef.current?.querySelector<HTMLElement>(`[data-anim="${uuid}"]`)
            if (!el) return
            // Drop the holding class on the element itself rather than waiting
            // for a re-render, so the first frame of the animation is the first
            // frame seen.
            el.classList.remove(PENDING_CLASS)
            shown.add(uuid)
            running.current.push(...playWidgetAnimation(el, item.widget.animation))
          }, item.at),
        )
      }
    },
    [animated, schedule, stop],
  )

  useImperativeHandle(ref, () => ({ stepCount, showUpTo }), [stepCount, showUpTo])

  const pending = (uuid: string) => animated && scheduled.has(uuid) && !revealed.has(uuid)

  const rootLayers = layers.filter((layer) => layer.parent === global.uuid && !layer.hidden)
  const childrenOf = (uuid: string) => layers.filter((layer) => layer.parent === uuid && !layer.hidden)

  return (
    <div ref={slideRef} className="slide" style={{ width: global.width * scale + 'px', height: global.height * scale + 'px' }}>
      <div
        className="slide__page"
        style={{
          width: global.width + 'px',
          height: global.height + 'px',
          transform: `scale(${scale})`,
          opacity: global.opacity,
          ...pageBackgroundStyle(global),
        }}
      >
        {rootLayers.map((layer) => {
          const Comp = staticWidgetComponents[layer.type]
          if (!Comp) return null
          return (
            <Comp key={layer.uuid} params={layer} parent={global} data-anim={animated ? layer.uuid : undefined} className={pending(layer.uuid) ? PENDING_CLASS : undefined}>
              {layer.isContainer
                ? childrenOf(layer.uuid).map((child) => {
                    const ChildComp = staticWidgetComponents[child.type]
                    if (!ChildComp) return null
                    return <ChildComp key={child.uuid} params={child} parent={layer} data-anim={animated ? child.uuid : undefined} className={pending(child.uuid) ? PENDING_CLASS : undefined} />
                  })
                : null}
            </Comp>
          )
        })}
      </div>
    </div>
  )
})

export default memo(SlideView)
