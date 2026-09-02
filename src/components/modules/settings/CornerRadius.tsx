/**
 * Corner rounding in the panel: one slider while the corners are linked, four
 * boxes once they are not.
 *
 * The toggle is the same idea Adobe XD's is — a chain that either holds the
 * four together or lets them go — and it is the same state the canvas grips
 * read, so unlinking here changes what dragging a grip does, and Alt-dragging a
 * grip lights this up. Which way it goes is written into the widget rather than
 * held in the panel, or a box would forget it had independent corners the
 * moment you selected something else.
 */
import { cx } from '@/utils/dom'
import { CORNERS, type TCorners } from '../widgets/wRect/rectRadius'
import { LinkedIcon, UnlinkedIcon } from '@/components/ui/icons'
import NumberInput from './NumberInput'
import NumberSlider from './NumberSlider'
import './cornerRadius.less'

type Props = {
  corners: TCorners
  unlinked: boolean
  /** Half the shorter side: past it the browser scales the corners down anyway. */
  maxValue: number
  onLinkChange: (unlinked: boolean) => void
  /** `index` is -1 while the corners are linked, meaning all four. */
  onChange: (index: number, value: number) => void
}

export default function CornerRadius({ corners, unlinked, maxValue, onLinkChange, onChange }: Props) {
  return (
    <div className="corner-radius">
      <div className="corner-radius__head">
        <span className="corner-radius__hint">Drag a corner on the canvas, or set it here</span>
        <button
          type="button"
          className={cx('corner-radius__link', { 'is-active': !unlinked })}
          aria-pressed={!unlinked}
          title={unlinked ? 'Round every corner together' : 'Round each corner on its own'}
          onClick={() => onLinkChange(!unlinked)}
        >
          {unlinked ? <UnlinkedIcon /> : <LinkedIcon />}
        </button>
      </div>
      {unlinked ? (
        <div className="line-layout">
          {CORNERS.map((corner, index) => (
            <NumberInput
              key={corner.key}
              label={corner.short}
              value={corners[index]}
              minValue={0}
              maxValue={maxValue}
              onChange={(value) => onChange(index, Number(value))}
            />
          ))}
        </div>
      ) : (
        <NumberSlider label="Radius" value={corners[0]} maxValue={maxValue} onChange={(value) => onChange(-1, value)} />
      )}
    </div>
  )
}
