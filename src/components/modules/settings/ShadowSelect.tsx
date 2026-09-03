import { useRef } from 'react'
import { cx } from '@/utils/dom'
import { defaultWidgetShadow, type TWidgetShadow } from '@/common/methods/shadow'
import ColorSelect from './ColorSelect'
import NumberInput from './NumberInput'
import './shadowSelect.less'

type Props = {
  value?: TWidgetShadow
  /** `null` takes the shadow off the widget rather than leaving it switched off. */
  onChange: (value: TWidgetShadow | null) => void
  className?: string
}

export default function ShadowSelect({ value, onChange, className }: Props) {
  // The last shadow that was set here. Switching one off clears it out of the
  // design entirely — an off shadow is not something a saved file should have
  // to carry — so without this the blur and offsets someone had just dialled in
  // would be gone the moment they tried the artwork without them. The panel is
  // one instance handed a different widget rather than rebuilt, so this outlives
  // the selection, and turning a shadow on somewhere else picks up where the
  // last one left off.
  const remembered = useRef<TWidgetShadow>(defaultWidgetShadow())
  const shadow = value ?? remembered.current
  const on = Boolean(value?.enable)

  function patch(part: Partial<TWidgetShadow>) {
    onChange({ ...shadow, ...part, enable: true })
  }

  function toggle(next: boolean) {
    if (!next) {
      remembered.current = { ...shadow, enable: true }
      onChange(null)
      return
    }
    onChange({ ...remembered.current, enable: true })
  }

  return (
    <div className={cx('shadow-select', className || '')}>
      <ColorSelect variant="row" label="Drop shadow" value={shadow.color} enabled={on} onEnabledChange={toggle} onValueChange={(next) => patch({ color: next })} />
      {/* Nothing to measure until there is a shadow, so the row stands alone
          rather than over a set of fields that do nothing. */}
      {on ? (
        <div className="shadow-select__fields">
          <label className="field field--full">
            <span className="field__label">Blur</span>
            <NumberInput value={shadow.blur} minValue={0} type="simple" onChange={(next) => patch({ blur: Number(next) })} />
          </label>
          <label className="field">
            <span className="field__label">X</span>
            <NumberInput value={shadow.offsetX} type="simple" onChange={(next) => patch({ offsetX: Number(next) })} />
          </label>
          <label className="field">
            <span className="field__label">Y</span>
            <NumberInput value={shadow.offsetY} type="simple" onChange={(next) => patch({ offsetY: Number(next) })} />
          </label>
        </div>
      ) : null}
    </div>
  )
}
