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
    rows: number;
    cols: number;
    cells: string[][];
    colWidths: number[];
    headerRow: boolean;
};
/** The narrowest a column may be dragged, in design pixels. */
export declare const MIN_COL_PX = 40;
/** A design can hold more, but nobody reads a slide with more than this. */
export declare const MAX_ROWS = 50;
export declare const MAX_COLS = 20;
/** Scales a list of widths so it sums to exactly one, or spreads them evenly if it cannot. */
export declare function normalizeWidths(widths: unknown, cols: number): number[];
/**
 * The table a widget actually draws, whatever state its data is in: a grid
 * that is not rectangular is squared off with empty cells, widths that do not
 * fit the columns are spread evenly, and a table with nothing in it at all
 * still has one cell to type into.
 */
export declare function readTable(params: Record<string, any> | null | undefined): TTableData;
/** A fresh grid of empty cells. */
export declare function emptyCells(rows: number, cols: number): string[][];
export declare function setCell(cells: string[][], row: number, col: number, value: string): string[][];
/** A new empty row before `at`; `at` equal to the row count appends one. */
export declare function insertRow(cells: string[][], at: number): string[][];
/** Takes a row out. The last row stays: a table with no rows is not a table. */
export declare function removeRow(cells: string[][], at: number): string[][];
/**
 * A new empty column before `at`. It takes an even share of the width and the
 * others give it up proportionally, so a table that had been carefully
 * arranged keeps its proportions rather than its pixels.
 */
export declare function insertCol(cells: string[][], colWidths: number[], at: number): {
    cells: string[][];
    colWidths: number[];
};
/** Takes a column out and lets the rest widen to fill the gap. The last column stays. */
export declare function removeCol(cells: string[][], colWidths: number[], at: number): {
    cells: string[][];
    colWidths: number[];
};
/**
 * Moves the divider between column `index` and the one after it by `delta`,
 * a fraction of the table's width. Neither neighbour may go below `min`, also
 * a fraction, so the drag simply stops when one of them is as narrow as it
 * can be. The other columns never move — only the two either side of the
 * divider trade width, which is what a person dragging a divider expects.
 */
export declare function resizeColumns(colWidths: number[], index: number, delta: number, min: number): number[];
/** How far across the table each divider sits, as a fraction: one per gap between columns. */
export declare function dividerOffsets(colWidths: number[]): number[];
export type TCellMove = 'next' | 'prev' | 'down';
/**
 * Where the caret goes from a cell: Tab runs along the row and wraps onto the
 * next, Shift+Tab runs back, Enter goes straight down. Null means there is
 * nowhere to go — the caller decides whether that grows the table or ends the
 * edit.
 */
export declare function moveCell(row: number, col: number, rows: number, cols: number, move: TCellMove): [number, number] | null;
/** What a cell reads as, markup taken off — for the layer list and anything else that wants words. */
export declare function cellText(html: string | undefined): string;
