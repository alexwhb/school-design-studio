import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { getPortalContainer } from '@/common/hooks/appRoot'

export type PopoverProps = {
  content: ReactNode
  placement?: string
  width?: number | string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: 'click' | 'hover'
  popperClass?: string
  /**
   * Stay open when focus moves elsewhere. For a picker that applies to a text
   * selection: applying puts focus back in the text, which Radix would
   * otherwise read as leaving the popover.
   */
  keepOpenOnFocusOutside?: boolean
  children: ReactNode
}

function splitPlacement(placement: string): { side: 'top' | 'bottom' | 'left' | 'right'; align: 'start' | 'center' | 'end' } {
  const [rawSide, rawAlign] = placement.split('-')
  const side = (['top', 'bottom', 'left', 'right'].includes(rawSide) ? rawSide : 'bottom') as 'top' | 'bottom' | 'left' | 'right'
  const align = rawAlign === 'start' ? 'start' : rawAlign === 'end' ? 'end' : 'center'
  return { side, align }
}

export default function Popover({ content, placement = 'bottom', width, open, onOpenChange, popperClass, keepOpenOnFocusOutside, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const { side, align } = splitPlacement(placement)

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={getPortalContainer()}>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          // Element Plus's popovers stand 12px off their trigger.
          sideOffset={12}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onFocusOutside={keepOpenOnFocusOutside ? (e) => e.preventDefault() : undefined}
          className={cx('el-popover', 'el-popper', 'is-light', 'ds-popper', popperClass || '')}
          style={{ width: width === 'auto' || width === undefined ? 'auto' : typeof width === 'number' ? `${width}px` : width }}
          // See DropdownMenu: a React portal bubbles through the React tree, so
          // a click in here would otherwise also reach whatever declared it.
          onClick={(event) => event.stopPropagation()}
        >
          {content}
          <PopoverPrimitive.Arrow asChild width={10} height={10}>
            <span className="el-popper__arrow" />
          </PopoverPrimitive.Arrow>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
