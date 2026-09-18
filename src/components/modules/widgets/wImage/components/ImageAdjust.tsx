/**
 * The Adjust section of the image panel: a few looks to start from, a slider
 * for each adjustment, and Reset.
 *
 * A slider is dragged, and the undo stack is built from document presses — but
 * the press that starts a drag lands *after* the slider has already moved the
 * value once, because a pointerdown on the runway jumps the thumb to where it
 * was clicked. The snapshot the press takes is therefore a frame into the drag,
 * and undo would leave the photo part-adjusted. So the drag brackets its own
 * entry on release; see `release` for how. A preset and Reset are a click and
 * are recorded as one change each.
 *
 * Folded by default. Seven sliders are a lot of panel for something most
 * photographs never need, and the heading says when they have been used.
 */
import { useRef, useState } from 'react'
import { beginHistory, endHistory, recordHistory } from '@/common/hooks/history'
import { IMAGE_FILTER_PRESETS, IMAGE_FILTER_SLIDERS, isUntouched, matchImageFilterPreset, packImageFilters, readImageFilters, type TImageFilterKey, type TImageFilters } from '@/common/methods/imageFilters'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import { updateWidgetData } from '@/store/widget'
import { cx } from '@/utils/dom'
import NumberSlider from '../../../settings/NumberSlider'
import './imageAdjust.less'

type Props = {
  uuid: string
  filters?: TImageFilters
}

export default function ImageAdjust({ uuid, filters }: Props) {
  const [open, setOpen] = useState(false)
  /** True between the first move of a slider and its release. */
  const dragging = useRef(false)
  /** The adjustments as they were when the drag in progress began. */
  const before = useRef<TImageFilters | null>(null)
  const values = readImageFilters(filters)
  const untouched = isUntouched(filters)
  const preset = matchImageFilterPreset(filters)

  function write(next: TImageFilters | null) {
    updateWidgetData({ uuid, key: 'filters', value: packImageFilters(next) })
  }

  function slide(key: TImageFilterKey, value: number) {
    if (!dragging.current) {
      dragging.current = true
      before.current = packImageFilters(filters)
    }
    write({ ...values, [key]: value })
  }

  /**
   * Rewind, mark, replay — one undo entry covering the whole drag.
   *
   * Putting the photo back to how it was when the drag started, taking the
   * snapshot there and then setting the final value gives an entry that spans
   * the gesture rather than whatever the press happened to catch. Both writes
   * are in the same tick, so nothing is drawn in between and the photo does not
   * flicker back.
   */
  function release(key: TImageFilterKey, value: number) {
    if (!dragging.current) return
    dragging.current = false
    const after = packImageFilters({ ...values, [key]: value })
    write(before.current)
    beginHistory()
    write(after)
    endHistory()
  }

  return (
    <PanelSection name="adjust" title="Adjust" open={open} onToggle={() => setOpen(!open)} className="image-adjust" aside={untouched ? null : <span className="image-adjust__state">{preset ? preset.name : 'Edited'}</span>}>
      <div className="image-adjust__presets">
        {IMAGE_FILTER_PRESETS.map((look) => (
          <button key={look.name} type="button" className={cx('image-adjust__preset', { 'is-active': preset?.name === look.name })} aria-pressed={preset?.name === look.name} onClick={() => recordHistory(() => write(look.filters))}>
            {look.name}
          </button>
        ))}
      </div>
      <div className="slide-wrap">
        {IMAGE_FILTER_SLIDERS.map(({ key, label, min, max }) => (
          <NumberSlider key={key} className={`image-adjust__slider image-adjust__slider--${key}`} label={label} value={values[key]} minValue={min} maxValue={max} onChange={(value) => slide(key, value)} onFinish={(value) => release(key, value)} />
        ))}
      </div>
      <Button className="image-adjust__reset" plain size="small" disabled={untouched} onClick={() => recordHistory(() => write(null))}>
        Reset
      </Button>
    </PanelSection>
  )
}
