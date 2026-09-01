import { cx } from '@/utils/dom'

export type SwitchProps = {
  value?: boolean
  size?: 'large' | 'default' | 'small'
  disabled?: boolean
  onChange?: (value: boolean) => void
  className?: string
}

export default function Switch({ value = false, size, disabled, onChange, className }: SwitchProps) {
  return (
    <div
      className={cx('el-switch', size && size !== 'default' ? `el-switch--${size}` : '', { 'is-checked': value, 'is-disabled': !!disabled }, className || '')}
      onClick={(e) => {
        // The switch is often wrapped in a <label>. Without this the label
        // forwards the click to the hidden checkbox, whose own click bubbles
        // back here and toggles a second time, so nothing appears to happen.
        e.preventDefault()
        !disabled && onChange?.(!value)
      }}
    >
      <input className="el-switch__input" type="checkbox" role="switch" readOnly checked={value} />
      <span className="el-switch__core">
        <div className="el-switch__action" />
      </span>
    </div>
  )
}
