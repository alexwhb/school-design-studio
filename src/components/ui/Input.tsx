import { useState, type InputHTMLAttributes, type Ref } from 'react'
import { cx } from '@/utils/dom'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
  value?: string
  size?: 'large' | 'default' | 'small'
  onChange?: (value: string) => void
  wrapperClassName?: string
  /**
   * `underline` drops the box and keeps only the rule under the text, for a
   * field that sits inside a card which already has a border of its own — a
   * second box drawn 10px inside the first reads as two controls.
   */
  variant?: 'underline'
  /** The inner <input>, for the callers that have to put the caret in it. */
  ref?: Ref<HTMLInputElement>
}

export default function Input({ value, size, variant, onChange, className, wrapperClassName, onFocus, onBlur, ref, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={cx('el-input', size && size !== 'default' ? `el-input--${size}` : '', variant ? `el-input--${variant}` : '', wrapperClassName || '')}>
      <div className={cx('el-input__wrapper', { 'is-focus': focused })}>
        <input
          {...rest}
          ref={ref}
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
