/**
 * One thing you can put on the page: a template, a sticker, a photo, a preset.
 *
 * All four panels draw the same object — a thumbnail box of a fixed shape with
 * an optional caption under it — so the tile, its hover and its caption type
 * live here rather than being written out again in every panel's stylesheet,
 * which is how the Elements panel ended up with 4px corners and the Templates
 * panel with 5px.
 */
import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/utils/dom'
import './card.less'

type Props = {
  /** The thumbnail's shape, as a CSS aspect-ratio. */
  ratio?: string
  name?: ReactNode
  /** The line under the name, set in the metadata mono. */
  meta?: ReactNode
  children?: ReactNode
  thumbClassName?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

export default function Card({ ratio = '4 / 3', name, meta, children, className, thumbClassName, ...rest }: Props) {
  return (
    <div className={cx('panel-card', className)} {...rest}>
      <div className={cx('panel-card__thumb', thumbClassName)} style={{ aspectRatio: ratio }}>
        {children}
      </div>
      {name || meta ? (
        <div className="panel-card__cap">
          {name ? <span className="panel-card__name">{name}</span> : null}
          {meta ? <span className="panel-card__meta">{meta}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

type GridProps = {
  columns?: 2 | 3
  className?: string
  children: ReactNode
}

export function CardGrid({ columns = 2, className, children }: GridProps) {
  return <div className={cx('card-grid', `card-grid--${columns}`, className)}>{children}</div>
}

export function CardRows({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('card-rows', className)}>{children}</div>
}
