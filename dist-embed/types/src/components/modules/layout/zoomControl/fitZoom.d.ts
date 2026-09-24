/**
 * How far the wheel and the pinch may go, in percent. The buttons stop at the
 * ends of the two preset lists; a continuous gesture has no list to stop at, so
 * it stops here. The floor is under the smallest preset because wheeling out to
 * see a whole poster at once is the reason to wheel out.
 */
export declare const MIN_ZOOM = 10;
export declare const MAX_ZOOM = 500;
export type TFitInput = {
    screen: {
        width: number;
        height: number;
    };
    page: {
        width: number;
        height: number;
    };
    /** Space kept clear round the page, on each side. */
    padding: number;
    /** Height taken by the page strip and the notes under the board. */
    bottom: number;
};
/**
 * The zoom at which the whole page fits the board.
 *
 * Never below the zoom's own floor. The board is measured, and a board that is
 * not on screen — the editor mounted in a tab the host has not shown yet, or in
 * a panel that is collapsed — measures 0 across, which made the fit negative:
 * the page was drawn at minus a few hundred percent and the selection box
 * came out mirrored. A fit that cannot be worked out is the smallest zoom, and
 * the next measurement with the board on screen puts it right.
 */
export declare function fitZoom({ screen, page, padding, bottom }: TFitInput): number;
