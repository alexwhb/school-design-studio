/**
 * The settings panel's list row: a check that switches the thing on, what it
 * paints, its name, and a way further in.
 *
 * Every optional part of a design reads the same way here — a fill, a drop
 * shadow, the grid, the page's background — because they are all the same
 * question. Before this each one drew itself: a switch here, a checkbox with a
 * swatch beside it there, a full-width button somewhere else.
 */
import type { CSSProperties, ReactNode } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import { ChevronDownIcon } from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import './toggleRow.less'

type Props = {
  label: ReactNode
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  /** What the row paints, drawn in the 30×16 swatch. Omit for a row with nothing to show. */
  swatch?: ReactNode
  swatchStyle?: CSSProperties
  /** Draws the swatch as a transparency checker when there is no colour behind it. */
  checker?: boolean
  /** Set to give the row a chevron that opens whatever it stands for. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Controls at the right-hand end, instead of a chevron. */
  trailing?: ReactNode
  className?: string
  children?: ReactNode
}

export default function ToggleRow({ label, checked, onCheckedChange, swatch, swatchStyle, checker, open, onOpenChange, trailing, className, children }: Props) {
  const expandable = typeof open === 'boolean' && !!onOpenChange
  const showSwatch = swatch !== undefined || swatchStyle || checker

  const body = (
    <>
      {showSwatch ? (
        <span className={cx('toggle-row__swatch', { 'transparent-bg': !!checker })} style={swatchStyle}>
          {swatch}
        </span>
      ) : null}
      <span className="toggle-row__label">{label}</span>
      {trailing}
      {expandable ? (
        <i className="toggle-row__arrow" aria-hidden="true">
          <ChevronDownIcon />
        </i>
      ) : null}
    </>
  )

  return (
    <div className={cx('toggle-row', { 'is-on': checked, 'is-open': !!open }, className || '')}>
      <div className="toggle-row__head">
        {onCheckedChange ? <Checkbox className="toggle-row__check" value={checked} onChange={onCheckedChange} /> : null}
        {expandable ? (
          <button type="button" className="toggle-row__body" aria-expanded={open} onClick={() => onOpenChange?.(!open)}>
            {body}
          </button>
        ) : (
          <div className="toggle-row__body toggle-row__body--static">{body}</div>
        )}
      </div>
      {children ? <div className="toggle-row__extra">{children}</div> : null}
    </div>
  )
}
