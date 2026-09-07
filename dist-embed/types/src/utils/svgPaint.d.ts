export type PaintBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** The area a gradient is laid across, in the shape's own coordinates. */
export declare function viewBoxOf(svg: SVGSVGElement): PaintBox;
/**
 * A gradient worked out but not yet built, so a caller can build it as DOM or
 * as React elements from the same numbers.
 *
 * `coords` are the attributes the element of that type takes — `x1`/`y1`/`x2`/
 * `y2` for a linear, `cx`/`cy`/`r` for a radial — already in the shape's own
 * coordinates, which is what `gradientUnits="userSpaceOnUse"` asks for.
 */
export type SvgGradientSpec = {
    element: 'linearGradient' | 'radialGradient';
    coords: Record<string, number>;
    stops: {
        offset: string;
        color: string;
        opacity: number;
    }[];
};
/** Null when the value is a flat colour, which needs no paint server at all. */
export declare function svgGradientSpec(value: string, box: PaintBox): SvgGradientSpec | null;
/**
 * Gives an SVG attribute something it can hold.
 *
 * A flat colour goes straight through, because `fill="#ff0000ff"` is already
 * valid. A CSS gradient is not. SVG paints with a gradient by referring to a
 * paint server, so the gradient is built under the shape's own `<defs>` with
 * the id given, and what comes back is `url(#id)`.
 *
 * The paint server is measured in the shape's coordinates rather than each
 * element's bounding box, so a gradient runs across the whole shape the way it
 * does in the picker, instead of starting again on every path.
 */
export declare function resolveSvgPaint(svg: SVGSVGElement, id: string, value: string, box: PaintBox): string;
/**
 * The paint server on its own, for a caller that keeps its own `<defs>`.
 *
 * `applySvgBorder` builds and throws away a `<defs>` of clip paths on every
 * pass, and the border's gradient belongs in it: put there, it is cleaned up
 * with the rest rather than left behind when the border goes.
 *
 * Returns null when the value is a flat colour, which needs no paint server.
 */
export declare function createGradientNode(id: string, value: string, box: PaintBox): Element | null;
