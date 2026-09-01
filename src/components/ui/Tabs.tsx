import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'

export type TabItem = {
  name: string
  label: ReactNode
}

type Props = {
  value: string
  items: TabItem[]
  onChange: (name: string) => void
  stretch?: boolean
  children?: ReactNode
  className?: string
}

export default function Tabs({ value, items, onChange, stretch = true, children, className }: Props) {
  const navRef = useRef<HTMLDivElement | null>(null)
  const [bar, setBar] = useState({ width: 0, offset: 0 })

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const tabs = Array.from(nav.querySelectorAll<HTMLElement>('.el-tabs__item'))
    const index = items.findIndex((item) => item.name === value)
    if (index < 0 || !tabs[index]) {
      setBar({ width: 0, offset: 0 })
      return
    }
    let offset = 0
    for (let i = 0; i < index; i++) offset += tabs[i].clientWidth
    const styles = window.getComputedStyle(tabs[index])
    const paddingLeft = Number.parseFloat(styles.paddingLeft)
    const paddingRight = Number.parseFloat(styles.paddingRight)
    setBar({ width: tabs[index].clientWidth - paddingLeft - paddingRight, offset: offset + paddingLeft })
  }, [value, items])

  return (
    <div className={cx('el-tabs', 'el-tabs--top', className || '')}>
      <div className="el-tabs__header is-top">
        <div className="el-tabs__nav-wrap is-top">
          <div className="el-tabs__nav-scroll">
            <div ref={navRef} className={cx('el-tabs__nav', 'is-top', { 'is-stretch': stretch })} role="tablist" style={{ transform: 'translateX(0px)' }}>
              <div className="el-tabs__active-bar is-top" style={{ width: `${bar.width}px`, transform: `translateX(${bar.offset}px)` }} />
              {items.map((item) => (
                <div
                  key={item.name}
                  role="tab"
                  className={cx('el-tabs__item', 'is-top', { 'is-active': value === item.name })}
                  onClick={() => onChange(item.name)}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="el-tabs__content">{children}</div>
    </div>
  )
}
