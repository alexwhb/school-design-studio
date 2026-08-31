import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { getPortalContainer } from '@/common/hooks/appRoot'

export type TooltipProps = {
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  effect?: 'dark' | 'light'
  showAfter?: number
  disabled?: boolean
  children: ReactNode
  popperClass?: string
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={0}>{children}</TooltipPrimitive.Provider>
}

export default function Tooltip({
  content,
  placement = 'bottom',
  effect = 'dark',
  showAfter = 0,
  disabled,
  children,
  popperClass,
}: TooltipProps) {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Root delayDuration={showAfter}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={getPortalContainer()}>
        <TooltipPrimitive.Content
          side={placement}
          sideOffset={8}
          className={cx('el-popper', `is-${effect}`, 'ds-popper', popperClass || '')}
        >
          {content}
          <TooltipPrimitive.Arrow asChild width={10} height={10}>
            <span className="el-popper__arrow" />
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
