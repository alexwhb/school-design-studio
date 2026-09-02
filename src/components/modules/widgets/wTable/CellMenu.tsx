/**
 * The menu a right-click on a cell opens: rows and columns in and out, at the
 * place that was clicked rather than at the end of the table.
 *
 * Portalled out of the canvas, because the canvas is scaled and a menu drawn
 * inside it would be scaled with it. It is chrome, not artwork, so it takes the
 * editor's tokens and the same tone as the layer menu.
 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getPortalContainer } from '@/common/hooks/appRoot'
import { cx } from '@/utils/dom'
import { MAX_COLS, MAX_ROWS } from './tableModel'
import type { TCellRef } from './TableGrid'

export type TCellAction = 'row-above' | 'row-below' | 'col-left' | 'col-right' | 'delete-row' | 'delete-col'

type Props = {
  at: { x: number; y: number } & TCellRef
  rows: number
  cols: number
  onAction: (action: TCellAction, cell: TCellRef) => void
  onClose: () => void
}

export default function CellMenu({ at, rows, cols, onAction, onClose }: Props) {
  // Any press anywhere else puts the menu away, as does Escape.
  useEffect(() => {
    const away = (e: Event) => {
      if (!(e.target as HTMLElement)?.closest?.('.w-table__menu')) onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('mousedown', away, true)
    document.addEventListener('contextmenu', away, true)
    window.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('mousedown', away, true)
      document.removeEventListener('contextmenu', away, true)
      window.removeEventListener('keydown', key, true)
    }
  }, [onClose])

  const items: { action: TCellAction; label: string; disabled?: boolean; divided?: boolean }[] = [
    { action: 'row-above', label: 'Insert row above', disabled: rows >= MAX_ROWS },
    { action: 'row-below', label: 'Insert row below', disabled: rows >= MAX_ROWS },
    { action: 'col-left', label: 'Insert column left', disabled: cols >= MAX_COLS },
    { action: 'col-right', label: 'Insert column right', disabled: cols >= MAX_COLS },
    { action: 'delete-row', label: 'Delete row', disabled: rows <= 1, divided: true },
    { action: 'delete-col', label: 'Delete column', disabled: cols <= 1 },
  ]

  // Kept on screen: a click near the bottom edge opens the menu upwards.
  const height = items.length * 30 + 12
  const top = at.y + height > window.innerHeight ? Math.max(0, at.y - height) : at.y
  const left = at.x + 190 > window.innerWidth ? Math.max(0, at.x - 190) : at.x

  return createPortal(
    <ul className="w-table__menu" style={{ left, top }} onContextMenu={(e) => e.preventDefault()}>
      {items.map((item) => (
        <li
          key={item.action}
          className={cx({ 'is-disabled': !!item.disabled, 'is-divided': !!item.divided })}
          onClick={(e) => {
            e.stopPropagation()
            if (item.disabled) return
            onAction(item.action, { row: at.row, col: at.col })
            onClose()
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>,
    getPortalContainer() ?? document.body,
  )
}
