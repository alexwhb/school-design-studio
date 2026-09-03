/**
 * The frame every browsing panel is built in.
 *
 * All four of them are the same shape: a header that stays put while you scroll
 * — the search well and whatever chips filter the list — over a body that
 * scrolls. Each panel used to size and pad that itself, which is how the
 * Templates list ended up 14px from the edge and the Photos list 16px, and why
 * a sticky "back" header had to be positioned absolutely over a list that was
 * really the whole panel.
 */
import { forwardRef, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import './panelShell.less'

type WrapProps = {
  id?: string
  className?: string
  children: ReactNode
}

export function PanelWrap({ id, className, children }: WrapProps) {
  return (
    <div id={id} className={cx('panel-wrap', className)}>
      {children}
    </div>
  )
}

export function PanelHead({ children }: { children: ReactNode }) {
  return <div className="panel-wrap__head">{children}</div>
}

type BodyProps = {
  className?: string
  children: ReactNode
}

/** The scroller, so a panel can hand it to `useInfiniteScroll`. */
export const PanelBody = forwardRef<HTMLDivElement, BodyProps>(function PanelBody({ className, children }, ref) {
  return (
    <div ref={ref} className={cx('panel-wrap__body', className)}>
      {children}
    </div>
  )
})

export function PanelSectionBlock({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('panel-wrap__section', className)}>{children}</div>
}
