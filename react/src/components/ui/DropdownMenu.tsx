import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import { useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { getPortalContainer } from '@/common/hooks/appRoot'

export type DropdownProps = {
  children: ReactNode
  menu: ReactNode
  placement?: string
  hideOnClick?: boolean
  maxHeight?: string
  menuClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownItem({
  children,
  onSelect,
  divided,
  disabled,
  closeOnSelect = true,
}: {
  children: ReactNode
  onSelect?: () => void
  divided?: boolean
  disabled?: boolean
  closeOnSelect?: boolean
}) {
  return (
    <li className={cx('el-dropdown-menu__item', { 'el-dropdown-menu__item--divided': !!divided, 'is-disabled': !!disabled })}>
      <div
        className="ds-dropdown-item-inner"
        onClick={(e) => {
          if (disabled) return
          if (!closeOnSelect) e.preventDefault()
          onSelect?.()
        }}
      >
        {children}
      </div>
    </li>
  )
}

export default function Dropdown({ children, menu, placement = 'bottom-start', maxHeight, menuClassName, open, onOpenChange }: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const [rawSide, rawAlign] = placement.split('-')
  const side = (['top', 'bottom', 'left', 'right'].includes(rawSide) ? rawSide : 'bottom') as 'top' | 'bottom' | 'left' | 'right'
  const align = rawAlign === 'start' ? 'start' : rawAlign === 'end' ? 'end' : 'center'

  return (
    <DropdownPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DropdownPrimitive.Trigger asChild>{children}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal container={getPortalContainer()}>
        <DropdownPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          className="el-popper is-light el-dropdown__popper ds-popper"
          style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
        >
          <ul className={cx('el-dropdown-menu', menuClassName || '')}>{menu}</ul>
          <DropdownPrimitive.Arrow asChild width={10} height={10}>
            <span className="el-popper__arrow" />
          </DropdownPrimitive.Arrow>
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  )
}
