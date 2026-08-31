import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import Popover from '@/components/ui/Popover'
import NumberSlider from '../NumberSlider'
import ValueSelect from '../ValueSelect'
import PresetTile, { type PresetTileHandle } from './PresetTile'
import { updateWidgetData } from '@/store/widget/widget'
import { cancelAll, playWidgetAnimation } from '@/common/animations/play'
import {
  ANIMATION_GROUPS,
  defaultAnimationFor,
  getPreset,
  presetsInGroup,
  type TWidgetAnimation,
} from '@/common/animations/presets'
import { cx } from '@/utils/dom'
import type { TdWidgetData } from '@/store/types'
import './animateWrap.less'

type Props = {
  /** The store's own object, so writes go through the store and reads stay live. */
  widget: TdWidgetData
}

/**
 * The running order, in the panel's own vocabulary. A dropdown rather than three
 * stacked buttons: it is one choice out of three, which is what every other
 * choice in this panel looks like, and the reading of it goes on the line below.
 */
const STARTS: { value: TWidgetAnimation['start']; label: string; hint: string }[] = [
  { value: 'after', label: 'After the one before', hint: 'Waits its turn, giving a cascade' },
  { value: 'with', label: 'At the same time', hint: 'Moves in with the element before it' },
  { value: 'click', label: 'On click', hint: 'Holds until you advance the slide' },
]
const START_LABELS = STARTS.map((option) => option.label)

/**
 * Animation is one section of the settings panel, not a card sitting on top of
 * it: the same left edge, the same uppercase heading and the same
 * label-above-control rhythm as Size and position or Text effects.
 */
export default function AnimateWrap({ widget }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const snap = useSnapshot(widget) as TdWidgetData
  const animation = snap.animation
  const current = getPreset(animation?.preset)

  const startOption = STARTS.find((option) => option.value === animation?.start) || STARTS[0]

  // The sliders work in seconds because that is how anyone talks about the pace
  // of a slide; the stored value stays in milliseconds, which is what plays it.
  const speed = animation ? Math.round(animation.duration) / 1000 : 0.5
  const wait = animation ? Math.round(animation.delay) / 1000 : 0

  const tiles = useRef(new Map<string, PresetTileHandle | null>())
  const introTimers = useRef<number[]>([])
  const preview = useRef<Animation[]>([])

  const clearIntro = useCallback(() => {
    introTimers.current.forEach((timer) => window.clearTimeout(timer))
    introTimers.current = []
  }, [])

  /**
   * Plays the animation on the element itself, in place on the canvas.
   *
   * The element is found by `data-uuid`, which both top-level layers and the
   * children inside a group carry, and the lookup is scoped to the canvas so it
   * cannot match the page node or a thumbnail in the page strip.
   */
  const previewOnCanvas = useCallback(() => {
    cancelAll(preview.current)
    const uuid = widget?.uuid
    if (!uuid) return
    const el = document.querySelector<HTMLElement>(`#page-design-canvas [data-uuid="${uuid}"]`)
    if (!el) return
    preview.current = playWidgetAnimation(el, widget.animation)
  }, [widget])

  useEffect(
    () => () => {
      clearIntro()
      cancelAll(preview.current)
    },
    [clearIntro],
  )

  /**
   * Runs every tile once, a beat apart, when the picker opens. Fifteen tiles all
   * moving at once is noise; the same fifteen arriving in a wave is a contents
   * page for the whole set, and it costs the user nothing to watch.
   */
  const introduceTiles = useCallback(() => {
    clearIntro()
    let index = 0
    for (const group of ANIMATION_GROUPS) {
      for (const preset of presetsInGroup(group)) {
        const id = preset.id
        introTimers.current.push(window.setTimeout(() => tiles.current.get(id)?.play(), 70 * index))
        index += 1
      }
    }
  }, [clearIntro])

  function write(value: TWidgetAnimation | null) {
    updateWidgetData({ uuid: widget?.uuid || '', key: 'animation', value })
  }

  function choose(id: string | null) {
    setPickerOpen(false)
    clearIntro()
    if (!id) {
      write(null)
      return
    }
    const preset = getPreset(id)
    if (!preset) return
    // Keep the pace and running order the user already set; only swap the movement.
    write(animation ? { ...animation, preset: preset.id } : defaultAnimationFor(preset))
    requestAnimationFrame(previewOnCanvas)
  }

  function commitSpeed(value: number) {
    if (!widget.animation) return
    write({ ...widget.animation, duration: Math.round(Number(value) * 1000) })
    requestAnimationFrame(previewOnCanvas)
  }

  function commitWait(value: number) {
    if (!widget.animation) return
    write({ ...widget.animation, delay: Math.round(Number(value) * 1000) })
  }

  function commitStart(label: Record<string, any> | string | number) {
    if (!widget.animation) return
    const option = STARTS.find((item) => item.label === label)
    if (option) write({ ...widget.animation, start: option.value })
  }

  const picker = useMemo(
    () => (
      <div className="picker">
        <p className="picker__intro">Hover a style to watch it play.</p>
        <button type="button" className={cx('picker__none', { 'picker__none--on': !current })} onClick={() => choose(null)}>
          No animation
        </button>
        {ANIMATION_GROUPS.map((group) => (
          <div key={group}>
            <p className="picker__group">{group}</p>
            <div className="picker__grid">
              {presetsInGroup(group).map((preset) => (
                <PresetTile
                  key={preset.id}
                  ref={(handle) => {
                    if (handle) tiles.current.set(preset.id, handle)
                    else tiles.current.delete(preset.id)
                  }}
                  preset={preset}
                  selected={preset.id === current?.id}
                  onChoose={choose}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
    [current?.id, animation],
  )

  return (
    <div className="animate">
      <div className="animate__head">
        <span className="animate__title">Animation</span>
        <div className="animate__head-right">
          <span className="animate__current">{current ? current.name : 'None'}</span>
          <Popover
            content={picker}
            placement="left-start"
            width={332}
            popperClass="animate-popper"
            open={pickerOpen}
            onOpenChange={(next) => {
              setPickerOpen(next)
              if (next) requestAnimationFrame(introduceTiles)
              else clearIntro()
            }}
          >
            <Button className="animate__choose" link>
              {pickerOpen ? 'Cancel' : 'Choose'}
            </Button>
          </Popover>
        </div>
      </div>

      {current ? (
        <div className="animate__body">
          <p className="animate__hint">{current.hint}</p>

          <div className="animate__sliders">
            <NumberSlider value={speed} label="Speed" step={0.05} minValue={0.15} maxValue={3} onFinish={commitSpeed} />
            <NumberSlider value={wait} label="Delay" step={0.05} minValue={0} maxValue={5} onFinish={commitWait} />
          </div>

          <ValueSelect value={startOption.label} label="Starts" data={START_LABELS} readonly inputWidth="100%" onFinish={commitStart} />
          <p className="animate__note">{startOption.hint}</p>

          <div className="animate__actions">
            <Button className="animate__action" link onClick={previewOnCanvas}>
              Play on canvas
            </Button>
            <Button className="animate__action" link onClick={() => choose(null)}>
              Remove
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
