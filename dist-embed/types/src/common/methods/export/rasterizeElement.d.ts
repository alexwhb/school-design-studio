/** Properties whose presence means html2canvas will get the element wrong. */
export declare function needsRasterizing(el: Element): boolean;
/** True when this element, or anything inside it, needs the treatment. */
export declare function subtreeNeedsRasterizing(el: Element): boolean;
/**
 * How far outside its own box the subtree paints, in CSS pixels.
 *
 * Everything else this file handles stays inside the element — an outline, a
 * gradient fill, a mask. A drop shadow does not: it is offset and blurred, so
 * rasterising the element's box alone would slice the shadow off along the
 * edges. The caller pads the picture by this much and shifts it back by the
 * same amount, which leaves the artwork where it was and the shadow whole.
 *
 * A blur radius is twice the Gaussian's standard deviation and the tail is
 * spent by three of them, hence the 1.5. Rounded up, since a pixel of slack
 * costs a pixel of texture and a pixel short is a visible straight edge.
 */
export declare function rasterBleed(root: Element): number;
/**
 * Renders `el` to a PNG data URL, or null if it could not be done faithfully.
 *
 * `scale` is the export's own pixel ratio: the SVG is given an intrinsic size
 * that large so the bitmap html2canvas copies is already at final resolution,
 * rather than a CSS-sized one it would have to blow up.
 *
 * `bleed` widens the picture by that many CSS pixels on every side, for artwork
 * that paints outside its own box — see `rasterBleed`. The caller has to place
 * the result that much up and left of where the element was.
 */
export declare function rasterizeElement(el: HTMLElement, scale: number, bleed?: number): Promise<string | null>;
