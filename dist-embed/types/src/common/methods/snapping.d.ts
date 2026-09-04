/**
 * The positions worth snapping to, in page coordinates.
 *
 * Moveable works out object-to-object alignment itself, from the elements it is
 * handed, and it is what draws the guides you see while dragging. Two things
 * still need the list in page coordinates: the rulers, so a guide you drag
 * lands on an object's edge rather than a pixel beside it, and the tidy-up
 * after a drag — Moveable rounds its guides to a tenth of a *screen* pixel, so
 * at 25% zoom "snapped" can still leave two edges a couple of page pixels
 * apart, which shows the moment you zoom in.
 */
import type { TGuidelinesData, TPageState, TdWidgetData } from '../../store/types';
export type TSnapPositions = {
    /** Vertical lines: left, centre and right of everything on the page */
    x: number[];
    /** Horizontal lines: top, middle and bottom of everything on the page */
    y: number[];
};
export type TSnapBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};
type TSnapOptions = {
    /** Layer to leave out — nothing aligns to itself */
    exclude?: string;
    /** Ruler guides, in page coordinates */
    guides?: TGuidelinesData;
    /** Grid spacing in page pixels, when the grid is on. 0 or absent means no grid. */
    grid?: number;
};
/**
 * Edges and centres of the page, of every top-level layer on it, and of any
 * ruler guides.
 *
 * Rotation is ignored: the box used is the un-rotated one that `left`, `top`,
 * `width` and `height` describe. Callers that care about rotated objects should
 * leave them alone — Moveable handles those against their real bounds.
 */
export default function getSnapPositions(widgets: TdWidgetData[], page: TPageState, { exclude, guides, grid }?: TSnapOptions): TSnapPositions;
/**
 * Closes the sub-pixel gap Moveable's rounding leaves behind.
 *
 * `tolerance` must stay well under Moveable's own snap threshold: taking the
 * smallest correction available means an edge that is already sitting on a
 * guide wins, so this tidies up the snap that happened rather than inventing a
 * different one.
 */
export declare function snapBox(box: TSnapBox, positions: TSnapPositions, tolerance: number): {
    left: number;
    top: number;
};
export {};
