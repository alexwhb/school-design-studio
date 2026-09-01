import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
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

/**
 * Ref-forwarding, because Radix's `asChild` triggers — tooltips, dropdowns,
 * popovers — clone the child and hand it a ref to position against.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'default', nativeType = 'button', plain, text, link, round, circle, size, className, children, ...rest },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
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
})

export default Button
