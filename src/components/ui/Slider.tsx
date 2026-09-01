import { useCallback, useEffect, useRef } from 'react'
import { cx } from '@/utils/dom'

export type SliderProps = {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  onChange?: (value: number) => void
  onChangeEnd?: (value: number) => void
}

function precisionOf(step: number) {
  const text = String(step)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : text.length - dot - 1
}

export default function Slider({ value, min = 0, max = 100, step = 1, disabled, className, onChange, onChangeEnd }: SliderProps) {
  const runwayRef = useRef<HTMLDivElement | null>(null)
  const dragging = useRef(false)
  const latest = useRef(value)
  latest.current = value

  const range = max - min || 1
  const percent = Math.min(100, Math.max(0, ((value - min) / range) * 100))

  const valueFromEvent = useCallback(
    (clientX: number) => {
      const runway = runwayRef.current
      if (!runway) return latest.current
      const rect = runway.getBoundingClientRect()
      const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width
      const raw = min + Math.min(1, Math.max(0, ratio)) * range
      const stepped = Math.round((raw - min) / step) * step + min
      return Number(stepped.toFixed(precisionOf(step)))
    },
    [min, range, step],
  )

  const start = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return
      event.preventDefault()
      dragging.current = true
      const next = valueFromEvent(event.clientX)
      latest.current = next
      onChange?.(next)

      const move = (e: PointerEvent) => {
        if (!dragging.current) return
        const moved = valueFromEvent(e.clientX)
        if (moved === latest.current) return
        latest.current = moved
        onChange?.(moved)
      }
      const up = () => {
        dragging.current = false
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', up)
        onChangeEnd?.(latest.current)
      }
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
    },
    [disabled, onChange, onChangeEnd, valueFromEvent],
  )

  useEffect(() => {
    return () => {
      dragging.current = false
    }
  }, [])

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    let next: number | null = null
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(min, value - step)
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(max, value + step)
    if (next === null) return
    e.preventDefault()
    const rounded = Number(next.toFixed(precisionOf(step)))
    latest.current = rounded
    onChange?.(rounded)
    onChangeEnd?.(rounded)
  }

  return (
    <div className={cx('el-slider', { 'is-disabled': !!disabled }, className || '')} role="slider" aria-valuenow={value} aria-valuemin={min} aria-valuemax={max}>
      <div ref={runwayRef} className="el-slider__runway" onPointerDown={start}>
        <div className="el-slider__bar" style={{ width: `${percent}%`, left: '0%' }} />
        <div className="el-slider__button-wrapper" style={{ left: `${percent}%` }} tabIndex={0} onPointerDown={start} onKeyDown={onKeyDown}>
          <div className="el-slider__button" />
        </div>
      </div>
    </div>
  )
}
