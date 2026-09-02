import { useEffect, useState } from 'react'
import Slider from '@/components/ui/Slider'
import './numberSlider.less'

type Props = {
  label?: string
  value?: number
  minValue?: number
  maxValue?: number
  step?: number
  style?: React.CSSProperties
  className?: string
  onChange?: (value: number) => void
  onFinish?: (value: number) => void
}

export default function NumberSlider({ label = '', value = 0, minValue = 0, maxValue = 500, step = 1, style, className, onChange, onFinish }: Props) {
  const [innerValue, setInnerValue] = useState(value)

  useEffect(() => {
    setInnerValue(value)
  }, [value])

  const displayValue = Number(Number(innerValue).toFixed(2))

  return (
    <div id="number-slider" className={className} style={style}>
      <div className="slider-head">
        <span className="label">{label}</span>
        <span className="value">{displayValue}</span>
      </div>
      <Slider
        value={innerValue}
        min={minValue}
        max={maxValue}
        step={step}
        onChange={(next) => {
          setInnerValue(next)
          if (value !== next) onChange?.(next)
        }}
        onChangeEnd={(next) => onFinish?.(next)}
      />
    </div>
  )
}
