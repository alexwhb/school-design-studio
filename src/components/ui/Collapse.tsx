import { useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { ArrowRightIcon } from './icons'

export type CollapseItemProps = {
  name: string
  title: ReactNode
  children: ReactNode
}

export function CollapseItem({ name, title, children, active, onToggle }: CollapseItemProps & { active?: boolean; onToggle?: (name: string) => void }) {
  return (
    <div className={cx('el-collapse-item', { 'is-active': !!active })}>
      <div role="tab">
        <button type="button" className={cx('el-collapse-item__header', { 'is-active': !!active })} onClick={() => onToggle?.(name)}>
          {title}
          <i className={cx('el-collapse-item__arrow', 'el-icon', { 'is-active': !!active })}>
            <ArrowRightIcon />
          </i>
        </button>
      </div>
      <div className="el-collapse-item__wrap" role="tabpanel" style={{ display: active ? undefined : 'none' }}>
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
    <div className={cx('el-collapse', className || '')} role="tablist">
      {Array.isArray(children)
        ? children.map((child: any, i: number) =>
            child && child.props?.name
              ? { ...child, props: { ...child.props, active: value.includes(child.props.name), onToggle: toggle }, key: child.key ?? i }
              : child,
          )
        : children}
    </div>
  )
}

export function useCollapse(initial: string[]) {
  return useState<string[]>(initial)
}
