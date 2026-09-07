/**
 * How round the corners of a drawn box are.
 *
 * One number when every corner is the same, which is the usual case and all a
 * design saved before this existed could hold — so `radii` is absent rather
 * than four copies of `radius`, and every reader has to treat absent and "four
 * of the same" as the same thing. `readCorners` does, and it is the only way
 * the canvas, the export, the panel and the corner grips read a box: four
 * numbers, already clamped to what will actually fit.
 *
 * The order is CSS's — top-left, top-right, bottom-right, bottom-left, clockwise
 * from the top-left — so `cornersCss` is a join and never a re-order.
 */
export type TCorners = [number, number, number, number];
/** Which corner of the box each slot describes, and where it sits on it. */
export declare const CORNERS: readonly [{
    readonly key: "tl";
    readonly label: "Top left";
    readonly short: "TL";
    readonly right: false;
    readonly bottom: false;
}, {
    readonly key: "tr";
    readonly label: "Top right";
    readonly short: "TR";
    readonly right: true;
    readonly bottom: false;
}, {
    readonly key: "br";
    readonly label: "Bottom right";
    readonly short: "BR";
    readonly right: true;
    readonly bottom: true;
}, {
    readonly key: "bl";
    readonly label: "Bottom left";
    readonly short: "BL";
    readonly right: false;
    readonly bottom: true;
}];
/**
 * The largest radius a corner may take: half the shorter side, at which point
 * the box is a stadium. Past it the browser scales every corner down to fit,
 * which reads on screen as the radius quietly refusing to change.
 */
export declare function maxRadius(width: unknown, height: unknown): number;
/** The four corners a box actually draws, whichever way it holds them. */
export declare function readCorners(params: Record<string, any> | null | undefined): TCorners;
/** True while the corners are held apart, and each grip moves only its own. */
export declare function isUnlinked(params: Record<string, any> | null | undefined): boolean;
export declare function cornersCss(corners: TCorners): string;
