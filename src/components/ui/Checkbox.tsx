import { cx } from '@/utils/dom'

type Props = {
  value: boolean
  label?: string
  size?: 'large' | 'default' | 'small'
  className?: string
  onChange: (value: boolean) => void
}

export default function Checkbox({ value, label, size, className, onChange }: Props) {
  return (
    <label className={cx('el-checkbox', size && size !== 'default' ? `el-checkbox--${size}` : '', { 'is-checked': value }, className || '')}>
      <span className={cx('el-checkbox__input', { 'is-checked': value })}>
        <input type="checkbox" className="el-checkbox__original" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="el-checkbox__inner" />
      </span>
      {label ? <span className="el-checkbox__label">{label}</span> : null}
    </label>
  )
}
