/**
 * What a table is made of, and every way its shape can change.
 *
 * `cells` is the truth: a rectangular grid of strings, each holding the same
 * contentEditable markup a text widget holds (text nodes and `<br>`s, with `&`
 * written as `&amp;`), so that find and replace, the PowerPoint export and the
 * cell editor all read a cell exactly as they read a text box. `colWidths` are
 * fractions of the table's width that sum to one, which is what lets the
 * whole table be resized without any column needing to know about it.
 *
 * Nothing here touches the store. Every function takes a grid and hands back a
 * new one, so the widget, its panel and the cell menu can all describe a change
 * as "this grid becomes that grid" and let one place write it.
 */

export type TTableData = {
  rows: number
  cols: number
  cells: string[][]
  colWidths: number[]
  headerRow: boolean
}

/** The narrowest a column may be dragged, in design pixels. */
export const MIN_COL_PX = 40

/** A design can hold more, but nobody reads a slide with more than this. */
export const MAX_ROWS = 50
export const MAX_COLS = 20

function evenWidths(cols: number): number[] {
  return Array.from({ length: cols }, () => 1 / cols)
}

/** Scales a list of widths so it sums to exactly one, or spreads them evenly if it cannot. */
export function normalizeWidths(widths: unknown, cols: number): number[] {
  if (!Array.isArray(widths) || widths.length !== cols) return evenWidths(cols)
  const clean = widths.map((w) => (Number.isFinite(Number(w)) && Number(w) > 0 ? Number(w) : 0))
  const total = clean.reduce((sum, w) => sum + w, 0)
  if (!total) return evenWidths(cols)
  return clean.map((w) => w / total)
}

/**
 * The table a widget actually draws, whatever state its data is in: a grid
 * that is not rectangular is squared off with empty cells, widths that do not
 * fit the columns are spread evenly, and a table with nothing in it at all
 * still has one cell to type into.
 */
export function readTable(params: Record<string, any> | null | undefined): TTableData {
  const raw = Array.isArray(params?.cells) ? (params!.cells as unknown[]) : []
  const rowList = raw.filter(Array.isArray) as unknown[][]
  const rows = Math.max(1, rowList.length || Number(params?.rows) || 1)
  const cols = Math.max(1, rowList.reduce((widest, row) => Math.max(widest, row.length), 0) || Number(params?.cols) || 1)
  const cells: string[][] = []
  for (let r = 0; r < rows; r++) {
    const row: string[] = []
    for (let c = 0; c < cols; c++) {
      const value = rowList[r]?.[c]
      row.push(typeof value === 'string' ? value : '')
    }
    cells.push(row)
  }
  return {
    rows,
    cols,
    cells,
    colWidths: normalizeWidths(params?.colWidths, cols),
    headerRow: params?.headerRow !== false,
  }
}

/** A fresh grid of empty cells. */
export function emptyCells(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
}

export function setCell(cells: string[][], row: number, col: number, value: string): string[][] {
  return cells.map((line, r) => (r === row ? line.map((cell, c) => (c === col ? value : cell)) : [...line]))
}

/** A new empty row before `at`; `at` equal to the row count appends one. */
export function insertRow(cells: string[][], at: number): string[][] {
  if (cells.length >= MAX_ROWS) return cells
  const cols = cells[0]?.length ?? 1
  const next = cells.map((line) => [...line])
  next.splice(
    Math.max(0, Math.min(at, cells.length)),
    0,
    Array.from({ length: cols }, () => ''),
  )
  return next
}

/** Takes a row out. The last row stays: a table with no rows is not a table. */
export function removeRow(cells: string[][], at: number): string[][] {
  if (cells.length <= 1 || at < 0 || at >= cells.length) return cells
  return cells.filter((_, r) => r !== at).map((line) => [...line])
}

/**
 * A new empty column before `at`. It takes an even share of the width and the
 * others give it up proportionally, so a table that had been carefully
 * arranged keeps its proportions rather than its pixels.
 */
export function insertCol(cells: string[][], colWidths: number[], at: number): { cells: string[][]; colWidths: number[] } {
  const cols = cells[0]?.length ?? 1
  if (cols >= MAX_COLS) return { cells, colWidths }
  const index = Math.max(0, Math.min(at, cols))
  const nextCells = cells.map((line) => {
    const row = [...line]
    row.splice(index, 0, '')
    return row
  })
  const share = 1 / (cols + 1)
  const scaled = normalizeWidths(colWidths, cols).map((w) => w * (1 - share))
  scaled.splice(index, 0, share)
  return { cells: nextCells, colWidths: normalizeWidths(scaled, cols + 1) }
}

/** Takes a column out and lets the rest widen to fill the gap. The last column stays. */
export function removeCol(cells: string[][], colWidths: number[], at: number): { cells: string[][]; colWidths: number[] } {
  const cols = cells[0]?.length ?? 1
  if (cols <= 1 || at < 0 || at >= cols) return { cells, colWidths }
  const nextCells = cells.map((line) => line.filter((_, c) => c !== at))
  const remaining = normalizeWidths(colWidths, cols).filter((_, c) => c !== at)
  return { cells: nextCells, colWidths: normalizeWidths(remaining, cols - 1) }
}

/**
 * Moves the divider between column `index` and the one after it by `delta`,
 * a fraction of the table's width. Neither neighbour may go below `min`, also
 * a fraction, so the drag simply stops when one of them is as narrow as it
 * can be. The other columns never move — only the two either side of the
 * divider trade width, which is what a person dragging a divider expects.
 */
export function resizeColumns(colWidths: number[], index: number, delta: number, min: number): number[] {
  const cols = colWidths.length
  if (index < 0 || index >= cols - 1) return colWidths
  const pair = colWidths[index] + colWidths[index + 1]
  const floor = Math.min(min, pair / 2)
  const left = Math.min(Math.max(colWidths[index] + delta, floor), pair - floor)
  const next = [...colWidths]
  next[index] = left
  next[index + 1] = pair - left
  return next
}

/** How far across the table each divider sits, as a fraction: one per gap between columns. */
export function dividerOffsets(colWidths: number[]): number[] {
  const offsets: number[] = []
  let sum = 0
  for (let c = 0; c < colWidths.length - 1; c++) {
    sum += colWidths[c]
    offsets.push(sum)
  }
  return offsets
}

export type TCellMove = 'next' | 'prev' | 'down'

/**
 * Where the caret goes from a cell: Tab runs along the row and wraps onto the
 * next, Shift+Tab runs back, Enter goes straight down. Null means there is
 * nowhere to go — the caller decides whether that grows the table or ends the
 * edit.
 */
export function moveCell(row: number, col: number, rows: number, cols: number, move: TCellMove): [number, number] | null {
  switch (move) {
    case 'next':
      if (col + 1 < cols) return [row, col + 1]
      return row + 1 < rows ? [row + 1, 0] : null
    case 'prev':
      if (col > 0) return [row, col - 1]
      return row > 0 ? [row - 1, cols - 1] : null
    case 'down':
      return row + 1 < rows ? [row + 1, col] : null
  }
}

/** What a cell reads as, markup taken off — for the layer list and anything else that wants words. */
export function cellText(html: string | undefined): string {
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = String(html).replace(/<br\s*\/?>/gi, '\n')
  return el.textContent || ''
}
