/**
 * How many design pixels make an inch of paper, and the conversion to points.
 *
 * Its own module because it is the one thing the PDF export knows that other,
 * non-browser code needs. `exportPdf.ts` reaches for a canvas and the browser's
 * download the moment it is loaded, so anything importing it — the page-size
 * table, the contrast rules, and through those the compose entry — dragged the
 * whole browser export along behind a single number.
 */
export declare const DESIGN_DPI = 150;
/** Design pixels to PDF points, via the paper size the design implies. */
export declare function pxToPdfPoints(px: number): number;
