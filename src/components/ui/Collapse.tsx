import { createContext, useContext, useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { ArrowRightIcon } from './icons'

export type CollapseItemProps = {
  name: string
  title: ReactNode
  children: ReactNode
}

/**
 * What the surrounding Collapse knows: which sections are open, and how to
 * toggle one. Passed down rather than injected into the children, so a single
 * item, a conditional item and an item nested in a wrapper all behave alike.
 */
const CollapseContext = createContext<{ open: string[]; toggle: (name: string) => void } | null>(null)

export function CollapseItem({
  name,
  title,
  children,
  active,
  onToggle,
}: CollapseItemProps & { active?: boolean; onToggle?: (name: string) => void }) {
  // Used on its own (Advanced, inside the text-effect panel) an item drives
  // itself through these props; inside a Collapse the section list decides.
  const group = useContext(CollapseContext)
  const isActive = typeof active === 'boolean' ? active : !!group?.open.includes(name)
  const toggle = onToggle || group?.toggle

  return (
    <div className={cx('el-collapse-item', { 'is-active': isActive })}>
      <div role="tab">
        <button type="button" className={cx('el-collapse-item__header', { 'is-active': isActive })} onClick={() => toggle?.(name)}>
          {title}
          <i className={cx('el-collapse-item__arrow', 'el-icon', { 'is-active': isActive })}>
            <ArrowRightIcon />
          </i>
        </button>
      </div>
      <div className="el-collapse-item__wrap" role="tabpanel" style={{ display: isActive ? undefined : 'none' }}>
        <div className="el-collapse-item__content">{children}</div>
      </div>
    </div>
  )
}

export default function Collapse({
  value,
  onChange,
  children,
  className,
}: {
  value: string[]
  onChange: (next: string[]) => void
  children: ReactNode
  className?: string
}) {
  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])
  }
  return (
    <CollapseContext.Provider value={{ open: value, toggle }}>
      <div className={cx('el-collapse', className || '')} role="tablist">
        {children}
      </div>
    </CollapseContext.Provider>
  )
}

export function useCollapse(initial: string[]) {
  return useState<string[]>(initial)
}
