import type { TdLayout } from '../types';
/**
 * A ceiling rather than a limit anyone should meet.
 *
 * Upstream stopped at nine, which is too few for anything presentation-shaped —
 * a term's worth of assembly slides is more than nine. Every page is held in
 * memory whether or not it is on screen, so a design of a thousand pages would
 * be a way to run the browser out of memory rather than a feature. The autosave
 * writes only the pages that changed (see localDesigns.ts), so the ceiling is
 * about what the editor holds, not about what it saves.
 */
export declare const MAX_PAGES = 50;
/**
 * Makes `index` the page on the canvas.
 *
 * The order matters: the widget list has to be re-read before the canvas store
 * is pointed at the new page, or the board paints one page's artwork at the
 * other page's size for a frame.
 *
 * And the board has to be told the list is a different one. Swapping dWidgets
 * for another page's array is invisible to valtio's snapshot comparison, which
 * looks at the values that were read rather than at the object they were read
 * from: two pages each holding one unhidden top-level layer compare equal, so
 * the board went on drawing the page you had left. It only looked right because
 * changing page usually changes the selection too, which is tracked — edit some
 * text, click away, and switch, and the artwork stayed put.
 */
export declare function showPage(index: number): void;
/** Adds an empty page after the current one and moves to it. */
export declare function addPage(): void;
/**
 * A copy of a page, artwork and all, that can stand in the same design as the
 * original.
 *
 * Every widget needs a new uuid: two copies of the same id on one design would
 * fight over selection, and grouped elements point at their container by id, so
 * the whole page is renumbered together and the parent links are rewritten to
 * match. Duplicating a page and making one page per person (bulkPages.ts) both
 * start from here.
 */
export declare function copyLayout(source: TdLayout): TdLayout;
/** Copies a page and moves to the copy. */
export declare function duplicatePage(index: number): void;
/**
 * Removes a page.
 *
 * The last page is emptied rather than removed: a design with no pages has
 * nothing to draw and every part of the editor assumes there is a current one.
 */
export declare function removePage(index: number): void;
/** Moves a page to another position, keeping the same page on screen. */
export declare function movePage(from: number, to: number): void;
/** Names a page. Blank means unnamed, which shows as its number instead. */
export declare function renamePage(index: number, name: string): void;
