import sizes from '@/assets/data/PageSizeData'
import { cx } from '@/utils/dom'
import './sizePresets.less'

type Props = {
  /** Marks whichever preset matches, so the current size is obvious in the list. */
  width?: number
  height?: number
  onPick: (size: { width: number; height: number }) => void
}

/**
 * The list of page sizes a school actually uses.
 *
 * Shared by the new-design dialog and the resize dialog, which ask the same
 * question at different moments — "how big is this?" — and should not answer it
 * with two different lists.
 */
export default function SizePresets({ width, height, onPick }: Props) {
  const isCurrent = (size: { width: number; height: number }) =>
    Math.round(width || 0) === size.width && Math.round(height || 0) === size.height

  return (
    <ul className="pre-list">
      {sizes.map((size, index) => (
        <li key={'s' + index} className={cx('item', { 'is-on': isCurrent(size) })} onClick={() => onPick(size)}>
          <i className={cx('icon', size.icon)} /> {size.name} <span className="info">{size.width} × {size.height} px</span>
        </li>
      ))}
    </ul>
  )
}
