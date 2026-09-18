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
import { type KeyboardEvent, type MouseEvent } from 'react';
import './wTable.less';
export type TCellRef = {
    row: number;
    col: number;
};
type Props = {
    params: Record<string, any>;
    /** Which cell has the caret, if any. Only the canvas widget ever sets it. */
    editing?: TCellRef | null;
    cellRef?: (row: number, col: number, el: HTMLDivElement | null) => void;
    onCellDoubleClick?: (cell: TCellRef, e: MouseEvent<HTMLTableCellElement>) => void;
    onCellContextMenu?: (cell: TCellRef, e: MouseEvent<HTMLTableCellElement>) => void;
    onCellKeyDown?: (cell: TCellRef, e: KeyboardEvent<HTMLDivElement>) => void;
    onCellBlur?: (cell: TCellRef, el: HTMLDivElement) => void;
    spellCheck?: boolean;
};
declare const TableGrid: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<HTMLTableElement>>;
export default TableGrid;
