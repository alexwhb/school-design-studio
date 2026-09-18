/**
 * Keeps the point under the pointer under the pointer while the zoom changes.
 *
 * The board is laid out, not transformed as a whole: `.out-page` grows with the
 * zoom, `#page-design` re-centres it, `autoFixTop` rewrites the top padding,
 * and the artwork itself is scaled about an origin that flips between `left`
 * and `center` at 100%. Deriving the new scroll offset from all of that is a
 * pile of arithmetic that goes wrong the moment any of it changes, so instead
 * we record where the pointer sits in design coordinates before the zoom and
 * measure the board again afterwards to put it back.
 *
 * "Afterwards" has to be after React has committed the new sizes and before the
 * browser paints, or the board visibly jumps for a frame: `apply` is called
 * from a layout effect in ZoomControl.
 */
/** Records the design point currently under (clientX, clientY). */
export declare function capture(clientX: number, clientY: number): void;
/** Anchors on the middle of the board — what a keyboard or button zoom wants. */
export declare function captureCentre(): void;
/** Scrolls the recorded design point back under the pointer. A no-op if nothing is pending. */
export declare function apply(): void;
export declare function clear(): void;
