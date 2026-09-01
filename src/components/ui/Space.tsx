import { Children, type ReactNode } from 'react'
import { cx } from '@/utils/dom'

type Props = {
  direction?: 'horizontal' | 'vertical'
  wrap?: boolean
  fill?: boolean
  fillRatio?: number
  className?: string
  children?: ReactNode
}

export default function Space({ direction = 'horizontal', wrap, fill, fillRatio = 100, className, children }: Props) {
  return (
    <div
      className={cx('el-space', `el-space--${direction === 'vertical' ? 'vertical' : 'horizontal'}`, className || '')}
      style={{ flexWrap: wrap ? 'wrap' : undefined }}
    >
      {Children.map(children, (child, i) =>
        child == null ? null : (
          <div key={i} className="el-space__item" style={fill ? { flexGrow: 1, minWidth: `${fillRatio}%` } : undefined}>
            {child}
          </div>
        ),
      )}
    </div>
  )
}
