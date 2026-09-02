/**
 * A table on the canvas.
 *
 * The grid is drawn by TableGrid; this is the frame it sits in and everything
 * that answers the mouse. Double-click a cell to type into it, Tab and
 * Shift+Tab to run along the cells, Enter to go down a row, Escape to stop; a
 * right-click opens rows and columns in and out at that cell; and with the
 * table selected the dividers between its columns can be dragged.
 *
 * The height is never set by hand. A table is as tall as its rows, and the
 * rows are as tall as the words in them, so after every render the element is
 * measured and the store told — the same arrangement a text box uses. Only
 * the width is the user's to drag, and since the columns are held as fractions
 * of it, resizing the table scales them all together for free.
 *
 * A cell being typed into takes its presses for itself. The board selects and
 * starts moving a layer from a native listener on `#page-design`, which sits
 * below the React root, so a React handler cannot stop it; a native listener
 * on the cell can, and does, which is also what keeps Moveable from starting a
 * drag from inside the caret.
 */
import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import useSpellcheck from '@/common/hooks/useSpellcheck'
import { setUpdateRect } from '@/store/force'
import { controlState, widgetState } from '@/store/state'
import { updateTable } from '@/store/widget/table'
import { updateWidgetData } from '@/store/widget/widget'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import CellMenu, { type TCellAction } from './CellMenu'
import ColumnDividers from './ColumnDividers'
import TableGrid, { type TCellRef } from './TableGrid'
import { insertCol, insertRow, moveCell, readTable, removeCol, removeRow, setCell } from './tableModel'
import './wTable.less'

const cellKey = (cell: TCellRef) => `${cell.row}:${cell.col}`

function WTable({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as Record<string, any>
  const snap = useSnapshot(widgetState)
  const showMoveable = useSnapshot(controlState).showMoveable
  const { enabled: spellcheck } = useSpellcheck()

  const [editing, setEditing] = useState<TCellRef | null>(null)
  const [menu, setMenu] = useState<({ x: number; y: number } & TCellRef) | null>(null)
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const tableRef = useRef<HTMLTableElement | null>(null)
  const cellEls = useRef(new Map<string, HTMLDivElement>())

  const table = readTable(p)
  const selectedAlone = !child && !p.lock && showMoveable && snap.dSelectWidgets.length === 0 && snap.dActiveElement?.uuid === params.uuid

  // Rebuilt from the store whenever it changes rather than once on mount, or an
  // undone rotation stays on screen: Moveable writes the turn straight to the
  // element, so nothing else puts it back.
  useEffect(() => {
    const el = widgetRef.current
    if (!el) return
    el.style.transform = p.rotate ? `rotate(${p.rotate})` : ''
  }, [p.rotate])

  // The height follows the rows. Measured after every render, because any
  // change to the words, the width, the type size or the padding can move it.
  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    const height = Math.round(el.offsetHeight)
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid && active.record) {
      active.record.width = widgetRef.current?.offsetWidth ?? 0
      active.record.height = height
    }
    if (height > 0 && Math.abs(height - (Number(params.height) || 0)) >= 1) {
      updateWidgetData({ uuid: params.uuid, key: 'height', value: height })
      // Next frame, not this one: the selection box is measured off the
      // element, and the element is still the size it was until then.
      requestAnimationFrame(() => setUpdateRect())
    }
  })

  // The store's own flag, which is what the shortcuts, copy and paste, and the
  // selection box all read to tell a table being typed into from one being
  // moved about.
  const wasEditing = useRef(false)
  useEffect(() => {
    const now = !!editing
    if (wasEditing.current === now) return
    wasEditing.current = now
    updateWidgetData({ uuid: params.uuid, key: 'editable', value: now })
  }, [editing, params.uuid])

  // Put the caret in the cell once it is editable, and select what is there so
  // typing replaces it — the way a spreadsheet cell behaves.
  useEffect(() => {
    if (!editing) return
    const el = cellEls.current.get(cellKey(editing))
    if (!el) return
    const stop = (e: Event) => e.stopPropagation()
    el.addEventListener('mousedown', stop)
    const timer = setTimeout(() => {
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }, 30)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('mousedown', stop)
    }
  }, [editing])

  // Deselecting the table — clicking away, Escape from elsewhere — ends the edit.
  useEffect(() => {
    if (editing && snap.dActiveElement?.uuid !== params.uuid) setEditing(null)
  }, [snap.dActiveElement?.uuid, editing, params.uuid])

  const cellRef = useCallback((row: number, col: number, el: HTMLDivElement | null) => {
    const key = `${row}:${col}`
    if (el) cellEls.current.set(key, el)
    else cellEls.current.delete(key)
  }, [])

  /** Writes what was typed into a cell, if it differs from what the store holds. */
  function commit(cell: TCellRef, el?: HTMLDivElement | null): string[][] {
    const current = readTable(params).cells
    const source = el ?? cellEls.current.get(cellKey(cell))
    if (!source) return current
    const value = source.innerHTML
    if ((current[cell.row]?.[cell.col] ?? '') === value) return current
    const next = setCell(current, cell.row, cell.col, value)
    recordHistory(() => updateTable(params.uuid, { cells: next }))
    return next
  }

  function startEditing(cell: TCellRef) {
    if (p.lock || child) return
    setEditing(cell)
  }

  function onCellKeyDown(cell: TCellRef, e: KeyboardEvent<HTMLDivElement>) {
    // Everything typed into a cell is for the cell. The editor's shortcuts sit
    // on the document, below the React root, and would otherwise read a
    // Backspace as "delete this table".
    e.stopPropagation()
    const { rows, cols } = readTable(params)
    if (e.key === 'Escape') {
      e.preventDefault()
      commit(cell, e.currentTarget)
      setEditing(null)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const cells = commit(cell, e.currentTarget)
      const target = moveCell(cell.row, cell.col, rows, cols, e.shiftKey ? 'prev' : 'next')
      if (target) {
        setEditing({ row: target[0], col: target[1] })
      } else if (!e.shiftKey) {
        // Tab off the last cell grows the table, as a spreadsheet does, so a
        // list can be typed straight down without reaching for the panel.
        const grown = insertRow(cells, rows)
        if (grown !== cells) {
          recordHistory(() => updateTable(params.uuid, { cells: grown }))
          setEditing({ row: rows, col: 0 })
        }
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit(cell, e.currentTarget)
      const target = moveCell(cell.row, cell.col, rows, cols, 'down')
      if (target) setEditing({ row: target[0], col: target[1] })
      else setEditing(null)
    }
  }

  function onCellBlur(cell: TCellRef, el: HTMLDivElement) {
    commit(cell, el)
    // Only the cell that lost the caret ends the edit: moving to another cell
    // has already handed the edit on before this fires.
    setEditing((current) => (current && current.row === cell.row && current.col === cell.col ? null : current))
  }

  function onCellContextMenu(cell: TCellRef, e: MouseEvent<HTMLTableCellElement>) {
    if (p.lock || child) return
    e.preventDefault()
    // The document's own right-click menu lives on `oncontextmenu`, which a
    // stopped event never reaches.
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY, ...cell })
  }

  function runCellAction(action: TCellAction, cell: TCellRef) {
    if (editing) commit(editing)
    setEditing(null)
    const { cells, colWidths } = readTable(params)
    recordHistory(() => {
      switch (action) {
        case 'row-above':
          return updateTable(params.uuid, { cells: insertRow(cells, cell.row) })
        case 'row-below':
          return updateTable(params.uuid, { cells: insertRow(cells, cell.row + 1) })
        case 'col-left':
          return updateTable(params.uuid, insertCol(cells, colWidths, cell.col))
        case 'col-right':
          return updateTable(params.uuid, insertCol(cells, colWidths, cell.col + 1))
        case 'delete-row':
          return updateTable(params.uuid, { cells: removeRow(cells, cell.row) })
        case 'delete-col':
          return updateTable(params.uuid, removeCol(cells, colWidths, cell.col))
      }
    })
  }

  return (
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-table', { editing: !!editing, 'layer-lock': !!p.lock }, className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      <TableGrid
        ref={tableRef}
        params={p}
        editing={editing}
        cellRef={cellRef}
        spellCheck={spellcheck}
        onCellDoubleClick={startEditing}
        onCellContextMenu={onCellContextMenu}
        onCellKeyDown={onCellKeyDown}
        onCellBlur={onCellBlur}
      />
      {selectedAlone && table.cols > 1 ? <ColumnDividers params={params} /> : null}
      {menu ? <CellMenu at={menu} rows={table.rows} cols={table.cols} onAction={runCellAction} onClose={() => setMenu(null)} /> : null}
    </div>
  )
}

export default memo(WTable)
