/**
 * What the drawing tools have in common: the page's own scale, and pulling a
 * point into line with what is already on it.
 *
 * Shared so a shape dragged out with the rectangle tool and a point placed with
 * the pen land on exactly the same positions — the ones a dragged layer already
 * snaps to — rather than on two sets that agree until one of them is changed.
 */
/** How close an edge has to come, in screen pixels, before it is pulled into line. */
export declare const SNAP_THRESHOLD = 5;
export declare function clamp(value: number, low: number, high: number): number;
/**
 * The canvas's own scale, measured rather than read off the zoom: the two agree
 * everywhere except for the instant between a zoom being set and the page being
 * drawn at it, and a shape started in that instant would come out the wrong size.
 */
export declare function canvasScale(el: HTMLElement): number;
/** The nearest position within `tolerance`, or the value untouched. */
export declare function snap(value: number, positions: number[], tolerance: number): number;
