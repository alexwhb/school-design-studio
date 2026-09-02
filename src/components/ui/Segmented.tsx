import { useCallback, useId, useMemo, type KeyboardEvent } from 'react'
import { cx } from '@/utils/dom'
import './segmented.less'

export type SegmentedOption = {
  label: string
  value: string
}

type Props = {
  value: string
  options: Array<SegmentedOption | string>
  onChange: (value: string) => void
  /** `sm` is for a segmented control nested inside a row that already has a label. */
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

/**
 * One control for picking one of a few things.
 *
 * The editor grew four of these — a pair of spans in the settings panel, the
 * colour picker's own sliding-thumb tabs, a one-option radio group left over
 * from upstream, and a row of filter chips — each with its own height, radius
 * and idea of what "selected" looks like. Two of them sat 250px apart in the
 * same panel.
 *
 * The thumb slides rather than the segments repainting, which is what makes the
 * change read as one control rather than two buttons swapping states.
 */
export default function Segmented({ value, options, onChange, size = 'md', className, 'aria-label': ariaLabel }: Props) {
  const groupId = useId()
  const items = useMemo(() => options.map((o) => (typeof o === 'string' ? { label: o, value: o } : o)), [options])
  const index = Math.max(
    0,
    items.findIndex((o) => o.value === value),
  )
  const share = items.length ? 100 / items.length : 0

  // Left/right move the selection, the way a radio group does. Without this the
  // control is reachable by tab and then does nothing.
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const step = e.key === 'ArrowRight' ? 1 : -1
      const next = items[(index + step + items.length) % items.length]
      if (next) onChange(next.value)
    },
    [items, index, onChange],
  )

  return (
    <div className={cx('ds-segmented', `ds-segmented--${size}`, className || '')} role="radiogroup" aria-label={ariaLabel} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="ds-segmented__track" aria-hidden="true">
        <div className="ds-segmented__thumb" style={{ width: `${share}%`, left: `${share * index}%` }} />
      </div>
      {items.map((option) => (
        <button
          key={option.value}
          id={`${groupId}-${option.value}`}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={cx('ds-segmented__option', { 'is-active': option.value === value })}
          // The group takes the tab stop; the options are reached with arrows.
          tabIndex={-1}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
