import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { CloseIcon } from './icons'
import { getPortalContainer } from '@/common/hooks/appRoot'

export type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  width?: string | number
  footer?: ReactNode
  showClose?: boolean
  closeOnClickModal?: boolean
  className?: string
  children?: ReactNode
  appendToBody?: boolean
}

export default function Dialog({
  open,
  onOpenChange,
  title,
  width,
  footer,
  showClose = true,
  closeOnClickModal = true,
  className,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={getPortalContainer()}>
        <DialogPrimitive.Overlay className="el-overlay">
          <div className="el-overlay-dialog" onMouseDown={(e) => closeOnClickModal && e.target === e.currentTarget && onOpenChange(false)}>
            <DialogPrimitive.Content
              className={cx('el-dialog', className || '')}
              style={{ ['--el-dialog-width' as any]: typeof width === 'number' ? `${width}px` : width }}
              onPointerDownOutside={(e) => !closeOnClickModal && e.preventDefault()}
            >
              <header className="el-dialog__header">
                <DialogPrimitive.Title className="el-dialog__title">{title}</DialogPrimitive.Title>
                {showClose ? (
                  <DialogPrimitive.Close className="el-dialog__headerbtn" aria-label="Close">
                    <i className="el-icon el-dialog__close">
                      <CloseIcon />
                    </i>
                  </DialogPrimitive.Close>
                ) : null}
              </header>
              <div className="el-dialog__body">{children}</div>
              {footer ? <footer className="el-dialog__footer">{footer}</footer> : null}
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
