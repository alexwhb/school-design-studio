/*
 * Writing a table's grid back to the store.
 *
 * A table's `cells` and `colWidths` are arrays of arrays, which
 * `updateWidgetData` was not written to take, and a change to the grid nearly
 * always moves two of them together — a new column is cells and widths in one
 * step. So the widget, its panel and the cell menu all describe a change as a
 * patch and hand it here, where the arrays are replaced whole rather than
 * edited in place: a fresh array is what tells the snapshots on the canvas,
 * the thumbnails and the layer list that something changed.
 */
import { widgetState } from '../state'
import type { TTableData } from '@/components/modules/widgets/wTable/tableModel'

export type TTablePatch = Partial<TTableData>

export function updateTable(uuid: string, patch: TTablePatch) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget) return
  if (patch.cells) {
    widget.cells = patch.cells.map((row) => [...row])
    widget.rows = patch.cells.length
    widget.cols = patch.cells[0]?.length ?? 0
  }
  if (patch.colWidths) widget.colWidths = [...patch.colWidths]
  if (typeof patch.headerRow === 'boolean') widget.headerRow = patch.headerRow
}
