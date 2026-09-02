/**
 * The table itself: what the canvas widget and its read-only twin both draw,
 * so a page thumbnail, a slide and an export take the same table the artboard
 * does.
 *
 * A real `<table>`, because that is what html2canvas, the browser's own
 * layout and a screen reader all know how to handle, and because a fixed
 * layout with a `<colgroup>` is the one arrangement where a column's width is
 * exactly the fraction it was given rather than whatever the words in it
 * argue for. The height is whatever the rows come to; the widget reads it back
 * off the element (see wTable.tsx) rather than trying to work it out.
 *
 * Cells are `dangerouslySetInnerHTML` from the store even while one of them
 * is being typed into. React only rewrites the DOM when the string changes,
 * and the string does not change until the edit is committed, so the caret is
 * never disturbed mid-word; on commit it is rewritten to what was typed, which
 * is a no-op on screen.
 */
import { forwardRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type Ref } from 'react'
import { isInvisible } from '@/common/methods/export/utils'
import { readTable } from './tableModel'
import './wTable.less'

export type TCellRef = { row: number; col: number }

type Props = {
  params: Record<string, any>
  /** Which cell has the caret, if any. Only the canvas widget ever sets it. */
  editing?: TCellRef | null
  cellRef?: (row: number, col: number, el: HTMLDivElement | null) => void
  onCellDoubleClick?: (cell: TCellRef, e: MouseEvent<HTMLTableCellElement>) => void
  onCellContextMenu?: (cell: TCellRef, e: MouseEvent<HTMLTableCellElement>) => void
  onCellKeyDown?: (cell: TCellRef, e: KeyboardEvent<HTMLDivElement>) => void
  onCellBlur?: (cell: TCellRef, el: HTMLDivElement) => void
  spellCheck?: boolean
}

/** A colour the table should actually paint, or undefined for "nothing". */
function paint(colour: unknown): string | undefined {
  return typeof colour === 'string' && colour && !isInvisible(colour) ? colour : undefined
}

const TableGrid = forwardRef(function TableGrid(
  { params, editing, cellRef, onCellDoubleClick, onCellContextMenu, onCellKeyDown, onCellBlur, spellCheck = false }: Props,
  ref: Ref<HTMLTableElement>,
) {
  const table = readTable(params)
  const borderWidth = Math.max(0, Number(params.borderWidth) || 0)
  const border = borderWidth > 0 ? `${borderWidth}px ${params.borderStyle || 'solid'} ${params.borderColor || '#000000ff'}` : 'none'
  const padding = Math.max(0, Number(params.cellPadding) || 0)
  const fontSize = Number(params.fontSize) || 16
  const lineHeight = Number(params.lineHeight) || 1.4
  const fontFamily = params.fontClass?.value ? `'${params.fontClass.value}'` : undefined

  const gridStyle: CSSProperties = {
    fontFamily,
    fontSize: fontSize + 'px',
    lineHeight: lineHeight,
    fontWeight: params.fontWeight || 'normal',
    color: params.color,
    textAlign: params.textAlign || 'left',
  }

  function fillFor(row: number): string | undefined {
    if (table.headerRow && row === 0) return paint(params.headerFill)
    // Striping counts from the first body row, so the row under a heading is
    // always plain and the one after it tinted, however the heading is set.
    const bodyIndex = table.headerRow ? row - 1 : row
    if (bodyIndex % 2 === 1) return paint(params.altFill) ?? paint(params.bodyFill)
    return paint(params.bodyFill)
  }

  return (
    <table ref={ref} className="w-table__grid" style={gridStyle}>
      <colgroup>
        {table.colWidths.map((width, c) => (
          <col key={c} style={{ width: `${width * 100}%` }} />
        ))}
      </colgroup>
      <tbody>
        {table.cells.map((row, r) => {
          const isHeader = table.headerRow && r === 0
          return (
            <tr key={r}>
              {row.map((cell, c) => {
                const isEditing = !!editing && editing.row === r && editing.col === c
                return (
                  <td
                    key={c}
                    data-row={r}
                    data-col={c}
                    style={{
                      border,
                      padding: padding + 'px',
                      background: fillFor(r),
                      color: isHeader ? params.headerColor || params.color : undefined,
                      fontWeight: isHeader ? 'bold' : undefined,
                      verticalAlign: 'top',
                      // The width comes from the <col>; without this a long
                      // word would still push the column wider.
                      overflowWrap: 'anywhere',
                    }}
                    onDoubleClick={onCellDoubleClick ? (e) => onCellDoubleClick({ row: r, col: c }, e) : undefined}
                    onContextMenu={onCellContextMenu ? (e) => onCellContextMenu({ row: r, col: c }, e) : undefined}
                  >
                    <div
                      ref={cellRef ? (el) => cellRef(r, c, el) : undefined}
                      className="w-table__cell"
                      style={{ minHeight: fontSize * lineHeight + 'px' }}
                      contentEditable={isEditing ? 'plaintext-only' : undefined}
                      spellCheck={isEditing ? spellCheck : false}
                      suppressContentEditableWarning
                      onKeyDown={isEditing && onCellKeyDown ? (e) => onCellKeyDown({ row: r, col: c }, e) : undefined}
                      onBlur={isEditing && onCellBlur ? (e) => onCellBlur({ row: r, col: c }, e.currentTarget) : undefined}
                      dangerouslySetInnerHTML={{ __html: cell || '' }}
                    />
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
})

export default TableGrid
