import type { ReactNode } from 'react'
import { cx } from '@/utils/dom'

type Props = {
  direction?: 'horizontal' | 'vertical'
  contentPosition?: 'left' | 'center' | 'right'
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

export default function Divider({ direction = 'horizontal', contentPosition = 'center', className, style, children }: Props) {
  return (
    <div className={cx('el-divider', `el-divider--${direction}`, className || '')} style={style}>
      {children ? <div className={cx('el-divider__text', `is-${contentPosition}`)}>{children}</div> : null}
    </div>
  )
}
