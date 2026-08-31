import { useState, type InputHTMLAttributes } from 'react'
import { cx } from '@/utils/dom'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
  value?: string
  size?: 'large' | 'default' | 'small'
  onChange?: (value: string) => void
  wrapperClassName?: string
}

export default function Input({ value, size, onChange, className, wrapperClassName, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={cx('el-input', size && size !== 'default' ? `el-input--${size}` : '', wrapperClassName || '')}>
      <div className={cx('el-input__wrapper', { 'is-focus': focused })}>
        <input
          {...rest}
          className={cx('el-input__inner', className || '')}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
        />
      </div>
    </div>
  )
}
