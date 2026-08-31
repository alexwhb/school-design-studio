import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/dom'

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  nativeType?: 'button' | 'submit' | 'reset'
  plain?: boolean
  text?: boolean
  link?: boolean
  round?: boolean
  circle?: boolean
  size?: 'large' | 'default' | 'small'
  children?: ReactNode
}

export default function Button({
  type = 'default',
  nativeType = 'button',
  plain,
  text,
  link,
  round,
  circle,
  size,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={nativeType}
      className={cx(
        'el-button',
        `el-button--${type}`,
        size && size !== 'default' ? `el-button--${size}` : '',
        {
          'is-plain': !!plain,
          'is-text': !!text,
          'is-link': !!link,
          'is-round': !!round,
          'is-circle': !!circle,
          'is-disabled': !!rest.disabled,
        },
        className || '',
      )}
    >
      <span>{children}</span>
    </button>
  )
}
