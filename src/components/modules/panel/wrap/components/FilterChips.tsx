/**
 * The row of pills under a panel's search well.
 *
 * A filter over many categories rather than a switch between two, so these stay
 * chips rather than becoming a Segmented. They share its height and type so the
 * two read as the same family.
 */
import { cx } from '@/utils/dom'
import './filterChips.less'

/**
 * "None of them" — a panel showing search results rather than a category, where
 * leaving the value alone would light up whichever chip happens to match.
 */
export const NO_CHIP = -1

export type TFilterChip = {
  id: string | number
  name: string
}

type Props<T extends TFilterChip> = {
  items: T[]
  /** The selected chip's id. */
  value: string | number
  onChange: (item: T) => void
}

export default function FilterChips<T extends TFilterChip>({ items, value, onChange }: Props<T>) {
  if (items.length <= 1) return null
  return (
    <div className="cates">
      {items.map((item) => (
        <button key={item.id} className={cx('cates__chip', { 'cates__chip--on': value === item.id })} type="button" onClick={() => onChange(item)}>
          {item.name}
        </button>
      ))}
    </div>
  )
}
