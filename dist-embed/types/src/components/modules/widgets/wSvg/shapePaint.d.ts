import { type PaintBox } from '../../../../utils/svgPaint';
/** Where in a shape its colours land. Gathered once, when the markup is parsed. */
export type ShapePaint = {
    svg: SVGSVGElement;
    /** The shape's own coordinates, which is the box a gradient runs across. */
    viewBox: PaintBox;
    /** Every attribute holding a `{{colors[n]}}` placeholder, and the n it wants. */
    colorAttributes: {
        element: Element;
        attribute: string;
        index: number;
    }[];
};
export declare function collectShapePaint(svg: SVGSVGElement): ShapePaint;
/**
 * Paints a shape's colours over its placeholders.
 *
 * A colour can be a gradient, which an SVG attribute cannot hold directly, so
 * `resolveSvgPaint` puts a paint server in the shape's `<defs>` and hands back
 * a reference to it. The ids are the widget's, so two copies of the same shape
 * do not share a gradient.
 */
export declare function paintShape(paint: ShapePaint, uuid: string, colors: string[]): void;
