import { useEffect, useState } from 'react'
import Slider from '@/components/ui/Slider'
import { cx } from '@/utils/dom'
import NumberInput from './NumberInput'
import './numberSlider.less'

type Props = {
  label?: string
  value?: number
  minValue?: number
  maxValue?: number
  step?: number
  /**
   * Puts a typed field where the read-only number was, on the same line as the
   * run — the shape the opacity row has. A slider alone can only be aimed at a
   * value; this is where an exact one is typed.
   */
  field?: boolean
  /** The unit shown after the typed field — °, px, %. */
  suffix?: string
  style?: React.CSSProperties
  className?: string
  onChange?: (value: number) => void
  onFinish?: (value: number) => void
}

export default function NumberSlider({ label = '', value = 0, minValue = 0, maxValue = 500, step = 1, field, suffix, style, className, onChange, onFinish }: Props) {
  const [innerValue, setInnerValue] = useState(value)
  const displayValue = Number(Number(innerValue).toFixed(2))
  /** What stands in the field, which while it is being typed may be half a number — a lone minus sign. */
  const [typed, setTyped] = useState<string | number>(displayValue)

  useEffect(() => {
    setInnerValue(value)
    setTyped(Number(Number(value).toFixed(2)))
  }, [value])

  function commit(next: number) {
    setInnerValue(next)
    if (value !== next) onChange?.(next)
  }

  /** A typed number is held to the range rather than refused; a lone minus waits for its digits. */
  function typedChange(next: number | string) {
    setTyped(next)
    if (next === '-' || next === '') return
    commit(Math.min(maxValue, Math.max(minValue, Number(next) || 0)))
  }

  /**
   * Enter commits by leaving the field, and Shift with an arrow steps by ten.
   * The plain arrows are the field's own, so only the shifted pair is taken —
   * and it has to be taken on the way down, because the field stops the key
   * from travelling any further once it has it.
   */
  function fieldKeys(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      ;(e.target as HTMLElement).blur()
      return
    }
    if (!e.shiftKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    e.stopPropagation()
    typedChange(displayValue + (e.key === 'ArrowUp' ? 10 : -10) * step)
  }

  const run = (
    <Slider
      value={innerValue}
      min={minValue}
      max={maxValue}
      step={step}
      onChange={commit}
      onChangeEnd={(next) => onFinish?.(next)}
    />
  )

  if (field) {
    return (
      <div id="number-slider" className={cx('has-field', className || '')} style={style} onKeyDownCapture={fieldKeys}>
        <span className="label">{label}</span>
        <NumberInput className="number-slider__field" variant="underline" value={typed} suffix={suffix} step={step} minValue={minValue} maxValue={maxValue} onChange={typedChange} onFinish={() => onFinish?.(displayValue)} />
        {run}
      </div>
    )
  }

  return (
    <div id="number-slider" className={className} style={style}>
      <div className="slider-head">
        <span className="label">{label}</span>
        <span className="value">{displayValue}</span>
      </div>
      {run}
    </div>
  )
}
