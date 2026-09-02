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
  /** Element Plus sizes the menu, not the trigger: `large` gives taller items. */
  size?: 'large' | 'default' | 'small'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownItem({ children, onSelect, divided, disabled, closeOnSelect = true }: { children: ReactNode; onSelect?: () => void; divided?: boolean; disabled?: boolean; closeOnSelect?: boolean }) {
  return (
    <>
      {/* Element Plus draws a divider as its own empty <li>, not as a border on
          the item, and the two are not the same height. */}
      {divided ? <li className="el-dropdown-menu__item--divided" /> : null}
      {/*
        Radix's own Item, so choosing something closes the menu and the arrow
        keys work. It also owns the modal layer: a menu left open holds
        `pointer-events: none` on the body, and whatever opens next — a dialog,
        a confirmation — cannot be clicked.
      */}
      <DropdownPrimitive.Item
        asChild
        disabled={disabled}
        onSelect={(event) => {
          if (!closeOnSelect) event.preventDefault()
          onSelect?.()
        }}
      >
        <li className={cx('el-dropdown-menu__item', { 'is-disabled': !!disabled })}>
          <div className="ds-dropdown-item-inner">{children}</div>
        </li>
      </DropdownPrimitive.Item>
    </>
  )
}

export default function Dropdown({ children, menu, placement = 'bottom-start', maxHeight, menuClassName, size, open, onOpenChange }: DropdownProps) {
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
          sideOffset={12}
          className="el-popper is-pure is-light el-dropdown__popper ds-popper"
          style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
          // A React portal still bubbles its events up the React tree, so
          // without this a click on a menu item also runs the click handler of
          // whatever the menu was declared inside — selecting "Duplicate" on a
          // page's menu would also select that page.
          onClick={(event) => event.stopPropagation()}
        >
          <ul className={cx('el-dropdown-menu', size && size !== 'default' ? `el-dropdown-menu--${size}` : '', menuClassName || '')}>{menu}</ul>
          <DropdownPrimitive.Arrow asChild width={10} height={10}>
            <span className="el-popper__arrow" />
          </DropdownPrimitive.Arrow>
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  )
}
