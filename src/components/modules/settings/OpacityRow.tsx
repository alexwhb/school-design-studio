/**
 * How see-through a thing is: the checker that stands for transparency, the
 * number, and the run you drag.
 *
 * A slider with its value in a heading above it is two lines for one setting.
 * On one line the number is also where you type an exact 40%, which the slider
 * alone never gave you.
 */
import Slider from '@/components/ui/Slider'
import NumberInput from './NumberInput'
import './opacityRow.less'

type Props = {
  value?: number
  onChange: (value: number) => void
}

/** The store keeps 0–1; the panel talks in whole percentages. */
const toPercent = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100)

export default function OpacityRow({ value = 1, onChange }: Props) {
  const percent = toPercent(Number.isFinite(Number(value)) ? Number(value) : 1)

  return (
    <div className="opacity-row">
      <span className="opacity-row__chip transparent-bg" aria-hidden="true" />
      <NumberInput
        className="opacity-row__value"
        variant="underline"
        value={percent}
        suffix="%"
        minValue={0}
        maxValue={100}
        onChange={(next) => onChange(Math.min(100, Math.max(0, Number(next) || 0)) / 100)}
      />
      <Slider className="opacity-row__slider" value={percent} min={0} max={100} step={1} onChange={(next) => onChange(next / 100)} />
    </div>
  )
}
